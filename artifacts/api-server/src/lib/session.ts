import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const PgStore = ConnectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: "wm_sessions",
  }),
  secret: process.env.SESSION_SECRET ?? "fallback-dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  },
});
