import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  X,
  Building,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface RequestRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_BANKS = [
  'Guaranty Trust Bank (GTBank)',
  'Access Bank PLC',
  'Zenith Bank PLC',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
  'Kuda Microfinance Bank',
  'OPay Digital Services',
  'Moniepoint MFB',
];

export const RequestRefundModal: React.FC<RequestRefundModalProps> = ({ isOpen, onClose }) => {
  const { currentCustomer, submitRefundRequest } = useDemo();

  const maxRefundable = currentCustomer.walletBalance || 0;
  const [amount, setAmount] = useState<number>(Math.min(10000, maxRefundable));
  const [customAmount, setCustomAmount] = useState<string>(
    maxRefundable > 0 ? String(Math.min(10000, maxRefundable)) : ''
  );
  const [selectedBank, setSelectedBank] = useState<string>(SUPPORTED_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState<string>('0129481920');
  const [accountName, setAccountName] = useState<string>(currentCustomer.name.toUpperCase());
  const [reason, setReason] = useState<string>('Unused wallet balance refund back to bank account');
  const [confirmedTerms, setConfirmedTerms] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const currentEnteredAmount = customAmount ? parseFloat(customAmount) : amount;
  const isValidAmount =
    !isNaN(currentEnteredAmount) && currentEnteredAmount > 0 && currentEnteredAmount <= maxRefundable;

  const handleQuickPercent = (pct: number) => {
    const calculated = Math.floor((maxRefundable * pct) / 100);
    setAmount(calculated);
    setCustomAmount(String(calculated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount || !confirmedTerms || !accountNumber || !accountName) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const res = submitRefundRequest(
        currentEnteredAmount,
        selectedBank,
        accountNumber,
        accountName,
        reason
      );
      setIsSubmitting(false);
      setResultMessage({
        success: res.success,
        text: res.message,
      });
      if (res.success) {
        setTimeout(() => {
          onClose();
          setResultMessage(null);
        }, 2200);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="sv-card w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#CAF0F8]/45 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="sv-h3">
                Request Wallet Balance Refund
              </h2>
              <p className="sv-label">
                Withdraw eligible deposited funds back to your bank account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close refund modal"
            className="p-2 rounded-full text-[#4B5563] hover:text-[#111827] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-[14px]">
          {/* Success or Error Banner */}
          {resultMessage && (
            <div
              className={`p-4 rounded-[12px] border flex items-start gap-3 ${
                resultMessage.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {resultMessage.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-[13px] font-medium leading-relaxed">{resultMessage.text}</div>
            </div>
          )}

          {/* Balance Breakdown & Eligibility Notice */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#4B5563]">Available Refundable Deposit</span>
              <span className="text-[15px] font-extrabold text-[#111827] tabular-nums">
                ₦{maxRefundable.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between sv-label pt-1.5 border-t border-[#E2E8F0]">
              <span>Cashback Rewards (Non-refundable)</span>
              <span className="tabular-nums">₦{(currentCustomer.cashbackBalance || 0).toLocaleString()} (Shipping use only)</span>
            </div>
          </div>

          {/* Amount Selection */}
          <div className="space-y-2">
            <label className="sv-label font-semibold text-[#111827] block">
              Refund Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#4B5563]">
                ₦
              </span>
              <input
                type="number"
                min="1000"
                max={maxRefundable}
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount(parseFloat(e.target.value) || 0);
                }}
                placeholder="Enter amount"
                className="sv-input w-full pl-8 pr-4 py-2.5 text-[14px] font-semibold tabular-nums"
                required
              />
            </div>

            {/* Quick Percent Buttons */}
            {maxRefundable > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    className="flex-1 py-1.5 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#CAF0F8] text-[12px] font-semibold text-[#0F172A] transition-colors cursor-pointer"
                  >
                    {pct === 100 ? 'All (100%)' : `${pct}%`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination Bank Details */}
          <div className="space-y-3 pt-2">
            <span className="sv-h3 block">
              Destination Bank Account
            </span>

            <div>
              <label className="sv-label block mb-1">
                Bank Name
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="sv-input w-full px-3 py-2.5 text-[14px] font-medium bg-white"
              >
                {SUPPORTED_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="sv-label block mb-1">
                  10-Digit NUBAN Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="0123456789"
                  className="sv-input w-full px-3 py-2.5 text-[14px] font-medium tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="sv-label block mb-1">
                  Account Name (Must match KYC)
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Full Account Name"
                  className="sv-input w-full px-3 py-2.5 text-[14px] font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="sv-label block mb-1">
                Reason for Refund Request
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason for withdrawal"
                className="sv-input w-full px-3 py-2.5 text-[14px]"
              />
            </div>
          </div>

          {/* Refund Progress & Audit Lifecycle Info */}
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-1.5 sv-label">
            <div className="font-semibold text-[#111827] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00B4D8]" />
              <span>Swiftvero Security &amp; Anti-Fraud Safeguard</span>
            </div>
            <p>
              Withdrawals undergo automated source matching and finance authorization. Payouts are settled via NIP instant bank transfer within 24 business hours.
            </p>
          </div>

          {/* Terms Affirmation Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={confirmedTerms}
              onChange={(e) => setConfirmedTerms(e.target.checked)}
              className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#90E0EF]"
            />
            <span className="sv-label leading-snug">
              I certify that this Nigerian bank account belongs to me and matches my registered customer identity. I authorize the deduction of ₦{currentEnteredAmount.toLocaleString()} from my wallet deposit.
            </span>
          </label>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[13px] font-semibold text-[#111827] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValidAmount || !confirmedTerms || isSubmitting || maxRefundable === 0}
              className="sv-btn-primary px-6 py-2.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <span>Submit Refund Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
