import { PaymentAdjustmentRecord, QuoteBreakdown, QuoteVersion, ShipmentRecord } from '../types';

export interface QuoteApprovalCheck {
  allowed: boolean;
  reason?: string;
}

export function canApproveAndPayQuote(
  quoteVersion: QuoteVersion | undefined,
  shipmentPaymentStatus: ShipmentRecord['paymentStatus'],
  now: Date = new Date()
): QuoteApprovalCheck {
  if (shipmentPaymentStatus === 'paid') {
    return {
      allowed: false,
      reason: 'This shipment has already been paid. Duplicate payment is blocked.',
    };
  }

  if (!quoteVersion) {
    return {
      allowed: false,
      reason: 'No active quotation record found for this shipment.',
    };
  }

  if (quoteVersion.status === 'replaced') {
    return {
      allowed: false,
      reason: 'This quotation version was superseded by a newer facility measurement revision.',
    };
  }

  if (quoteVersion.status === 'paid') {
    return {
      allowed: false,
      reason: 'This quotation version has already been settled.',
    };
  }

  if (
    quoteVersion.status === 'expired' ||
    new Date(quoteVersion.quote.expiresAt).getTime() < now.getTime()
  ) {
    return {
      allowed: false,
      reason: 'This quotation has expired. Please request a refreshed quote from operations.',
    };
  }

  return { allowed: true };
}

export function createQuoteRevision(params: {
  currentVersions: QuoteVersion[];
  newQuote: QuoteBreakdown;
  measuredWeightKg: number;
  measuredDimensions?: { length: number; width: number; height: number };
  changedBy: string;
  reason: string;
  now?: Date;
}): QuoteVersion[] {
  const timestamp = (params.now || new Date()).toISOString();
  const nextVersionNumber =
    params.currentVersions.length > 0
      ? Math.max(...params.currentVersions.map((v) => v.version)) + 1
      : 1;

  const updatedPrior = params.currentVersions.map((v) =>
    v.status === 'active' || v.status === 'approved'
      ? { ...v, status: 'replaced' as const }
      : v
  );

  const nextEntry: QuoteVersion = {
    version: nextVersionNumber,
    quote: params.newQuote,
    measuredWeightKg: params.measuredWeightKg,
    measuredDimensions: params.measuredDimensions,
    changedBy: params.changedBy,
    reason: params.reason,
    status: 'active',
    createdAt: timestamp,
  };

  return [...updatedPrior, nextEntry];
}

export interface GroupPaymentAllocationResult {
  success: boolean;
  paidShipmentIds: string[];
  unpaidShipmentIds: string[];
  totalAllocatedNgn: number;
  reason?: string;
}

export function allocateGroupPayment(params: {
  shipments: ShipmentRecord[];
  selectedShipmentIds: string[];
  availableSettlementNgn: number;
}): GroupPaymentAllocationResult {
  const unpaidTargets = params.shipments.filter(
    (s) => params.selectedShipmentIds.includes(s.id) && s.paymentStatus !== 'paid'
  );

  if (unpaidTargets.length === 0) {
    return {
      success: false,
      paidShipmentIds: [],
      unpaidShipmentIds: params.shipments.filter((s) => s.paymentStatus !== 'paid').map((s) => s.id),
      totalAllocatedNgn: 0,
      reason: 'Selected shipments have already been paid or do not exist.',
    };
  }

  const requiredTotal = unpaidTargets.reduce((sum, s) => sum + (s.quote.totalAmount || 0), 0);

  if (params.availableSettlementNgn < requiredTotal) {
    // Partial payment cannot mark selected shipments or siblings as paid
    return {
      success: false,
      paidShipmentIds: [],
      unpaidShipmentIds: params.shipments.filter((s) => s.paymentStatus !== 'paid').map((s) => s.id),
      totalAllocatedNgn: 0,
      reason: `Settlement amount (₦${params.availableSettlementNgn.toLocaleString()}) is less than the required ₦${requiredTotal.toLocaleString()} for the selected shipment(s).`,
    };
  }

  const paidIds = unpaidTargets.map((s) => s.id);
  const remainingUnpaid = params.shipments
    .filter((s) => !paidIds.includes(s.id) && s.paymentStatus !== 'paid')
    .map((s) => s.id);

  return {
    success: true,
    paidShipmentIds: paidIds,
    unpaidShipmentIds: remainingUnpaid,
    totalAllocatedNgn: requiredTotal,
  };
}

export interface PaymentAdjustmentCalculation {
  adjustmentType: PaymentAdjustmentRecord['adjustmentType'];
  originalPaidNgn: number;
  revisedTotalNgn: number;
  deltaNgn: number;
  additionalBalanceDueNgn: number;
  refundDueNgn: number;
  requiresCustomerPayment: boolean;
  requiresRefundOrCredit: boolean;
}

export function calculatePaymentAdjustment(params: {
  alreadyPaidNgn: number;
  revisedTotalNgn: number;
}): PaymentAdjustmentCalculation {
  const originalPaidNgn = Math.max(0, Math.round(params.alreadyPaidNgn));
  const revisedTotalNgn = Math.max(0, Math.round(params.revisedTotalNgn));
  const deltaNgn = revisedTotalNgn - originalPaidNgn;

  if (deltaNgn > 0) {
    return {
      adjustmentType: 'additional_charge',
      originalPaidNgn,
      revisedTotalNgn,
      deltaNgn,
      additionalBalanceDueNgn: deltaNgn,
      refundDueNgn: 0,
      requiresCustomerPayment: true,
      requiresRefundOrCredit: false,
    };
  }

  if (deltaNgn < 0) {
    return {
      adjustmentType: 'refund_credit',
      originalPaidNgn,
      revisedTotalNgn,
      deltaNgn,
      additionalBalanceDueNgn: 0,
      refundDueNgn: Math.abs(deltaNgn),
      requiresCustomerPayment: false,
      requiresRefundOrCredit: true,
    };
  }

  return {
    adjustmentType: 'refund_credit',
    originalPaidNgn,
    revisedTotalNgn,
    deltaNgn: 0,
    additionalBalanceDueNgn: 0,
    refundDueNgn: 0,
    requiresCustomerPayment: false,
    requiresRefundOrCredit: false,
  };
}

export interface CarrierHandoverGateResult {
  allowed: boolean;
  blockers: string[];
  reason?: string;
}

export function canHandoverToCarrier(params: {
  shipment: ShipmentRecord;
  adjustments?: PaymentAdjustmentRecord[];
  kycApproved?: boolean;
  now?: Date;
}): CarrierHandoverGateResult {
  const { shipment } = params;
  const now = params.now || new Date();
  const blockers: string[] = [];

  if (shipment.status === 'cancelled') {
    blockers.push('Shipment has been cancelled.');
  }

  const latestVersion = shipment.quoteVersions?.[shipment.quoteVersions.length - 1];
  if (latestVersion) {
    if (latestVersion.status === 'expired' || new Date(latestVersion.quote.expiresAt).getTime() < now.getTime()) {
      blockers.push('Active quotation version has expired and must be refreshed.');
    }
    if (latestVersion.status === 'active' && shipment.status === 'quote_ready') {
      blockers.push('Revised facility quotation is awaiting customer approval.');
    }
  }

  if (shipment.paymentStatus !== 'paid') {
    blockers.push(`Shipment payment is not settled (status: ${shipment.paymentStatus}).`);
  }

  if ((shipment.adjustmentBalanceDueNgn || 0) > 0) {
    blockers.push(`Outstanding post-weighing balance of ₦${(shipment.adjustmentBalanceDueNgn || 0).toLocaleString()} must be paid before carrier handover.`);
  }

  const shipmentAdjustments = (params.adjustments || []).filter(
    (adj) => adj.shipmentId === shipment.id || adj.trackingNumber === shipment.trackingNumber
  );
  const unsettledPositive = shipmentAdjustments.filter((adj) => {
    const delta = adj.deltaNgn ?? adj.differenceNgn;
    const adjType = adj.adjustmentType || (delta > 0 ? 'additional_charge' : 'refund_credit');
    return (
      adjType === 'additional_charge' &&
      delta > 0 &&
      (adj.status === 'pending' || adj.status === 'pending_customer_approval' || adj.status === 'disputed')
    );
  });
  if (unsettledPositive.length > 0) {
    const due = unsettledPositive.reduce((sum, adj) => sum + (adj.deltaNgn ?? adj.differenceNgn), 0);
    blockers.push(`Pending weight adjustment charge (${unsettledPositive.map((a) => a.adjustmentReference || a.adjustmentRef).join(', ')}) of ₦${due.toLocaleString()} has not been settled.`);
  }

  if (shipment.kycRequiredAtBooking && params.kycApproved === false) {
    blockers.push('Customer KYC verification is required for this high-value shipment before carrier handover.');
  }

  return {
    allowed: blockers.length === 0,
    blockers,
    reason: blockers.length > 0 ? blockers.join(' ') : undefined,
  };
}

export function maskContactInfo(params: { phone?: string; email?: string }): {
  maskedPhone: string;
  maskedEmail: string;
} {
  let maskedPhone = 'Unavailable';
  if (params.phone && params.phone.trim().length >= 4) {
    const clean = params.phone.trim();
    const last4 = clean.slice(-4);
    maskedPhone = `${clean.slice(0, 4)} •••• ${last4}`;
  }

  let maskedEmail = 'Unavailable';
  if (params.email && params.email.includes('@')) {
    const [local, domain] = params.email.split('@');
    const prefix = local.slice(0, 2);
    maskedEmail = `${prefix}***@${domain}`;
  }

  return { maskedPhone, maskedEmail };
}

export interface OtpChallengeRecord {
  id: string;
  target: string; // normalized email or phone or reference key
  purpose: 'registration' | 'quote_lookup' | 'reference_recovery';
  code: string;
  createdAt: number;
  lastSentAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}

export const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
export const OTP_MAX_ATTEMPTS = 5;

export function generateNumericOtp(digits = 6): string {
  let code = '';
  for (let i = 0; i < digits; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export function createOtpChallenge(params: {
  id: string;
  target: string;
  purpose: OtpChallengeRecord['purpose'];
  now?: number;
  codeOverride?: string;
}): OtpChallengeRecord {
  const now = params.now ?? Date.now();
  return {
    id: params.id,
    target: params.target.trim().toLowerCase(),
    purpose: params.purpose,
    code: params.codeOverride || generateNumericOtp(6),
    createdAt: now,
    lastSentAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    verified: false,
  };
}

export function canResendOtp(challenge: OtpChallengeRecord | undefined, now: number = Date.now()): {
  allowed: boolean;
  waitSeconds: number;
} {
  if (!challenge) return { allowed: true, waitSeconds: 0 };
  const elapsed = now - challenge.lastSentAt;
  if (elapsed < OTP_RESEND_COOLDOWN_MS) {
    return {
      allowed: false,
      waitSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
    };
  }
  return { allowed: true, waitSeconds: 0 };
}

export function verifyOtpChallenge(params: {
  challenge: OtpChallengeRecord | undefined;
  inputCode: string;
  now?: number;
}): {
  success: boolean;
  error?: string;
  updatedChallenge?: OtpChallengeRecord;
} {
  const now = params.now ?? Date.now();
  const { challenge, inputCode } = params;

  if (!challenge) {
    return { success: false, error: 'Verification code is invalid or has not been requested.' };
  }
  if (challenge.verified) {
    return { success: false, error: 'This verification code has already been used. Request a new code.' };
  }
  if (now > challenge.expiresAt) {
    return { success: false, error: 'Verification code has expired. Request a fresh code.' };
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
  }

  const nextAttempts = challenge.attempts + 1;
  if (inputCode.trim() !== challenge.code) {
    const remaining = Math.max(0, challenge.maxAttempts - nextAttempts);
    return {
      success: false,
      error: remaining > 0
        ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
        : 'Maximum verification attempts exceeded. Please request a new code.',
      updatedChallenge: {
        ...challenge,
        attempts: nextAttempts,
      },
    };
  }

  return {
    success: true,
    updatedChallenge: {
      ...challenge,
      attempts: nextAttempts,
      verified: true,
    },
  };
}

export function verifyGuestLookupOtp(inputCode: string, expectedCode = '123456'): boolean {
  return inputCode.trim() === expectedCode.trim();
}

export function getCustomerFriendlyStatusLabel(status: ShipmentRecord['status']): string {
  const labels: Record<ShipmentRecord['status'], string> = {
    draft: 'Draft Quote',
    awaiting_dropoff: 'Awaiting Branch Drop-Off',
    pickup_requested: 'Pickup Requested',
    pickup_scheduled: 'Pickup Scheduled',
    pickup_on_the_way: 'Pickup On the Way',
    picked_up: 'Package Collected',
    pickup_completed: 'Package Collected',
    arrived_at_facility: 'Arrived at Swiftvero Facility',
    at_facility: 'At Swiftvero Facility',
    awaiting_measurement: 'Awaiting Scale Measurement',
    measured: 'Weighed & Measured',
    quote_ready: 'Final Quotation Ready',
    pending_reweigh_approval: 'Revised Quote — Approval Needed',
    awaiting_customer_approval: 'Awaiting Your Quote Approval',
    quote_approved: 'Quotation Approved',
    payment_pending: 'Awaiting Payment',
    awaiting_payment: 'Awaiting Payment',
    payment_confirmed: 'Payment Confirmed',
    ready_for_carrier_booking: 'Ready for Carrier Dispatch',
    carrier_booking_in_progress: 'Preparing Carrier Booking',
    booking_failed: 'Carrier Dispatch On Hold (Operations Reviewing)',
    booked: 'Shipment Booked',
    shipment_booked: 'Booked with Carrier',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    overdue_investigation: 'Tracking Review in Progress',
    delivered: 'Delivered',
    returned: 'Returned',
    cancelled: 'Cancelled',
  };
  return labels[status] || 'In Progress';
}

export function isValidShipmentTransition(
  fromStatus: ShipmentRecord['status'],
  toStatus: ShipmentRecord['status']
): boolean {
  if (fromStatus === toStatus) return true;
  if (fromStatus === 'delivered' || fromStatus === 'cancelled' || fromStatus === 'returned') {
    return false;
  }
  // Never jump directly from pre-collection / awaiting_measurement to delivered
  if (
    toStatus === 'delivered' &&
    ['draft', 'pickup_requested', 'pickup_scheduled', 'awaiting_measurement'].includes(fromStatus)
  ) {
    return false;
  }
  return true;
}
