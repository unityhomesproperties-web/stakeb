import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSubmitReviewForShipment,
  getPublicApprovedReviews,
} from './review-rules';
import { CustomerReview, ShipmentRecord } from '../types';

const DELIVERED_SHIPMENT = {
  id: 'ship_02',
  trackingNumber: 'SWV-2026-NG3102',
  customerId: 'cust_01_verified',
  status: 'delivered',
  hasReview: false,
} as ShipmentRecord;

const IN_TRANSIT_SHIPMENT = {
  id: 'ship_01',
  trackingNumber: 'SWV-2026-NG8491',
  customerId: 'cust_01_verified',
  status: 'in_transit',
  hasReview: false,
} as ShipmentRecord;

test('canSubmitReviewForShipment - Allows delivered owned shipment without existing review and blocks duplicates or in-transit', () => {
  const ok = canSubmitReviewForShipment({
    shipment: DELIVERED_SHIPMENT,
    existingReviews: [],
    customerId: 'cust_01_verified',
  });
  assert.equal(ok.eligible, true);

  const wrongOwner = canSubmitReviewForShipment({
    shipment: DELIVERED_SHIPMENT,
    existingReviews: [],
    customerId: 'cust_02_pending',
  });
  assert.equal(wrongOwner.eligible, false);

  const guestVerified = canSubmitReviewForShipment({
    shipment: DELIVERED_SHIPMENT,
    existingReviews: [],
    isVerifiedGuest: true,
  });
  assert.equal(guestVerified.eligible, true);

  const duplicate = canSubmitReviewForShipment({
    shipment: DELIVERED_SHIPMENT,
    existingReviews: [{ id: 'r1', shipmentId: 'ship_02', trackingNumber: 'SWV-2026-NG3102' } as CustomerReview],
    customerId: 'cust_01_verified',
  });
  assert.equal(duplicate.eligible, false);

  const notDelivered = canSubmitReviewForShipment({
    shipment: IN_TRANSIT_SHIPMENT,
    existingReviews: [],
    customerId: 'cust_01_verified',
  });
  assert.equal(notDelivered.eligible, false);
});

test('getPublicApprovedReviews - Only returns published and approved reviews', () => {
  const sample: CustomerReview[] = [
    { id: '1', status: 'published', moderationStatus: 'approved' } as CustomerReview,
    { id: '2', status: 'pending', moderationStatus: 'pending_review' } as CustomerReview,
    { id: '3', status: 'rejected', moderationStatus: 'rejected' } as CustomerReview,
    { id: '4', status: 'published', moderationStatus: 'disputed' } as CustomerReview,
  ];
  const publicList = getPublicApprovedReviews(sample);
  assert.equal(publicList.length, 1);
  assert.equal(publicList[0].id, '1');
});
