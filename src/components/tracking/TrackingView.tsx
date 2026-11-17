import React, { useEffect, useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  PackageSearch,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MapPin,
  MessageSquare,
  Star,
  FileCheck2,
  Layers,
  Building2,
} from 'lucide-react';

interface TrackingViewProps {
  onOpenSupportWithShipment: (trackingNumber: string) => void;
  onOpenReviewForShipment: (shipmentId: string) => void;
  onOpenQuoteRetrieval?: (trackingNumber: string) => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  onOpenSupportWithShipment,
  onOpenReviewForShipment,
  onOpenQuoteRetrieval,
}) => {
  const {
    shipments,
    bookingGroups,
    branches,
    selectedShipmentForTracking,
    setSelectedShipmentForTracking,
  } = useDemo();

  const [searchInput, setSearchInput] = useState(selectedShipmentForTracking || '');
  const [activeShipmentCode, setActiveShipmentCode] = useState(
    selectedShipmentForTracking || (shipments.length > 0 ? shipments[0].trackingNumber : '')
  );
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useEffect(() => {
    if (selectedShipmentForTracking) {
      setSearchInput(selectedShipmentForTracking);
      setActiveShipmentCode(selectedShipmentForTracking);
      setSearchError(null);
    }
  }, [selectedShipmentForTracking]);

  // Find active shipment based on activeShipmentCode
  const currentShipment = shipments.find(
    (s) => s.trackingNumber.toUpperCase() === activeShipmentCode.trim().toUpperCase()
  );

  const parentGroup = currentShipment?.bookingGroupId
    ? bookingGroups.find((bg) => bg.id === currentShipment.bookingGroupId)
    : undefined;

  const siblingShipments = currentShipment?.bookingGroupId
    ? shipments.filter((s) => s.bookingGroupId === currentShipment.bookingGroupId)
    : [];

  const dropoffBranch = currentShipment?.collectionBranchId
    ? branches.find((b) => b.id === currentShipment.collectionBranchId)
    : undefined;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim().toUpperCase();
    if (!query) {
      setSearchError('Please enter your Swiftvero shipment code.');
      return;
    }
    const found = shipments.find((s) => s.trackingNumber.toUpperCase() === query);
    if (found) {
      setSearchError(null);
      setActiveShipmentCode(found.trackingNumber);
      setSelectedShipmentForTracking(found.trackingNumber);
    } else {
      setSearchError(`Shipment "${query}" was not found. Please verify the code on your receipt or confirmation email.`);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Customer-friendly status headline mapping
  const getStatusHeadline = (status: string, isOverdue?: boolean) => {
    if (isOverdue) {
      return {
        title: 'Tracking update delayed. We are checking with the delivery partner.',
        badge: 'Update In Progress',
        color: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      };
    }
    switch (status) {
      case 'delivered':
        return {
          title: 'Your package has been delivered.',
          badge: 'Delivered',
          color: 'text-emerald-700 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        };
      case 'out_for_delivery':
        return {
          title: 'Your package is out for delivery today.',
          badge: 'Out for Delivery',
          color: 'text-[#008EA8] dark:text-[#90E0EF]',
          bg: 'bg-[#CAF0F8]/60 dark:bg-sky-950/40 border-[#90E0EF] dark:border-sky-800',
        };
      case 'customs_cleared':
      case 'customs_processing':
        return {
          title: 'Your package is clearing international customs.',
          badge: 'Customs Processing',
          color: 'text-[#008EA8] dark:text-[#90E0EF]',
          bg: 'bg-[#CAF0F8]/60 dark:bg-sky-950/40 border-[#90E0EF] dark:border-sky-800',
        };
      case 'in_transit':
      case 'departed_origin':
      case 'arrived_transit_hub':
        return {
          title: 'Your package is in transit.',
          badge: 'In Transit',
          color: 'text-[#008EA8] dark:text-[#90E0EF]',
          bg: 'bg-[#CAF0F8]/60 dark:bg-sky-950/40 border-[#90E0EF] dark:border-sky-800',
        };
      case 'carrier_received':
        return {
          title: 'Your package has been accepted by the airline carrier.',
          badge: 'Accepted by Carrier',
          color: 'text-[#008EA8] dark:text-[#90E0EF]',
          bg: 'bg-[#CAF0F8]/60 dark:bg-sky-950/40 border-[#90E0EF] dark:border-sky-800',
        };
      case 'payment_confirmed':
      case 'booked':
        return {
          title: 'Booking confirmed and scheduled for intake / export dispatch.',
          badge: 'Confirmed',
          color: 'text-emerald-700 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        };
      case 'awaiting_approval':
      case 'quote_ready':
      case 'quote_approved':
        return {
          title: 'Action required: Your verified shipping quotation is ready.',
          badge: 'Action Required',
          color: 'text-amber-700 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
        };
      case 'received_at_hub':
      case 'under_inspection':
        return {
          title: 'Package received at facility. Digital scale weighing in progress.',
          badge: 'At Facility',
          color: 'text-[#008EA8] dark:text-[#90E0EF]',
          bg: 'bg-[#CAF0F8]/60 dark:bg-sky-950/40 border-[#90E0EF] dark:border-sky-800',
        };
      case 'picked_up':
      case 'pickup_completed':
        return {
          title: 'Package collected. En route to Ikeja consolidation hub.',
          badge: 'Collected',
          color: 'text-[#008EA8] dark:text-[#90E0EF]',
          bg: 'bg-[#CAF0F8]/60 dark:bg-sky-950/40 border-[#90E0EF] dark:border-sky-800',
        };
      case 'pickup_assigned':
      case 'pickup_scheduled':
        return {
          title: 'Doorstep pickup scheduled for your collection address.',
          badge: 'Pickup Scheduled',
          color: 'text-slate-800 dark:text-slate-200',
          bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        };
      case 'cancelled':
        return {
          title: 'Shipment cancelled.',
          badge: 'Cancelled',
          color: 'text-rose-700 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
        };
      default:
        return {
          title: 'Shipment booking confirmed.',
          badge: 'Confirmed',
          color: 'text-slate-800 dark:text-slate-200',
          bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const statusInfo = currentShipment
    ? getStatusHeadline(currentShipment.status, currentShipment.isUpdateOverdue)
    : null;

  const needsQuotePayment =
    currentShipment &&
    currentShipment.paymentStatus !== 'paid' &&
    (currentShipment.status === 'quote_ready' ||
      currentShipment.status === 'quote_approved' ||
      currentShipment.status === 'payment_pending');

  const collectionLabel =
    currentShipment?.collectionMethod === 'priority_pickup'
      ? `Priority Pickup (${currentShipment.priorityCollectionWindow || '1 – 6 hours'})`
      : currentShipment?.collectionMethod === 'dropoff'
      ? `Drop-off at ${dropoffBranch?.name || currentShipment.branchName || 'Verified Swiftvero Hub'}`
      : 'Standard Pickup (Within 24 hours)';

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 pb-20 text-[#1F2937] dark:text-slate-100 transition-colors duration-200">
      {/* 1. Tracking Page Layout: Clean Heading & Compact Search */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2.5">
            <PackageSearch
              className="w-6 h-6 text-[#00B4D8] stroke-[2.25]"
              aria-hidden="true"
            />
            <h1 className="sv-h1">
              Track shipment
            </h1>
          </div>
          <p className="sv-body text-[#4B5563] dark:text-slate-400 mt-1">
            Enter your Swiftvero shipment code to check its latest status.
          </p>
        </div>

        {/* Compact Search Form */}
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                placeholder="Enter Swiftvero shipment code"
                aria-label="Swiftvero shipment code"
                className="sv-input w-full px-4 py-2.5 sm:py-3 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder-[#4B5563]/60 uppercase tabular-nums min-h-[44px]"
              />
            </div>
            <button
              type="submit"
              className="sv-btn-primary px-7 py-2.5 sm:py-3 rounded-full whitespace-nowrap flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
            >
              <span>Track</span>
            </button>
          </div>

          {searchError && (
            <div className="text-[13px] font-medium text-[#B42318] dark:text-rose-400 flex items-center gap-1.5 pt-0.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </form>
      </div>

      {/* 2. Tracking Result Screen */}
      {currentShipment && statusInfo ? (
        <div className="space-y-6">
          {/* Sibling Switcher for Multi-Shipment Booking Groups */}
          {siblingShipments.length > 1 && parentGroup && (
            <div className="bg-[#CAF0F8]/70 dark:bg-sky-950/30 border border-[#90E0EF] dark:border-sky-800 rounded-[12px] p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span className="font-bold text-[#0F172A] dark:text-[#90E0EF] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#00B4D8]" />
                  Booking Group <span className="tabular-nums">{parentGroup.groupCode}</span> · {siblingShipments.length} shipments
                </span>
                <span className="text-[12px] font-medium text-[#4B5563] dark:text-slate-400">
                  Switch between shipments in this batch
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {siblingShipments.map((sib) => {
                  const isCurrentSib = sib.id === currentShipment.id;
                  return (
                    <button
                      key={sib.id}
                      type="button"
                      onClick={() => {
                        setActiveShipmentCode(sib.trackingNumber);
                        setSearchInput(sib.trackingNumber);
                        setSelectedShipmentForTracking(sib.trackingNumber);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-colors min-h-[38px] tabular-nums cursor-pointer ${
                        isCurrentSib
                          ? 'bg-[#00B4D8] text-white border-[#00B4D8]'
                          : 'bg-white dark:bg-slate-900 text-[#1F2937] dark:text-slate-200 border-[#CBD5E1] dark:border-slate-700 hover:border-[#00B4D8]'
                      }`}
                    >
                      {sib.trackingNumber} · {sib.destinationCity}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Status Container */}
          <div className="sv-card p-6 sm:p-7 space-y-5">
            {/* Top Bar: Code + Copy + Verified Status Pill */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="sv-label uppercase tracking-wider block font-semibold">
                  Shipment Code
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[20px] font-extrabold text-[#111827] dark:text-white tabular-nums">
                    {currentShipment.trackingNumber}
                  </span>
                  {currentShipment.isDemo && (
                    <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-700 text-[#4B5563] dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-600">
                      Demo
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopyCode(currentShipment.trackingNumber)}
                    className="p-1.5 rounded-md text-[#4B5563] hover:text-[#00B4D8] transition-colors cursor-pointer"
                    title="Copy shipment code"
                    aria-label="Copy shipment code"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-[#247347]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {copiedCode && (
                    <span className="text-[12px] text-[#247347] dark:text-emerald-400 font-semibold">
                      Copied
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`px-3.5 py-1 rounded-full text-[12px] font-semibold border ${statusInfo.bg} ${statusInfo.color}`}
              >
                {statusInfo.badge}
              </div>
            </div>

            {/* Status Headline - Strongest visual element */}
            <div className="space-y-1">
              <h2 className={`sv-h2 leading-snug ${statusInfo.color}`}>
                {statusInfo.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#4B5563] dark:text-slate-400 pt-1">
                <span>
                  Last updated:{' '}
                  <strong className="text-[#111827] dark:text-slate-200 tabular-nums font-semibold">
                    {currentShipment.lastUpdateTimestamp
                      ? currentShipment.lastUpdateTimestamp.slice(0, 16).replace('T', ' ')
                      : 'Today, verified scan'}
                  </strong>
                </span>
                {/* Secondary Delivery Partner Line (Only when accepted by carrier) */}
                {currentShipment.carrierName && (
                  <span className="text-[#1F2937] dark:text-slate-300">
                    Delivery partner:{' '}
                    <strong className="font-semibold text-[#111827] dark:text-white">
                      {currentShipment.carrierName}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {/* Actionable Quotation Retrieval Prompt when quote is awaiting approval/payment */}
            {needsQuotePayment && onOpenQuoteRetrieval && (
              <div className="p-4 rounded-[12px] bg-[#CAF0F8]/70 dark:bg-amber-950/30 border border-[#90E0EF] dark:border-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-[14px]">
                  <p className="font-bold text-[#0F172A] dark:text-amber-300 flex items-center gap-1.5 tabular-nums">
                    <FileCheck2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>
                      Final Quotation Ready · ₦{(currentShipment.quote?.totalAmount || 0).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-[13px] text-[#1F2937] dark:text-amber-400">
                    Review verified scale measurements, itemized charges, and approve payment before dispatch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuoteRetrieval(currentShipment.trackingNumber)}
                  className="sv-btn-primary px-5 py-2.5 rounded-full whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                >
                  Review &amp; Approve Quote
                </button>
              </div>
            )}

            {/* Post-Delivery Experience Review Prompt */}
            {currentShipment.status === 'delivered' && !currentShipment.hasReview && (
              <div className="p-4 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-[14px]">
                  <p className="font-bold text-[#111827] dark:text-emerald-300 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>How was your shipping experience?</span>
                  </p>
                  <p className="text-[13px] text-[#247347] dark:text-emerald-400">
                    Your delivery is complete. Share a verified rating on speed, communication, and parcel condition.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenReviewForShipment(currentShipment.id)}
                  className="px-5 py-2.5 text-[14px] font-bold text-white bg-[#247347] hover:opacity-90 rounded-full transition-opacity whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                >
                  Leave a Review
                </button>
              </div>
            )}

            {/* Origin & Destination Corridor */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800 text-[14px]">
              <div>
                <span className="sv-label block">Origin</span>
                <span className="font-semibold text-[#111827] dark:text-white">
                  {currentShipment.originCity || 'Lagos'}, {currentShipment.originCountry || 'Nigeria'}
                </span>
              </div>
              <div>
                <span className="sv-label block">Destination</span>
                <span className="font-semibold text-[#111827] dark:text-white">
                  {currentShipment.destinationCity}, {currentShipment.destinationCountry}
                </span>
              </div>
              {/* Estimated Delivery: Only when reliable */}
              {currentShipment.estimatedDeliveryDisplay && currentShipment.status !== 'delivered' && (
                <div className="col-span-2 sm:col-span-1">
                  <span className="sv-label block">Estimated Delivery</span>
                  <span className="font-bold text-[#0F172A] dark:text-[#90E0EF] tabular-nums">
                    {currentShipment.estimatedDeliveryDisplay}
                  </span>
                </div>
              )}
            </div>

            {/* Expandable Shipment Details */}
            <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                aria-expanded={detailsExpanded}
                className="w-full flex items-center justify-between text-[14px] font-semibold text-[#0F172A] dark:text-slate-300 hover:text-[#00B4D8] py-1 transition-colors cursor-pointer"
              >
                <span>{detailsExpanded ? 'Hide shipment details' : 'View shipment details'}</span>
                <span className="w-7 h-7 rounded-full bg-[#F1F5F9] dark:bg-slate-700 flex items-center justify-center">
                  {detailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {detailsExpanded && (
                <div className="mt-3 p-4 bg-[#F8FAFC] dark:bg-slate-900/60 rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 space-y-2.5 text-[14px]">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-[#4B5563] dark:text-slate-400">Service:</span>
                    <span className="text-[#111827] dark:text-slate-200 text-right tabular-nums">
                      {currentShipment.quote.serviceName} ({currentShipment.quote.transitWindow})
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-[#4B5563] dark:text-slate-400">Collection Option:</span>
                    <span className="text-[#111827] dark:text-slate-200 text-right">
                      {collectionLabel}
                    </span>
                  </div>
                  {dropoffBranch && (
                    <div className="flex items-start justify-between gap-2 p-3 rounded-[10px] bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700">
                      <span className="font-semibold text-[#4B5563] dark:text-slate-400 flex items-center gap-1 shrink-0">
                        <Building2 className="w-4 h-4 text-[#00B4D8]" />
                        Drop-off Hub:
                      </span>
                      <div className="text-right text-[#111827] dark:text-slate-200">
                        <p className="font-semibold">{dropoffBranch.name}</p>
                        <p className="sv-label">
                          {dropoffBranch.address} · {dropoffBranch.operatingHours || 'Mon–Sat 8am–6pm'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-[#4B5563] dark:text-slate-400">Billable Weight:</span>
                    <span className="text-[#111827] dark:text-slate-200 tabular-nums">
                      {currentShipment.quote.chargeableWeightKg} kg
                    </span>
                  </div>
                  {currentShipment.quoteVersions && currentShipment.quoteVersions.length > 0 && (
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-[#4B5563] dark:text-slate-400">Active Quote Version:</span>
                      <span className="text-[#111827] dark:text-slate-200 tabular-nums">
                        v{currentShipment.quoteVersions[currentShipment.quoteVersions.length - 1].version} ·{' '}
                        {currentShipment.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {currentShipment.dhlTrackingNumber && (
                    <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0] dark:border-slate-700">
                      <span className="font-semibold text-[#4B5563] dark:text-slate-400">Carrier Waybill:</span>
                      <span className="text-[#111827] dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-[8px] border border-[#E2E8F0] dark:border-slate-700 tabular-nums">
                        {currentShipment.dhlTrackingNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-[#4B5563] dark:text-slate-400">Booking Date:</span>
                    <span className="text-[#111827] dark:text-slate-200 tabular-nums">
                      {currentShipment.createdAt.slice(0, 10)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Tracking Timeline (Mobile-Friendly, Vertical) */}
          <div className="sv-card p-6 sm:p-7 space-y-5">
            <h3 className="sv-h3">
              Shipment progress
            </h3>

            <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0] dark:before:bg-slate-700">
              {currentShipment.trackingEvents.map((evt, idx) => {
                const isCurrent = idx === currentShipment.trackingEvents.length - 1;
                const isCompleted = idx < currentShipment.trackingEvents.length - 1;

                return (
                  <div key={evt.id} className="relative">
                    {/* Status Dot */}
                    <div
                      className={`absolute -left-7 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                        evt.isProactiveAlert
                          ? 'border-amber-500 bg-amber-400'
                          : isCurrent
                          ? 'border-[#00B4D8] bg-[#00B4D8] ring-4 ring-[#CAF0F8] dark:ring-sky-950'
                          : isCompleted
                          ? 'border-[#00B4D8] bg-white dark:bg-slate-800'
                          : 'border-[#CBD5E1] dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-[15px] ${
                            isCurrent
                              ? 'text-[#111827] dark:text-white font-bold'
                              : 'text-[#1F2937] dark:text-slate-300 font-semibold'
                          }`}
                        >
                          {evt.stage}
                        </span>
                        <span className="sv-label tabular-nums">
                          {evt.timestamp}
                        </span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-1 text-[13px] font-medium text-[#0F172A] dark:text-[#90E0EF]">
                          <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
                          <span>{evt.location}</span>
                        </div>
                      )}

                      <p className="sv-body text-[#4B5563] dark:text-slate-400">
                        {evt.isProactiveAlert
                          ? 'Tracking update delayed. We are checking with the delivery partner.'
                          : evt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Single Support Action at Bottom */}
          <div className="p-5 bg-[#CAF0F8]/70 dark:bg-slate-900/60 rounded-[12px] border border-[#90E0EF] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#0F172A] dark:text-slate-100">
            <div>
              <span className="text-[16px] font-bold text-[#0F172A] dark:text-white">Need help with this shipment?</span>
              <p className="text-[14px] text-[#0F172A]/85 dark:text-slate-400 mt-0.5">
                Our support team is available to assist with questions about transit or customs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenSupportWithShipment(currentShipment.trackingNumber)}
              className="sv-btn-primary px-6 py-2.5 rounded-full whitespace-nowrap flex items-center justify-center gap-2 shrink-0 min-h-[44px] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center sv-card text-[14px] text-[#4B5563] dark:text-slate-400 space-y-2">
          <PackageSearch className="w-8 h-8 text-[#4B5563] mx-auto" />
          <p>Please enter a valid Swiftvero shipment code above to view its live tracking status.</p>
        </div>
      )}
    </div>
  );
};

