import React, { useState } from 'react';
import {
  Truck,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  MapPin,
  Calendar,
  Phone,
  User,
  Package,
  Camera,
  Upload,
  RefreshCw,
  Info,
  AlertCircle,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { ConsentCategory } from '../../types';
import { evaluateCollectionOptions, validatePickupEligibility } from '../../utils/collection-options';
import { ReferenceQrBadge } from '../common/ReferenceQrBadge';

interface BookPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (trackingNumber?: string) => void;
  onOpenPolicy?: (key: any) => void;
  initialLinkedShipmentTracking?: string;
  initialLinkedQuoteRef?: string;
}

const MANDATORY_CONSENTS: Array<{
  category: ConsentCategory;
  title: string;
  statement: string;
  policyKey: string;
}> = [
  {
    category: 'pickup_terms',
    title: 'Collection Window Promise',
    statement:
      'I understand Standard Pickup is targeted within 24 hours of confirmation, and Priority Pickup provides instant dispatch where available.',
    policyKey: 'pickup',
  },
  {
    category: 'facility_weighing',
    title: 'Facility Weighing & Inspection',
    statement:
      'I acknowledge that collection staff bring packages to the Swiftvero facility for certified digital weighing and measuring — weighing is not done at my doorstep.',
    policyKey: 'pickup',
  },
  {
    category: 'quote_approval',
    title: 'Final Quote Approval Before Payment',
    statement:
      'I will receive an itemized shipping quote based on actual facility measurements, which I must approve before payment or carriage.',
    policyKey: 'pricing',
  },
  {
    category: 'prohibited_goods',
    title: 'Restricted & Prohibited Goods',
    statement:
      'I confirm this package contains no explosives, pressurized cans, narcotics, cash, unauthorized lithium batteries, or contraband.',
    policyKey: 'prohibited',
  },
  {
    category: 'privacy_notice',
    title: 'Data Privacy & Customs Compliance',
    statement:
      'I consent to the lawful processing of sender and receiver details solely for pickup coordination, international shipping, and customs clearance.',
    policyKey: 'privacy',
  },
];

const SUPPORTED_COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'United Kingdom',
  'Canada',
  'United States',
  'South Africa',
  'United Arab Emirates',
];

const DESTINATION_COUNTRIES = [
  'United Kingdom',
  'United States',
  'Canada',
  'Germany',
  'South Africa',
  'Ghana',
  'United Arab Emirates',
];

export const BookPickupModal: React.FC<BookPickupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenPolicy,
  initialLinkedShipmentTracking,
  initialLinkedQuoteRef,
}) => {
  const { currentCustomer, bookPickupRequest, branches, role, quotes, shipments, pickupJobs } = useDemo();

  // Pickup Tier Selection
  const [pickupType, setPickupType] = useState<'standard' | 'priority'>('standard');

  // Optional Existing Quote / Unpaid Shipment Linking
  const [linkedRefType, setLinkedRefType] = useState<'none' | 'quote' | 'shipment'>(
    initialLinkedShipmentTracking ? 'shipment' : initialLinkedQuoteRef ? 'quote' : 'none'
  );
  const [linkedQuoteRef, setLinkedQuoteRef] = useState(initialLinkedQuoteRef || '');
  const [linkedShipmentTracking, setLinkedShipmentTracking] = useState(initialLinkedShipmentTracking || '');

  // Sender Details
  const [customerName, setCustomerName] = useState(role !== 'visitor' ? currentCustomer.name : '');
  const [customerPhone, setCustomerPhone] = useState(role !== 'visitor' ? currentCustomer.phone : '');
  const [customerEmail, setCustomerEmail] = useState(role !== 'visitor' ? currentCustomer.email : '');
  const [alternateContactName, setAlternateContactName] = useState('');
  const [alternateContactPhone, setAlternateContactPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState(
    role !== 'visitor' ? currentCustomer.address || 'Block B4, Admiralty Way, Lekki Phase 1' : ''
  );
  const [city, setCity] = useState('Lagos');
  const [stateRegion, setStateRegion] = useState('Lagos State');
  const [country, setCountry] = useState('Nigeria');
  const [landmark, setLandmark] = useState('Opposite Phase 1 Mall Gate');

  // Destination
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [destinationCity, setDestinationCity] = useState('London');

  // Timing
  const [preferredDate, setPreferredDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [preferredTimeSlot, setPreferredTimeSlot] = useState(
    'Morning (09:00 - 13:00)'
  );

  // Package Information & Fragile
  const [packageDescription, setPackageDescription] = useState(
    'Boxed garments, fashion samples, and non-perishable packaged snacks'
  );
  const [packageCount, setPackageCount] = useState<number>(1);
  const [estimatedSizeCategory, setEstimatedSizeCategory] = useState<
    'small' | 'medium' | 'large' | 'multiple'
  >('medium');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<number>(4);
  const [isFragile, setIsFragile] = useState<boolean>(false);
  const [fragileNotes, setFragileNotes] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState(
    'Call upon arrival at the security gate for entry pass.'
  );

  // Package Photo State
  const [packagePhotoUrl, setPackagePhotoUrl] = useState<string>(
    '/assets/aistudio/1001021262_90d38915.jpg'
  );
  const [photoPreview, setPhotoPreview] = useState<string>(
    '/assets/aistudio/1001021262_90d38915.jpg'
  );
  const [photoError, setPhotoError] = useState<string>('');

  // Consents State — never pre-selected
  const [consentsState, setConsentsState] = useState<Record<string, boolean>>({
    pickup_terms: false,
    facility_weighing: false,
    quote_approval: false,
    prohibited_goods: false,
    privacy_notice: false,
  });

  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    message: string;
    trackingNumber?: string;
    pickupReference?: string;
    deadline?: string;
    pickupType?: 'standard' | 'priority';
    pickupFee?: number;
    estimatedWindow?: string;
  } | null>(null);

  if (!isOpen) return null;

  const eligibleQuotes = quotes.filter((q) => q.status !== 'converted' && q.status !== 'expired');
  const eligibleShipments = shipments.filter((s) => {
    const hasActiveJob = pickupJobs.some(
      (j) =>
        (j.shipmentId === s.id || j.trackingNumber === s.trackingNumber) &&
        j.status !== 'cancelled' &&
        j.status !== 'failed'
    );
    return (
      !hasActiveJob &&
      s.status !== 'delivered' &&
      s.status !== 'cancelled' &&
      s.paymentStatus !== 'paid'
    );
  });

  const eligibility = validatePickupEligibility({
    state: stateRegion,
    city,
    pickupType,
    branches,
  });

  const priorityQuote = evaluateCollectionOptions({
    city,
    state: stateRegion,
    branches,
    shipmentCount: 1,
    totalEstimatedWeightKg: estimatedWeightKg,
  }).priorityPickup;
  const priorityFeeNgn = priorityQuote.feeNgn || 3500;
  const currentPickupFeeNgn = pickupType === 'priority' ? priorityFeeNgn : 0;

  const allMandatoryAccepted = MANDATORY_CONSENTS.every(
    (c) => consentsState[c.category]
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5MB.');
      return;
    }

    setPhotoError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPackagePhotoUrl(reader.result);
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleConsent = (category: string) => {
    setConsentsState((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!allMandatoryAccepted) return;
    if (!eligibility.serviceable) {
      setSubmitError(
        `${eligibility.reason || 'Pickup is not available in this state/city.'} ${
          eligibility.fallbackSuggestion || ''
        }`.trim()
      );
      return;
    }
    if (!packagePhotoUrl) {
      setPhotoError('Please upload at least one clear photo of your package for vehicle planning.');
      return;
    }

    setIsSubmitting(true);

    const consentPayload = MANDATORY_CONSENTS.map((c) => ({
      category: c.category,
      statement: c.statement,
      policyVersion: 'v2026.2 (Operational)',
      policyKey: c.policyKey,
    }));

    const res = bookPickupRequest({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      alternateContactName: alternateContactName.trim() || undefined,
      alternateContactPhone: alternateContactPhone.trim() || undefined,
      pickupAddress: pickupAddress.trim(),
      city: city.trim(),
      state: stateRegion.trim(),
      country,
      landmark: landmark.trim() || undefined,
      preferredDate,
      preferredTimeSlot:
        pickupType === 'priority'
          ? priorityQuote.estimatedWindow
          : preferredTimeSlot,
      pickupType,
      pickupFeeNgn: currentPickupFeeNgn,
      estimatedWindow:
        pickupType === 'priority'
          ? priorityQuote.estimatedWindow
          : 'Within 24 hours of confirmation',
      packagePhotoUrl,
      estimatedSizeCategory,
      packageDescription: packageDescription.trim(),
      packageCount,
      estimatedWeightKg,
      specialInstructions: specialInstructions.trim() || undefined,
      isFragile,
      fragileNotes: isFragile ? fragileNotes.trim() || 'Handle with care' : undefined,
      destinationCountry,
      destinationCity: destinationCity.trim() || destinationCountry,
      linkedQuoteRef: linkedRefType === 'quote' && linkedQuoteRef ? linkedQuoteRef : undefined,
      linkedShipmentTracking:
        linkedRefType === 'shipment' && linkedShipmentTracking ? linkedShipmentTracking : undefined,
      consents: consentPayload,
      marketingOptIn,
    });

    setIsSubmitting(false);

    if (res.success) {
      setBookingResult({
        success: true,
        message: res.message,
        trackingNumber: res.trackingNumber,
        pickupReference: res.pickup?.pickupReference,
        deadline: res.pickup?.collectionDeadline,
        pickupType,
        pickupFee: currentPickupFeeNgn,
        estimatedWindow: priorityQuote.estimatedWindow,
      });
      if (onSuccess) onSuccess(res.trackingNumber);
    } else {
      setSubmitError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="sv-card max-w-2xl w-full p-5 sm:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto text-[#1F2937]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[12px] bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center border border-[#90E0EF] shrink-0">
              <Truck className="w-6 h-6 text-[#00B4D8]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="sv-h2">
                  Package Pickup
                </h2>
                <span className="text-[12px] font-medium bg-[#CAF0F8] text-[#0F172A] border border-[#90E0EF] px-2.5 py-0.5 rounded-full">
                  {pickupType === 'standard' ? 'Standard: Free (24h target)' : 'Priority: 1–6h Window'}
                </span>
              </div>
              <p className="sv-label mt-1 max-w-md">
                We collect your package from your address and bring it to our facility. Our team checks, measures and weighs your package after it arrives. We then send you the final shipping price for approval.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close pickup modal"
            className="text-[#4B5563] hover:text-[#111827] p-2 rounded-full hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookingResult ? (
          /* Success Screen with Permanent SWV-, PKP-, and Inline SVG QR Code */
          <div className="py-5 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#CAF0F8] text-[#00B4D8] border border-[#90E0EF] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="sv-h2">
                Pickup Request Confirmed
              </h3>
              <p className="sv-body max-w-md mx-auto">
                {bookingResult.message}
              </p>
            </div>

            {bookingResult.trackingNumber && (
              <div className="flex justify-center">
                <ReferenceQrBadge
                  value={bookingResult.trackingNumber}
                  label="Present or scan at facility intake"
                  size={108}
                />
              </div>
            )}

            <div className="p-4 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-[12px] max-w-md mx-auto text-[14px] space-y-2.5 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="font-semibold text-[#4B5563] dark:text-slate-400">Permanent Shipment Code</span>
                <span className="font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                  {bookingResult.trackingNumber}
                </span>
              </div>
              {bookingResult.pickupReference && (
                <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0] dark:border-slate-800">
                  <span className="font-semibold text-[#4B5563] dark:text-slate-400">Pickup Reference</span>
                  <span className="font-bold text-[#0096C7] dark:text-[#90E0EF] tabular-nums">
                    {bookingResult.pickupReference}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="font-semibold text-[#4B5563] dark:text-slate-400">Pickup Service</span>
                <span className="font-bold text-[#111827] dark:text-white capitalize">
                  {bookingResult.pickupType} Pickup
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="font-semibold text-[#4B5563] dark:text-slate-400">Collection Target</span>
                <span className="font-semibold text-[#111827] dark:text-slate-200 text-right">
                  {bookingResult.pickupType === 'priority'
                    ? bookingResult.estimatedWindow || '1 – 6 hours (subject to availability)'
                    : bookingResult.deadline
                    ? `Within 24 Hours (By ${new Date(bookingResult.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date(bookingResult.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })})`
                    : 'Within 24 Hours of Confirmation'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="font-semibold text-[#4B5563] dark:text-slate-400">Pickup Fee</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {bookingResult.pickupFee && bookingResult.pickupFee > 0
                    ? `₦${bookingResult.pickupFee.toLocaleString()}`
                    : '₦0 (Included Free)'}
                </span>
              </div>
              <div className="text-[13px] text-[#1F2937] dark:text-slate-200 bg-white dark:bg-slate-800 p-3 rounded-[8px] border border-[#E2E8F0] dark:border-slate-700 space-y-1">
                <span className="font-bold text-[#0F172A] dark:text-white block">Next Step: Facility Weighing &amp; Final Quote</span>
                <span>Estimated weight is preliminary. Our intake staff will weigh and measure each package on calibrated scales at our facility and send your final quote for approval.</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="sv-btn-primary px-8 py-2.5 rounded-full cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Pickup Booking Form */
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Step 1: Standard vs Priority Pickup Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1E293B] dark:text-white">
                Choose Pickup Speed
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* OPTION A: Standard Pickup */}
                <button
                  type="button"
                  onClick={() => setPickupType('standard')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    pickupType === 'standard'
                      ? 'border-[#00B4D8] bg-[#CAF0F8]/40 dark:bg-sky-950/50 shadow-xs ring-2 ring-[#00B4D8]/20'
                      : 'border-[#DCEFF3] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#00B4D8]" />
                        <span className="font-bold text-sm text-[#1E293B] dark:text-white">Standard pickup</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Free
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6A808C] dark:text-slate-400 leading-relaxed">
                      Free collection within eligible service areas, with a target of within 24 hours after confirmation.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#DCEFF3] dark:border-slate-700 flex items-center justify-between text-[11px] w-full">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#00B4D8]" />
                      24-hour target
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">₦0</span>
                  </div>
                </button>

                {/* OPTION B: Priority Pickup */}
                <button
                  type="button"
                  disabled={!priorityQuote.available}
                  onClick={() => priorityQuote.available && setPickupType('priority')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                    !priorityQuote.available
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 opacity-70 cursor-not-allowed'
                      : pickupType === 'priority'
                      ? 'border-[#00B4D8] bg-[#CAF0F8]/40 dark:bg-sky-950/50 shadow-xs ring-2 ring-[#00B4D8]/20 cursor-pointer'
                      : 'border-[#DCEFF3] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-sm text-[#1E293B] dark:text-white">Priority pickup</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        {priorityQuote.available ? '1–6h Window' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6A808C] dark:text-slate-400 leading-relaxed">
                      {priorityQuote.available
                        ? 'Request faster collection, with an estimated 1–6-hour window depending on your location and availability.'
                        : priorityQuote.unavailableReason || 'Unavailable in this city — please choose Standard pickup.'}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#DCEFF3] dark:border-slate-700 flex items-center justify-between text-[11px] w-full">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {priorityQuote.estimatedWindow}
                    </span>
                    <span className="font-bold text-[#008EA8] dark:text-[#90E0EF] font-mono">
                      {priorityQuote.available ? `₦${priorityFeeNgn.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Optional Link to Existing Quote (QTE) or Unpaid Shipment (SWV) */}
            {(eligibleQuotes.length > 0 || eligibleShipments.length > 0) && (
              <div className="p-3.5 rounded-[12px] bg-[#CAF0F8]/35 dark:bg-sky-950/30 border border-[#90E0EF] dark:border-sky-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A] dark:text-[#90E0EF]">
                    Link to an Existing Quote or Shipment (Optional)
                  </span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-[8px] border border-[#E2E8F0] dark:border-slate-700">
                    {(['none', 'quote', 'shipment'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setLinkedRefType(mode)}
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold cursor-pointer ${
                          linkedRefType === mode
                            ? 'bg-[#00B4D8] text-white'
                            : 'text-[#4B5563] dark:text-slate-300'
                        }`}
                      >
                        {mode === 'none' ? 'New Request' : mode === 'quote' ? 'Existing QTE' : 'Existing SWV'}
                      </button>
                    ))}
                  </div>
                </div>

                {linkedRefType === 'quote' && (
                  <select
                    value={linkedQuoteRef}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLinkedQuoteRef(val);
                      const q = eligibleQuotes.find((item) => item.quoteRef === val);
                      if (q) {
                        setDestinationCountry(q.destinationCountry);
                        setDestinationCity(q.destinationCity);
                        if (q.items[0]?.declaredWeightKg) setEstimatedWeightKg(q.items[0].declaredWeightKg);
                        if (q.items[0]?.contentsDescription) setPackageDescription(q.items[0].contentsDescription);
                      }
                    }}
                    className="w-full px-3 py-2 text-[12px] rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
                  >
                    <option value="">Select saved QTE reference...</option>
                    {eligibleQuotes.map((q) => (
                      <option key={q.id} value={q.quoteRef}>
                        {q.quoteRef} · {q.destinationCountry} ({q.contactName})
                      </option>
                    ))}
                  </select>
                )}

                {linkedRefType === 'shipment' && (
                  <select
                    value={linkedShipmentTracking}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLinkedShipmentTracking(val);
                      const s = eligibleShipments.find((item) => item.trackingNumber === val);
                      if (s) {
                        setDestinationCountry(s.destinationCountry);
                        setDestinationCity(s.destinationCity);
                        setEstimatedWeightKg(s.declaredWeightKg);
                        setPackageDescription(s.contentsDescription);
                      }
                    }}
                    className="w-full px-3 py-2 text-[12px] rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
                  >
                    <option value="">Select shipment SWV reference (avoids duplicate shipment)...</option>
                    {eligibleShipments.map((s) => (
                      <option key={s.id} value={s.trackingNumber}>
                        {s.trackingNumber} · {s.destinationCountry} ({s.declaredWeightKg} kg)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Step 2: Sender & Pickup Address */}
            <div className="space-y-3 pt-2 border-t border-[#DCEFF3] dark:border-slate-800">
              <h4 className="font-bold text-xs text-[#1E293B] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Pickup Location &amp; Sender Contact</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name or business name"
                    className="w-full px-3 py-2 border border-[#DCEFF3] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#111827] dark:text-white focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3 py-2 border border-[#DCEFF3] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#111827] dark:text-white tabular-nums focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border border-[#DCEFF3] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#111827] dark:text-white focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alternate Contact Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={alternateContactName}
                    onChange={(e) => setAlternateContactName(e.target.value)}
                    placeholder="Gatekeeper / colleague name"
                    className="w-full px-3 py-2 border border-[#DCEFF3] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#111827] dark:text-white focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alternate Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={alternateContactPhone}
                    onChange={(e) => setAlternateContactPhone(e.target.value)}
                    placeholder="+234 ... (used if primary phone is unreachable)"
                    className="w-full px-3 py-2 border border-[#DCEFF3] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#111827] dark:text-white tabular-nums focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Pickup Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl focus:outline-hidden focus:border-[#00B4D8]"
                    placeholder="House/Plot number, street name, estate, area"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    State or Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Country *
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl bg-white focus:outline-hidden focus:border-[#00B4D8]"
                  >
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Prominent Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl focus:outline-hidden focus:border-[#00B4D8]"
                    placeholder="e.g. Near Police Station, junction gate"
                  />
                </div>

                {pickupType === 'standard' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Preferred Pickup Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl focus:outline-hidden focus:border-[#00B4D8]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Preferred Time Window *
                      </label>
                      <select
                        value={preferredTimeSlot}
                        onChange={(e) => setPreferredTimeSlot(e.target.value)}
                        className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl bg-white focus:outline-hidden focus:border-[#00B4D8]"
                      >
                        <option>Morning (09:00 - 13:00)</option>
                        <option>Afternoon (13:00 - 17:00)</option>
                        <option>Anytime within 24 Hours</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Step 3: Package Details & Photo Upload */}
            <div className="space-y-3 pt-2 border-t border-[#DCEFF3]">
              <h4 className="font-bold text-xs text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Package Description &amp; Photo</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    What are you sending? (Package Description) *
                  </label>
                  <input
                    type="text"
                    required
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl focus:outline-hidden focus:border-[#00B4D8]"
                    placeholder="e.g. Traditional clothes, shoes, dried food items"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Number of Packages *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={packageCount}
                    onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Estimated Size Category
                  </label>
                  <select
                    value={estimatedSizeCategory}
                    onChange={(e) => setEstimatedSizeCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl bg-white focus:outline-hidden focus:border-[#00B4D8]"
                  >
                    <option value="small">Small Parcel (e.g. document pouch, shoebox)</option>
                    <option value="medium">Medium Box (e.g. standard carton)</option>
                    <option value="large">Large Package (e.g. heavy carton, suitcase)</option>
                    <option value="multiple">Multiple Combined Packages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Estimated Weight in kg (Optional estimate)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={estimatedWeightKg}
                    onChange={(e) => setEstimatedWeightKg(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-xl focus:outline-hidden focus:border-[#00B4D8]"
                    placeholder="Optional guess (actual weight is taken at facility)"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Country *
                  </label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#111827] dark:text-white focus:outline-hidden focus:border-[#00B4D8]"
                  >
                    {DESTINATION_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination City *
                  </label>
                  <input
                    type="text"
                    required
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    placeholder="e.g. London, Toronto, Houston"
                    className="w-full px-3 py-2 border border-[#DCEFF3] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#111827] dark:text-white focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Additional Pickup Instructions
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#111827] dark:text-white focus:outline-hidden focus:border-[#00B4D8]"
                    placeholder="e.g. Ring doorbell, call before coming"
                  />
                </div>

                <div className="sm:col-span-2 p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700 space-y-2">
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-[#111827] dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFragile}
                      onChange={(e) => setIsFragile(e.target.checked)}
                      className="rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                    />
                    <span>Package contains fragile items (glassware, electronics, delicate items)</span>
                  </label>
                  {isFragile && (
                    <input
                      type="text"
                      value={fragileNotes}
                      onChange={(e) => setFragileNotes(e.target.value)}
                      placeholder="Handling notes for collector & warehouse staff (e.g. keep upright)"
                      className="w-full px-3 py-2 border border-[#CBD5E1] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#111827] dark:text-white text-[12px]"
                    />
                  )}
                </div>
              </div>

              {/* Live Serviceability Warning & Preliminary Weight Disclosure */}
              {!eligibility.serviceable && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-[12px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="space-y-1">
                    <div className="font-bold">Pickup Not Serviceable in Selected Zone</div>
                    <div>{eligibility.reason}</div>
                    {eligibility.fallbackSuggestion && (
                      <div className="font-medium text-rose-800 dark:text-rose-300">
                        Recommended alternative: {eligibility.fallbackSuggestion}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#CAF0F8]/50 dark:bg-sky-950/40 border border-[#90E0EF] dark:border-sky-800 text-[#0F172A] dark:text-[#90E0EF] text-[12px] flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#00B4D8]" />
                <span>
                  <strong>Preliminary Weight Notice:</strong> Estimated weight is only for vehicle planning. Your final international shipping price is calculated strictly after calibrated digital weighing and box dimensions check at our facility.
                </span>
              </div>

              {/* Photo Upload Area */}
              <div className="p-3.5 bg-[#F7FCFD] border border-[#DCEFF3] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#1E293B] flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#00B4D8]" />
                    <span>Package Photo (Required for Vehicle Dispatch)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">1 Photo Required</span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Our operations team uses this photo to send the right vehicle (bike, car, or van) for your package load. It does NOT replace the weighing and inspection at our facility, and does NOT set the final shipping price.
                </p>

                {photoPreview ? (
                  <div className="flex items-center gap-4 pt-1">
                    <img
                      src={photoPreview}
                      alt="Package preview"
                      className="w-20 h-20 rounded-xl object-cover border border-[#DCEFF3] shadow-xs"
                    />
                    <div className="space-y-1.5 text-xs">
                      <span className="font-bold text-emerald-700 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                      </span>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCEFF3] hover:border-[#00B4D8] text-slate-700 rounded-lg font-semibold cursor-pointer text-[11px] transition-colors">
                        <RefreshCw className="w-3.5 h-3.5 text-[#00B4D8]" />
                        <span>Replace Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#90E0EF] rounded-xl bg-white hover:bg-[#CAF0F8]/20 cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-[#00B4D8] mb-1" />
                    <span className="font-bold text-[11px] text-[#008EA8]">Upload clear photo of your carton</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}

                {photoError && (
                  <p className="text-[11px] text-rose-600 font-medium">{photoError}</p>
                )}
              </div>
            </div>

            {/* Step 4: Simple Mandatory Consents Checkpoints */}
            <div className="space-y-2.5 pt-2 border-t border-[#DCEFF3] dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-[#1E293B] dark:text-white uppercase tracking-wider">
                  Important Agreements
                </span>
                {onOpenPolicy && (
                  <button
                    type="button"
                    onClick={() => onOpenPolicy('pickup')}
                    className="text-[11px] text-[#008EA8] dark:text-[#90E0EF] hover:underline font-semibold"
                  >
                    View Pickup Policy
                  </button>
                )}
              </div>

              <div className="space-y-2 bg-[#F7FCFD] dark:bg-slate-800/70 p-3 rounded-2xl border border-[#DCEFF3] dark:border-slate-700">
                {MANDATORY_CONSENTS.map((item) => (
                  <label
                    key={item.category}
                    className="flex items-start gap-2.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!consentsState[item.category]}
                      onChange={() => handleToggleConsent(item.category)}
                      className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                    />
                    <span className="leading-snug">
                      <strong className="text-[#1E293B] dark:text-white">{item.title}:</strong> {item.statement}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Error Banner */}
            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-[12px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Total and Submit Button */}
            <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left w-full sm:w-auto">
                <span className="sv-label block">Applicable Pickup Fee</span>
                <span className="font-extrabold text-[18px] text-[#111827] dark:text-white tabular-nums">
                  {currentPickupFeeNgn > 0 ? `₦${currentPickupFeeNgn.toLocaleString()} (Priority)` : '₦0 (Standard Free)'}
                </span>
                <span className="sv-label block">
                  International air carriage quoted separately after certified facility weighing.
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-[#CBD5E1] dark:border-slate-700 text-[#111827] dark:text-slate-200 rounded-full font-semibold hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors w-1/2 sm:w-auto text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !allMandatoryAccepted || !eligibility.serviceable}
                  className="sv-btn-primary px-6 py-2.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-1/2 sm:w-auto cursor-pointer"
                >
                  <span>{isSubmitting ? 'Confirming...' : 'Confirm Pickup Request'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
