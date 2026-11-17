import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { formatNaira } from '../../utils/shipping-calculator';
import { computeCustomerRewardBreakdown } from '../../utils/rewards-engine';
import { PolicyKey } from '../common/LegalModal';
import {
  Coins,
  Gift,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Wallet,
  Users,
} from 'lucide-react';

interface RewardsViewProps {
  onOpenPolicy: (key: PolicyKey) => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ onOpenPolicy }) => {
  const {
    currentCustomer,
    cashbackLedger,
    referrals,
    setActiveCustomerTab,
    getCustomerBalancesSnapshot,
    shipmentCredits,
    bonusGrants,
  } = useDemo();
  const [copiedCode, setCopiedCode] = useState(false);

  const myLedger = cashbackLedger.filter((c) => c.customerId === currentCustomer.id);
  const myCredits = shipmentCredits.filter((c) => c.customerId === currentCustomer.id);
  const myGrants = bonusGrants.filter((g) => g.customerId === currentCustomer.id);
  const myReferrals = referrals.filter(
    (ref) =>
      ref.referrerId === currentCustomer.id ||
      ref.referrerCode.toUpperCase() === currentCustomer.referralCode.toUpperCase()
  );

  const breakdown = computeCustomerRewardBreakdown({
    customer: currentCustomer,
    ledger: cashbackLedger,
    referrals,
  });
  const separated = getCustomerBalancesSnapshot(currentCustomer.id);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCustomer.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#008EA8] dark:text-[#90E0EF]">
            Non-Withdrawable Shipping Credits
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Rewards, Cashback &amp; Referrals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            Shipping credits release only after confirmed delivery closure and eligibility reconciliation. Wallet cash funds are kept strictly separate.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCustomerTab('wallet')}
            className="min-h-[40px] px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5 text-[#00B4D8]" />
            <span>Wallet Cash: {formatNaira(breakdown.depositedWalletBalance)}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCustomerTab('retrieve_quote')}
            className="min-h-[40px] px-4 py-2 bg-[#00B4D8] hover:bg-[#009BB8] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>Redeem on Quote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="p-4 bg-[#CAF0F8]/50 dark:bg-sky-950/40 border border-[#90E0EF] dark:border-sky-800 rounded-2xl text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-[#008EA8] dark:text-[#90E0EF]">
          <ShieldCheck className="w-4 h-4 text-[#00B4D8] shrink-0" />
          <span>Clear Separation Between Deposited Cash &amp; Shipping Credits</span>
        </div>
        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
          Earned cashback, referral bonuses, and promotional credits are <strong>non-withdrawable shipping discounts</strong> applied at shipment checkout. Deposited wallet funds remain separate in your cash wallet.{' '}
          <button
            type="button"
            onClick={() => onOpenPolicy('cashback')}
            className="text-[#008EA8] dark:text-[#90E0EF] font-bold underline"
          >
            View Cashback &amp; Referral Terms
          </button>
        </p>
      </div>

      {/* Separated Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-800/90 rounded-2xl border-2 border-[#00B4D8] p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#008EA8] dark:text-[#90E0EF]">Available Account Credit</span>
            <Coins className="w-4 h-4 text-[#00B4D8]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#008EA8] dark:text-[#90E0EF] tabular-nums">
            {formatNaira(separated.availableAccountCreditNgn)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Overpayment credits ({separated.availableCreditRecords.length} active)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Cashback Balance</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatNaira(separated.cashbackBalanceNgn)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Earned post-delivery ({formatNaira(breakdown.cashbackEarnedNgn)} lifetime)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Bonus Balance (Active)</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatNaira(separated.activeBonusBalanceNgn)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {separated.activeBonusGrants.length} active grant{separated.activeBonusGrants.length === 1 ? '' : 's'}
            {separated.expiredBonusBalanceNgn > 0
              ? ` · ${formatNaira(separated.expiredBonusBalanceNgn)} expired`
              : ''}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Referral Invites</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {breakdown.qualifiedReferralCount} / {breakdown.totalReferralInvites}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {formatNaira(breakdown.referralBonusEarnedNgn)} earned from invites
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Pending Delivery</span>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
            {formatNaira(breakdown.pendingCreditsNgn)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Locked until delivery</p>
        </div>
      </div>

      {/* Active & Expired Bonus Grants + Shipment Overpayment Credits */}
      {(myCredits.length > 0 || myGrants.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Overpayment Account Credits ({myCredits.length})
            </h3>
            {myCredits.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No overpayment credits issued on your account.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                {myCredits.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {c.creditRef}
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Source: <span className="font-mono">{c.sourceTrackingNumber}</span> &bull; {c.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-bold text-[#008EA8] dark:text-[#90E0EF]">
                        {formatNaira(c.remainingCreditNgn)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Orig: {formatNaira(c.originalCreditNgn)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Promotional &amp; Referral Bonus Grants ({myGrants.length})
            </h3>
            {myGrants.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No active or expired bonus grants on your account.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                {myGrants.map((g) => {
                  const isExpired =
                    g.status === 'expired' || new Date(g.expiresAt).getTime() < Date.now();
                  return (
                    <div
                      key={g.id}
                      className={`py-2.5 flex items-center justify-between gap-2 ${
                        isExpired ? 'opacity-70' : ''
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{g.title}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isExpired
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : g.status === 'exhausted'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {isExpired ? 'Expired' : g.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {g.grantRef} &bull; Tiers: {g.eligibleServices.join(', ')} &bull; Routes: {g.eligibleDestinations.join(', ')} &bull; Expires {g.expiresAt.slice(0, 10)}
                        </div>
                      </div>
                      <div className="text-right tabular-nums shrink-0">
                        <div className={`font-bold ${isExpired ? 'line-through text-slate-400' : 'text-[#008EA8] dark:text-[#90E0EF]'}`}>
                          {formatNaira(g.remainingAmountNgn)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referral Section & How It Works */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#00B4D8]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Refer &amp; Earn Credits</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Share your unique referral code. Bonuses release only after your referred contact completes their first qualifying delivered shipment (self-referrals and refunded orders are excluded).
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
              Your Unique Referral Code
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentCustomer.referralCode}
                aria-label="Your unique referral code"
                className="w-full font-mono text-sm font-bold text-[#008EA8] dark:text-[#90E0EF] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
              />
              <button
                type="button"
                onClick={handleCopyCode}
                className="min-h-[40px] px-4 py-2 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 break-all">
              Link: <span className="font-mono text-slate-800 dark:text-slate-200">https://swiftvero.ng/join/{currentCustomer.referralCode}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Your Referral History ({myReferrals.length})
            </h4>
            {myReferrals.length === 0 ? (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
                <Users className="w-6 h-6 text-slate-400 mx-auto" />
                <p>No referrals yet. Share your code above to earn ₦5,000 per qualified delivery.</p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden text-xs">
                {myReferrals.map((ref) => (
                  <div key={ref.id} className="p-3 flex items-center justify-between gap-2 bg-white dark:bg-slate-900/40">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{ref.refereeName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{ref.refereeEmail}</div>
                    </div>
                    <div className="text-right">
                      {ref.status === 'qualifying_shipment_completed' || ref.status === 'bonus_released' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Qualified (+{formatNaira(ref.bonusNgn)})
                        </span>
                      ) : ref.status === 'registered' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          Awaiting Delivery
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Ineligible</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rules Panel */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00B4D8]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eligibility &amp; Release Rules</h3>
          </div>
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="font-bold text-slate-900 dark:text-white">1. Delivery-Gated Release</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Cashback (3% of air freight charge, capped at ₦15,000) stays pending while in transit and releases once delivery is confirmed.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="font-bold text-slate-900 dark:text-white">2. Exclusions</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Taxes (VAT), customs duties, terminal handling fees, and refunded shipments do not accrue cashback or referral payouts.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="font-bold text-slate-900 dark:text-white">3. Anti-Abuse &amp; Idempotency</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Each completed shipment can trigger at most one cashback entry. Self-referrals and duplicate accounts are automatically blocked.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auditable Ledger */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Shipping Credit Ledger</h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Showing records strictly belonging to {currentCustomer.name}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#008EA8] dark:text-[#90E0EF] bg-[#CAF0F8]/60 dark:bg-sky-950 px-3 py-1 rounded-full">
            Redeemable: {formatNaira(breakdown.availableRedeemableCredits)}
          </span>
        </div>

        {myLedger.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <Coins className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No credit ledger entries yet (₦0)</p>
            <p>Complete your first international delivery to earn shipping credits.</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden text-xs">
            {myLedger.map((item) => {
              const typeLabel =
                item.type === 'credits_redeemed'
                  ? 'Credit Applied'
                  : item.type === 'credit_reversal'
                  ? 'Credit Reversal'
                  : item.type === 'referral_bonus'
                  ? 'Referral Bonus'
                  : 'Freight Cashback';

              return (
                <div key={item.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/40">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {item.trackingNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {typeLabel}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.status === 'pending'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
                    <p className="text-[10px] font-mono text-slate-400">{item.createdAt.slice(0, 10)}</p>
                  </div>

                  <div className="text-right font-mono">
                    <div
                      className={`text-sm font-bold ${
                        item.amountNgn < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-[#008EA8] dark:text-[#90E0EF]'
                      }`}
                    >
                      {item.amountNgn < 0
                        ? `-${formatNaira(Math.abs(item.amountNgn))}`
                        : `+${formatNaira(item.amountNgn)}`}
                    </div>
                    {item.balanceAfterNgn !== undefined && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Bal: {formatNaira(item.balanceAfterNgn)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
