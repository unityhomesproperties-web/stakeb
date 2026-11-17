import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAdjustmentReference,
  generateBookingGroupReference,
  generatePaymentReference,
  generatePickupReference,
  generateQuoteReference,
  generateShipmentReference,
  isValidReferenceFormat,
} from './references';

test('Reference generators create strictly separated format codes matching YY-XXXXXX', () => {
  const date = new Date('2026-11-14T12:00:00Z');
  const qte = generateQuoteReference([], date);
  const bkg = generateBookingGroupReference([], date);
  const swv = generateShipmentReference([], date);
  const pkp = generatePickupReference([], date);
  const pay = generatePaymentReference([], date);
  const adj = generateAdjustmentReference([], date);

  assert.match(qte, /^QTE-26-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  assert.match(bkg, /^BKG-26-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  assert.match(swv, /^SWV-26-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  assert.match(pkp, /^PKP-26-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  assert.match(pay, /^PAY-26-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  assert.match(adj, /^ADJ-26-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);

  assert.equal(isValidReferenceFormat(qte, 'QTE'), true);
  assert.equal(isValidReferenceFormat(bkg, 'BKG'), true);
  assert.equal(isValidReferenceFormat(swv, 'SWV'), true);
  assert.equal(isValidReferenceFormat('SWV-2026-NG8491', 'SWV'), true);
  assert.equal(isValidReferenceFormat(qte, 'SWV'), false);
});

test('Reference generators avoid collisions against existing codes', () => {
  const date = new Date('2026-11-14T12:00:00Z');
  const existing = new Set<string>();
  for (let i = 0; i < 150; i++) {
    const code = generateShipmentReference(existing, date);
    assert.equal(existing.has(code), false);
    existing.add(code);
  }
  assert.equal(existing.size, 150);
});
