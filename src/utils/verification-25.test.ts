import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateUniqueReference,
  isValidQuoteRef,
  isValidBookingGroupRef,
  isValidShipmentRef,
  createOtpChallenge,
  verifyOtpChallenge,
  buildGenericRecoveryNotice,
  findQuotesAndUnpaidShipmentsByContact,
} from './reference-engine';
import {
  buildWeightPaymentAdjustment,
  canHandoverShipmentToCarrier,
  sortPickupQueuePriorityFirst,
  isShippingInsuranceAvailable,
  calculateAdminGatedInsurancePremium,
} from './adjustment-engine';
import {
  evaluateRouteAvailability,
  calculateVolumetricWeight,
  calculateChargeableWeight,
  checkProhibitedGoods,
} from './shipping-calculator';
import {
  evaluateCollectionOptions,
  calculatePriorityPickupFee,
} from './collection-options';
import {
  canApproveAndPayQuote,
  createQuoteRevision,
  allocateGroupPayment,
} from './quote-lifecycle';
import { canSubmitReviewForShipment, getPublicApprovedReviews } from './review-rules';
import {
  AdminFeatureFlags,
  Branch,
  OtpChallengeRecord,
  PaymentAdjustmentRecord,
  PickupJob,
  QuoteBreakdown,
  QuoteRecord,
  QuoteVersion,
  ShipmentRecord,
} from '../types';

const makeQuoteBreakdown = (totalAmount: number, weightKg = 4): QuoteBreakdown => ({
  id: `qb_${totalAmount}`,
  chargeableWeightKg: weightKg,
  actualWeightKg: weightKg,
  volumetricWeightKg: 2,
  serviceTier: 'standard',
  serviceName: 'Standard Air Courier',
  laneDescription: 'Cost-optimized international lane',
  freightCharge: Math.round(totalAmount * 0.7),
  jetFuelSurcharge: Math.round(totalAmount * 0.15),
  handlingCharge: 5000,
  pickupCharge: 0,
  protectionCharge: 0,
  subtotal: Math.round(totalAmount / 1.075),
  vatAmount: totalAmount - Math.round(totalAmount / 1.075),
  totalAmount,
  transitWindow: '4 - 6 business days',
  estimatedDeliveryDate: '2026-11-22',
  estimatedDeliveryDisplay: 'Nov 22, 2026',
  generatedAt: '2026-11-10T10:00:00.000Z',
  expiresAt: '2099-12-31T23:59:59.000Z',
});

const makeShipment = (overrides: Partial<ShipmentRecord> = {}): ShipmentRecord => ({
  id: 'ship_test_1',
  trackingNumber: 'SWV-26-100001',
  direction: 'export',
  customerId: 'cust_1',
  customerName: 'Amara Okafor',
  customerEmail: 'amara@crafts.ng',
  customerPhone: '+2348035550192',
  senderName: 'Amara Okafor',
  senderPhone: '+2348035550192',
  senderAddress: 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos',
  originCountry: 'Nigeria',
  originCity: 'Lagos',
  recipientName: 'Chidi Eze',
  recipientPhone: '+447700900111',
  recipientAddress: '22 Baker St, London',
  destinationCountry: 'United Kingdom',
  destinationCity: 'London',
  contentsDescription: 'Handmade Adire Textiles',
  items: [{ id: 'it_1', description: 'Adire', quantity: 1, declaredValue: 80000 }],
  declaredWeightKg: 4,
  pickupType: 'doorstep',
  pickupStatus: 'picked_up',
  pickupStatusLabel: 'Facility Verified',
  status: 'booked',
  quote: makeQuoteBreakdown(100000, 4),
  selectedTier: 'standard',
  estimatedDeliveryDisplay: 'Nov 22, 2026',
  paymentStatus: 'paid',
  finalAmountPaidNgn: 100000,
  trackingEvents: [],
  lastUpdateTimestamp: '2026-11-10T10:00:00.000Z',
  customerAcknowledgedTerms: true,
  customerAcknowledgedDeclaration: true,
  kycRequiredAtBooking: false,
  cashbackEarned: 0,
  cashbackStatus: 'none',
  hasReview: false,
  createdAt: '2026-11-10T10:00:00.000Z',
  ...overrides,
});

test('1. Separated references (QTE, BKG, SWV) generate uniquely and honor idempotency keys', () => {
  const existing = new Set<string>();
  const cache = new Map<string, string>();

  const qte = generateUniqueReference({ prefix: 'QTE', existingCodes: existing, idempotencyKey: 'q_1', idempotencyCache: cache });
  const qteRepeat = generateUniqueReference({ prefix: 'QTE', existingCodes: existing, idempotencyKey: 'q_1', idempotencyCache: cache });
  const bkg = generateUniqueReference({ prefix: 'BKG', existingCodes: existing, idempotencyKey: 'b_1', idempotencyCache: cache });
  const swv = generateUniqueReference({ prefix: 'SWV', existingCodes: existing, idempotencyKey: 's_1', idempotencyCache: cache });

  assert.equal(qte, qteRepeat);
  assert.ok(isValidQuoteRef(qte));
  assert.ok(isValidBookingGroupRef(bkg));
  assert.ok(isValidShipmentRef(swv));
  assert.notEqual(qte, bkg);
  assert.notEqual(bkg, swv);
});

test('2. OTP enforces 60s resend cooldown, honest provider status, expiry, and 5-attempt 15m lockout', () => {
  const t0 = new Date('2026-11-12T10:00:00.000Z');
  // Production sandbox without SMS credentials must report provider_unconfigured
  const unconfigured = createOtpChallenge({
    contactValue: '+2348035550192',
    channel: 'sms',
    purpose: 'quote_access',
    existingChallenges: [],
    isProviderConfigured: false,
    isDemo: false,
    now: t0,
  });
  assert.equal(unconfigured.allowed, false);
  assert.equal(unconfigured.deliveryLog.status, 'provider_unconfigured');

  // Demo mode generates OTP and logs sent
  const created = createOtpChallenge({
    contactValue: 'amara@crafts.ng',
    channel: 'email',
    purpose: 'quote_access',
    existingChallenges: [],
    isProviderConfigured: false,
    isDemo: true,
    now: t0,
  });
  assert.equal(created.allowed, true);
  assert.equal(created.deliveryLog.status, 'sent');
  assert.ok(created.challenge);
  const ch0 = created.challenge!;
  assert.match(ch0.code, /^\d{6}$/);

  // Immediate resend within 60s is blocked
  const cooldownBlocked = createOtpChallenge({
    contactValue: 'amara@crafts.ng',
    channel: 'email',
    purpose: 'quote_access',
    existingChallenges: [ch0],
    isProviderConfigured: true,
    isDemo: true,
    now: new Date(t0.getTime() + 15_000),
  });
  assert.equal(cooldownBlocked.allowed, false);
  assert.ok(cooldownBlocked.cooldownRemainingSeconds > 0);

  // 5 wrong attempts trigger 15m lockout
  let current: OtpChallengeRecord = ch0;
  for (let i = 0; i < 5; i++) {
    const attempt = verifyOtpChallenge({
      challenge: current,
      inputCode: '000000',
      now: new Date(t0.getTime() + 20_000 + i * 1000),
    });
    assert.equal(attempt.verified, false);
    current = attempt.updatedChallenge;
    if (i === 4) {
      assert.equal(attempt.locked, true);
    }
  }
  assert.ok(current.lockedUntil);

  // Expired code check after 10 minutes
  const expiredRes = verifyOtpChallenge({
    challenge: ch0,
    inputCode: ch0.code,
    now: new Date(t0.getTime() + 11 * 60_000),
  });
  assert.equal(expiredRes.verified, false);
  assert.equal(expiredRes.expired, true);

  // Valid code succeeds within window
  const validRes = verifyOtpChallenge({
    challenge: ch0,
    inputCode: ch0.code,
    now: new Date(t0.getTime() + 30_000),
  });
  assert.equal(validRes.verified, true);
});

test('3. Quote recovery notice never leaks account existence and contact finder scopes to QTE/unpaid SWV', () => {
  const msgExisting = buildGenericRecoveryNotice('amara@crafts.ng');
  const msgUnknown = buildGenericRecoveryNotice('unknown@example.com');
  assert.match(msgExisting, /If an active quote or shipment matches/i);
  assert.match(msgUnknown, /If an active quote or shipment matches/i);

  const quotes: QuoteRecord[] = [
    {
      id: 'q1',
      quoteRef: 'QTE-26-410288',
      type: 'instant_estimate',
      status: 'estimate',
      contactName: 'Amara',
      contactEmail: 'amara@crafts.ng',
      originCountry: 'Nigeria',
      originCity: 'Lagos',
      destinationCountry: 'United Kingdom',
      destinationCity: 'London',
      serviceTier: 'standard',
      items: [],
      totalEstimatedNgn: 78500,
      expiresAt: '2099-01-01T00:00:00.000Z',
      isDemo: true,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  ];
  const paidShip = makeShipment({ id: 'sp1', paymentStatus: 'paid', status: 'booked' });
  const unpaidShip = makeShipment({ id: 'sp2', paymentStatus: 'unpaid', status: 'quote_ready' });

  const matched = findQuotesAndUnpaidShipmentsByContact({
    contactValue: 'AMARA@CRAFTS.NG ',
    quotes,
    shipments: [paidShip, unpaidShip],
  });
  assert.equal(matched.quotes.length, 1);
  assert.equal(matched.shipments.length, 1);
  assert.equal(matched.shipments[0].id, 'sp2');
});

test('4. Shipping insurance stays hidden & zero until Admin enables flag AND configures underwriter', () => {
  const defaultFlags: AdminFeatureFlags = {
    insuranceEnabled: false,
    insurerConfigured: false,
    insurerName: '',
    insurerRatePercentage: 0,
    insurerMinDeclaredValueNgn: 50000,
    insurerRuleSummary: '',
    smsProviderConfigured: false,
    emailProviderConfigured: false,
    whatsappProviderConfigured: false,
    updatedBy: 'Admin',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  assert.equal(isShippingInsuranceAvailable(defaultFlags), false);
  assert.deepEqual(
    calculateAdminGatedInsurancePremium({ declaredValueNgn: 200000, flags: defaultFlags }),
    { available: false, premiumNgn: 0 }
  );

  // Flag enabled without insurer configured must still block insurance
  assert.equal(
    isShippingInsuranceAvailable({ ...defaultFlags, insuranceEnabled: true }),
    false
  );

  // Fully configured by Admin unlocks calculated premium
  const activeFlags: AdminFeatureFlags = {
    ...defaultFlags,
    insuranceEnabled: true,
    insurerConfigured: true,
    insurerName: 'AXA Mansard Cargo',
    insurerRatePercentage: 1.5,
  };
  assert.equal(isShippingInsuranceAvailable(activeFlags), true);
  assert.deepEqual(
    calculateAdminGatedInsurancePremium({ declaredValueNgn: 200000, flags: activeFlags }),
    { available: true, premiumNgn: 3000 }
  );
});

test('5. Weight verification adjustments require explicit checkout on positive balance and block carrier handover until paid', () => {
  const paidShipment = makeShipment({ finalAmountPaidNgn: 100000 });
  const higherQuote = makeQuoteBreakdown(128500, 6);
  const refs = new Set<string>();

  const posAdj = buildWeightPaymentAdjustment({
    shipment: paidShipment,
    newQuote: higherQuote,
    quoteVersionNumber: 2,
    verifiedBillableWeightKg: 6,
    createdByStaffName: 'Chioma Eze',
    reason: 'Scale measured 6.0 kg vs declared 4.0 kg.',
    existingAdjustmentRefs: refs,
    isDemo: true,
  });
  assert.ok(posAdj);
  assert.equal(posAdj!.differenceNgn, 28500);
  assert.equal(posAdj!.status, 'pending_customer_approval');
  assert.equal(posAdj!.requiresExplicitCheckout, true);

  // Handover blocked while pending adjustment > 0 exists
  const blocked = canHandoverShipmentToCarrier({
    shipment: paidShipment,
    adjustments: [posAdj!],
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.outstandingAmountNgn, 28500);

  // Handover allowed once customer approves & settles balance
  const settled: PaymentAdjustmentRecord = { ...posAdj!, status: 'approved_and_paid' };
  const unblocked = canHandoverShipmentToCarrier({
    shipment: paidShipment,
    adjustments: [settled],
  });
  assert.equal(unblocked.allowed, true);

  // Negative difference credits wallet without blocking handover
  const lowerQuote = makeQuoteBreakdown(82000, 3);
  const negAdj = buildWeightPaymentAdjustment({
    shipment: paidShipment,
    newQuote: lowerQuote,
    quoteVersionNumber: 2,
    verifiedBillableWeightKg: 3,
    createdByStaffName: 'Chioma Eze',
    reason: 'Verified lighter carton (3.0 kg).',
    existingAdjustmentRefs: refs,
    isDemo: true,
  });
  assert.ok(negAdj);
  assert.equal(negAdj!.differenceNgn, -18000);
  assert.equal(negAdj!.status, 'refund_credited');
  assert.equal(negAdj!.requiresExplicitCheckout, false);
});

test('6. Priority pickups sort first in Workspace A and collection rules evaluate Nigerian zones', () => {
  const branches: Branch[] = [
    {
      id: 'b1',
      code: 'IKJ',
      name: 'Ikeja Cargo Hub',
      address: '24 Oba Akran Ave',
      city: 'Lagos',
      phone: '+234800',
      email: 'ikeja@swiftvero.ng',
      status: 'active',
      staffCount: 6,
      managerName: 'Tunde',
    },
  ];
  const lagosEval = evaluateCollectionOptions({ state: 'Lagos', city: 'Lekki', branches, shipmentCount: 2, totalEstimatedWeightKg: 10 });
  assert.equal(lagosEval.standardPickup.available, true);
  assert.equal(lagosEval.priorityPickup.available, true);
  assert.ok(lagosEval.priorityPickup.feeNgn >= 3500);
  assert.equal(calculatePriorityPickupFee({ state: 'Abuja', shipmentCount: 3, totalEstimatedWeightKg: 16 }), 4000 + 750 + 1500);

  const enuguEval = evaluateCollectionOptions({ state: 'Enugu', city: 'Nsukka', branches });
  assert.equal(enuguEval.priorityPickup.available, false);

  const baseJob = (id: string, isPriority: boolean, status: PickupJob['status'], offsetMin: number): PickupJob => ({
    id,
    shipmentId: `s_${id}`,
    trackingNumber: `SWV-26-00000${id}`,
    pickupReference: `PKP-26-00000${id}`,
    senderName: 'Test',
    senderPhone: '0803',
    senderAddress: 'Lagos',
    scheduledSlot: '10am',
    scheduledDate: '2026-11-12',
    declaredWeightKg: 2,
    declaredDimensions: { length: 10, width: 10, height: 10 },
    status,
    isPriorityFlag: isPriority,
    pickupType: isPriority ? 'priority' : 'standard',
    bookingConfirmedAt: new Date(1700000000000 + offsetMin * 60_000).toISOString(),
  });

  const sorted = sortPickupQueuePriorityFirst([
    baseJob('1', false, 'booking_received', 10),
    baseJob('2', true, 'handed_over', 20),
    baseJob('3', true, 'booking_received', 5),
  ]);
  assert.deepEqual(
    sorted.map((j) => j.id),
    ['3', '1', '2']
  );
});

test('7. Route calculator, prohibited scan, quote revisions, group payments, and review rules hold', () => {
  assert.equal(evaluateRouteAvailability('Nigeria', 'United Kingdom').isSupported, true);
  assert.equal(evaluateRouteAvailability('Nigeria', 'Nigeria').isSupported, false);
  assert.equal(evaluateRouteAvailability('Nigeria', 'Brazil').isConfirmed, false);

  assert.equal(calculateVolumetricWeight(50, 40, 25), 10);
  assert.equal(calculateChargeableWeight(4, 50, 40, 25), 10);
  assert.equal(checkProhibitedGoods('Leather sandals').isProhibited, false);
  assert.equal(checkProhibitedGoods('Flammable liquid tin').isProhibited, true);

  const v1: QuoteVersion = {
    version: 1,
    quote: makeQuoteBreakdown(100000),
    measuredWeightKg: 4,
    changedBy: 'Ops',
    reason: 'Initial',
    status: 'active',
    createdAt: '2026-11-10T00:00:00.000Z',
  };
  const revised = createQuoteRevision({
    currentVersions: [v1],
    newQuote: makeQuoteBreakdown(120000, 5),
    measuredWeightKg: 5,
    changedBy: 'Ops',
    reason: 'Scale check',
  });
  assert.equal(revised[0].status, 'replaced');
  assert.equal(revised[1].status, 'active');
  assert.equal(canApproveAndPayQuote(revised[0], 'unpaid').allowed, false);
  assert.equal(canApproveAndPayQuote(revised[1], 'unpaid').allowed, true);

  const sA = makeShipment({ id: 'sa', paymentStatus: 'unpaid', quote: makeQuoteBreakdown(60000) });
  const sB = makeShipment({ id: 'sb', paymentStatus: 'unpaid', quote: makeQuoteBreakdown(70000) });
  const partialFail = allocateGroupPayment({
    shipments: [sA, sB],
    selectedShipmentIds: ['sa', 'sb'],
    availableSettlementNgn: 60000,
  });
  assert.equal(partialFail.success, false);
  assert.equal(partialFail.paidShipmentIds.length, 0);

  const delivered = makeShipment({ id: 'del1', status: 'delivered', customerId: 'c1' });
  assert.equal(canSubmitReviewForShipment({ shipment: delivered, existingReviews: [], customerId: 'c1' }).eligible, true);
  assert.equal(
    getPublicApprovedReviews([
      {
        id: 'r1',
        shipmentId: 'del1',
        trackingNumber: 'SWV-26-100001',
        customerName: 'Amara',
        verifiedShipment: true,
        ratingOverall: 5,
        ratingCommunication: 5,
        ratingSpeed: 5,
        ratingCondition: 5,
        writtenFeedback: 'Great',
        status: 'published',
        moderationStatus: 'approved',
        createdAt: '2026-11-11T00:00:00.000Z',
      },
      {
        id: 'r2',
        shipmentId: 'del2',
        trackingNumber: 'SWV-26-100002',
        customerName: 'John',
        verifiedShipment: true,
        ratingOverall: 2,
        ratingCommunication: 2,
        ratingSpeed: 2,
        ratingCondition: 2,
        writtenFeedback: 'Pending check',
        status: 'pending',
        moderationStatus: 'pending_review',
        createdAt: '2026-11-11T00:00:00.000Z',
      },
    ]).length,
    1
  );
});
