import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVolumetricWeight,
  calculateChargeableWeight,
  checkProhibitedGoods,
  generateQuoteBreakdown,
  recalculateVerifiedQuote,
  calculateEligibleCashback,
  calculateEstimatedDeliveryDate,
} from './shipping-calculator.ts';

test('volumetric weight calculation matches industry divisor 5000', () => {
  // 50 x 40 x 30 = 60,000 / 5000 = 12.0 kg
  const vol = calculateVolumetricWeight(50, 40, 30);
  assert.equal(vol, 12.0);
});

test('chargeable weight takes maximum of actual and volumetric weight', () => {
  // Actual is 8kg, volumetric is 12kg -> chargeable is 12kg
  const chargeable1 = calculateChargeableWeight(8, 50, 40, 30);
  assert.equal(chargeable1, 12.0);

  // Actual is 15kg, volumetric is 12kg -> chargeable is 15kg
  const chargeable2 = calculateChargeableWeight(15, 50, 40, 30);
  assert.equal(chargeable2, 15.0);
});

test('prohibited goods detector catches forbidden items', () => {
  const safe = checkProhibitedGoods('Traditional Ankara fabrics and wooden carved crafts');
  assert.equal(safe.isProhibited, false);

  const danger = checkProhibitedGoods('Pack of aerosol spray cans and firearm accessories');
  assert.equal(danger.isProhibited, true);
  assert.ok(danger.matchedKeyword);
});

test('itemized quote calculates freight, jet fuel, free pickup, VAT and delivery date transparently', () => {
  const quote = generateQuoteBreakdown({
    destinationCountry: 'United Kingdom',
    actualWeightKg: 5,
    lengthCm: 20,
    widthCm: 20,
    heightCm: 20,
    tier: 'standard',
    pickupRequired: true,
  });

  assert.equal(quote.serviceTier, 'standard');
  assert.equal(quote.serviceName, 'Standard Air Courier');
  assert.ok(quote.freightCharge > 0);
  assert.ok(quote.jetFuelSurcharge > 0);
  assert.equal(quote.pickupCharge, 0); // Always free
  assert.equal(quote.protectionCharge, 0); // Always 0 / disabled in demo
  assert.ok(quote.vatAmount > 0);
  assert.equal(quote.totalAmount, quote.subtotal + quote.vatAmount);
  assert.ok(quote.estimatedDeliveryDisplay.length > 5);
});

test('estimated delivery date calculation advances business days avoiding weekends', () => {
  const base = new Date('2026-10-26T10:00:00Z'); // Monday
  const priorityEst = calculateEstimatedDeliveryDate(base, 'priority');
  assert.equal(priorityEst.daysCount, 3);
  assert.ok(priorityEst.displayDate.includes('2026'));

  const standardEst = calculateEstimatedDeliveryDate(base, 'standard');
  assert.equal(standardEst.daysCount, 5);
  assert.ok(standardEst.displayDate.includes('2026'));
});

test('unsupported priority route falls back to standard service', () => {
  const quote = generateQuoteBreakdown({
    destinationCountry: 'Greenland (Remote)',
    actualWeightKg: 5,
    lengthCm: 20,
    widthCm: 20,
    heightCm: 20,
    tier: 'priority', // requested priority
    pickupRequired: false,
  });

  assert.equal(quote.serviceTier, 'standard'); // fell back safely because remote destination does not support Priority
  assert.equal(quote.serviceName, 'Standard Air Courier');
});

test('recalculateVerifiedQuote detects discrepancy when weight increases', () => {
  const original = generateQuoteBreakdown({
    destinationCountry: 'United States',
    actualWeightKg: 3,
    lengthCm: 20,
    widthCm: 20,
    heightCm: 20,
    tier: 'standard',
    pickupRequired: true,
  });

  const revised = recalculateVerifiedQuote(original, 'United States', 6, 20, 20, 20);
  assert.equal(revised.isDiscrepancyRevised, true);
  assert.ok(revised.totalAmount > original.totalAmount);
  assert.ok(revised.discrepancyReason?.includes('Verified chargeable weight increased'));
});

test('cashback is zero for pending shipments and only releases on delivery', () => {
  const quote = generateQuoteBreakdown({
    destinationCountry: 'United Kingdom',
    actualWeightKg: 5,
    lengthCm: 20,
    widthCm: 20,
    heightCm: 20,
    tier: 'standard',
    pickupRequired: true,
  });

  const inTransit = calculateEligibleCashback(quote, 'in_transit');
  assert.equal(inTransit.isEligible, false);
  assert.equal(inTransit.amountNgn, 0);

  const delivered = calculateEligibleCashback(quote, 'delivered');
  assert.equal(delivered.isEligible, true);
  assert.ok(delivered.amountNgn > 0);
});
