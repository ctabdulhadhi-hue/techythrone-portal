import crypto from 'crypto';

/**
 * Platform default flag format validator: THR{...}
 * Allows alphanumeric and standard ASCII printable symbols inside brackets.
 */
export const FLAG_FORMAT_REGEX = /^THR\{[A-Za-z0-9_\-!@#$%^&*+=?.:;~|]{1,100}\}$/;

/**
 * Retrieves the server-only secret used for keyed HMAC-SHA-256 flag digests.
 */
export function getFlagSecret(): string {
  const secret = process.env.FLAG_SALT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_SECURITY_ERROR: FLAG_SALT_SECRET is not configured in production.');
    }
    // Safe development fallback
    return 'techythrone_ctf_dev_salt_secret_do_not_use_in_prod';
  }
  return secret;
}

/**
 * Validates whether a submitted flag matches the expected platform format.
 */
export function validateFlagFormat(flag: string): boolean {
  if (!flag || typeof flag !== 'string') return false;
  return FLAG_FORMAT_REGEX.test(flag.trim());
}

/**
 * Computes a keyed HMAC-SHA-256 digest of the normalized flag string.
 * This digest is safe to store in PostgreSQL. Plaintext flags are NEVER stored.
 */
export function computeFlagHash(flag: string): string {
  const normalized = flag.trim();
  const secret = getFlagSecret();
  return crypto.createHmac('sha256', secret).update(normalized).digest('hex');
}

/**
 * Verifies a submitted flag against an authoritative stored digest using
 * constant-time comparison to prevent timing side-channel attacks.
 */
export function verifyFlag(submittedFlag: string, storedDigest: string): boolean {
  if (!submittedFlag || !storedDigest) return false;
  try {
    const computedDigest = computeFlagHash(submittedFlag);
    const computedBuffer = Buffer.from(computedDigest, 'hex');
    const storedBuffer = Buffer.from(storedDigest, 'hex');

    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates a safe masked preview for submission auditing (e.g., THR{s***4})
 * Never stores or exposes the full plaintext solution.
 */
export function maskFlagForAudit(flag: string): string {
  const trimmed = flag.trim();
  if (trimmed.length <= 6) return 'THR{***}';
  const inner = trimmed.slice(4, -1);
  if (inner.length < 4) return 'THR{***}';
  return `THR{${inner[0]}***${inner[inner.length - 1]}}`;
}
