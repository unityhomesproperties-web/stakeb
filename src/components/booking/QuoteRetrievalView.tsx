import React, { useState, useEffect } from 'react';
import { useDemo } from '../../context/DemoContext';
import { formatNaira, calculateVolumetricWeight } from '../../utils/shipping-calculator';
import {
  canApproveAndPayQuote,
  maskContactInfo,
} from '../../utils/quote-lifecycle';
import { evaluateShipmentFinancialSettlement } from '../../utils/adjustment-engine';
import { allocateCheckoutDeductions } from '../../utils/rewards-engine';
import { PaymentReceiptRecord, PaystackOutcome, QuoteRecord, ServiceTier, ShipmentRecord } from '../../types';
import {
  Search,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  History,
  Wallet,
  Coins,
  Layers,
  ArrowRight,
  Info,
  HelpCircle,
  BookmarkCheck,
  Receipt,
  ShieldAlert,
  Gift,
  XCircle,
  Package,
} from 'lucide-react';
import {
  PriceBreakdownList,
  OptionalServiceAccordion,
  StickyPaymentSummaryDrawer,
  PriceLineItem,
} from '../common/DhlStylePrimitives';

interface QuoteRetrievalViewProps {
  initialCode?: string;
  onOpenSupportWithShipment?: (tracking: string) => void;
  onTrackShipment?: (tracking: string) => void;
  onConvertQuoteToBooking?: (quoteRef: string) => void;
}

export const QuoteRetrievalView: React.FC<QuoteRetrievalViewProps> = ({
  initialCode,
  onOpenSupportWithShipment,
  onTrackShipment,
  onConvertQuoteToBooking,
}) => {
  const {
    role,
    environmentMode,
    shipments,
    quotes,
    bookingGroups,
    currentCustomer,
    measurementReviews,
    paymentAdjustments,
    requestOtpForContact,
    verifyOtpForChallenge,
    recoverQuotesWithContact,
    getRecoveredItemsAfterOtp,
    settlePaymentAdjustment,
    requestMeasurementReview,
    approveAndPayShipmentQuote,
    approveAndPayGroupQuote,
    rejectRevisedQuote,
    getCustomerBalancesSnapshot,
    bonusGrants,
    validatePromoCode,
    setSelectedShipmentForTracking,
  } = useDemo();

  const [codeInput, setCodeInput] = useState(initialCode || '');
  const [activeCode, setActiveCode] = useState(initialCode || '');
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Real Rate-Limited OTP Gate state
  const [otpChannel, setOtpChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpSimulatedHint, setOtpSimulatedHint] = useState<string | undefined>(undefined);
  const [otpDeliveryMsg, setOtpDeliveryMsg] = useState<string | null>(null);
  const [otpDeliveryStatus, setOtpDeliveryStatus] = useState<string | null>(null);
  const [otpCooldownSec, setOtpCooldownSec] = useState<number>(0);
  const [otpVerifiedCodes, setOtpVerifiedCodes] = useState<Record<string, boolean>>({});
  const [otpError, setOtpError] = useState<string | null>(null);

  // Privacy-Safe "Didn't receive your reference?" Recovery state
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryContactInput, setRecoveryContactInput] = useState('');
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [recoveryChallengeId, setRecoveryChallengeId] = useState<string | null>(null);
  const [recoverySimHint, setRecoverySimHint] = useState<string | undefined>(undefined);
  const [recoveryOtpInput, setRecoveryOtpInput] = useState('');
  const [recoveryOtpError, setRecoveryOtpError] = useState<string | null>(null);
  const [recoveredResults, setRecoveredResults] = useState<{
    quotes: QuoteRecord[];
    shipments: ShipmentRecord[];
  } | null>(null);

  // Weight Adjustment Settlement state
  const [adjConsentChecked, setAdjConsentChecked] = useState(false);
  const [adjPayMethod, setAdjPayMethod] = useState<'Paystack Card' | 'Virtual Bank Transfer' | 'USSD'>('Paystack Card');
  const [adjPaystackOutcome, setAdjPaystackOutcome] = useState<PaystackOutcome>('success');
  const [adjCreditInput, setAdjCreditInput] = useState<string>('0');
  const [adjCashbackInput, setAdjCashbackInput] = useState<string>('0');
  const [adjBonusInput, setAdjBonusInput] = useState<string>('0');
  const [adjPayResult, setAdjPayResult] = useState<{
    success: boolean;
    message: string;
    receipt?: PaymentReceiptRecord;
  } | null>(null);

  // Measurement Review & Reject Quote state
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [rejectResult, setRejectResult] = useState<{ success: boolean; message: string } | null>(null);

  // Payment & Approval state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountNgn: number } | null>(null);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [selectedServiceTier, setSelectedServiceTier] = useState<ServiceTier>('standard');
  const [accountCreditInput, setAccountCreditInput] = useState<string>('0');
  const [cashbackInput, setCashbackInput] = useState<string>('0');
  const [bonusInput, setBonusInput] = useState<string>('0');
  const [useWallet, setUseWallet] = useState(false);
  const [gatewayMethod, setGatewayMethod] = useState<'Paystack Card' | 'Virtual Bank Transfer' | 'USSD'>('Paystack Card');
  const [paystackOutcome, setPaystackOutcome] = useState<PaystackOutcome>('success');
  const [quoteApprovalChecked, setQuoteApprovalChecked] = useState(false);
  const [paySelectedGroupIds, setPaySelectedGroupIds] = useState<string[]>([]);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (otpCooldownSec <= 0) return;
    const t = window.setInterval(() => {
      setOtpCooldownSec((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [otpCooldownSec]);

  useEffect(() => {
    if (initialCode) {
      setCodeInput(initialCode);
      setActiveCode(initialCode);
      setLookupError(null);
    }
  }, [initialCode]);

  const cleanedActive = activeCode.trim().toUpperCase();
  const foundQuote = cleanedActive
    ? quotes.find((q) => q.quoteRef.toUpperCase() === cleanedActive)
    : undefined;
  const foundShipment = !foundQuote && cleanedActive
    ? shipments.find((s) => s.trackingNumber.toUpperCase() === cleanedActive)
    : undefined;

  const activeTargetRef = foundQuote?.quoteRef || foundShipment?.trackingNumber || '';

  // Reset per-record interactive state when active target changes
  useEffect(() => {
    setReviewFormOpen(false);
    setReviewFeedback(null);
    setPaymentResult(null);
    setQuoteApprovalChecked(false);
    setAppliedPromo(null);
    setPromoMsg(null);
    setOtpSent(false);
    setOtpChallengeId(null);
    setOtpInput('');
    setOtpError(null);
    setOtpSimulatedHint(undefined);
    setOtpDeliveryMsg(null);
    setOtpDeliveryStatus(null);
    setAdjConsentChecked(false);
    setAdjPayResult(null);
    setAdjCreditInput('0');
    setAdjCashbackInput('0');
    setAdjBonusInput('0');
    setAccountCreditInput('0');
    setCashbackInput('0');
    setBonusInput('0');
    setRejectModalOpen(false);
    setRejectReasonInput('');
    setRejectResult(null);
    if (foundShipment) {
      setPaySelectedGroupIds([foundShipment.id]);
      setSelectedServiceTier(foundShipment.selectedTier || foundShipment.quote?.serviceTier || 'standard');
    } else {
      setPaySelectedGroupIds([]);
    }
  }, [foundShipment?.id, foundQuote?.id]);

  const isGuest = role === 'visitor';
  const isUnlocked =
    !isGuest ||
    (Boolean(activeTargetRef) && otpVerifiedCodes[activeTargetRef.toUpperCase()] === true);

  // Customer's own awaiting-approval shipments & saved quotes for quick pick
  const myPendingQuotes =
    role === 'customer' || role === 'business'
      ? shipments.filter(
          (s) =>
            s.customerId === currentCustomer.id &&
            (s.status === 'quote_ready' || (s.paymentStatus === 'unpaid' && s.quoteVersions && s.quoteVersions.length > 0))
        )
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = codeInput.trim().toUpperCase();
    if (!cleaned) {
      setLookupError('Please enter a Quote Reference (QTE-YY-XXXXXX) or Shipment Code (SWV-YY-XXXXXX).');
      return;
    }
    const qMatch = quotes.find((q) => q.quoteRef.toUpperCase() === cleaned);
    if (qMatch) {
      setLookupError(null);
      setActiveCode(qMatch.quoteRef);
      return;
    }
    const sMatch = shipments.find((s) => s.trackingNumber.toUpperCase() === cleaned);
    if (sMatch) {
      setLookupError(null);
      setActiveCode(sMatch.trackingNumber);
      return;
    }
    setLookupError(`No quote or shipment record found for "${cleaned}". Verify your QTE or SWV code and try again.`);
    setActiveCode('');
  };

  const handleQuickPick = (code: string) => {
    setCodeInput(code);
    setActiveCode(code);
    setLookupError(null);
  };

  const handleSendOtp = () => {
    if (!activeTargetRef) return;
    const contactVal = foundQuote
      ? otpChannel === 'email'
        ? foundQuote.contactEmail || foundQuote.contactPhone || 'guest@swiftvero.ng'
        : foundQuote.contactPhone || foundQuote.contactEmail || '+2348000000000'
      : foundShipment
      ? otpChannel === 'email'
        ? foundShipment.customerEmail || foundShipment.customerPhone || 'guest@swiftvero.ng'
        : foundShipment.customerPhone || foundShipment.senderPhone || '+2348000000000'
      : '';

    const res = requestOtpForContact({
      contactValue: contactVal,
      channel: otpChannel,
      targetRef: activeTargetRef,
      purpose: 'quote_access',
    });

    setOtpSent(true);
    setOtpDeliveryMsg(res.userMessage);
    setOtpDeliveryStatus(res.deliveryStatus);
    if (res.challengeId) {
      setOtpChallengeId(res.challengeId);
    }
    if (res.simulatedOtp) {
      setOtpSimulatedHint(res.simulatedOtp);
    }
    if (res.cooldownRemainingSeconds > 0) {
      setOtpCooldownSec(res.cooldownRemainingSeconds);
    } else if (res.allowed) {
      setOtpCooldownSec(60);
    }
    setOtpError(res.allowed ? null : res.userMessage);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetRef || !otpChallengeId) return;
    const res = verifyOtpForChallenge({
      challengeId: otpChallengeId,
      code: otpInput,
    });
    if (res.verified) {
      setOtpVerifiedCodes((prev) => ({
        ...prev,
        [activeTargetRef.toUpperCase()]: true,
      }));
      setOtpError(null);
    } else {
      setOtpError(res.message);
    }
  };

  const handleRequestRecoveryOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryContactInput.trim()) return;
    const res = recoverQuotesWithContact(recoveryContactInput.trim());
    setRecoveryNotice(res.genericNotice);
    setRecoveryChallengeId(res.challengeId || null);
    setRecoverySimHint(res.simulatedOtp);
    setRecoveryOtpError(null);
    setRecoveredResults(null);
    setRecoveryOtpInput('');
  };

  const handleVerifyRecoveryOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryChallengeId) return;
    const res = verifyOtpForChallenge({
      challengeId: recoveryChallengeId,
      code: recoveryOtpInput,
    });
    if (res.verified) {
      const items = getRecoveredItemsAfterOtp(recoveryContactInput.trim());
      setRecoveredResults(items);
      setRecoveryOtpError(null);
    } else {
      setRecoveryOtpError(res.message);
    }
  };

  const handleApplyPromo = () => {
    if (!foundShipment || !promoCodeInput.trim()) return;
    const res = validatePromoCode(promoCodeInput.trim(), foundShipment.quote.totalAmount);
    if (res.valid) {
      setAppliedPromo({ code: promoCodeInput.trim().toUpperCase(), discountNgn: res.discountNgn });
      setPromoMsg(`Applied ${promoCodeInput.trim().toUpperCase()} (-${formatNaira(res.discountNgn)})`);
    } else {
      setAppliedPromo(null);
      setPromoMsg(res.message);
    }
  };

  const handleRequestReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundShipment) return;
    const res = requestMeasurementReview(foundShipment.id, reviewReason);
    setReviewFeedback(res);
    if (res.success) {
      setReviewReason('');
      setReviewFormOpen(false);
    }
  };

  // Sibling shipments if part of a BookingGroup
  const parentGroup = foundShipment?.bookingGroupId
    ? bookingGroups.find((g) => g.id === foundShipment.bookingGroupId)
    : undefined;
  const groupSiblings = parentGroup
    ? shipments.filter((s) => s.bookingGroupId === parentGroup.id)
    : [];
  const unpaidSiblings = groupSiblings.filter((s) => s.paymentStatus !== 'paid');

  const activeQuoteVersion = foundShipment
    ? foundShipment.quoteVersions?.find((v) => v.status === 'active') || {
        version: 1,
        quote: foundShipment.quote,
        measuredWeightKg: foundShipment.verifiedWeightKg || foundShipment.declaredWeightKg,
        measuredDimensions: foundShipment.verifiedDimensions || foundShipment.declaredDimensions,
        changedBy: 'Facility Intake Desk',
        reason: 'Active quotation',
        status: foundShipment.paymentStatus === 'paid' ? ('paid' as const) : ('active' as const),
        createdAt: foundShipment.quote.generatedAt,
      }
    : undefined;

  const approvalCheck = foundShipment
    ? canApproveAndPayQuote(activeQuoteVersion, foundShipment.paymentStatus)
    : { allowed: false, reason: '' };

  const activeServiceOptionQuote =
    foundShipment?.availableServiceQuotes?.find((q) => q.serviceTier === selectedServiceTier) ||
    foundShipment?.quote;

  const targetShipmentsForPayment =
    paySelectedGroupIds.length > 1 && groupSiblings.length > 1
      ? groupSiblings.filter((s) => paySelectedGroupIds.includes(s.id) && s.paymentStatus !== 'paid')
      : foundShipment && foundShipment.paymentStatus !== 'paid'
      ? [foundShipment]
      : [];

  const grossSelectedTotal =
    targetShipmentsForPayment.length === 1 && activeServiceOptionQuote
      ? activeServiceOptionQuote.totalAmount
      : targetShipmentsForPayment.reduce((sum, s) => sum + s.quote.totalAmount, 0);
  const promoDiscountNgn =
    appliedPromo && targetShipmentsForPayment.length === 1 ? appliedPromo.discountNgn : 0;
  const netDueAfterPromo = Math.max(0, grossSelectedTotal - promoDiscountNgn);

  const balancesSnapshot = isGuest
    ? {
        availableAccountCreditNgn: 0,
        cashbackBalanceNgn: 0,
        activeBonusBalanceNgn: 0,
        expiredBonusBalanceNgn: 0,
        depositedWalletBalanceNgn: 0,
        outstandingAmountNgn: 0,
        availableCreditRecords: [],
        activeBonusGrants: [],
        expiredBonusGrants: [],
      }
    : getCustomerBalancesSnapshot(foundShipment?.customerId || currentCustomer.id);

  const walletAvailable = balancesSnapshot.depositedWalletBalanceNgn;
  const requestedCreditNgn = Math.max(0, Number(accountCreditInput) || 0);
  const requestedCashbackNgn = Math.max(0, Number(cashbackInput) || 0);
  const requestedBonusNgn = Math.max(0, Number(bonusInput) || 0);

  const deductionAllocation = allocateCheckoutDeductions({
    payableNgn: netDueAfterPromo,
    availableAccountCreditNgn: balancesSnapshot.availableAccountCreditNgn,
    cashbackBalanceNgn: balancesSnapshot.cashbackBalanceNgn,
    bonusGrants: bonusGrants.filter((g) => g.customerId === (foundShipment?.customerId || currentCustomer.id)),
    serviceTier: selectedServiceTier,
    destinationCountry: foundShipment?.destinationCountry || 'United Kingdom',
    requestedAccountCreditNgn: requestedCreditNgn,
    requestedCashbackNgn,
    requestedBonusNgn,
  });

  const creditApplied = deductionAllocation.valid ? deductionAllocation.accountCreditAppliedNgn : 0;
  const cashbackApplied = deductionAllocation.valid ? deductionAllocation.cashbackAppliedNgn : 0;
  const bonusApplied = deductionAllocation.valid ? deductionAllocation.bonusAppliedNgn : 0;
  const afterSeparatedRewards = deductionAllocation.valid
    ? deductionAllocation.remainingPaystackNgn
    : netDueAfterPromo;
  const walletApplied = useWallet ? Math.min(walletAvailable, afterSeparatedRewards) : 0;
  const gatewayDue = Math.max(0, afterSeparatedRewards - walletApplied);

  const handleApproveAndPay = () => {
    if (!foundShipment || !quoteApprovalChecked || !deductionAllocation.valid) return;

    if (targetShipmentsForPayment.length > 1 && parentGroup) {
      const res = approveAndPayGroupQuote({
        bookingGroupId: parentGroup.id,
        selectedShipmentIds: targetShipmentsForPayment.map((s) => s.id),
        useWalletNgn: walletApplied,
        useCreditsNgn: cashbackApplied,
        promoCode: undefined,
        paymentMethod: gatewayDue === 0 ? 'Account Credits / Rewards' : gatewayMethod,
      });
      setPaymentResult(res);
    } else {
      const res = approveAndPayShipmentQuote({
        shipmentId: foundShipment.id,
        useWalletNgn: walletApplied,
        useCreditsNgn: cashbackApplied,
        useAccountCreditNgn: creditApplied,
        useCashbackNgn: cashbackApplied,
        useBonusNgn: bonusApplied,
        selectedServiceTier,
        paystackOutcome: gatewayDue === 0 ? 'success' : paystackOutcome,
        promoCode: appliedPromo?.code,
        paymentMethod: gatewayDue === 0 ? 'Credits / Rewards (₦0 Gateway)' : gatewayMethod,
      });
      setPaymentResult(res);
    }
  };

  const shipmentReviewsList = foundShipment
    ? measurementReviews.filter((mr) => mr.shipmentId === foundShipment.id)
    : [];

  const verifiedVolKg =
    foundShipment?.verifiedDimensions
      ? calculateVolumetricWeight(
          foundShipment.verifiedDimensions.length,
          foundShipment.verifiedDimensions.width,
          foundShipment.verifiedDimensions.height
        )
      : foundShipment?.quote.volumetricWeightKg;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-[#1F2937] dark:text-slate-100">
      {/* Header & Search Card */}
      <div className="sv-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#CAF0F8] text-[#0F172A] border border-[#90E0EF] dark:bg-sky-950 dark:text-[#90E0EF] dark:border-sky-800">
              Quotation Verification &amp; Payment
            </span>
            <h1 className="sv-h1 mt-2">
              Retrieve Quotation by Code
            </h1>
            <p className="sv-body text-[#4B5563] dark:text-slate-400 mt-1 max-w-xl">
              Review certified facility measurements, compare original vs revised versions, request a scale re-check, or approve and pay.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#247347] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span>Certified Scale Audit</span>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#4B5563] dark:text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                if (lookupError) setLookupError(null);
              }}
              placeholder="Enter QTE quote ref or SWV shipment code (e.g. QTE-26-410288)"
              aria-label="Quote or shipment code for lookup"
              className="sv-input w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-[14px] uppercase rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white tabular-nums"
            />
          </div>
          <button
            type="submit"
            className="sv-btn-primary min-h-[44px] px-6 py-2.5 rounded-full whitespace-nowrap cursor-pointer"
          >
            Retrieve Quote
          </button>
        </form>

        {lookupError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-[10px] text-[13px] font-medium text-[#B42318] dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}

        {/* Quick Select Chips: Customer's pending quotes + clearly labeled Demo quotes + Recovery Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[13px]">
          <div className="flex flex-wrap items-center gap-2">
            {myPendingQuotes.length > 0 && (
              <>
                <span className="sv-label">Your awaiting quotes:</span>
                {myPendingQuotes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleQuickPick(s.trackingNumber)}
                    className="font-semibold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 px-3 py-1 rounded-full hover:bg-[#90E0EF]/40 transition-colors tabular-nums text-[12px] cursor-pointer"
                  >
                    {s.trackingNumber}
                  </button>
                ))}
              </>
            )}
            <span className="sv-label">Demo refs:</span>
            <button
              type="button"
              onClick={() => handleQuickPick('QTE-26-410288')}
              className="text-[12px] font-semibold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8]/70 dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 px-3 py-1 rounded-full hover:bg-[#90E0EF]/40 transition-colors tabular-nums cursor-pointer"
            >
              QTE-26-410288 (Saved Quote)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPick('SWV-2026-NG5519')}
              className="text-[12px] font-semibold text-[#1F2937] dark:text-slate-300 bg-[#F1F5F9] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 px-3 py-1 rounded-full hover:border-[#00B4D8] transition-colors tabular-nums cursor-pointer"
            >
              SWV-2026-NG5519 (Reweighed)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPick('SWV-2026-NG9045')}
              className="text-[12px] font-semibold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors tabular-nums cursor-pointer"
            >
              SWV-2026-NG9045 (Weight Adjustment)
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setRecoveryOpen((prev) => !prev);
              setRecoveryNotice(null);
              setRecoveredResults(null);
            }}
            className="text-[13px] font-bold text-[#0096C7] dark:text-[#90E0EF] underline underline-offset-4 hover:text-[#00B4D8] flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Didn&apos;t receive your reference?</span>
          </button>
        </div>

        {/* Privacy-Safe OTP Contact Recovery Drawer */}
        {recoveryOpen && (
          <div className="p-4 sm:p-5 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900/70 border border-[#CBD5E1] dark:border-slate-700 space-y-3">
            <div>
              <h3 className="sv-h3">Recover Quote Reference via Verified Contact</h3>
              <p className="text-[12px] text-[#4B5563] dark:text-slate-400">
                Enter the email address or phone number used when requesting or saving your quote. We never confirm whether a contact exists prior to verification.
              </p>
            </div>
            <form onSubmit={handleRequestRecoveryOtp} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={recoveryContactInput}
                onChange={(e) => setRecoveryContactInput(e.target.value)}
                placeholder="Email (e.g. chinedu.eze@example.com) or Phone (+234...)"
                className="sv-input flex-1 min-h-[42px] px-3.5 py-2 text-[13px] rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
              />
              <button
                type="submit"
                className="sv-btn-primary min-h-[42px] px-5 py-2 rounded-full text-[13px] whitespace-nowrap cursor-pointer"
              >
                Send Recovery Code
              </button>
            </form>

            {recoveryNotice && (
              <div className="p-3 rounded-[8px] bg-[#CAF0F8]/70 dark:bg-sky-950/50 border border-[#90E0EF] dark:border-sky-800 text-[13px] text-[#0F172A] dark:text-sky-200 space-y-2">
                <div>{recoveryNotice}</div>
                {environmentMode === 'demo' && recoverySimHint && (
                  <div className="text-[12px] font-semibold">
                    Demo OTP Code: <code className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 tabular-nums">{recoverySimHint}</code>
                  </div>
                )}
              </div>
            )}

            {recoveryChallengeId && !recoveredResults && (
              <form onSubmit={handleVerifyRecoveryOtp} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={recoveryOtpInput}
                  onChange={(e) => setRecoveryOtpInput(e.target.value)}
                  placeholder="Enter 6-digit recovery OTP"
                  className="sv-input flex-1 min-h-[42px] px-3.5 py-2 text-[13px] rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white tabular-nums"
                />
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-full bg-[#0F172A] text-white text-[13px] font-bold cursor-pointer"
                >
                  Verify &amp; List Quotes
                </button>
              </form>
            )}

            {recoveryOtpError && (
              <p className="text-[12px] text-[#B42318] dark:text-rose-400 font-medium">{recoveryOtpError}</p>
            )}

            {recoveredResults && (
              <div className="space-y-2 pt-1">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#4B5563] dark:text-slate-400">
                  Recovered Records ({recoveredResults.quotes.length} Quotes · {recoveredResults.shipments.length} Unpaid Shipments)
                </div>
                {recoveredResults.quotes.length === 0 && recoveredResults.shipments.length === 0 ? (
                  <p className="text-[13px] text-[#4B5563] dark:text-slate-400">
                    No active quotes or unpaid shipments were matched to this verified contact.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recoveredResults.quotes.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setOtpVerifiedCodes((prev) => ({ ...prev, [q.quoteRef.toUpperCase()]: true }));
                          handleQuickPick(q.quoteRef);
                          setRecoveryOpen(false);
                        }}
                        className="p-3 rounded-[10px] border border-[#00B4D8] bg-white dark:bg-slate-800 text-left hover:bg-[#CAF0F8]/30 cursor-pointer"
                      >
                        <div className="font-bold text-[13px] text-[#111827] dark:text-white tabular-nums">
                          {q.quoteRef}
                        </div>
                        <div className="text-[12px] text-[#4B5563] dark:text-slate-400">
                          {q.items[0]?.destinationCity}, {q.items[0]?.destinationCountry} · {q.status.replace('_', ' ')}
                        </div>
                      </button>
                    ))}
                    {recoveredResults.shipments.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setOtpVerifiedCodes((prev) => ({ ...prev, [s.trackingNumber.toUpperCase()]: true }));
                          handleQuickPick(s.trackingNumber);
                          setRecoveryOpen(false);
                        }}
                        className="p-3 rounded-[10px] border border-amber-300 bg-white dark:bg-slate-800 text-left hover:bg-amber-50 cursor-pointer"
                      >
                        <div className="font-bold text-[13px] text-[#111827] dark:text-white tabular-nums">
                          {s.trackingNumber}
                        </div>
                        <div className="text-[12px] text-[#4B5563] dark:text-slate-400">
                          {s.destinationCity}, {s.destinationCountry} · {formatNaira(s.quote.totalAmount)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guest Rate-Limited OTP Gate for QTE or SWV */}
      {(foundQuote || foundShipment) && !isUnlocked && (
        <div className="sv-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#00B4D8]" />
            </div>
            <div className="space-y-1">
              <h2 className="sv-h2">
                Verify Identity for {activeTargetRef}
              </h2>
              <p className="sv-body text-[#4B5563] dark:text-slate-400">
                To protect private address and pricing records, confirm access with a 6-digit OTP (10-minute expiry, 5 max attempts).
              </p>
            </div>
          </div>

          {(() => {
            const masked = maskContactInfo({
              phone: foundQuote ? foundQuote.contactPhone : foundShipment?.customerPhone || foundShipment?.senderPhone,
              email: foundQuote ? foundQuote.contactEmail : foundShipment?.customerEmail,
            });
            return (
              <div className="p-4 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/70 border border-[#E2E8F0] dark:border-slate-800 text-[14px] space-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <div>
                    Registered Phone: <span className="font-bold text-[#111827] dark:text-white tabular-nums">{masked.maskedPhone}</span>
                  </div>
                  <div>
                    Registered Email: <span className="font-bold text-[#111827] dark:text-white">{masked.maskedEmail}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[12px] font-semibold text-[#4B5563] dark:text-slate-400">Delivery Channel:</span>
                  {(['email', 'sms', 'whatsapp'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setOtpChannel(ch)}
                      className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase cursor-pointer ${
                        otpChannel === ch
                          ? 'bg-[#00B4D8] text-white'
                          : 'bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#4B5563] dark:text-slate-300'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              className="sv-btn-primary min-h-[44px] px-6 py-2.5 rounded-full cursor-pointer"
            >
              Send Verification Code
            </button>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div
                className={`p-3.5 rounded-[10px] border text-[13px] flex flex-wrap items-center justify-between gap-2 ${
                  otpDeliveryStatus === 'provider_unconfigured'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                    : 'bg-[#CAF0F8]/70 dark:bg-sky-950/40 border-[#90E0EF] dark:border-sky-800 text-[#0F172A] dark:text-sky-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#00B4D8] shrink-0" />
                  <span>{otpDeliveryMsg}</span>
                </div>
                {environmentMode === 'demo' && otpSimulatedHint && (
                  <span className="font-bold tabular-nums">
                    Demo OTP: <code className="px-2 py-0.5 rounded bg-white dark:bg-slate-900">{otpSimulatedHint}</code>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="sv-input min-h-[44px] flex-1 px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white tabular-nums"
                />
                <button
                  type="submit"
                  className="sv-btn-primary min-h-[44px] px-6 py-2.5 rounded-full cursor-pointer"
                >
                  Verify &amp; Open Record
                </button>
                <button
                  type="button"
                  disabled={otpCooldownSec > 0}
                  onClick={handleSendOtp}
                  className="min-h-[44px] px-4 py-2 rounded-full border border-[#CBD5E1] dark:border-slate-700 text-[13px] font-bold text-[#1F2937] dark:text-slate-300 disabled:opacity-50 cursor-pointer tabular-nums"
                >
                  {otpCooldownSec > 0 ? `Resend (${otpCooldownSec}s)` : 'Resend OTP'}
                </button>
              </div>
              {otpError && (
                <p className="text-[13px] text-[#B42318] dark:text-rose-400 font-medium">{otpError}</p>
              )}
            </form>
          )}
        </div>
      )}

      {/* Unlocked QuoteRecord (QTE-YY-XXXXXX) Details */}
      {foundQuote && isUnlocked && (
        <div className="sv-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[20px] font-extrabold text-[#111827] dark:text-white tabular-nums">
                  {foundQuote.quoteRef}
                </span>
                <span className="text-[12px] font-semibold px-3 py-0.5 rounded-full bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] capitalize">
                  {foundQuote.type.replace('_', ' ')} · {foundQuote.status.replace('_', ' ')}
                </span>
                {foundQuote.isDemo && (
                  <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-700 text-[#4B5563] dark:text-slate-300">
                    Demo Quote
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#4B5563] dark:text-slate-400 mt-1">
                Prepared for {foundQuote.contactName} · Cannot authorize payment alone until converted to a confirmed shipment.
              </p>
            </div>

            <div className="text-right">
              <div className="sv-label">Estimated Quote Value</div>
              <div className="text-[24px] font-extrabold text-[#111827] dark:text-white tabular-nums">
                {foundQuote.totalEstimatedNgn > 0 ? formatNaira(foundQuote.totalEstimatedNgn) : 'Awaiting Desk Quote'}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {foundQuote.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[14px] text-[#111827] dark:text-white">
                    <span>{item.originCity}, {item.originCountry} → {item.destinationCity}, {item.destinationCountry}</span>
                    {item.isFragile && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        Fragile
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#4B5563] dark:text-slate-400">
                    {item.contentsDescription} · {item.declaredWeightKg} kg · {item.packageCount} package(s)
                  </p>
                  {item.isFragile && item.fragileHandlingNotes && (
                    <p className="text-[12px] text-amber-800 dark:text-amber-300 font-medium">
                      Handling Note: {item.fragileHandlingNotes}
                    </p>
                  )}
                </div>
                <span className="text-[12px] font-semibold uppercase px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700">
                  {item.serviceTier}
                </span>
              </div>
            ))}
          </div>

          {foundQuote.staffQuoteNotes && (
            <div className="p-4 rounded-[10px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[13px] space-y-1">
              <div className="font-bold text-[#247347] dark:text-emerald-400 flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4" />
                <span>Customer Service Quote Desk Note ({foundQuote.quotedBy || 'Quote Desk'})</span>
              </div>
              <p className="text-[#1F2937] dark:text-slate-200">{foundQuote.staffQuoteNotes}</p>
            </div>
          )}

          {foundQuote.status === 'converted' && foundQuote.convertedGroupCode ? (
            <div className="p-4 rounded-[10px] bg-[#CAF0F8]/50 border border-[#90E0EF] text-[13px] font-bold text-[#0F172A]">
              Already converted to Booking {foundQuote.convertedGroupCode}.
            </div>
          ) : (
            onConvertQuoteToBooking && (
              <div className="flex justify-end pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onConvertQuoteToBooking(foundQuote.quoteRef)}
                  className="sv-btn-primary min-h-[46px] px-7 py-2.5 rounded-full flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Book Shipment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          )}
        </div>
      )}

      {foundShipment && isUnlocked && (
        <div className="space-y-6">
          {/* Status Banner + Top Meta */}
          <div className="sv-card p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[20px] font-extrabold text-[#111827] dark:text-white tabular-nums">
                    {foundShipment.trackingNumber}
                  </span>
                  {foundShipment.isDemo && (
                    <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-700 text-[#4B5563] dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-600">
                      Demo Record
                    </span>
                  )}
                  {parentGroup && (
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium px-3 py-0.5 rounded-full bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800">
                      <Layers className="w-3 h-3 text-[#00B4D8]" />
                      Group {parentGroup.groupCode}
                    </span>
                  )}
                </div>
                <p className="text-[14px] text-[#4B5563] dark:text-slate-400 mt-1">
                  {foundShipment.originCity || 'Lagos'} → {foundShipment.destinationCity}, {foundShipment.destinationCountry} · {foundShipment.quote.serviceName}
                </p>
              </div>

              <div className="text-right">
                {foundShipment.paymentStatus === 'paid' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#247347] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Paid &amp; Confirmed
                  </span>
                ) : approvalCheck.allowed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-[#986B16] dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                    Awaiting Customer Approval (v{activeQuoteVersion?.version})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-[#B42318] dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Quote Unavailable
                  </span>
                )}
                <div className="text-[12px] font-medium text-[#4B5563] dark:text-slate-400 mt-1 tabular-nums">
                  Valid until: {foundShipment.quote.expiresAt.slice(0, 10)}
                </div>
              </div>
            </div>

            {/* Sibling Booking Group Switcher */}
            {parentGroup && groupSiblings.length > 1 && (
              <div className="p-4 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900/70 border border-[#E2E8F0] dark:border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#00B4D8]" />
                    Booking Group {parentGroup.groupCode} ({groupSiblings.length} Shipments)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {unpaidSiblings.length} unpaid · Partial payment never marks unpaid siblings settled
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupSiblings.map((sib) => {
                    const isCurrent = sib.id === foundShipment.id;
                    return (
                      <button
                        key={sib.id}
                        type="button"
                        onClick={() => handleQuickPick(sib.trackingNumber)}
                        className={`p-3 rounded-xl border text-left transition-all text-xs flex items-center justify-between gap-2 ${
                          isCurrent
                            ? 'border-[#00B4D8] bg-[#CAF0F8]/30 dark:bg-sky-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#00B4D8]'
                        }`}
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {sib.trackingNumber}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {sib.destinationCity}, {sib.destinationCountry}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-[#008EA8] dark:text-[#90E0EF]">
                            {formatNaira(sib.quote.totalAmount)}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              sib.paymentStatus === 'paid'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {sib.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Original Estimate vs Facility Verified Measurements */}
            <div className="space-y-3">
              <h2 className="sv-h2 flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#00B4D8]" />
                <span>Original Estimate vs. Facility Verified Measurements</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800 space-y-2">
                  <span className="sv-label uppercase tracking-wider block font-bold">
                    Customer Booking Estimate
                  </span>
                  <div className="flex justify-between text-[14px]">
                    <span className="font-semibold text-[#1F2937] dark:text-slate-300">Declared Weight:</span>
                    <span className="text-[#111827] dark:text-white tabular-nums">
                      {foundShipment.declaredWeightKg} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="font-semibold text-[#1F2937] dark:text-slate-300">Declared Dimensions:</span>
                    <span className="text-[#1F2937] dark:text-slate-200 tabular-nums">
                      {foundShipment.declaredDimensions
                        ? `${foundShipment.declaredDimensions.length}×${foundShipment.declaredDimensions.width}×${foundShipment.declaredDimensions.height} cm`
                        : 'Not provided'}
                    </span>
                  </div>
                  {foundShipment.quote.previousTotal && (
                    <div className="flex justify-between pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-[14px]">
                      <span className="font-semibold text-[#1F2937] dark:text-slate-300">Original Estimate:</span>
                      <span className="font-bold text-[#111827] dark:text-white tabular-nums">
                        {formatNaira(foundShipment.quote.previousTotal)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-[12px] bg-[#CAF0F8]/70 dark:bg-sky-950/35 border border-[#90E0EF] dark:border-sky-800 space-y-2 text-[#0F172A] dark:text-white">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#90E0EF] block">
                    Facility Certified Scale Record
                  </span>
                  <div className="flex justify-between text-[14px]">
                    <span className="font-semibold">Verified Actual Weight:</span>
                    <span className="font-bold tabular-nums">
                      {foundShipment.verifiedWeightKg || foundShipment.quote.actualWeightKg} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="font-semibold">Verified Dimensions:</span>
                    <span className="tabular-nums">
                      {foundShipment.verifiedDimensions
                        ? `${foundShipment.verifiedDimensions.length}×${foundShipment.verifiedDimensions.width}×${foundShipment.verifiedDimensions.height} cm`
                        : 'Standard parcel profile'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="font-semibold">Volumetric / Chargeable:</span>
                    <span className="font-bold tabular-nums">
                      {verifiedVolKg} kg vol · {foundShipment.quote.chargeableWeightKg} kg billed
                    </span>
                  </div>
                </div>
              </div>

              {foundShipment.packageMeasurements && foundShipment.packageMeasurements.length > 0 && (
                <div className="p-4 rounded-[12px] bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#00B4D8]" />
                      <span>Box-by-Box Certified Scale Breakdown ({foundShipment.packageMeasurements.length} package{foundShipment.packageMeasurements.length > 1 ? 's' : ''})</span>
                    </span>
                    <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-[#CAF0F8] text-[#0F172A] tabular-nums">
                      Carrier Divisor: ÷{(foundShipment.appliedDivisor || 5000).toLocaleString()}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                      <thead className="border-b border-[#E2E8F0] dark:border-slate-700 text-[#4B5563] dark:text-slate-400">
                        <tr>
                          <th className="py-1.5 pr-3">Box</th>
                          <th className="py-1.5 pr-3">L × W × H (cm)</th>
                          <th className="py-1.5 pr-3">Actual</th>
                          <th className="py-1.5 pr-3">Volumetric</th>
                          <th className="py-1.5 text-right">Billable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 tabular-nums">
                        {foundShipment.packageMeasurements.map((pkg, idx) => (
                          <tr key={pkg.id || idx}>
                            <td className="py-2 pr-3 font-semibold">{pkg.description || `Package #${pkg.boxNumber || idx + 1}`}</td>
                            <td className="py-2 pr-3">{pkg.lengthCm} × {pkg.widthCm} × {pkg.heightCm}</td>
                            <td className="py-2 pr-3">{pkg.actualWeightKg} kg</td>
                            <td className="py-2 pr-3">{pkg.volumetricWeightKg} kg</td>
                            <td className="py-2 text-right font-bold text-[#0F172A] dark:text-[#90E0EF]">{pkg.billableWeightKg} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4-Scenario Financial Settlement Summary */}
              {(() => {
                const settlement = evaluateShipmentFinancialSettlement({
                  finalShippingPriceNgn: foundShipment.quote.totalAmount,
                  verifiedPaymentsAllocatedNgn: foundShipment.originalPaidAmountNgn || (foundShipment.paymentStatus === 'paid' ? foundShipment.finalAmountPaidNgn || foundShipment.quote.totalAmount : 0),
                });
                const scenarioBadge =
                  settlement.scenario === 'underpaid'
                    ? { label: 'Additional Balance Due', cls: 'bg-amber-100 text-amber-900 border-amber-300' }
                    : settlement.scenario === 'overpaid'
                    ? { label: 'Overpayment Credit Issued', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
                    : settlement.scenario === 'exact'
                    ? { label: 'Exact Amount Settled', cls: 'bg-[#CAF0F8] text-[#0F172A] border-[#90E0EF]' }
                    : { label: 'Unpaid — Payment Required', cls: 'bg-slate-100 text-slate-800 border-slate-300' };
                return (
                  <div className="p-4 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900/70 border border-[#CBD5E1] dark:border-slate-700 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-[#111827] dark:text-white">
                        Settlement &amp; Balance Comparison
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${scenarioBadge.cls}`}>
                        {scenarioBadge.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] tabular-nums">
                      <div>
                        <span className="text-[#4B5563] dark:text-slate-400 block">Original Estimate</span>
                        <span className="font-bold text-[#111827] dark:text-white">
                          {formatNaira(foundShipment.quote.previousTotal || foundShipment.quote.totalAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#4B5563] dark:text-slate-400 block">Verified Final Price</span>
                        <span className="font-bold text-[#111827] dark:text-white">
                          {formatNaira(settlement.finalShippingPriceNgn)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#4B5563] dark:text-slate-400 block">Verified Paid</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {formatNaira(settlement.amountAlreadyPaidNgn)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#4B5563] dark:text-slate-400 block">
                          {settlement.overpaymentCreditNgn > 0 ? 'Account Credit Issued' : 'Remaining Payable'}
                        </span>
                        <span className="font-extrabold text-[#0096C7] dark:text-[#90E0EF]">
                          {settlement.overpaymentCreditNgn > 0
                            ? `+${formatNaira(settlement.overpaymentCreditNgn)}`
                            : formatNaira(settlement.remainingAmountNgn)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {foundShipment.quote.discrepancyReason && (
                <div className="p-3.5 rounded-[10px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[13px] font-medium text-[#986B16] dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{foundShipment.quote.discrepancyReason}</span>
                </div>
              )}

              {/* Measurement Review Request Action */}
              <div className="pt-1">
                {reviewFeedback && (
                  <div
                    className={`mb-3 p-3.5 rounded-[10px] text-[13px] border flex items-center gap-2 ${
                      reviewFeedback.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-[#247347] dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-[#B42318] dark:text-rose-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{reviewFeedback.message}</span>
                  </div>
                )}

                {shipmentReviewsList.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {shipmentReviewsList.map((mr) => (
                      <div
                        key={mr.id}
                        className="p-3.5 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-700 text-[13px] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#111827] dark:text-white">
                            Measurement Review Request ({mr.status.toUpperCase()})
                          </span>
                          <span className="sv-label tabular-nums">
                            {mr.createdAt.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-[#4B5563] dark:text-slate-400">{mr.reason}</p>
                        {mr.staffResolutionNote && (
                          <p className="text-[#247347] dark:text-emerald-400 font-semibold pt-1">
                            Operations Resolution: {mr.staffResolutionNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {foundShipment.paymentStatus !== 'paid' && (
                  <>
                    {!reviewFormOpen ? (
                      <button
                        type="button"
                        onClick={() => setReviewFormOpen(true)}
                        className="text-[13px] font-semibold text-[#0F172A] dark:text-[#90E0EF] underline underline-offset-4 hover:text-[#00B4D8] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5 text-[#00B4D8]" />
                        <span>Disagree with the scale reading? Request measurement review →</span>
                      </button>
                    ) : (
                      <form
                        onSubmit={handleRequestReviewSubmit}
                        className="p-4 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900/70 border border-[#CBD5E1] dark:border-slate-700 space-y-3"
                      >
                        <label className="block text-[14px] font-bold text-[#111827] dark:text-white">
                          Request Facility Measurement Review
                        </label>
                        <p className="sv-label">
                          Certified intake readings are locked by operations. Describe why you need a scale re-verification and an officer will review or issue a revised quote version.
                        </p>
                        <textarea
                          rows={2}
                          required
                          value={reviewReason}
                          onChange={(e) => setReviewReason(e.target.value)}
                          placeholder="e.g. Carton dimensions seem slightly oversized compared to my home measurement before pickup."
                          className="sv-input w-full px-3.5 py-2.5 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="sv-btn-primary min-h-[40px] px-5 py-2 rounded-full cursor-pointer"
                          >
                            Submit Review Request
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewFormOpen(false)}
                            className="min-h-[40px] px-4 py-2 border border-[#CBD5E1] dark:border-slate-700 text-[#1F2937] dark:text-slate-300 rounded-full text-[13px] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* *Price Breakdown (DHL Benchmark 2-Column Dotted Leader Rows) */}
            <div className="p-5 sm:p-6 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900/70 border border-[#E2E8F0] dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
                <div>
                  <h2 className="sv-h2">*Price Breakdown</h2>
                  <p className="sv-label tabular-nums">
                    Quotation {foundShipment.quote.id} · Estimated transit: {foundShipment.quote.transitWindow} · Quoted {foundShipment.quote.generatedAt.slice(0, 10)}
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold bg-[#CAF0F8] text-[#0F172A] border border-[#90E0EF] dark:bg-sky-950 dark:text-[#90E0EF]">
                  Currency: NGN
                </span>
              </div>

              <PriceBreakdownList
                items={[
                  {
                    label: `Air Carriage Linehaul (${foundShipment.quote.chargeableWeightKg} kg)`,
                    value: formatNaira(foundShipment.quote.freightCharge),
                  },
                  {
                    label: 'Jet Fuel Surcharge',
                    value: formatNaira(foundShipment.quote.jetFuelSurcharge),
                  },
                  {
                    label: 'Terminal Screening & Handling',
                    value: formatNaira(foundShipment.quote.handlingCharge),
                  },
                  {
                    label: `Collection Fee (${
                      foundShipment.collectionMethod === 'priority_pickup'
                        ? 'Priority Pickup'
                        : foundShipment.collectionMethod === 'dropoff'
                        ? 'Hub Drop-off'
                        : 'Standard Pickup'
                    })`,
                    value:
                      foundShipment.collectionFeeNgn && foundShipment.collectionFeeNgn > 0
                        ? formatNaira(foundShipment.collectionFeeNgn)
                        : '₦0 (Included)',
                  },
                  ...(foundShipment.quote.protectionCharge
                    ? [
                        {
                          label: 'Optional Shipment Protection',
                          value: formatNaira(foundShipment.quote.protectionCharge),
                        },
                      ]
                    : []),
                  {
                    label: 'VAT (7.5%)',
                    value: formatNaira(foundShipment.quote.vatAmount),
                  },
                  {
                    label: 'Gross Price*',
                    value: `${formatNaira(foundShipment.quote.totalAmount)}*`,
                    tone: 'total',
                  },
                ]}
              />

              <OptionalServiceAccordion
                title="Certified Intake Weighing & Pricing Policy"
                priceLabel="Audit Included"
                description="All international consignments are weighed on calibrated intake scales. Destination import duties and taxes remain the responsibility of the receiver unless explicitly stated on a commercial DDP agreement."
              />
            </div>

            {/* Quote Version History */}
            {foundShipment.quoteVersions && foundShipment.quoteVersions.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <h3 className="sv-h3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#00B4D8]" />
                  <span>Quotation Version Audit History</span>
                </h3>
                <div className="border border-[#E2E8F0] dark:border-slate-700 rounded-[12px] divide-y divide-[#E2E8F0] dark:divide-slate-700 overflow-hidden text-[13px]">
                  {foundShipment.quoteVersions.map((qv) => (
                    <div
                      key={qv.version}
                      className="p-3.5 bg-white dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111827] dark:text-white tabular-nums">
                            v{qv.version}
                          </span>
                          <span
                            className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                              qv.status === 'paid'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#247347] dark:text-emerald-400'
                                : qv.status === 'active'
                                ? 'bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF]'
                                : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#4B5563]'
                            }`}
                          >
                            {qv.status}
                          </span>
                          <span className="sv-label tabular-nums">
                            {qv.measuredWeightKg} kg · {qv.changedBy}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#4B5563] dark:text-slate-400">{qv.reason}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#111827] dark:text-white tabular-nums">
                          {formatNaira(qv.quote.totalAmount)}
                        </div>
                        <div className="text-[12px] text-[#4B5563] tabular-nums">
                          {qv.createdAt.slice(0, 10)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weight Verification Payment Adjustment Card (Requires explicit approval before carrier handover) */}
            {(() => {
              const shipAdjustments = paymentAdjustments.filter(
                (a) => a.shipmentId === foundShipment.id || a.trackingNumber === foundShipment.trackingNumber
              );
              if (shipAdjustments.length === 0) return null;
              return (
                <div className="space-y-3 pt-2">
                  {shipAdjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className={`p-5 rounded-[12px] border-2 space-y-4 ${
                        adj.status === 'pending_customer_approval'
                          ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/30'
                          : 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <h3 className="sv-h3 tabular-nums">
                              Weight Verification Adjustment · {adj.adjustmentRef}
                            </h3>
                            <p className="text-[12px] text-[#4B5563] dark:text-slate-400">
                              Immutable Shipment Code: <strong className="tabular-nums">{foundShipment.trackingNumber}</strong> · {adj.reason}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[12px] font-bold px-3 py-1 rounded-full ${
                            adj.status === 'pending_customer_approval'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-[#247347] border border-emerald-300'
                          }`}
                        >
                          {adj.status === 'pending_customer_approval'
                            ? 'Approval & Balance Due Before Dispatch'
                            : adj.status === 'refund_credited'
                            ? 'Lower Weight Wallet Credit Applied'
                            : 'Settled & Dispatch Cleared'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px] bg-white dark:bg-slate-900 p-4 rounded-[10px] border border-[#E2E8F0] dark:border-slate-700">
                        <div>
                          <div className="sv-label">Original Weight</div>
                          <div className="font-bold text-[#111827] dark:text-white tabular-nums">{adj.originalWeightKg} kg</div>
                        </div>
                        <div>
                          <div className="sv-label">Verified Billable Weight</div>
                          <div className="font-bold text-[#0096C7] dark:text-[#90E0EF] tabular-nums">{adj.verifiedBillableWeightKg} kg</div>
                        </div>
                        <div>
                          <div className="sv-label">Original Paid</div>
                          <div className="font-bold text-[#111827] dark:text-white tabular-nums">{formatNaira(adj.originalAmountPaidNgn)}</div>
                        </div>
                        <div>
                          <div className="sv-label">Revised Total ({adj.differenceNgn > 0 ? `+${formatNaira(adj.differenceNgn)} Due` : `${formatNaira(adj.differenceNgn)}`})</div>
                          <div className="font-extrabold text-[#111827] dark:text-white tabular-nums">{formatNaira(adj.revisedAmountNgn)}</div>
                        </div>
                      </div>

                      {adj.status === 'pending_customer_approval' && (
                        <div className="space-y-3">
                          <label className="flex items-start gap-2.5 text-[13px] text-[#111827] dark:text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={adjConsentChecked}
                              onChange={(e) => setAdjConsentChecked(e.target.checked)}
                              className="mt-0.5 rounded text-[#00B4D8]"
                            />
                            <span>
                              I explicitly approve the revised {adj.verifiedBillableWeightKg} kg billable weight and authorize charging ONLY the additional balance of <strong className="tabular-nums">{formatNaira(adj.differenceNgn)}</strong>. (Swiftvero never auto-charges.)
                            </span>
                          </label>

                          {/* Optional Partial Credit / Cashback / Bonus Deductions + Paystack Outcome for Adjustment */}
                          {!isGuest && (balancesSnapshot.availableAccountCreditNgn > 0 || balancesSnapshot.cashbackBalanceNgn > 0 || balancesSnapshot.activeBonusBalanceNgn > 0) && (
                            <div className="p-3 rounded-[10px] bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[12px]">
                              {balancesSnapshot.availableAccountCreditNgn > 0 && (
                                <div>
                                  <label className="block font-semibold text-[#4B5563] dark:text-slate-300 mb-1">
                                    Use Account Credit (Max {formatNaira(balancesSnapshot.availableAccountCreditNgn)})
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={balancesSnapshot.availableAccountCreditNgn}
                                    value={adjCreditInput}
                                    onChange={(e) => setAdjCreditInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                                  />
                                </div>
                              )}
                              {balancesSnapshot.cashbackBalanceNgn > 0 && (
                                <div>
                                  <label className="block font-semibold text-[#4B5563] dark:text-slate-300 mb-1">
                                    Use Cashback (Max {formatNaira(balancesSnapshot.cashbackBalanceNgn)})
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={balancesSnapshot.cashbackBalanceNgn}
                                    value={adjCashbackInput}
                                    onChange={(e) => setAdjCashbackInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                                  />
                                </div>
                              )}
                              {balancesSnapshot.activeBonusBalanceNgn > 0 && (
                                <div>
                                  <label className="block font-semibold text-[#4B5563] dark:text-slate-300 mb-1">
                                    Use Bonus (Max {formatNaira(balancesSnapshot.activeBonusBalanceNgn)})
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={balancesSnapshot.activeBonusBalanceNgn}
                                    value={adjBonusInput}
                                    onChange={(e) => setAdjBonusInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {(['Paystack Card', 'Virtual Bank Transfer', 'USSD'] as const).map((pm) => (
                                <button
                                  key={pm}
                                  type="button"
                                  onClick={() => setAdjPayMethod(pm)}
                                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold border cursor-pointer ${
                                    adjPayMethod === pm
                                      ? 'border-[#00B4D8] bg-[#CAF0F8] text-[#0F172A]'
                                      : 'border-[#CBD5E1] bg-white dark:bg-slate-800 text-[#4B5563] dark:text-slate-300'
                                  }`}
                                >
                                  {pm}
                                </button>
                              ))}
                              <select
                                aria-label="Paystack Demo Outcome for Adjustment"
                                value={adjPaystackOutcome}
                                onChange={(e) => setAdjPaystackOutcome(e.target.value as PaystackOutcome)}
                                className="px-2.5 py-1.5 rounded-full text-[12px] font-semibold border border-[#CBD5E1] bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                              >
                                <option value="success">Paystack Demo: Success</option>
                                <option value="pending">Paystack Demo: Pending</option>
                                <option value="failed">Paystack Demo: Failed</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              disabled={!adjConsentChecked}
                              onClick={() => {
                                const res = settlePaymentAdjustment({
                                  adjustmentId: adj.id,
                                  paymentMethod: adjPayMethod,
                                  useAccountCreditNgn: Number(adjCreditInput) || 0,
                                  useCashbackNgn: Number(adjCashbackInput) || 0,
                                  useBonusNgn: Number(adjBonusInput) || 0,
                                  paystackOutcome: adjPaystackOutcome,
                                });
                                setAdjPayResult(res);
                              }}
                              className="sv-btn-primary min-h-[42px] px-6 py-2 rounded-full disabled:opacity-50 cursor-pointer"
                            >
                              Approve &amp; Pay Balance ({formatNaira(adj.differenceNgn)})
                            </button>
                          </div>
                        </div>
                      )}

                      {adjPayResult && (
                        <div className={`p-3.5 rounded-[10px] bg-white dark:bg-slate-900 border text-[13px] flex items-center gap-2 font-semibold ${adjPayResult.success ? 'border-emerald-300 text-[#247347] dark:text-emerald-400' : 'border-rose-300 text-[#B42318] dark:text-rose-400'}`}>
                          <Receipt className="w-4 h-4 shrink-0" />
                          <span>
                            {adjPayResult.message}
                            {adjPayResult.receipt ? ` · Receipt: ${adjPayResult.receipt.receiptNumber}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Approve & Pay Section */}
          {paymentResult && (
            <div
              className={`p-5 rounded-[12px] border space-y-3 ${
                paymentResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-[15px] text-[#111827] dark:text-white">
                <CheckCircle2 className="w-5 h-5 text-[#247347] shrink-0" />
                <span>{paymentResult.message}</span>
              </div>
              {paymentResult.success && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShipmentForTracking(foundShipment.trackingNumber);
                    onTrackShipment?.(foundShipment.trackingNumber);
                  }}
                  className="sv-btn-primary min-h-[44px] px-6 py-2 rounded-full inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View Shipment Tracking</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {rejectResult && (
            <div className={`p-4 rounded-[12px] border text-[13px] font-semibold flex items-center gap-2 ${rejectResult.success ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-rose-50 border-rose-300 text-rose-900'}`}>
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{rejectResult.message}</span>
            </div>
          )}

          {approvalCheck.allowed && !paymentResult?.success && !foundShipment.quoteRejectedAt && (
            <div className="sv-card border-2 border-[#00B4D8] p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-slate-700">
                <div>
                  <h2 className="sv-h2">
                    Approve &amp; Pay Quotation
                  </h2>
                  <p className="sv-body text-[#4B5563] dark:text-slate-400">
                    Dispatch occurs only after explicit quote approval and verified settlement.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-full border border-rose-300 dark:border-rose-800 text-[12px] font-bold text-[#B42318] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    Reject Revised Quote
                  </button>
                </div>
              </div>

              {/* Destination-Supported Service Tier Selector when availableServiceQuotes exist */}
              {foundShipment.availableServiceQuotes && foundShipment.availableServiceQuotes.length > 0 && (
                <div className="space-y-2">
                  <span className="sv-label block font-semibold">
                    Select Available Carrier Service Tier for {foundShipment.destinationCountry}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {foundShipment.availableServiceQuotes.map((opt) => (
                      <label
                        key={opt.serviceTier}
                        className={`p-3.5 rounded-[10px] border cursor-pointer flex items-center justify-between gap-3 ${
                          selectedServiceTier === opt.serviceTier
                            ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/35 dark:bg-sky-950/40'
                            : 'border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="quoteServiceTier"
                            checked={selectedServiceTier === opt.serviceTier}
                            onChange={() => setSelectedServiceTier(opt.serviceTier)}
                            className="text-[#00B4D8]"
                          />
                          <div>
                            <div className="font-bold text-[13px] text-[#111827] dark:text-white">
                              {opt.serviceName}
                            </div>
                            <div className="text-[11px] text-[#4B5563] dark:text-slate-400">
                              {opt.transitWindow} · {opt.chargeableWeightKg} kg
                            </div>
                          </div>
                        </div>
                        <span className="font-extrabold text-[14px] text-[#0F172A] dark:text-[#90E0EF] tabular-nums">
                          {formatNaira(opt.totalAmount)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Group Multi-Selection if unpaid siblings exist */}
              {unpaidSiblings.length > 1 && (
                <div className="p-4 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-700 space-y-2.5 text-[14px]">
                  <span className="font-bold text-[#111827] dark:text-white block">
                    Select Unpaid Group Shipments to Settle:
                  </span>
                  <div className="space-y-1.5">
                    {unpaidSiblings.map((sib) => {
                      const checked = paySelectedGroupIds.includes(sib.id);
                      return (
                        <label
                          key={sib.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-[10px] bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPaySelectedGroupIds((prev) => [...prev, sib.id]);
                                } else if (paySelectedGroupIds.length > 1) {
                                  setPaySelectedGroupIds((prev) => prev.filter((id) => id !== sib.id));
                                }
                              }}
                              className="rounded text-[#00B4D8] focus:ring-[#90E0EF]"
                            />
                            <span className="font-bold text-[#111827] dark:text-white tabular-nums">
                              {sib.trackingNumber}
                            </span>
                            <span className="text-[#4B5563] dark:text-slate-400">
                              → {sib.destinationCity}
                            </span>
                          </div>
                          <span className="font-bold text-[#0F172A] dark:text-[#90E0EF] tabular-nums">
                            {formatNaira(sib.quote.totalAmount)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Separated Partial Balances & Rewards Controls + Paystack Outcome Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="sv-label block font-semibold">
                    Separated Credits &amp; Rewards{' '}
                    {!isGuest
                      ? `(${(foundShipment?.senderName || currentCustomer.name).split(' ')[0]})`
                      : '(Sign in to apply)'}
                  </label>
                  <div className="space-y-2 text-[13px]">
                    {/* 1. Account Credit (Overpayment) */}
                    <div className="p-3 rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5 text-[#111827] dark:text-white">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          Available Account Credit
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {formatNaira(balancesSnapshot.availableAccountCreditNgn)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={balancesSnapshot.availableAccountCreditNgn}
                          disabled={isGuest || balancesSnapshot.availableAccountCreditNgn <= 0}
                          value={accountCreditInput}
                          onChange={(e) => setAccountCreditInput(e.target.value)}
                          aria-label="Apply Account Credit amount"
                          className="sv-input flex-1 px-2.5 py-1.5 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] tabular-nums disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={isGuest || balancesSnapshot.availableAccountCreditNgn <= 0}
                          onClick={() =>
                            setAccountCreditInput(
                              String(Math.min(balancesSnapshot.availableAccountCreditNgn, netDueAfterPromo))
                            )
                          }
                          className="px-2.5 py-1 rounded-[6px] bg-[#CAF0F8] text-[#0F172A] text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                        >
                          Use Max
                        </button>
                      </div>
                    </div>

                    {/* 2. Cashback Balance */}
                    <div className="p-3 rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5 text-[#111827] dark:text-white">
                          <Coins className="w-3.5 h-3.5 text-[#00B4D8]" />
                          Cashback Balance
                        </span>
                        <span className="font-bold text-[#0F172A] dark:text-[#90E0EF] tabular-nums">
                          {formatNaira(balancesSnapshot.cashbackBalanceNgn)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={balancesSnapshot.cashbackBalanceNgn}
                          disabled={isGuest || balancesSnapshot.cashbackBalanceNgn <= 0}
                          value={cashbackInput}
                          onChange={(e) => setCashbackInput(e.target.value)}
                          aria-label="Apply Cashback Balance amount"
                          className="sv-input flex-1 px-2.5 py-1.5 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] tabular-nums disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={isGuest || balancesSnapshot.cashbackBalanceNgn <= 0}
                          onClick={() =>
                            setCashbackInput(
                              String(Math.min(balancesSnapshot.cashbackBalanceNgn, Math.max(0, netDueAfterPromo - creditApplied)))
                            )
                          }
                          className="px-2.5 py-1 rounded-[6px] bg-[#CAF0F8] text-[#0F172A] text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                        >
                          Use Max
                        </button>
                      </div>
                    </div>

                    {/* 3. Eligible Bonus Balance (Expired grants blocked) */}
                    <div className="p-3 rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5 text-[#111827] dark:text-white">
                          <Gift className="w-3.5 h-3.5 text-amber-600" />
                          Bonus Balance (Eligible)
                        </span>
                        <span className="font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                          {formatNaira(deductionAllocation.eligibleBonusBalanceNgn)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={deductionAllocation.eligibleBonusBalanceNgn}
                          disabled={isGuest || deductionAllocation.eligibleBonusBalanceNgn <= 0}
                          value={bonusInput}
                          onChange={(e) => setBonusInput(e.target.value)}
                          aria-label="Apply Bonus Balance amount"
                          className="sv-input flex-1 px-2.5 py-1.5 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] tabular-nums disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={isGuest || deductionAllocation.eligibleBonusBalanceNgn <= 0}
                          onClick={() =>
                            setBonusInput(
                              String(
                                Math.min(
                                  deductionAllocation.eligibleBonusBalanceNgn,
                                  Math.max(0, netDueAfterPromo - creditApplied - cashbackApplied)
                                )
                              )
                            )
                          }
                          className="px-2.5 py-1 rounded-[6px] bg-[#CAF0F8] text-[#0F172A] text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                        >
                          Use Max
                        </button>
                      </div>
                      {balancesSnapshot.expiredBonusBalanceNgn > 0 && (
                        <div className="text-[11px] text-[#986B16] dark:text-amber-400">
                          {formatNaira(balancesSnapshot.expiredBonusBalanceNgn)} expired bonus is excluded and cannot be redeemed.
                        </div>
                      )}
                    </div>

                    {/* 4. Optional Deposited Wallet */}
                    <label className={`flex items-center justify-between p-3 rounded-[10px] border ${isGuest || walletAvailable <= 0 ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} border-[#CBD5E1] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={isGuest || walletAvailable <= 0}
                          checked={useWallet && walletAvailable > 0}
                          onChange={(e) => setUseWallet(e.target.checked)}
                          className="rounded text-[#00B4D8]"
                        />
                        <Wallet className="w-4 h-4 text-[#00B4D8]" />
                        <span className="font-medium">Apply Deposited Wallet</span>
                      </div>
                      <span className="font-bold text-[#111827] dark:text-white tabular-nums">
                        {formatNaira(walletAvailable)}
                      </span>
                    </label>

                    {!deductionAllocation.valid && deductionAllocation.error && (
                      <div className="p-2.5 rounded-[8px] bg-rose-50 border border-rose-200 text-[12px] text-[#B42318] font-medium">
                        {deductionAllocation.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {gatewayDue > 0 ? (
                    <>
                      <div className="space-y-2">
                        <label className="sv-label block font-semibold">
                          Paystack Balance Due ({formatNaira(gatewayDue)})
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(['Paystack Card', 'Virtual Bank Transfer', 'USSD'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setGatewayMethod(m)}
                              className={`min-h-[44px] px-3 py-2 rounded-[10px] border text-[13px] font-semibold text-center transition-colors cursor-pointer ${
                                gatewayMethod === m
                                  ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/50 dark:bg-sky-950/50 text-[#0F172A] dark:text-[#90E0EF]'
                                  : 'border-[#CBD5E1] dark:border-slate-700 text-[#1F2937] dark:text-slate-300'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 space-y-2">
                        <label className="block text-[12px] font-bold text-[#111827] dark:text-white">
                          Paystack Demo Outcome Simulation
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['success', 'pending', 'failed'] as const).map((out) => (
                            <button
                              key={out}
                              type="button"
                              onClick={() => setPaystackOutcome(out)}
                              className={`px-2.5 py-1.5 rounded-[8px] text-[12px] font-bold capitalize border cursor-pointer ${
                                paystackOutcome === out
                                  ? out === 'success'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : out === 'pending'
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white dark:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 text-[#4B5563] dark:text-slate-300'
                              }`}
                            >
                              {out}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-[#4B5563] dark:text-slate-400">
                          If Pending or Failed is selected, 100% of reserved Account Credit, Cashback, and Bonus automatically roll back.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[13px] text-[#247347] dark:text-emerald-300 space-y-1">
                      <div className="font-bold">100% Covered by Credits / Rewards (₦0 Gateway Charge)</div>
                      <p className="text-[12px]">
                        No Paystack card charge is required. Confirming settles this quotation immediately.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Unpreselected Customer Approval Checkbox */}
              <label className="flex items-start gap-2.5 text-[14px] text-[#1F2937] dark:text-slate-300 cursor-pointer p-3.5 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={quoteApprovalChecked}
                  onChange={(e) => setQuoteApprovalChecked(e.target.checked)}
                  className="mt-1 rounded border-[#CBD5E1] text-[#00B4D8] focus:ring-[#90E0EF]"
                />
                <span>
                  I confirm that I have reviewed the facility measurements and itemized quotation v{activeQuoteVersion?.version}, and authorize settlement of{' '}
                  <strong className="text-[#111827] dark:text-white tabular-nums">
                    {formatNaira(netDueAfterPromo)}
                  </strong>
                  .
                </span>
              </label>

              {/* Collapsible Soft Cyan Sticky Payment Summary Drawer (DHL Benchmark) */}
              {(() => {
                const drawerItems: PriceLineItem[] = [
                  {
                    label: `Selected Quote Total (${targetShipmentsForPayment.length} shipment${targetShipmentsForPayment.length > 1 ? 's' : ''})`,
                    value: formatNaira(grossSelectedTotal),
                  },
                  ...(promoDiscountNgn > 0
                    ? [
                        {
                          label: `Promo Discount (${appliedPromo?.code})`,
                          value: `-${formatNaira(promoDiscountNgn)}`,
                          tone: 'discount' as const,
                        },
                      ]
                    : []),
                  ...(creditApplied > 0
                    ? [
                        {
                          label: 'Account Credit Applied',
                          value: `-${formatNaira(creditApplied)}`,
                          tone: 'discount' as const,
                        },
                      ]
                    : []),
                  ...(cashbackApplied > 0
                    ? [
                        {
                          label: 'Cashback Redeemed',
                          value: `-${formatNaira(cashbackApplied)}`,
                          tone: 'discount' as const,
                        },
                      ]
                    : []),
                  ...(bonusApplied > 0
                    ? [
                        {
                          label: 'Bonus Redeemed',
                          value: `-${formatNaira(bonusApplied)}`,
                          tone: 'discount' as const,
                        },
                      ]
                    : []),
                  ...(walletApplied > 0
                    ? [
                        {
                          label: 'Deposited Wallet Deduction',
                          value: `-${formatNaira(walletApplied)}`,
                          tone: 'discount' as const,
                        },
                      ]
                    : []),
                  {
                    label: 'Gateway Payable Now*',
                    value: formatNaira(gatewayDue),
                    tone: 'total' as const,
                  },
                ];

                return (
                  <StickyPaymentSummaryDrawer
                    title="Payment Summary"
                    itemCountLabel={`${targetShipmentsForPayment.length} shipment${targetShipmentsForPayment.length > 1 ? 's' : ''}`}
                    totalDisplay={formatNaira(gatewayDue)}
                    lineItems={drawerItems}
                    promoInput={promoCodeInput}
                    onPromoInputChange={setPromoCodeInput}
                    onApplyPromo={handleApplyPromo}
                    promoMessage={promoMsg}
                    onCancel={
                      onOpenSupportWithShipment
                        ? () => onOpenSupportWithShipment(foundShipment.trackingNumber)
                        : undefined
                    }
                    cancelLabel={onOpenSupportWithShipment ? 'Ask Support' : undefined}
                    onNext={handleApproveAndPay}
                    nextLabel={gatewayDue === 0 ? 'Approve & Settle with Credits' : 'Approve & Pay Quotation'}
                    nextDisabled={!quoteApprovalChecked || !deductionAllocation.valid}
                  />
                );
              })()}
            </div>
          )}

          {/* Reject Revised Quote Modal */}
          {rejectModalOpen && foundShipment && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
              <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-[14px] max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="sv-h3 text-[#B42318]">Reject Revised Quotation ({foundShipment.trackingNumber})</h3>
                <p className="text-[13px] text-[#4B5563] dark:text-slate-400">
                  Rejecting pauses carrier dispatch and alerts Operations to contact you regarding return or re-verification.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!rejectReasonInput.trim()) return;
                    const res = rejectRevisedQuote(foundShipment.id, rejectReasonInput.trim());
                    setRejectResult(res);
                    setRejectModalOpen(false);
                  }}
                  className="space-y-3"
                >
                  <textarea
                    rows={3}
                    required
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    placeholder="Reason for rejecting this quotation (e.g. cost exceeds budget, request package return)..."
                    className="sv-input w-full px-3 py-2 text-[13px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalOpen(false)}
                      className="px-4 py-2 rounded-full border border-[#CBD5E1] text-[13px] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold cursor-pointer"
                    >
                      Confirm Quote Rejection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {!approvalCheck.allowed && foundShipment.paymentStatus !== 'paid' && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{approvalCheck.reason}</span>
              </div>
              {onOpenSupportWithShipment && (
                <button
                  type="button"
                  onClick={() => onOpenSupportWithShipment(foundShipment.trackingNumber)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-lg font-bold shrink-0"
                >
                  Contact Support
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
