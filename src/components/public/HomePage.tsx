import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  SUPPORTED_ORIGINS,
  SUPPORTED_DESTINATIONS,
  evaluateRouteAvailability,
  generateQuoteBreakdown,
  formatNaira,
} from '../../utils/shipping-calculator';
import {
  QuoteOptionCard,
  QuoteOptionDetailsModal,
  QuoteOptionDetailSpec,
  PriceBreakdownList,
  UnitSuffixInput,
  OptionalServiceAccordion,
} from '../common/DhlStylePrimitives';
import {
  ArrowRight,
  Search,
  Package,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Scale,
  Briefcase,
  AlertCircle,
  Truck,
  HelpCircle,
  FileCheck2,
  Star,
  BookmarkCheck,
} from 'lucide-react';
import { getPublicApprovedReviews } from '../../utils/review-rules';
import {
  isShippingInsuranceAvailable,
  calculateAdminGatedInsurancePremium,
} from '../../utils/adjustment-engine';
import { QuoteRecord } from '../../types';

interface HomePageProps {
  onOpenQuote: () => void;
  onOpenBookPickup: () => void;
  onOpenTrack: () => void;
  onOpenRetrieveQuote?: (code?: string) => void;
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  onOpenComingSoon: () => void;
  onNavigateToSwiftShare?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenQuote,
  onOpenBookPickup,
  onOpenTrack,
  onOpenRetrieveQuote,
  onOpenAuth,
}) => {
  const {
    reviews,
    setActivePublicNav,
    setSelectedShipmentForTracking,
    adminFeatureFlags,
    saveGuestQuote,
    currentCustomer,
    role,
  } = useDemo();
  const approvedReviews = getPublicApprovedReviews(reviews);

  // Route & Quick Estimator State
  const [originCountry, setOriginCountry] = useState('Nigeria');
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [calcWeightStr, setCalcWeightStr] = useState('3.0');
  const [calcTier, setCalcTier] = useState<'standard' | 'priority'>('standard');
  const [fragileCareSelected, setFragileCareSelected] = useState(false);
  const [cratingSelected, setCratingSelected] = useState(false);
  const [insuranceOptIn, setInsuranceOptIn] = useState(false);
  const [detailModalOption, setDetailModalOption] = useState<QuoteOptionDetailSpec | null>(null);

  // Journey A: Save Instant Estimate as Quote (QTE-YY-XXXXXX)
  const [saveQuoteDrawerOpen, setSaveQuoteDrawerOpen] = useState(false);
  const [saveContactName, setSaveContactName] = useState(role !== 'visitor' ? currentCustomer.name : '');
  const [saveContactEmail, setSaveContactEmail] = useState(role !== 'visitor' ? currentCustomer.email : '');
  const [saveContactPhone, setSaveContactPhone] = useState(role !== 'visitor' ? currentCustomer.phone : '');
  const [saveQuoteError, setSaveQuoteError] = useState<string | null>(null);
  const [savedQuoteRecord, setSavedQuoteRecord] = useState<QuoteRecord | null>(null);

  // Journey A: Unconfirmed Route Manual Enquiry (QTE-YY-XXXXXX)
  const [enquiryContactName, setEnquiryContactName] = useState(role !== 'visitor' ? currentCustomer.name : '');
  const [enquiryContactEmail, setEnquiryContactEmail] = useState(role !== 'visitor' ? currentCustomer.email : '');
  const [enquiryContactPhone, setEnquiryContactPhone] = useState(role !== 'visitor' ? currentCustomer.phone : '');
  const [enquiryNotes, setEnquiryNotes] = useState('');
  const [enquiryError, setEnquiryError] = useState<string | null>(null);
  const [submittedEnquiryQuote, setSubmittedEnquiryQuote] = useState<QuoteRecord | null>(null);

  // Tracking Entry State
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const calcWeight = Math.max(0.5, parseFloat(calcWeightStr) || 0.5);
  const routeEvaluation = evaluateRouteAvailability(originCountry, destinationCountry);
  const destConfig = SUPPORTED_DESTINATIONS[destinationCountry];
  const prioritySupported = Boolean(destConfig?.prioritySupported);
  const insuranceAvailable = isShippingInsuranceAvailable(adminFeatureFlags);
  const estimatedInsuranceFee = insuranceAvailable
    ? calculateAdminGatedInsurancePremium({ declaredValueNgn: 100000, flags: adminFeatureFlags }).premiumNgn
    : 0;

  const standardQuote = generateQuoteBreakdown({
    destinationCountry,
    actualWeightKg: calcWeight,
    lengthCm: 25,
    widthCm: 20,
    heightCm: 15,
    tier: 'standard',
    pickupRequired: true,
  });

  const priorityQuote = generateQuoteBreakdown({
    destinationCountry,
    actualWeightKg: calcWeight,
    lengthCm: 25,
    widthCm: 20,
    heightCm: 15,
    tier: 'priority',
    pickupRequired: true,
  });

  const effectiveTier = calcTier === 'priority' && prioritySupported ? 'priority' : 'standard';
  const activeQuote = effectiveTier === 'priority' ? priorityQuote : standardQuote;
  const optionalServicesTotal =
    (fragileCareSelected ? 3500 : 0) +
    (cratingSelected ? 4500 : 0) +
    (insuranceAvailable && insuranceOptIn ? estimatedInsuranceFee : 0);
  const grandTotalEstimate = activeQuote.totalAmount + optionalServicesTotal;

  const quoteOptionSpecs: QuoteOptionDetailSpec[] = [
    {
      id: 'standard',
      badge: 'Standard Value',
      badgeTone: 'neutral',
      title: 'Standard Air Courier',
      subtitle: 'Consolidated international air dispatch with free doorstep pickup.',
      estimatedCostNgn: standardQuote.totalAmount + optionalServicesTotal,
      deliveryWindow: standardQuote.estimatedDeliveryDisplay,
      selected: effectiveTier === 'standard',
      ctaLabel: 'Book Standard',
      includedItems: [
        'Free doorstep collection across active Lagos & Abuja zones',
        'Certified digital scale and volumetric intake check',
        'Air cargo linehaul, airport screening & 7.5% statutory VAT',
        'Proactive tracking alerts if scan updates exceed threshold',
      ],
      exclusions: [
        'Destination import customs duties and local taxes are assessed by destination customs.',
      ],
      disclaimer:
        'Online estimates are finalized only after calibrated scale verification at our Ikeja intake hub.',
    },
    {
      id: 'priority',
      badge: prioritySupported ? 'Fastest Lane' : 'Route Unsupported',
      badgeTone: prioritySupported ? 'cyan' : 'warning',
      title: 'Priority Air Express',
      subtitle: prioritySupported
        ? 'Expedited counter tender on the next available commercial flight.'
        : `Priority tier is unavailable for ${destinationCountry}; Standard Air Courier applies.`,
      estimatedCostNgn: priorityQuote.totalAmount + optionalServicesTotal,
      deliveryWindow: prioritySupported ? priorityQuote.estimatedDeliveryDisplay : 'Unavailable',
      selected: effectiveTier === 'priority',
      disabled: !prioritySupported,
      disabledNote: 'Priority not offered on this corridor',
      ctaLabel: prioritySupported ? 'Book Priority' : 'Unavailable on Route',
      includedItems: [
        'Next-flight commercial cargo tender from Lagos (LOS) or Abuja (ABV)',
        'Priority intake queue and expedited export documentation check',
        '12-hour scan freshness threshold with operations escalation',
        '7.5% VAT and security screening included',
      ],
      exclusions: [
        'Not a guaranteed next-day courier commitment; customs clearance times vary by destination.',
      ],
      disclaimer:
        'Carrier service selection and pricing are locked upon customer approval after intake verification.',
    },
  ];

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingInput.trim().toUpperCase();
    if (!code) {
      setTrackingError('Please enter your Swiftvero shipment code.');
      return;
    }
    if (!code.startsWith('SWV-') && !code.startsWith('SW-')) {
      setTrackingError('Shipment codes typically start with SWV- (e.g. SWV-2026-NG8491).');
      return;
    }
    setTrackingError(null);
    setSelectedShipmentForTracking(code);
    setActivePublicNav('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickTrackSample = (code: string) => {
    setTrackingInput(code);
    setTrackingError(null);
    setSelectedShipmentForTracking(code);
    setActivePublicNav('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveInstantEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveContactName.trim() || (!saveContactEmail.trim() && !saveContactPhone.trim())) {
      setSaveQuoteError('Enter your name and either an email address or phone number to generate a QTE quote reference.');
      return;
    }
    setSaveQuoteError(null);
    const created = saveGuestQuote({
      type: 'instant_estimate',
      contactName: saveContactName.trim(),
      contactEmail: saveContactEmail.trim() || undefined,
      contactPhone: saveContactPhone.trim() || undefined,
      senderState: 'Lagos',
      senderCity: 'Lagos',
      collectionMethod: 'standard_pickup',
      items: [
        {
          id: 'est_1',
          originCountry,
          originCity: 'Lagos',
          destinationCountry,
          destinationCity: destinationCountry === 'United Kingdom' ? 'London' : 'Destination City',
          serviceTier: effectiveTier,
          contentsDescription: 'Estimated general air parcel',
          packageCount: 1,
          declaredWeightKg: calcWeight,
          declaredDimensions: { length: 25, width: 20, height: 15 },
          declaredValueNgn: 100000,
          isFragile: fragileCareSelected,
        },
      ],
      quoteBreakdown: activeQuote,
      totalEstimatedNgn: grandTotalEstimate,
      enquiryNotes: `Home calculator saved estimate (${effectiveTier})`,
    });
    setSavedQuoteRecord(created);
  };

  const handleSubmitManualRouteEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryContactName.trim() || (!enquiryContactEmail.trim() && !enquiryContactPhone.trim())) {
      setEnquiryError('Please provide your name and email or phone so Customer Service can reply with a QTE quotation.');
      return;
    }
    setEnquiryError(null);
    const created = saveGuestQuote({
      type: 'manual_enquiry',
      contactName: enquiryContactName.trim(),
      contactEmail: enquiryContactEmail.trim() || undefined,
      contactPhone: enquiryContactPhone.trim() || undefined,
      senderState: 'Lagos',
      senderCity: 'Lagos',
      items: [
        {
          id: 'enq_1',
          originCountry,
          originCity: 'Lagos',
          destinationCountry,
          destinationCity: destinationCountry,
          serviceTier: 'standard',
          contentsDescription: enquiryNotes.trim() || `Manual route enquiry: ${originCountry} to ${destinationCountry}`,
          packageCount: 1,
          declaredWeightKg: calcWeight,
          declaredValueNgn: 100000,
          isFragile: false,
        },
      ],
      totalEstimatedNgn: 0,
      enquiryNotes:
        enquiryNotes.trim() ||
        `Unconfirmed corridor request (${originCountry} → ${destinationCountry}, ~${calcWeight} kg)`,
    });
    setSubmittedEnquiryQuote(created);
  };

  const faqItems = [
    {
      q: 'How does international shipping work?',
      a: 'Book your shipment online, and we arrange a free doorstep collection from your address in Nigeria (or you can drop off at our intake depot). Our operations team checks, measures, and weighs your package on certified scales at our facility, then sends you the final transparent shipping quotation for your approval before payment and air dispatch.',
    },
    {
      q: 'How is my shipping cost calculated?',
      a: 'Air shipping is calculated based on billable weight—which is the greater of actual scale weight (in kg) and volumetric weight (Length × Width × Height in cm ÷ 5,000). The final price includes air carriage linehaul, mandatory airport security screening, and statutory VAT. Doorstep collection is completely free on all standard bookings.',
    },
    {
      q: 'Is pickup available in my area?',
      a: 'Free doorstep pickup is currently active across Lagos State and Abuja (FCT), with collections scheduled within 24 hours of booking confirmation. For other states in Nigeria, packages can be dispatched to our Lagos intake hub or handed over at verified drop-off points.',
    },
    {
      q: 'How do I track my shipment?',
      a: 'Enter your unique Swiftvero shipment code (e.g. SWV-2026-NG8491) into the tracking box at the top of any page. You will see every confirmed scan milestone from intake inspection and customs clearance to international flight departures and out-for-delivery status.',
    },
    {
      q: 'What items are prohibited?',
      a: 'Under Nigerian Civil Aviation Authority (NCAA) and international air cargo rules, prohibited goods include standalone lithium batteries, pressurized aerosol sprays, flammable liquids, unsealed perishables, raw meat, currency, weapons, and counterfeit items.',
    },
    {
      q: 'Who pays customs duties and taxes?',
      a: 'Destination customs duties and import taxes are determined by the destination country customs authority based on the declared contents and local import thresholds. Typically, duties are payable by the recipient upon arrival unless pre-arranged on an approved commercial B2B account.',
    },
    {
      q: 'What happens if my shipment is delayed?',
      a: 'Our proactive tracking system automatically detects scan gaps or unexpected hold-ups. Instead of making you chase support, we send you an honest, transparent update explaining what is confirmed and assigning an operations officer to monitor your package until delivery.',
    },
  ];

  return (
    <div className="space-y-14 sm:space-y-20 pb-20 text-[#1F2937] dark:text-slate-100 transition-colors duration-200">
      {/* 1. Hero Section */}
      <section className="pt-8 sm:pt-12 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800">
              International Logistics from Nigeria
            </span>

            <h1 className="sv-h1">
              Ship internationally with transparent rates and verified intake weights.
            </h1>

            <p className="sv-body text-[#4B5563] dark:text-slate-300 max-w-xl">
              Book shipments, inspect itemized shipping quotations after certified facility weighing, and follow confirmed parcel milestones through one clear platform.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenBookPickup}
                  className="min-h-[46px] px-7 py-2.5 text-[15px] font-bold tracking-[0.01em] text-white bg-[#00B4D8] hover:bg-[#0096C7] rounded-full transition-all shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>Book a Pickup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenQuote}
                  className="min-h-[46px] px-6 py-2.5 text-[15px] font-bold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/60 hover:bg-[#90E0EF]/50 border border-[#90E0EF] dark:border-sky-800 rounded-full transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>Get a Quote</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenTrack}
                  className="min-h-[46px] px-6 py-2.5 text-[15px] font-bold text-[#111827] dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-[#F1F5F9] dark:hover:bg-slate-700 border border-[#CBD5E1] dark:border-slate-700 rounded-full transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-4 h-4 text-[#00B4D8]" />
                  <span>Track a Shipment</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {onOpenRetrieveQuote && (
                  <button
                    type="button"
                    onClick={() => onOpenRetrieveQuote()}
                    className="text-[13px] font-semibold text-[#0F172A] dark:text-[#90E0EF] underline underline-offset-4 hover:text-[#00B4D8] transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Retrieve saved quote (QTE)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActivePublicNav('services')}
                  className="text-[13px] font-semibold text-[#0F172A] dark:text-[#90E0EF] underline underline-offset-4 hover:text-[#00B4D8] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore personal &amp; commercial air shipping options →</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
              <div className="flex items-center gap-2 font-semibold text-[#111827] dark:text-slate-200">
                <Truck className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Free Doorstep Pickup</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-[#111827] dark:text-slate-200">
                <Scale className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Certified Digital Scales</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-[#111827] dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>No Payment Before Approval</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sv-card overflow-hidden">
              <img
                src="/assets/aistudio/IMG_2157_4ea4d13f.jpeg"
                alt="Swiftvero courier collecting a packaged shipment from a customer at doorstep in Lagos"
                className="w-full h-80 sm:h-96 object-cover object-center"
                loading="eager"
              />
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800">
                <p className="text-[14px] text-[#111827] dark:text-slate-200 font-semibold">
                  Doorstep collection and air carriage coordination out of Lagos, Nigeria.
                </p>
                <p className="text-[12px] font-medium text-[#4B5563] dark:text-slate-400 mt-0.5">
                  Every parcel is verified on calibrated digital scales before final quotation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Tracking Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="sv-card p-5 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="sv-h2 flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#00B4D8]" />
                  <span>Track Your Shipment</span>
                </h2>
                <p className="text-[13px] font-medium text-[#4B5563] dark:text-slate-400 mt-0.5">
                  Enter your Swiftvero shipment code to view confirmed transit milestones.
                </p>
              </div>
              <span className="text-[12px] font-medium text-[#4B5563] dark:text-slate-400">
                Format:{' '}
                <code className="font-semibold text-[#111827] dark:text-slate-200 bg-[#F1F5F9] dark:bg-slate-700 px-2 py-0.5 rounded-[6px] tabular-nums">
                  SWV-XXXXXX
                </code>
              </span>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => {
                      setTrackingInput(e.target.value);
                      if (trackingError) setTrackingError(null);
                    }}
                    placeholder="Enter Swiftvero shipment code (e.g. SWV-2026-NG8491)"
                    className="sv-input w-full min-h-[46px] px-4 py-2.5 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 tabular-nums uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[46px] px-7 py-2.5 text-[15px] font-bold tracking-[0.01em] text-white bg-[#00B4D8] hover:bg-[#0096C7] rounded-full transition-colors whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Package</span>
                </button>
              </div>

              {trackingError && (
                <div className="text-[13px] font-medium text-[#B42318] dark:text-rose-400 flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{trackingError}</span>
                </div>
              )}
            </form>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px] font-medium text-[#4B5563] dark:text-slate-400">
              <span>Demo sample codes:</span>
              <button
                type="button"
                onClick={() => handleQuickTrackSample('SWV-2026-NG8491')}
                className="font-semibold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/60 px-3 py-1 rounded-full border border-[#90E0EF] dark:border-sky-800 hover:bg-[#90E0EF]/50 transition-colors tabular-nums cursor-pointer"
              >
                SWV-2026-NG8491 (In Transit)
              </button>
              <button
                type="button"
                onClick={() => handleQuickTrackSample('SWV-2026-NG3102')}
                className="font-semibold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/60 px-3 py-1 rounded-full border border-[#90E0EF] dark:border-sky-800 hover:bg-[#90E0EF]/50 transition-colors tabular-nums cursor-pointer"
              >
                SWV-2026-NG3102 (Delivered)
              </button>
              <button
                type="button"
                onClick={() =>
                  onOpenRetrieveQuote
                    ? onOpenRetrieveQuote('SWV-2026-NG5519')
                    : handleQuickTrackSample('SWV-2026-NG5519')
                }
                className="font-semibold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors tabular-nums cursor-pointer"
              >
                SWV-2026-NG5519 (Quote Ready)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DHL-Benchmark Route Estimator & Available Shipping Options */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="sv-card p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] dark:border-slate-800 pb-5">
            <div className="space-y-1.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800">
                Transparent Rate Calculator
              </span>
              <h2 className="sv-h2">Available shipping options</h2>
              <p className="text-[14px] text-[#4B5563] dark:text-slate-400">
                Compare Standard and Priority international rates with live corridor verification.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenQuote}
              className="text-[13px] font-bold text-[#0F172A] dark:text-[#90E0EF] underline underline-offset-4 hover:text-[#00B4D8] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Open Full Booking Workflow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Route & Weight Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                Origin Country <span className="text-[#B42318]">*</span>
              </label>
              <select
                value={originCountry}
                onChange={(e) => {
                  setOriginCountry(e.target.value);
                  setSubmittedEnquiryQuote(null);
                  setSavedQuoteRecord(null);
                }}
                className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
              >
                {SUPPORTED_ORIGINS.map((origin) => (
                  <option key={origin.code} value={origin.country}>
                    {origin.country} {origin.country === 'Nigeria' ? '(Primary Hub)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                Destination Country <span className="text-[#B42318]">*</span>
              </label>
              <select
                value={destinationCountry}
                onChange={(e) => {
                  setDestinationCountry(e.target.value);
                  setSubmittedEnquiryQuote(null);
                  setSavedQuoteRecord(null);
                }}
                className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
              >
                {Object.keys(SUPPORTED_DESTINATIONS).map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
                <option value="Greenland">Greenland (Remote / Unconfirmed)</option>
                <option value="Iceland">Iceland (Remote / Unconfirmed)</option>
              </select>
            </div>

            <UnitSuffixInput
              label="Estimated Scale Weight"
              unit="kg"
              required
              isValid={calcWeight >= 0.5}
              min="0.5"
              step="0.5"
              value={calcWeightStr}
              onChange={setCalcWeightStr}
              helperText="Minimum 0.5 kg · Verified at intake facility"
            />
          </div>

          {routeEvaluation.isConfirmed ? (
            <div className="space-y-6">
              {/* Two QuoteOptionCards side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {quoteOptionSpecs.map((spec) => (
                  <QuoteOptionCard
                    key={spec.id}
                    option={spec}
                    onSelect={() => {
                      if (!spec.disabled) {
                        setCalcTier(spec.id as 'standard' | 'priority');
                      }
                    }}
                    onViewDetails={(opt) => setDetailModalOption(opt)}
                  />
                ))}
              </div>

              {/* Optional Services Expandable Accordions + Live Price Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="sv-h3">Optional Services</h3>
                  <OptionalServiceAccordion
                    title="Fragile Handling & Reinforced Cushioning"
                    priceLabel="+₦3,500"
                    description="Double-walled foam lining and priority upright bay placement during Ikeja consolidation and air tender."
                    checked={fragileCareSelected}
                    onToggle={setFragileCareSelected}
                  />
                  <OptionalServiceAccordion
                    title="Export-Grade Crating & Moisture Seal"
                    priceLabel="+₦4,500"
                    description="Heavy-duty shrink-wrap barrier and corner strapping for textile, fashion, or electronics cartons."
                    checked={cratingSelected}
                    onToggle={setCratingSelected}
                  />
                  {insuranceAvailable && (
                    <OptionalServiceAccordion
                      title={`Shipping Insurance (${adminFeatureFlags.insurerName || 'Underwritten Coverage'})`}
                      priceLabel={`+${formatNaira(estimatedInsuranceFee)}`}
                      description={`Optional transit protection on ₦100,000 declared value (${adminFeatureFlags.insurerRatePercentage}% rate, min declared value ${formatNaira(adminFeatureFlags.insurerMinDeclaredValueNgn)}).`}
                      checked={insuranceOptIn}
                      onToggle={setInsuranceOptIn}
                    />
                  )}
                </div>

                {/* *Price Breakdown Card */}
                <div className="lg:col-span-5 rounded-[12px] bg-[#CAF0F8] dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 p-5 sm:p-6 space-y-4 text-[#0F172A] dark:text-white">
                  <div className="flex items-center justify-between border-b border-[#90E0EF] dark:border-sky-800 pb-3">
                    <h2 className="text-[20px] font-bold text-[#0F172A] dark:text-white">
                      *Price Breakdown
                    </h2>
                    <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-900 border border-[#90E0EF] dark:border-sky-700">
                      {effectiveTier === 'priority' ? 'Priority Express' : 'Standard Courier'}
                    </span>
                  </div>

                  <div className="bg-white/85 dark:bg-slate-900/90 rounded-[10px] p-4">
                    <PriceBreakdownList
                      items={[
                        {
                          label: `Net Air Carriage (${activeQuote.chargeableWeightKg} kg)`,
                          value: formatNaira(activeQuote.freightCharge),
                        },
                        {
                          label: 'Airport Handling & Jet Fuel',
                          value: formatNaira(
                            activeQuote.handlingCharge + activeQuote.jetFuelSurcharge
                          ),
                        },
                        {
                          label: 'Doorstep Pickup (Nigeria)',
                          value: 'Free (₦0)',
                        },
                        ...(fragileCareSelected
                          ? [{ label: 'Fragile Handling Cushioning', value: formatNaira(3500) }]
                          : []),
                        ...(cratingSelected
                          ? [{ label: 'Export Moisture Seal', value: formatNaira(4500) }]
                          : []),
                        ...(insuranceAvailable && insuranceOptIn
                          ? [{ label: 'Shipping Insurance', value: formatNaira(estimatedInsuranceFee) }]
                          : []),
                        {
                          label: 'Statutory VAT (7.5%)',
                          value: formatNaira(activeQuote.vatAmount),
                        },
                        {
                          label: 'Gross Price*',
                          value: `${formatNaira(grandTotalEstimate)}*`,
                          tone: 'total',
                        },
                      ]}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={onOpenQuote}
                      className="w-full min-h-[46px] px-6 py-2.5 rounded-full bg-[#00B4D8] hover:bg-[#0096C7] text-white text-[15px] font-bold tracking-[0.01em] flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <span>Continue to Book Shipment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSaveQuoteDrawerOpen((prev) => !prev);
                        setSavedQuoteRecord(null);
                      }}
                      className="w-full min-h-[42px] px-5 py-2 rounded-full bg-white/90 dark:bg-slate-900 text-[#0F172A] dark:text-[#90E0EF] border border-[#00B4D8] hover:bg-white text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <BookmarkCheck className="w-4 h-4 text-[#00B4D8]" />
                      <span>Save Estimate (Get QTE Ref)</span>
                    </button>
                  </div>

                  {saveQuoteDrawerOpen && (
                    <div className="p-4 rounded-[10px] bg-white dark:bg-slate-900 border border-[#90E0EF] dark:border-sky-800 space-y-3">
                      {savedQuoteRecord ? (
                        <div className="space-y-2 text-[13px]">
                          <div className="font-bold text-[#247347] dark:text-emerald-400">
                            Quote Saved — No account or shipment created yet
                          </div>
                          <div className="p-2.5 rounded-[8px] bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] font-bold tabular-nums flex items-center justify-between gap-2">
                            <span>Ref: {savedQuoteRecord.quoteRef}</span>
                            {onOpenRetrieveQuote && (
                              <button
                                type="button"
                                onClick={() => onOpenRetrieveQuote(savedQuoteRecord.quoteRef)}
                                className="underline text-[12px] cursor-pointer"
                              >
                                Retrieve Quote →
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveInstantEstimate} className="space-y-2.5 text-[13px]">
                          <div className="font-bold text-[#111827] dark:text-white">
                            Save this estimate under a QTE reference
                          </div>
                          <input
                            type="text"
                            value={saveContactName}
                            onChange={(e) => setSaveContactName(e.target.value)}
                            placeholder="Your full name *"
                            className="sv-input w-full min-h-[38px] px-3 py-1.5 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="email"
                              value={saveContactEmail}
                              onChange={(e) => setSaveContactEmail(e.target.value)}
                              placeholder="Email address"
                              className="sv-input w-full min-h-[38px] px-3 py-1.5 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                            />
                            <input
                              type="tel"
                              value={saveContactPhone}
                              onChange={(e) => setSaveContactPhone(e.target.value)}
                              placeholder="Phone (+234...)"
                              className="sv-input w-full min-h-[38px] px-3 py-1.5 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white tabular-nums"
                            />
                          </div>
                          {saveQuoteError && (
                            <p className="text-[12px] text-[#B42318] dark:text-rose-400 font-medium">{saveQuoteError}</p>
                          )}
                          <button
                            type="submit"
                            className="w-full min-h-[38px] px-4 py-1.5 rounded-full bg-[#00B4D8] hover:bg-[#0096C7] text-white font-bold cursor-pointer"
                          >
                            Generate QTE Reference
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Unconfirmed Route Fallback — Creates Genuine Manual Enquiry (QTE-YY-XXXXXX) */
            <div className="p-6 rounded-[12px] bg-[#F1F5F9] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 space-y-4">
              <div className="flex items-start gap-3 text-[#986B16] dark:text-amber-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="sv-h3">Route availability needs to be confirmed.</h3>
                  <p className="text-[14px] text-[#4B5563] dark:text-slate-400 mt-1">
                    {routeEvaluation.message ||
                      `Direct commercial air cargo between ${originCountry} and ${destinationCountry} is currently subject to carrier confirmation.`}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-[10px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[13px] font-medium text-amber-900 dark:text-amber-300">
                Swiftvero never charges upfront for unconfirmed routes. Submit a manual quote enquiry to our Customer Service Quote Desk and receive a tracked QTE reference.
              </div>

              {submittedEnquiryQuote ? (
                <div className="p-4 rounded-[10px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[14px] text-[#247347] dark:text-emerald-300 space-y-2">
                  <div className="font-bold">
                    ✓ Manual Quote Enquiry logged with Customer Service Desk ({submittedEnquiryQuote.quoteRef}).
                  </div>
                  <p className="text-[13px]">
                    No shipment or pickup job was created. You can track desk replies via Retrieve Quote using <strong className="tabular-nums">{submittedEnquiryQuote.quoteRef}</strong>.
                  </p>
                  {onOpenRetrieveQuote && (
                    <button
                      type="button"
                      onClick={() => onOpenRetrieveQuote(submittedEnquiryQuote.quoteRef)}
                      className="text-[13px] font-bold underline cursor-pointer"
                    >
                      Open in Retrieve Quote →
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitManualRouteEnquiry} className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-[10px] border border-[#E2E8F0] dark:border-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={enquiryContactName}
                      onChange={(e) => setEnquiryContactName(e.target.value)}
                      placeholder="Full Name *"
                      className="sv-input min-h-[40px] px-3 py-2 text-[13px] rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
                    />
                    <input
                      type="email"
                      value={enquiryContactEmail}
                      onChange={(e) => setEnquiryContactEmail(e.target.value)}
                      placeholder="Email Address"
                      className="sv-input min-h-[40px] px-3 py-2 text-[13px] rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
                    />
                    <input
                      type="tel"
                      value={enquiryContactPhone}
                      onChange={(e) => setEnquiryContactPhone(e.target.value)}
                      placeholder="Phone (+234...)"
                      className="sv-input min-h-[40px] px-3 py-2 text-[13px] rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white tabular-nums"
                    />
                  </div>
                  <input
                    type="text"
                    value={enquiryNotes}
                    onChange={(e) => setEnquiryNotes(e.target.value)}
                    placeholder="Optional notes: parcel contents, target date, or city"
                    className="sv-input w-full min-h-[40px] px-3 py-2 text-[13px] rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
                  />
                  {enquiryError && (
                    <p className="text-[12px] text-[#B42318] dark:text-rose-400 font-medium">{enquiryError}</p>
                  )}
                  <button
                    type="submit"
                    className="min-h-[44px] px-6 py-2.5 text-[14px] font-bold text-white bg-[#00B4D8] hover:bg-[#0096C7] rounded-full transition-colors cursor-pointer"
                  >
                    Submit Manual Quote Enquiry (Get QTE Ref)
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. How Shipping Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-7">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800">
            Simple Shipping Process
          </span>
          <h2 className="sv-h2">How Shipping Works</h2>
          <p className="sv-body text-[#4B5563] dark:text-slate-400">
            Three clear steps from your doorstep in Nigeria to international delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Book',
              desc: 'Enter your shipment details and select an available collection or drop-off option.',
            },
            {
              step: '2',
              title: 'We inspect and quote',
              desc: 'We receive your package, verify measurements on certified scales, and issue your final quotation.',
            },
            {
              step: '3',
              title: 'Approve, pay and track',
              desc: 'Approve your quotation, complete payment, and follow confirmed milestones until delivery.',
            },
          ].map((item) => (
            <div key={item.step} className="sv-card p-6 sm:p-7 space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] font-extrabold text-[15px] flex items-center justify-center border border-[#90E0EF] dark:border-sky-800 tabular-nums">
                {item.step}
              </div>
              <h3 className="sv-h3">{item.title}</h3>
              <p className="sv-body text-[#4B5563] dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Physical Operations & Inspection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="sv-card overflow-hidden flex flex-col justify-between">
            <div className="aspect-video overflow-hidden bg-[#F1F5F9] dark:bg-slate-900">
              <img
                src="/assets/aistudio/IMG_2160_95d48b98.jpeg"
                alt="Swiftvero Express Lagos Intake Hub with certified digital scales and 3D volume verification"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </div>
            <div className="p-6 space-y-2.5">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#00B4D8]" />
                <h3 className="sv-h3">Certified Digital Scales</h3>
              </div>
              <p className="sv-body text-[#4B5563] dark:text-slate-400">
                Every package collected at your door is weighed and volumetric dimensions verified on calibrated digital scales at our intake hub. Zero invented weights.
              </p>
              <div className="pt-1 text-[12px] font-semibold text-[#0096C7] dark:text-[#90E0EF]">
                Ikeja Cargo Facility · Verified Intake
              </div>
            </div>
          </div>

          <div className="sv-card overflow-hidden flex flex-col justify-between">
            <div className="aspect-video overflow-hidden bg-[#F1F5F9] dark:bg-slate-900">
              <img
                src="/assets/aistudio/IMG_1994_fa0341f9.jpeg"
                alt="Swiftvero technician inspecting and reinforcing parcel cartons for air export"
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </div>
            <div className="p-6 space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00B4D8]" />
                <h3 className="sv-h3">Export-Grade Inspection</h3>
              </div>
              <p className="sv-body text-[#4B5563] dark:text-slate-400">
                Our technicians screen contents for dangerous air goods, reinforce carton taping, and ensure your shipment complies with international customs regulations.
              </p>
              <div className="pt-1 text-[12px] font-semibold text-[#0096C7] dark:text-[#90E0EF]">
                Civil Aviation Compliant Screening
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Services Summary Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-7">
        <div className="border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
          <h2 className="sv-h2">Core Shipping Services</h2>
          <p className="text-[14px] text-[#4B5563] dark:text-slate-400 mt-1">
            Confirmed international parcel coordination and collection options.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="sv-card p-6 sm:p-7 space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] dark:bg-sky-950 flex items-center justify-center border border-[#90E0EF] dark:border-sky-800">
                <Package className="w-5 h-5 text-[#00B4D8]" />
              </div>
              <h3 className="sv-h3">Personal International Shipping</h3>
              <p className="sv-body text-[#4B5563] dark:text-slate-400">
                Send personal parcels, clothing, documents, and gifts to family and friends in the UK, US, Canada, and supported global destinations.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenQuote}
              className="w-full min-h-[44px] py-2.5 text-[15px] font-bold text-white bg-[#00B4D8] hover:bg-[#0096C7] rounded-full transition-colors cursor-pointer"
            >
              Book Personal Shipment
            </button>
          </div>

          <div className="sv-card p-6 sm:p-7 space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] dark:bg-sky-950 flex items-center justify-center border border-[#90E0EF] dark:border-sky-800">
                <Briefcase className="w-5 h-5 text-[#00B4D8]" />
              </div>
              <h3 className="sv-h3">Business Shipping</h3>
              <p className="sv-body text-[#4B5563] dark:text-slate-400">
                Regular export solutions for Nigerian fashion ateliers, craft artisans, and commercial traders sending commercial samples abroad.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePublicNav('business')}
              className="w-full min-h-[44px] py-2.5 text-[14px] font-bold text-[#111827] dark:text-white bg-[#F1F5F9] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 rounded-full transition-colors cursor-pointer"
            >
              Explore Business Shipping
            </button>
          </div>

          <div className="sv-card p-6 sm:p-7 space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] dark:bg-sky-950 flex items-center justify-center border border-[#90E0EF] dark:border-sky-800">
                <Truck className="w-5 h-5 text-[#00B4D8]" />
              </div>
              <h3 className="sv-h3">Collection and Drop-off Options</h3>
              <p className="sv-body text-[#4B5563] dark:text-slate-400">
                Choose free doorstep pickup at your home or office in Lagos/Abuja, or drop off directly at our physical intake depot in Ikeja.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePublicNav('services')}
              className="w-full min-h-[44px] py-2.5 text-[14px] font-bold text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800 bg-[#CAF0F8] dark:bg-sky-950/40 hover:bg-[#90E0EF]/50 rounded-full transition-colors cursor-pointer"
            >
              View Intake Locations
            </button>
          </div>
        </div>
      </section>

      {/* 7. Business Shipping Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="sv-card p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800">
                <Briefcase className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Commercial Logistics</span>
              </span>
              <h2 className="sv-h2">Business Shipping for Growing Nigerian Brands</h2>
              <p className="sv-body text-[#4B5563] dark:text-slate-400 max-w-2xl">
                Whether you export bespoke fashion, handmade leather goods, or commercial merchandise, Swiftvero provides predictable air carriage coordination, transparent itemized quotes, and dependable package tracking.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePublicNav('business');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="min-h-[46px] px-7 py-2.5 text-[15px] font-bold tracking-[0.01em] text-white bg-[#00B4D8] hover:bg-[#0096C7] rounded-full transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Business Shipping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="min-h-[46px] px-6 py-2.5 text-[14px] font-bold text-[#111827] dark:text-slate-200 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 rounded-full hover:border-[#00B4D8] transition-colors cursor-pointer"
                >
                  Register Business Account
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 p-5 rounded-[12px] bg-[#F1F5F9] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 space-y-3 text-[14px]">
              <div className="font-bold text-[#111827] dark:text-white pb-2 border-b border-[#E2E8F0] dark:border-slate-800">
                Commercial Benefits
              </div>
              <ul className="text-[#4B5563] dark:text-slate-400 space-y-2 text-[14px]">
                <li>• Regular volume quotes for scheduled shipments</li>
                <li>• Itemized VAT invoices for accounting</li>
                <li>• Free pickup coordination from workshops</li>
                <li>• Direct desk support for export paperwork</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Proactive Tracking Principle */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#CAF0F8] dark:bg-sky-950/50 border border-[#90E0EF] dark:border-sky-900 rounded-[12px] p-6 sm:p-8 text-[#0F172A] dark:text-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#90E0EF]">
                <Clock className="w-4 h-4 text-[#00B4D8]" />
                <span>Proactive Tracking Communication</span>
              </div>
              <h2 className="sv-h2">When an update is delayed, we notify you honestly.</h2>
              <p className="sv-body text-[#0F172A]/85 dark:text-slate-300">
                Logistics transfers can encounter airport documentation queues or flight connections. If a tracking update is overdue, our automated system alerts our operations desk and sends you a transparent explanation.
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <button
                type="button"
                onClick={onOpenTrack}
                className="min-h-[44px] px-6 py-2.5 text-[14px] font-bold text-[#111827] dark:text-white bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 hover:border-[#00B4D8] rounded-full transition-colors whitespace-nowrap cursor-pointer"
              >
                View Tracking Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8.5 Verified Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="sv-h2">Verified Customer Reviews</h2>
            <p className="text-[14px] text-[#4B5563] dark:text-slate-400">
              Feedback submitted strictly from confirmed delivered shipments after moderation review.
            </p>
          </div>
          {approvedReviews.length > 0 && (
            <div className="text-[13px] font-semibold text-[#111827] dark:text-slate-300 tabular-nums">
              {approvedReviews.length} published review{approvedReviews.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {approvedReviews.length === 0 ? (
          <div className="sv-card p-8 text-center text-[14px] text-[#4B5563] dark:text-slate-400">
            No published customer reviews yet. Verified reviews appear here after delivery confirmation and moderation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedReviews.map((rev) => (
              <article key={rev.id} className="sv-card p-6 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="flex items-center gap-0.5 text-amber-500"
                      aria-label={`Rated ${rev.ratingOverall} out of 5`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.ratingOverall
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#247347] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {rev.verifiedShipment ? 'Verified Delivery' : 'Customer Feedback'}
                      {rev.isDemo ? ' · Demo' : ''}
                    </span>
                  </div>

                  <p className="sv-body text-[#1F2937] dark:text-slate-300">
                    “{rev.writtenFeedback}”
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
                  {rev.companyResponse && (
                    <div className="p-3 rounded-[8px] bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 text-[13px] text-[#4B5563] dark:text-slate-300">
                      <span className="font-semibold text-[#0096C7] dark:text-[#90E0EF] block mb-0.5">
                        Swiftvero Response:
                      </span>
                      {rev.companyResponse}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[12px] font-medium text-[#4B5563] dark:text-slate-400">
                    <span className="font-semibold text-[#111827] dark:text-slate-200">
                      {rev.customerName}
                    </span>
                    <span className="tabular-nums">{rev.trackingNumber}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 9. Frequently Asked Questions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="sv-card p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] dark:border-slate-800 pb-5">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800">
                <HelpCircle className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Help &amp; Clarification</span>
              </span>
              <h2 className="sv-h2">Frequently Asked Questions</h2>
              <p className="text-[14px] text-[#4B5563] dark:text-slate-400">
                Clear answers to common questions about international shipping from Nigeria.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActivePublicNav('faq');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[13px] font-bold text-[#0F172A] dark:text-[#90E0EF] underline underline-offset-4 hover:text-[#00B4D8] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Visit Complete Help Centre</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-[8px] transition-colors overflow-hidden ${
                    isOpen
                      ? 'border-[#00B4D8] bg-[#F8FAFC] dark:bg-slate-900/60'
                      : 'border-[#CBD5E1] dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-[#90E0EF]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-[15px] text-[#111827] dark:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="w-8 h-8 rounded-full bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] flex items-center justify-center shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#00B4D8]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#00B4D8]" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 text-[14px] text-[#1F2937] dark:text-slate-300 leading-[1.5] border-t border-[#E2E8F0] dark:border-slate-800">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quote Option Details Modal */}
      <QuoteOptionDetailsModal
        option={detailModalOption}
        onClose={() => setDetailModalOption(null)}
        onSelectOption={() => {
          if (detailModalOption && !detailModalOption.disabled) {
            setCalcTier(detailModalOption.id as 'standard' | 'priority');
          }
        }}
      />
    </div>
  );
};
