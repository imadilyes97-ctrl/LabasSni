import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
  sub: string;
  clientId: string;
  iat: number;
  exp: number;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(clientId: string): string {
  return jwt.sign({ sub: clientId, clientId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getClientIdFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = verifyToken(token);
  return payload?.clientId || null;
}

export function requireAuth(request: NextRequest): { clientId: string } {
  const clientId = getClientIdFromRequest(request);
  if (!clientId) {
    throw new Error("Non authentifié");
  }
  return { clientId };
}
