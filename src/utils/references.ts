export type ReferencePrefix = 'QTE' | 'BKG' | 'SWV' | 'PKP' | 'PAY' | 'ADJ';

// Unambiguous uppercase alphanumeric alphabet (excludes 0/O, 1/I/L for customer readability)
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function twoDigitYear(now: Date = new Date()): string {
  return String(now.getUTCFullYear()).slice(-2);
}

function randomSegment(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
    out += CODE_ALPHABET[idx];
  }
  return out;
}

export function generateUniqueReference(
  prefix: ReferencePrefix,
  existingCodes?: Iterable<string>,
  now: Date = new Date()
): string {
  const existing = existingCodes instanceof Set ? existingCodes : new Set(existingCodes || []);
  const yy = twoDigitYear(now);

  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = `${prefix}-${yy}-${randomSegment(6)}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
  }

  // Fallback with timestamp suffix in extreme collision scenario
  const fallbackSuffix = `${Date.now().toString(36).toUpperCase().slice(-4)}${randomSegment(2)}`;
  return `${prefix}-${yy}-${fallbackSuffix}`;
}

export const generateQuoteReference = (existing?: Iterable<string>, now?: Date) =>
  generateUniqueReference('QTE', existing, now);

export const generateBookingGroupReference = (existing?: Iterable<string>, now?: Date) =>
  generateUniqueReference('BKG', existing, now);

export const generateShipmentReference = (existing?: Iterable<string>, now?: Date) =>
  generateUniqueReference('SWV', existing, now);

export const generatePickupReference = (existing?: Iterable<string>, now?: Date) =>
  generateUniqueReference('PKP', existing, now);

export const generatePaymentReference = (existing?: Iterable<string>, now?: Date) =>
  generateUniqueReference('PAY', existing, now);

export const generateAdjustmentReference = (existing?: Iterable<string>, now?: Date) =>
  generateUniqueReference('ADJ', existing, now);

export function isValidReferenceFormat(code: string, prefix?: ReferencePrefix): boolean {
  const trimmed = code.trim().toUpperCase();
  if (prefix) {
    if (prefix === 'SWV') {
      // Allow both new SWV-YY-XXXXXX and legacy seeded SWV-2026-NGXXXX codes
      return /^SWV-(?:\d{2}-[A-Z0-9]{6}|2026-[A-Z0-9]{4,8})$/.test(trimmed);
    }
    const re = new RegExp(`^${prefix}-\\d{2}-[A-Z0-9]{6}$`);
    return re.test(trimmed);
  }
  return /^(?:QTE|BKG|SWV|PKP|PAY|ADJ)-\d{2}-[A-Z0-9]{6}$/.test(trimmed) || /^SWV-2026-[A-Z0-9]{4,8}$/.test(trimmed);
}
