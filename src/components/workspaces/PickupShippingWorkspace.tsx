import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Truck,
  Scale,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Send,
  FileText,
  MapPin,
  Calendar,
  Building2,
  AlertCircle,
  Eye,
  RefreshCw,
  UserCheck,
  Zap,
  Plus,
  Trash2,
  XCircle,
  QrCode,
  ClipboardCheck,
} from 'lucide-react';
import { PickupJob, ShipmentRecord, OperationalHandoverRecord, ShipmentClarificationRecord } from '../../types';
import { sortPickupQueuePriorityFirst, canHandoverShipmentToCarrier } from '../../utils/adjustment-engine';
import {
  RawPackageInput,
  calculateMultiPackageMeasurements,
  formatNaira,
} from '../../utils/shipping-calculator';
import { ReferenceQrBadge } from '../common/ReferenceQrBadge';

export const PickupShippingWorkspace: React.FC = () => {
  const {
    pickupJobs,
    shipments,
    bookingGroups,
    measurementReviews,
    operationalHandovers,
    shipmentClarifications,
    assignPickupHandler,
    confirmDoorstepCollection,
    confirmFacilityReceipt,
    confirmFacilityArrivalAndWeigh,
    markPickupFailed,
    reschedulePickup,
    markDropoffReceivedAtBranch,
    issueRevisedQuoteVersion,
    resolveMeasurementReviewUphold,
    createOperationalHandover,
    confirmOperationalHandoverReceipt,
    resolveClarification,
    updateShipmentStatus,
    carrierDivisorRules,
    currentStaffUser,
    branches,
    paymentAdjustments,
    staffNotifications,
    markStaffNotificationRead,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'pickups' | 'receiving' | 'shipments' | 'measurement_reviews' | 'speed' | 'clarifications' | 'handovers'
  >('overview');
  const [opsFeedback, setOpsFeedback] = useState<string | null>(null);

  // Search & Filter States
  const [pickupSearch, setPickupSearch] = useState('');
  const [pickupStatusFilter, setPickupStatusFilter] = useState('all');
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [shipmentFilter, setShipmentFilter] = useState('all');

  // Modal States
  const [selectedPickupForAssign, setSelectedPickupForAssign] = useState<PickupJob | null>(null);
  const [assignForm, setAssignForm] = useState({
    handlerType: 'staff' as 'staff' | 'external_partner' | 'manual',
    handlerName: 'Emeka Nwosu (Field Operations)',
    handlerPhone: '+234 803 300 0003',
    scheduledTime: '10:00 AM - 1:00 PM',
  });

  const [selectedPickupForDoorstep, setSelectedPickupForDoorstep] = useState<PickupJob | null>(null);
  const [doorstepForm, setDoorstepForm] = useState({
    packageCount: 1,
    visibleCondition: 'good' as 'good' | 'minor_outer_scuff' | 'carton_damaged' | 'unsealed',
    customerSignatureName: '',
    notes: 'Carton intact, sealed, handover receipt signed by sender.',
  });

  const [selectedPickupForWeighing, setSelectedPickupForWeighing] = useState<PickupJob | null>(null);
  const [weighingForm, setWeighingForm] = useState({
    repackagingApplied: false,
    conditionNotes: 'Intake at calibrated digital scale. Tamper seal verified.',
  });
  const [scalePackages, setScalePackages] = useState<RawPackageInput[]>([
    { description: 'Primary Box', actualWeightKg: 5.0, lengthCm: 35, widthCm: 25, heightCm: 20 },
  ]);
  const [selectedDivisorRuleId, setSelectedDivisorRuleId] = useState<string>(
    carrierDivisorRules.find((r) => r.isActive)?.id || 'div_std_5000'
  );

  const [selectedPickupForReceipt, setSelectedPickupForReceipt] = useState<PickupJob | null>(null);
  const [receiptForm, setReceiptForm] = useState({
    packageCountReceived: 1,
    visibleCondition: 'good' as 'good' | 'minor_scuff' | 'carton_damaged' | 'unsealed',
    packageDescription: '',
    discrepancies: '',
  });

  const [selectedPickupForFail, setSelectedPickupForFail] = useState<PickupJob | null>(null);
  const [failReason, setFailReason] = useState('');

  const [selectedPickupForReschedule, setSelectedPickupForReschedule] = useState<PickupJob | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    newTimeSlot: '10:00 AM - 2:00 PM',
    reason: 'Rescheduled per sender availability.',
  });

  const [selectedQrJob, setSelectedQrJob] = useState<PickupJob | null>(null);

  const openScaleModalForJob = (job: PickupJob) => {
    const linked = shipments.find(
      (sh) => sh.id === job.shipmentId || job.trackingNumber.includes(sh.trackingNumber)
    );
    const tier = linked?.selectedTier || linked?.quote?.serviceTier || 'standard';
    const matchingRule =
      carrierDivisorRules.find((r) => r.isActive && r.serviceTier === tier) ||
      carrierDivisorRules.find((r) => r.isActive) ||
      carrierDivisorRules[0];
    if (matchingRule) {
      setSelectedDivisorRuleId(matchingRule.id);
    }

    if (job.packageMeasurements && job.packageMeasurements.length > 0) {
      setScalePackages(
        job.packageMeasurements.map((pm) => ({
          description: pm.description || `Box #${pm.boxNumber}`,
          actualWeightKg: pm.actualWeightKg,
          lengthCm: pm.lengthCm,
          widthCm: pm.widthCm,
          heightCm: pm.heightCm,
        }))
      );
    } else {
      const boxCount = Math.max(1, job.facilityPackageCountConfirmed || job.packageCount || 1);
      const perBoxWeight = Math.round(((job.declaredWeightKg || 2) / boxCount) * 10) / 10;
      setScalePackages(
        Array.from({ length: boxCount }, (_, i) => ({
          description: boxCount === 1 ? (job.packageDescription || 'Primary Box') : `Box #${i + 1}`,
          actualWeightKg: Math.max(0.5, perBoxWeight),
          lengthCm: job.declaredDimensions?.length || 32,
          widthCm: job.declaredDimensions?.width || 22,
          heightCm: job.declaredDimensions?.height || 16,
        }))
      );
    }
    setWeighingForm({
      repackagingApplied: false,
      conditionNotes: 'Intake at calibrated digital scale. Tamper seal verified.',
    });
    setSelectedPickupForWeighing(job);
  };

  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverForm, setHandoverForm] = useState({
    originFacilityName: 'Ikeja Cargo Hub (Lagos Mainland)',
    destinationFacilityName: 'Murtala Muhammed Cargo Terminal (MMA2 Export Hub)',
    driverName: 'Ibrahim Danladi',
    driverPhone: '+234 803 999 1122',
    vehicleReg: 'APP-849-XY (Toyota Hiace Van)',
    packageCount: 12,
    dispatcherStaffName: currentStaffUser?.name || 'Tunde Adebayo',
    notes: 'Consolidated evening dispatch batch for linehaul airfreight.',
  });

  const [selectedClarification, setSelectedClarification] = useState<ShipmentClarificationRecord | null>(null);
  const [clarificationResolutionNote, setClarificationResolutionNote] = useState('');

  // Reweigh & Measurement Review modal states
  const [reweighTarget, setReweighTarget] = useState<{
    reviewId: string;
    shipmentId: string;
    trackingNumber: string;
    declaredWeightKg: number;
    currentWeightKg: number;
  } | null>(null);
  const [reweighForm, setReweighForm] = useState({
    measuredWeightKg: 4.5,
    length: 35,
    width: 25,
    height: 18,
    reason: 'Calibrated reweigh completed following customer measurement review request.',
  });
  const [upholdTargetId, setUpholdTargetId] = useState<string | null>(null);
  const [upholdNote, setUpholdNote] = useState(
    'Re-verified on calibrated Mettler-Toledo floor scale. Original facility weight and box dimensions confirmed accurate.'
  );

  // Status helper badges
  const getPickupBadge = (status: PickupJob['status']) => {
    switch (status) {
      case 'booking_received':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Booking Received</span>;
      case 'scheduled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Courier Scheduled</span>;
      case 'collected':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Collected (In Transit)</span>;
      case 'facility_received':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">Received at Facility</span>;
      case 'arrived_at_facility':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">Arrived at Facility</span>;
      case 'quotation_ready':
      case 'handed_over':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Weighed &amp; Quoted</span>;
      case 'failed':
      case 'failed_attempt':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Pickup Failed</span>;
      case 'rescheduled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">Rescheduled</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{status}</span>;
    }
  };

  // Filtered & Priority-First Pickups (supports QR/tracking/phone/ref search)
  const rawPickupSearch = pickupSearch.trim();
  let normalizedPickupQuery = rawPickupSearch.toLowerCase();
  if (rawPickupSearch.startsWith('{')) {
    try {
      const parsedQr = JSON.parse(rawPickupSearch);
      const qrCode = parsedQr.swv || parsedQr.ref || parsedQr.pickupRef || '';
      if (qrCode) normalizedPickupQuery = String(qrCode).toLowerCase();
    } catch {
      // Fall back to literal substring matching
    }
  }

  const filteredPickups = sortPickupQueuePriorityFirst(
    pickupJobs.filter((job) => {
      const matchesSearch =
        !normalizedPickupQuery ||
        job.trackingNumber.toLowerCase().includes(normalizedPickupQuery) ||
        job.pickupReference.toLowerCase().includes(normalizedPickupQuery) ||
        job.senderName.toLowerCase().includes(normalizedPickupQuery) ||
        job.senderPhone.toLowerCase().includes(normalizedPickupQuery) ||
        job.senderAddress.toLowerCase().includes(normalizedPickupQuery);
      const matchesStatus =
        pickupStatusFilter === 'all' ||
        job.status === pickupStatusFilter ||
        (pickupStatusFilter === 'failed_group' && (job.status === 'failed' || job.status === 'failed_attempt')) ||
        (pickupStatusFilter === 'scale_ready' &&
          (job.status === 'collected' || job.status === 'arrived_at_facility' || job.status === 'facility_received')) ||
        (pickupStatusFilter === 'quoted_group' &&
          (job.status === 'quotation_ready' || job.status === 'handed_over'));
      return matchesSearch && matchesStatus;
    })
  );

  const unreadWorkspaceANotifs = staffNotifications.filter(
    (n) => n.targetWorkspace === 'pickup_shipping' && !n.isRead
  );

  // Filtered Shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.trackingNumber.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.senderName.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.destinationCountry.toLowerCase().includes(shipmentSearch.toLowerCase());
    const matchesStatus = shipmentFilter === 'all' || s.status === shipmentFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingDropoffs = shipments.filter(
    (s) =>
      s.collectionMethod === 'dropoff' &&
      (s.pickupStatus === 'requested' || s.status === 'booked' || s.status === 'pickup_scheduled')
  );
  const openMeasurementReviews = measurementReviews.filter(
    (mr) => mr.status === 'open' || mr.status === 'in_review'
  );

  return (
    <div className="min-h-screen bg-[#F7FCFD] dark:bg-slate-950 pb-16 text-slate-900 dark:text-slate-100">
      {/* Workspace Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-[#DCEFF3] dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] dark:bg-sky-950 text-[#00B4D8] flex items-center justify-center font-bold text-lg border border-[#DCEFF3] dark:border-sky-800">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00B4D8] bg-[#CAF0F8] dark:bg-sky-950 px-2 py-0.5 rounded">
                  Workspace A
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Field &amp; Intake Operations</span>
              </div>
              <h1 className="text-lg font-bold text-[#1E293B] dark:text-white">Pickup &amp; Shipping Management</h1>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-[#F7FCFD] dark:bg-slate-800 border border-[#DCEFF3] dark:border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Priority Pickups:</span>
              <span className="font-bold font-mono text-[#1E293B] dark:text-white">
                {pickupJobs.filter((j) => (j.isPriorityFlag || j.pickupType === 'priority') && j.status !== 'handed_over' && j.status !== 'cancelled').length}
              </span>
            </div>
            <div className="bg-[#F7FCFD] dark:bg-slate-800 border border-[#DCEFF3] dark:border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00B4D8]"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Scale / Drop-offs:</span>
              <span className="font-bold font-mono text-[#00B4D8]">
                {pickupJobs.filter((j) => j.status === 'collected' || j.status === 'arrived_at_facility' || j.status === 'facility_received').length + pendingDropoffs.length}
              </span>
            </div>
            <div className="hidden sm:flex bg-[#F7FCFD] dark:bg-slate-800 border border-[#DCEFF3] dark:border-slate-700 px-3 py-1.5 rounded-md items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Duty Officer:</span>
              <span className="font-bold text-[#1E293B] dark:text-white">{currentStaffUser?.name || 'Logistics Coordinator'}</span>
            </div>
          </div>
        </div>

        {/* Workspace Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800 py-2">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'pickups', label: 'Pickup Management', icon: Truck, count: pickupJobs.length },
            {
              id: 'receiving',
              label: 'Facility Scale & Drop-offs',
              icon: Scale,
              count: pickupJobs.filter((j) => j.status === 'collected' || j.status === 'arrived_at_facility' || j.status === 'facility_received').length + pendingDropoffs.length,
            },
            { id: 'shipments', label: 'Shipment Operations', icon: Package, count: shipments.length },
            {
              id: 'measurement_reviews',
              label: 'Measurement Reviews',
              icon: AlertTriangle,
              count: openMeasurementReviews.length,
            },
            { id: 'speed', label: 'Service Lanes & Speed', icon: Zap },
            {
              id: 'clarifications',
              label: 'Clarifications',
              icon: AlertCircle,
              count: shipmentClarifications.filter((c) => c.status === 'pending').length,
            },
            { id: 'handovers', label: 'Inter-Branch Handovers', icon: Send, count: operationalHandovers.length },
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

      {opsFeedback && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3">
            <span className="font-medium">{opsFeedback}</span>
            <button
              type="button"
              onClick={() => setOpsFeedback(null)}
              className="text-[11px] font-bold underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {unreadWorkspaceANotifs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-2">
          {unreadWorkspaceANotifs.map((n) => (
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Visual Banner with Official Photo */}
            <div className="bg-white rounded-xl border border-[#DCEFF3] overflow-hidden shadow-xs flex flex-col md:flex-row">
              <div className="p-6 md:w-3/5 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#CAF0F8] text-[#0F172A] border border-[#90E0EF] mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00B4D8]" />
                    Strict Operational Policy: Facility-Only Weighing
                  </div>
                  <h2 className="text-xl font-bold text-[#1E293B]">
                    Doorstep Pickup Collection & Calibrated Facility Intake
                  </h2>
                  <p className="mt-2 text-sm text-[#66736B] leading-relaxed">
                    Per Swiftvero operating standard, doorstep collection agents verify carton seal and visible condition only. 
                    Official billing weight is determined exclusively on calibrated digital scales at Swiftvero hubs to ensure transparent, indisputable invoices.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[#F7FCFD] border border-[#DCEFF3] p-3 rounded-lg">
                    <span className="text-xs text-[#66736B]">24h Collection SLA</span>
                    <div className="text-lg font-bold text-[#00B4D8] mt-0.5">98.4%</div>
                    <span className="text-[10px] text-slate-500">Target: &lt;24 hours</span>
                  </div>
                  <div className="bg-[#F7FCFD] border border-[#DCEFF3] p-3 rounded-lg">
                    <span className="text-xs text-[#66736B]">Facility Scale Intake</span>
                    <div className="text-lg font-bold text-[#1E293B] mt-0.5">100% Certified</div>
                    <span className="text-[10px] text-slate-500">Tamper-seal verified</span>
                  </div>
                  <div className="bg-[#F7FCFD] border border-[#DCEFF3] p-3 rounded-lg col-span-2 sm:col-span-1">
                    <span className="text-xs text-[#66736B]">Linehaul Inter-Branch</span>
                    <div className="text-lg font-bold text-[#1E293B] mt-0.5">{operationalHandovers.length} Transfer Lists</div>
                    <span className="text-[10px] text-slate-500">Dual sign-off</span>
                  </div>
                </div>
              </div>

              <div className="md:w-2/5 bg-slate-100 relative min-h-[200px]">
                <img
                  src="/assets/aistudio/IMG_2160_95d48b98.jpeg"
                  alt="Swiftvero Front Desk and Calibrated Scale"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded">
                  Ikeja Cargo Hub Intake Desk
                </div>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab('pickups')}
                className="bg-white p-5 rounded-xl border border-[#DCEFF3] hover:border-[#00B4D8] cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#00B4D8] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Manage Pickups &rarr;
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1E293B] mt-3">Scheduled Doorstep Collections</h3>
                <p className="text-xs text-[#66736B] mt-1">
                  Assign internal runners or external linehaul couriers to pending sender addresses.
                </p>
                <div className="mt-3 text-xs font-medium text-slate-500">
                  {pickupJobs.filter((j) => j.status === 'scheduled').length} couriers currently in transit
                </div>
              </div>

              <div
                onClick={() => setActiveTab('receiving')}
                className="bg-white p-5 rounded-xl border border-[#DCEFF3] hover:border-[#00B4D8] cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold">
                    <Scale className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#00B4D8] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Calibrated Scale &rarr;
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1E293B] mt-3">Facility Weighing & Dimensioning</h3>
                <p className="text-xs text-[#66736B] mt-1">
                  Record official certified weights, length, width, height, and trigger final quotation notices.
                </p>
                <div className="mt-3 text-xs font-medium text-amber-600">
                  {pickupJobs.filter((j) => j.status === 'collected' || j.status === 'arrived_at_facility' || j.status === 'facility_received').length} parcels awaiting receipt or scale check
                </div>
              </div>

              <div
                onClick={() => setActiveTab('handovers')}
                className="bg-white p-5 rounded-xl border border-[#DCEFF3] hover:border-[#00B4D8] cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#00B4D8] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Inter-Branch &rarr;
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1E293B] mt-3">Inter-Branch Linehaul Transfers</h3>
                <p className="text-xs text-[#66736B] mt-1">
                  Generate transit transfer lists between Ikeja Hub, VI Branch, and Airport Cargo terminals with dual sign-off.
                </p>
                <div className="mt-3 text-xs font-medium text-slate-500">
                  {operationalHandovers.filter((h) => h.status === 'dispatched').length} transfer lists currently in transit
                </div>
              </div>
            </div>

            {/* Live Operational Feed */}
            <div className="bg-white rounded-xl border border-[#DCEFF3] p-5">
              <h3 className="text-sm font-bold text-[#1E293B] mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00B4D8]" />
                Recent Field & Intake Activity
              </h3>
              <div className="divide-y divide-slate-100">
                {pickupJobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center text-xs font-bold shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#1E293B]">{job.pickupReference}</span>
                          {getPickupBadge(job.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {job.senderName} &bull; {job.senderAddress.split(',')[0]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-medium text-slate-700">Declared: {job.declaredWeightKg}kg</span>
                      <p className="text-slate-400 text-[10px]">
                        {job.verifiedWeightKg ? `Scale: ${job.verifiedWeightKg}kg` : 'Pending Scale'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PICKUP MANAGEMENT */}
        {activeTab === 'pickups' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-[#DCEFF3] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Scan QR code or search SWV-, PKP-, phone, sender..."
                  value={pickupSearch}
                  onChange={(e) => setPickupSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#DCEFF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00B4D8]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={pickupStatusFilter}
                  onChange={(e) => setPickupStatusFilter(e.target.value)}
                  className="text-xs border border-[#DCEFF3] dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00B4D8]"
                >
                  <option value="all">All Pickup Statuses</option>
                  <option value="booking_received">Booking Received</option>
                  <option value="scheduled">Courier Scheduled</option>
                  <option value="collected">Collected at Doorstep</option>
                  <option value="facility_received">Received at Facility</option>
                  <option value="scale_ready">Ready for Scale / Intake</option>
                  <option value="quoted_group">Weighed &amp; Quoted</option>
                  <option value="failed_group">Failed Attempts</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
            </div>

            {/* Doorstep Rule Warning Box */}
            <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Doorstep Pickup Standard:</span> Field couriers strictly do NOT carry hanging scales or weigh at doorstep. 
                They check package count, visual carton condition, and obtain sender signature on the collection receipt. 
                Official digital scale weighing occurs exclusively at the Swiftvero Hub.
              </div>
            </div>

            {/* Pickup Jobs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FCFD] dark:bg-slate-800 border-b border-[#DCEFF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Pickup Reference</th>
                      <th className="py-3 px-4">Sender &amp; Address</th>
                      <th className="py-3 px-4">Schedule / SLA</th>
                      <th className="py-3 px-4">Packages</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned Courier</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredPickups.map((job) => {
                      const isPriority = job.isPriorityFlag || job.pickupType === 'priority';
                      const linkedShip = shipments.find(
                        (sh) => sh.id === job.shipmentId || job.trackingNumber.includes(sh.trackingNumber)
                      );
                      const isFragile = Boolean(job.isFragile || linkedShip?.isFragile);
                      const fragileNotes = job.fragileHandlingNotes || linkedShip?.fragileHandlingNotes;
                      const canMarkFailed =
                        job.status === 'booking_received' ||
                        job.status === 'scheduled' ||
                        job.status === 'rescheduled';
                      const canReschedule =
                        job.status === 'booking_received' ||
                        job.status === 'scheduled' ||
                        job.status === 'failed' ||
                        job.status === 'failed_attempt' ||
                        job.status === 'rescheduled';
                      const needsFacilityReceipt =
                        !job.facilityReceipt &&
                        (job.status === 'scheduled' ||
                          job.status === 'collected' ||
                          job.status === 'arrived_at_facility');
                      const canWeigh =
                        job.status === 'collected' ||
                        job.status === 'arrived_at_facility' ||
                        job.status === 'facility_received';

                      return (
                      <tr key={job.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-[#1E293B] dark:text-slate-100">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono font-bold">{job.pickupReference}</span>
                            {isPriority && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                Priority Pickup
                              </span>
                            )}
                            {isFragile && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                FRAGILE
                              </span>
                            )}
                            {job.bookingGroupId && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#CAF0F8]/60 dark:bg-sky-950 text-[#008EA8] dark:text-[#90E0EF]">
                                Batch ({job.shipmentIds?.length || 1})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{job.trackingNumber}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedQrJob(job)}
                              title="Show scannable QR code"
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#008EA8] dark:text-[#90E0EF] hover:underline"
                            >
                              <QrCode className="w-3 h-3" />
                              QR
                            </button>
                          </div>
                          {isFragile && fragileNotes && (
                            <div className="text-[10px] text-rose-700 dark:text-rose-300 mt-0.5 max-w-[220px]">
                              Note: {fragileNotes}
                            </div>
                          )}
                          {job.failureReason && (
                            <div className="text-[10px] text-rose-700 dark:text-rose-300 mt-0.5 max-w-[220px]">
                              Failure: {job.failureReason}
                            </div>
                          )}
                          {job.rescheduledFromDate && (
                            <div className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-0.5 max-w-[220px]">
                              Rescheduled from {job.rescheduledFromDate}: {job.rescheduledReason || 'Updated window'}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1E293B] dark:text-slate-100">{job.senderName}</div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[200px]" title={job.senderAddress}>
                            {job.senderAddress}
                          </div>
                          <div className="text-[10px] text-slate-400">{job.senderPhone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">{job.scheduledDate}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {isPriority ? job.estimatedWindow || '1 – 6 hours' : job.scheduledSlot}
                          </div>
                          <div className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                            {job.pickupFeeNgn && job.pickupFeeNgn > 0
                              ? `Priority Fee: ${formatNaira(job.pickupFeeNgn)}`
                              : 'Pickup Fee: Free (Standard)'}
                          </div>
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <span className="font-semibold">{job.facilityPackageCountConfirmed || job.packageCount || 1} pcs</span>
                          <div className="text-[10px] text-slate-400">Decl: {job.declaredWeightKg} kg</div>
                          {job.facilityChargeableWeightKg && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                              Billable: {job.facilityChargeableWeightKg} kg
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">{getPickupBadge(job.status)}</td>
                        <td className="py-3 px-4">
                          {job.collectionHandlerName ? (
                            <div>
                              <div className="font-medium text-slate-800 dark:text-slate-200">{job.collectionHandlerName}</div>
                              <div className="text-[10px] text-slate-400">
                                {job.collectionHandlerType === 'staff' ? 'Swiftvero Courier' : 'Partner Linehaul'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {(job.status === 'booking_received' || job.status === 'rescheduled') && (
                              <button
                                type="button"
                                onClick={() => setSelectedPickupForAssign(job)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors"
                              >
                                Dispatch Courier
                              </button>
                            )}
                            {job.status === 'scheduled' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPickupForDoorstep(job);
                                  setDoorstepForm((prev) => ({ ...prev, packageCount: job.packageCount || 1 }));
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                              >
                                Confirm Doorstep
                              </button>
                            )}
                            {needsFacilityReceipt && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPickupForReceipt(job);
                                  setReceiptForm({
                                    packageCountReceived: job.packageCount || 1,
                                    visibleCondition: 'good',
                                    packageDescription: job.packageDescription || linkedShip?.contentsDescription || 'Export parcel carton',
                                    discrepancies: '',
                                  });
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-cyan-700 text-white hover:bg-cyan-800 transition-colors"
                              >
                                Confirm Receipt
                              </button>
                            )}
                            {canWeigh && (
                              <button
                                type="button"
                                onClick={() => openScaleModalForJob(job)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors"
                              >
                                Scale Weighing
                              </button>
                            )}
                            {canMarkFailed && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPickupForFail(job);
                                  setFailReason('');
                                }}
                                className="px-2 py-1 text-[11px] font-semibold rounded border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              >
                                Mark Failed
                              </button>
                            )}
                            {canReschedule && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPickupForReschedule(job);
                                  setRescheduleForm({
                                    newDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                                    newTimeSlot: job.scheduledSlot || '10:00 AM - 2:00 PM',
                                    reason: '',
                                  });
                                }}
                                className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                Reschedule
                              </button>
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
        )}

        {/* TAB 3: FACILITY SCALE INTAKE & BRANCH DROP-OFF RECEIVING */}
        {activeTab === 'receiving' && (
          <div className="space-y-6">
            {/* Scheduled Branch Drop-Off Counter Intake */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#DCEFF3] dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#00B4D8]" />
                    Branch Drop-Off Counter Queue ({pendingDropoffs.length})
                  </h3>
                  <p className="text-xs text-[#66736B] dark:text-slate-400">
                    Confirm physical parcel arrival when a sender drops off a shipment at an active Swiftvero hub.
                  </p>
                </div>
              </div>

              {pendingDropoffs.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  No pending walk-in branch drop-offs awaiting check-in.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingDropoffs.map((s) => {
                    const targetBranch =
                      branches.find((b) => b.id === (s.collectionBranchId || s.branchId)) ||
                      branches.find((b) => b.status === 'active');
                    return (
                      <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{s.trackingNumber}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#CAF0F8]/70 dark:bg-sky-950 text-[#008EA8] dark:text-[#90E0EF]">
                              {targetBranch?.name || 'Ikeja Cargo Hub'}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Sender: <strong className="text-slate-800 dark:text-slate-200">{s.senderName}</strong> · Destination: {s.destinationCity}, {s.destinationCountry}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const res = markDropoffReceivedAtBranch(
                              s.id,
                              targetBranch?.id || 'branch_ikeja',
                              'Verified sender handover and tamper-sealed carton at branch counter.'
                            );
                            setOpsFeedback(res.message);
                          }}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors whitespace-nowrap shrink-0"
                        >
                          Mark Package Received at Branch
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#DCEFF3] dark:border-slate-800 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[#00B4D8]" />
                    Calibrated Digital Scale Intake Station
                  </h3>
                  <p className="text-xs text-[#66736B] mt-0.5">
                    Parcels received from doorstep collection or walk-in senders undergo digital weighing, 3D measurement, package size-based weight calculation (L×W×H / 5000), and tamper-seal verification.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-700">Digital Scale: Mettler-Toledo IND570 (Online)</span>
                </div>
              </div>

              {/* Ready for Scale Queue */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pickupJobs
                  .filter(
                    (j) =>
                      j.status === 'collected' ||
                      j.status === 'arrived_at_facility' ||
                      j.status === 'facility_received'
                  )
                  .map((job) => {
                    const linkedShip = shipments.find(
                      (sh) => sh.id === job.shipmentId || job.trackingNumber.includes(sh.trackingNumber)
                    );
                    const isFragile = Boolean(job.isFragile || linkedShip?.isFragile);
                    const fragileNotes = job.fragileHandlingNotes || linkedShip?.fragileHandlingNotes;
                    const hasReceipt = Boolean(job.facilityReceipt || job.status === 'facility_received');
                    return (
                    <div key={job.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold font-mono text-sm text-[#1E293B] dark:text-white">{job.pickupReference}</span>
                          <span className="text-xs text-slate-500 font-mono">({job.trackingNumber})</span>
                          {getPickupBadge(job.status)}
                          {isFragile && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                              FRAGILE HANDLING
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          Sender: <span className="font-medium text-slate-800 dark:text-white">{job.senderName}</span> &bull; Declared: {job.declaredWeightKg}kg ({job.packageCount} pcs)
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Doorstep Condition: {job.collectionVisibleCondition || 'Good'} &bull; Customer Signed: {job.collectionCustomerName || 'Yes'}
                          {job.facilityReceipt && (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              {' '}&bull; Facility Receipt: {job.facilityReceipt.packageCountReceived} pkg(s) verified ({job.facilityReceipt.visibleCondition})
                            </span>
                          )}
                        </p>
                        {isFragile && fragileNotes && (
                          <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                            Fragile Note: {fragileNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {!hasReceipt && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPickupForReceipt(job);
                              setReceiptForm({
                                packageCountReceived: job.packageCount || 1,
                                visibleCondition: 'good',
                                packageDescription: job.packageDescription || linkedShip?.contentsDescription || 'Export parcel carton',
                                discrepancies: '',
                              });
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 transition-colors flex items-center gap-1.5"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            Step 1: Confirm Physical Receipt
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openScaleModalForJob(job)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors flex items-center gap-1.5"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          {hasReceipt ? 'Place on Scale & Verify' : 'Step 2: Scale & Multi-Box Weigh'}
                        </button>
                      </div>
                    </div>
                    );
                  })}

                {pickupJobs.filter(
                  (j) =>
                    j.status === 'collected' ||
                    j.status === 'arrived_at_facility' ||
                    j.status === 'facility_received'
                ).length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    All arriving doorstep collections have been weighed on the calibrated scale!
                  </div>
                )}
              </div>
            </div>

            {/* Weighing History */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#DCEFF3] dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Recently Weighed &amp; Verified Shipments
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Shipment</th>
                      <th className="py-2.5 px-3">Boxes &amp; Divisor</th>
                      <th className="py-2.5 px-3">Declared Wt</th>
                      <th className="py-2.5 px-3">Scale Actual</th>
                      <th className="py-2.5 px-3">Volumetric Wt</th>
                      <th className="py-2.5 px-3">Chargeable Wt</th>
                      <th className="py-2.5 px-3">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 tabular-nums">
                    {pickupJobs
                      .filter(
                        (j) =>
                          (j.status === 'handed_over' || j.status === 'quotation_ready') &&
                          j.facilityActualWeightKg
                      )
                      .map((job) => {
                        const chargeable = job.facilityChargeableWeightKg || job.facilityActualWeightKg || 0;
                        const variance = chargeable - job.declaredWeightKg;
                        return (
                          <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-semibold text-[#1E293B] dark:text-white">{job.trackingNumber}</td>
                            <td className="py-2.5 px-3">
                              {job.packageMeasurements ? `${job.packageMeasurements.length} box(es)` : `${job.facilityPackageCountConfirmed || 1} box`} · /{job.appliedDivisor || 5000}
                            </td>
                            <td className="py-2.5 px-3">{job.declaredWeightKg} kg</td>
                            <td className="py-2.5 px-3 font-bold text-[#00B4D8]">{job.facilityActualWeightKg} kg</td>
                            <td className="py-2.5 px-3">{job.facilityVolumetricWeightKg || '—'} kg</td>
                            <td className="py-2.5 px-3 font-bold text-[#1E293B] dark:text-white">{chargeable} kg</td>
                            <td className="py-2.5 px-3">
                              {Math.abs(variance) > 0.1 ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  {variance > 0 ? '+' : ''}{variance.toFixed(1)} kg (Re-quoted)
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Accurate</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SHIPMENT MANAGEMENT */}
        {activeTab === 'shipments' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-[#DCEFF3] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search tracking, receiver, destination..."
                  value={shipmentSearch}
                  onChange={(e) => setShipmentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#DCEFF3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00B4D8]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={shipmentFilter}
                  onChange={(e) => setShipmentFilter(e.target.value)}
                  className="text-xs border border-[#DCEFF3] dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00B4D8]"
                >
                  <option value="all">All Shipments</option>
                  <option value="quote_ready">Quote Ready</option>
                  <option value="quote_approved">Quote Approved</option>
                  <option value="booked">Booked / Confirmed</option>
                  <option value="pickup_scheduled">Pickup Scheduled</option>
                  <option value="pickup_completed">Pickup Completed</option>
                  <option value="in_transit">In Transit</option>
                  <option value="overdue_investigation">Overdue Investigation</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Active Multi-Shipment Booking Groups Summary */}
            {bookingGroups.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-4 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Multi-Shipment Booking Groups ({bookingGroups.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {bookingGroups.map((bg) => (
                    <div
                      key={bg.id}
                      className="p-3 rounded-lg bg-[#F7FCFD] dark:bg-slate-800/70 border border-[#DCEFF3] dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {bg.groupCode} · {bg.shipmentIds.length} shipments
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          {bg.senderName} · {bg.collectionMethod.replace('_', ' ')} ({bg.collectionArrangement})
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#CAF0F8] dark:bg-sky-950 text-[#008EA8] dark:text-[#90E0EF]">
                        {bg.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FCFD] dark:bg-slate-800 border-b border-[#DCEFF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Tracking Number</th>
                      <th className="py-3 px-4">Destination &amp; Recipient</th>
                      <th className="py-3 px-4">Service &amp; Collection</th>
                      <th className="py-3 px-4">Weight</th>
                      <th className="py-3 px-4">Quote Amount</th>
                      <th className="py-3 px-4">Tracking Status</th>
                      <th className="py-3 px-4 text-right">Quick Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredShipments.map((s) => {
                      const guard = canHandoverShipmentToCarrier({
                        shipment: s,
                        adjustments: paymentAdjustments,
                      });
                      return (
                      <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-[#1E293B] dark:text-white">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{s.trackingNumber}</span>
                            {s.isFragile && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-rose-100 text-rose-800">
                                FRAGILE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-sans text-slate-400">
                            {s.senderName}
                            {s.bookingGroupId ? ` · Batch` : ''}
                          </div>
                          {!guard.allowed && !s.dhlTrackingNumber && (
                            <div className="text-[10px] font-sans font-semibold text-rose-700 dark:text-rose-400 mt-0.5">
                              Dispatch Locked {guard.blockingAdjustmentRef ? `(${guard.blockingAdjustmentRef})` : '(Unpaid)'}
                            </div>
                          )}
                          {s.isFragile && s.fragileHandlingNotes && (
                            <div className="text-[10px] font-sans text-rose-700 dark:text-rose-300 mt-0.5 max-w-[200px]">
                              {s.fragileHandlingNotes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1E293B] dark:text-slate-100">{s.recipientName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {s.destinationCity}, {s.destinationCountry}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold w-fit ${
                                s.quote?.serviceTier === 'priority'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {s.quote?.serviceTier === 'priority' ? 'Priority Express' : 'Standard Air'}
                            </span>
                            {s.collectionMethod && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                                {s.collectionMethod.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="font-medium">{s.verifiedWeightKg || s.declaredWeightKg} kg</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1E293B] dark:text-white">
                          ₦{(s.quote?.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              s.status === 'delivered'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : s.status === 'in_transit'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                : s.status === 'overdue_investigation'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {s.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={s.status}
                            onChange={(e) => updateShipmentStatus(s.id, { status: e.target.value as any })}
                            aria-label={`Update status for ${s.trackingNumber}`}
                            className="text-[11px] border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                          >
                            <option value="quote_ready">Quote Ready</option>
                            <option value="quote_approved">Quote Approved</option>
                            <option value="payment_pending">Payment Pending</option>
                            <option value="booked">Booked / Confirmed</option>
                            <option value="pickup_scheduled">Pickup Scheduled</option>
                            <option value="pickup_completed">Pickup Completed</option>
                            <option value="in_transit">In Transit</option>
                            <option value="overdue_investigation">Overdue Investigation</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4.5: MEASUREMENT REVIEW REQUESTS & REWEIGH REVISION */}
        {activeTab === 'measurement_reviews' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#DCEFF3] dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#00B4D8]" />
                  Measurement Review Requests &amp; Quote Revisions
                </h3>
                <p className="text-xs text-[#66736B] dark:text-slate-400 mt-0.5">
                  Verify customer reweigh disputes on calibrated scales and issue a revised quote version (v2+) or uphold with audit notes.
                </p>
              </div>

              {measurementReviews.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  No measurement review requests have been submitted.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {measurementReviews.map((mr) => {
                    const ship = shipments.find((s) => s.id === mr.shipmentId);
                    const isPending = mr.status === 'open' || mr.status === 'in_review';
                    return (
                      <div key={mr.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              {mr.trackingNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isPending
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              {mr.status.replace('_', ' ')}
                            </span>
                            {ship && (
                              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                Declared: {ship.declaredWeightKg} kg · Facility: {ship.verifiedWeightKg || ship.declaredWeightKg} kg
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">
                            <strong>Customer reason:</strong> {mr.reason}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Requested by {mr.customerName || ship?.customerName || 'Customer'} on {mr.createdAt.slice(0, 10)}
                          </p>
                          {mr.staffResolutionNote && (
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2 rounded mt-1">
                              <strong>Resolution ({mr.reviewedBy || 'Ops'}):</strong> {mr.staffResolutionNote}
                            </p>
                          )}
                        </div>

                        {isPending && ship && (
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setReweighTarget({
                                  reviewId: mr.id,
                                  shipmentId: ship.id,
                                  trackingNumber: ship.trackingNumber,
                                  declaredWeightKg: ship.declaredWeightKg,
                                  currentWeightKg: ship.verifiedWeightKg || ship.declaredWeightKg,
                                });
                                setReweighForm({
                                  measuredWeightKg: ship.verifiedWeightKg || ship.declaredWeightKg,
                                  length: ship.verifiedDimensions?.length || 32,
                                  width: ship.verifiedDimensions?.width || 22,
                                  height: ship.verifiedDimensions?.height || 18,
                                  reason: 'Reweighed at Ikeja intake scale following customer review request.',
                                });
                              }}
                              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors"
                            >
                              Reweigh &amp; Revise Quote
                            </button>
                            <button
                              type="button"
                              onClick={() => setUpholdTargetId(mr.id)}
                              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              Uphold Measurement
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SHIPPING SPEED MANAGEMENT */}
        {activeTab === 'speed' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-[#DCEFF3] shadow-xs">
              <h3 className="text-base font-bold text-[#1E293B] mb-1">
                International Carrier Speed & Service Lane Rules
              </h3>
              <p className="text-xs text-[#66736B] mb-6">
                Swiftvero coordinates with authorized international linehaul carriers. Priority is offered strictly on routes with certified direct carrier flights.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-xl p-5 bg-[#F7FCFD]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00B4D8] bg-[#CAF0F8] px-2.5 py-0.5 rounded border border-[#DCEFF3]">
                      Standard / Economy
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Economy Air Freight</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#1E293B]">Swiftvero Global Standard</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Reliable consolidated carriage via scheduled cargo partner flights with end-to-end tracking.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Transit Window: 5 - 9 Business Days
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Free Lagos doorstep collection on bookings over ₦25,000
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Covered under Swiftvero Standard Conditions of Carriage
                    </li>
                  </ul>
                </div>

                <div className="border border-amber-300 rounded-xl p-5 bg-amber-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                      Priority / Express
                    </span>
                    <span className="text-xs font-semibold text-amber-700">Direct Express Flight</span>
                  </div>
                  <h4 className="text-lg font-bold text-amber-950">Swiftvero Express Priority</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Expedited customs clearance queue and prioritized linehaul routing for urgent documents & commercial samples.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                      Transit Window: 2 - 4 Business Days (UK, US, Canada, EU)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                      Guaranteed same-day hub intake and export transfer listing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                      Proactive 6-hour interval tracking freshness monitor
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CLARIFICATIONS */}
        {activeTab === 'clarifications' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-[#DCEFF3] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Pickup & Shipment Clarifications Queue
                  </h3>
                  <p className="text-xs text-[#66736B] mt-0.5">
                    Field exceptions, unreachable senders, address queries, or repackaging clarifications flagged for resolution.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {shipmentClarifications.map((clr) => (
                  <div key={clr.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1E293B]">{clr.trackingNumber}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            clr.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {clr.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">({(clr.category || clr.issueType || 'general').replace('_', ' ')})</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{clr.description}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Raised by: {clr.raisedBy || 'Operations'} &bull; {clr.raisedAt || clr.createdAt ? new Date(clr.raisedAt || clr.createdAt || '').toLocaleString() : 'Recent'}
                      </p>
                      {clr.resolutionNotes && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded mt-2 border border-emerald-200">
                          Resolution: {clr.resolutionNotes} (by {clr.resolvedBy})
                        </p>
                      )}
                    </div>

                    {clr.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedClarification(clr);
                          setClarificationResolutionNote('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors shrink-0"
                      >
                        Resolve Clarification
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: INTER-BRANCH OPERATIONAL HANDOVERS */}
        {activeTab === 'handovers' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-[#DCEFF3] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#00B4D8]" />
                    Inter-Branch Linehaul Custody & Transfer Lists
                  </h3>
                  <p className="text-xs text-[#66736B] mt-0.5">
                    Dual sign-off control for shipments transferred between mainland hubs, island branch desks, and airport cargo export facilities.
                  </p>
                </div>
                <button
                  onClick={() => setShowHandoverModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#00B4D8] text-white hover:bg-[#008EA8] transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch New Transfer List
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {operationalHandovers.map((h) => (
                  <div key={h.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1E293B]">{h.manifestNumber}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            h.status === 'received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : h.status === 'discrepancy_reported'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {h.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{h.packageCount} Packages</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Route: <span className="font-semibold">{h.originFacilityName}</span> &rarr;{' '}
                        <span className="font-semibold">{h.destinationFacilityName}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Driver: {h.driverName} ({h.vehicleReg}) &bull; Dispatcher: {h.dispatcherStaffName}
                      </p>
                      {h.receivedAt && (
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Received & Signed by: {h.receiverStaffName} at {new Date(h.receivedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>

                    {h.status === 'dispatched' && (
                      <button
                        onClick={() => confirmOperationalHandoverReceipt(h.id, 'All package tamper-seals intact upon arrival.')}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
                      >
                        Sign & Confirm Intake
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: DISPATCH PICKUP HANDLER */}
      {selectedPickupForAssign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3]">
            <h3 className="text-base font-bold text-[#1E293B] mb-1">Dispatch Doorstep Pickup Courier</h3>
            <p className="text-xs text-[#66736B] mb-4">
              Assign field runner for <span className="font-semibold">{selectedPickupForAssign.pickupReference}</span>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Handler Type</label>
                <select
                  value={assignForm.handlerType}
                  onChange={(e) => setAssignForm({ ...assignForm, handlerType: e.target.value as any })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  <option value="staff">Internal Swiftvero Runner</option>
                  <option value="external_partner">Regional Partner Linehaul</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Courier Name</label>
                <input
                  type="text"
                  value={assignForm.handlerName}
                  onChange={(e) => setAssignForm({ ...assignForm, handlerName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Courier Phone</label>
                <input
                  type="text"
                  value={assignForm.handlerPhone}
                  onChange={(e) => setAssignForm({ ...assignForm, handlerPhone: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Time Slot</label>
                <input
                  type="text"
                  value={assignForm.scheduledTime}
                  onChange={(e) => setAssignForm({ ...assignForm, scheduledTime: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPickupForAssign(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  assignPickupHandler(
                    selectedPickupForAssign.id,
                    assignForm.handlerType,
                    assignForm.handlerName,
                    assignForm.handlerPhone,
                    assignForm.scheduledTime
                  );
                  setSelectedPickupForAssign(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DOORSTEP COLLECTION */}
      {selectedPickupForDoorstep && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3]">
            <h3 className="text-base font-bold text-[#1E293B] mb-1">Confirm Doorstep Collection</h3>
            <p className="text-xs text-[#66736B] mb-3">
              Doorstep collection from <span className="font-semibold">{selectedPickupForDoorstep.senderName}</span>.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 mb-3">
              Notice: Do NOT enter weights here. Doorstep receipt records physical carton condition and sender signature only.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Actual Package Count Collected</label>
                <input
                  type="number"
                  min="1"
                  value={doorstepForm.packageCount}
                  onChange={(e) => setDoorstepForm({ ...doorstepForm, packageCount: parseInt(e.target.value) || 1 })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Visible Condition</label>
                <select
                  value={doorstepForm.visibleCondition}
                  onChange={(e) => setDoorstepForm({ ...doorstepForm, visibleCondition: e.target.value as any })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  <option value="good">Good / Pristine Box</option>
                  <option value="minor_outer_scuff">Minor Outer Scuff</option>
                  <option value="carton_damaged">Carton Damaged (Requires Repack)</option>
                  <option value="unsealed">Unsealed (Must Seal at Hub)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sender Signature Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amara Okafor"
                  value={doorstepForm.customerSignatureName}
                  onChange={(e) => setDoorstepForm({ ...doorstepForm, customerSignatureName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Handover Notes</label>
                <textarea
                  rows={2}
                  value={doorstepForm.notes}
                  onChange={(e) => setDoorstepForm({ ...doorstepForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPickupForDoorstep(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDoorstepCollection(
                    selectedPickupForDoorstep.id,
                    doorstepForm.packageCount,
                    doorstepForm.visibleCondition,
                    doorstepForm.customerSignatureName || selectedPickupForDoorstep.senderName,
                    doorstepForm.notes
                  );
                  setSelectedPickupForDoorstep(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Record Doorstep Intake
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MULTI-BOX CALIBRATED SCALE WEIGHING & DIMENSIONING */}
      {selectedPickupForWeighing && (() => {
        const activeDivisorRule =
          carrierDivisorRules.find((r) => r.id === selectedDivisorRuleId && r.isActive) ||
          carrierDivisorRules.find((r) => r.isActive) ||
          carrierDivisorRules[0];
        const previewSummary = calculateMultiPackageMeasurements({
          packages: scalePackages,
          divisorRule: activeDivisorRule,
          measuredBy: currentStaffUser?.name || 'Operations',
        });

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-xl border border-[#DCEFF3] dark:border-slate-800 my-8">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#00B4D8]" />
                  <h3 className="text-base font-bold text-[#1E293B] dark:text-white">
                    Calibrated Multi-Box Digital Scale Intake
                  </h3>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Declared: {selectedPickupForWeighing.declaredWeightKg} kg
                </span>
              </div>
              <p className="text-xs text-[#66736B] dark:text-slate-400 mb-4">
                Recording certified multi-package measurements for <span className="font-mono font-semibold text-slate-900 dark:text-white">{selectedPickupForWeighing.trackingNumber}</span>.
              </p>

              <div className="space-y-4 text-xs">
                {/* Carrier Volumetric Divisor Rule Selector */}
                <div className="p-3 rounded-lg bg-[#F7FCFD] dark:bg-slate-800 border border-[#DCEFF3] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label htmlFor="scale-divisor-select" className="block font-semibold text-slate-700 dark:text-slate-200">
                      Carrier Volumetric Divisor Rule
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Formula per box: max(actual kg, (L × W × H) / divisor)
                    </p>
                  </div>
                  <select
                    id="scale-divisor-select"
                    value={activeDivisorRule.id}
                    onChange={(e) => setSelectedDivisorRuleId(e.target.value)}
                    className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 font-semibold"
                  >
                    {carrierDivisorRules
                      .filter((r) => r.isActive)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label} (÷{r.divisor})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Multi-Box Rows */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {scalePackages.map((box, idx) => {
                    const computedBox = previewSummary.packages[idx];
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 dark:text-white">Box #{idx + 1}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                              Vol: {computedBox?.volumetricWeightKg.toFixed(2)} kg · Billable:{' '}
                              <strong className="text-[#008EA8] dark:text-[#90E0EF]">
                                {computedBox?.billableWeightKg.toFixed(2)} kg
                              </strong>
                            </span>
                            {scalePackages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setScalePackages((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-rose-600 hover:text-rose-700 inline-flex items-center gap-0.5 text-[11px] font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] text-slate-500 mb-0.5">Actual (kg)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={box.actualWeightKg}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0.1;
                                setScalePackages((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, actualWeightKg: val } : item))
                                );
                              }}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 font-mono font-bold text-[#008EA8] dark:text-[#90E0EF]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Length (cm)</label>
                            <input
                              type="number"
                              min="1"
                              value={box.lengthCm}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                setScalePackages((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, lengthCm: val } : item))
                                );
                              }}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Width (cm)</label>
                            <input
                              type="number"
                              min="1"
                              value={box.widthCm}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                setScalePackages((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, widthCm: val } : item))
                                );
                              }}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Height (cm)</label>
                            <input
                              type="number"
                              min="1"
                              value={box.heightCm}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                setScalePackages((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, heightCm: val } : item))
                                );
                              }}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 font-mono"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] text-slate-500 mb-0.5">Contents / Box Note</label>
                            <input
                              type="text"
                              value={box.description || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setScalePackages((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, description: val } : item))
                                );
                              }}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setScalePackages((prev) => [
                        ...prev,
                        {
                          description: `Box #${prev.length + 1}`,
                          actualWeightKg: 2.0,
                          lengthCm: 30,
                          widthCm: 20,
                          heightCm: 15,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00B4D8] text-[#008EA8] dark:text-[#90E0EF] font-semibold hover:bg-[#CAF0F8]/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Box
                  </button>

                  <div className="px-3 py-2 rounded-lg bg-[#CAF0F8]/70 dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 text-[#0F172A] dark:text-slate-100 font-mono text-xs tabular-nums">
                    Actual: <strong>{previewSummary.totalActualWeightKg} kg</strong> &bull; Volumetric:{' '}
                    <strong>{previewSummary.totalVolumetricWeightKg} kg</strong> &bull; Total Billable:{' '}
                    <strong className="text-[#007791] dark:text-[#90E0EF]">
                      {previewSummary.totalBillableWeightKg} kg
                    </strong>{' '}
                    (÷{previewSummary.divisorUsed})
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={weighingForm.repackagingApplied}
                      onChange={(e) => setWeighingForm({ ...weighingForm, repackagingApplied: e.target.checked })}
                      className="rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Swiftvero Export Reinforcement Applied (+₦1,500)
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Tamper Seal &amp; Intake Notes
                  </label>
                  <textarea
                    rows={2}
                    value={weighingForm.conditionNotes}
                    onChange={(e) => setWeighingForm({ ...weighingForm, conditionNotes: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPickupForWeighing(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const firstBox = scalePackages[0] || { actualWeightKg: 1, lengthCm: 30, widthCm: 20, heightCm: 15 };
                    const res = confirmFacilityArrivalAndWeigh(
                      selectedPickupForWeighing.id,
                      previewSummary.totalActualWeightKg,
                      {
                        length: firstBox.lengthCm,
                        width: firstBox.widthCm,
                        height: firstBox.heightCm,
                      },
                      weighingForm.repackagingApplied,
                      weighingForm.conditionNotes,
                      {
                        packages: scalePackages,
                        divisorRuleId: activeDivisorRule.id,
                      }
                    );
                    setOpsFeedback(res.message);
                    setSelectedPickupForWeighing(null);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
                >
                  Save Certified Weight &amp; Generate Quote
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 4: CREATE LINEHAUL MANIFEST */}
      {showHandoverModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3]">
            <h3 className="text-base font-bold text-[#1E293B] mb-1">Dispatch Inter-Branch Transfer List</h3>
            <p className="text-xs text-[#66736B] mb-4">
              Consolidate verified packages for inter-hub transfer with dual sign-off.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Origin Facility</label>
                <input
                  type="text"
                  value={handoverForm.originFacilityName}
                  onChange={(e) => setHandoverForm({ ...handoverForm, originFacilityName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Destination Facility</label>
                <input
                  type="text"
                  value={handoverForm.destinationFacilityName}
                  onChange={(e) => setHandoverForm({ ...handoverForm, destinationFacilityName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={handoverForm.driverName}
                    onChange={(e) => setHandoverForm({ ...handoverForm, driverName: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Vehicle Reg</label>
                  <input
                    type="text"
                    value={handoverForm.vehicleReg}
                    onChange={(e) => setHandoverForm({ ...handoverForm, vehicleReg: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Package Count</label>
                <input
                  type="number"
                  value={handoverForm.packageCount}
                  onChange={(e) => setHandoverForm({ ...handoverForm, packageCount: parseInt(e.target.value) || 1 })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowHandoverModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  createOperationalHandover({
                    originFacilityName: handoverForm.originFacilityName,
                    destinationFacilityName: handoverForm.destinationFacilityName,
                    driverName: handoverForm.driverName,
                    driverPhone: handoverForm.driverPhone,
                    vehicleReg: handoverForm.vehicleReg,
                    packageCount: handoverForm.packageCount,
                    dispatcherStaffName: handoverForm.dispatcherStaffName,
                    notes: handoverForm.notes,
                  });
                  setShowHandoverModal(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Sign & Dispatch Transfer List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: RESOLVE CLARIFICATION */}
      {selectedClarification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3]">
            <h3 className="text-base font-bold text-[#1E293B] mb-1">Resolve Clarification</h3>
            <p className="text-xs text-[#66736B] mb-3">
              Shipment <span className="font-semibold">{selectedClarification.trackingNumber}</span> &bull; {selectedClarification.description}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Resolution Details & Sender Outcome</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sender called and confirmed new gate code. Address updated."
                  value={clarificationResolutionNote}
                  onChange={(e) => setClarificationResolutionNote(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedClarification(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resolveClarification(
                    selectedClarification.id,
                    clarificationResolutionNote || 'Resolved following sender contact.'
                  );
                  setSelectedClarification(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: REWEIGH & ISSUE REVISED QUOTE VERSION */}
      {reweighTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3] dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1E293B] dark:text-white">
                Reweigh &amp; Issue Revised Quote
              </h3>
              <p className="text-xs text-[#66736B] dark:text-slate-400">
                Shipment <span className="font-mono font-semibold">{reweighTarget.trackingNumber}</span> · Declared: {reweighTarget.declaredWeightKg} kg, Current Facility: {reweighTarget.currentWeightKg} kg
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  New Verified Scale Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={reweighForm.measuredWeightKg}
                  onChange={(e) =>
                    setReweighForm({ ...reweighForm, measuredWeightKg: parseFloat(e.target.value) || 0.5 })
                  }
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Length (cm)</label>
                  <input
                    type="number"
                    value={reweighForm.length}
                    onChange={(e) => setReweighForm({ ...reweighForm, length: parseFloat(e.target.value) || 10 })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={reweighForm.width}
                    onChange={(e) => setReweighForm({ ...reweighForm, width: parseFloat(e.target.value) || 10 })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={reweighForm.height}
                    onChange={(e) => setReweighForm({ ...reweighForm, height: parseFloat(e.target.value) || 10 })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Audit Note &amp; Reason for Revision
                </label>
                <textarea
                  rows={2}
                  value={reweighForm.reason}
                  onChange={(e) => setReweighForm({ ...reweighForm, reason: e.target.value })}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReweighTarget(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = issueRevisedQuoteVersion({
                    shipmentId: reweighTarget.shipmentId,
                    measuredWeightKg: reweighForm.measuredWeightKg,
                    measuredDimensions: {
                      length: reweighForm.length,
                      width: reweighForm.width,
                      height: reweighForm.height,
                    },
                    reason: reweighForm.reason,
                    changedBy: currentStaffUser?.name,
                  });
                  setOpsFeedback(res.message);
                  setReweighTarget(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Issue Revised Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: UPHOLD VERIFIED MEASUREMENT */}
      {upholdTargetId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3] dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-[#1E293B] dark:text-white">
              Uphold Verified Facility Measurement
            </h3>
            <div className="text-xs">
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Inspection Verification Note
              </label>
              <textarea
                rows={3}
                value={upholdNote}
                onChange={(e) => setUpholdNote(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUpholdTargetId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = resolveMeasurementReviewUphold(upholdTargetId, upholdNote);
                  setOpsFeedback(res.message);
                  setUpholdTargetId(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Confirm &amp; Uphold
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 8: CONFIRM PHYSICAL ARRIVAL AT FACILITY */}
      {selectedPickupForReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3] dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-cyan-700 dark:text-[#00B4D8]" />
                Confirm Facility Physical Arrival
              </h3>
              <p className="text-xs text-[#66736B] dark:text-slate-400">
                Verify physical package count and condition at hub check-in for{' '}
                <span className="font-mono font-semibold">{selectedPickupForReceipt.trackingNumber}</span> before weighing.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Package Count Received
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={receiptForm.packageCountReceived}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        packageCountReceived: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Visible Condition
                  </label>
                  <select
                    value={receiptForm.visibleCondition}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        visibleCondition: e.target.value as any,
                      }))
                    }
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
                  >
                    <option value="good">Good / Intact Carton</option>
                    <option value="minor_scuff">Minor Outer Scuff</option>
                    <option value="carton_damaged">Carton Damaged</option>
                    <option value="unsealed">Unsealed / Needs Sealing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Package Description Confirmation
                </label>
                <input
                  type="text"
                  value={receiptForm.packageDescription}
                  onChange={(e) => setReceiptForm((prev) => ({ ...prev, packageDescription: e.target.value }))}
                  placeholder="e.g. Sealed export cartons containing dried foodstuff"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Discrepancies / Intake Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={receiptForm.discrepancies}
                  onChange={(e) => setReceiptForm((prev) => ({ ...prev, discrepancies: e.target.value }))}
                  placeholder="Note any missing tape, damp corners, or count variance..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPickupForReceipt(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = confirmFacilityReceipt({
                    jobId: selectedPickupForReceipt.id,
                    packageCountReceived: receiptForm.packageCountReceived,
                    visibleCondition: receiptForm.visibleCondition,
                    packageDescription: receiptForm.packageDescription || 'Export package received at hub',
                    discrepancies: receiptForm.discrepancies,
                  });
                  setOpsFeedback(res.message);
                  setSelectedPickupForReceipt(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-cyan-700 text-white hover:bg-cyan-800"
              >
                Confirm Facility Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: MARK PICKUP FAILED */}
      {selectedPickupForFail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3] dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                Mark Pickup Attempt Failed
              </h3>
              <p className="text-xs text-[#66736B] dark:text-slate-400">
                Log failure reason for <span className="font-mono font-semibold">{selectedPickupForFail.pickupReference}</span>. Customer will be notified to reschedule.
              </p>
            </div>
            <div className="text-xs">
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Failure Reason (Required)
              </label>
              <textarea
                rows={3}
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                placeholder="e.g. Sender phone unreachable at gate; estate security denied entry."
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPickupForFail(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = markPickupFailed(selectedPickupForFail.id, failReason);
                  setOpsFeedback(res.message);
                  if (res.success) setSelectedPickupForFail(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Pickup Failed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: RESCHEDULE PICKUP */}
      {selectedPickupForReschedule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3] dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#00B4D8]" />
                Reschedule Doorstep Pickup
              </h3>
              <p className="text-xs text-[#66736B] dark:text-slate-400">
                Assign new collection window for <span className="font-mono font-semibold">{selectedPickupForReschedule.pickupReference}</span>.
              </p>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">New Date</label>
                  <input
                    type="date"
                    value={rescheduleForm.newDate}
                    onChange={(e) => setRescheduleForm((prev) => ({ ...prev, newDate: e.target.value }))}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Time Window</label>
                  <select
                    value={rescheduleForm.newTimeSlot}
                    onChange={(e) => setRescheduleForm((prev) => ({ ...prev, newTimeSlot: e.target.value }))}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
                  >
                    <option value="10:00 AM - 2:00 PM">10:00 AM - 2:00 PM</option>
                    <option value="2:00 PM - 6:00 PM">2:00 PM - 6:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Reschedule Reason</label>
                <input
                  type="text"
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Sender requested next-morning window."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2.5 py-1.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPickupForReschedule(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = reschedulePickup(
                    selectedPickupForReschedule.id,
                    rescheduleForm.newDate,
                    rescheduleForm.newTimeSlot,
                    rescheduleForm.reason || 'Rescheduled by Operations'
                  );
                  setOpsFeedback(res.message);
                  setSelectedPickupForReschedule(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 11: PICKUP QR CODE */}
      {selectedQrJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-[#DCEFF3] dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E293B] dark:text-white">Pickup Intake QR Pass</h3>
              <button
                type="button"
                onClick={() => setSelectedQrJob(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="flex justify-center">
              <ReferenceQrBadge
                value={selectedQrJob.trackingNumber}
                label={`${selectedQrJob.pickupReference} · ${selectedQrJob.senderName} (${selectedQrJob.scheduledDate})`}
                size={128}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
