import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGO = 'aes-256-gcm';

/** 归一化密钥为 32 字节 */
function normalizeKey(raw: string): Buffer {
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  const buf = Buffer.from(raw, 'utf8');
  if (buf.length === 32) return buf;
  return createHash('sha256').update(raw).digest();
}

/**
 * 对称加密（用于存储 GitHub access token）。
 * 输出格式: iv(12) + authTag(16) + ciphertext，base64 编码。
 */
export function encryptSecret(plain: string, rawKey: string): string {
  const key = normalizeKey(rawKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

/** 解密 encryptSecret 的输出，失败时返回 null 而不是抛错 */
export function decryptSecret(payload: string, rawKey: string): string | null {
  try {
    const key = normalizeKey(rawKey);
    const raw = Buffer.from(payload, 'base64');
    if (raw.length <= 28) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** 不可逆摘要（refresh token 落库、OAuth state 比对） */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** 常量时间字符串比较，避免时序攻击 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
