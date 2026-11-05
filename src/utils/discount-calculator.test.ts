import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDiscountCode,
  calculateCheckoutPricing,
  DEMO_DISCOUNT_CODES,
} from './discount-calculator';

test('validateDiscountCode - SWIFT10 applies 10% discount on 30,000 NGN', () => {
  const result = validateDiscountCode('SWIFT10', 30000);
  assert.equal(result.valid, true);
  assert.equal(result.discountAmountNgn, 3000);
  assert.equal(result.discount?.code, 'SWIFT10');
});

test('validateDiscountCode - SWIFT5K enforces minimum transaction threshold', () => {
  const belowThreshold = validateDiscountCode('SWIFT5K', 25000);
  assert.equal(belowThreshold.valid, false);
  assert.match(belowThreshold.error || '', /requires a minimum shipment total/);

  const atThreshold = validateDiscountCode('SWIFT5K', 40000);
  assert.equal(atThreshold.valid, true);
  assert.equal(atThreshold.discountAmountNgn, 5000);
});

test('validateDiscountCode - EXPIRED20 rejects expired codes', () => {
  const result = validateDiscountCode('EXPIRED20', 50000);
  assert.equal(result.valid, false);
  assert.match(result.error || '', /expired/);
});

test('calculateCheckoutPricing - Strict calculation sequence for demo scenario (30k - 10% - 5k = 22k)', () => {
  const calculation = calculateCheckoutPricing({
    originalQuotationNgn: 30000,
    discountCode: 'SWIFT10',
    creditsToApplyNgn: 5000,
    availableCreditBalanceNgn: 24500,
  });

  assert.equal(calculation.originalQuotationNgn, 30000);
  assert.equal(calculation.discountAmountNgn, 3000);
  assert.equal(calculation.subtotalAfterDiscountNgn, 27000);
  assert.equal(calculation.creditsAppliedNgn, 5000);
  assert.equal(calculation.finalPayableNgn, 22000);
  assert.equal(calculation.remainingCreditBalanceNgn, 19500);
});

test('calculateCheckoutPricing - Credits capped at available balance and subtotal', () => {
  const calculation = calculateCheckoutPricing({
    originalQuotationNgn: 10000,
    discountCode: undefined,
    creditsToApplyNgn: 15000, // wants to apply more than subtotal
    availableCreditBalanceNgn: 20000,
  });

  assert.equal(calculation.creditsAppliedNgn, 10000);
  assert.equal(calculation.finalPayableNgn, 0);
  assert.equal(calculation.remainingCreditBalanceNgn, 10000);
});
