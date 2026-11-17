import {
  OtpChallengeRecord,
  OtpDeliveryLog,
  QuoteRecord,
  ShipmentRecord,
} from '../types';
import { maskContactInfo } from './quote-lifecycle';

export type ReferencePrefix = 'QTE' | 'BKG' | 'SWV' | 'PKP' | 'ADJ' | 'RCT' | 'CRD';

/**
 * Generates an authoritative, collision-checked 6-digit reference code in the form:
 *   QTE-YY-XXXXXX  (Saved Quotes / Manual Quote Enquiries only)
 *   BKG-YY-XXXXXX  (Multi-destination Booking Group parent ID)
 *   SWV-YY-XXXXXX  (Individual Confirmed Shipment ID - immutable once issued)
 *   PKP-YY-XXXXXX  (Pickup dispatch job ID)
 *   ADJ-YY-XXXXXX  (Weight verification Payment Adjustment ID)
 *   RCT-YY-XXXXXX  (Payment Receipt ID)
 *
 * Supports idempotencyKey caching so network/UI retries return the identical code
 * instead of minting duplicate records.
 */
export function generateUniqueReference(params: {
  prefix: ReferencePrefix;
  existingCodes: Set<string>;
  idempotencyKey?: string;
  idempotencyCache?: Map<string, string>;
  yearTwoDigits?: string;
}): string {
  const {
    prefix,
    existingCodes,
    idempotencyKey,
    idempotencyCache,
    yearTwoDigits = new Date().getFullYear().toString().slice(-2),
  } = params;

  if (idempotencyKey && idempotencyCache?.has(idempotencyKey)) {
    return idempotencyCache.get(idempotencyKey)!;
  }

  let candidate = '';
  for (let attempt = 0; attempt < 100; attempt++) {
    const num = Math.floor(100000 + Math.random() * 899999);
    candidate = `${prefix}-${yearTwoDigits}-${num}`;
    if (!existingCodes.has(candidate)) {
      existingCodes.add(candidate);
      if (idempotencyKey && idempotencyCache) {
        idempotencyCache.set(idempotencyKey, candidate);
      }
      return candidate;
    }
  }

  // Fallback with high-entropy timestamp tail if 100 collisions occur
  const fallbackTail = `${Date.now()}`.slice(-6);
  candidate = `${prefix}-${yearTwoDigits}-${fallbackTail}`;
  existingCodes.add(candidate);
  if (idempotencyKey && idempotencyCache) {
    idempotencyCache.set(idempotencyKey, candidate);
  }
  return candidate;
}

export function isValidQuoteRef(code: string): boolean {
  return /^QTE-\d{2}-\d{6}$/i.test(code.trim());
}

export function isValidBookingGroupRef(code: string): boolean {
  const clean = code.trim().toUpperCase();
  return /^BKG-\d{2}-\d{6}$/.test(clean) || /^BG-\d{4}-\d{4}$/.test(clean);
}

export function isValidShipmentRef(code: string): boolean {
  const clean = code.trim().toUpperCase();
  return /^SWV-\d{2}-\d{6}$/.test(clean) || /^SWV-\d{4}-NG\d{4}$/.test(clean);
}

export interface CreateOtpParams {
  contactValue: string;
  channel: 'email' | 'sms' | 'whatsapp';
  targetRef?: string;
  purpose: OtpDeliveryLog['purpose'];
  existingChallenges: OtpChallengeRecord[];
  isProviderConfigured: boolean;
  isDemo: boolean;
  now?: Date;
}

export interface CreateOtpResult {
  allowed: boolean;
  cooldownRemainingSeconds: number;
  challenge?: OtpChallengeRecord;
  deliveryLog: OtpDeliveryLog;
  userMessage: string;
}

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const OTP_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes after max failed attempts
const OTP_MAX_ATTEMPTS = 5;

export function normalizeContact(val: string): string {
  const trimmed = val.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return trimmed.replace(/[\s\-()]/g, '');
}

export function createOtpChallenge(params: CreateOtpParams): CreateOtpResult {
  const now = params.now || new Date();
  const normalized = normalizeContact(params.contactValue);
  const masked =
    params.channel === 'email'
      ? maskContactInfo({ email: params.contactValue }).maskedEmail
      : maskContactInfo({ phone: params.contactValue }).maskedPhone;

  // Check active rate-limit / resend cooldown / lockout for same contact
  const recentForContact = params.existingChallenges
    .filter((c) => normalizeContact(c.contactValue) === normalized && !c.verifiedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (recentForContact?.lockedUntil && new Date(recentForContact.lockedUntil).getTime() > now.getTime()) {
    const mins = Math.ceil((new Date(recentForContact.lockedUntil).getTime() - now.getTime()) / 60000);
    return {
      allowed: false,
      cooldownRemainingSeconds: mins * 60,
      deliveryLog: {
        id: `otplog_${Date.now()}`,
        channel: params.channel,
        recipientMasked: masked,
        purpose: params.purpose,
        status: 'failed',
        providerName: params.isDemo ? 'Swiftvero Demo OTP Simulator' : 'Configured Gateway',
        errorDetail: `Blocked by temporary rate-limit lockout (${mins}m remaining).`,
        createdAt: now.toISOString(),
        isDemo: params.isDemo,
      },
      userMessage: `Too many failed attempts. Please wait ${mins} minute(s) before requesting another verification code.`,
    };
  }

  if (recentForContact && new Date(recentForContact.resendAvailableAt).getTime() > now.getTime()) {
    const waitSec = Math.max(
      1,
      Math.ceil((new Date(recentForContact.resendAvailableAt).getTime() - now.getTime()) / 1000)
    );
    return {
      allowed: false,
      cooldownRemainingSeconds: waitSec,
      deliveryLog: {
        id: `otplog_${Date.now()}`,
        channel: params.channel,
        recipientMasked: masked,
        purpose: params.purpose,
        status: 'failed',
        providerName: params.isDemo ? 'Swiftvero Demo OTP Simulator' : 'Configured Gateway',
        errorDetail: `Resend cooldown active (${waitSec}s remaining).`,
        createdAt: now.toISOString(),
        isDemo: params.isDemo,
      },
      userMessage: `Please wait ${waitSec}s before requesting another 6-digit OTP code.`,
    };
  }

  // Honest provider delivery status check — never claim sent when unconfigured in live mode
  const canDeliver = params.isDemo || params.isProviderConfigured;
  const deliveryStatus: OtpChallengeRecord['deliveryStatus'] = canDeliver
    ? 'sent'
    : 'provider_unconfigured';

  const providerName = params.isDemo
    ? `Swiftvero Demo ${params.channel.toUpperCase()} Simulator`
    : params.isProviderConfigured
    ? `Live ${params.channel.toUpperCase()} Gateway`
    : `Unconfigured ${params.channel.toUpperCase()} Provider`;

  const code = params.isDemo
    ? String(Math.floor(100000 + Math.random() * 899999))
    : String(Math.floor(100000 + Math.random() * 899999));

  const challenge: OtpChallengeRecord = {
    id: `otp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    contactValue: params.contactValue.trim(),
    channel: params.channel,
    targetRef: params.targetRef,
    code,
    expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS).toISOString(),
    resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS).toISOString(),
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    deliveryStatus,
    deliveryError: canDeliver
      ? undefined
      : `External ${params.channel.toUpperCase()} provider API key is not configured.`,
    createdAt: now.toISOString(),
    isDemo: params.isDemo,
  };

  const deliveryLog: OtpDeliveryLog = {
    id: `otplog_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    channel: params.channel,
    recipientMasked: masked,
    purpose: params.purpose,
    status: deliveryStatus,
    providerName,
    errorDetail: challenge.deliveryError,
    createdAt: now.toISOString(),
    isDemo: params.isDemo,
  };

  return {
    allowed: canDeliver,
    cooldownRemainingSeconds: 60,
    challenge,
    deliveryLog,
    userMessage: canDeliver
      ? params.isDemo
        ? `Demo Mode verification code generated for ${masked}. (Simulated OTP: ${code})`
        : `A 6-digit verification code has been dispatched via ${params.channel.toUpperCase()} to ${masked}.`
      : `Unable to send OTP via ${params.channel.toUpperCase()}: provider credentials are not configured.`,
  };
}

export interface VerifyOtpResult {
  verified: boolean;
  locked: boolean;
  expired: boolean;
  remainingAttempts: number;
  updatedChallenge: OtpChallengeRecord;
  message: string;
}

export function verifyOtpChallenge(params: {
  challenge: OtpChallengeRecord;
  inputCode: string;
  now?: Date;
}): VerifyOtpResult {
  const now = params.now || new Date();
  const c = params.challenge;

  if (c.lockedUntil && new Date(c.lockedUntil).getTime() > now.getTime()) {
    return {
      verified: false,
      locked: true,
      expired: false,
      remainingAttempts: 0,
      updatedChallenge: c,
      message: 'Verification temporarily locked due to too many incorrect attempts.',
    };
  }

  if (new Date(c.expiresAt).getTime() < now.getTime()) {
    return {
      verified: false,
      locked: false,
      expired: true,
      remainingAttempts: Math.max(0, c.maxAttempts - c.attempts),
      updatedChallenge: c,
      message: 'This verification code has expired (10-minute validity). Please request a new code.',
    };
  }

  if (params.inputCode.trim() === c.code.trim()) {
    const verifiedChallenge: OtpChallengeRecord = {
      ...c,
      verifiedAt: now.toISOString(),
    };
    return {
      verified: true,
      locked: false,
      expired: false,
      remainingAttempts: c.maxAttempts - c.attempts,
      updatedChallenge: verifiedChallenge,
      message: 'Contact verified successfully.',
    };
  }

  const nextAttempts = c.attempts + 1;
  const shouldLock = nextAttempts >= c.maxAttempts;
  const updatedChallenge: OtpChallengeRecord = {
    ...c,
    attempts: nextAttempts,
    lockedUntil: shouldLock ? new Date(now.getTime() + OTP_LOCKOUT_MS).toISOString() : undefined,
  };

  return {
    verified: false,
    locked: shouldLock,
    expired: false,
    remainingAttempts: Math.max(0, c.maxAttempts - nextAttempts),
    updatedChallenge,
    message: shouldLock
      ? 'Maximum verification attempts exceeded. Locked for 15 minutes.'
      : `Incorrect 6-digit verification code. ${c.maxAttempts - nextAttempts} attempt(s) remaining.`,
  };
}

/**
 * Privacy-preserving "Didn't receive your reference?" lookup:
 * NEVER reveals whether an email or phone number exists in the database before OTP verification.
 */
export function buildGenericRecoveryNotice(contactInput: string): string {
  const clean = contactInput.trim();
  const channel = clean.includes('@') ? 'email' : 'SMS';
  return `If an active quote or shipment matches "${clean}", a 6-digit recovery OTP has been dispatched via ${channel}. Never share this code with anyone.`;
}

export function findQuotesAndUnpaidShipmentsByContact(params: {
  contactValue: string;
  quotes: QuoteRecord[];
  shipments: ShipmentRecord[];
}): { quotes: QuoteRecord[]; shipments: ShipmentRecord[] } {
  const normalized = normalizeContact(params.contactValue);
  if (!normalized) return { quotes: [], shipments: [] };

  const matchedQuotes = params.quotes.filter((q) => {
    const qEmail = q.contactEmail ? normalizeContact(q.contactEmail) : '';
    const qPhone = q.contactPhone ? normalizeContact(q.contactPhone) : '';
    return qEmail === normalized || qPhone === normalized;
  });

  const matchedShipments = params.shipments.filter((s) => {
    if (s.paymentStatus === 'paid' && s.status !== 'quote_ready') return false;
    const sEmail = s.customerEmail ? normalizeContact(s.customerEmail) : '';
    const sPhone = s.customerPhone ? normalizeContact(s.customerPhone) : '';
    const senderPhone = s.senderPhone ? normalizeContact(s.senderPhone) : '';
    return sEmail === normalized || sPhone === normalized || senderPhone === normalized;
  });

  return { quotes: matchedQuotes, shipments: matchedShipments };
}
