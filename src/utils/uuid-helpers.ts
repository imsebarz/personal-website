/**
 * UUID generation utilities optimized for Vercel serverless environment
 * Uses native Node.js crypto when available, with fallbacks for maximum compatibility
 */

import { randomBytes } from 'crypto';

/**
 * Generates a UUID v4 using native Node.js crypto
 * Fallback to Math.random() if crypto is not available
 */
export function generateUUID(): string {
  try {
    // First try globalThis.crypto.randomUUID() (modern browsers and Node 19+)
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    // Fallback to Node.js crypto.randomBytes() (Node 14+)
    if (randomBytes) {
      const bytes = randomBytes(16);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

      const hex = bytes.toString('hex');
      return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32)
      ].join('-');
    }

    // Final fallback to Math.random()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  } catch (_error) {
    // Ultra-safe fallback
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

/**
 * Generates a simple ID using timestamp and random string
 * More lightweight alternative for temporary IDs
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
