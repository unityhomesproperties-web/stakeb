import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { formatNaira } from '../../utils/shipping-calculator';
import { PolicyKey } from '../common/LegalModal';
import {
  Coins,
  Gift,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  TrendingUp,
  Tag,
} from 'lucide-react';

interface RewardsViewProps {
  onOpenPolicy: (key: PolicyKey) => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ onOpenPolicy }) => {
  const { currentCustomer, cashbackLedger, referrals, setActiveCustomerTab } = useDemo();

  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCustomer.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Calculate totals
  const totalEarned = cashbackLedger
    .filter((c) => c.status === 'released' || c.status === 'eligible')
    .reduce((sum, c) => sum + Math.max(0, c.amountNgn), 0);

  const totalPending = cashbackLedger
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.amountNgn, 0);

  const totalRedeemed = cashbackLedger
    .filter((c) => c.amountNgn < 0)
    .reduce((sum, c) => sum + Math.abs(c.amountNgn), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B4D8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full">
              Non-Withdrawable Shipping Credits
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-display font-bold text-[#354B55] mt-1.5">
            My Rewards &amp; Shipping Credits
          </h2>
          <p className="text-xs text-[#6A808C] mt-0.5 max-w-xl">
            Promotional shipping balance earned on delivered consignments and successful SME referrals. Apply credits in checkout to discount your future international shipments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveCustomerTab('book')}
            className="px-4 py-2 bg-[#00B4D8] hover:bg-[#009BB8] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Apply Credits on New Shipment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MANDATORY LEGAL & COMPLIANCE NON-WITHDRAWAL NOTICE */}
      <div className="p-4 bg-[#CAF0F8]/60 border border-[#90E0EF] rounded-2xl text-xs space-y-1.5 text-[#354B55]">
        <div className="flex items-center gap-2 font-bold text-[#008EA8]">
          <ShieldCheck className="w-4 h-4 text-[#00B4D8] shrink-0" />
          <span>Important Notice: Promotional Shipping Credits Terms</span>
        </div>
        <p className="text-[11px] text-[#354B55] leading-relaxed">
          Your rewards are <strong>non-withdrawable promotional shipping credits</strong>. They can be applied automatically to reduce the cost of your future international shipments with Swiftvero Express. <strong>Shipping credits have no cash withdrawal value and cannot be transferred, exchanged for currency, or refunded to a bank account.</strong>
        </p>
        <div className="pt-1 flex items-center gap-4 text-[11px]">
          <button
            onClick={() => onOpenPolicy('cashback')}
            className="text-[#00B4D8] font-bold underline hover:text-[#0096B4]"
          >
            Review Full Rewards &amp; Shipping Credits Policy
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - 4 Clear Credit Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Unlocked Shipping Credits */}
        <div className="bg-white rounded-2xl border-2 border-[#00B4D8] p-5 shadow-xs space-y-1 bg-gradient-to-br from-white to-[#F5FBFD]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#008EA8]">Available Shipping Credits</span>
            <Coins className="w-4 h-4 text-[#00B4D8]" />
          </div>
          <div className="text-2xl font-bold text-[#008EA8] font-mono">
            {formatNaira(currentCustomer.cashbackBalance)}
          </div>
          <p className="text-[11px] text-[#6A808C] pt-1">
            Ready to apply instantly at checkout
          </p>
        </div>

        {/* Pending Delivery Accruals */}
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6A808C]">Pending Delivery Closure</span>
            <Clock className="w-4 h-4 text-[#956B16]" />
          </div>
          <div className="text-2xl font-bold text-[#354B55] font-mono">
            {formatNaira(totalPending)}
          </div>
          <p className="text-[11px] text-[#6A808C] pt-1">
            Releases upon verified delivery closure
          </p>
        </div>

        {/* Total Lifetime Credits Earned */}
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6A808C]">Total Credits Earned</span>
            <Gift className="w-4 h-4 text-[#00B4D8]" />
          </div>
          <div className="text-2xl font-bold text-[#354B55] font-mono">
            {formatNaira(totalEarned)}
          </div>
          <p className="text-[11px] text-[#6A808C] pt-1">
            3% delivery rewards &amp; referral bonuses
          </p>
        </div>

        {/* Total Credits Redeemed in Checkout */}
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6A808C]">Total Credits Redeemed</span>
            <Tag className="w-4 h-4 text-[#008EA8]" />
          </div>
          <div className="text-2xl font-bold text-[#354B55] font-mono">
            {formatNaira(totalRedeemed)}
          </div>
          <p className="text-[11px] text-[#6A808C] pt-1">
            Deducted at checkout against shipments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Referral Code & Sharing Card */}
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#00B4D8]" />
            <h3 className="text-sm font-bold text-[#354B55]">Refer Exporters &amp; Traders</h3>
          </div>
          <p className="text-xs text-[#6A808C] leading-relaxed">
            Invite fellow exporters, artisans, or SME traders. When they register with your link and complete their first verified international delivery, both accounts receive a <strong>₦5,000 promotional shipping credit</strong>.
          </p>

          <div className="p-4 bg-[#F5FBFD] rounded-xl border border-[#DCEFF3] space-y-2">
            <span className="text-[11px] font-semibold text-[#6A808C] uppercase">Your Unique Referral Code:</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentCustomer.referralCode}
                className="w-full font-mono text-sm font-bold text-[#008EA8] bg-white border border-[#DCEFF3] rounded-lg px-3 py-2"
              />
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <div className="text-[11px] text-[#6A808C] pt-1">
              Share link: <span className="font-mono text-[#354B55]">https://swiftvero.ng/join/{currentCustomer.referralCode}</span>
            </div>
          </div>

          {/* Referral Status Table */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-[#354B55]">Referral History ({referrals.length})</h4>
            <div className="border border-[#DCEFF3] rounded-xl overflow-hidden text-xs">
              <div className="bg-[#F5FBFD] px-3.5 py-2 font-bold text-[#354B55] border-b border-[#DCEFF3] flex justify-between">
                <span>Referee</span>
                <span>Qualification Status</span>
              </div>
              <div className="divide-y divide-[#DCEFF3]">
                {referrals.map((ref) => (
                  <div key={ref.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#354B55]">{ref.refereeName}</div>
                      <div className="text-[11px] text-[#6A808C]">{ref.refereeEmail}</div>
                    </div>
                    <div className="text-right">
                      {ref.status === 'qualifying_shipment_completed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Delivery Completed (+₦5,000 Credit)
                        </span>
                      ) : ref.status === 'registered' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#956B16] bg-amber-50 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          Awaiting First Shipment
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Ineligible / Self-Referral</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: How Shipping Credits Work & Rules */}
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00B4D8]" />
            <h3 className="text-sm font-bold text-[#354B55]">How Shipping Credits Work</h3>
          </div>
          <p className="text-xs text-[#6A808C] leading-relaxed">
            Swiftvero’s credits system is designed to reward frequent Nigerian businesses, artisans, and individuals who rely on consistent global carriage.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="font-bold text-[#354B55]">Earn 3% Freight Rewards</div>
                <p className="text-[11px] text-[#6A808C] mt-0.5">
                  Every eligible international consignment earns 3% of the base air freight component as promotional credits upon confirmed delivery.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="font-bold text-[#354B55]">Delivery Confirmation Hold</div>
                <p className="text-[11px] text-[#6A808C] mt-0.5">
                  Credits remain in "Pending Delivery Closure" while the consignment is in transit, becoming fully available 48 hours after recipient delivery closure.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="font-bold text-[#354B55]">Redeem Directly in Checkout</div>
                <p className="text-[11px] text-[#6A808C] mt-0.5">
                  During checkout (Step 6), slide or enter the credits you wish to apply. Credits can be combined with promotional codes (like SWIFT10) to reduce your total.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </div>
              <div>
                <div className="font-bold text-[#354B55]">Zero Cash Value Guarantee</div>
                <p className="text-[11px] text-[#6A808C] mt-0.5">
                  In compliance with CBN guidelines, credits are strictly non-withdrawable promotional offsets. Any credits used during a failed payment are instantly reversed back to your balance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auditable Credit Transaction Ledger */}
      <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#354B55]">Auditable Shipping Credit Ledger</h3>
            <span className="text-[11px] text-[#6A808C]">Historical credit accruals, checkout redemptions &amp; balance reversals</span>
          </div>
          <div className="text-xs font-semibold text-[#008EA8] bg-[#CAF0F8] px-3 py-1 rounded-full">
            Current Credit Balance: {formatNaira(currentCustomer.cashbackBalance)}
          </div>
        </div>

        <div className="border border-[#DCEFF3] rounded-xl overflow-hidden text-xs">
          <div className="bg-[#F5FBFD] px-4 py-2.5 font-bold text-[#354B55] border-b border-[#DCEFF3] grid grid-cols-12 gap-2">
            <span className="col-span-3">Date &amp; Reference</span>
            <span className="col-span-2">Transaction Type</span>
            <span className="col-span-3">Description</span>
            <span className="col-span-2 text-right">Amount (NGN)</span>
            <span className="col-span-2 text-right">Running Balance</span>
          </div>

          <div className="divide-y divide-[#DCEFF3]">
            {cashbackLedger.map((item) => {
              const isCredit = item.amountNgn > 0;
              const typeLabel =
                item.type === 'credits_redeemed'
                  ? 'Credit Applied'
                  : item.type === 'credit_reversal'
                  ? 'Credit Reversal'
                  : item.type === 'referral_bonus'
                  ? 'Referral Bonus'
                  : 'Freight Cashback';

              return (
                <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-3">
                    <div className="font-semibold text-[#354B55] font-mono">{item.trackingNumber}</div>
                    <div className="text-[11px] text-[#6A808C]">
                      {new Date(item.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.type === 'credits_redeemed'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : item.type === 'credit_reversal'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]'
                      }`}
                    >
                      {typeLabel}
                    </span>
                  </div>

                  <div className="col-span-3 text-[#354B55] text-xs leading-tight">
                    {item.description}
                  </div>

                  <div
                    className={`col-span-2 text-right font-mono font-bold ${
                      item.amountNgn < 0 ? 'text-[#B42318]' : 'text-[#008EA8]'
                    }`}
                  >
                    {item.amountNgn < 0
                      ? `-${formatNaira(Math.abs(item.amountNgn))}`
                      : `+${formatNaira(item.amountNgn)}`}
                  </div>

                  <div className="col-span-2 text-right font-mono text-[#354B55] font-medium text-xs">
                    {item.balanceAfterNgn !== undefined
                      ? formatNaira(item.balanceAfterNgn)
                      : item.status === 'pending'
                      ? <span className="text-[11px] text-amber-700 italic">Pending</span>
                      : formatNaira(currentCustomer.cashbackBalance)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
