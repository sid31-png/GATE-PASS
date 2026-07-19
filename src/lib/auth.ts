import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";

// --- Password hashing (scrypt, no external deps) -------------------------
// Stored format: "<saltHex>:<hashHex>"

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

// --- Session token (HMAC-signed, no session store/library) ---------------
// Token format: "<base64url(payloadJson)>.<hex hmac>"
// payload = { id, exp, ...RoleSubject flags }. The role flags are embedded
// (not just the id) so Proxy (src/proxy.ts) can make redirect decisions
// without a database round-trip on every navigation. They are a snapshot
// taken at login time — a role change takes effect on the user's next
// login, which is an acceptable trade-off for this internal CRM. API routes
// that need the authoritative, live role should still look the row up via
// src/lib/session.ts's getSessionEmployee() instead of trusting the token.

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add it to your .env file.");
  }
  return secret;
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export type SessionRoleFlags = {
  isCEO: boolean;
  isManager: boolean;
  isOpsAdmin: boolean;
  isOnline: boolean;
  isField: boolean;
  isAM: boolean;
  isAMLead: boolean;
};

export type SessionPayload = SessionRoleFlags & { id: number; exp: number };

export function createSessionToken(employeeId: number, roleFlags: SessionRoleFlags): string {
  const payload: SessionPayload = { id: employeeId, exp: Date.now() + SESSION_TTL_MS, ...roleFlags };
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest("hex");
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest("hex");
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.id !== "number" || typeof payload.exp !== "number") return null;
  if (Date.now() > payload.exp) return null;
  return payload;
}

export const SESSION_COOKIE_NAME = "rch_session";
export const SESSION_COOKIE_MAX_AGE_S = SESSION_TTL_MS / 1000;
