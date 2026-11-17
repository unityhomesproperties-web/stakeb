import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  ShieldAlert,
  BarChart3,
  Truck,
  Package,
  Building,
  Users,
  CreditCard,
  UserCheck,
  Settings,
  PlusCircle,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  Lock,
  ArrowRight,
  TrendingUp,
  Percent,
  Tag,
  Shield,
  FileText,
  Globe2,
  Star,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { getPublicApprovedReviews } from '../../utils/review-rules';
import { DhlCarrierManagementView } from '../operations/DhlCarrierManagementView';
import { canHandoverShipmentToCarrier } from '../../utils/adjustment-engine';
import { formatNaira } from '../../utils/shipping-calculator';

export const OperationsAdminWorkspace: React.FC = () => {
  const {
    shipments,
    bookingGroups,
    reviews,
    moderateReview,
    pickupJobs,
    branches,
    customers,
    staffMembers,
    auditLogs,
    walletTransactions,
    promoCampaigns,
    addPromoCampaign,
    updatePromoCampaign,
    cashbackConfig,
    updateCashbackConfig,
    createStaffAccount,
    updateStaffStatus,
    reassignPickupJob,
    currentStaffUser,
    environmentMode,
    setEnvironmentMode,
    adminFeatureFlags,
    updateAdminFeatureFlags,
    otpDeliveryLogs,
    paymentAdjustments,
    shipmentCredits,
    bonusGrants,
    carrierDivisorRules,
    updateCarrierDivisorRule,
    getCustomerBalancesSnapshot,
    bookDhlCarrierForShipment,
    staffNotifications,
    markStaffNotificationRead,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'pickups' | 'shipments' | 'reviews' | 'branches' | 'customers' | 'finance' | 'staff' | 'policies' | 'dhl_carrier'
  >('overview');
  const [csvExportNotice, setCsvExportNotice] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  const [reviewReplies, setReviewReplies] = useState<Record<string, string>>({});
  const [reviewDisputes, setReviewDisputes] = useState<Record<string, string>>({});
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  // Search & Filter
  const [customerSearch, setCustomerSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [shipmentQueueFilter, setShipmentQueueFilter] = useState<
    | 'all'
    | 'pending_receipt'
    | 'awaiting_measurement'
    | 'awaiting_approval'
    | 'payment_pending'
    | 'outstanding'
    | 'overpayment_credit'
    | 'ready_for_carrier'
    | 'booking_failed'
    | 'in_transit'
  >('all');
  const [shipmentQueueSearch, setShipmentQueueSearch] = useState('');
  const [divisorDrafts, setDivisorDrafts] = useState<
    Record<string, { divisor: number; minChargeableKg: number; roundingStepKg: number; isActive: boolean }>
  >({});
  const [divisorAuditReason, setDivisorAuditReason] = useState(
    'Updated volumetric divisor policy per carrier billing schedule.'
  );

  // Promo Campaign Modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    title: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    discountValue: 10,
    minShipmentAmountNgn: 25000,
    maxDiscountAmountNgn: 15000,
    validFrom: new Date().toISOString().substring(0, 10),
    validUntil: new Date(Date.now() + 60 * 86400000).toISOString().substring(0, 10),
    maxUsesTotal: 100,
    isActive: true,
  });

  // Cashback Config Edit State
  const [cashbackForm, setCashbackForm] = useState({
    defaultCashbackPercentage: cashbackConfig.defaultCashbackPercentage,
    maxCashbackPerShipmentNgn: cashbackConfig.maxCashbackPerShipmentNgn,
    holdingPeriodHoursAfterDelivery: cashbackConfig.holdingPeriodHoursAfterDelivery,
    minEligibleShipmentValueNgn: cashbackConfig.minEligibleShipmentValueNgn,
    isProgramActive: cashbackConfig.isProgramActive,
  });
  const [policySavedMsg, setPolicySavedMsg] = useState(false);

  // New Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'operations_officer' as any,
    workspace: 'pickup_shipping' as 'pickup_shipping' | 'customer_service' | 'operations_admin',
    branchId: 'branch_ikeja',
    department: 'Intake & Shipping Operations',
  });

  // KPI Computations
  const totalShipments = shipments.length;
  const totalRevenue = shipments.reduce((sum, s) => sum + (s.finalQuoteNgn || s.quote?.totalAmount || 0), 0);
  const totalWalletHoldings = Object.values(customers).reduce((sum, c) => sum + (c.walletBalance || 0), 0);
  const totalCashbackOutstanding = Object.values(customers).reduce((sum, c) => sum + (c.cashbackBalance || 0), 0);
  const activePickups = pickupJobs.filter((p) => p.status !== 'handed_over' && p.status !== 'cancelled').length;
  const pendingModerationCount = reviews.filter(
    (r) => r.moderationStatus === 'pending_review' || r.status === 'pending' || r.moderationStatus === 'disputed'
  ).length;
  const approvedReviews = getPublicApprovedReviews(reviews);

  const handleExportLedgerCsv = () => {
    const header = ['Reference', 'Customer', 'Type', 'Entry', 'Amount_NGN', 'Balance_After_NGN', 'Created_At'].join(',');
    const rows = walletTransactions.map((tx) =>
      [
        tx.transactionReference,
        `"${(tx.customerName || tx.customerId).replace(/"/g, '""')}"`,
        tx.type,
        tx.entryType || 'debit',
        tx.amountNgn,
        tx.balanceAfterNgn,
        tx.createdAt,
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `swiftvero-ledger-demo-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCsvExportNotice(`Exported ${walletTransactions.length} ledger rows to CSV (Demo).`);
    setTimeout(() => setCsvExportNotice(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F7FCFD] dark:bg-slate-950 pb-16 text-slate-900 dark:text-slate-100">
      {/* Workspace Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-[#DCEFF3] dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] dark:bg-sky-950 text-[#00B4D8] flex items-center justify-center font-bold text-lg border border-[#DCEFF3] dark:border-sky-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00B4D8] bg-[#CAF0F8] dark:bg-sky-950 px-2 py-0.5 rounded">
                  Workspace C
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Platform Command &amp; Governance</span>
              </div>
              <h1 className="text-lg font-bold text-[#1E293B] dark:text-white">Operations &amp; Admin Workspace</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-[#F7FCFD] dark:bg-slate-800 border border-[#DCEFF3] dark:border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Logged in as:</span>
              <span className="font-bold text-[#1E293B] dark:text-white">{currentStaffUser?.name || 'Director of Operations'}</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1.5 py-0.2 rounded font-semibold uppercase">
                Executive
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-slate-100 dark:border-slate-800 py-1">
          {[
            { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
            { id: 'pickups', label: 'Company Pickups', icon: Truck, count: activePickups },
            { id: 'shipments', label: 'Shipments & Groups', icon: Package, count: totalShipments },
            { id: 'reviews', label: 'Reviews & Trust', icon: Star, count: pendingModerationCount },
            { id: 'branches', label: 'Hubs & Branches', icon: Building, count: branches.length },
            { id: 'customers', label: 'Customers & KYC', icon: Users, count: Object.keys(customers).length },
            { id: 'finance', label: 'Double-Entry Ledger & Finance', icon: CreditCard },
            { id: 'staff', label: 'Staff & Workspace Access', icon: UserCheck, count: staffMembers.length },
            { id: 'policies', label: 'Policies & Marketing Campaigns', icon: Settings },
            { id: 'dhl_carrier', label: 'DHL Carrier Integration', icon: Globe2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#00B4D8] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#1E293B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {adminFeedback && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
            <span className="font-medium">{adminFeedback}</span>
            <button type="button" onClick={() => setAdminFeedback(null)} className="text-[11px] font-bold underline">
              Dismiss
            </button>
          </div>
        )}
        {staffNotifications.filter((n) => n.targetWorkspace === 'operations_admin' && !n.isRead).length > 0 && (
          <div className="mb-4 space-y-2">
            {staffNotifications
              .filter((n) => n.targetWorkspace === 'operations_admin' && !n.isRead)
              .map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <strong className="mr-1.5">{n.title}:</strong>
                    <span>{n.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => markStaffNotificationRead(n.id)}
                    className="text-[11px] font-bold underline shrink-0"
                  >
                    Mark Read
                  </button>
                </div>
              ))}
          </div>
        )}
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#DCEFF3] shadow-xs">
                <span className="text-xs font-medium text-slate-500">Gross Shipment Billing</span>
                <div className="text-xl font-bold text-[#1E293B] mt-1">₦{totalRevenue.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3 h-3" /> +14.2% vs last month
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#DCEFF3] shadow-xs">
                <span className="text-xs font-medium text-slate-500">Total Customer Wallet Pool</span>
                <div className="text-xl font-bold text-[#00B4D8] mt-1">₦{totalWalletHoldings.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 mt-1">Prepaid deposited escrow balances</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#DCEFF3] shadow-xs">
                <span className="text-xs font-medium text-slate-500">Cashback Reward Liabilities</span>
                <div className="text-xl font-bold text-amber-700 mt-1">₦{totalCashbackOutstanding.toLocaleString()}</div>
                <div className="text-[10px] text-amber-600 mt-1">Non-withdrawable shipping credits</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#DCEFF3] shadow-xs">
                <span className="text-xs font-medium text-slate-500">Active Doorstep Pickups</span>
                <div className="text-xl font-bold text-[#1E293B] mt-1">{activePickups}</div>
                <div className="text-[10px] text-slate-500 mt-1">24h SLA compliance: 98.4%</div>
              </div>
            </div>

            {/* Warehouse Visual & System Status Banner */}
            <div className="bg-white rounded-xl border border-[#DCEFF3] overflow-hidden shadow-xs flex flex-col md:flex-row">
              <div className="p-6 md:w-3/5 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#CAF0F8] text-[#00B4D8] border border-[#DCEFF3] mb-2">
                    <Shield className="w-3.5 h-3.5" />
                    Central Operational Policy Enforced
                  </div>
                  <h3 className="text-lg font-bold text-[#1E293B]">
                    Unified Operational Oversight & Compliance
                  </h3>
                  <p className="text-xs text-[#66736B] mt-2 leading-relaxed">
                    Swiftvero Express Ltd coordinates international document, parcel, and cargo carriage across all Nigerian commercial hubs. 
                    All staff permissions are mapped strictly to Workspace A (Pickup & Shipping), Workspace B (Customer Service), or Workspace C (Operations & Admin).
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Lagos Hub (Ikeja Mainland)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Island Intake (Victoria Island)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>MMA2 Airfreight Terminal</span>
                  </div>
                </div>
              </div>

              <div className="md:w-2/5 relative min-h-[180px] bg-slate-100">
                <img
                  src="/assets/aistudio/1001021263_44a3474e.jpg"
                  alt="Swiftvero Cargo Logistics Center"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded">
                  Lagos Air Cargo Consolidation Facility
                </div>
              </div>
            </div>

            {/* Recent Audit Logs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#00B4D8]" />
                System Audit Trail &amp; Operational Events
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-[#1E293B] dark:text-white">{log.action.replace('_', ' ').toUpperCase()}</span>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{log.details}</p>
                      <span className="text-[10px] text-slate-400">
                        By: {log.actorName || log.userName || 'Operations'} ({log.actorRole || log.userRole})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPANY PICKUPS */}
        {activeTab === 'pickups' && (
          <div className="bg-white rounded-xl border border-[#DCEFF3] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">Company-Wide Doorstep Pickups</h3>
                <p className="text-xs text-[#66736B]">
                  Live monitoring of 24-hour collection SLAs, courier dispatch, and hub arrival statuses.
                </p>
              </div>
              <div className="text-xs text-slate-500">
                Total Pickups Logged: <strong>{pickupJobs.length}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FCFD] border-b border-[#DCEFF3] text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-3">Pickup Ref</th>
                    <th className="py-3 px-3">Sender</th>
                    <th className="py-3 px-3">Address & State</th>
                    <th className="py-3 px-3">Scheduled Date</th>
                    <th className="py-3 px-3">Courier</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Reassign Courier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pickupJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-[#1E293B]">{job.pickupReference}</td>
                      <td className="py-3 px-3">{job.senderName}</td>
                      <td className="py-3 px-3 truncate max-w-[180px]">{job.senderAddress}</td>
                      <td className="py-3 px-3">{job.scheduledDate}</td>
                      <td className="py-3 px-3 font-medium">{job.collectionHandlerName || 'Unassigned'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            reassignPickupJob(job.id, 'staff_08', 'Supervisor rebalance for SLA optimization');
                          }}
                          className="px-2 py-1 text-[10px] font-semibold rounded bg-[#CAF0F8] text-[#00B4D8] border border-[#DCEFF3] hover:bg-[#00B4D8] hover:text-white transition-colors"
                        >
                          Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SHIPMENTS, BOOKING GROUPS & PART 16 OPERATIONAL QUEUES */}
        {activeTab === 'shipments' && (() => {
          const matchesQueue = (s: typeof shipments[number], q: typeof shipmentQueueFilter) => {
            const hasUnpaidAdj = paymentAdjustments.some(
              (a) =>
                a.shipmentId === s.id &&
                (a.status === 'pending' || a.status === 'pending_customer_approval') &&
                a.differenceNgn > 0
            );
            const hasCredit = shipmentCredits.some((c) => c.sourceShipmentId === s.id);
            const guard = canHandoverShipmentToCarrier({ shipment: s, adjustments: paymentAdjustments });
            switch (q) {
              case 'pending_receipt':
                return s.status === 'booked' || s.status === 'pickup_scheduled';
              case 'awaiting_measurement':
                return s.status === 'arrived_at_facility';
              case 'awaiting_approval':
                return s.status === 'quote_ready';
              case 'payment_pending':
                return s.status === 'payment_pending' || s.status === 'quote_approved';
              case 'outstanding':
                return (s.adjustmentBalanceDueNgn || 0) > 0 || hasUnpaidAdj;
              case 'overpayment_credit':
                return hasCredit;
              case 'ready_for_carrier':
                return (s.status === 'payment_confirmed' || s.status === 'ready_for_carrier_booking') && !s.dhlTrackingNumber && guard.allowed;
              case 'booking_failed':
                return s.status === 'booking_failed';
              case 'in_transit':
                return s.status === 'in_transit';
              default:
                return true;
            }
          };

          const queueTabs: Array<{ id: typeof shipmentQueueFilter; label: string; count: number }> = [
            { id: 'all', label: 'All Shipments', count: shipments.length },
            { id: 'pending_receipt', label: 'Pending Receipt', count: shipments.filter((s) => matchesQueue(s, 'pending_receipt')).length },
            { id: 'awaiting_measurement', label: 'Awaiting Measurement', count: shipments.filter((s) => matchesQueue(s, 'awaiting_measurement')).length },
            { id: 'awaiting_approval', label: 'Awaiting Approval', count: shipments.filter((s) => matchesQueue(s, 'awaiting_approval')).length },
            { id: 'payment_pending', label: 'Payments Pending', count: shipments.filter((s) => matchesQueue(s, 'payment_pending')).length },
            { id: 'outstanding', label: 'Outstanding Balances', count: shipments.filter((s) => matchesQueue(s, 'outstanding')).length },
            { id: 'overpayment_credit', label: 'Overpayment Credits', count: shipments.filter((s) => matchesQueue(s, 'overpayment_credit')).length },
            { id: 'ready_for_carrier', label: 'Ready for Carrier', count: shipments.filter((s) => matchesQueue(s, 'ready_for_carrier')).length },
            { id: 'booking_failed', label: 'Carrier Failures', count: shipments.filter((s) => matchesQueue(s, 'booking_failed')).length },
            { id: 'in_transit', label: 'In Transit', count: shipments.filter((s) => matchesQueue(s, 'in_transit')).length },
          ];

          const qText = shipmentQueueSearch.trim().toLowerCase();
          const filteredAdminShipments = shipments.filter((s) => {
            if (!matchesQueue(s, shipmentQueueFilter)) return false;
            if (!qText) return true;
            return (
              s.trackingNumber.toLowerCase().includes(qText) ||
              (s.dhlTrackingNumber || '').toLowerCase().includes(qText) ||
              s.senderName.toLowerCase().includes(qText) ||
              s.recipientName.toLowerCase().includes(qText) ||
              s.destinationCountry.toLowerCase().includes(qText)
            );
          });

          return (
          <div className="space-y-4">
            {bookingGroups.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#1E293B] dark:text-white">
                  Multi-Shipment Booking Groups ({bookingGroups.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {bookingGroups.map((bg) => (
                    <div
                      key={bg.id}
                      className="p-3.5 rounded-lg bg-[#F7FCFD] dark:bg-slate-800/60 border border-[#DCEFF3] dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {bg.groupCode} · {bg.shipmentIds.length} shipments
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {bg.senderName} · {bg.collectionMethod.replace('_', ' ')} ({bg.collectionArrangement})
                          {bg.pickupFeeNgn > 0 ? ` · Pickup ₦${bg.pickupFeeNgn.toLocaleString()}` : ''}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF]">
                        {bg.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] dark:text-white">Global Shipments &amp; Operational Queues</h3>
                  <p className="text-xs text-[#66736B] dark:text-slate-400">
                    Carrier bookings, outstanding balances, overpayment credits, carrier failure retries, and freshness monitoring.
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search SWV-, DHL-, sender, destination..."
                    value={shipmentQueueSearch}
                    onChange={(e) => setShipmentQueueSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {queueTabs.map((qt) => (
                  <button
                    key={qt.id}
                    type="button"
                    onClick={() => setShipmentQueueFilter(qt.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                      shipmentQueueFilter === qt.id
                        ? 'bg-[#00B4D8] text-white border-[#00B4D8]'
                        : 'bg-[#F7FCFD] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-[#DCEFF3] dark:border-slate-700 hover:bg-[#CAF0F8]/50'
                    }`}
                  >
                    {qt.label} ({qt.count})
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FCFD] dark:bg-slate-800 border-b border-[#DCEFF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="py-3 px-3">Tracking / DHL</th>
                      <th className="py-3 px-3">Sender</th>
                      <th className="py-3 px-3">Destination</th>
                      <th className="py-3 px-3">Chargeable Wt</th>
                      <th className="py-3 px-3">Financial / Credit Status</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions / Freshness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredAdminShipments.map((s) => {
                      const credit = shipmentCredits.find((c) => c.sourceShipmentId === s.id);
                      const isFailed = s.status === 'booking_failed';
                      return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <div className="font-mono font-semibold text-[#1E293B] dark:text-white">{s.trackingNumber}</div>
                          {s.dhlTrackingNumber && (
                            <div className="font-mono text-[10px] text-[#008EA8] dark:text-[#90E0EF]">{s.dhlTrackingNumber}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">{s.senderName}</td>
                        <td className="py-3 px-3">{s.destinationCity}, {s.destinationCountry}</td>
                        <td className="py-3 px-3 font-mono font-medium tabular-nums">
                          {s.chargeableWeightKg || s.verifiedWeightKg || s.declaredWeightKg} kg
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-semibold tabular-nums">
                            {formatNaira(s.finalQuoteNgn || s.quote?.totalAmount || 0)}
                          </div>
                          {(s.adjustmentBalanceDueNgn || 0) > 0 && (
                            <div className="text-[10px] font-semibold text-rose-700 dark:text-rose-400">
                              Due: {formatNaira(s.adjustmentBalanceDueNgn || 0)}
                            </div>
                          )}
                          {credit && (
                            <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                              Credit {credit.creditRef}: {formatNaira(credit.remainingCreditNgn)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isFailed
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {s.status.toUpperCase()}
                          </span>
                          {isFailed && s.carrierBookingError && (
                            <div className="text-[10px] text-rose-700 dark:text-rose-400 mt-0.5 max-w-[180px]">
                              {s.carrierBookingError}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            {isFailed && (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = bookDhlCarrierForShipment(s.id);
                                  setAdminFeedback(res.message);
                                }}
                                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold inline-flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Retry Carrier
                              </button>
                            )}
                            {s.overdueAlert || s.isUpdateOverdue ? (
                              <span className="text-[10px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded font-bold border border-rose-200 dark:border-rose-800">
                                Update Delayed (&gt;24h)
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Fresh (Within SLA)</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          );
        })()}

        {/* TAB 3.5: REVIEWS & TRUST MODERATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Verified Customer Review Moderation &amp; Company Responses
                  </h3>
                  <p className="text-xs text-[#66736B] dark:text-slate-400">
                    Reviews submitted after confirmed delivery require approval before publishing publicly. Legitimate critical reviews must be retained and addressed.
                  </p>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  Published: {approvedReviews.length} · Pending/Disputed: {pendingModerationCount}
                </div>
              </div>

              {reviewNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  {reviewNotice}
                </div>
              )}

              <div className="space-y-4">
                {reviews.map((rev) => {
                  const modStatus = rev.moderationStatus || (rev.status === 'published' ? 'approved' : rev.status === 'rejected' ? 'rejected' : 'pending_review');
                  return (
                    <div key={rev.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F7FCFD] dark:bg-slate-800/40 space-y-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{rev.customerName}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">{rev.trackingNumber}</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {rev.ratingOverall}/5 ★
                          </span>
                          {rev.isDemo && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold">
                              Demo
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            modStatus === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : modStatus === 'disputed'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : modStatus === 'rejected'
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {modStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{rev.writtenFeedback}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Public Company Response
                          </label>
                          <textarea
                            rows={2}
                            value={reviewReplies[rev.id] ?? rev.companyResponse ?? ''}
                            onChange={(e) => setReviewReplies((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                            placeholder="Write official company response shown on public site..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Dispute / Rejection Reason (Internal Audit)
                          </label>
                          <textarea
                            rows={2}
                            value={reviewDisputes[rev.id] ?? rev.disputeNote ?? ''}
                            onChange={(e) => setReviewDisputes((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                            placeholder="Reason if marking disputed or rejected..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            moderateReview(rev.id, 'published', reviewReplies[rev.id] ?? rev.companyResponse);
                            setReviewNotice(`Approved & published review for ${rev.trackingNumber}.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                        >
                          Approve &amp; Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            moderateReview(
                              rev.id,
                              'disputed',
                              reviewReplies[rev.id] ?? rev.companyResponse,
                              reviewDisputes[rev.id] || 'Flagged for operations verification.'
                            );
                            setReviewNotice(`Marked review for ${rev.trackingNumber} as disputed.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700"
                        >
                          Mark Disputed
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            moderateReview(
                              rev.id,
                              'rejected',
                              reviewReplies[rev.id] ?? rev.companyResponse,
                              reviewDisputes[rev.id] || 'Rejected under moderation policy.'
                            );
                            setReviewNotice(`Rejected review for ${rev.trackingNumber}.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HUBS & BRANCHES */}
        {activeTab === 'branches' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-[#DCEFF3] shadow-xs">
              <h3 className="text-base font-bold text-[#1E293B] mb-1">Company Physical Branches & Hubs</h3>
              <p className="text-xs text-[#66736B] mb-4">
                Operational facilities with calibrated digital scales and physical customer walk-in desks.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((b) => (
                  <div key={b.id} className="border border-[#DCEFF3] rounded-xl p-4 bg-[#F7FCFD]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm text-[#1E293B]">{b.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{b.address}, {b.city}, {b.state}</p>
                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div>Contact: <strong>{b.phone}</strong> &bull; {b.email}</div>
                      <div>Branch Lead: <strong>{b.managerName}</strong></div>
                      <div>Scale Calibration: <strong>Certified Monthly (IND570 Digital Scale)</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMERS & KYC (WITH SEPARATED BALANCES) */}
        {activeTab === 'customers' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#1E293B] dark:text-white">Sender Registry, KYC &amp; Separated Balances</h3>
                <p className="text-xs text-[#66736B] dark:text-slate-400">
                  Deposited Wallet, Available Account Credit, Cashback Balance, and active Bonus Balance remain strictly unmerged.
                </p>
              </div>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search sender name, email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FCFD] dark:bg-slate-800 border-b border-[#DCEFF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="py-3 px-3">Sender</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">KYC Status</th>
                    <th className="py-3 px-3">Deposited Wallet</th>
                    <th className="py-3 px-3">Account Credit</th>
                    <th className="py-3 px-3">Cashback</th>
                    <th className="py-3 px-3">Bonus (Active)</th>
                    <th className="py-3 px-3">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 tabular-nums">
                  {Object.values(customers)
                    .filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                    .map((c) => {
                      const snap = getCustomerBalancesSnapshot(c.id);
                      return (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#1E293B] dark:text-white">{c.name}</div>
                          <div className="text-[10px] text-slate-400">{c.accountType === 'business' ? 'Corporate Business' : 'Individual Shipper'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div>{c.email}</div>
                          <div className="text-[10px] text-slate-400">{c.phone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.kycStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : (c.kycStatus === 'pending_review' || c.kycStatus === 'submitted' || c.kycStatus === 'in_progress')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {c.kycStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#008EA8] dark:text-[#90E0EF]">
                          {formatNaira(snap.depositedWalletBalanceNgn)}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatNaira(snap.availableAccountCreditNgn)}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-amber-700 dark:text-amber-400">
                          {formatNaira(snap.cashbackBalanceNgn)}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                          {formatNaira(snap.activeBonusBalanceNgn)}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-rose-700 dark:text-rose-400">
                          {snap.outstandingAmountNgn > 0 ? formatNaira(snap.outstandingAmountNgn) : '₦0'}
                        </td>
                      </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: DOUBLE-ENTRY LEDGER & FINANCE */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-[#DCEFF3] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B]">Immutable Double-Entry Wallet Ledger</h3>
                  <p className="text-xs text-[#66736B]">
                    Strict audit log of deposits, shipment payment deductions, promo discounts, and authorized operational refunds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportLedgerCsv}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Ledger CSV
                </button>
              </div>
              {csvExportNotice && (
                <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  {csvExportNotice}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FCFD] border-b border-[#DCEFF3] text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-3">Txn Reference</th>
                      <th className="py-3 px-3">Sender</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Entry</th>
                      <th className="py-3 px-3">Amount (NGN)</th>
                      <th className="py-3 px-3">Balance After</th>
                      <th className="py-3 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {walletTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-semibold text-[#1E293B]">{tx.transactionReference}</td>
                        <td className="py-3 px-3">{tx.customerName}</td>
                        <td className="py-3 px-3 capitalize">{tx.type.replace('_', ' ')}</td>
                        <td className="py-3 px-3">
                          {(() => {
                            const isCredit =
                              tx.entryType === 'credit' ||
                              tx.type === 'wallet_topup' ||
                              tx.type === 'shipping_refund' ||
                              tx.type === 'cashback_credit' ||
                              tx.type === 'overpayment_credit' ||
                              tx.type === 'bonus_credit';
                            return (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isCredit
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isCredit ? 'CREDIT' : 'DEBIT'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#1E293B] dark:text-white">
                          {(tx.entryType === 'credit' ||
                            tx.type === 'wallet_topup' ||
                            tx.type === 'shipping_refund' ||
                            tx.type === 'cashback_credit' ||
                            tx.type === 'overpayment_credit' ||
                            tx.type === 'bonus_credit')
                            ? '+'
                            : '-'}
                          ₦{tx.amountNgn.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600">₦{tx.balanceAfterNgn.toLocaleString()}</td>
                        <td className="py-3 px-3 text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: STAFF ACCOUNTS & PERMISSIONS */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-[#DCEFF3] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B]">Staff Directory & Workspace Duty Assignments</h3>
                  <p className="text-xs text-[#66736B]">
                    Manage staff access across Workspace A (Pickup & Shipping), Workspace B (Customer Service), and Workspace C (Operations & Admin).
                  </p>
                </div>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Provision Staff Member
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FCFD] border-b border-[#DCEFF3] text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-3">Staff ID & Name</th>
                      <th className="py-3 px-3">Primary Workspace</th>
                      <th className="py-3 px-3">Role / Department</th>
                      <th className="py-3 px-3">Branch Location</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {staffMembers.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-semibold text-[#1E293B]">
                          <div>{staff.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{staff.staffId}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#CAF0F8] text-[#00B4D8] border border-[#DCEFF3]">
                            {staff.workspace === 'pickup_shipping'
                              ? 'Workspace A: Pickup & Shipping'
                              : staff.workspace === 'customer_service'
                              ? 'Workspace B: Customer Service'
                              : 'Workspace C: Operations & Admin'}
                          </span>
                        </td>
                        <td className="py-3 px-3 capitalize">{staff.role.replace('_', ' ')}</td>
                        <td className="py-3 px-3">{staff.branchName || 'Head Office'}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              staff.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {staff.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() =>
                              updateStaffStatus(
                                staff.staffId,
                                staff.status === 'active' ? 'suspended' : 'active'
                              )
                            }
                            className="text-[10px] font-semibold text-slate-600 hover:text-rose-600 underline"
                          >
                            {staff.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: POLICIES & MARKETING CAMPAIGNS */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            {/* Promo Code Campaigns Engine */}
            <div className="bg-white p-5 rounded-xl border border-[#DCEFF3] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#00B4D8]" />
                    Promotional Discount Code Campaigns
                  </h3>
                  <p className="text-xs text-[#66736B]">
                    Create and manage promo codes valid during customer checkout (percentage or fixed discount).
                  </p>
                </div>
                <button
                  onClick={() => setShowPromoModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create Promo Code
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FCFD] border-b border-[#DCEFF3] text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-3">Campaign Title</th>
                      <th className="py-3 px-3">Discount</th>
                      <th className="py-3 px-3">Min Order</th>
                      <th className="py-3 px-3">Valid Until</th>
                      <th className="py-3 px-3">Usage</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {promoCampaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-[#00B4D8]">{camp.code}</td>
                        <td className="py-3 px-3 font-semibold">{camp.title || camp.description || 'Promotional Campaign'}</td>
                        <td className="py-3 px-3">
                          {(camp.discountType === 'percentage' || camp.type === 'percentage')
                            ? `${camp.discountValue || camp.value || 0}% off`
                            : `₦${(camp.discountValue || camp.value || 0).toLocaleString()} off`}
                        </td>
                        <td className="py-3 px-3">₦{(camp.minShipmentAmountNgn || camp.minShipmentValueNgn || 0).toLocaleString()}</td>
                        <td className="py-3 px-3">{camp.validUntil || camp.endDate || '2026-12-31'}</td>
                        <td className="py-3 px-3">{camp.timesUsed} / {camp.maxUsesTotal || '∞'}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              camp.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {camp.isActive ? 'ACTIVE' : 'PAUSED'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => updatePromoCampaign(camp.id, { isActive: !camp.isActive })}
                            className="text-[10px] font-semibold text-[#00B4D8] hover:underline"
                          >
                            {camp.isActive ? 'Pause' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Central Cashback Policy Configuration */}
            <div className="bg-white p-5 rounded-xl border border-[#DCEFF3] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Percent className="w-5 h-5 text-amber-600" />
                    Central Cashback Policy Engine
                  </h3>
                  <p className="text-xs text-[#66736B]">
                    Configure default reward percentages released to sender balances after delivery completion.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Default Cashback %</label>
                  <input
                    type="number"
                    value={cashbackForm.defaultCashbackPercentage}
                    onChange={(e) =>
                      setCashbackForm({ ...cashbackForm, defaultCashbackPercentage: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Standard reward % on completed shipments</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Cashback Cap per Shipment (NGN)</label>
                  <input
                    type="number"
                    value={cashbackForm.maxCashbackPerShipmentNgn}
                    onChange={(e) =>
                      setCashbackForm({ ...cashbackForm, maxCashbackPerShipmentNgn: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Protects business margin against large orders</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Qualification Holding Period (Hours)</label>
                  <input
                    type="number"
                    value={cashbackForm.holdingPeriodHoursAfterDelivery}
                    onChange={(e) =>
                      setCashbackForm({ ...cashbackForm, holdingPeriodHoursAfterDelivery: parseInt(e.target.value) || 0 })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Audit window before release (default 24h)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {policySavedMsg ? (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Central cashback policy parameters successfully updated and audited.
                  </span>
                ) : <div />}
                <button
                  onClick={() => {
                    updateCashbackConfig(cashbackForm, 'Operations Admin updated reward parameters.');
                    setPolicySavedMsg(true);
                    setTimeout(() => setPolicySavedMsg(false), 4000);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors"
                >
                  Save Policy Parameters
                </button>
              </div>
            </div>

            {/* Admin Feature Flags, Insurance Gating & Demo/Production Sandbox Isolation */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#DCEFF3] dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#00B4D8]" />
                    Platform Feature Flags, Underwriter Insurance &amp; Environment Isolation
                  </h3>
                  <p className="text-xs text-[#66736B] dark:text-slate-400">
                    Optional shipping insurance remains strictly hidden across public quote and booking screens until both the feature flag and an approved underwriter rule are configured.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  <button
                    type="button"
                    onClick={() => setEnvironmentMode('demo')}
                    className={`px-3 py-1.5 rounded-lg font-bold border ${
                      environmentMode === 'demo'
                        ? 'bg-[#00B4D8] text-white border-[#00B4D8]'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Demo Isolation Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvironmentMode('production_sandbox')}
                    className={`px-3 py-1.5 rounded-lg font-bold border ${
                      environmentMode === 'production_sandbox'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Production Sandbox
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F7FCFD] dark:bg-slate-800/40 border border-[#DCEFF3] dark:border-slate-700 space-y-3">
                  <div className="font-bold text-[#1E293B] dark:text-white">Admin-Gated Shipping Insurance</div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminFeatureFlags.insuranceEnabled}
                      onChange={(e) =>
                        updateAdminFeatureFlags(
                          { insuranceEnabled: e.target.checked },
                          `Toggled shipping insurance flag to ${e.target.checked}`
                        )
                      }
                      className="rounded text-[#00B4D8]"
                    />
                    <span className="font-semibold">Enable Optional Shipping Insurance UI</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminFeatureFlags.insurerConfigured}
                      onChange={(e) =>
                        updateAdminFeatureFlags(
                          { insurerConfigured: e.target.checked },
                          `Toggled insurerConfigured to ${e.target.checked}`
                        )
                      }
                      className="rounded text-[#00B4D8]"
                    />
                    <span className="font-semibold">Approved Underwriter Partner Configured</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Insurer Name</label>
                      <input
                        type="text"
                        value={adminFeatureFlags.insurerName}
                        onChange={(e) =>
                          updateAdminFeatureFlags({ insurerName: e.target.value }, 'Updated underwriter insurer name')
                        }
                        placeholder="e.g. AXA Mansard Marine & Cargo"
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={adminFeatureFlags.insurerRatePercentage}
                        onChange={(e) =>
                          updateAdminFeatureFlags(
                            { insurerRatePercentage: parseFloat(e.target.value) || 0 },
                            'Updated insurer premium percentage'
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7FCFD] dark:bg-slate-800/40 border border-[#DCEFF3] dark:border-slate-700 space-y-2.5">
                  <div className="font-bold text-[#1E293B] dark:text-white">External Messaging Provider Readiness</div>
                  <p className="text-[11px] text-slate-500">
                    In Production Sandbox, unconfigured OTP channels fail honestly and log provider_unconfigured instead of claiming delivery.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminFeatureFlags.emailProviderConfigured}
                      onChange={(e) =>
                        updateAdminFeatureFlags(
                          { emailProviderConfigured: e.target.checked },
                          `Email OTP provider configured = ${e.target.checked}`
                        )
                      }
                      className="rounded text-[#00B4D8]"
                    />
                    <span>Email Provider (Resend / SendGrid / SES) Configured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminFeatureFlags.smsProviderConfigured}
                      onChange={(e) =>
                        updateAdminFeatureFlags(
                          { smsProviderConfigured: e.target.checked },
                          `SMS OTP provider configured = ${e.target.checked}`
                        )
                      }
                      className="rounded text-[#00B4D8]"
                    />
                    <span>SMS Provider (Termii / Twilio) Configured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminFeatureFlags.whatsappProviderConfigured}
                      onChange={(e) =>
                        updateAdminFeatureFlags(
                          { whatsappProviderConfigured: e.target.checked },
                          `WhatsApp Business Cloud API Configured = ${e.target.checked}`
                        )
                      }
                      className="rounded text-[#00B4D8]"
                    />
                    <span>WhatsApp Business Cloud API Configured</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Carrier Volumetric Divisor Rules Management */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#DCEFF3] dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[#00B4D8]" />
                    Carrier Volumetric Divisor &amp; Rounding Rules
                  </h3>
                  <p className="text-xs text-[#66736B] dark:text-slate-400">
                    Configure active volumetric divisors (/5000, /6000, /4000) used by Workspace A calibrated scale intake and quote revisions.
                  </p>
                </div>
                <input
                  type="text"
                  value={divisorAuditReason}
                  onChange={(e) => setDivisorAuditReason(e.target.value)}
                  placeholder="Audit reason for divisor updates..."
                  className="text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-1.5 w-full sm:w-80"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {carrierDivisorRules.map((rule) => {
                  const draft = divisorDrafts[rule.id] || {
                    divisor: rule.divisor,
                    minChargeableKg: rule.minChargeableKg,
                    roundingStepKg: rule.roundingStepKg,
                    isActive: rule.isActive,
                  };
                  return (
                    <div
                      key={rule.id}
                      className="p-4 rounded-xl bg-[#F7FCFD] dark:bg-slate-800/40 border border-[#DCEFF3] dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#1E293B] dark:text-white">{rule.label}</div>
                          <div className="text-[11px] text-slate-500">
                            {rule.carrierName} &bull; {rule.serviceTier.toUpperCase()}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            draft.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {draft.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Divisor</label>
                          <input
                            type="number"
                            min={1000}
                            step={500}
                            value={draft.divisor}
                            onChange={(e) =>
                              setDivisorDrafts((prev) => ({
                                ...prev,
                                [rule.id]: { ...draft, divisor: Math.max(1000, parseInt(e.target.value) || 5000) },
                              }))
                            }
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Min (kg)</label>
                          <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={draft.minChargeableKg}
                            onChange={(e) =>
                              setDivisorDrafts((prev) => ({
                                ...prev,
                                [rule.id]: { ...draft, minChargeableKg: Math.max(0.5, parseFloat(e.target.value) || 0.5) },
                              }))
                            }
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Step (kg)</label>
                          <input
                            type="number"
                            min={0.1}
                            step={0.1}
                            value={draft.roundingStepKg}
                            onChange={(e) =>
                              setDivisorDrafts((prev) => ({
                                ...prev,
                                [rule.id]: { ...draft, roundingStepKg: Math.max(0.1, parseFloat(e.target.value) || 0.5) },
                              }))
                            }
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={draft.isActive}
                            onChange={(e) =>
                              setDivisorDrafts((prev) => ({
                                ...prev,
                                [rule.id]: { ...draft, isActive: e.target.checked },
                              }))
                            }
                            className="rounded text-[#00B4D8]"
                          />
                          <span>Active Rule</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const res = updateCarrierDivisorRule(
                              rule.id,
                              draft,
                              divisorAuditReason || 'Updated divisor rule by Operations Admin'
                            );
                            setAdminFeedback(res.message);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#00B4D8] hover:bg-[#008EA8] text-white font-semibold text-[11px]"
                        >
                          Save Rule
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weight Verification Payment Adjustments & OTP Delivery Audit */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#DCEFF3] dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-[#1E293B] dark:text-white">
                  Weight Verification Payment Adjustments ({paymentAdjustments.length})
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {paymentAdjustments.map((adj) => (
                    <div key={adj.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{adj.adjustmentRef}</span>{' '}
                        <span className="font-mono text-slate-500">({adj.trackingNumber})</span>
                        <div className="text-[11px] text-slate-500">
                          {adj.originalWeightKg}kg → {adj.verifiedBillableWeightKg}kg · {adj.status.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                        {adj.differenceNgn > 0 ? `+₦${adj.differenceNgn.toLocaleString()}` : `-₦${Math.abs(adj.differenceNgn).toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#DCEFF3] dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-[#1E293B] dark:text-white">
                  Recent OTP Delivery Logs ({otpDeliveryLogs.length})
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {otpDeliveryLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="uppercase font-bold mr-1.5">{log.channel}</span>
                        <span className="font-mono">{log.recipientMasked}</span>
                        <div className="text-[10px] text-slate-500">{log.providerName}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: DHL CARRIER INTEGRATION */}
        {activeTab === 'dhl_carrier' && (
          <div className="space-y-6">
            <DhlCarrierManagementView />
          </div>
        )}
      </div>

      {/* MODAL: CREATE PROMO CODE */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3]">
            <h3 className="text-base font-bold text-[#1E293B] mb-1">Create Promotional Code</h3>
            <p className="text-xs text-[#66736B] mb-4">
              Set discount rules, minimum order values, and validity window.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Promo Code (Uppercase)</label>
                <input
                  type="text"
                  placeholder="e.g. SWIFTECO15"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Seasonal Commercial Sample Discount"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Discount Type</label>
                  <select
                    value={promoForm.discountType}
                    onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as any })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₦)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Value ({promoForm.discountType === 'percentage' ? '%' : '₦'})</label>
                  <input
                    type="number"
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Min Shipment (₦)</label>
                  <input
                    type="number"
                    value={promoForm.minShipmentAmountNgn}
                    onChange={(e) => setPromoForm({ ...promoForm, minShipmentAmountNgn: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Discount (₦)</label>
                  <input
                    type="number"
                    value={promoForm.maxDiscountAmountNgn}
                    onChange={(e) => setPromoForm({ ...promoForm, maxDiscountAmountNgn: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Valid From</label>
                  <input
                    type="date"
                    value={promoForm.validFrom}
                    onChange={(e) => setPromoForm({ ...promoForm, validFrom: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={promoForm.validUntil}
                    onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowPromoModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!promoForm.code.trim()) return;
                  addPromoCampaign(promoForm);
                  setShowPromoModal(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Create Promo Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROVISION STAFF */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3]">
            <h3 className="text-base font-bold text-[#1E293B] mb-1">Provision Staff Account</h3>
            <p className="text-xs text-[#66736B] mb-4">
              Grant role and assign duty workspace (Workspace A, B, or C).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Oluwaseun Adeleke"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Official Email</label>
                <input
                  type="email"
                  placeholder="name@swiftvero.ng"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assigned Operational Workspace</label>
                <select
                  value={staffForm.workspace}
                  onChange={(e) => setStaffForm({ ...staffForm, workspace: e.target.value as any })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium text-[#00B4D8]"
                >
                  <option value="pickup_shipping">Workspace A: Pickup & Shipping Management</option>
                  <option value="customer_service">Workspace B: Customer Service</option>
                  <option value="operations_admin">Workspace C: Operations & Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assigned Branch Hub</label>
                <select
                  value={staffForm.branchId}
                  onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowStaffModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!staffForm.name.trim()) return;
                  createStaffAccount({
                    name: staffForm.name,
                    email: staffForm.email,
                    phone: staffForm.phone || '+234 803 000 0000',
                    role: staffForm.role,
                    workspace: staffForm.workspace,
                    status: 'active',
                    branchId: staffForm.branchId,
                    branchName: branches.find((b) => b.id === staffForm.branchId)?.name || 'Ikeja Hub',
                    department: staffForm.department,
                  });
                  setShowStaffModal(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Provision Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
