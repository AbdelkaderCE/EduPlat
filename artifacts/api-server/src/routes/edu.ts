import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";
import multer from "multer";
import bcryptjs from "bcryptjs";
import { db, wmUsersTable, wmPdfsTable, wmDownloadHistoryTable } from "@workspace/db";
import { applyWatermark, generateSerialNumber } from "../lib/watermark";

const SUPABASE_URL = "https://cyvftbyjwgludmpnlcop.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dmZ0Ynlqd2dsdWRtcG5sY29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODIwMzgsImV4cCI6MjA5NTU1ODAzOH0.EjtNIxsJHrJ_Zc4FUcaxb6tgz_yVnE_9NEp6k5gKhNU";

const UPLOAD_DIR = "/home/runner/workspace/data/pdfs";

async function verifySupabaseToken(
  token: string,
): Promise<{ id: string; email: string } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) return null;
    const user = await res.json() as { id: string; email: string };
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

async function isEduAdmin(userId: string): Promise<boolean> {
  try {
    const result = await db.execute(
      sql`SELECT role FROM profiles WHERE user_id = ${userId} LIMIT 1`,
    );
    const rows = result.rows as Array<{ role: string }>;
    return rows.length > 0 && rows[0].role === "admin";
  } catch {
    return false;
  }
}

const eduStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const eduUpload = multer({
  storage: eduStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.post("/edu/download", async (req, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const supaUser = await verifySupabaseToken(token);
  if (!supaUser) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const { lessonId, fileName } = req.body as { lessonId?: string; fileName?: string };
  if (!lessonId) {
    res.status(400).json({ error: "lessonId is required" });
    return;
  }

  const [pdf] = await db
    .select()
    .from(wmPdfsTable)
    .where(eq(wmPdfsTable.lessonId, lessonId))
    .limit(1);

  if (!pdf) {
    res.status(404).json({ error: "No PDF attached to this lesson yet" });
    return;
  }

  const username = supaUser.email;
  let [user] = await db
    .select()
    .from(wmUsersTable)
    .where(eq(wmUsersTable.username, username))
    .limit(1);

  if (!user) {
    const hash = await bcryptjs.hash(crypto.randomUUID(), 8);
    [user] = await db
      .insert(wmUsersTable)
      .values({ username, passwordHash: hash, role: "user" })
      .returning();
  }

  if (!user.serialNumber) {
    let sn = generateSerialNumber();
    for (let i = 0; i < 10; i++) {
      try {
        const [updated] = await db
          .update(wmUsersTable)
          .set({ serialNumber: sn })
          .where(eq(wmUsersTable.id, user.id))
          .returning();
        user = updated;
        break;
      } catch {
        sn = generateSerialNumber();
      }
    }
  }

  let pdfBytes: Buffer;
  try {
    pdfBytes = await readFile(pdf.originalPath);
  } catch {
    res.status(500).json({ error: "PDF file not found on server" });
    return;
  }

  const watermarked = await applyWatermark(pdfBytes, username, user.serialNumber!);

  await db.insert(wmDownloadHistoryTable).values({ userId: user.id, pdfId: pdf.id });

  const safeFilename = (fileName || pdf.filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
  res.send(Buffer.from(watermarked));
});

router.get("/edu/admin/pdfs", async (req, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const supaUser = await verifySupabaseToken(token);
  if (!supaUser || !(await isEduAdmin(supaUser.id))) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const pdfs = await db
    .select()
    .from(wmPdfsTable)
    .orderBy(desc(wmPdfsTable.uploadedAt));

  res.json(
    pdfs.map((p) => ({
      id: p.id,
      filename: p.filename,
      lessonId: p.lessonId ?? null,
      uploadedAt: p.uploadedAt.toISOString(),
    })),
  );
});

router.post("/edu/admin/pdfs", async (req, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const supaUser = await verifySupabaseToken(token);
  if (!supaUser || !(await isEduAdmin(supaUser.id))) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  eduUpload.single("file")(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const lessonId = (req.body as { lessonId?: string }).lessonId || null;

    const [pdf] = await db
      .insert(wmPdfsTable)
      .values({
        filename: req.file.originalname,
        originalPath: path.join(UPLOAD_DIR, req.file.filename),
        lessonId,
      })
      .returning();

    res.status(201).json({
      id: pdf.id,
      filename: pdf.filename,
      lessonId: pdf.lessonId ?? null,
      uploadedAt: pdf.uploadedAt.toISOString(),
    });
  });
});

router.get("/edu/admin/history", async (req, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const supaUser = await verifySupabaseToken(token);
  if (!supaUser || !(await isEduAdmin(supaUser.id))) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const history = await db
    .select({
      id: wmDownloadHistoryTable.id,
      username: wmUsersTable.username,
      serialNumber: wmUsersTable.serialNumber,
      filename: wmPdfsTable.filename,
      lessonId: wmPdfsTable.lessonId,
      downloadedAt: wmDownloadHistoryTable.downloadedAt,
    })
    .from(wmDownloadHistoryTable)
    .innerJoin(wmUsersTable, eq(wmDownloadHistoryTable.userId, wmUsersTable.id))
    .innerJoin(wmPdfsTable, eq(wmDownloadHistoryTable.pdfId, wmPdfsTable.id))
    .orderBy(desc(wmDownloadHistoryTable.downloadedAt))
    .limit(200);

  res.json(
    history.map((h) => ({
      id: h.id,
      username: h.username,
      serialNumber: h.serialNumber ?? null,
      filename: h.filename,
      lessonId: h.lessonId ?? null,
      downloadedAt: h.downloadedAt.toISOString(),
    })),
  );
});

router.get("/edu/admin/search", async (req, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const supaUser = await verifySupabaseToken(token);
  if (!supaUser || !(await isEduAdmin(supaUser.id))) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const sn = (req.query.sn as string | undefined)?.trim();
  if (!sn) {
    res.status(400).json({ error: "sn query parameter is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(wmUsersTable)
    .where(eq(wmUsersTable.serialNumber, sn))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "No student found with that serial number" });
    return;
  }

  const downloads = await db
    .select({
      id: wmDownloadHistoryTable.id,
      filename: wmPdfsTable.filename,
      lessonId: wmPdfsTable.lessonId,
      downloadedAt: wmDownloadHistoryTable.downloadedAt,
    })
    .from(wmDownloadHistoryTable)
    .innerJoin(wmPdfsTable, eq(wmDownloadHistoryTable.pdfId, wmPdfsTable.id))
    .where(eq(wmDownloadHistoryTable.userId, user.id))
    .orderBy(desc(wmDownloadHistoryTable.downloadedAt));

  res.json({
    student: {
      username: user.username,
      serialNumber: user.serialNumber,
    },
    downloads: downloads.map((d) => ({
      id: d.id,
      filename: d.filename,
      lessonId: d.lessonId ?? null,
      downloadedAt: d.downloadedAt.toISOString(),
    })),
  });
});

export default router;
