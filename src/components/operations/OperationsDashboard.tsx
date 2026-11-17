import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plane,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Zap,
  ArrowRight,
  ShieldAlert,
  Building2,
  RefreshCw,
  FileText,
  MapPin,
  Calendar,
  UserCheck,
  Scale,
  Phone,
  Camera,
  ExternalLink,
  ChevronRight,
  UserPlus,
  XCircle,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { PickupJob, ShipmentRecord } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';
import { DhlCarrierManagementView } from './DhlCarrierManagementView';

export const OperationsDashboard: React.FC = () => {
  const {
    currentStaffUser,
    shipments,
    pickupJobs,
    assignPickupHandler,
    confirmDoorstepCollection,
    confirmFacilityArrivalAndWeigh,
    reschedulePickup,
    cancelPickup,
    triggerOverdueAlert,
    resolveOverdueAlert,
    updateShipmentStatus,
  } = useDemo();

  // Primary Tab State
  const [activeTab, setActiveTab] = useState<'pickups' | 'flights' | 'overdue_sla' | 'branches' | 'dhl_carrier'>('pickups');

  // Pickup Tab Filters & State
  const [pickupSearchQuery, setPickupSearchQuery] = useState('');
  const [pickupStatusFilter, setPickupStatusFilter] = useState<string>('all');
  const [pickupSlaFilter, setPickupSlaFilter] = useState<'all' | 'approaching' | 'overdue'>('all');
  const [calendarView, setCalendarView] = useState<'list' | 'calendar'>('list');
  const [calendarGranularity, setCalendarGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Modal States
  const [assignModalJob, setAssignModalJob] = useState<PickupJob | null>(null);
  const [doorstepModalJob, setDoorstepModalJob] = useState<PickupJob | null>(null);
  const [weighingModalJob, setWeighingModalJob] = useState<PickupJob | null>(null);
  const [rescheduleModalJob, setRescheduleModalJob] = useState<PickupJob | null>(null);
  const [selectedPickupDetail, setSelectedPickupDetail] = useState<PickupJob | null>(null);

  // Form states for modals
  const [assignHandlerType, setAssignHandlerType] = useState<'staff' | 'external_partner' | 'manual'>('staff');
  const [assignHandlerName, setAssignHandlerName] = useState('');
  const [assignHandlerPhone, setAssignHandlerPhone] = useState('');
  const [assignScheduledTime, setAssignScheduledTime] = useState('11:00 AM');
  const [assignNotes, setAssignNotes] = useState('');

  // Doorstep Collection Form (STRICTLY NO WEIGHT)
  const [doorstepPackageCount, setDoorstepPackageCount] = useState<number>(1);
  const [doorstepCondition, setDoorstepCondition] = useState<'good' | 'minor_outer_scuff' | 'carton_damaged' | 'unsealed'>('good');
  const [doorstepSignatureName, setDoorstepSignatureName] = useState('');
  const [doorstepNotes, setDoorstepNotes] = useState('');

  // Facility Digital Scale Intake Form
  const [scaleActualWeightKg, setScaleActualWeightKg] = useState<number>(5.5);
  const [scaleLengthCm, setScaleLengthCm] = useState<number>(30);
  const [scaleWidthCm, setScaleWidthCm] = useState<number>(25);
  const [scaleHeightCm, setScaleHeightCm] = useState<number>(20);
  const [scaleRepackaging, setScaleRepackaging] = useState<boolean>(true);
  const [scaleNotes, setScaleNotes] = useState('');

  // Reschedule Form
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('Morning (09:00 - 13:00)');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Flights Tab State
  const [flightFilter, setFlightFilter] = useState<'all' | 'priority' | 'exceptions' | 'hub_queue'>('all');
  const [flightSearchQuery, setFlightSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [carrierFlightRef, setCarrierFlightRef] = useState('BA-074 (LHR - Heathrow)');

  // Helper to compute deadline stats
  const now = new Date();

  // Metrics computation for 8 counters
  const metrics = useMemo(() => {
    let newRequests = 0;
    let awaitingAssignment = 0;
    let scheduledToday = 0;
    let approachingDeadline = 0;
    let overdue = 0;
    let inProgress = 0;
    let collectedInTransit = 0;
    let failedOrRescheduled = 0;

    pickupJobs.forEach((job) => {
      if (job.status === 'requested') newRequests++;
      if (job.status === 'requested' || (!job.collectionHandlerName && job.status !== 'cancelled')) awaitingAssignment++;
      if (job.status === 'scheduled') scheduledToday++;
      if (job.status === 'in_progress') inProgress++;
      if (job.status === 'collected_in_transit' || job.status === 'facility_received') collectedInTransit++;
      if (job.status === 'failed' || job.status === 'rescheduled') failedOrRescheduled++;

      if (job.collectionDeadline && !['completed', 'facility_received', 'cancelled'].includes(job.status)) {
        const deadline = new Date(job.collectionDeadline).getTime();
        const diffHours = (deadline - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < 0) {
          overdue++;
        } else if (diffHours <= 6) {
          approachingDeadline++;
        }
      }
    });

    return {
      newRequests,
      awaitingAssignment,
      scheduledToday,
      approachingDeadline,
      overdue,
      inProgress,
      collectedInTransit,
      failedOrRescheduled,
    };
  }, [pickupJobs, now]);

  // Filtered Pickups
  const filteredPickups = useMemo(() => {
    return pickupJobs.filter((job) => {
      const q = pickupSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        job.pickupReference.toLowerCase().includes(q) ||
        job.trackingNumber.toLowerCase().includes(q) ||
        (job.customerName || job.senderName || '').toLowerCase().includes(q) ||
        (job.customerPhone || job.senderPhone || '').includes(q) ||
        (job.pickupAddress || job.senderAddress || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status filter
      if (pickupStatusFilter !== 'all') {
        if (pickupStatusFilter === 'pending' && job.status !== 'requested' && job.status !== 'assigned') return false;
        if (pickupStatusFilter === 'scheduled' && job.status !== 'scheduled') return false;
        if (pickupStatusFilter === 'in_progress' && job.status !== 'in_progress') return false;
        if (pickupStatusFilter === 'collected' && job.status !== 'collected_in_transit' && job.status !== 'facility_received') return false;
        if (pickupStatusFilter === 'completed' && job.status !== 'completed') return false;
        if (pickupStatusFilter === 'failed_rescheduled' && job.status !== 'failed' && job.status !== 'rescheduled') return false;
      }

      // SLA filter
      if (pickupSlaFilter === 'approaching') {
        if (!job.collectionDeadline || ['completed', 'cancelled'].includes(job.status)) return false;
        const diffHours = (new Date(job.collectionDeadline).getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < 0 || diffHours > 6) return false;
      } else if (pickupSlaFilter === 'overdue') {
        if (!job.collectionDeadline || ['completed', 'cancelled'].includes(job.status)) return false;
        const diffHours = (new Date(job.collectionDeadline).getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours >= 0) return false;
      }

      return true;
    });
  }, [pickupJobs, pickupSearchQuery, pickupStatusFilter, pickupSlaFilter, now]);

  // Calculate live volumetric and chargeable weight for Facility Intake Modal
  const calculatedVolumetricKg = useMemo(() => {
    return Math.round(((scaleLengthCm * scaleWidthCm * scaleHeightCm) / 5000) * 100) / 100;
  }, [scaleLengthCm, scaleWidthCm, scaleHeightCm]);

  const calculatedChargeableKg = useMemo(() => {
    return Math.max(scaleActualWeightKg, calculatedVolumetricKg);
  }, [scaleActualWeightKg, calculatedVolumetricKg]);

  // Handler Assignment submit
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalJob) return;

    assignPickupHandler(
      assignModalJob.id,
      assignHandlerType,
      assignHandlerName || (assignHandlerType === 'staff' ? 'Ibrahim Suleiman' : 'GIG Logistics'),
      assignHandlerPhone || '0802-345-6789',
      assignScheduledTime,
      assignNotes
    );

    setAssignModalJob(null);
    setAssignHandlerName('');
    setAssignHandlerPhone('');
    setAssignNotes('');
  };

  // Doorstep Collection submit
  const handleDoorstepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doorstepModalJob) return;

    confirmDoorstepCollection(
      doorstepModalJob.id,
      doorstepPackageCount,
      doorstepCondition,
      doorstepSignatureName || doorstepModalJob.customerName || doorstepModalJob.senderName || 'Authorized Signatory',
      doorstepNotes,
      ['/assets/aistudio/IMG_1993_5e79565e.jpeg']
    );

    setDoorstepModalJob(null);
    setDoorstepSignatureName('');
    setDoorstepNotes('');
  };

  // Facility Digital Scale Weighing submit
  const handleFacilityWeighSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weighingModalJob) return;

    confirmFacilityArrivalAndWeigh(
      weighingModalJob.id,
      scaleActualWeightKg,
      { length: scaleLengthCm, width: scaleWidthCm, height: scaleHeightCm },
      scaleRepackaging,
      scaleNotes || 'Verified on calibrated electronic floor scale. Reinforced with tamper-evident export film.'
    );

    setWeighingModalJob(null);
    setScaleNotes('');
  };

  // Reschedule submit
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalJob) return;

    reschedulePickup(
      rescheduleModalJob.id,
      rescheduleDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      rescheduleTimeSlot,
      rescheduleReason || 'Customer requested later window due to business meeting'
    );

    setRescheduleModalJob(null);
    setRescheduleDate('');
    setRescheduleReason('');
  };

  // Flights / Carrier Queue
  const operationalShipments = shipments.filter((s) => {
    const q = flightSearchQuery.toLowerCase().trim();
    const matches =
      !q ||
      s.trackingNumber.toLowerCase().includes(q) ||
      s.recipientName.toLowerCase().includes(q) ||
      s.destinationCountry.toLowerCase().includes(q);

    if (!matches) return false;

    if (flightFilter === 'priority') return s.selectedTier === 'priority';
    if (flightFilter === 'exceptions') return s.isUpdateOverdue;
    if (flightFilter === 'hub_queue') return s.status === 'pickup_completed' || s.status === 'booked';
    return true;
  });

  const priorityCount = shipments.filter((s) => s.selectedTier === 'priority').length;
  const overdueCount = shipments.filter((s) => s.isUpdateOverdue).length;

  const handleDispatchToCarrier = (shipmentId: string) => {
    updateShipmentStatus(shipmentId, {
      status: 'in_transit',
      lastUpdateTimestamp: new Date().toISOString(),
      trackingEvents: [
        ...(shipments.find((s) => s.id === shipmentId)?.trackingEvents || []),
        {
          id: `evt_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          stage: 'Dispatched on Carrier International Flight',
          location: 'MMIA International Cargo Terminal, Lagos',
          description: `Consignment lodged into international flight ${carrierFlightRef} with pre-cleared customs export manifest.`,
        },
      ],
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Control Console */}
      <div className="bg-white border border-[#DCECF0] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-xl border border-[#90E0EF]">
            <Truck className="w-6 h-6 text-[#00B4D8]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#263B45]">Swiftvero Central Operations Command</h1>
              <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF] px-2.5 py-0.5 rounded-full">
                24H COLLECTION SLA ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#657A84] mt-0.5">
              Operations Lead: <span className="font-semibold text-[#263B45]">{currentStaffUser?.name || 'Kemi Adeleke'}</span> · Ikeja Sorting &amp; Airport Cargo Hub
            </p>
          </div>
        </div>

        {/* Operational Guarantee Badge */}
        <div className="p-2.5 bg-[#F7FCFD] border border-[#DCECF0] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-200">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#263B45]">24-Hour Pickup Guarantee</div>
            <div className="text-[10px] text-[#657A84]">Doorstep inspection &amp; certified facility weighing</div>
          </div>
        </div>
      </div>

      {/* Main Operations Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DCECF0] pb-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('pickups')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'pickups'
              ? 'bg-[#00B4D8] text-white shadow-xs'
              : 'text-[#657A84] hover:bg-[#EFF8FA] hover:text-[#263B45]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Pickup Management</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTab === 'pickups' ? 'bg-white/20 text-white' : 'bg-[#CAF0F8] text-[#008EA8]'
          }`}>
            {pickupJobs.length}
          </span>
          {metrics.overdue > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flights')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'flights'
              ? 'bg-[#00B4D8] text-white shadow-xs'
              : 'text-[#657A84] hover:bg-[#EFF8FA] hover:text-[#263B45]'
          }`}
        >
          <Plane className="w-4 h-4" />
          <span>Airport Hub &amp; Flight Dispatch</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#EFF8FA] text-[#657A84]">
            {shipments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overdue_sla')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'overdue_sla'
              ? 'bg-[#00B4D8] text-white shadow-xs'
              : 'text-[#657A84] hover:bg-[#EFF8FA] hover:text-[#263B45]'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Proactive Tracking &amp; Overdue SLAs</span>
          {overdueCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800">
              {overdueCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dhl_carrier')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'dhl_carrier'
              ? 'bg-[#00B4D8] text-white shadow-xs'
              : 'text-[#657A84] hover:bg-[#EFF8FA] hover:text-[#263B45]'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#00B4D8]" />
          <span>DHL Carrier Integration</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PICKUP MANAGEMENT (CENTRALIZED COMMAND)                            */}
      {/* ========================================================================= */}
      {activeTab === 'pickups' && (
        <div className="space-y-6">
          {/* Key Operational Distinction Notice */}
          <div className="bg-[#CAF0F8]/30 border border-[#90E0EF] rounded-2xl p-4 text-xs text-[#263B45] flex items-start gap-3">
            <Scale className="w-5 h-5 text-[#008EA8] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#008EA8]">Doorstep vs. Facility Intake Standard: </span>
              Collection handlers do <span className="font-bold underline">not carry weighing scales</span> to customer premises. Handlers verify package count, examine outer physical condition, take photos, and obtain customer sign-off. Precision weighing and dimension verification are conducted <span className="font-bold">exclusively upon arrival at the Swiftvero Hub</span> on calibrated digital scales to generate the final itemized quotation.
            </div>
          </div>

          {/* 8 Operational Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              {
                label: 'New Requests',
                value: metrics.newRequests,
                sub: 'Unassigned',
                color: 'text-[#263B45]',
                bg: 'bg-white',
                border: 'border-[#DCECF0]',
                onClick: () => { setPickupStatusFilter('pending'); setPickupSlaFilter('all'); },
              },
              {
                label: 'Awaiting Handler',
                value: metrics.awaitingAssignment,
                sub: 'Dispatch pending',
                color: 'text-amber-700',
                bg: 'bg-amber-50/50',
                border: 'border-amber-200',
                onClick: () => { setPickupStatusFilter('pending'); setPickupSlaFilter('all'); },
              },
              {
                label: 'Scheduled Today',
                value: metrics.scheduledToday,
                sub: 'Handler allocated',
                color: 'text-[#008EA8]',
                bg: 'bg-[#CAF0F8]/20',
                border: 'border-[#90E0EF]',
                onClick: () => { setPickupStatusFilter('scheduled'); setPickupSlaFilter('all'); },
              },
              {
                label: 'Deadline <6h',
                value: metrics.approachingDeadline,
                sub: 'Urgent SLA',
                color: 'text-orange-700',
                bg: 'bg-orange-50',
                border: 'border-orange-200',
                onClick: () => { setPickupSlaFilter('approaching'); setPickupStatusFilter('all'); },
              },
              {
                label: 'Overdue (>24h)',
                value: metrics.overdue,
                sub: 'SLA Breached',
                color: 'text-red-700',
                bg: 'bg-red-50',
                border: 'border-red-200',
                onClick: () => { setPickupSlaFilter('overdue'); setPickupStatusFilter('all'); },
              },
              {
                label: 'In Progress',
                value: metrics.inProgress,
                sub: 'Handler en route',
                color: 'text-blue-700',
                bg: 'bg-blue-50/50',
                border: 'border-blue-200',
                onClick: () => { setPickupStatusFilter('in_progress'); setPickupSlaFilter('all'); },
              },
              {
                label: 'In Transit to Hub',
                value: metrics.collectedInTransit,
                sub: 'Awaiting scale',
                color: 'text-teal-700',
                bg: 'bg-teal-50/50',
                border: 'border-teal-200',
                onClick: () => { setPickupStatusFilter('collected'); setPickupSlaFilter('all'); },
              },
              {
                label: 'Rescheduled/Fail',
                value: metrics.failedOrRescheduled,
                sub: 'Follow-up required',
                color: 'text-gray-700',
                bg: 'bg-gray-50',
                border: 'border-gray-200',
                onClick: () => { setPickupStatusFilter('failed_rescheduled'); setPickupSlaFilter('all'); },
              },
            ].map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={m.onClick}
                className={`p-3 rounded-xl border text-left transition-all hover:shadow-xs ${m.bg} ${m.border}`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#657A84] truncate">
                  {m.label}
                </div>
                <div className={`text-xl font-black font-mono mt-1 ${m.color}`}>
                  {m.value}
                </div>
                <div className="text-[10px] text-[#657A84] mt-0.5 truncate">{m.sub}</div>
              </button>
            ))}
          </div>

          {/* Search, Filter Bar and View Mode Toggle */}
          <div className="bg-white border border-[#DCECF0] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#657A84] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickupSearchQuery}
                  onChange={(e) => setPickupSearchQuery(e.target.value)}
                  placeholder="Search by customer, phone, tracking #, pickup ref, or Lagos address..."
                  className="w-full pl-9 pr-4 py-2 border border-[#DCECF0] rounded-xl text-xs bg-[#F7FCFD] focus:bg-white focus:outline-none focus:border-[#00B4D8]"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <select
                  value={pickupStatusFilter}
                  onChange={(e) => setPickupStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD] text-[#263B45] font-semibold text-xs"
                >
                  <option value="all">All Statuses ({pickupJobs.length})</option>
                  <option value="pending">Pending / New</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">Collection In Progress</option>
                  <option value="collected">Collected / In Transit to Hub</option>
                  <option value="completed">Completed / Final Quote Approved</option>
                  <option value="failed_rescheduled">Failed / Rescheduled</option>
                </select>

                {/* SLA Filter */}
                <select
                  value={pickupSlaFilter}
                  onChange={(e) => setPickupSlaFilter(e.target.value as any)}
                  className="px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD] text-[#263B45] font-semibold text-xs"
                >
                  <option value="all">All SLAs</option>
                  <option value="approaching">Approaching 24h Deadline (&lt;6h)</option>
                  <option value="overdue">Overdue (&gt;24h Deadline)</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex border border-[#DCECF0] rounded-xl p-0.5 bg-[#F7FCFD]">
                  <button
                    type="button"
                    onClick={() => setCalendarView('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      calendarView === 'list' ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#657A84]'
                    }`}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarView('calendar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      calendarView === 'calendar' ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#657A84]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Calendar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* LIST VIEW                                                             */}
          {/* ===================================================================== */}
          {calendarView === 'list' && (
            <div className="space-y-3">
              {filteredPickups.length === 0 ? (
                <div className="bg-white border border-[#DCECF0] rounded-2xl p-10 text-center space-y-2">
                  <Truck className="w-8 h-8 text-[#657A84] mx-auto opacity-40" />
                  <div className="text-sm font-bold text-[#263B45]">No pickup requests match this filter</div>
                  <p className="text-xs text-[#657A84]">Try clearing your search query or selecting a different status filter.</p>
                  <button
                    type="button"
                    onClick={() => { setPickupSearchQuery(''); setPickupStatusFilter('all'); setPickupSlaFilter('all'); }}
                    className="px-4 py-2 bg-[#00B4D8] text-white rounded-xl text-xs font-semibold mt-2"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredPickups.map((job) => {
                  // Compute deadline countdown
                  let deadlineBadge = null;
                  if (job.collectionDeadline && !['completed', 'facility_received', 'cancelled'].includes(job.status)) {
                    const diffMs = new Date(job.collectionDeadline).getTime() - now.getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                    if (diffMs < 0) {
                      deadlineBadge = (
                        <span className="text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>OVERDUE by {Math.abs(diffHours)}h {Math.abs(diffMins)}m</span>
                        </span>
                      );
                    } else if (diffHours <= 6) {
                      deadlineBadge = (
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-600" />
                          <span>{diffHours}h {diffMins}m remaining</span>
                        </span>
                      );
                    } else {
                      deadlineBadge = (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{diffHours}h left (within 24h)</span>
                        </span>
                      );
                    }
                  }

                  return (
                    <div
                      key={job.id}
                      className="bg-white border border-[#DCECF0] rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[#90E0EF] transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm text-[#263B45]">{job.pickupReference}</span>
                            <span className="text-xs font-mono text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded border border-[#90E0EF]">
                              {job.trackingNumber}
                            </span>
                            {deadlineBadge}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              job.status === 'facility_received' || job.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : job.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : job.status === 'collected_in_transit'
                                ? 'bg-teal-100 text-teal-800'
                                : job.status === 'scheduled'
                                ? 'bg-cyan-100 text-cyan-800'
                                : job.status === 'rescheduled' || job.status === 'failed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="text-xs text-[#263B45] font-semibold flex items-center gap-2 pt-0.5">
                            <span>{job.customerName}</span>
                            <span className="text-[#657A84]">·</span>
                            <span className="text-[#657A84] flex items-center gap-1 font-normal">
                              <Phone className="w-3 h-3" />
                              {job.customerPhone}
                            </span>
                          </div>

                          <div className="text-xs text-[#657A84] flex items-start gap-1.5 pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#00B4D8] shrink-0 mt-0.5" />
                            <span>{job.pickupAddress}</span>
                          </div>
                        </div>

                        {/* Package Count and Est Weight */}
                        <div className="text-right sm:shrink-0 bg-[#F7FCFD] border border-[#DCECF0] rounded-xl p-2.5 space-y-0.5">
                          <div className="text-xs font-bold text-[#263B45]">
                            {job.packageCount || 1} Package{(job.packageCount || 1) > 1 ? 's' : ''}
                          </div>
                          <div className="text-[11px] text-[#657A84]">
                            Est: ~{job.estimatedWeightKg || 5} kg (Declared)
                          </div>
                          {job.facilityActualWeightKg && (
                            <div className="text-[11px] font-mono font-bold text-[#008EA8]">
                              Scale: {job.facilityActualWeightKg} kg (Certified)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Collection Handler & Timeline Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#F7FCFD] border border-[#DCECF0] rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#657A84] block">Collection Handler</span>
                          {job.collectionHandlerName ? (
                            <div className="font-semibold text-[#263B45] mt-0.5 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-[#00B4D8]" />
                              <span>{job.collectionHandlerName}</span>
                              <span className="text-[10px] text-[#657A84]">({job.collectionHandlerType})</span>
                            </div>
                          ) : (
                            <span className="text-amber-700 font-semibold mt-0.5 block">Not Assigned Yet</span>
                          )}
                          {job.collectionHandlerPhone && (
                            <span className="text-[11px] text-[#657A84] block">{job.collectionHandlerPhone}</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#657A84] block">24h SLA Window</span>
                          <span className="text-[#263B45] font-semibold mt-0.5 block">
                            Confirmed: {job.bookingConfirmedAt ? new Date(job.bookingConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                          </span>
                          <span className="text-[11px] text-[#657A84] block">
                            Deadline: {job.collectionDeadline ? `${new Date(job.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${new Date(job.collectionDeadline).toLocaleDateString([], { month: 'short', day: 'numeric' })})` : 'Within 24 Hours'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#657A84] block">Facility Intake &amp; Weighing</span>
                          {job.facilityActualWeightKg ? (
                            <div className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Weighed: {job.facilityChargeableWeightKg || job.facilityActualWeightKg} kg chg</span>
                            </div>
                          ) : job.doorstepCollection ? (
                            <span className="text-blue-700 font-semibold mt-0.5 block">
                              Doorstep collected · In transit to Hub
                            </span>
                          ) : (
                            <span className="text-[#657A84] mt-0.5 block">Awaiting collection</span>
                          )}
                        </div>
                      </div>

                      {/* Operational Action Buttons */}
                      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[#DCECF0]">
                        <div className="text-xs text-[#657A84]">
                          {(job.specialInstructions || job.specialHandlingNotes) && (
                            <span className="italic">"{job.specialInstructions || job.specialHandlingNotes}"</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Assign Handler Button */}
                          {(!job.collectionHandlerName || job.status === 'requested') && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalJob(job);
                                setAssignHandlerName('Ibrahim Suleiman');
                                setAssignHandlerPhone('0802-345-6789');
                              }}
                              className="px-3 py-1.5 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Assign Collection Handler</span>
                            </button>
                          )}

                          {/* Doorstep Collection Button (Only if scheduled or in_progress, and doorstep not yet confirmed) */}
                          {(job.status === 'scheduled' || job.status === 'in_progress') && !job.doorstepCollection && (
                            <button
                              type="button"
                              onClick={() => {
                                setDoorstepModalJob(job);
                                setDoorstepPackageCount(job.packageCount || 1);
                                setDoorstepSignatureName(job.customerName || job.senderName);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Doorstep Handover (No Weight)</span>
                            </button>
                          )}

                          {/* Facility Arrival & Weighing Button (After doorstep collection or in transit) */}
                          {(job.status === 'collected_in_transit' || job.doorstepCollection) && !job.facilityActualWeightKg && (
                            <button
                              type="button"
                              onClick={() => {
                                setWeighingModalJob(job);
                                setScaleActualWeightKg(job.estimatedWeightKg || job.declaredWeightKg || 5.0);
                              }}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>Facility Arrival &amp; Calibrated Scale Weighing</span>
                            </button>
                          )}

                          {/* Reschedule Button */}
                          {!['completed', 'cancelled', 'facility_received'].includes(job.status) && (
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleModalJob(job);
                                setRescheduleDate(job.preferredDate || job.scheduledDate);
                              }}
                              className="px-3 py-1.5 bg-[#F7FCFD] hover:bg-gray-100 text-[#263B45] border border-[#DCECF0] rounded-xl text-xs font-semibold transition-colors"
                            >
                              Reschedule / Cancel
                            </button>
                          )}

                          {/* View Audit Details */}
                          <button
                            type="button"
                            onClick={() => setSelectedPickupDetail(job)}
                            className="px-3 py-1.5 bg-[#EFF8FA] text-[#008EA8] hover:bg-[#CAF0F8] rounded-xl text-xs font-bold transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* CALENDAR VIEW (DAILY / WEEKLY / MONTHLY)                              */}
          {/* ===================================================================== */}
          {calendarView === 'calendar' && (
            <div className="bg-white border border-[#DCECF0] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#263B45]">Pickup Schedule &amp; 24h SLA Calendar</h3>
                  <p className="text-xs text-[#657A84]">Visualize collection handler allocations and deadline distribution</p>
                </div>

                <div className="flex border border-[#DCECF0] rounded-xl p-0.5 bg-[#F7FCFD] text-xs">
                  {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setCalendarGranularity(view)}
                      className={`px-3 py-1 rounded-lg font-semibold capitalize ${
                        calendarGranularity === view ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#657A84]'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar Grid Representation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Today */}
                <div className="border border-[#DCECF0] rounded-xl p-4 bg-[#F7FCFD] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DCECF0]">
                    <span className="font-bold text-xs text-[#263B45]">Today (Current 24h SLA)</span>
                    <span className="text-[10px] font-bold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-full">
                      {pickupJobs.length} consignments
                    </span>
                  </div>

                  <div className="space-y-2">
                    {pickupJobs.slice(0, 4).map((p) => (
                      <div key={p.id} className="p-2.5 bg-white border border-[#DCECF0] rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-[#263B45]">{p.pickupReference}</span>
                          <span className="text-[10px] font-bold text-[#00B4D8]">{p.packageCount} pkgs</span>
                        </div>
                        <div className="text-[11px] text-[#657A84] truncate">{p.customerName || p.senderName} · {p.pickupAddress || p.senderAddress}</div>
                        <div className="text-[10px] text-[#008EA8]">Handler: {p.collectionHandlerName || 'Unassigned'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tomorrow */}
                <div className="border border-[#DCECF0] rounded-xl p-4 bg-[#F7FCFD] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DCECF0]">
                    <span className="font-bold text-xs text-[#263B45]">Tomorrow</span>
                    <span className="text-[10px] font-bold text-[#657A84] bg-gray-100 px-2 py-0.5 rounded-full">
                      2 consignments
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-dashed border-[#DCECF0] rounded-lg text-xs text-center text-[#657A84]">
                    Pre-booked pickups for next business cycle. Handlers will be assigned at 07:00 AM dispatch standup.
                  </div>
                </div>

                {/* Later this week */}
                <div className="border border-[#DCECF0] rounded-xl p-4 bg-[#F7FCFD] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DCECF0]">
                    <span className="font-bold text-xs text-[#263B45]">Upcoming Week</span>
                    <span className="text-[10px] font-bold text-[#657A84] bg-gray-100 px-2 py-0.5 rounded-full">
                      Fleet capacity 85%
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-[#DCECF0] rounded-lg text-xs text-[#657A84] space-y-1.5">
                    <div className="font-semibold text-[#263B45]">Fleet Dispatch Zones:</div>
                    <div className="text-[11px] flex justify-between">
                      <span>Zone 1: Ikeja, Maryland, Magodo</span>
                      <span className="font-mono font-bold text-emerald-600">Active</span>
                    </div>
                    <div className="text-[11px] flex justify-between">
                      <span>Zone 2: Lekki Phase 1, Ikoyi, VI</span>
                      <span className="font-mono font-bold text-emerald-600">Active</span>
                    </div>
                    <div className="text-[11px] flex justify-between">
                      <span>Zone 3: Yaba, Surulere, Festac</span>
                      <span className="font-mono font-bold text-emerald-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AIRPORT HUB & FLIGHT ALLOCATION                                    */}
      {/* ========================================================================= */}
      {activeTab === 'flights' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white border border-[#DCECF0] rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#657A84] block">Airport Lodging</span>
              <div className="text-xl font-black text-[#263B45] font-mono mt-1">{operationalShipments.length} Consignments</div>
              <p className="text-xs text-[#657A84] mt-0.5">MMIA cargo terminal international sort facility.</p>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Exceptions &amp; Overdue</span>
              <div className="text-xl font-black text-amber-800 font-mono mt-1">
                {overdueCount} Exception{overdueCount === 1 ? '' : 's'}
              </div>
              <p className="text-xs text-amber-700 mt-0.5">Automated detection of stalled carrier scans.</p>
            </div>

            <div className="p-4 bg-[#CAF0F8]/30 border border-[#90E0EF] rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#008EA8] block">Priority Flight Lanes</span>
              <div className="text-xl font-black text-[#008EA8] font-mono mt-1">{priorityCount} Priority Parcels</div>
              <p className="text-xs text-[#657A84] mt-0.5">Expedited tarmac loading window (2–4 business days).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Queue */}
            <div className="lg:col-span-2 bg-white border border-[#DCECF0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#263B45]">Flight Allocation Queue</h3>
                  <p className="text-xs text-[#657A84]">Assign verified consignments to authorized international carriers</p>
                </div>

                <div className="flex border border-[#DCECF0] rounded-lg p-0.5 bg-[#F7FCFD] text-xs">
                  <button
                    type="button"
                    onClick={() => setFlightFilter('all')}
                    className={`px-3 py-1 rounded-md font-semibold ${flightFilter === 'all' ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#657A84]'}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlightFilter('priority')}
                    className={`px-3 py-1 rounded-md font-semibold ${flightFilter === 'priority' ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#657A84]'}`}
                  >
                    Priority ({priorityCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlightFilter('exceptions')}
                    className={`px-3 py-1 rounded-md font-semibold ${flightFilter === 'exceptions' ? 'bg-white text-red-600 shadow-2xs' : 'text-[#657A84]'}`}
                  >
                    Exceptions ({overdueCount})
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {operationalShipments.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedShipment(s)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedShipment?.id === s.id
                        ? 'border-[#00B4D8] bg-[#CAF0F8]/20 ring-1 ring-[#00B4D8]'
                        : 'border-[#DCECF0] hover:border-[#90E0EF] bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#263B45]">{s.trackingNumber}</span>
                          {s.selectedTier === 'priority' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                              PRIORITY
                            </span>
                          )}
                          {s.isUpdateOverdue && (
                            <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              OVERDUE SCAN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#657A84] mt-1">
                          {s.originCity} → <span className="font-semibold text-[#263B45]">{s.destinationCity}, {s.destinationCountry}</span>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-[#263B45]">
                        {s.declaredWeightKg} kg
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#DCECF0] text-xs text-[#657A84]">
                      <span>Sender: {s.senderName}</span>
                      <span>Recipient: {s.recipientName}</span>
                      <span className="font-semibold text-[#00B4D8]">Status: {s.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flight Console */}
            <div className="bg-white border border-[#DCECF0] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCECF0]">
                <h3 className="text-sm font-bold text-[#263B45]">Carrier Flight Console</h3>
                <span className="text-[10px] font-bold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-md">
                  Authorized Linehaul
                </span>
              </div>

              {selectedShipment ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-[#F7FCFD] border border-[#DCECF0] rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-[#263B45]">{selectedShipment.trackingNumber}</span>
                      <span className="font-semibold text-[#00B4D8] capitalize">{selectedShipment.selectedTier} Lane</span>
                    </div>
                    <div className="text-[#657A84]">Destination: {selectedShipment.destinationCity}, {selectedShipment.destinationCountry}</div>
                    <div className="text-[#657A84]">Chargeable Weight: {selectedShipment.declaredWeightKg} kg</div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-bold text-[#263B45]">Lodge with Scheduled Flight Lane</label>
                    <select
                      value={carrierFlightRef}
                      onChange={(e) => setCarrierFlightRef(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD] font-semibold text-xs"
                    >
                      <option value="BA-074 (LHR - London Heathrow)">BA-074 (LHR - London Heathrow)</option>
                      <option value="DL-055 (JFK - New York JFK)">DL-055 (JFK - New York JFK)</option>
                      <option value="AF-149 (CDG - Paris / Europe Transit)">AF-149 (CDG - Paris / Europe Transit)</option>
                      <option value="ET-900 (ACC - West Africa Express)">ET-900 (ACC - West Africa Express)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDispatchToCarrier(selectedShipment.id)}
                      className="w-full py-2.5 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <Plane className="w-4 h-4" />
                      <span>Lodge Consignment on Carrier Flight</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-[#657A84] text-xs">
                  Select a consignment from the queue to allocate carrier flights.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROACTIVE TRACKING & OVERDUE SLAS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'overdue_sla' && (
        <div className="bg-white border border-[#DCECF0] rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#263B45]">Proactive Stalled-Update Monitor</h2>
            <p className="text-xs text-[#657A84]">
              Swiftvero automatically detects when carrier transit updates stall past agreed thresholds. Customers are notified honestly before they have to ask.
            </p>
          </div>

          <div className="space-y-3">
            {shipments.map((s) => (
              <div key={s.id} className="p-4 border border-[#DCECF0] rounded-xl flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#263B45]">{s.trackingNumber}</span>
                    <span className="text-xs text-[#657A84]">→ {s.destinationCountry}</span>
                    {s.isUpdateOverdue ? (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        Overdue Detected
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Scan Fresh
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#657A84] mt-1">
                    Last scan: {s.lastUpdateTimestamp?.slice(0, 16).replace('T', ' ')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!s.isUpdateOverdue ? (
                    <button
                      type="button"
                      onClick={() => triggerOverdueAlert(s.id)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-colors"
                    >
                      Simulate Overdue Alert (&gt;18h No Scan)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => resolveOverdueAlert(s.id, 'Destination carrier liaison confirmed parcel moving smoothly through customs.')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Resolve &amp; Send Honest Customer Notice
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DHL CARRIER INTEGRATION */}
      {activeTab === 'dhl_carrier' && <DhlCarrierManagementView />}

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN COLLECTION HANDLER                                        */}
      {/* ========================================================================= */}
      {assignModalJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-[#DCECF0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCECF0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#263B45]">Assign Collection Handler</h3>
                  <p className="text-[11px] text-[#657A84]">Pickup Ref: {assignModalJob.pickupReference}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalJob(null)}
                className="text-[#657A84] hover:text-[#263B45] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Pickup Summary Card */}
            <div className="p-3 bg-[#F7FCFD] border border-[#DCECF0] rounded-xl text-xs space-y-1">
              <div className="font-semibold text-[#263B45]">Customer: {assignModalJob.customerName || assignModalJob.senderName} ({assignModalJob.customerPhone || assignModalJob.senderPhone})</div>
              <div className="text-[#657A84]">Address: {assignModalJob.pickupAddress || assignModalJob.senderAddress}</div>
              <div className="text-[#657A84]">Packages: {assignModalJob.packageCount || 1} item(s) · Est ~{assignModalJob.estimatedWeightKg || assignModalJob.declaredWeightKg || 5} kg</div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              {/* Handler Category */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Collection Handler Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'staff', label: 'Internal Staff' },
                    { id: 'external_partner', label: 'Logistics Partner' },
                    { id: 'manual', label: 'Manual Entry' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setAssignHandlerType(cat.id as any);
                        if (cat.id === 'staff') {
                          setAssignHandlerName('Ibrahim Suleiman');
                          setAssignHandlerPhone('0802-345-6789');
                        } else if (cat.id === 'external_partner') {
                          setAssignHandlerName('GIG Logistics Courier Fleet');
                          setAssignHandlerPhone('0813-900-2211');
                        } else {
                          setAssignHandlerName('');
                          setAssignHandlerPhone('');
                        }
                      }}
                      className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all ${
                        assignHandlerType === cat.id
                          ? 'bg-[#00B4D8] text-white border-[#00B4D8]'
                          : 'bg-[#F7FCFD] text-[#657A84] border-[#DCECF0] hover:bg-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Handler Selection / Name */}
              {assignHandlerType === 'staff' && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-[#263B45]">Select Internal Staff Member</label>
                  <select
                    value={assignHandlerName}
                    onChange={(e) => {
                      setAssignHandlerName(e.target.value);
                      if (e.target.value.includes('Ibrahim')) setAssignHandlerPhone('0802-345-6789');
                      if (e.target.value.includes('Tunde')) setAssignHandlerPhone('0803-112-9900');
                      if (e.target.value.includes('Chinedu')) setAssignHandlerPhone('0805-443-8822');
                    }}
                    className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                  >
                    <option value="Ibrahim Suleiman">Ibrahim Suleiman (Ikeja Hub Courier #04)</option>
                    <option value="Tunde Balogun">Tunde Balogun (Lekki / Island Dispatch #02)</option>
                    <option value="Chinedu Okafor">Chinedu Okafor (Mainland Dispatch #07)</option>
                  </select>
                </div>
              )}

              {assignHandlerType === 'external_partner' && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-[#263B45]">Select Approved Partner Network</label>
                  <select
                    value={assignHandlerName}
                    onChange={(e) => {
                      setAssignHandlerName(e.target.value);
                      if (e.target.value.includes('GIG')) setAssignHandlerPhone('0813-900-2211');
                      if (e.target.value.includes('Red Star')) setAssignHandlerPhone('0800-RED-STAR');
                      if (e.target.value.includes('Max')) setAssignHandlerPhone('0809-MAX-FLEET');
                    }}
                    className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                  >
                    <option value="GIG Logistics Fleet">GIG Logistics Lagos Intra-City Fleet</option>
                    <option value="Red Star Express Fleet">Red Star Express Courier Network</option>
                    <option value="Max.ng Verified Fleet">Max.ng On-Demand Logistics</option>
                  </select>
                </div>
              )}

              {assignHandlerType === 'manual' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-[#263B45]">Handler Name</label>
                    <input
                      type="text"
                      required
                      value={assignHandlerName}
                      onChange={(e) => setAssignHandlerName(e.target.value)}
                      placeholder="e.g. Babatunde Alabi"
                      className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-bold text-[#263B45]">Handler Phone</label>
                    <input
                      type="tel"
                      required
                      value={assignHandlerPhone}
                      onChange={(e) => setAssignHandlerPhone(e.target.value)}
                      placeholder="080XXXXXXXX"
                      className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                    />
                  </div>
                </div>
              )}

              {/* Scheduled Time Slot */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Estimated Collection Arrival Time</label>
                <input
                  type="text"
                  value={assignScheduledTime}
                  onChange={(e) => setAssignScheduledTime(e.target.value)}
                  placeholder="e.g. 11:30 AM (Within 24h Window)"
                  className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                />
              </div>

              {/* Dispatch Instructions */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Special Dispatch Instructions (Optional)</label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Call customer before arrival; bring Swiftvero outer waterproof tamper sacks."
                  className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCECF0]">
                <button
                  type="button"
                  onClick={() => setAssignModalJob(null)}
                  className="px-4 py-2 border border-[#DCECF0] rounded-xl font-semibold text-[#657A84] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-xl font-bold shadow-xs"
                >
                  Confirm Handler &amp; Notify Consignor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DOORSTEP COLLECTION CONFIRMATION (STRICTLY NO WEIGHT)            */}
      {/* ========================================================================= */}
      {doorstepModalJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-[#DCECF0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCECF0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#263B45]">Doorstep Collection Handover</h3>
                  <p className="text-[11px] text-[#657A84]">Collection Handler Sign-off (Strictly No Weight)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDoorstepModalJob(null)}
                className="text-[#657A84] hover:text-[#263B45] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Strict Notice: No Scale on Vehicle */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Operating Rule: No Scales on Collection Vans</span>
              </div>
              <p className="text-[11px]">
                Do not quote or agree on final weights at customer premises. Record parcel count, inspect visible outer packaging, and capture handover signature. Digital calibrated scale weighing will be completed at the Swiftvero Hub.
              </p>
            </div>

            <form onSubmit={handleDoorstepSubmit} className="space-y-4 text-xs">
              {/* Package Count Verified */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-[#263B45]">Packages Handed Over</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={doorstepPackageCount}
                    onChange={(e) => setDoorstepPackageCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD] font-mono font-bold"
                  />
                </div>

                {/* Visible Packaging Condition */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-[#263B45]">Visible Outer Condition</label>
                  <select
                    value={doorstepCondition}
                    onChange={(e) => setDoorstepCondition(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD] font-semibold"
                  >
                    <option value="good">Good / Securely Taped</option>
                    <option value="minor_outer_scuff">Minor Outer Scuffs</option>
                    <option value="carton_damaged">Carton Damaged (Requires Hub Rebox)</option>
                    <option value="unsealed">Unsealed (Contents Checked)</option>
                  </select>
                </div>
              </div>

              {/* Customer Sign-off Name */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Customer / Representative Handover Sign-off</label>
                <input
                  type="text"
                  required
                  value={doorstepSignatureName}
                  onChange={(e) => setDoorstepSignatureName(e.target.value)}
                  placeholder="Full name of person handing over package"
                  className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                />
              </div>

              {/* Handler Observation Notes */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Handler Doorstep Notes (Optional)</label>
                <textarea
                  value={doorstepNotes}
                  onChange={(e) => setDoorstepNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. 2 cartons of clothing and foodstuff, customer informed final scale weighing is at Ikeja Cargo Hub."
                  className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                />
              </div>

              {/* Photo Evidence Placeholder */}
              <div className="p-3 bg-[#F7FCFD] border border-[#DCECF0] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#00B4D8]" />
                  <span className="text-[11px] font-semibold text-[#263B45]">Doorstep Photo Evidence</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  1 Photo Attached
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCECF0]">
                <button
                  type="button"
                  onClick={() => setDoorstepModalJob(null)}
                  className="px-4 py-2 border border-[#DCECF0] rounded-xl font-semibold text-[#657A84] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Confirm Doorstep Handover &amp; Begin Transit to Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FACILITY INTAKE & DIGITAL SCALE WEIGHING                         */}
      {/* ========================================================================= */}
      {weighingModalJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-[#DCECF0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCECF0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#263B45]">Hub Digital Scale Weighing &amp; Quote</h3>
                  <p className="text-[11px] text-[#657A84]">Certified Measurement Station · Ikeja Operations Hub</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWeighingModalJob(null)}
                className="text-[#657A84] hover:text-[#263B45] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Official Certification Notice */}
            <div className="p-3 bg-[#CAF0F8]/30 border border-[#90E0EF] rounded-xl text-xs text-[#263B45] space-y-1">
              <div className="font-bold text-[#008EA8]">Certified Digital Weight Verification</div>
              <p className="text-[11px] text-[#657A84]">
                The entered scale weight and volumetric measurements will generate the official itemized shipping quote and air waybill manifest sent to the customer for approval.
              </p>
            </div>

            <form onSubmit={handleFacilityWeighSubmit} className="space-y-4 text-xs">
              {/* Actual Scale Weight */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Actual Scale Weight (kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={scaleActualWeightKg}
                    onChange={(e) => setScaleActualWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD] font-mono font-bold text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[#657A84]">kg</span>
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Dimensions (L × W × H in cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="number"
                      min={1}
                      required
                      value={scaleLengthCm}
                      onChange={(e) => setScaleLengthCm(Number(e.target.value) || 1)}
                      placeholder="Length"
                      className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD] font-mono text-center"
                    />
                    <span className="text-[10px] text-[#657A84] block text-center mt-0.5">Length (cm)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={1}
                      required
                      value={scaleWidthCm}
                      onChange={(e) => setScaleWidthCm(Number(e.target.value) || 1)}
                      placeholder="Width"
                      className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD] font-mono text-center"
                    />
                    <span className="text-[10px] text-[#657A84] block text-center mt-0.5">Width (cm)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={1}
                      required
                      value={scaleHeightCm}
                      onChange={(e) => setScaleHeightCm(Number(e.target.value) || 1)}
                      placeholder="Height"
                      className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD] font-mono text-center"
                    />
                    <span className="text-[10px] text-[#657A84] block text-center mt-0.5">Height (cm)</span>
                  </div>
                </div>
              </div>

              {/* Live Chargeable Weight Calculation Box */}
              <div className="p-3 bg-[#F7FCFD] border border-[#DCECF0] rounded-xl grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#657A84] block">Volumetric Weight</span>
                  <span className="font-mono font-bold text-[#263B45] text-sm">
                    {calculatedVolumetricKg} kg
                  </span>
                  <span className="text-[10px] text-[#657A84] block">(L×W×H / 5000)</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#008EA8] block">Chargeable Weight</span>
                  <span className="font-mono font-black text-[#008EA8] text-base">
                    {calculatedChargeableKg} kg
                  </span>
                  <span className="text-[10px] text-[#657A84] block">Higher of scale vs volume</span>
                </div>
              </div>

              {/* Repackaging Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-[#DCECF0] bg-[#F7FCFD]">
                <input
                  type="checkbox"
                  checked={scaleRepackaging}
                  onChange={(e) => setScaleRepackaging(e.target.checked)}
                  className="rounded text-[#00B4D8]"
                />
                <span className="text-xs text-[#263B45] font-semibold">
                  Repackaging / protective export reinforcement applied (bubble wrap, shrinkwrap, tamper tape)
                </span>
              </label>

              {/* Condition / Intake Notes */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Hub Quality &amp; Intake Notes</label>
                <textarea
                  value={scaleNotes}
                  onChange={(e) => setScaleNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Package inspected for prohibited items. None detected. Packaged in Swiftvero reinforced double-wall carton."
                  className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCECF0]">
                <button
                  type="button"
                  onClick={() => setWeighingModalJob(null)}
                  className="px-4 py-2 border border-[#DCECF0] rounded-xl font-semibold text-[#657A84] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Lock Weight &amp; Dispatch Final Quotation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RESCHEDULE / CANCEL PICKUP                                       */}
      {/* ========================================================================= */}
      {rescheduleModalJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-[#DCECF0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCECF0]">
              <h3 className="text-sm font-bold text-[#263B45]">Reschedule or Cancel Pickup</h3>
              <button
                type="button"
                onClick={() => setRescheduleModalJob(null)}
                className="text-[#657A84] hover:text-[#263B45] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">New Preferred Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Preferred Time Slot</label>
                <select
                  value={rescheduleTimeSlot}
                  onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                >
                  <option value="Morning (09:00 - 13:00)">Morning (09:00 - 13:00)</option>
                  <option value="Afternoon (13:00 - 17:00)">Afternoon (13:00 - 17:00)</option>
                  <option value="Evening (17:00 - 20:00)">Evening (17:00 - 20:00)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-[#263B45]">Reason for Reschedule / Cancellation</label>
                <textarea
                  required
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Customer called to request pickup after 2pm due to bank appointment."
                  className="w-full px-3 py-2 border border-[#DCECF0] rounded-xl bg-[#F7FCFD]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#DCECF0]">
                <button
                  type="button"
                  onClick={() => {
                    cancelPickup(rescheduleModalJob.id, rescheduleReason || 'Cancelled by operations');
                    setRescheduleModalJob(null);
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold"
                >
                  Cancel Request
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRescheduleModalJob(null)}
                    className="px-3 py-2 border border-[#DCECF0] rounded-xl font-semibold text-[#657A84]"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00B4D8] text-white rounded-xl font-bold shadow-xs"
                  >
                    Save Reschedule
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DETAIL AUDIT VIEW                                                */}
      {/* ========================================================================= */}
      {selectedPickupDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#DCECF0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCECF0]">
              <div>
                <h3 className="text-sm font-bold text-[#263B45]">Consignment Intake Record</h3>
                <span className="font-mono text-xs text-[#008EA8]">{selectedPickupDetail.pickupReference}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPickupDetail(null)}
                className="text-[#657A84] hover:text-[#263B45] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7FCFD] border border-[#DCECF0] rounded-xl space-y-1">
                <div className="font-bold text-[#263B45]">Consignor Details:</div>
                <div>{selectedPickupDetail.customerName || selectedPickupDetail.senderName} ({selectedPickupDetail.customerPhone || selectedPickupDetail.senderPhone})</div>
                <div className="text-[#657A84]">{selectedPickupDetail.pickupAddress || selectedPickupDetail.senderAddress}</div>
                {(selectedPickupDetail.customerEmail || selectedPickupDetail.senderEmail) && (
                  <div className="text-[#657A84]">{selectedPickupDetail.customerEmail || selectedPickupDetail.senderEmail}</div>
                )}
              </div>

              <div className="p-3 bg-[#F7FCFD] border border-[#DCECF0] rounded-xl space-y-1">
                <div className="font-bold text-[#263B45]">24-Hour SLA Timeline:</div>
                <div>Confirmed: {selectedPickupDetail.bookingConfirmedAt ? new Date(selectedPickupDetail.bookingConfirmedAt).toLocaleString() : 'Pending'}</div>
                <div>Deadline: {selectedPickupDetail.collectionDeadline ? new Date(selectedPickupDetail.collectionDeadline).toLocaleString() : 'Within 24 Hours'}</div>
                <div>Status: <span className="font-bold uppercase text-[#008EA8]">{selectedPickupDetail.status}</span></div>
              </div>

              {selectedPickupDetail.doorstepCollection && (
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1">
                  <div className="font-bold text-blue-900">Doorstep Collection Evidence (No Weight):</div>
                  <div>Collected At: {new Date(selectedPickupDetail.doorstepCollection.collectedAt).toLocaleString()}</div>
                  <div>Packages Handed Over: {selectedPickupDetail.doorstepCollection.packagesCollected}</div>
                  <div>Outer Condition: {selectedPickupDetail.doorstepCollection.visibleCondition}</div>
                  <div>Sign-off Name: {selectedPickupDetail.doorstepCollection.customerSignatureName}</div>
                  {selectedPickupDetail.doorstepCollection.notes && (
                    <div className="italic text-[#657A84]">"{selectedPickupDetail.doorstepCollection.notes}"</div>
                  )}
                </div>
              )}

              {selectedPickupDetail.facilityActualWeightKg && (
                <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl space-y-1">
                  <div className="font-bold text-teal-900">Facility Intake &amp; Certified Scale:</div>
                  <div>Scale Actual Weight: {selectedPickupDetail.facilityActualWeightKg} kg</div>
                  {selectedPickupDetail.facilityDimensions && (
                    <div>
                      Dimensions: {selectedPickupDetail.facilityDimensions.length} × {selectedPickupDetail.facilityDimensions.width} × {selectedPickupDetail.facilityDimensions.height} cm
                    </div>
                  )}
                  <div>Volumetric Weight: {selectedPickupDetail.facilityVolumetricWeightKg} kg</div>
                  <div className="font-bold text-[#008EA8]">Chargeable Weight: {selectedPickupDetail.facilityChargeableWeightKg} kg</div>
                  <div>Quotation Generated: {selectedPickupDetail.finalQuoteGenerated ? 'Yes (Sent to customer)' : 'Pending'}</div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#DCECF0] text-right">
              <button
                type="button"
                onClick={() => setSelectedPickupDetail(null)}
                className="px-4 py-2 bg-[#00B4D8] text-white rounded-xl text-xs font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
