import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProtectionPremium,
  isItemExcludedFromProtection,
  DEFAULT_PROTECTION_CONFIG,
  generateProtectionReference,
} from './protection-calculator';

test('calculateProtectionPremium - Basic plan returns 0 premium with standard liability limit', () => {
  const result = calculateProtectionPremium({
    plan: 'basic',
    declaredValueNgn: 200000,
  });

  assert.equal(result.plan, 'basic');
  assert.equal(result.calculatedPremiumNgn, 0);
  assert.equal(result.coverageLimitNgn, DEFAULT_PROTECTION_CONFIG.basicLiabilityLimitNgn);
  assert.equal(result.minPremiumApplied, false);
});

test('calculateProtectionPremium - Premium plan calculates 1.5% of 200,000 NGN correctly to 3,000 NGN', () => {
  const result = calculateProtectionPremium({
    plan: 'premium',
    declaredValueNgn: 200000,
  });

  assert.equal(result.plan, 'premium');
  assert.equal(result.totalDeclaredValueNgn, 200000);
  assert.equal(result.eligibleDeclaredValueNgn, 200000);
  assert.equal(result.premiumRatePercentage, 1.5);
  assert.equal(result.calculatedPremiumNgn, 3000); // 200,000 * 1.5% = 3,000
  assert.equal(result.coverageLimitNgn, 200000);
  assert.equal(result.minPremiumApplied, false);
});

test('calculateProtectionPremium - Enforces minimum premium threshold for low-value parcels', () => {
  const result = calculateProtectionPremium({
    plan: 'premium',
    declaredValueNgn: 15000, // below min threshold (20k)
  });

  assert.equal(result.plan, 'premium');
  assert.equal(result.calculatedPremiumNgn, DEFAULT_PROTECTION_CONFIG.minPremiumNgn);
  assert.equal(result.minPremiumApplied, true);
});

test('calculateProtectionPremium - Handles multiple items and excludes prohibited/cash goods from premium base', () => {
  const items = [
    { id: '1', description: 'Traditional Handwoven Aso-Oke', quantity: 1, declaredValue: 120000 },
    { id: '2', description: 'Carved Wooden Artifacts', quantity: 1, declaredValue: 80000 },
    { id: '3', description: 'Cash banknotes gift envelope', quantity: 1, declaredValue: 50000 }, // strictly excluded!
  ];

  const result = calculateProtectionPremium({
    plan: 'premium',
    declaredValueNgn: 250000,
    items,
  });

  assert.equal(result.totalDeclaredValueNgn, 250000);
  assert.equal(result.eligibleDeclaredValueNgn, 200000); // 120k + 80k, cash excluded
  assert.equal(result.excludedDeclaredValueNgn, 50000);
  // 1.5% of 200,000 = 3,000 NGN
  assert.equal(result.calculatedPremiumNgn, 3000);
  assert.equal(result.coverageLimitNgn, 200000);
});

test('isItemExcludedFromProtection - Correctly flags cash, bullion, and hazardous items', () => {
  assert.equal(isItemExcludedFromProtection('Lekki gold bar coins').excluded, true);
  assert.equal(isItemExcludedFromProtection('Raw unpasteurized perishable meat').excluded, true);
  assert.equal(isItemExcludedFromProtection('Cotton shirts and leather shoes').excluded, false);
});

test('generateProtectionReference - Formats reference code with PROT-2026 prefix', () => {
  const ref = generateProtectionReference('SWV-2026-NG8491');
  assert.match(ref, /^PROT-2026-[A-Z0-9]+$/);
});
