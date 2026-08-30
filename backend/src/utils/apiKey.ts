import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure API key.
 * Format: sm_<64 hex chars> = 67 chars total
 */
export function generateApiKey(): string {
  const bytes = randomBytes(32);
  return `sm_${bytes.toString('hex')}`;
}
