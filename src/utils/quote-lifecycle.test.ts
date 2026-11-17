import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateGroupPayment,
  calculatePaymentAdjustment,
  canApproveAndPayQuote,
  canHandoverToCarrier,
  canResendOtp,
  createOtpChallenge,
  createQuoteRevision,
  maskContactInfo,
  OTP_EXPIRY_MS,
  OTP_RESEND_COOLDOWN_MS,
  verifyGuestLookupOtp,
  verifyOtpChallenge,
} from './quote-lifecycle';
import { PaymentAdjustmentRecord, QuoteBreakdown, QuoteVersion, ShipmentRecord } from '../types';

const makeQuote = (totalAmount: number, expiresInDays = 5): QuoteBreakdown => {
  const now = new Date('2026-11-12T10:00:00Z');
  const exp = new Date(now.getTime() + expiresInDays * 86400000);
  return {
    id: `QUO-${totalAmount}`,
    chargeableWeightKg: 5,
    actualWeightKg: 5,
    volumetricWeightKg: 4,
    serviceTier: 'standard',
    serviceName: 'Standard Air Courier',
    laneDescription: 'Standard lane',
    freightCharge: totalAmount - 4500,
    jetFuelSurcharge: 0,
    handlingCharge: 4500,
    pickupCharge: 0,
    protectionCharge: 0,
    subtotal: totalAmount,
    vatAmount: 0,
    totalAmount,
    transitWindow: '4 - 7 days',
    estimatedDeliveryDate: '2026-11-20',
    estimatedDeliveryDisplay: 'Friday, 20 November 2026',
    generatedAt: now.toISOString(),
    expiresAt: exp.toISOString(),
  };
};

test('canApproveAndPayQuote - Allows active unpaid non-expired quote, blocks paid/replaced/expired', () => {
  const now = new Date('2026-11-12T12:00:00Z');
  const activeV: QuoteVersion = {
    version: 2,
    quote: makeQuote(120000, 3),
    measuredWeightKg: 5.2,
    changedBy: 'Ikeja Hub Staff',
    reason: 'Digital scale weighing',
    status: 'active',
    createdAt: now.toISOString(),
  };

  assert.equal(canApproveAndPayQuote(activeV, 'unpaid', now).allowed, true);
  assert.equal(canApproveAndPayQuote(activeV, 'paid', now).allowed, false);
  assert.equal(canApproveAndPayQuote({ ...activeV, status: 'replaced' }, 'unpaid', now).allowed, false);

  const expiredV: QuoteVersion = { ...activeV, quote: makeQuote(120000, -1) };
  assert.equal(canApproveAndPayQuote(expiredV, 'unpaid', now).allowed, false);
});

test('createQuoteRevision - Marks previous active quote replaced and appends incremented immutable version', () => {
  const v1: QuoteVersion = {
    version: 1,
    quote: makeQuote(90000),
    measuredWeightKg: 3.5,
    changedBy: 'Booking Estimate',
    reason: 'Customer estimate',
    status: 'active',
    createdAt: '2026-11-10T09:00:00Z',
  };

  const versions = createQuoteRevision({
    currentVersions: [v1],
    newQuote: makeQuote(130892),
    measuredWeightKg: 5.2,
    measuredDimensions: { length: 38, width: 25, height: 20 },
    changedBy: 'Chioma Eze',
    reason: 'Reweighed after customer measurement review request',
  });

  assert.equal(versions.length, 2);
  assert.equal(versions[0].status, 'replaced');
  assert.equal(versions[1].version, 2);
  assert.equal(versions[1].status, 'active');
  assert.equal(versions[1].quote.totalAmount, 130892);
});

test('allocateGroupPayment - Partial payment does not mark unpaid sibling shipments paid', () => {
  const child1 = { id: 's1', paymentStatus: 'unpaid', quote: makeQuote(50000) } as ShipmentRecord;
  const child2 = { id: 's2', paymentStatus: 'unpaid', quote: makeQuote(60000) } as ShipmentRecord;

  const partial = allocateGroupPayment({
    shipments: [child1, child2],
    selectedShipmentIds: ['s1', 's2'],
    availableSettlementNgn: 70000,
  });
  assert.equal(partial.success, false);
  assert.equal(partial.paidShipmentIds.length, 0);

  const singleChild = allocateGroupPayment({
    shipments: [child1, child2],
    selectedShipmentIds: ['s1'],
    availableSettlementNgn: 50000,
  });
  assert.equal(singleChild.success, true);
  assert.deepEqual(singleChild.paidShipmentIds, ['s1']);
  assert.deepEqual(singleChild.unpaidShipmentIds, ['s2']);
});

test('calculatePaymentAdjustment - Computes positive balance due, lower-weight refund credit, and exact match', () => {
  const higher = calculatePaymentAdjustment({ alreadyPaidNgn: 85000, revisedTotalNgn: 112500 });
  assert.equal(higher.adjustmentType, 'additional_charge');
  assert.equal(higher.deltaNgn, 27500);
  assert.equal(higher.additionalBalanceDueNgn, 27500);
  assert.equal(higher.requiresCustomerPayment, true);

  const lower = calculatePaymentAdjustment({ alreadyPaidNgn: 100000, revisedTotalNgn: 78000 });
  assert.equal(lower.adjustmentType, 'refund_credit');
  assert.equal(lower.deltaNgn, -22000);
  assert.equal(lower.refundDueNgn, 22000);
  assert.equal(lower.requiresRefundOrCredit, true);

  const same = calculatePaymentAdjustment({ alreadyPaidNgn: 90000, revisedTotalNgn: 90000 });
  assert.equal(same.deltaNgn, 0);
  assert.equal(same.requiresCustomerPayment, false);
  assert.equal(same.requiresRefundOrCredit, false);
});

test('canHandoverToCarrier - Blocks handover when unpaid, unapproved reweigh, pending adjustment, or failed KYC', () => {
  const now = new Date('2026-11-12T12:00:00Z');
  const paidShipment = {
    id: 'shp-1',
    trackingNumber: 'SWV-26-ABC123',
    status: 'booked',
    paymentStatus: 'paid',
    kycRequiredAtBooking: false,
    quote: makeQuote(90000, 3),
    quoteVersions: [
      {
        version: 1,
        quote: makeQuote(90000, 3),
        measuredWeightKg: 5,
        changedBy: 'System',
        reason: 'Booking',
        status: 'paid',
        createdAt: now.toISOString(),
      },
    ],
  } as unknown as ShipmentRecord;

  assert.equal(canHandoverToCarrier({ shipment: paidShipment, now }).allowed, true);

  const withUnsettledAdj: PaymentAdjustmentRecord = {
    id: 'adj-1',
    adjustmentRef: 'ADJ-26-XYZ999',
    adjustmentReference: 'ADJ-26-XYZ999',
    shipmentId: 'shp-1',
    trackingNumber: 'SWV-26-ABC123',
    customerId: 'u1',
    originalAmountPaidNgn: 90000,
    revisedAmountNgn: 115000,
    previousPaidNgn: 90000,
    newTotalNgn: 115000,
    differenceNgn: 25000,
    deltaNgn: 25000,
    adjustmentType: 'additional_charge',
    reason: 'Actual scale weight 6.5kg',
    status: 'pending',
    createdByStaffName: 'Hub Scale Staff',
    createdAt: now.toISOString(),
    isDemo: true,
  };

  const blockedAdj = canHandoverToCarrier({
    shipment: paidShipment,
    adjustments: [withUnsettledAdj],
    now,
  });
  assert.equal(blockedAdj.allowed, false);
  assert.match(blockedAdj.reason || '', /ADJ-26-XYZ999/);

  const settledAdj: PaymentAdjustmentRecord = { ...withUnsettledAdj, status: 'settled' };
  assert.equal(
    canHandoverToCarrier({ shipment: paidShipment, adjustments: [settledAdj], now }).allowed,
    true
  );

  const blockedKyc = canHandoverToCarrier({
    shipment: { ...paidShipment, kycRequiredAtBooking: true },
    kycApproved: false,
    now,
  });
  assert.equal(blockedKyc.allowed, false);
});

test('OTP challenge lifecycle enforces cooldown, expiry, and max attempt lockout', () => {
  const start = 1_700_000_000_000;
  let challenge = createOtpChallenge({
    id: 'otp-1',
    target: 'amaka@example.com',
    purpose: 'reference_recovery',
    now: start,
    codeOverride: '482910',
  });

  // Cooldown check
  assert.equal(canResendOtp(challenge, start + 10_000).allowed, false);
  assert.equal(canResendOtp(challenge, start + OTP_RESEND_COOLDOWN_MS + 100).allowed, true);

  // Wrong attempts up to limit
  for (let i = 0; i < 4; i++) {
    const fail = verifyOtpChallenge({ challenge, inputCode: '111111', now: start + 5000 });
    assert.equal(fail.success, false);
    challenge = fail.updatedChallenge!;
  }

  // 5th attempt wrong -> locks out even if correct attempted on 6th
  const fifthFail = verifyOtpChallenge({ challenge, inputCode: '111111', now: start + 6000 });
  assert.equal(fifthFail.success, false);
  challenge = fifthFail.updatedChallenge!;

  const sixthBlocked = verifyOtpChallenge({ challenge, inputCode: '482910', now: start + 7000 });
  assert.equal(sixthBlocked.success, false);
  assert.match(sixthBlocked.error || '', /Maximum verification attempts/i);

  // Expiry check on fresh challenge
  const fresh = createOtpChallenge({
    id: 'otp-2',
    target: 'amaka@example.com',
    purpose: 'quote_lookup',
    now: start,
    codeOverride: '991122',
  });
  const expired = verifyOtpChallenge({
    challenge: fresh,
    inputCode: '991122',
    now: start + OTP_EXPIRY_MS + 1,
  });
  assert.equal(expired.success, false);
  assert.match(expired.error || '', /expired/i);

  // Valid check
  const ok = verifyOtpChallenge({ challenge: fresh, inputCode: '991122', now: start + 2000 });
  assert.equal(ok.success, true);
});

test('maskContactInfo & verifyGuestLookupOtp - Masks contact fields and verifies demo OTP cleanly', () => {
  const masked = maskContactInfo({ phone: '+234 802 444 8821', email: 'fatima@kanotextiles.com' });
  assert.match(masked.maskedPhone, /8821$/);
  assert.equal(masked.maskedPhone.includes('444'), false);
  assert.equal(masked.maskedEmail, 'fa***@kanotextiles.com');

  assert.equal(verifyGuestLookupOtp(' 123456 '), true);
  assert.equal(verifyGuestLookupOtp('000000'), false);
});
