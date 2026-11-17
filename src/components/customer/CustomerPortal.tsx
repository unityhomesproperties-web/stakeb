import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { StatusPill } from '../common/StatusPill';
import { BookingWizard } from '../booking/BookingWizard';
import { QuoteRetrievalView } from '../booking/QuoteRetrievalView';
import { TrackingView } from '../tracking/TrackingView';
import { MyWalletView } from './MyWalletView';
import { CustomerProfileView } from './CustomerProfileView';
import { CustomerTicketsView } from './CustomerTicketsView';
import { CustomerNotificationsView } from './CustomerNotificationsView';
import { AddressBookView } from './AddressBookView';
import { ShipmentTemplatesView } from './ShipmentTemplatesView';
import { SupportClaimsView } from './SupportClaimsView';
import { BusinessTeamView } from './BusinessTeamView';
import { RewardsView } from '../rewards/RewardsView';
import { CustomerReviewsView } from '../reviews/CustomerReviewsView';
import { MyQuotesView, MyPickupsView, PaymentsReceiptsView } from './CustomerHistoryViews';
import { BookPickupModal } from './BookPickupModal';
import { formatNaira } from '../../utils/shipping-calculator';
import { computeCustomerRewardBreakdown } from '../../utils/rewards-engine';
import { buildCustomerRecentActivity } from '../../utils/review-rules';
import { getCustomerFriendlyStatusLabel } from '../../utils/quote-lifecycle';
import {
  Home,
  User,
  Package,
  Plus,
  Wallet,
  ChevronRight,
  AlertTriangle,
  Search,
  RotateCcw,
  Coins,
  Gift,
  Copy,
  Check,
  FileText,
  Star,
  HelpCircle,
  ShieldAlert,
  MapPin,
  Bookmark,
  Bell,
  Users,
  Layers,
  Clock,
  Truck,
  Receipt,
  Archive,
  XCircle,
} from 'lucide-react';

interface CustomerPortalProps {
  onOpenKyc: () => void;
  onOpenPolicy: (key: any) => void;
}

const getProgressPercent = (status: string): number => {
  switch (status) {
    case 'booked':
    case 'pickup_assigned':
      return 18;
    case 'picked_up':
    case 'pickup_completed':
    case 'received_at_hub':
      return 32;
    case 'under_inspection':
    case 'quote_ready':
    case 'awaiting_approval':
      return 45;
    case 'payment_confirmed':
    case 'carrier_received':
      return 60;
    case 'in_transit':
    case 'departed_origin':
    case 'arrived_transit_hub':
      return 74;
    case 'customs_processing':
    case 'customs_cleared':
      return 86;
    case 'out_for_delivery':
      return 94;
    case 'delivered':
      return 100;
    default:
      return 15;
  }
};

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onOpenKyc,
  onOpenPolicy,
}) => {
  const {
    currentCustomer,
    shipments,
    bookingGroups,
    cashbackLedger,
    referrals,
    walletTransactions,
    supportClaims,
    activeCustomerTab,
    setActiveCustomerTab,
    setSelectedShipmentForTracking,
    resetDemoData,
    paymentAdjustments,
    cancelShipment,
    archiveShipment,
    getCustomerBalancesSnapshot,
    shipmentCredits,
    customerNotifications,
  } = useDemo();

  const [initialReviewShipmentId, setInitialReviewShipmentId] = useState<string>('');
  const [initialQuoteCode, setInitialQuoteCode] = useState<string>('');
  const [bookingSourceQuoteRef, setBookingSourceQuoteRef] = useState<string>('');
  const [shipmentSearch, setShipmentSearch] = useState<string>('');
  const [shipmentHistoryFilter, setShipmentHistoryFilter] = useState<
    'all' | 'active' | 'delivered' | 'archived'
  >('all');
  const [shipmentActionNotice, setShipmentActionNotice] = useState<string | null>(null);
  const [bookPickupModalOpen, setBookPickupModalOpen] = useState<boolean>(false);
  const [dashboardTrackingInput, setDashboardTrackingInput] = useState<string>('');
  const [copiedReferral, setCopiedReferral] = useState(false);

  const myShipments = shipments.filter((s) => s.customerId === currentCustomer.id);
  const filteredHistoryShipments = myShipments.filter((s) => {
    const isArchived = Boolean(s.isArchived);
    if (shipmentHistoryFilter === 'archived') {
      if (!isArchived) return false;
    } else {
      if (isArchived) return false;
      if (shipmentHistoryFilter === 'active' && (s.status === 'delivered' || s.status === 'cancelled')) {
        return false;
      }
      if (shipmentHistoryFilter === 'delivered' && s.status !== 'delivered') {
        return false;
      }
    }
    if (!shipmentSearch.trim()) return true;
    const q = shipmentSearch.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.destinationCountry.toLowerCase().includes(q) ||
      s.destinationCity.toLowerCase().includes(q) ||
      s.recipientName.toLowerCase().includes(q)
    );
  });
  const activeShipments = myShipments.filter(
    (s) => s.status !== 'delivered' && s.status !== 'cancelled'
  );

  // Real "Needs Attention" items
  const pendingApprovals = myShipments.filter(
    (s) => s.status === 'quote_ready' || s.status === 'draft'
  );
  const overdueAlerts = myShipments.filter((s) => s.isUpdateOverdue);
  const kycRequired =
    currentCustomer.kycStatus !== 'verified' &&
    myShipments.some((s) => (s.declaredValueNgn || s.quote.totalAmount) >= 100000);

  const attentionCount =
    pendingApprovals.length + overdueAlerts.length + (kycRequired ? 1 : 0);
  const hasNeedsAttention = attentionCount > 0;

  // Separated Wallet, Account Credit, Cashback, Bonus & Outstanding Balances
  const rewardBreakdown = computeCustomerRewardBreakdown({
    customer: currentCustomer,
    ledger: cashbackLedger,
    referrals,
  });
  const separatedBalances = getCustomerBalancesSnapshot(currentCustomer.id);
  const unreadNotifCount = customerNotifications.filter(
    (n) => n.customerId === currentCustomer.id && !n.isRead
  ).length;

  // Recent Activity Feed
  const recentActivity = buildCustomerRecentActivity({
    customerId: currentCustomer.id,
    shipments,
    walletTransactions,
    cashbackLedger,
    supportClaims,
    limit: 5,
  });

  const handleTrackShipment = (trackingNumber: string) => {
    setSelectedShipmentForTracking(trackingNumber);
    setActiveCustomerTab('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQuoteRetrieval = (trackingNumber: string = '') => {
    setInitialQuoteCode(trackingNumber);
    setActiveCustomerTab('retrieve_quote');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardTrackingInput.trim()) return;
    handleTrackShipment(dashboardTrackingInput.trim().toUpperCase());
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(currentCustomer.referralCode);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28 md:pb-16 px-4 sm:px-6 text-[#1F2937] dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Portal Navigation */}
      <nav
        aria-label="Customer Portal Navigation"
        className="hidden md:flex flex-wrap items-center gap-1.5 border-b border-[#E2E8F0] dark:border-slate-800 pb-3"
      >
        {[
          { id: 'overview', label: 'Home', icon: Home },
          { id: 'my_shipments', label: 'Shipments', icon: Package },
          { id: 'my_quotes', label: 'My Quotes', icon: FileText },
          { id: 'my_pickups', label: 'My Pickups', icon: Truck },
          { id: 'payments_receipts', label: 'Payments & Receipts', icon: Receipt },
          { id: 'retrieve_quote', label: 'Retrieve Quote', icon: Search },
          { id: 'wallet', label: 'Wallet', icon: Wallet },
          { id: 'cashback', label: 'Rewards', icon: Coins },
          { id: 'profile', label: 'Profile & Settings', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive =
            activeCustomerTab === item.id ||
            (item.id === 'my_shipments' && activeCustomerTab === 'tracking');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveCustomerTab(item.id)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#CAF0F8] dark:bg-sky-950/70 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800 font-bold'
                  : 'text-[#4B5563] dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent font-semibold'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00B4D8]' : 'text-[#4B5563] dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* OVERVIEW DASHBOARD VIEW */}
      {activeCustomerTab === 'overview' && (
        <div className="space-y-5">
          {/* Honest Demo Mode Bar */}
          <div className="px-4 py-2.5 rounded-[12px] bg-[#F1F5F9] dark:bg-slate-900/90 border border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <span className="text-[#4B5563] dark:text-slate-400">
              <strong className="text-[#111827] dark:text-white">Demo Mode:</strong> Simulated shipments, balances, and carrier events. No live charges or external dispatch.
            </span>
            <button
              type="button"
              onClick={resetDemoData}
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#1F2937] dark:text-slate-200 hover:border-[#00B4D8] font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-[12px]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>Reset Demo</span>
            </button>
          </div>

          {/* 1. Compact Greeting + Single Primary CTA */}
          <div className="sv-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#CAF0F8] text-[#0F172A] border border-[#90E0EF] dark:bg-sky-950 dark:text-[#90E0EF] dark:border-sky-800">
                {currentCustomer.customerType === 'business'
                  ? 'Business Account'
                  : 'Customer Account'}
              </span>
              <h1 className="sv-h1 mt-1">
                {getGreeting()},{' '}
                {currentCustomer.customerType === 'business'
                  ? currentCustomer.companyName || currentCustomer.name
                  : currentCustomer.name.split(' ')[0]}
              </h1>
              <p className="sv-body text-[#4B5563] dark:text-slate-400">
                {activeShipments.length > 0
                  ? `You have ${activeShipments.length} active shipment${activeShipments.length > 1 ? 's' : ''} in progress.`
                  : 'Send a single parcel or multi-destination shipment group from Nigeria.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setBookPickupModalOpen(true)}
                className="sv-btn-primary min-h-[44px] px-5 py-2 rounded-full flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Truck className="w-4 h-4 stroke-[2.2]" />
                <span>Book a Pickup</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCustomerTab('book')}
                className="min-h-[44px] px-4 py-2 rounded-full text-[13px] font-bold bg-[#CAF0F8] dark:bg-sky-950/70 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800 hover:bg-[#90E0EF]/50 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Get a Quote</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCustomerTab('tracking')}
                className="min-h-[44px] px-4 py-2 rounded-full text-[13px] font-bold bg-white dark:bg-slate-800 text-[#1F2937] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 hover:border-[#00B4D8] flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4 text-[#00B4D8]" />
                <span>Track a Shipment</span>
              </button>
            </div>
          </div>

          {/* 2. Track & Retrieve Quote Shortcuts + Useful-Only Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 sv-card p-4 sm:p-5 flex flex-col justify-center gap-2.5">
              <form
                onSubmit={handleQuickTrackSubmit}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-[#4B5563] dark:text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={dashboardTrackingInput}
                    onChange={(e) => setDashboardTrackingInput(e.target.value)}
                    placeholder="Code (e.g. SWV-2026-NG8491)"
                    className="sv-input w-full min-h-[44px] pl-10 pr-3 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder-[#4B5563]/65 uppercase tabular-nums"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="submit"
                    className="min-h-[44px] flex-1 sm:flex-none px-4 py-2 text-[13px] font-bold text-[#111827] dark:text-white bg-[#F1F5F9] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 rounded-full transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Track Shipment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenQuoteRetrieval(dashboardTrackingInput.trim().toUpperCase())}
                    className="min-h-[44px] flex-1 sm:flex-none px-4 py-2 text-[13px] font-bold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 hover:bg-[#90E0EF]/50 rounded-full transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Retrieve Quote
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveCustomerTab('my_shipments')}
                className="sv-card p-4 text-left hover:border-[#00B4D8] transition-colors cursor-pointer"
              >
                <span className="sv-label block">
                  Active Shipments
                </span>
                <span className="sv-price-lg tabular-nums block mt-0.5">
                  {activeShipments.length}
                </span>
              </button>

              <div
                className={`rounded-[12px] border p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] ${
                  hasNeedsAttention
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-800/90 border-[#E2E8F0] dark:border-slate-800'
                }`}
              >
                <span className="sv-label block">
                  Needs Attention
                </span>
                <span
                  className={`sv-price-lg tabular-nums block mt-0.5 ${
                    hasNeedsAttention
                      ? 'text-[#986B16] dark:text-amber-400'
                      : 'text-[#111827] dark:text-white'
                  }`}
                >
                  {attentionCount}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Needs Your Attention (Conditional) */}
          {hasNeedsAttention && (
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-[12px] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-400 font-bold text-[12px] uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Needs Your Attention</span>
              </div>

              <div className="space-y-2.5">
                {pendingApprovals.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 bg-white dark:bg-slate-900 rounded-[12px] border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[13px] font-bold text-[#111827] dark:text-white tabular-nums">
                        {s.trackingNumber}
                      </span>
                      <p className="text-[13px] text-amber-900 dark:text-amber-300">
                        Verified quotation ready ({formatNaira(s.quote.totalAmount)}) — approval required before dispatch.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenQuoteRetrieval(s.trackingNumber)}
                      className="sv-btn-primary min-h-[40px] px-4 py-1.5 rounded-full text-[13px] shrink-0 cursor-pointer"
                    >
                      Review &amp; Approve Quote
                    </button>
                  </div>
                ))}

                {overdueAlerts.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleTrackShipment(s.trackingNumber)}
                    className="w-full text-left p-3.5 bg-white dark:bg-slate-900 rounded-[12px] border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 hover:border-[#00B4D8] transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[13px] font-bold text-[#111827] dark:text-white tabular-nums">
                        {s.trackingNumber}
                      </span>
                      <p className="text-[13px] text-[#4B5563] dark:text-slate-400">
                        Tracking update overdue — our operations desk has logged a proactive check.
                      </p>
                    </div>
                    <span className="text-[13px] font-semibold text-[#0F172A] dark:text-[#90E0EF] flex items-center gap-1 shrink-0">
                      <span>View Update</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}

                {kycRequired && (
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-[12px] border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[13px] font-bold text-[#111827] dark:text-white">
                        Identity Verification Recommended
                      </span>
                      <p className="text-[13px] text-[#4B5563] dark:text-slate-400">
                        Complete NIN/BVN verification to prevent customs hold on high-value consignments.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenKyc}
                      className="min-h-[40px] px-4 py-1.5 bg-amber-600 text-white rounded-full text-[13px] font-bold hover:bg-amber-700 shrink-0 cursor-pointer"
                    >
                      Verify ID
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Separated Wallet & Rewards Summary Card */}
          <div className="sv-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
              <div>
                <h2 className="sv-h3">
                  Wallet &amp; Rewards Overview
                </h2>
                <p className="sv-label">
                  Deposited cash wallet funds are kept separate from non-withdrawable shipping credits.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('wallet')}
                  className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#1F2937] dark:text-slate-200 bg-[#F1F5F9] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 cursor-pointer"
                >
                  Open Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('cashback')}
                  className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/50 border border-[#90E0EF] dark:border-sky-800 cursor-pointer"
                >
                  Rewards Ledger
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800">
                <span className="sv-label block">
                  Deposited Wallet
                </span>
                <span className="text-[17px] font-extrabold text-[#111827] dark:text-white tabular-nums">
                  {formatNaira(separatedBalances.depositedWalletBalanceNgn)}
                </span>
                <span className="text-[11px] text-[#4B5563] dark:text-slate-400 block mt-0.5">
                  Withdrawable cash balance
                </span>
              </div>

              {separatedBalances.availableAccountCreditNgn > 0 && (
                <div className="p-3.5 rounded-[10px] bg-[#CAF0F8]/70 dark:bg-sky-950/50 border border-[#90E0EF] dark:border-sky-800">
                  <span className="text-[12px] text-[#0F172A] dark:text-[#90E0EF] font-semibold block">
                    Available Account Credit
                  </span>
                  <span className="text-[17px] font-extrabold text-[#0F172A] dark:text-[#90E0EF] tabular-nums">
                    {formatNaira(separatedBalances.availableAccountCreditNgn)}
                  </span>
                  <span className="text-[11px] text-[#0F172A]/80 dark:text-sky-300 block mt-0.5">
                    {separatedBalances.availableCreditRecords.length} overpayment credit
                    {separatedBalances.availableCreditRecords.length === 1 ? '' : 's'}
                  </span>
                </div>
              )}

              {separatedBalances.cashbackBalanceNgn > 0 && (
                <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800">
                  <span className="sv-label block">
                    Cashback Balance
                  </span>
                  <span className="text-[17px] font-extrabold text-[#007791] dark:text-[#90E0EF] tabular-nums">
                    {formatNaira(separatedBalances.cashbackBalanceNgn)}
                  </span>
                  <span className="text-[11px] text-[#4B5563] dark:text-slate-400 block mt-0.5">
                    Non-withdrawable shipping reward
                  </span>
                </div>
              )}

              {(separatedBalances.activeBonusBalanceNgn > 0 || separatedBalances.expiredBonusBalanceNgn > 0) && (
                <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800">
                  <span className="sv-label block">
                    Bonus Balance
                  </span>
                  <span className="text-[17px] font-extrabold text-[#111827] dark:text-white tabular-nums">
                    {formatNaira(separatedBalances.activeBonusBalanceNgn)}
                  </span>
                  <span className="text-[11px] text-[#4B5563] dark:text-slate-400 block mt-0.5">
                    {separatedBalances.activeBonusGrants.length} active grant
                    {separatedBalances.activeBonusGrants.length === 1 ? '' : 's'}
                    {separatedBalances.expiredBonusBalanceNgn > 0
                      ? ` · ${formatNaira(separatedBalances.expiredBonusBalanceNgn)} expired`
                      : ''}
                  </span>
                </div>
              )}

              {separatedBalances.outstandingAmountNgn > 0 && (
                <div className="p-3.5 rounded-[10px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="text-[12px] text-amber-900 dark:text-amber-300 font-semibold block">
                    Outstanding Amount
                  </span>
                  <span className="text-[17px] font-extrabold text-amber-900 dark:text-amber-300 tabular-nums">
                    {formatNaira(separatedBalances.outstandingAmountNgn)}
                  </span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-400 block mt-0.5">
                    Requires approval or settlement
                  </span>
                </div>
              )}

              {separatedBalances.availableAccountCreditNgn === 0 &&
                separatedBalances.cashbackBalanceNgn === 0 &&
                separatedBalances.activeBonusBalanceNgn === 0 &&
                separatedBalances.outstandingAmountNgn === 0 && (
                  <div className="sm:col-span-1 lg:col-span-4 p-3.5 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/40 border border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#4B5563] dark:text-slate-400">
                    <span>
                      No active Account Credits, Cashback, or Bonus Balances yet. Complete a delivery or refer a customer to unlock non-withdrawable shipping rewards.
                    </span>
                    <span className="font-semibold text-[#111827] dark:text-slate-200 tabular-nums">
                      Pending Delivery Rewards: {formatNaira(rewardBreakdown.pendingCreditsNgn)}
                    </span>
                  </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-[13px]">
              <div className="flex items-center gap-2 text-[#4B5563] dark:text-slate-400">
                <Gift className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>
                  Referral Code:{' '}
                  <strong className="text-[#111827] dark:text-white tabular-nums">
                    {currentCustomer.referralCode}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="px-3.5 py-1.5 rounded-full border border-[#CBD5E1] dark:border-slate-700 text-[12px] font-semibold text-[#1F2937] dark:text-slate-200 hover:border-[#00B4D8] flex items-center gap-1.5 cursor-pointer"
              >
                {copiedReferral ? <Check className="w-3.5 h-3.5 text-[#247347]" /> : <Copy className="w-3.5 h-3.5 text-[#00B4D8]" />}
                <span>{copiedReferral ? 'Copied Code' : 'Copy Referral Link'}</span>
              </button>
            </div>
          </div>

          {/* 5. Active Shipments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="sv-h2">
                Active Shipments
              </h2>
              {myShipments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('my_shipments')}
                  className="text-[13px] font-semibold text-[#0F172A] dark:text-[#90E0EF] underline underline-offset-4 hover:text-[#00B4D8] flex items-center gap-1 cursor-pointer"
                >
                  <span>All Shipments ({myShipments.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="sv-card divide-y divide-[#E2E8F0] dark:divide-slate-800 overflow-hidden">
              {activeShipments.map((s) => {
                const groupObj = s.bookingGroupId
                  ? bookingGroups.find((bg) => bg.id === s.bookingGroupId)
                  : undefined;
                const progress = getProgressPercent(s.status);
                const latestEvt = s.trackingEvents[s.trackingEvents.length - 1];

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleTrackShipment(s.trackingNumber)}
                    className="w-full text-left p-4 sm:p-5 flex flex-col gap-3 hover:bg-[#F8FAFC] dark:hover:bg-slate-700/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] flex items-center justify-center shrink-0 border border-[#90E0EF] dark:border-sky-800">
                          <Package className="w-5 h-5 text-[#00B4D8]" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-bold text-[#111827] dark:text-white group-hover:text-[#00B4D8] transition-colors tabular-nums">
                              {s.trackingNumber}
                            </span>
                            {groupObj && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-700 text-[#1F2937] dark:text-slate-200">
                                <Layers className="w-3 h-3 text-[#00B4D8]" />
                                {groupObj.groupCode}
                              </span>
                            )}
                            {s.collectionMethod === 'priority_pickup' && (
                              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-[#986B16] dark:text-amber-300">
                                Priority Pickup
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#4B5563] dark:text-slate-400 truncate">
                            {s.originCity || 'Lagos'} → {s.destinationCity}, {s.destinationCountry}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="mb-0.5">
                            <StatusPill status={s.status} isOverdue={s.isUpdateOverdue} />
                          </div>
                          <div className="text-[14px] font-bold text-[#111827] dark:text-slate-200 tabular-nums">
                            {formatNaira(s.quote.totalAmount)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#4B5563] group-hover:text-[#00B4D8]" />
                      </div>
                    </div>

                    {/* Simple Progress Bar + Last Update */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-[#F1F5F9] dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            s.isUpdateOverdue ? 'bg-amber-500' : 'bg-[#00B4D8]'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[12px] font-medium text-[#4B5563] dark:text-slate-400">
                        <span className="truncate">
                          {getCustomerFriendlyStatusLabel(s.status)} &bull; {latestEvt?.stage || 'Booked'}
                        </span>
                        <span className="tabular-nums shrink-0">{latestEvt?.timestamp}</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {activeShipments.length === 0 && (
                <div className="p-8 text-center text-[14px] text-[#4B5563] dark:text-slate-400 space-y-3">
                  <Package className="w-8 h-8 text-[#4B5563] mx-auto" />
                  <p>You have no active shipments in transit right now.</p>
                  <button
                    type="button"
                    onClick={() => setActiveCustomerTab('book')}
                    className="sv-btn-primary px-5 py-2 rounded-full cursor-pointer"
                  >
                    Book a Shipment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 6. Recent Activity & Secondary Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#00B4D8]" />
                  <span>Recent Activity</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('notifications')}
                  className="text-xs font-semibold text-[#008EA8] dark:text-[#90E0EF] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Notifications</span>
                  {unreadNotifCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#00B4D8] text-white text-[10px] font-bold tabular-nums">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              </div>

              {recentActivity.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {recentActivity.map((act) => (
                    <div key={act.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {act.subtitle}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {act.timestamp.slice(0, 10)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                  No recent shipment or wallet activity yet.
                </p>
              )}
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                Account &amp; Support Tools
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'my_quotes', label: 'My Quotes', icon: FileText },
                  { id: 'my_pickups', label: 'My Pickups', icon: Truck },
                  { id: 'payments_receipts', label: 'Payments & Receipts', icon: Receipt },
                  { id: 'reviews', label: 'Delivery Reviews', icon: Star },
                  { id: 'tickets', label: 'Support Tickets', icon: HelpCircle },
                  { id: 'claims', label: 'Claims Desk', icon: ShieldAlert },
                  { id: 'address_book', label: 'Address Book', icon: MapPin },
                  { id: 'templates', label: 'Templates', icon: Bookmark },
                  { id: 'notifications', label: unreadNotifCount > 0 ? `Notifications (${unreadNotifCount})` : 'Notifications', icon: Bell },
                  ...(currentCustomer.customerType === 'business'
                    ? [{ id: 'team', label: 'Business Team', icon: Users }]
                    : []),
                ].map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveCustomerTab(tool.id)}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-[#00B4D8] text-left font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                      <span className="truncate">{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW HEADER */}
      {activeCustomerTab !== 'overview' && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveCustomerTab('overview')}
            className="text-xs font-bold text-[#00B4D8] hover:underline flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </button>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
            {activeCustomerTab.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* My Shipments View */}
      {activeCustomerTab === 'my_shipments' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                All Shipments ({filteredHistoryShipments.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Search shipments, filter by active/delivered/archived, cancel uncollected shipments, or review quotes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBookingSourceQuoteRef('');
                setActiveCustomerTab('book');
              }}
              className="min-h-[40px] px-4 py-2 bg-[#00B4D8] text-white rounded-xl text-xs font-bold hover:bg-[#009BB8] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Shipment</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={shipmentSearch}
                onChange={(e) => setShipmentSearch(e.target.value)}
                placeholder="Search SWV code, recipient, city..."
                className="w-full pl-8 pr-3 py-1.5 rounded-full border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'delivered', label: 'Delivered' },
                  { id: 'archived', label: 'Archived' },
                ] as const
              ).map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => setShipmentHistoryFilter(flt.id)}
                  className={`px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                    shipmentHistoryFilter === flt.id
                      ? 'bg-[#CAF0F8] text-[#0F172A] border-[#90E0EF] dark:bg-sky-950 dark:text-[#90E0EF] dark:border-sky-800'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          {shipmentActionNotice && (
            <div className="p-3 rounded-xl bg-[#CAF0F8]/70 dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 text-xs text-[#0F172A] dark:text-[#90E0EF] flex items-center justify-between">
              <span>{shipmentActionNotice}</span>
              <button
                type="button"
                onClick={() => setShipmentActionNotice(null)}
                className="font-bold underline text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredHistoryShipments.map((s) => {
              const pendingAdj = paymentAdjustments.find(
                (adj) =>
                  (adj.shipmentId === s.id || adj.trackingNumber === s.trackingNumber) &&
                  adj.status === 'pending_customer_approval' &&
                  adj.differenceNgn > 0
              );
              const canCancel =
                s.status === 'booked' ||
                s.status === 'pickup_scheduled' ||
                s.status === 'quote_ready' ||
                s.status === 'draft';
              const canArchive = (s.status === 'delivered' || s.status === 'cancelled') && !s.isArchived;

              return (
              <div
                key={s.id}
                className="py-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {s.trackingNumber}
                    </span>
                    <StatusPill status={s.status} isOverdue={s.isUpdateOverdue} />
                    {s.paymentStatus === 'paid' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        Paid
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        Unpaid
                      </span>
                    )}
                    {s.isFragile && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Fragile
                      </span>
                    )}
                    {pendingAdj && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        Weight Adj Due (+{formatNaira(pendingAdj.differenceNgn)})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Booked: {s.createdAt.slice(0, 10)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Destination:</span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {s.destinationCountry} ({s.destinationCity})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Billable Weight:</span>
                    <div className="font-semibold text-slate-900 dark:text-white font-mono">
                      {s.quote.chargeableWeightKg} kg
                      {s.carrierDivisorUsed ? ` (÷${s.carrierDivisorUsed})` : ''}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Final / Quoted Charge:</span>
                    <div className="font-bold text-[#008EA8] dark:text-[#90E0EF] font-mono">
                      {formatNaira(s.quote.totalAmount)}
                    </div>
                  </div>
                </div>

                {(s.dhlTrackingNumber ||
                  shipmentCredits.some((c) => c.sourceShipmentId === s.id)) && (
                  <div className="flex flex-wrap items-center gap-3 text-[11px] bg-[#F8FAFC] dark:bg-slate-900/50 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-3 py-1.5">
                    {s.dhlTrackingNumber && (
                      <span className="font-semibold text-[#111827] dark:text-slate-200 tabular-nums">
                        DHL Waybill: <span className="font-mono text-[#008EA8] dark:text-[#90E0EF]">{s.dhlTrackingNumber}</span>
                      </span>
                    )}
                    {shipmentCredits
                      .filter((c) => c.sourceShipmentId === s.id)
                      .map((crd) => (
                        <span key={crd.id} className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          Overpayment Credit Issued: {formatNaira(crd.originalCreditNgn)} ({crd.creditRef})
                        </span>
                      ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {s.quote.serviceName} &bull; {getCustomerFriendlyStatusLabel(s.status)}
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    {(s.paymentStatus !== 'paid' || pendingAdj) && (
                      <button
                        type="button"
                        onClick={() => handleOpenQuoteRetrieval(s.trackingNumber)}
                        className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        {pendingAdj ? 'Pay Weight Adjustment' : 'Review Quote & Pay'}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = cancelShipment(s.id);
                          setShipmentActionNotice(res.message);
                        }}
                        className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Shipment</span>
                      </button>
                    )}
                    {canArchive && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = archiveShipment(s.id);
                          setShipmentActionNotice(res.message);
                        }}
                        className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTrackShipment(s.trackingNumber)}
                      className="text-[#008EA8] dark:text-[#90E0EF] font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>View Tracking Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}

            {filteredHistoryShipments.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <p>No shipment records match this filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setBookingSourceQuoteRef('');
                    setActiveCustomerTab('book');
                  }}
                  className="px-4 py-2 bg-[#00B4D8] text-white rounded-xl font-bold"
                >
                  Book Your First Shipment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Hub: My Quotes, My Pickups, Payments & Receipts */}
      {activeCustomerTab === 'my_quotes' && (
        <MyQuotesView
          onContinueQuoteToBooking={(quoteRef) => {
            setBookingSourceQuoteRef(quoteRef);
            setActiveCustomerTab('book');
          }}
          onReviewShipmentQuote={(trackingNumber) => handleOpenQuoteRetrieval(trackingNumber)}
        />
      )}
      {activeCustomerTab === 'my_pickups' && (
        <MyPickupsView onBookPickup={() => setBookPickupModalOpen(true)} />
      )}
      {activeCustomerTab === 'payments_receipts' && (
        <PaymentsReceiptsView
          onOpenWeightAdjustment={(trackingNumber) => handleOpenQuoteRetrieval(trackingNumber)}
        />
      )}

      {/* Quote Retrieval View */}
      {activeCustomerTab === 'retrieve_quote' && (
        <QuoteRetrievalView
          initialCode={initialQuoteCode}
          onOpenSupportWithShipment={() => setActiveCustomerTab('tickets')}
          onTrackShipment={(tracking) => handleTrackShipment(tracking)}
          onConvertQuoteToBooking={(quoteRef) => {
            setBookingSourceQuoteRef(quoteRef);
            setActiveCustomerTab('book');
          }}
        />
      )}

      {/* Booking Wizard */}
      {activeCustomerTab === 'book' && (
        <BookingWizard
          initialQuoteRef={bookingSourceQuoteRef || undefined}
          onComplete={(trackingNum) => {
            setBookingSourceQuoteRef('');
            handleTrackShipment(trackingNum);
          }}
          onOpenPolicy={onOpenPolicy}
          onOpenKyc={onOpenKyc}
        />
      )}

      {/* Tracking View */}
      {activeCustomerTab === 'tracking' && (
        <TrackingView
          onOpenSupportWithShipment={() => setActiveCustomerTab('tickets')}
          onOpenReviewForShipment={(shipmentId) => {
            setInitialReviewShipmentId(shipmentId);
            setActiveCustomerTab('reviews');
          }}
          onOpenQuoteRetrieval={(code) => handleOpenQuoteRetrieval(code)}
        />
      )}

      {/* Wallet */}
      {activeCustomerTab === 'wallet' && <MyWalletView />}

      {/* Profile & Settings */}
      {activeCustomerTab === 'profile' && (
        <CustomerProfileView
          onOpenKyc={onOpenKyc}
          onOpenAddressBook={() => setActiveCustomerTab('address_book')}
        />
      )}

      {/* Tickets & Support */}
      {activeCustomerTab === 'tickets' && <CustomerTicketsView />}

      {/* Address Book */}
      {activeCustomerTab === 'address_book' && (
        <AddressBookView onSelectAddressForBooking={() => setActiveCustomerTab('book')} />
      )}

      {/* Templates */}
      {activeCustomerTab === 'templates' && (
        <ShipmentTemplatesView onUseTemplate={() => setActiveCustomerTab('book')} />
      )}

      {/* Reviews & Rewards */}
      {activeCustomerTab === 'reviews' && (
        <CustomerReviewsView initialShipmentId={initialReviewShipmentId} />
      )}
      {activeCustomerTab === 'cashback' && <RewardsView onOpenPolicy={onOpenPolicy} />}

      {/* Claims, Team & Notifications */}
      {activeCustomerTab === 'claims' && <SupportClaimsView />}
      {activeCustomerTab === 'team' && <BusinessTeamView />}
      {activeCustomerTab === 'notifications' && <CustomerNotificationsView />}

      <BookPickupModal
        isOpen={bookPickupModalOpen}
        onClose={() => setBookPickupModalOpen(false)}
        onOpenPolicy={onOpenPolicy}
        onSuccess={(trackingNum) => {
          if (trackingNum) handleTrackShipment(trackingNum);
        }}
      />

      {/* Mobile Bottom Navigation Bar (5 Destinations: Home, Shipments, New, Wallet, Profile) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-3 py-1.5 flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => setActiveCustomerTab('overview')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeCustomerTab === 'overview'
              ? 'text-[#00B4D8] font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCustomerTab('my_shipments')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeCustomerTab === 'my_shipments' || activeCustomerTab === 'tracking'
              ? 'text-[#00B4D8] font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Shipments</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCustomerTab('book')}
          className="flex flex-col items-center -mt-5 focus:outline-hidden"
          aria-label="New Shipment"
        >
          <div className="w-12 h-12 rounded-full bg-[#00B4D8] text-white flex items-center justify-center shadow-md shadow-[#00B4D8]/30 hover:bg-[#009BB8] active:scale-95 transition-all">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-[#008EA8] dark:text-[#90E0EF] mt-0.5">
            New
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCustomerTab('wallet')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeCustomerTab === 'wallet'
              ? 'text-[#00B4D8] font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Wallet</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCustomerTab('profile')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeCustomerTab === 'profile'
              ? 'text-[#00B4D8] font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    </div>
  );
};
