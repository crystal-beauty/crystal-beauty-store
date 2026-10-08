import crypto from "node:crypto";

// Standalone password hashing (usable in scripts without Next.js runtime)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordStandalone(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const hashBuf = Buffer.from(hash, "hex");
    const testBuf = crypto.scryptSync(password, salt, hashBuf.length);
    return crypto.timingSafeEqual(hashBuf, testBuf);
  } catch {
    return false;
  }
}
