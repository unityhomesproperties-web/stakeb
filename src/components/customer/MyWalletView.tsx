import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Coins,
  Tag,
  CheckCircle,
  Copy,
  CreditCard,
  Building,
  Smartphone,
  ShieldCheck,
  History,
  Filter,
  Eye,
  EyeOff,
  Search,
  Send,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

import { RequestRefundModal } from './RequestRefundModal';

export const MyWalletView: React.FC = () => {
  const {
    currentCustomer,
    walletTransactions,
    refundRequests,
    promoCampaigns,
    topUpWallet,
    setActiveCustomerTab,
    getCustomerBalancesSnapshot,
  } = useDemo();

  const separatedBalances = getCustomerBalancesSnapshot(currentCustomer.id);

  const [showBalance, setShowBalance] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('swiftvero_hide_balance');
      return saved !== 'true';
    } catch {
      return true;
    }
  });

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(20000);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'ussd'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [walletSubTab, setWalletSubTab] = useState<'transactions' | 'refunds'>('transactions');

  const toggleShowBalance = () => {
    setShowBalance((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('swiftvero_hide_balance', next ? 'false' : 'true');
      } catch {}
      return next;
    });
  };

  // Customer transactions
  const myTransactions = walletTransactions.filter(
    (tx) => tx.customerId === currentCustomer.id
  );
  const myRefundRequests = (refundRequests || []).filter(
    (r) => r.customerId === currentCustomer.id
  );

  const filteredTransactions = myTransactions.filter((tx) => {
    const isCredit =
      tx.entryType === 'credit' ||
      tx.type === 'wallet_topup' ||
      tx.type === 'shipping_refund' ||
      tx.type === 'cashback_credit' ||
      tx.type === 'overpayment_credit' ||
      tx.type === 'bonus_credit';
    if (transactionFilter === 'credit' && !isCredit) return false;
    if (transactionFilter === 'debit' && isCredit) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const refMatch = tx.transactionReference.toLowerCase().includes(q);
      const descMatch = tx.description.toLowerCase().includes(q);
      return refMatch || descMatch;
    }
    return true;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleExecuteTopUp = () => {
    const finalAmount = customAmountInput ? parseFloat(customAmountInput) : topUpAmount;
    if (!finalAmount || finalAmount <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      const res = topUpWallet(
        finalAmount,
        paymentMethod === 'card'
          ? 'Debit Card (Instant)'
          : paymentMethod === 'bank_transfer'
          ? 'Virtual Bank Transfer'
          : '*737# USSD',
        true
      );
      setIsProcessing(false);
      if (res.success) {
        setTopUpSuccessMsg(res.message);
        setTimeout(() => {
          setTopUpSuccessMsg('');
          setShowTopUpModal(false);
        }, 1600);
      }
    }, 600);
  };

  const formatMoney = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* 3 Main Balances Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Balance 1: Available Wallet Balance */}
        <div className="bg-gradient-to-br from-[#00B4D8] via-[#0096C7] to-[#007791] text-white p-6 rounded-[12px] shadow-[0_2px_8px_rgba(15,23,42,0.08)] relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] uppercase font-bold tracking-wider text-[#CAF0F8] flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                Available Wallet Balance
              </span>
              <button
                type="button"
                onClick={toggleShowBalance}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                title={showBalance ? 'Hide wallet balance' : 'Reveal wallet balance'}
                aria-label={showBalance ? 'Hide wallet balance' : 'Reveal wallet balance'}
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-[28px] sm:text-[32px] font-extrabold tracking-[-0.02em] tabular-nums">
                {showBalance ? formatMoney(currentCustomer.walletBalance || 0) : '₦••••••••'}
              </div>
            </div>

            <p className="text-[13px] text-[#CAF0F8] mt-2 leading-[1.4]">
              Use for instant shipping payments and fast checkout.
            </p>
          </div>

          <div className="relative z-10 mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] text-[#CAF0F8] tabular-nums">
              Account: {currentCustomer.walletId || `WLT-${currentCustomer.id.slice(-6)}`}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setShowTopUpModal(true);
                  setTopUpSuccessMsg('');
                }}
                className="bg-white text-[#0F172A] px-4 py-1.5 rounded-full text-[13px] font-bold hover:bg-[#CAF0F8] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Fund Wallet</span>
              </button>
              <button
                onClick={() => setShowRefundModal(true)}
                className="bg-white/15 text-white hover:bg-white/25 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-white" />
                <span>Request Refund</span>
              </button>
              {setActiveCustomerTab && (
                <button
                  onClick={() => setActiveCustomerTab('book')}
                  className="bg-white/15 text-white hover:bg-white/25 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>New Shipment</span>
                </button>
              )}
            </div>
          </div>

          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Balance 2: Separated Non-Withdrawable Balances (Account Credit, Cashback, Bonus, Outstanding) */}
        <div className="sv-card p-6 flex flex-col justify-between hover:border-[#90E0EF] dark:hover:border-sky-800 transition-all space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] uppercase font-bold tracking-wider text-[#4B5563] dark:text-slate-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#00B4D8]" />
                Non-Withdrawable Balances
              </span>
              <span className="text-[12px] bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] px-2.5 py-0.5 rounded-full font-medium">
                Separated
              </span>
            </div>

            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="text-[#4B5563] dark:text-slate-300 font-medium">Available Account Credit</span>
                <span className="font-extrabold text-[#007791] dark:text-[#90E0EF] tabular-nums">
                  {showBalance ? formatMoney(separatedBalances.availableAccountCreditNgn) : '₦••••••'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="text-[#4B5563] dark:text-slate-300 font-medium">Cashback Balance</span>
                <span className="font-extrabold text-[#111827] dark:text-white tabular-nums">
                  {showBalance ? formatMoney(separatedBalances.cashbackBalanceNgn) : '₦••••••'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="text-[#4B5563] dark:text-slate-300 font-medium">Bonus Balance (Active)</span>
                <span className="font-extrabold text-[#111827] dark:text-white tabular-nums">
                  {showBalance ? formatMoney(separatedBalances.activeBonusBalanceNgn) : '₦••••••'}
                </span>
              </div>
              {separatedBalances.outstandingAmountNgn > 0 && (
                <div className="flex items-center justify-between py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2">
                  <span className="text-amber-900 dark:text-amber-300 font-semibold">Outstanding Balance</span>
                  <span className="font-extrabold text-amber-900 dark:text-amber-300 tabular-nums">
                    {showBalance ? formatMoney(separatedBalances.outstandingAmountNgn) : '₦••••••'}
                  </span>
                </div>
              )}
            </div>

            <p className="sv-label">
              Account Credit, Cashback, and Bonus grants are never merged with deposited cash and can be redeemed individually at checkout.
            </p>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-[13px]">
            <span className="sv-label">
              {separatedBalances.availableCreditRecords.length} credit(s) &bull; {separatedBalances.activeBonusGrants.length} active bonus
            </span>
            <button
              type="button"
              onClick={() => setActiveCustomerTab && setActiveCustomerTab('cashback')}
              className="text-[#0F172A] dark:text-[#90E0EF] underline underline-offset-4 hover:text-[#00B4D8] font-semibold cursor-pointer"
            >
              Rewards &amp; Credits →
            </button>
          </div>
        </div>

        {/* Balance 3: Active Promo Codes */}
        <div className="sv-card p-6 flex flex-col justify-between hover:border-[#90E0EF] dark:hover:border-sky-800 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] uppercase font-bold tracking-wider text-[#4B5563] dark:text-slate-200 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#00B4D8]" />
                Active Promo Codes
              </span>
              <span className="text-[12px] bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] px-2.5 py-0.5 rounded-full font-medium">
                Special Offers
              </span>
            </div>

            <div className="sv-h2 tabular-nums">
              {promoCampaigns.filter((c) => c.isActive).length} Available Discounts
            </div>

            <p className="sv-label mt-1">
              Apply a promo code during quote checkout to save on shipping fees.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-slate-800 space-y-2">
            {promoCampaigns.filter((c) => c.isActive).slice(0, 2).map((camp) => (
              <div
                key={camp.id}
                className="flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-800 p-2.5 rounded-[10px] border border-[#E2E8F0] dark:border-slate-700"
              >
                <div>
                  <span className="font-bold text-[13px] text-[#0F172A] dark:text-[#90E0EF] tabular-nums">{camp.code}</span>
                  <div className="sv-label tabular-nums">
                    {(camp.discountType === 'percentage' || camp.type === 'percentage')
                      ? `${camp.discountValue || camp.value || 0}% discount`
                      : `₦${(camp.discountValue || camp.value || 0).toLocaleString()} off`} &bull; Min ₦{(camp.minShipmentAmountNgn || camp.minShipmentValueNgn || 0).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyCode(camp.code)}
                  className="px-3 py-1 text-[12px] font-semibold rounded-full bg-white dark:bg-slate-900 text-[#1F2937] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 hover:bg-[#CAF0F8] hover:text-[#0F172A] hover:border-[#90E0EF] transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === camp.code ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-[#247347]" />
                      <span className="text-[#247347] dark:text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#00B4D8]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overpayment Account Credits & Active Bonus Breakdown */}
      {(separatedBalances.availableCreditRecords.length > 0 ||
        separatedBalances.activeBonusGrants.length > 0 ||
        separatedBalances.expiredBonusGrants.length > 0) && (
        <div className="sv-card p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-2.5">
            <h3 className="sv-h3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00B4D8]" />
              <span>Shipment Overpayment Credits &amp; Bonus Grants</span>
            </h3>
            <span className="sv-label">Applied selectively at quote or weight-adjustment checkout</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
            {separatedBalances.availableCreditRecords.map((crd) => (
              <div
                key={crd.id}
                className="p-3.5 rounded-[10px] bg-[#CAF0F8]/40 dark:bg-sky-950/40 border border-[#90E0EF] dark:border-sky-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-mono font-bold text-[#0F172A] dark:text-[#90E0EF]">
                    {crd.creditRef}
                  </div>
                  <div className="text-[12px] text-[#4B5563] dark:text-slate-300">
                    Overpayment credit from <span className="font-mono">{crd.sourceTrackingNumber}</span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="font-extrabold text-[#0F172A] dark:text-white">
                    {showBalance ? formatMoney(crd.remainingCreditNgn) : '₦••••••'}
                  </div>
                  <div className="text-[11px] text-[#4B5563] dark:text-slate-400">
                    of {formatMoney(crd.originalCreditNgn)}
                  </div>
                </div>
              </div>
            ))}

            {separatedBalances.activeBonusGrants.map((grant) => (
              <div
                key={grant.id}
                className="p-3.5 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-[#111827] dark:text-white">{grant.title}</div>
                  <div className="text-[12px] text-[#4B5563] dark:text-slate-400">
                    {grant.grantRef} &bull; Expires {grant.expiresAt.slice(0, 10)}
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="font-extrabold text-[#007791] dark:text-[#90E0EF]">
                    {showBalance ? formatMoney(grant.remainingAmountNgn) : '₦••••••'}
                  </div>
                  <div className="text-[11px] text-[#4B5563] dark:text-slate-400">Active</div>
                </div>
              </div>
            ))}

            {separatedBalances.expiredBonusGrants.map((grant) => (
              <div
                key={grant.id}
                className="p-3.5 rounded-[10px] bg-slate-100/70 dark:bg-slate-900/30 border border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-3 opacity-75"
              >
                <div>
                  <div className="font-semibold text-[#4B5563] dark:text-slate-400">{grant.title}</div>
                  <div className="text-[12px] text-rose-700 dark:text-rose-400">
                    Expired {grant.expiresAt.slice(0, 10)} &bull; Ineligible
                  </div>
                </div>
                <div className="text-right tabular-nums font-bold text-[#4B5563] line-through">
                  {formatMoney(grant.remainingAmountNgn)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab Switcher: Transactions vs Bank Refund Requests */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
        <button
          onClick={() => setWalletSubTab('transactions')}
          className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 cursor-pointer ${
            walletSubTab === 'transactions'
              ? 'bg-[#00B4D8] text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-[#4B5563] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Wallet Transactions ({filteredTransactions.length})</span>
        </button>

        <button
          onClick={() => setWalletSubTab('refunds')}
          className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 cursor-pointer ${
            walletSubTab === 'refunds'
              ? 'bg-[#00B4D8] text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-[#4B5563] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Bank Refund Requests</span>
          {myRefundRequests.length > 0 && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                walletSubTab === 'refunds'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF]'
              }`}
            >
              {myRefundRequests.length}
            </span>
          )}
        </button>
      </div>

      {walletSubTab === 'refunds' ? (
        <div className="sv-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
            <div>
              <h3 className="sv-h3 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-[#00B4D8]" />
                Bank Payout Refund Requests
              </h3>
              <p className="sv-label mt-0.5">
                Track status of deposited wallet funds requested back to your verified Nigerian bank account.
              </p>
            </div>
            <button
              onClick={() => setShowRefundModal(true)}
              className="sv-btn-primary px-4 py-2 rounded-full text-[13px] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Refund Request</span>
            </button>
          </div>

          {myRefundRequests.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-[#F8FAFC] dark:bg-slate-800/60 rounded-[12px] border border-[#E2E8F0] dark:border-slate-700">
              <Building className="w-8 h-8 text-[#4B5563] mx-auto" />
              <div className="sv-h3">No Refund Requests Yet</div>
              <p className="sv-label max-w-sm mx-auto">
                Need to withdraw unspent deposited funds? Click below to send a refund request directly to your bank account.
              </p>
              <button
                onClick={() => setShowRefundModal(true)}
                className="sv-btn-primary px-5 py-2.5 rounded-full text-[13px] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Request Refund</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRefundRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 rounded-[12px] border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/80 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#111827] dark:text-white tabular-nums">
                          {req.reference}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            req.status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : req.status === 'approved' || req.status === 'processing'
                              ? 'bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800'
                              : req.status === 'rejected'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {req.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="sv-body mt-1">
                        {req.bankName} &bull; Account: {req.accountNumber} ({req.accountName})
                      </p>
                      <p className="sv-label mt-0.5">
                        Reason: {req.reason}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-[18px] font-extrabold text-[#111827] dark:text-white tabular-nums">
                        ₦{req.amountNgn.toLocaleString()}
                      </div>
                      <span className="sv-label">
                        {new Date(req.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-[10px] border border-[#E2E8F0] dark:border-slate-700 space-y-2">
                    <span className="text-[12px] font-bold text-[#111827] dark:text-white block">
                      Audit &amp; Settlement Timeline
                    </span>
                    <div className="space-y-2 text-[13px]">
                      {req.statusTimeline.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <CheckCircle className="w-3.5 h-3.5 text-[#00B4D8] mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <span className="font-semibold text-[#111827] dark:text-slate-200">{step.title}</span>
                            <p className="sv-label">{step.description}</p>
                          </div>
                          <span className="sv-label shrink-0 tabular-nums">
                            {new Date(step.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Transaction History Section */
        <div className="sv-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
            <div>
              <h3 className="sv-h3 flex items-center gap-2">
                <History className="w-4 h-4 text-[#00B4D8]" />
                Wallet Transactions
              </h3>
              <p className="sv-label mt-0.5">
                Clear record of money added, shipping payments, and refunds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reference or note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sv-input text-[13px] pl-8 pr-3 py-2 border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] bg-[#F8FAFC] dark:bg-slate-800 text-[#111827] dark:text-white placeholder-[#4B5563] w-full sm:w-56"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#4B5563]" />
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value as any)}
                  className="sv-input text-[13px] border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] px-3 py-2 bg-white dark:bg-slate-800 text-[#111827] dark:text-white font-medium"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Money Added (Credits)</option>
                  <option value="debit">Payments Made (Debits)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 border-b border-[#E2E8F0] dark:border-slate-700 text-[#4B5563] dark:text-slate-300 font-semibold">
                <tr>
                  <th className="py-3 px-3">Payment Reference</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Balance After</th>
                  <th className="py-3 px-3 text-right">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-[#1F2937] dark:text-slate-300">
                {filteredTransactions.map((tx) => {
                  const isCredit =
                    tx.entryType === 'credit' ||
                    tx.type === 'wallet_topup' ||
                    tx.type === 'shipping_refund' ||
                    tx.type === 'cashback_credit' ||
                    tx.type === 'overpayment_credit' ||
                    tx.type === 'bonus_credit';
                  return (
                    <tr key={tx.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#111827] dark:text-white tabular-nums">
                        <div>{tx.transactionReference}</div>
                        {tx.isDemo && (
                          <span className="text-[11px] text-[#0F172A] dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full font-medium">
                            Demo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#4B5563] dark:text-slate-400 max-w-[280px]">
                        <div className="font-semibold text-[#111827] dark:text-white">{tx.description}</div>
                        {tx.paymentMethod && (
                          <div className="text-[12px] text-[#4B5563]">Via {tx.paymentMethod}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isCredit
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#1F2937] dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-700'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-[#4B5563] dark:text-slate-400" />
                          )}
                          {isCredit ? 'CREDIT' : 'DEBIT'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold tabular-nums text-[#111827] dark:text-white">
                        <span className={isCredit ? 'text-[#247347] dark:text-emerald-400' : 'text-[#111827] dark:text-slate-200'}>
                          {isCredit ? '+' : '-'}{showBalance ? formatMoney(tx.amountNgn) : '••••'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#4B5563] dark:text-slate-300 tabular-nums">
                        {showBalance ? formatMoney(tx.balanceAfterNgn) : '••••'}
                      </td>
                      <td className="py-3 px-3 text-right text-[12px] text-[#4B5563] tabular-nums">
                        {new Date(tx.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#4B5563] text-[13px]">
                      No transactions found for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="sm:hidden space-y-3">
            {filteredTransactions.map((tx) => {
              const isCredit =
                tx.entryType === 'credit' ||
                tx.type === 'wallet_topup' ||
                tx.type === 'shipping_refund' ||
                tx.type === 'cashback_credit' ||
                tx.type === 'overpayment_credit' ||
                tx.type === 'bonus_credit';
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-[12px] border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#111827] dark:text-white tabular-nums">
                      {tx.transactionReference}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isCredit
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-[#F1F5F9] dark:bg-slate-700 text-[#1F2937] dark:text-slate-200'
                      }`}
                    >
                      {isCredit ? 'CREDIT' : 'DEBIT'}
                    </span>
                  </div>

                  <div className="text-[13px] text-[#1F2937] dark:text-slate-200 font-medium">{tx.description}</div>

                  <div className="flex items-center justify-between text-[13px] pt-2 border-t border-[#E2E8F0] dark:border-slate-700">
                    <span className={`font-bold tabular-nums ${isCredit ? 'text-[#247347] dark:text-emerald-400' : 'text-[#111827] dark:text-slate-200'}`}>
                      {isCredit ? '+' : '-'}{showBalance ? formatMoney(tx.amountNgn) : '••••'}
                    </span>
                    <span className="sv-label tabular-nums">
                      {new Date(tx.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTransactions.length === 0 && (
              <div className="py-8 text-center text-[#4B5563] text-[13px]">
                No transactions found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: FUND WALLET */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="sv-card max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5 text-[#00B4D8]" />
                </div>
                <div>
                  <h3 className="sv-h3">Fund Swiftvero Wallet</h3>
                  <p className="sv-label">Instant credit for shipping checkouts</p>
                </div>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-[#4B5563] hover:text-[#111827] dark:hover:text-slate-200 text-[13px] font-semibold px-2.5 py-1 rounded-full cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {topUpSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-[#00B4D8] mx-auto animate-bounce" />
                <h4 className="sv-h3">Wallet Funded Successfully!</h4>
                <p className="sv-body">{topUpSuccessMsg}</p>
                <div className="text-[13px] font-bold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950 p-3 rounded-[10px] border border-[#90E0EF] tabular-nums">
                  New Balance: ₦{(currentCustomer.walletBalance || 0).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Presets */}
                <div>
                  <label className="sv-label block text-[#111827] dark:text-slate-300 font-semibold mb-2">
                    Select Amount to Add
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[5000, 10000, 20000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setTopUpAmount(amt);
                          setCustomAmountInput('');
                        }}
                        className={`py-2.5 px-2 rounded-full font-bold border transition-all text-[13px] tabular-nums cursor-pointer ${
                          topUpAmount === amt && !customAmountInput
                            ? 'bg-[#00B4D8] text-white border-[#00B4D8] shadow-xs'
                            : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#111827] dark:text-slate-200 border-[#CBD5E1] dark:border-slate-700 hover:border-[#00B4D8]'
                        }`}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="sv-label block text-[#111827] dark:text-slate-300 font-semibold mb-1.5">
                    Or Enter Other Amount (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 75000"
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(e.target.value)}
                    className="sv-input w-full border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] px-3.5 py-2.5 text-[14px] font-semibold text-[#111827] dark:text-white bg-white dark:bg-slate-800 tabular-nums"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="sv-label block text-[#111827] dark:text-slate-300 font-semibold mb-2">
                    Select How to Pay
                  </label>
                  <div className="space-y-2">
                    <label
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center justify-between p-3 rounded-[10px] border cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'border-[#00B4D8] bg-[#CAF0F8]/35 dark:bg-sky-950/50 ring-1 ring-[#00B4D8]/30'
                          : 'border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-[#00B4D8]" />
                        <div>
                          <span className="font-bold text-[14px] text-[#111827] dark:text-white block">Debit / Credit Card</span>
                          <span className="text-[12px] text-[#4B5563] dark:text-slate-400">Paystack / Monnify Gateway (Demo)</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="text-[#00B4D8] focus:ring-[#00B4D8]"
                      />
                    </label>

                    <label
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`flex items-center justify-between p-3 rounded-[10px] border cursor-pointer transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-[#00B4D8] bg-[#CAF0F8]/35 dark:bg-sky-950/50 ring-1 ring-[#00B4D8]/30'
                          : 'border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-[#00B4D8]" />
                        <div>
                          <span className="font-bold text-[14px] text-[#111827] dark:text-white block">Direct Bank Transfer</span>
                          <span className="text-[12px] text-[#4B5563] dark:text-slate-400">Dedicated Virtual NUBAN Account</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="text-[#00B4D8] focus:ring-[#00B4D8]"
                      />
                    </label>

                    <label
                      onClick={() => setPaymentMethod('ussd')}
                      className={`flex items-center justify-between p-3 rounded-[10px] border cursor-pointer transition-all ${
                        paymentMethod === 'ussd'
                          ? 'border-[#00B4D8] bg-[#CAF0F8]/35 dark:bg-sky-950/50 ring-1 ring-[#00B4D8]/30'
                          : 'border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-[#00B4D8]" />
                        <div>
                          <span className="font-bold text-[14px] text-[#111827] dark:text-white block">USSD Banking Code</span>
                          <span className="text-[12px] text-[#4B5563] dark:text-slate-400">Quick dial on your phone</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentMethod === 'ussd'}
                        onChange={() => setPaymentMethod('ussd')}
                        className="text-[#00B4D8] focus:ring-[#00B4D8]"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExecuteTopUp}
                    disabled={isProcessing}
                    className="sv-btn-primary w-full py-3 rounded-full flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessing ? (
                      <span>Connecting to gateway...</span>
                    ) : (
                      <span className="tabular-nums">
                        Add ₦
                        {(
                          customAmountInput ? parseFloat(customAmountInput) || 0 : topUpAmount
                        ).toLocaleString()}{' '}
                        to Wallet
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: REQUEST REFUND */}
      <RequestRefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
      />
    </div>
  );
};
