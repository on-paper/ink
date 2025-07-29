import { type SessionOptions } from "iron-session";

export interface SessionData {
  nonce?: string;
  siwe?: {
    address: string;
    chainId: number;
    domain: string;
    uri: string;
    issued: string;
    expirationTime: string;
    statement?: string;
  };
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "siwe-session",
  ttl: 60 * 60 * 24, // 24 hours
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 - 60, // 24 hours - 60 seconds
    path: "/",
  },
};

export const defaultSession: SessionData = {};
