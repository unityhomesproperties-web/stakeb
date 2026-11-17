import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CARRIER_DIVISOR_RULES,
  calculateMultiPackageMeasurements,
  recalculateVerifiedQuoteFromPackages,
  roundToStepKg,
} from './shipping-calculator';
import {
  applyPostApprovalQuoteChange,
  canHandoverShipmentToCarrier,
  evaluateShipmentFinancialSettlement,
  issueShipmentOverpaymentCreditIdempotently,
} from './adjustment-engine';
import {
  allocateCheckoutDeductions,
  getCustomerSeparatedBalances,
  resolveCheckoutReservationOutcome,
} from './rewards-engine';
import { validatePickupEligibility } from './collection-options';
import { getCustomerFriendlyStatusLabel, isValidShipmentTransition } from './quote-lifecycle';
import { createDhlBooking, DEFAULT_DHL_CONFIG } from '../services/dhl-api';
import {
  BonusGrantRecord,
  Branch,
  CustomerProfile,
  PaymentAdjustmentRecord,
  QuoteBreakdown,
  QuoteVersion,
  ShipmentCreditRecord,
  ShipmentRecord,
} from '../types';

const makeBranches = (): Branch[] => [
  {
    id: 'branch_ikeja',
    code: 'IKJ',
    name: 'Ikeja Hub',
    address: '12 Toyin St, Ikeja',
    city: 'Lagos',
    state: 'Lagos',
    phone: '+234 800 000 0001',
    email: 'ikeja@swiftvero.com',
    status: 'active',
    staffCount: 6,
    managerName: 'Chidi',
  },
];

const makeQuote = (totalAmount: number, tier: 'standard' | 'priority' = 'standard'): QuoteBreakdown => ({
  id: `QUO-${totalAmount}`,
  chargeableWeightKg: 5,
  actualWeightKg: 5,
  volumetricWeightKg: 4,
  serviceTier: tier,
  serviceName: tier === 'priority' ? 'Priority Air Express' : 'Standard Air Courier',
  laneDescription: 'International corridor',
  freightCharge: Math.max(0, totalAmount - 4500),
  jetFuelSurcharge: 0,
  handlingCharge: 4500,
  pickupCharge: 0,
  protectionCharge: 0,
  subtotal: totalAmount,
  vatAmount: 0,
  totalAmount,
  transitWindow: '4 - 6 business days',
  estimatedDeliveryDate: '2026-12-01',
  estimatedDeliveryDisplay: 'Tuesday, 1 December 2026',
  generatedAt: '2026-11-12T10:00:00Z',
  expiresAt: '2026-12-20T23:59:59Z',
});

test('validatePickupEligibility enforces serviceable states vs unsupported locations', () => {
  const branches = makeBranches();

  const stdOk = validatePickupEligibility({ state: 'Lagos', city: 'Lekki', pickupType: 'standard', branches });
  assert.equal(stdOk.serviceable, true);
  assert.equal(stdOk.priorityFeeNgn, 0);

  const prioOk = validatePickupEligibility({ state: 'Abuja FCT', city: 'Maitama', pickupType: 'priority', branches });
  assert.equal(prioOk.serviceable, true);
  assert.ok(prioOk.priorityFeeNgn > 0);

  const prioRivers = validatePickupEligibility({ state: 'Rivers', city: 'Port Harcourt', pickupType: 'priority', branches });
  assert.equal(prioRivers.serviceable, false);
  assert.match(prioRivers.reason || '', /Priority 1–6 hour pickup is not available/i);

  const unsupportedState = validatePickupEligibility({ state: 'Sokoto', city: 'Sokoto', pickupType: 'standard', branches });
  assert.equal(unsupportedState.serviceable, false);
  assert.match(unsupportedState.reason || '', /Lagos, Abuja FCT, and Port Harcourt/i);
});

test('Multi-package measurement & configurable carrier divisor rules compute accurate billable weight & preserve original quote', () => {
  const dhl5000 = DEFAULT_CARRIER_DIVISOR_RULES[0]; // divisor 5000, 0.5kg step
  const std6000 = DEFAULT_CARRIER_DIVISOR_RULES[1]; // divisor 6000, 0.5kg step

  assert.equal(roundToStepKg(3.12, 0.5, 0.5), 3.5);
  assert.equal(roundToStepKg(0.2, 1.0, 1.0), 1.0);

  const summary5000 = calculateMultiPackageMeasurements({
    packages: [
      { description: 'Box A (Adire)', actualWeightKg: 2.2, lengthCm: 30, widthCm: 20, heightCm: 15 }, // vol = 9000/5000 = 1.8 -> billable 2.5
      { description: 'Box B (Ceramics)', actualWeightKg: 1.5, lengthCm: 40, widthCm: 30, heightCm: 25 }, // vol = 30000/5000 = 6.0 -> billable 6.0
    ],
    divisorRule: dhl5000,
    measuredBy: 'Ikeja Scale Tech',
  });

  assert.equal(summary5000.packages.length, 2);
  assert.equal(summary5000.packages[0].billableWeightKg, 2.5);
  assert.equal(summary5000.packages[1].billableWeightKg, 6.0);
  assert.equal(summary5000.totalActualWeightKg, 3.7);
  assert.equal(summary5000.totalVolumetricWeightKg, 7.8);
  assert.equal(summary5000.totalBillableWeightKg, 8.5);

  const summary6000 = calculateMultiPackageMeasurements({
    packages: [{ actualWeightKg: 1.5, lengthCm: 40, widthCm: 30, heightCm: 25 }], // vol = 30000/6000 = 5.0
    divisorRule: std6000,
    measuredBy: 'Ikeja Scale Tech',
  });
  assert.equal(summary6000.packages[0].volumetricWeightKg, 5.0);
  assert.equal(summary6000.totalBillableWeightKg, 5.0);

  const original = makeQuote(75000, 'standard');
  const recalc = recalculateVerifiedQuoteFromPackages({
    originalQuote: original,
    destinationCountry: 'United Kingdom',
    packages: [
      { actualWeightKg: 2.2, lengthCm: 30, widthCm: 20, heightCm: 15 },
      { actualWeightKg: 1.5, lengthCm: 40, widthCm: 30, heightCm: 25 },
    ],
    divisorRule: dhl5000,
    measuredBy: 'Ikeja Scale Tech',
  });
  assert.equal(recalc.revisedQuote.previousTotal, 75000);
  assert.equal(recalc.availableOptions.length, 2); // standard + priority for UK

  const remoteRecalc = recalculateVerifiedQuoteFromPackages({
    originalQuote: original,
    destinationCountry: 'Greenland (Remote)',
    packages: [{ actualWeightKg: 2.0, lengthCm: 20, widthCm: 20, heightCm: 20 }],
    divisorRule: std6000,
    measuredBy: 'Ikeja Scale Tech',
  });
  assert.equal(remoteRecalc.availableOptions.length, 1); // priority hidden when unsupported!
});

test('4-scenario financial settlement evaluation + idempotent overpayment credit creation + post-approval re-approval', () => {
  // Scenario A: Underpaid (₦100,000 paid vs ₦120,000 final -> ₦20,000 due)
  const under = evaluateShipmentFinancialSettlement({
    finalShippingPriceNgn: 120000,
    verifiedPaymentsAllocatedNgn: 100000,
  });
  assert.equal(under.scenario, 'underpaid');
  assert.equal(under.remainingAmountNgn, 20000);
  assert.equal(under.overpaymentCreditNgn, 0);

  // Scenario B: Overpaid (₦100,000 paid vs ₦85,000 final -> ₦15,000 overpayment credit)
  const over = evaluateShipmentFinancialSettlement({
    finalShippingPriceNgn: 85000,
    verifiedPaymentsAllocatedNgn: 100000,
  });
  assert.equal(over.scenario, 'overpaid');
  assert.equal(over.remainingAmountNgn, 0);
  assert.equal(over.overpaymentCreditNgn, 15000);

  // Scenario C: Exact (₦100,000 paid vs ₦100,000 final)
  const exact = evaluateShipmentFinancialSettlement({
    finalShippingPriceNgn: 100000,
    verifiedPaymentsAllocatedNgn: 100000,
  });
  assert.equal(exact.scenario, 'exact');
  assert.equal(exact.remainingAmountNgn, 0);
  assert.equal(exact.overpaymentCreditNgn, 0);

  // Scenario D: Unpaid (₦0 paid vs ₦120,000 final -> no false credit)
  const unpaid = evaluateShipmentFinancialSettlement({
    finalShippingPriceNgn: 120000,
    verifiedPaymentsAllocatedNgn: 0,
  });
  assert.equal(unpaid.scenario, 'unpaid');
  assert.equal(unpaid.remainingAmountNgn, 120000);
  assert.equal(unpaid.overpaymentCreditNgn, 0);

  // Idempotent overpayment credit creation
  const shipment = { id: 'ship_over_1', trackingNumber: 'SWV-26-OVER01', customerId: 'cust_1' } as ShipmentRecord;
  const firstCredit = issueShipmentOverpaymentCreditIdempotently({
    existingCredits: [],
    shipment,
    overpaidAmountNgn: 15000,
    adjustmentRef: 'ADJ-26-OVER01',
    isDemo: true,
  });
  assert.equal(firstCredit.created, true);
  assert.ok(firstCredit.creditRecord);
  assert.equal(firstCredit.creditRecord?.remainingCreditNgn, 15000);

  const duplicateCredit = issueShipmentOverpaymentCreditIdempotently({
    existingCredits: [firstCredit.creditRecord!],
    shipment,
    overpaidAmountNgn: 15000,
    adjustmentRef: 'ADJ-26-OVER01',
    isDemo: true,
  });
  assert.equal(duplicateCredit.created, false);
  assert.equal(duplicateCredit.creditRecord?.creditRef, firstCredit.creditRecord?.creditRef);

  // Post-approval quote modification invalidates prior approval and requires renewed approval
  const v1: QuoteVersion = {
    version: 1,
    quote: makeQuote(100000),
    measuredWeightKg: 5,
    changedBy: 'System',
    reason: 'Initial quote',
    status: 'approved',
    createdAt: '2026-11-12T10:00:00Z',
  };
  const postChange = applyPostApprovalQuoteChange({
    currentVersions: [v1],
    newQuote: makeQuote(125000),
    measuredWeightKg: 6.5,
    changedBy: 'Ops Lead',
    reason: 'Recalculated after repackaging',
  });
  assert.equal(postChange.reapprovalRequired, true);
  assert.equal(postChange.versions.length, 2);
  assert.equal(postChange.versions[0].status, 'replaced');
  assert.equal(postChange.versions[1].status, 'active');
});

test('Strictly separated balances + partial cashback/bonus/credit redemption + expired blocking + Paystack failure rollback', () => {
  const now = new Date('2026-11-16T12:00:00Z');
  const customer = {
    id: 'cust_01',
    name: 'Amara',
    email: 'amara@example.com',
    phone: '+2348000000001',
    customerType: 'individual',
    kycStatus: 'verified',
    cashbackBalance: 12000,
    accountCreditNgn: 15000,
    walletBalance: 50000,
    referralCode: 'AMARA10',
    referralsCount: 1,
    termsAcceptedAt: '2026-01-01T00:00:00Z',
  } as CustomerProfile;

  const credits: ShipmentCreditRecord[] = [
    {
      id: 'crd_1',
      creditRef: 'CRD-26-0001',
      customerId: 'cust_01',
      sourceShipmentId: 'ship_old',
      sourceTrackingNumber: 'SWV-26-OLD01',
      originalCreditNgn: 15000,
      remainingCreditNgn: 15000,
      status: 'available',
      createdAt: '2026-11-10T10:00:00Z',
      isDemo: true,
    },
  ];

  const grants: BonusGrantRecord[] = [
    {
      id: 'bon_active',
      grantRef: 'BON-26-ACT01',
      customerId: 'cust_01',
      title: 'Referral Welcome Bonus',
      source: 'referral',
      initialAmountNgn: 8000,
      remainingAmountNgn: 8000,
      expiresAt: '2026-12-31T23:59:59Z',
      eligibleServices: ['standard', 'priority'],
      eligibleDestinations: ['All'],
      status: 'active',
      createdAt: '2026-11-01T10:00:00Z',
      isDemo: true,
    },
    {
      id: 'bon_expired',
      grantRef: 'BON-26-EXP01',
      customerId: 'cust_01',
      title: 'October Promo Bonus (Expired)',
      source: 'promo',
      initialAmountNgn: 5000,
      remainingAmountNgn: 5000,
      expiresAt: '2026-11-01T00:00:00Z',
      eligibleServices: ['standard'],
      eligibleDestinations: ['All'],
      status: 'expired',
      createdAt: '2026-10-01T10:00:00Z',
      isDemo: true,
    },
  ];

  const adjustments: PaymentAdjustmentRecord[] = [
    {
      id: 'adj_due',
      adjustmentRef: 'ADJ-26-DUE01',
      shipmentId: 'ship_due',
      trackingNumber: 'SWV-26-DUE01',
      customerId: 'cust_01',
      originalAmountPaidNgn: 80000,
      revisedAmountNgn: 100000,
      differenceNgn: 20000,
      status: 'pending_customer_approval',
      reason: 'Weight difference',
      createdAt: '2026-11-15T10:00:00Z',
      isDemo: true,
    },
  ];

  const balances = getCustomerSeparatedBalances({
    customer,
    credits,
    bonusGrants: grants,
    shipments: [],
    adjustments,
    now,
  });

  // Never mix categories!
  assert.equal(balances.availableAccountCreditNgn, 15000);
  assert.equal(balances.cashbackBalanceNgn, 12000);
  assert.equal(balances.activeBonusBalanceNgn, 8000);
  assert.equal(balances.expiredBonusBalanceNgn, 5000);
  assert.equal(balances.depositedWalletBalanceNgn, 50000);
  assert.equal(balances.outstandingAmountNgn, 20000);

  // Partial allocation using Account Credit + Cashback + Active Bonus
  const partialAlloc = allocateCheckoutDeductions({
    payableNgn: 120000,
    availableAccountCreditNgn: balances.availableAccountCreditNgn,
    cashbackBalanceNgn: balances.cashbackBalanceNgn,
    bonusGrants: grants,
    serviceTier: 'standard',
    destinationCountry: 'United Kingdom',
    requestedAccountCreditNgn: 10000, // partial out of 15,000
    requestedCashbackNgn: 5000, // partial out of 12,000
    requestedBonusNgn: 5000, // partial out of 8,000 active
    now,
  });
  assert.equal(partialAlloc.valid, true);
  assert.equal(partialAlloc.accountCreditAppliedNgn, 10000);
  assert.equal(partialAlloc.cashbackAppliedNgn, 5000);
  assert.equal(partialAlloc.bonusAppliedNgn, 5000);
  assert.equal(partialAlloc.totalDeductionsNgn, 20000);
  assert.equal(partialAlloc.remainingPaystackNgn, 100000);
  assert.equal(partialAlloc.requiresExternalGateway, true);

  // Full coverage without external gateway
  const zeroGateway = allocateCheckoutDeductions({
    payableNgn: 12000,
    availableAccountCreditNgn: 15000,
    cashbackBalanceNgn: 12000,
    bonusGrants: grants,
    serviceTier: 'standard',
    destinationCountry: 'United Kingdom',
    requestedAccountCreditNgn: 12000,
    now,
  });
  assert.equal(zeroGateway.valid, true);
  assert.equal(zeroGateway.remainingPaystackNgn, 0);
  assert.equal(zeroGateway.requiresExternalGateway, false);

  // Expired bonus cannot be redeemed
  const expiredAttempt = allocateCheckoutDeductions({
    payableNgn: 20000,
    availableAccountCreditNgn: 0,
    cashbackBalanceNgn: 0,
    bonusGrants: [grants[1]], // expired only
    serviceTier: 'standard',
    destinationCountry: 'United Kingdom',
    requestedBonusNgn: 2000,
    now,
  });
  assert.equal(expiredAttempt.valid, false);
  assert.match(expiredAttempt.error || '', /exceeds eligible Bonus Balance/i);

  // Failed Paystack outcome releases all reserved rewards
  const failedOutcome = resolveCheckoutReservationOutcome({
    outcome: 'failed',
    reservedCreditNgn: 10000,
    reservedCashbackNgn: 5000,
    reservedBonusNgn: 5000,
  });
  assert.equal(failedOutcome.settled, false);
  assert.equal(failedOutcome.releasedBackToCustomer, true);
  assert.equal(failedOutcome.creditDeductedNgn, 0);
  assert.equal(failedOutcome.cashbackDeductedNgn, 0);
  assert.equal(failedOutcome.bonusDeductedNgn, 0);
});

test('DHL failure simulation & duplicate carrier booking guard + shipment lifecycle labels', () => {
  const paidShip = {
    id: 'ship_ok',
    trackingNumber: 'SWV-26-OK01',
    status: 'payment_confirmed',
    paymentStatus: 'paid',
    selectedTier: 'priority',
  } as ShipmentRecord;

  assert.equal(canHandoverShipmentToCarrier({ shipment: paidShip, adjustments: [] }).allowed, true);

  // Simulated carrier failure does NOT fabricate a tracking number
  const failedDhl = createDhlBooking(paidShip, { ...DEFAULT_DHL_CONFIG, simulateFailure: true });
  assert.equal(failedDhl.success, false);
  assert.equal(failedDhl.dhlTrackingNumber, '');

  // Success returns genuine demo tracking reference and blocks duplicate booking
  const okDhl = createDhlBooking(paidShip, { ...DEFAULT_DHL_CONFIG, simulateFailure: false });
  assert.equal(okDhl.success, true);
  assert.match(okDhl.dhlTrackingNumber, /^DHL-\d{10}$/);

  const alreadyBooked = { ...paidShip, dhlTrackingNumber: okDhl.dhlTrackingNumber };
  assert.equal(canHandoverShipmentToCarrier({ shipment: alreadyBooked, adjustments: [] }).allowed, false);
  assert.equal(createDhlBooking(alreadyBooked, DEFAULT_DHL_CONFIG).success, false);

  // Lifecycle transition & friendly labels
  assert.equal(getCustomerFriendlyStatusLabel('arrived_at_facility'), 'Arrived at Swiftvero Facility');
  assert.equal(getCustomerFriendlyStatusLabel('booking_failed'), 'Carrier Dispatch On Hold (Operations Reviewing)');
  assert.equal(isValidShipmentTransition('awaiting_measurement', 'delivered'), false);
  assert.equal(isValidShipmentTransition('in_transit', 'delivered'), true);
});
