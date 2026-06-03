import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const wmUsersTable = pgTable("wm_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  serialNumber: text("serial_number").unique(),
});

export const wmPdfsTable = pgTable("wm_pdfs", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalPath: text("original_path").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const wmDownloadHistoryTable = pgTable("wm_download_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => wmUsersTable.id),
  pdfId: integer("pdf_id")
    .notNull()
    .references(() => wmPdfsTable.id),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
});

export type WmUser = typeof wmUsersTable.$inferSelect;
export type WmPdf = typeof wmPdfsTable.$inferSelect;
export type WmDownloadHistory = typeof wmDownloadHistoryTable.$inferSelect;
