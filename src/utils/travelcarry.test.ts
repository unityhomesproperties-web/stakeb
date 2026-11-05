import { test } from 'node:test';
import assert from 'node:assert';
import { SwiftShareCategory, SwiftShareStatus } from '../types';

// Pure helper logic for SwiftShare
export const APPROVED_PILOT_ROUTES = [
  { origin: 'Lagos, Nigeria', destination: 'London, United Kingdom' },
  { origin: 'Lagos, Nigeria', destination: 'Manchester, United Kingdom' },
  { origin: 'Lagos, Nigeria', destination: 'New York, United States' },
  { origin: 'Lagos, Nigeria', destination: 'Atlanta, United States' },
  { origin: 'Lagos, Nigeria', destination: 'Houston, United States' },
  { origin: 'Lagos, Nigeria', destination: 'Toronto, Canada' },
  { origin: 'Lagos, Nigeria', destination: 'Calgary, Canada' },
  { origin: 'Lagos, Nigeria', destination: 'Dubai, United Arab Emirates' },
  { origin: 'Abuja, Nigeria', destination: 'London, United Kingdom' },
];

export function isRouteApproved(originCity: string, originCountry: string, destCity: string, destCountry: string): boolean {
  const norm = (str: string) => str.trim().toLowerCase();
  return APPROVED_PILOT_ROUTES.some(
    (r) =>
      norm(r.origin).includes(norm(originCity)) &&
      norm(r.origin).includes(norm(originCountry)) &&
      norm(r.destination).includes(norm(destCity)) &&
      norm(r.destination).includes(norm(destCountry))
  );
}

export function isCategoryBookable(category: SwiftShareCategory): { bookable: boolean; reason?: string } {
  if (category === 'hair_wigs') {
    return {
      bookable: false,
      reason: 'Human hair & wigs category is currently under regulatory and customs review. Booking is temporarily disabled.',
    };
  }
  return { bookable: true };
}

export function evaluateEscrowRelease(status: SwiftShareStatus, recipientConfirmed: boolean, isSafetyHold?: boolean): { canRelease: boolean; reason: string } {
  if (isSafetyHold) {
    return { canRelease: false, reason: 'Escrow frozen due to active Safety Hold exception.' };
  }
  if (!recipientConfirmed) {
    return { canRelease: false, reason: 'Escrow remains held until recipient inspects tamper seal and confirms delivery.' };
  }
  if (status !== 'delivered') {
    return { canRelease: true, reason: 'Recipient confirmed seal integrity; escrow is eligible for release.' };
  }
  return { canRelease: false, reason: 'Payout has already been released.' };
}

test('SwiftShare: clothing and documents are bookable, hair & wigs is unbookable under review', () => {
  assert.strictEqual(isCategoryBookable('clothing').bookable, true);
  assert.strictEqual(isCategoryBookable('documents').bookable, true);
  const hairCheck = isCategoryBookable('hair_wigs');
  assert.strictEqual(hairCheck.bookable, false);
  assert.match(hairCheck.reason || '', /under regulatory and customs review/);
});

test('SwiftShare: route approval matches certified corridors', () => {
  assert.strictEqual(isRouteApproved('Lagos', 'Nigeria', 'London', 'United Kingdom'), true);
  assert.strictEqual(isRouteApproved('Lagos', 'Nigeria', 'New York', 'United States'), true);
  assert.strictEqual(isRouteApproved('Lagos', 'Nigeria', 'Dubai', 'United Arab Emirates'), true);
  assert.strictEqual(isRouteApproved('Lagos', 'Nigeria', 'Tokyo', 'Japan'), false);
  assert.strictEqual(isRouteApproved('Kano', 'Nigeria', 'Sydney', 'Australia'), false);
});

test('SwiftShare: escrow payout cannot release before recipient confirms delivery', () => {
  const pendingRelease = evaluateEscrowRelease('in_transit', false);
  assert.strictEqual(pendingRelease.canRelease, false);
  assert.match(pendingRelease.reason, /Escrow remains held/);

  const confirmedRelease = evaluateEscrowRelease('in_transit', true);
  assert.strictEqual(confirmedRelease.canRelease, true);
});

test('SwiftShare: active safety hold prevents escrow release even if confirmed', () => {
  const safetyHold = evaluateEscrowRelease('in_transit', true, true);
  assert.strictEqual(safetyHold.canRelease, false);
  assert.match(safetyHold.reason, /Safety Hold/);
});
