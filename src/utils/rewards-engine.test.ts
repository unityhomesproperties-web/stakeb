import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canReleaseDeliveryReward,
  computeCustomerRewardBreakdown,
} from './rewards-engine';
import { CashbackLedgerItem, CustomerProfile, ReferralItem } from '../types';

const AMARA: CustomerProfile = {
  id: 'cust_01_verified',
  name: 'Amara Okafor',
  email: 'amara@crafts.ng',
  phone: '+234 803 555 0192',
  customerType: 'individual',
  kycStatus: 'verified',
  walletBalance: 75000,
  cashbackBalance: 24500,
  promotionalRewardsNgn: 0,
  referralCode: 'SWV-AMARA26',
  referralsCount: 1,
  termsAcceptedAt: '2026-09-14T09:30:00Z',
};

const SEUN_ZERO: CustomerProfile = {
  id: 'cust_03_new',
  name: 'Oluwaseun Adeleke',
  email: 'seun@gmail.com',
  phone: '+234 701 999 3320',
  customerType: 'individual',
  kycStatus: 'not_started',
  walletBalance: 0,
  cashbackBalance: 0,
  referralCode: 'SWV-SEUN26',
  referralsCount: 0,
  termsAcceptedAt: '2026-10-24T10:00:00Z',
};

const LEDGER: CashbackLedgerItem[] = [
  {
    id: 'cb_1',
    customerId: 'cust_01_verified',
    shipmentId: 'ship_02',
    trackingNumber: 'SWV-2026-NG3102',
    amountNgn: 3960,
    type: 'cashback_earned',
    status: 'released',
    description: 'Cashback',
    createdAt: '2026-10-20T15:15:00Z',
  },
  {
    id: 'cb_2',
    customerId: 'cust_01_verified',
    shipmentId: 'ship_01',
    trackingNumber: 'SWV-2026-NG8491',
    amountNgn: 3621,
    type: 'cashback_earned',
    status: 'pending',
    description: 'Pending cashback',
    createdAt: '2026-10-20T11:00:00Z',
  },
];

const REFERRALS: ReferralItem[] = [
  {
    id: 'ref_01',
    referrerCode: 'SWV-AMARA26',
    refereeName: 'Kehinde',
    refereeEmail: 'k@gmail.com',
    status: 'qualifying_shipment_completed',
    bonusNgn: 5000,
    date: '2026-10-16',
  },
];

test('computeCustomerRewardBreakdown - Strictly separates deposited wallet cash from cashback and referral credits', () => {
  const amaraRewards = computeCustomerRewardBreakdown({
    customer: AMARA,
    ledger: LEDGER,
    referrals: REFERRALS,
  });

  assert.equal(amaraRewards.depositedWalletBalance, 75000);
  assert.equal(amaraRewards.cashbackEarnedNgn, 3960);
  assert.equal(amaraRewards.referralBonusEarnedNgn, 5000);
  assert.equal(amaraRewards.pendingCreditsNgn, 3621);
  assert.equal(amaraRewards.availableRedeemableCredits, 24500);
  assert.equal(amaraRewards.qualifiedReferralCount, 1);
  assert.equal(amaraRewards.hasAnyRewards, true);

  // Zero-balance new customer must NOT inherit another customer's ledger/referrals
  const seunRewards = computeCustomerRewardBreakdown({
    customer: SEUN_ZERO,
    ledger: LEDGER,
    referrals: REFERRALS,
  });

  assert.equal(seunRewards.depositedWalletBalance, 0);
  assert.equal(seunRewards.cashbackEarnedNgn, 0);
  assert.equal(seunRewards.referralBonusEarnedNgn, 0);
  assert.equal(seunRewards.availableRedeemableCredits, 0);
  assert.equal(seunRewards.hasAnyRewards, false);
});

test('canReleaseDeliveryReward - Enforces idempotency so duplicate rewards cannot be released for one shipment', () => {
  const dup = canReleaseDeliveryReward({
    existingLedger: LEDGER,
    shipmentId: 'ship_02',
    type: 'cashback_earned',
  });
  assert.equal(dup.eligible, false);

  const pendingOrNew = canReleaseDeliveryReward({
    existingLedger: LEDGER,
    shipmentId: 'ship_01',
    type: 'cashback_earned',
  });
  assert.equal(pendingOrNew.eligible, true);
});
