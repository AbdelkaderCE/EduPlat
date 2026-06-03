import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { db, wmUsersTable, wmPdfsTable, wmDownloadHistoryTable } from "@workspace/db";
import { applyWatermark, generateSerialNumber } from "../lib/watermark";

const router: IRouter = Router();

router.get("/pdfs", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const pdfs = await db
    .select({
      id: wmPdfsTable.id,
      filename: wmPdfsTable.filename,
      uploadedAt: wmPdfsTable.uploadedAt,
    })
    .from(wmPdfsTable)
    .orderBy(wmPdfsTable.uploadedAt);

  res.json(
    pdfs.map((p) => ({
      ...p,
      uploadedAt: p.uploadedAt.toISOString(),
    })),
  );
});

router.get("/pdfs/:id/download", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const pdfId = parseInt(rawId, 10);
  if (isNaN(pdfId)) {
    res.status(400).json({ error: "Invalid PDF id" });
    return;
  }

  const [pdf] = await db
    .select()
    .from(wmPdfsTable)
    .where(eq(wmPdfsTable.id, pdfId))
    .limit(1);

  if (!pdf) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

  let [user] = await db
    .select()
    .from(wmUsersTable)
    .where(eq(wmUsersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (!user.serialNumber) {
    let sn = generateSerialNumber();
    let attempts = 0;
    while (attempts < 10) {
      try {
        const [updated] = await db
          .update(wmUsersTable)
          .set({ serialNumber: sn })
          .where(eq(wmUsersTable.id, userId))
          .returning();
        user = updated;
        break;
      } catch {
        sn = generateSerialNumber();
        attempts++;
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

  const watermarked = await applyWatermark(
    pdfBytes,
    user.username,
    user.serialNumber!,
  );

  await db.insert(wmDownloadHistoryTable).values({
    userId,
    pdfId,
  });

  const safeFilename = pdf.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeFilename}"`,
  );
  res.send(Buffer.from(watermarked));
});

export default router;
