import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { eq } from "drizzle-orm";
import { db, wmUsersTable, wmPdfsTable, wmDownloadHistoryTable } from "@workspace/db";

const UPLOAD_DIR = "/home/runner/workspace/data/pdfs";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

function requireAdmin(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction): void {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  db.select()
    .from(wmUsersTable)
    .where(eq(wmUsersTable.id, userId))
    .limit(1)
    .then(([user]) => {
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      next();
    })
    .catch((err) => next(err));
}

const router: IRouter = Router();

router.post(
  "/admin/pdfs",
  requireAdmin,
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const [pdf] = await db
      .insert(wmPdfsTable)
      .values({
        filename: req.file.originalname,
        originalPath: path.join(UPLOAD_DIR, req.file.filename),
      })
      .returning();

    res.status(201).json({
      id: pdf.id,
      filename: pdf.filename,
      uploadedAt: pdf.uploadedAt.toISOString(),
    });
  },
);

router.get("/admin/search", requireAdmin, async (req, res): Promise<void> => {
  const sn = Array.isArray(req.query.sn) ? req.query.sn[0] : req.query.sn;

  if (!sn || typeof sn !== "string") {
    res.status(400).json({ error: "Serial number is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(wmUsersTable)
    .where(eq(wmUsersTable.serialNumber, sn))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "No user found with that serial number" });
    return;
  }

  const history = await db
    .select({
      id: wmDownloadHistoryTable.id,
      pdfId: wmDownloadHistoryTable.pdfId,
      filename: wmPdfsTable.filename,
      downloadedAt: wmDownloadHistoryTable.downloadedAt,
    })
    .from(wmDownloadHistoryTable)
    .innerJoin(wmPdfsTable, eq(wmDownloadHistoryTable.pdfId, wmPdfsTable.id))
    .where(eq(wmDownloadHistoryTable.userId, user.id))
    .orderBy(wmDownloadHistoryTable.downloadedAt);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      serialNumber: user.serialNumber ?? null,
    },
    downloads: history.map((h) => ({
      id: h.id,
      pdfId: h.pdfId,
      filename: h.filename,
      downloadedAt: h.downloadedAt.toISOString(),
    })),
  });
});

export default router;
