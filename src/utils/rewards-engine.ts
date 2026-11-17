import {
  BonusGrantRecord,
  CashbackLedgerItem,
  CustomerProfile,
  PaymentAdjustmentRecord,
  PaystackOutcome,
  ReferralItem,
  ServiceTier,
  ShipmentCreditRecord,
  ShipmentRecord,
} from '../types';

export interface CustomerRewardBreakdown {
  depositedWalletBalance: number;
  cashbackEarnedNgn: number;
  referralBonusEarnedNgn: number;
  promotionalRewardsNgn: number;
  pendingCreditsNgn: number;
  redeemedCreditsNgn: number;
  availableRedeemableCredits: number;
  qualifiedReferralCount: number;
  totalReferralInvites: number;
  hasAnyRewards: boolean;
}

export function computeCustomerRewardBreakdown(params: {
  customer: CustomerProfile;
  ledger: CashbackLedgerItem[];
  referrals: ReferralItem[];
}): CustomerRewardBreakdown {
  const { customer, ledger, referrals } = params;

  const myLedger = ledger.filter((item) => item.customerId === customer.id);
  const myReferrals = referrals.filter(
    (ref) =>
      ref.referrerId === customer.id ||
      ref.referrerCode.toUpperCase() === customer.referralCode.toUpperCase()
  );

  const ledgerCashbackEarned = myLedger
    .filter(
      (item) =>
        (item.status === 'released' || item.status === 'eligible') &&
        item.amountNgn > 0 &&
        item.type !== 'referral_bonus'
    )
    .reduce((sum, item) => sum + item.amountNgn, 0);

  const ledgerReferralEarned = myLedger
    .filter(
      (item) =>
        (item.status === 'released' || item.status === 'eligible') &&
        item.amountNgn > 0 &&
        item.type === 'referral_bonus'
    )
    .reduce((sum, item) => sum + item.amountNgn, 0);

  const qualifiedRefs = myReferrals.filter(
    (r) => r.status === 'qualifying_shipment_completed' || r.status === 'bonus_released'
  );
  const refArrayEarned = qualifiedRefs.reduce((sum, r) => sum + Math.max(0, r.bonusNgn), 0);

  const cashbackEarnedNgn = Math.max(customer.earnedCashbackNgn || 0, ledgerCashbackEarned);
  const referralBonusEarnedNgn = Math.max(
    customer.earnedReferralBonusNgn || 0,
    ledgerReferralEarned,
    refArrayEarned
  );
  const promotionalRewardsNgn = customer.promotionalRewardsNgn || 0;

  const pendingCreditsNgn = myLedger
    .filter((item) => item.status === 'pending' && item.amountNgn > 0)
    .reduce((sum, item) => sum + item.amountNgn, 0);

  const redeemedCreditsNgn = myLedger
    .filter((item) => item.amountNgn < 0 || item.type === 'credits_redeemed')
    .reduce((sum, item) => sum + Math.abs(item.amountNgn), 0);

  const depositedWalletBalance = customer.walletBalance || 0;
  const availableRedeemableCredits = customer.cashbackBalance || 0;

  const hasAnyRewards =
    cashbackEarnedNgn > 0 ||
    referralBonusEarnedNgn > 0 ||
    promotionalRewardsNgn > 0 ||
    pendingCreditsNgn > 0 ||
    availableRedeemableCredits > 0 ||
    myReferrals.length > 0;

  return {
    depositedWalletBalance,
    cashbackEarnedNgn,
    referralBonusEarnedNgn,
    promotionalRewardsNgn,
    pendingCreditsNgn,
    redeemedCreditsNgn,
    availableRedeemableCredits,
    qualifiedReferralCount: qualifiedRefs.length,
    totalReferralInvites: myReferrals.length,
    hasAnyRewards,
  };
}

export function canReleaseDeliveryReward(params: {
  existingLedger: CashbackLedgerItem[];
  shipmentId: string;
  type: 'cashback_earned' | 'referral_bonus';
}): { eligible: boolean; reason?: string } {
  const alreadyReleased = params.existingLedger.some(
    (entry) =>
      entry.shipmentId === params.shipmentId &&
      entry.type === params.type &&
      (entry.status === 'released' || entry.status === 'eligible')
  );

  if (alreadyReleased) {
    return {
      eligible: false,
      reason: `Reward of type "${params.type}" was already released for shipment ${params.shipmentId}.`,
    };
  }

  return { eligible: true };
}

export interface SeparatedCustomerBalances {
  availableAccountCreditNgn: number;
  cashbackBalanceNgn: number;
  activeBonusBalanceNgn: number;
  expiredBonusBalanceNgn: number;
  depositedWalletBalanceNgn: number;
  outstandingAmountNgn: number;
  availableCreditRecords: ShipmentCreditRecord[];
  activeBonusGrants: BonusGrantRecord[];
  expiredBonusGrants: BonusGrantRecord[];
}

export function getCustomerSeparatedBalances(params: {
  customer: CustomerProfile;
  credits: ShipmentCreditRecord[];
  bonusGrants: BonusGrantRecord[];
  shipments: ShipmentRecord[];
  adjustments: PaymentAdjustmentRecord[];
  now?: Date;
}): SeparatedCustomerBalances {
  const now = params.now || new Date();
  const cid = params.customer.id;

  const availableCreditRecords = params.credits.filter(
    (c) =>
      c.customerId === cid &&
      (c.status === 'available' || c.status === 'partially_used') &&
      c.remainingCreditNgn > 0 &&
      (!c.expiresAt || new Date(c.expiresAt).getTime() >= now.getTime())
  );

  const creditFromRecords = availableCreditRecords.reduce(
    (sum, c) => sum + Math.max(0, c.remainingCreditNgn),
    0
  );
  const availableAccountCreditNgn =
    availableCreditRecords.length > 0
      ? creditFromRecords
      : Math.max(0, params.customer.accountCreditNgn || 0);

  const cashbackBalanceNgn = Math.max(0, params.customer.cashbackBalance || 0);

  const customerGrants = params.bonusGrants.filter((g) => g.customerId === cid);
  const activeBonusGrants = customerGrants.filter(
    (g) =>
      g.status === 'active' &&
      g.remainingAmountNgn > 0 &&
      new Date(g.expiresAt).getTime() >= now.getTime()
  );
  const expiredBonusGrants = customerGrants.filter(
    (g) =>
      g.status === 'expired' ||
      (g.remainingAmountNgn > 0 && new Date(g.expiresAt).getTime() < now.getTime())
  );

  const activeBonusBalanceNgn = activeBonusGrants.reduce(
    (sum, g) => sum + Math.max(0, g.remainingAmountNgn),
    0
  );
  const expiredBonusBalanceNgn = expiredBonusGrants.reduce(
    (sum, g) => sum + Math.max(0, g.remainingAmountNgn),
    0
  );

  const depositedWalletBalanceNgn = Math.max(0, params.customer.walletBalance || 0);

  // Outstanding amount owed = pending positive weight adjustments + unpaid shipments awaiting payment
  const pendingAdjIds = new Set<string>();
  const adjOutstanding = params.adjustments
    .filter((a) => {
      const delta = a.deltaNgn ?? a.differenceNgn;
      return (
        a.customerId === cid &&
        delta > 0 &&
        (a.status === 'pending_customer_approval' || a.status === 'pending')
      );
    })
    .reduce((sum, a) => {
      pendingAdjIds.add(a.shipmentId);
      return sum + (a.deltaNgn ?? a.differenceNgn);
    }, 0);

  const unpaidShipmentsOutstanding = params.shipments
    .filter(
      (s) =>
        s.customerId === cid &&
        !pendingAdjIds.has(s.id) &&
        s.status !== 'cancelled' &&
        s.status !== 'draft' &&
        s.paymentStatus !== 'paid' &&
        ['quote_ready', 'pending_reweigh_approval', 'awaiting_customer_approval', 'quote_approved', 'payment_pending', 'awaiting_payment'].includes(
          s.status
        )
    )
    .reduce((sum, s) => sum + Math.max(0, s.quote.totalAmount - (s.originalPaidAmountNgn || 0)), 0);

  return {
    availableAccountCreditNgn,
    cashbackBalanceNgn,
    activeBonusBalanceNgn,
    expiredBonusBalanceNgn,
    depositedWalletBalanceNgn,
    outstandingAmountNgn: adjOutstanding + unpaidShipmentsOutstanding,
    availableCreditRecords,
    activeBonusGrants,
    expiredBonusGrants,
  };
}

export interface CheckoutDeductionAllocationResult {
  valid: boolean;
  originalPayableNgn: number;
  accountCreditAppliedNgn: number;
  cashbackAppliedNgn: number;
  bonusAppliedNgn: number;
  totalDeductionsNgn: number;
  remainingPaystackNgn: number;
  requiresExternalGateway: boolean;
  eligibleBonusBalanceNgn: number;
  appliedBonusGrantAllocations: Array<{ grantId: string; amountNgn: number }>;
  warnings: string[];
  error?: string;
}

export function allocateCheckoutDeductions(params: {
  payableNgn: number;
  availableAccountCreditNgn: number;
  cashbackBalanceNgn: number;
  bonusGrants: BonusGrantRecord[];
  serviceTier: ServiceTier;
  destinationCountry: string;
  requestedAccountCreditNgn?: number;
  requestedCashbackNgn?: number;
  requestedBonusNgn?: number;
  now?: Date;
}): CheckoutDeductionAllocationResult {
  const now = params.now || new Date();
  const payable = Math.max(0, Math.round(params.payableNgn));
  const warnings: string[] = [];

  const reqCredit = Number(params.requestedAccountCreditNgn || 0);
  const reqCashback = Number(params.requestedCashbackNgn || 0);
  const reqBonus = Number(params.requestedBonusNgn || 0);

  if (reqCredit < 0 || reqCashback < 0 || reqBonus < 0) {
    return {
      valid: false,
      originalPayableNgn: payable,
      accountCreditAppliedNgn: 0,
      cashbackAppliedNgn: 0,
      bonusAppliedNgn: 0,
      totalDeductionsNgn: 0,
      remainingPaystackNgn: payable,
      requiresExternalGateway: payable > 0,
      eligibleBonusBalanceNgn: 0,
      appliedBonusGrantAllocations: [],
      warnings: [],
      error: 'Deduction amounts cannot be negative.',
    };
  }

  const eligibleGrants = params.bonusGrants.filter((g) => {
    const notExpired = g.status === 'active' && new Date(g.expiresAt).getTime() >= now.getTime();
    const serviceOk =
      g.eligibleServices.length === 0 || g.eligibleServices.includes(params.serviceTier);
    const destOk =
      g.eligibleDestinations.length === 0 ||
      g.eligibleDestinations.includes('All') ||
      g.eligibleDestinations.includes(params.destinationCountry);
    return notExpired && serviceOk && destOk && g.remainingAmountNgn > 0;
  });

  const eligibleBonusBalanceNgn = eligibleGrants.reduce(
    (sum, g) => sum + Math.max(0, g.remainingAmountNgn),
    0
  );

  if (reqBonus > 0 && eligibleBonusBalanceNgn === 0) {
    const hasExpired = params.bonusGrants.some(
      (g) => g.remainingAmountNgn > 0 && new Date(g.expiresAt).getTime() < now.getTime()
    );
    warnings.push(
      hasExpired
        ? 'Expired bonus balance cannot be redeemed.'
        : 'No bonus balance is eligible for this route or service tier.'
    );
  }

  if (reqCredit > params.availableAccountCreditNgn) {
    return {
      valid: false,
      originalPayableNgn: payable,
      accountCreditAppliedNgn: 0,
      cashbackAppliedNgn: 0,
      bonusAppliedNgn: 0,
      totalDeductionsNgn: 0,
      remainingPaystackNgn: payable,
      requiresExternalGateway: payable > 0,
      eligibleBonusBalanceNgn,
      appliedBonusGrantAllocations: [],
      warnings,
      error: `Requested account credit (₦${reqCredit.toLocaleString()}) exceeds available balance (₦${params.availableAccountCreditNgn.toLocaleString()}).`,
    };
  }

  if (reqCashback > params.cashbackBalanceNgn) {
    return {
      valid: false,
      originalPayableNgn: payable,
      accountCreditAppliedNgn: 0,
      cashbackAppliedNgn: 0,
      bonusAppliedNgn: 0,
      totalDeductionsNgn: 0,
      remainingPaystackNgn: payable,
      requiresExternalGateway: payable > 0,
      eligibleBonusBalanceNgn,
      appliedBonusGrantAllocations: [],
      warnings,
      error: `Requested cashback (₦${reqCashback.toLocaleString()}) exceeds available Cashback Balance (₦${params.cashbackBalanceNgn.toLocaleString()}).`,
    };
  }

  if (reqBonus > eligibleBonusBalanceNgn) {
    return {
      valid: false,
      originalPayableNgn: payable,
      accountCreditAppliedNgn: 0,
      cashbackAppliedNgn: 0,
      bonusAppliedNgn: 0,
      totalDeductionsNgn: 0,
      remainingPaystackNgn: payable,
      requiresExternalGateway: payable > 0,
      eligibleBonusBalanceNgn,
      appliedBonusGrantAllocations: [],
      warnings,
      error: `Requested bonus (₦${reqBonus.toLocaleString()}) exceeds eligible Bonus Balance (₦${eligibleBonusBalanceNgn.toLocaleString()}).`,
    };
  }

  // Cap sequentially against payable amount (Account Credit -> Cashback -> Bonus)
  let remainingToCover = payable;
  const accountCreditAppliedNgn = Math.min(remainingToCover, Math.round(reqCredit));
  remainingToCover -= accountCreditAppliedNgn;

  const cashbackAppliedNgn = Math.min(remainingToCover, Math.round(reqCashback));
  remainingToCover -= cashbackAppliedNgn;

  const bonusAppliedNgn = Math.min(remainingToCover, Math.round(reqBonus));
  remainingToCover -= bonusAppliedNgn;

  // Allocate across eligible bonus grants FIFO by earliest expiry
  let bonusToAllocate = bonusAppliedNgn;
  const sortedGrants = [...eligibleGrants].sort(
    (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
  );
  const appliedBonusGrantAllocations: Array<{ grantId: string; amountNgn: number }> = [];
  for (const grant of sortedGrants) {
    if (bonusToAllocate <= 0) break;
    const take = Math.min(bonusToAllocate, grant.remainingAmountNgn);
    if (take > 0) {
      appliedBonusGrantAllocations.push({ grantId: grant.id, amountNgn: take });
      bonusToAllocate -= take;
    }
  }

  const totalDeductionsNgn = accountCreditAppliedNgn + cashbackAppliedNgn + bonusAppliedNgn;
  const remainingPaystackNgn = Math.max(0, payable - totalDeductionsNgn);

  return {
    valid: true,
    originalPayableNgn: payable,
    accountCreditAppliedNgn,
    cashbackAppliedNgn,
    bonusAppliedNgn,
    totalDeductionsNgn,
    remainingPaystackNgn,
    requiresExternalGateway: remainingPaystackNgn > 0,
    eligibleBonusBalanceNgn,
    appliedBonusGrantAllocations,
    warnings,
  };
}

export function resolveCheckoutReservationOutcome(params: {
  outcome: PaystackOutcome;
  reservedCreditNgn: number;
  reservedCashbackNgn: number;
  reservedBonusNgn: number;
}): {
  settled: boolean;
  creditDeductedNgn: number;
  cashbackDeductedNgn: number;
  bonusDeductedNgn: number;
  releasedBackToCustomer: boolean;
} {
  if (params.outcome === 'success') {
    return {
      settled: true,
      creditDeductedNgn: Math.max(0, Math.round(params.reservedCreditNgn)),
      cashbackDeductedNgn: Math.max(0, Math.round(params.reservedCashbackNgn)),
      bonusDeductedNgn: Math.max(0, Math.round(params.reservedBonusNgn)),
      releasedBackToCustomer: false,
    };
  }
  return {
    settled: false,
    creditDeductedNgn: 0,
    cashbackDeductedNgn: 0,
    bonusDeductedNgn: 0,
    releasedBackToCustomer: true,
  };
}
