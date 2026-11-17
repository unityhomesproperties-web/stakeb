import {
  AdminFeatureFlags,
  PaymentAdjustmentRecord,
  PickupJob,
  QuoteBreakdown,
  QuoteVersion,
  ShipmentCreditRecord,
  ShipmentRecord,
} from '../types';
import { generateUniqueReference } from './reference-engine';
import { createQuoteRevision } from './quote-lifecycle';

export interface CreateWeightAdjustmentParams {
  shipment: ShipmentRecord;
  newQuote: QuoteBreakdown;
  quoteVersionNumber: number;
  verifiedBillableWeightKg: number;
  createdByStaffName: string;
  reason: string;
  inspectionNotes?: string;
  inspectionPhotoUrl?: string;
  existingAdjustmentRefs: Set<string>;
  isDemo: boolean;
  now?: Date;
}

/**
 * Generates an auditable PaymentAdjustmentRecord when facility scale verification
 * alters the billable weight or price of an ALREADY-PAID shipment.
 * Never auto-charges stored cards: positive differences require explicit customer
 * approval & checkout before carrier handover. Negative differences issue a refund/wallet credit.
 */
export function buildWeightPaymentAdjustment(
  params: CreateWeightAdjustmentParams
): PaymentAdjustmentRecord | null {
  const { shipment, newQuote } = params;
  if (shipment.paymentStatus !== 'paid') {
    return null;
  }

  const now = params.now || new Date();
  const originalPaid =
    typeof shipment.finalAmountPaidNgn === 'number' && shipment.finalAmountPaidNgn > 0
      ? shipment.finalAmountPaidNgn
      : shipment.quote.totalAmount;
  const differenceNgn = newQuote.totalAmount - originalPaid;

  if (differenceNgn === 0) {
    return null;
  }

  const adjustmentRef = generateUniqueReference({
    prefix: 'ADJ',
    existingCodes: params.existingAdjustmentRefs,
  });

  return {
    id: `adj_${now.getTime()}_${Math.floor(Math.random() * 1000)}`,
    adjustmentRef,
    shipmentId: shipment.id,
    trackingNumber: shipment.trackingNumber,
    customerId: shipment.customerId,
    quoteVersionNumber: params.quoteVersionNumber,
    originalWeightKg: shipment.quote.chargeableWeightKg || shipment.declaredWeightKg,
    verifiedBillableWeightKg: params.verifiedBillableWeightKg,
    originalAmountPaidNgn: originalPaid,
    revisedAmountNgn: newQuote.totalAmount,
    differenceNgn,
    status: differenceNgn > 0 ? 'pending_customer_approval' : 'refund_credited',
    reason: params.reason,
    inspectionNotes: params.inspectionNotes,
    inspectionPhotoUrl: params.inspectionPhotoUrl,
    requiresExplicitCheckout: differenceNgn > 0,
    walletCreditedAt: differenceNgn < 0 ? now.toISOString() : undefined,
    createdByStaffName: params.createdByStaffName,
    createdAt: now.toISOString(),
    isDemo: params.isDemo,
  };
}

export interface HandoverGateResult {
  allowed: boolean;
  reason?: string;
  blockingAdjustmentRef?: string;
  outstandingAmountNgn?: number;
}

/**
 * Blocks carrier handover until the initial quote AND any positive weight-verification
 * payment adjustment have been explicitly approved and settled by the customer.
 */
export function canHandoverShipmentToCarrier(params: {
  shipment: ShipmentRecord;
  adjustments: PaymentAdjustmentRecord[];
}): HandoverGateResult {
  const { shipment, adjustments } = params;

  if (shipment.status === 'cancelled' || shipment.status === 'returned') {
    return {
      allowed: false,
      reason: 'Cancelled or returned shipments cannot be handed over to an international carrier.',
    };
  }

  if (shipment.dhlTrackingNumber) {
    return {
      allowed: false,
      reason: `Duplicate carrier booking blocked: DHL Waybill ${shipment.dhlTrackingNumber} is already assigned to ${shipment.trackingNumber}.`,
    };
  }

  if (shipment.quoteRejectedAt) {
    return {
      allowed: false,
      reason: `Customer rejected the revised quotation for ${shipment.trackingNumber}. Carrier booking is blocked pending Operations resolution.`,
    };
  }

  if (shipment.reapprovalRequired) {
    return {
      allowed: false,
      reason: `Quotation was modified after prior approval for ${shipment.trackingNumber}. Renewed customer approval is required before carrier booking.`,
    };
  }

  if (shipment.paymentStatus !== 'paid') {
    return {
      allowed: false,
      reason: `Initial quotation for ${shipment.trackingNumber} has not been approved and settled by the customer.`,
    };
  }

  const pendingAdjustment = adjustments.find((adj) => {
    const delta = adj.deltaNgn ?? adj.differenceNgn;
    return (
      (adj.shipmentId === shipment.id || adj.trackingNumber === shipment.trackingNumber) &&
      (adj.status === 'pending_customer_approval' || adj.status === 'pending' || adj.status === 'disputed') &&
      delta > 0
    );
  });

  if (pendingAdjustment) {
    const due = pendingAdjustment.deltaNgn ?? pendingAdjustment.differenceNgn;
    return {
      allowed: false,
      blockingAdjustmentRef: pendingAdjustment.adjustmentRef,
      outstandingAmountNgn: due,
      reason: `Carrier handover blocked: Weight verification adjustment ${pendingAdjustment.adjustmentRef} (+₦${due.toLocaleString()}) awaits explicit customer approval and checkout.`,
    };
  }

  return { allowed: true };
}

/**
 * Sorts Workspace A Pickup Queue with Priority Pickups (1–6h) strictly at the top
 * of active jobs, followed by Standard Pickups, and completed/cancelled items last.
 */
export function sortPickupQueuePriorityFirst(jobs: PickupJob[]): PickupJob[] {
  const isTerminal = (status: PickupJob['status']) =>
    status === 'handed_over' || status === 'cancelled' || status === 'completed';

  return [...jobs].sort((a, b) => {
    const aTerm = isTerminal(a.status) ? 1 : 0;
    const bTerm = isTerminal(b.status) ? 1 : 0;
    if (aTerm !== bTerm) return aTerm - bTerm;

    const aPrio = a.isPriorityFlag || a.pickupType === 'priority' ? 0 : 1;
    const bPrio = b.isPriorityFlag || b.pickupType === 'priority' ? 0 : 1;
    if (aPrio !== bPrio) return aPrio - bPrio;

    const aTime = new Date(a.bookingConfirmedAt || 0).getTime();
    const bTime = new Date(b.bookingConfirmedAt || 0).getTime();
    return bTime - aTime;
  });
}

/**
 * Checks whether optional shipping insurance is enabled AND properly configured
 * by Operations Admin. Never exposes or sells unconfigured coverage.
 */
export function isShippingInsuranceAvailable(flags: AdminFeatureFlags): boolean {
  return Boolean(
    flags.insuranceEnabled &&
      flags.insurerConfigured &&
      flags.insurerName.trim().length > 0 &&
      flags.insurerRatePercentage > 0
  );
}

export function calculateAdminGatedInsurancePremium(params: {
  declaredValueNgn: number;
  flags: AdminFeatureFlags;
}): { available: boolean; premiumNgn: number } {
  if (!isShippingInsuranceAvailable(params.flags)) {
    return { available: false, premiumNgn: 0 };
  }
  if (params.declaredValueNgn < params.flags.insurerMinDeclaredValueNgn) {
    return { available: true, premiumNgn: Math.round((params.flags.insurerMinDeclaredValueNgn * params.flags.insurerRatePercentage) / 100) };
  }
  return {
    available: true,
    premiumNgn: Math.round((params.declaredValueNgn * params.flags.insurerRatePercentage) / 100),
  };
}

export type SettlementScenario = 'underpaid' | 'overpaid' | 'exact' | 'unpaid';

export interface FinancialSettlementEvaluation {
  scenario: SettlementScenario;
  finalShippingPriceNgn: number;
  amountAlreadyPaidNgn: number;
  creditsAppliedNgn: number;
  remainingAmountNgn: number;
  overpaymentCreditNgn: number;
  requiresCustomerPayment: boolean;
  requiresCustomerApproval: boolean;
  isFullySettled: boolean;
}

/**
 * Pure 4-scenario backend settlement calculator:
 * - Scenario A (underpaid): verifiedPaid > 0 && final > verifiedPaid -> remaining = final - paid - credits
 * - Scenario B (overpaid): verifiedPaid > final -> overpaymentCredit = verifiedPaid - final, remaining = 0
 * - Scenario C (exact): verifiedPaid === final -> remaining = 0, overpaymentCredit = 0
 * - Scenario D (unpaid): verifiedPaid === 0 -> remaining = max(0, final - credits), overpaymentCredit = 0 (never false credit!)
 */
export function evaluateShipmentFinancialSettlement(params: {
  finalShippingPriceNgn: number;
  verifiedPaymentsAllocatedNgn: number;
  creditsAppliedNgn?: number;
}): FinancialSettlementEvaluation {
  const finalPrice = Math.max(0, Math.round(params.finalShippingPriceNgn));
  const paid = Math.max(0, Math.round(params.verifiedPaymentsAllocatedNgn));
  const creditsApplied = Math.max(0, Math.round(params.creditsAppliedNgn || 0));

  if (paid === 0) {
    const remaining = Math.max(0, finalPrice - creditsApplied);
    return {
      scenario: 'unpaid',
      finalShippingPriceNgn: finalPrice,
      amountAlreadyPaidNgn: 0,
      creditsAppliedNgn: creditsApplied,
      remainingAmountNgn: remaining,
      overpaymentCreditNgn: 0,
      requiresCustomerPayment: remaining > 0,
      requiresCustomerApproval: true,
      isFullySettled: remaining === 0 && finalPrice === 0,
    };
  }

  if (paid > finalPrice) {
    const overpayment = paid - finalPrice;
    return {
      scenario: 'overpaid',
      finalShippingPriceNgn: finalPrice,
      amountAlreadyPaidNgn: paid,
      creditsAppliedNgn: creditsApplied,
      remainingAmountNgn: 0,
      overpaymentCreditNgn: overpayment,
      requiresCustomerPayment: false,
      requiresCustomerApproval: true,
      isFullySettled: true,
    };
  }

  if (paid === finalPrice) {
    return {
      scenario: 'exact',
      finalShippingPriceNgn: finalPrice,
      amountAlreadyPaidNgn: paid,
      creditsAppliedNgn: creditsApplied,
      remainingAmountNgn: 0,
      overpaymentCreditNgn: 0,
      requiresCustomerPayment: false,
      requiresCustomerApproval: false,
      isFullySettled: true,
    };
  }

  const remaining = Math.max(0, finalPrice - paid - creditsApplied);
  return {
    scenario: 'underpaid',
    finalShippingPriceNgn: finalPrice,
    amountAlreadyPaidNgn: paid,
    creditsAppliedNgn: creditsApplied,
    remainingAmountNgn: remaining,
    overpaymentCreditNgn: 0,
    requiresCustomerPayment: remaining > 0,
    requiresCustomerApproval: true,
    isFullySettled: remaining === 0,
  };
}

/**
 * Guarantees idempotent creation of ShipmentCreditRecord on overpayment.
 * Never creates a duplicate credit for the same shipmentId + sourceAdjustmentRef.
 */
export function issueShipmentOverpaymentCreditIdempotently(params: {
  existingCredits: ShipmentCreditRecord[];
  shipment: ShipmentRecord;
  overpaidAmountNgn: number;
  adjustmentRef: string;
  isDemo: boolean;
  now?: Date;
}): {
  created: boolean;
  creditRecord: ShipmentCreditRecord | null;
  reason?: string;
} {
  const amount = Math.round(params.overpaidAmountNgn);
  if (amount <= 0) {
    return { created: false, creditRecord: null, reason: 'No positive overpayment amount.' };
  }

  const duplicate = params.existingCredits.find(
    (c) =>
      c.sourceShipmentId === params.shipment.id &&
      (c.sourceAdjustmentRef === params.adjustmentRef ||
        (c.status !== 'refunded' && c.originalCreditNgn === amount))
  );

  if (duplicate) {
    return {
      created: false,
      creditRecord: duplicate,
      reason: `Overpayment credit ${duplicate.creditRef} already exists for shipment ${params.shipment.trackingNumber}.`,
    };
  }

  const now = params.now || new Date();
  const existingCodes = new Set(params.existingCredits.map((c) => c.creditRef));
  const creditRef = generateUniqueReference({ prefix: 'CRD', existingCodes });

  const record: ShipmentCreditRecord = {
    id: `crd_${now.getTime()}_${Math.floor(Math.random() * 1000)}`,
    creditRef,
    customerId: params.shipment.customerId,
    sourceShipmentId: params.shipment.id,
    sourceTrackingNumber: params.shipment.trackingNumber,
    sourceAdjustmentRef: params.adjustmentRef,
    originalCreditNgn: amount,
    remainingCreditNgn: amount,
    status: 'available',
    createdAt: now.toISOString(),
    isDemo: params.isDemo,
  };

  return { created: true, creditRecord: record };
}

export function applyPostApprovalQuoteChange(params: {
  currentVersions: QuoteVersion[];
  newQuote: QuoteBreakdown;
  measuredWeightKg: number;
  measuredDimensions?: { length: number; width: number; height: number };
  changedBy: string;
  reason: string;
  now?: Date;
}): {
  versions: QuoteVersion[];
  reapprovalRequired: boolean;
  hadPriorApprovalOrPayment: boolean;
} {
  const hadPriorApprovalOrPayment = params.currentVersions.some(
    (v) => v.status === 'approved' || v.status === 'paid'
  );
  const versions = createQuoteRevision({
    currentVersions: params.currentVersions,
    newQuote: params.newQuote,
    measuredWeightKg: params.measuredWeightKg,
    measuredDimensions: params.measuredDimensions,
    changedBy: params.changedBy,
    reason: params.reason,
    now: params.now,
  });

  return {
    versions,
    reapprovalRequired: hadPriorApprovalOrPayment,
    hadPriorApprovalOrPayment,
  };
}
