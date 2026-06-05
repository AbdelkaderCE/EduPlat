import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export async function applyWatermark(
  pdfBytes: Buffer,
  username: string,
  serialNumber: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  const watermarkText = `${username}  •  ${serialNumber}`;
  const fontSize = 42;
  const opacity = 0.12;

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
      opacity,
      rotate: degrees(45),
    });

    const footerFontSize = 10;
    const footerText = `Downloaded by: ${username} | Serial: ${serialNumber}`;
    const footerWidth = font.widthOfTextAtSize(footerText, footerFontSize);
    page.drawText(footerText, {
      x: width / 2 - footerWidth / 2,
      y: 18,
      size: footerFontSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
      opacity: 0.6,
    });
  }

  // Document metadata — serial number is embedded so it's traceable
  // even if the visible watermark is cropped or edited out.
  const now = new Date().toISOString();
  doc.setTitle(`[${serialNumber}] Protected Document`);
  doc.setAuthor(`${username}`);
  doc.setSubject(`Serial: ${serialNumber} | Issued to: ${username} | ${now}`);
  doc.setKeywords([serialNumber, username, "watermarked", "protected"]);
  doc.setCreator("ScholarStream Watermarking System");
  doc.setProducer(`Serial: ${serialNumber}`);
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  return doc.save();
}

export function generateSerialNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `SN-2026-${random}`;
}
