import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePriorityPickupFee,
  evaluateCollectionOptions,
  getActiveDropoffBranches,
} from './collection-options';
import { Branch } from '../types';

const SAMPLE_BRANCHES: Branch[] = [
  {
    id: 'b_ikeja',
    code: 'LOS-IKJ',
    name: 'Ikeja Cargo Hub',
    address: 'Plot 12 Commercial Ave, Ikeja',
    city: 'Lagos',
    phone: '+234 1 291 0011',
    email: 'ikeja@swiftvero.com',
    status: 'active',
    staffCount: 3,
    managerName: 'Kemi',
    operatingHours: 'Mon-Sat 8am - 6pm',
  },
  {
    id: 'b_closed',
    code: 'KNO-HUB',
    name: 'Kano Temporary Point',
    address: 'Kano Road',
    city: 'Kano',
    phone: '+234 64 000 0000',
    email: 'kano@swiftvero.com',
    status: 'inactive',
    staffCount: 0,
    managerName: 'None',
  },
];

test('evaluateCollectionOptions - Lagos exposes Standard Pickup (free), Priority Pickup (with fee), and active Drop-off branches', () => {
  const res = evaluateCollectionOptions({
    state: 'Lagos',
    city: 'Ikeja',
    activeDispatchLoad: 2,
    branches: SAMPLE_BRANCHES,
    shipmentCount: 1,
    totalEstimatedWeightKg: 4,
  });

  assert.equal(res.standardPickup.available, true);
  assert.equal(res.standardPickup.feeNgn, 0);
  assert.equal(res.priorityPickup.available, true);
  assert.equal(res.priorityPickup.feeNgn, 3500);
  assert.match(res.priorityPickup.estimatedWindow, /1 – 6 hours/);
  assert.equal(res.dropoff.available, true);
  assert.equal(res.dropoff.branches.length, 1);
  assert.equal(res.dropoff.branches[0].id, 'b_ikeja');
});

test('evaluateCollectionOptions - High dispatch load disables Priority Pickup cleanly with Standard/Drop-off fallback', () => {
  const res = evaluateCollectionOptions({
    state: 'Lagos',
    city: 'Lekki',
    activeDispatchLoad: 9,
    branches: SAMPLE_BRANCHES,
  });

  assert.equal(res.priorityPickup.available, false);
  assert.equal(res.priorityPickup.feeNgn, 0);
  assert.match(res.priorityPickup.unavailableReason || '', /committed/);
  assert.equal(res.standardPickup.available, true);
  assert.equal(res.dropoff.available, true);
});

test('evaluateCollectionOptions - Unsupported state disables Priority Pickup and explains Drop-off option', () => {
  const res = evaluateCollectionOptions({
    state: 'Enugu',
    city: 'Enugu',
    activeDispatchLoad: 1,
    branches: SAMPLE_BRANCHES,
  });

  assert.equal(res.standardPickup.available, false);
  assert.equal(res.priorityPickup.available, false);
  assert.match(res.priorityPickup.unavailableReason || '', /not available/);
  assert.equal(res.dropoff.available, true);
});

test('calculatePriorityPickupFee - Scales dynamically with Abuja base and extra packages/weight', () => {
  const baseAbuja = calculatePriorityPickupFee({ state: 'Abuja', shipmentCount: 1, totalEstimatedWeightKg: 3 });
  const heavyMultiLagos = calculatePriorityPickupFee({ state: 'Lagos', shipmentCount: 4, totalEstimatedWeightKg: 18 });

  assert.equal(baseAbuja, 4000);
  assert.equal(heavyMultiLagos, 3500 + 1500 + 1500);
});

test('getActiveDropoffBranches - Excludes inactive hubs', () => {
  const active = getActiveDropoffBranches(SAMPLE_BRANCHES);
  assert.equal(active.length, 1);
  assert.equal(active[0].code, 'LOS-IKJ');
});
