import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { SwiftShareCategory, SwiftShareRequest, SwiftShareStatus } from '../../types';
import { PolicyKey } from '../common/LegalModal';
import { formatNaira } from '../../utils/shipping-calculator';
import {
  Luggage,
  Shirt,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Lock,
  ChevronDown,
  Info,
  Scale,
  Camera,
  FileCheck,
  UserCheck,
  Send,
  Eye,
  AlertCircle,
  HelpCircle,
  Plane,
} from 'lucide-react';

interface SwiftSharePageProps {
  onOpenPolicy: (key: PolicyKey) => void;
  onOpenKyc?: () => void;
  onOpenStandardQuote?: () => void;
}

// Approved pilot routes for Nigeria
const APPROVED_ROUTES = [
  { originCountry: 'Nigeria', originCity: 'Lagos', destCountry: 'United Kingdom', destCity: 'London' },
  { originCountry: 'Nigeria', originCity: 'Lagos', destCountry: 'United Kingdom', destCity: 'Manchester' },
  { originCountry: 'Nigeria', originCity: 'Abuja', destCountry: 'United Kingdom', destCity: 'London' },
  { originCountry: 'Nigeria', originCity: 'Lagos', destCountry: 'United States', destCity: 'New York' },
  { originCountry: 'Nigeria', originCity: 'Lagos', destCountry: 'United States', destCity: 'Atlanta' },
  { originCountry: 'Nigeria', originCity: 'Lagos', destCountry: 'United States', destCity: 'Houston' },
  { originCountry: 'Nigeria', originCity: 'Lagos', destCountry: 'Canada', destCity: 'Toronto' },
  { originCountry: 'Nigeria', originCity: 'Lagos', destCountry: 'Canada', destCity: 'Calgary' },
  { originCountry: 'Nigeria', originCity: 'Lagos', destCountry: 'United Arab Emirates', destCity: 'Dubai' },
];

function isRouteApproved(originCountry: string, originCity: string, destCountry: string, destCity: string): boolean {
  if (originCountry !== 'Nigeria') return false;
  return APPROVED_ROUTES.some(
    (r) =>
      r.originCountry.toLowerCase() === originCountry.toLowerCase() &&
      r.originCity.toLowerCase() === originCity.toLowerCase() &&
      r.destCountry.toLowerCase() === destCountry.toLowerCase() &&
      r.destCity.toLowerCase() === destCity.toLowerCase()
  );
}

export const SwiftSharePage: React.FC<SwiftSharePageProps> = ({ onOpenPolicy, onOpenKyc, onOpenStandardQuote }) => {
  const {
    swiftShareRequests,
    addSwiftShareRequest,
    updateSwiftShareStatus,
    flagSwiftShareSafetyHold,
    confirmSwiftShareDeliveryAndReleasePayout,
    travellerInterests,
    registerTravellerInterest,
    currentCustomer,
  } = useDemo();

  // Wizard state: 1 = Details, 2 = Review & Declarations, 3 = Submitted
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [activeTab, setActiveTab] = useState<'request' | 'tracking' | 'carrier_interest'>('request');

  // Step 1 Form State
  const [originCountry, setOriginCountry] = useState('Nigeria');
  const [originCity, setOriginCity] = useState('Lagos');
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [destinationCity, setDestinationCity] = useState('London');
  const [preferredDate, setPreferredDate] = useState('2026-11-12');
  const [category, setCategory] = useState<SwiftShareCategory>('clothing');

  // Category specific fields
  const [itemDescription, setItemDescription] = useState('Handwoven traditional Yoruba Aso-Oke outfit with beaded embroidery (2 items)');
  const [pieceCount, setPieceCount] = useState<number>(2);
  const [weightKg, setWeightKg] = useState<number>(2.4);
  const [declaredValueNgn, setDeclaredValueNgn] = useState<number>(140000);
  const [documentType, setDocumentType] = useState('Commercial Property Title Deed & Non-Confidential Corporate Resolutions');
  const [packCount, setPackCount] = useState<number>(1);
  const [handlingNotes, setHandlingNotes] = useState('Please keep upright and moisture protected');
  const [photoProvided, setPhotoProvided] = useState(true);

  // Contacts
  const [senderName, setSenderName] = useState(currentCustomer?.name || 'Amara Okafor');
  const [senderPhone, setSenderPhone] = useState(currentCustomer?.phone || '+234 803 555 0192');
  const [senderEmail, setSenderEmail] = useState(currentCustomer?.email || 'amara@lekkiartisan.ng');
  const [recipientName, setRecipientName] = useState('Dr. Dayo Adeleke');
  const [recipientPhone, setRecipientPhone] = useState('+44 7911 123456');

  // Step 2 Declarations (Unchecked by default as required)
  const [decAccurateDescription, setDecAccurateDescription] = useState(false);
  const [decOwnership, setDecOwnership] = useState(false);
  const [decInspectionConsent, setDecInspectionConsent] = useState(false);
  const [decCustomsDuties, setDecCustomsDuties] = useState(false);
  const [decNoGuaranteedConfirmation, setDecNoGuaranteedConfirmation] = useState(false);
  const [decTermsAgreement, setDecTermsAgreement] = useState(false);

  // Submission outcome state
  const [submittedRef, setSubmittedRef] = useState<string>('');

  // Selected SwiftShare item for Inspection Lifecycle Simulation
  const [selectedRequestId, setSelectedRequestId] = useState<string>(swiftShareRequests[0]?.id || '');
  const activeSelectedRequest = swiftShareRequests.find((r) => r.id === selectedRequestId) || swiftShareRequests[0];

  // Counter intake simulation state
  const [intakeMeasuredWeight, setIntakeMeasuredWeight] = useState<number>(2.45);
  const [intakeSealRef, setIntakeSealRef] = useState<string>('SEAL-LOS-9982');
  const [intakeNotes, setIntakeNotes] = useState<string>('Unpacked fully from external box. Garment inspected page-by-page / fold-by-fold. Green tamper seal applied.');
  const [intakeDiscrepancy, setIntakeDiscrepancy] = useState<boolean>(false);

  // Safety hold simulation state
  const [holdReason, setHoldReason] = useState<string>('Weight variance exceeds tolerance threshold; suspicious internal density requiring senior supervisor review.');

  // Traveller interest form state
  const [trName, setTrName] = useState('');
  const [trContact, setTrContact] = useState('');
  const [trDepCity, setTrDepCity] = useState('Lagos');
  const [trDepCountry, setTrDepCountry] = useState('Nigeria');
  const [trDestCity, setTrDestCity] = useState('London');
  const [trDestCountry, setTrDestCountry] = useState('United Kingdom');
  const [trDate, setTrDate] = useState('2026-11-20');
  const [trCapacity, setTrCapacity] = useState<number>(5);
  const [trBookingRef, setTrBookingRef] = useState('');
  const [trAgreed, setTrAgreed] = useState(false);
  const [trSubmitted, setTrSubmitted] = useState(false);

  const routeIsApproved = isRouteApproved(originCountry, originCity, destinationCountry, destinationCity);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeIsApproved) return;
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !decAccurateDescription ||
      !decOwnership ||
      !decInspectionConsent ||
      !decCustomsDuties ||
      !decNoGuaranteedConfirmation ||
      !decTermsAgreement
    ) {
      return;
    }

    const ref = `SS-2026-NG${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedRef(ref);

    addSwiftShareRequest({
      requestReference: ref,
      senderName,
      senderPhone,
      senderEmail,
      recipientName,
      recipientPhone,
      originCountry,
      originCity,
      destinationCountry,
      destinationCity,
      preferredDate,
      category,
      itemDescription,
      pieceCount: category === 'clothing' ? pieceCount : undefined,
      weightKg: category === 'clothing' ? weightKg : undefined,
      declaredValueNgn,
      ownershipConfirmed: decOwnership,
      documentType: category === 'documents' ? documentType : undefined,
      packCount: category === 'documents' ? packCount : undefined,
      handlingNotes,
      photoProvided,
      status: 'submitted',
      travellerPayoutNgn: category === 'clothing' ? 45000 : 30000,
      payoutStatus: 'held_in_escrow',
      deliveryConfirmedByRecipient: false,
      isSafetyHold: false,
    });

    setStep(3);
  };

  const handleTravellerInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trName || !trContact || !trAgreed) return;

    registerTravellerInterest({
      name: trName,
      contact: trContact,
      departureCity: trDepCity,
      departureCountry: trDepCountry,
      destinationCity: trDestCity,
      destinationCountry: trDestCountry,
      expectedTravelDate: trDate,
      approximateSpareCapacityKg: trCapacity,
      travelBookingReference: trBookingRef || undefined,
      termsAgreed: trAgreed,
    });

    setTrSubmitted(true);
  };

  const getStatusStepIndex = (status: SwiftShareStatus): number => {
    switch (status) {
      case 'submitted':
        return 1;
      case 'reviewed':
        return 2;
      case 'inspected_and_sealed':
        return 3;
      case 'in_transit':
        return 4;
      case 'delivered':
        return 5;
      case 'on_hold_safety_review':
        return 2;
      default:
        return 1;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* Pilot Concept & Demo Mode Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#CAF0F8] border border-[#90E0EF] rounded-xl text-xs text-[#354B55]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-pulse" />
          <span className="font-semibold text-[#00B4D8]">Pilot concept · Availability depends on route approval</span>
        </div>
        <div className="font-mono text-[11px] font-semibold text-[#00B4D8] bg-white px-2.5 py-0.5 rounded border border-[#90E0EF]">
          DEMO MODE · No real shipment, payment, or verification is performed
        </div>
      </div>

      {/* Hero Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#00B4D8] bg-[#CAF0F8] border border-[#90E0EF]">
          <Luggage className="w-3.5 h-3.5" />
          <span>Traveller-Assisted Logistics</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif-display font-medium text-[#354B55] tracking-tight">
          SwiftShare.
        </h1>
        <p className="text-base text-[#6A808C] leading-relaxed">
          A simpler way to arrange delivery for eligible items through verified, traveller-assisted routes.
          Inspected at our counter, sealed with tamper-evident serials, and carried by vetted international passengers.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              setActiveTab('request');
              const el = document.getElementById('swiftshare-workflow');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-2.5 bg-[#00B4D8] text-white rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-2 shadow-xs"
          >
            <span>Start a Delivery Request</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('how-swiftshare-works');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2.5 bg-white border border-[#DCEFF3] text-[#354B55] hover:bg-[#F5FBFD] rounded-lg text-xs font-medium transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => setActiveTab('carrier_interest')}
            className="px-4 py-2.5 bg-white border border-[#DCEFF3] text-[#00B4D8] hover:bg-[#CAF0F8] rounded-lg text-xs font-medium transition-colors"
          >
            Carry Items as a Traveller
          </button>
        </div>
      </div>

      {/* Three Categories Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif-display font-medium text-[#354B55]">
            Permitted Item Categories
          </h2>
          <span className="text-xs text-[#6A808C]">2 active · 1 under review</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Clothing */}
          <div
            onClick={() => {
              setCategory('clothing');
              if (step === 1) {
                const el = document.getElementById('swiftshare-workflow');
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`p-6 bg-white rounded-2xl border transition-all cursor-pointer space-y-3 ${
              category === 'clothing'
                ? 'border-[#00B4D8] shadow-sm ring-1 ring-[#00B4D8]'
                : 'border-[#DCEFF3] hover:border-[#90E0EF]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center">
                <Shirt className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#00B4D8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                Open for Requests
              </span>
            </div>
            <h3 className="text-base font-serif-display font-medium text-[#354B55]">
              Clothing &amp; Outfits
            </h3>
            <p className="text-xs text-[#6A808C] leading-relaxed">
              Dresses, shirts, trousers, suits, traditional outfits (Aso-Oke, Agbada), and tailored uniforms.
            </p>
            <div className="pt-2 border-t border-[#DCEFF3] text-[11px] text-[#6A808C] space-y-1">
              <p>
                <strong className="text-[#354B55]">Inspection Requirement:</strong> Items must be accurately described and available for full inspection before sealing.
              </p>
            </div>
          </div>

          {/* 2. Documents */}
          <div
            onClick={() => {
              setCategory('documents');
              if (step === 1) {
                const el = document.getElementById('swiftshare-workflow');
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`p-6 bg-white rounded-2xl border transition-all cursor-pointer space-y-3 ${
              category === 'documents'
                ? 'border-[#00B4D8] shadow-sm ring-1 ring-[#00B4D8]'
                : 'border-[#DCEFF3] hover:border-[#90E0EF]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#00B4D8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                Open for Requests
              </span>
            </div>
            <h3 className="text-base font-serif-display font-medium text-[#354B55]">
              Business Documents
            </h3>
            <p className="text-xs text-[#6A808C] leading-relaxed">
              Commercial paperwork, transcripts, certificates, contracts, and company agreements.
            </p>
            <div className="pt-2 border-t border-[#DCEFF3] text-[11px] text-[#6A808C] space-y-1">
              <p>
                <strong className="text-[#354B55]">Exclusion Notice:</strong> Passports, identity documents, and confidential legal or medical records require separate, explicit approval and are not accepted through this flow yet.
              </p>
            </div>
          </div>

          {/* 3. Hair & Wigs (Strictly Under Review / Non-Bookable) */}
          <div className="p-6 bg-[#F5FBFD] rounded-2xl border border-dashed border-[#90E0EF] space-y-3 opacity-90 relative">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#CAF0F8] text-[#6A808C] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#6A808C]" />
              </div>
              <span className="text-[11px] font-semibold text-[#6A808C] bg-white px-2.5 py-0.5 rounded-full border border-[#DCEFF3]">
                Under Review
              </span>
            </div>
            <h3 className="text-base font-serif-display font-medium text-[#354B55]">
              Hair &amp; Wigs
            </h3>
            <p className="text-xs text-[#6A808C] leading-relaxed">
              Raw hair bundles, human hair extensions, wigs, and braided custom hairpieces.
            </p>
            <div className="pt-2 border-t border-[#DCEFF3] text-[11px] text-[#6A808C] space-y-1">
              <p>
                <strong className="text-[#354B55]">Not Available:</strong> Under review · Not yet available for booking. (Requires separate airline customs handling pilot clearance).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs between Request, Lifecycle Tracker, and Carrier Interest */}
      <div id="swiftshare-workflow" className="border-b border-[#DCEFF3] flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('request')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'request'
              ? 'border-[#00B4D8] text-[#00B4D8]'
              : 'border-transparent text-[#6A808C] hover:text-[#354B55]'
          }`}
        >
          1. Consignment Request Wizard
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'tracking'
              ? 'border-[#00B4D8] text-[#00B4D8]'
              : 'border-transparent text-[#6A808C] hover:text-[#354B55]'
          }`}
        >
          <span>2. Inspection &amp; Escrow Tracker</span>
          <span className="text-[10px] bg-[#CAF0F8] text-[#00B4D8] px-1.5 py-0.2 rounded-full">
            {swiftShareRequests.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('carrier_interest')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'carrier_interest'
              ? 'border-[#00B4D8] text-[#00B4D8]'
              : 'border-transparent text-[#6A808C] hover:text-[#354B55]'
          }`}
        >
          <span>3. Interested in Carrying Items?</span>
          <span className="text-[10px] bg-slate-100 text-[#6A808C] px-1.5 py-0.2 rounded-full">
            Traveller Form
          </span>
        </button>
      </div>

      {/* VIEW 1: THE THREE-STEP REQUEST FLOW */}
      {activeTab === 'request' && (
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs space-y-8">
          {/* Flow Stepper Indicator */}
          <div className="flex items-center justify-between border-b border-[#DCEFF3] pb-4">
            <div>
              <span className="text-xs font-semibold text-[#00B4D8] uppercase tracking-wider">
                Step 0{step} of 03
              </span>
              <h2 className="text-xl font-serif-display font-medium text-[#354B55] mt-0.5">
                {step === 1 && 'Delivery Details & Item Specifics'}
                {step === 2 && 'Review Summary & Declarations'}
                {step === 3 && 'Request Recorded in Pilot Preview'}
              </h2>
            </div>
            <div className="text-xs text-[#6A808C]">
              Category: <strong className="text-[#354B55] capitalize">{category}</strong>
            </div>
          </div>

          {/* STEP 1: DELIVERY DETAILS */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* Route Selector */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#354B55]">
                  Origin &amp; Destination Route
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#354B55] mb-1">
                      Origin Country &amp; City (Nigeria)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={originCountry}
                        onChange={(e) => setOriginCountry(e.target.value)}
                        className="px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs bg-white text-[#354B55]"
                      >
                        <option value="Nigeria">Nigeria</option>
                        <option value="Ghana">Ghana (Unapproved)</option>
                      </select>
                      <select
                        value={originCity}
                        onChange={(e) => setOriginCity(e.target.value)}
                        className="px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs bg-white text-[#354B55]"
                      >
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja">Abuja</option>
                        <option value="Port Harcourt">Port Harcourt (Unapproved)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#354B55] mb-1">
                      Destination Country &amp; City
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={destinationCountry}
                        onChange={(e) => setDestinationCountry(e.target.value)}
                        className="px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs bg-white text-[#354B55]"
                      >
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Australia">Australia (Unapproved)</option>
                      </select>
                      <select
                        value={destinationCity}
                        onChange={(e) => setDestinationCity(e.target.value)}
                        className="px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs bg-white text-[#354B55]"
                      >
                        {destinationCountry === 'United Kingdom' && (
                          <>
                            <option value="London">London</option>
                            <option value="Manchester">Manchester</option>
                            <option value="Birmingham">Birmingham (Unapproved)</option>
                          </>
                        )}
                        {destinationCountry === 'United States' && (
                          <>
                            <option value="New York">New York</option>
                            <option value="Atlanta">Atlanta</option>
                            <option value="Houston">Houston</option>
                            <option value="Chicago">Chicago (Unapproved)</option>
                          </>
                        )}
                        {destinationCountry === 'Canada' && (
                          <>
                            <option value="Toronto">Toronto</option>
                            <option value="Calgary">Calgary</option>
                            <option value="Vancouver">Vancouver (Unapproved)</option>
                          </>
                        )}
                        {destinationCountry === 'United Arab Emirates' && (
                          <option value="Dubai">Dubai</option>
                        )}
                        {destinationCountry === 'Australia' && (
                          <option value="Sydney">Sydney (Unapproved)</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Route Approval Status Notice */}
                {!routeIsApproved ? (
                  <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>This route is not currently available for booking.</span>
                    </div>
                    <p className="leading-relaxed">
                      You can register your interest while Swiftvero reviews route eligibility.
                      Currently approved routes operate between Lagos/Abuja and certified international hub airports (London, Manchester, New York, Atlanta, Houston, Toronto, Calgary, Dubai).
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('carrier_interest')}
                      className="mt-2 text-xs font-semibold underline text-[#991B1B]"
                    >
                      Register Route Interest →
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-[#00B4D8] bg-[#CAF0F8] p-2.5 rounded-lg border border-[#90E0EF]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Approved Pilot Corridor: {originCity}, Nigeria → {destinationCity}, {destinationCountry}</span>
                  </div>
                )}
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-xs font-medium text-[#354B55] mb-1">
                  Preferred Handover / Dispatch Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs bg-white text-[#354B55]"
                  required
                />
              </div>

              {/* Category-Specific Fields */}
              {category === 'clothing' && (
                <div className="space-y-4 pt-2 border-t border-[#DCEFF3]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#354B55]">
                    Clothing Consignment Details
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-[#354B55] mb-1">
                      Item Description
                    </label>
                    <input
                      type="text"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="Describe items in full detail..."
                      className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">
                        Piece Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={pieceCount}
                        onChange={(e) => setPieceCount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">
                        Estimated Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={weightKg}
                        onChange={(e) => setWeightKg(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">
                        Declared Value (₦ NGN)
                      </label>
                      <input
                        type="number"
                        min={1000}
                        value={declaredValueNgn}
                        onChange={(e) => setDeclaredValueNgn(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-[#F5FBFD] border border-[#90E0EF] rounded-lg text-xs text-[#354B55]">
                    <Camera className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Photo provided for pre-inspection audit: <strong>Verified by consignor</strong></span>
                  </div>
                </div>
              )}

              {category === 'documents' && (
                <div className="space-y-4 pt-2 border-t border-[#DCEFF3]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#354B55]">
                    Document Consignment Details
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-[#354B55] mb-1">
                      Document Type
                    </label>
                    <input
                      type="text"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      placeholder="e.g. Commercial Contracts, Academic Transcripts..."
                      className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">
                        Pack / Envelope Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={3}
                        value={packCount}
                        onChange={(e) => setPackCount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">
                        Declared Value (₦ NGN)
                      </label>
                      <input
                        type="number"
                        min={1000}
                        value={declaredValueNgn}
                        onChange={(e) => setDeclaredValueNgn(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#354B55] mb-1">
                      Handling Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={handlingNotes}
                      onChange={(e) => setHandlingNotes(e.target.value)}
                      placeholder="e.g. Keep flat, water-resistant pouch requested"
                      className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Sender & Recipient Contacts */}
              <div className="space-y-4 pt-2 border-t border-[#DCEFF3]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#354B55]">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl space-y-3">
                    <span className="text-xs font-semibold text-[#00B4D8] block">Sender (Consignor)</span>
                    <div>
                      <label className="block text-[11px] text-[#6A808C] mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#DCEFF3] rounded text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6A808C] mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#DCEFF3] rounded text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6A808C] mb-1">Email Address</label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#DCEFF3] rounded text-xs bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl space-y-3">
                    <span className="text-xs font-semibold text-[#00B4D8] block">Recipient (Handover Contact)</span>
                    <div>
                      <label className="block text-[11px] text-[#6A808C] mb-1">Full Recipient Name</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#DCEFF3] rounded text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6A808C] mb-1">Recipient Phone</label>
                      <input
                        type="text"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#DCEFF3] rounded text-xs bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end pt-4 border-t border-[#DCEFF3]">
                <button
                  type="submit"
                  disabled={!routeIsApproved}
                  className="px-6 py-2.5 bg-[#00B4D8] text-white rounded-lg text-xs font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center gap-2 shadow-xs"
                >
                  <span>Proceed to Review &amp; Declarations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: REVIEW & SEPARATE UNCHECKED DECLARATIONS */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              {/* Review Summary */}
              <div className="space-y-4">
                <div className="p-4 bg-[#F5FBFD] border border-[#90E0EF] rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-[#90E0EF] pb-2">
                    <strong className="text-xs text-[#00B4D8] uppercase tracking-wider">
                      Request Summary
                    </strong>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-[#00B4D8] hover:underline"
                    >
                      Edit Details
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[#6A808C] block">Route:</span>
                      <strong className="text-[#354B55]">{originCity}, Nigeria → {destinationCity}, {destinationCountry}</strong>
                    </div>
                    <div>
                      <span className="text-[#6A808C] block">Category:</span>
                      <strong className="text-[#354B55] capitalize">{category}</strong>
                    </div>
                    <div>
                      <span className="text-[#6A808C] block">Preferred Date:</span>
                      <strong className="text-[#354B55]">{preferredDate}</strong>
                    </div>
                    <div>
                      <span className="text-[#6A808C] block">Sender:</span>
                      <strong className="text-[#354B55]">{senderName} ({senderPhone})</strong>
                    </div>
                    <div>
                      <span className="text-[#6A808C] block">Recipient:</span>
                      <strong className="text-[#354B55]">{recipientName} ({recipientPhone})</strong>
                    </div>
                    <div>
                      <span className="text-[#6A808C] block">Declared Value:</span>
                      <strong className="text-[#00B4D8] font-mono">{formatNaira(declaredValueNgn)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separate Unchecked Confirmations (Mandatory) */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#354B55]">
                  Required Customer Declarations
                </h3>
                <p className="text-[11px] text-[#6A808C]">
                  Every confirmation must be reviewed and affirmatively agreed individually. No boxes are pre-checked.
                </p>

                {/* 1. Accurate Description */}
                <label className="flex items-start gap-3 p-3 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] cursor-pointer hover:bg-[#F5FBFD] transition-colors">
                  <input
                    type="checkbox"
                    checked={decAccurateDescription}
                    onChange={(e) => setDecAccurateDescription(e.target.checked)}
                    className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span>
                    <strong>Accurate Description &amp; Valuation:</strong> I declare that all item descriptions, quantities, and declared values are truthful and complete. I understand that misdeclaration carries strict legal and regulatory consequences.
                  </span>
                </label>

                {/* 2. Ownership / Permission */}
                <label className="flex items-start gap-3 p-3 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] cursor-pointer hover:bg-[#F5FBFD] transition-colors">
                  <input
                    type="checkbox"
                    checked={decOwnership}
                    onChange={(e) => setDecOwnership(e.target.checked)}
                    className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span>
                    <strong>Ownership &amp; Authorization:</strong> I confirm that I legally own the items being dispatched or have documented authorization to send them.
                  </span>
                </label>

                {/* 3. 100% Unpacking Inspection Consent */}
                <label className="flex items-start gap-3 p-3 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] cursor-pointer hover:bg-[#F5FBFD] transition-colors">
                  <input
                    type="checkbox"
                    checked={decInspectionConsent}
                    onChange={(e) => setDecInspectionConsent(e.target.checked)}
                    className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span>
                    <strong>Physical Counter Inspection Consent:</strong> I agree that all items will be physically unpacked out of retail packaging, examined, and weighed on calibrated scales at the counter before sealing. Any prohibited or suspicious items will be refused.
                  </span>
                </label>

                {/* 4. Customs & Duties */}
                <label className="flex items-start gap-3 p-3 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] cursor-pointer hover:bg-[#F5FBFD] transition-colors">
                  <input
                    type="checkbox"
                    checked={decCustomsDuties}
                    onChange={(e) => setDecCustomsDuties(e.target.checked)}
                    className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span>
                    <strong>Customs &amp; Duties Liability:</strong> I understand that customs, taxes, or destination statutory duties may apply and that duty-free passage is never guaranteed.
                  </span>
                </label>

                {/* 5. Non-Confirmation Notice */}
                <label className="flex items-start gap-3 p-3 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] cursor-pointer hover:bg-[#F5FBFD] transition-colors">
                  <input
                    type="checkbox"
                    checked={decNoGuaranteedConfirmation}
                    onChange={(e) => setDecNoGuaranteedConfirmation(e.target.checked)}
                    className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span>
                    <strong>Understanding of Request Stage:</strong> I understand that submitting this request does not yet confirm carrier acceptance, a matched traveller, an exact flight date, or a finalized price.
                  </span>
                </label>

                {/* 6. Terms Agreement */}
                <label className="flex items-start gap-3 p-3 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] cursor-pointer hover:bg-[#F5FBFD] transition-colors">
                  <input
                    type="checkbox"
                    checked={decTermsAgreement}
                    onChange={(e) => setDecTermsAgreement(e.target.checked)}
                    className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span>
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => onOpenPolicy('terms')}
                      className="text-[#00B4D8] underline font-semibold"
                    >
                      SwiftShare Operating Terms
                    </button>{' '}
                    and the{' '}
                    <button
                      type="button"
                      onClick={() => onOpenPolicy('privacy')}
                      className="text-[#00B4D8] underline font-semibold"
                    >
                      Privacy Notice
                    </button>
                    .
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#DCEFF3]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-[#DCEFF3] rounded-lg text-xs font-medium text-[#6A808C] hover:bg-[#F5FBFD]"
                >
                  ← Back to Details
                </button>

                <button
                  type="submit"
                  disabled={
                    !decAccurateDescription ||
                    !decOwnership ||
                    !decInspectionConsent ||
                    !decCustomsDuties ||
                    !decNoGuaranteedConfirmation ||
                    !decTermsAgreement
                  }
                  className="px-6 py-2.5 bg-[#00B4D8] text-white rounded-lg text-xs font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Delivery Request</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUBMITTED SUCCESS STATE */}
          {step === 3 && (
            <div className="text-center py-8 space-y-5 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-2xl font-serif-display font-medium text-[#354B55]">
                  Request Recorded
                </h3>
                <p className="font-mono text-sm font-bold text-[#00B4D8] mt-1">
                  Reference: {submittedRef}
                </p>
              </div>

              {/* Required Disclaimers */}
              <div className="p-4 bg-[#F5FBFD] border border-[#90E0EF] rounded-xl text-left text-xs text-[#354B55] space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Notice:</strong> Your request has been recorded in this preview. This is not a confirmed booking — Swiftvero reviews route eligibility, item acceptance, and availability before a real shipment can proceed.
                  </p>
                </div>
                <div className="text-[11px] text-[#6A808C] pt-2 border-t border-[#DCEFF3]">
                  SwiftShare is a prototype here. Route approval, traveller matching, verification, payment, inspection, and delivery are not live yet. Don't submit sensitive personal information or rely on this demo for a real shipment.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('tracking');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#00B4D8] text-white rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Lifecycle &amp; Escrow Tracker</span>
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setDecAccurateDescription(false);
                    setDecOwnership(false);
                    setDecInspectionConsent(false);
                    setDecCustomsDuties(false);
                    setDecNoGuaranteedConfirmation(false);
                    setDecTermsAgreement(false);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 border border-[#DCEFF3] rounded-lg text-xs font-medium text-[#6A808C] hover:bg-[#F5FBFD]"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: INSPECTION, CUSTODY & ESCROW LIFECYCLE */}
      {activeTab === 'tracking' && (
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCEFF3] pb-4">
            <div>
              <h2 className="text-xl font-serif-display font-medium text-[#354B55]">
                Inspection, Custody &amp; Escrow Tracker
              </h2>
              <p className="text-xs text-[#6A808C] mt-0.5">
                Full unpacking inspection at counter, tamper-evident barcode seal, and held traveller escrow.
              </p>
            </div>

            {/* Selector of requests */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6A808C]">Consignment:</span>
              <select
                value={activeSelectedRequest.id}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                className="px-3 py-1.5 border border-[#DCEFF3] rounded-lg text-xs font-mono font-medium bg-white"
              >
                {swiftShareRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requestReference} ({r.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5-Step Customer Visible Status Line */}
          <div className="space-y-3">
            <span className="text-xs font-medium uppercase tracking-wider text-[#6A808C] block">
              Customer Status Line
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              {[
                { stage: 1, label: 'Submitted', key: 'submitted' },
                { stage: 2, label: 'Reviewed', key: 'reviewed' },
                { stage: 3, label: 'Inspected & Sealed', key: 'inspected_and_sealed' },
                { stage: 4, label: 'In Transit', key: 'in_transit' },
                { stage: 5, label: 'Delivered', key: 'delivered' },
              ].map((s) => {
                const currentIdx = getStatusStepIndex(activeSelectedRequest.status);
                const isPassed = currentIdx >= s.stage;
                const isCurrent = currentIdx === s.stage;
                return (
                  <div
                    key={s.key}
                    className={`p-3 rounded-xl border transition-all ${
                      activeSelectedRequest.status === 'on_hold_safety_review' && s.stage === 2
                        ? 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B] font-semibold'
                        : isCurrent
                        ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#00B4D8] font-semibold shadow-xs'
                        : isPassed
                        ? 'bg-[#F5FBFD] border-[#90E0EF] text-[#00B4D8]'
                        : 'bg-white border-[#DCEFF3] text-[#6A808C]'
                    }`}
                  >
                    <div className="text-[10px] font-mono mb-0.5">Stage 0{s.stage}</div>
                    <div className="font-medium truncate">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Safety Review Hold Banner if flagged */}
          {activeSelectedRequest.isSafetyHold && (
            <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>On Hold — Safety Review</span>
              </div>
              <p className="leading-relaxed">
                {activeSelectedRequest.safetyHoldReason ||
                  'If anything looks suspicious, stop and don’t investigate it yourself — this is handled through review, not by the person at the counter or the traveller.'}
              </p>
            </div>
          )}

          {/* Behind "Inspected & Sealed" Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Box 1: Physical Inspection & Barcode Seal */}
            <div className="p-5 bg-white rounded-2xl border border-[#DCEFF3] space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DCEFF3] pb-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#00B4D8]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#354B55]">
                    Walk-In Counter Inspection
                  </h3>
                </div>
                {activeSelectedRequest.inspectedAt ? (
                  <span className="text-[11px] text-[#00B4D8] bg-[#CAF0F8] px-2 py-0.5 rounded-full border border-[#90E0EF] font-medium">
                    Inspection Complete
                  </span>
                ) : (
                  <span className="text-[11px] text-[#991B1B] bg-red-50 px-2 py-0.5 rounded-full border border-red-200 font-medium">
                    Pending Counter Intake
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl border border-[#DCEFF3] bg-[#F5FBFD] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#354B55]">Victoria Island Intake Hub</h5>
                    <p className="text-[10px] text-[#6A808C]">100% Physical Unpack &amp; Scale Check</p>
                  </div>
                </div>
                <p className="text-[11px] text-[#354B55] leading-relaxed">
                  Both consignor and traveller inspect every article before application of tamper-evident serialized seal.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Category:</span>
                  <span className="font-semibold text-[#354B55] capitalize">{activeSelectedRequest.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Declared Weight:</span>
                  <span className="font-mono text-[#354B55]">{activeSelectedRequest.weightKg || '0.6'} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Measured Scale Weight:</span>
                  <span className="font-mono font-bold text-[#00B4D8]">
                    {activeSelectedRequest.measuredWeightKg ? `${activeSelectedRequest.measuredWeightKg} kg` : 'Pending intake'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Tamper-Evident Seal Ref:</span>
                  <span className="font-mono font-bold text-[#354B55]">
                    {activeSelectedRequest.sealReferenceNumber || 'Not sealed yet'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Unpacked Inspection:</span>
                  <span className="font-semibold text-[#00B4D8]">
                    {activeSelectedRequest.unpackedForInspection ? 'Confirmed (100% Unpacked)' : 'Pending'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#6A808C] bg-[#F5FBFD] p-3 rounded-xl border border-[#DCEFF3] italic">
                “{activeSelectedRequest.inspectionNotes || 'Consignment awaiting in-person counter arrival at Ikeja Hub or Lekki Intake Branch.'}”
              </p>
            </div>

            {/* Box 2: Traveller Custody & Escrow Payment */}
            <div className="p-5 bg-white rounded-2xl border border-[#DCEFF3] space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DCEFF3] pb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00B4D8]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#354B55]">
                    Custody &amp; Escrow Release
                  </h3>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                  activeSelectedRequest.payoutStatus === 'released'
                    ? 'text-[#00B4D8] bg-[#CAF0F8] border-[#90E0EF]'
                    : 'text-[#854D0E] bg-amber-50 border-amber-200'
                }`}>
                  {activeSelectedRequest.payoutStatus === 'released' ? 'Payout Released' : 'Held in Escrow'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Assigned Passenger:</span>
                  <span className="font-medium text-[#354B55]">
                    {activeSelectedRequest.assignedTravellerName || 'Matching verified passenger in progress'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Handover Precondition:</span>
                  <span className="text-[#00B4D8] font-medium">Sealed barcode parcel only</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Held Compensation:</span>
                  <span className="font-mono font-bold text-[#00B4D8]">
                    {formatNaira(activeSelectedRequest.travellerPayoutNgn)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Recipient Confirmation:</span>
                  <span className="font-medium text-[#354B55]">
                    {activeSelectedRequest.deliveryConfirmedByRecipient
                      ? 'Confirmed by Dr. Dayo Adeleke'
                      : 'Pending physical handover'}
                  </span>
                </div>
              </div>

              {/* Escrow Rule Explicit Note */}
              <div className="p-3 bg-[#CAF0F8] border border-[#90E0EF] rounded-xl text-[11px] text-[#354B55] space-y-1">
                <strong>Firm Payout Rule:</strong> Payment to the traveller is held and released only once delivery is confirmed by the recipient — never automatically because a status was clicked.
              </div>

              {/* Interactive Demo Action: Confirm Delivery & Release Payout */}
              {activeSelectedRequest.status === 'in_transit' && !activeSelectedRequest.isSafetyHold && (
                <div className="pt-2">
                  <button
                    onClick={() => confirmSwiftShareDeliveryAndReleasePayout(activeSelectedRequest.id)}
                    className="w-full py-2 bg-[#00B4D8] text-white rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Recipient Confirms Delivery (Release Escrow Payout)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Simulation Controls (For Demo Verification) */}
          <div className="p-5 bg-[#F5FBFD] border border-[#DCEFF3] rounded-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#DCEFF3] pb-2">
              <span className="font-bold text-[#354B55] uppercase tracking-wider">
                SwiftShare Pilot Operations Simulation
              </span>
              <span className="font-mono text-[10px] text-[#6A808C]">
                Interactive lifecycle transitions
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {/* Button: Complete Counter Intake */}
              <button
                onClick={() => {
                  updateSwiftShareStatus(activeSelectedRequest.id, 'inspected_and_sealed', {
                    inspectedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                    sealReferenceNumber: intakeSealRef,
                    measuredWeightKg: intakeMeasuredWeight,
                    unpackedForInspection: true,
                    inspectionNotes: intakeNotes,
                    isSafetyHold: false,
                  });
                }}
                className="px-3 py-1.5 bg-white border border-[#DCEFF3] rounded-lg font-medium text-[#354B55] hover:bg-[#CAF0F8] hover:text-[#00B4D8] transition-colors"
              >
                Simulate: Counter Inspection &amp; Seal ({intakeSealRef})
              </button>

              {/* Button: Flag Safety Hold */}
              <button
                onClick={() => {
                  flagSwiftShareSafetyHold(
                    activeSelectedRequest.id,
                    'If anything looks suspicious, stop and don’t investigate it yourself — this is handled through review, not by the person at the counter or the traveller.'
                  );
                }}
                className="px-3 py-1.5 bg-white border border-red-200 text-[#991B1B] rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                Simulate: Flag Safety Hold
              </button>

              {/* Button: Handover to Traveller & Dispatch */}
              <button
                onClick={() => {
                  updateSwiftShareStatus(activeSelectedRequest.id, 'in_transit', {
                    assignedTravellerName: 'Vetted Passenger (Flight BA075 to London Heathrow)',
                    isSafetyHold: false,
                  });
                }}
                className="px-3 py-1.5 bg-white border border-[#DCEFF3] rounded-lg font-medium text-[#354B55] hover:bg-[#CAF0F8] transition-colors"
              >
                Simulate: Sealed Handover to Passenger (In Transit)
              </button>

              {/* Button: Missed Handover Handling */}
              <button
                onClick={() => {
                  flagSwiftShareSafetyHold(
                    activeSelectedRequest.id,
                    'Missed Handover Detected: Passenger delayed or flight re-routed. Package remains securely locked at Swiftvero Airport Intake Depot. No accusation of theft — case escalated to operational supervisor.'
                  );
                }}
                className="px-3 py-1.5 bg-white border border-amber-300 text-[#854D0E] rounded-lg font-medium hover:bg-amber-50 transition-colors"
              >
                Simulate: Missed Handover Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TRAVELLER INTEREST SECTION */}
      {activeTab === 'carrier_interest' && (
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs space-y-6 max-w-2xl mx-auto">
          <div>
            <h2 className="text-2xl font-serif-display font-medium text-[#354B55]">
              Interested in carrying eligible items?
            </h2>
            <p className="text-xs text-[#6A808C] mt-1 leading-relaxed">
              Vetted international travellers with spare baggage allowance can offset travel expenses by carrying pre-inspected, tamper-sealed parcels.
            </p>
          </div>

          {/* Privacy & Safe Handling Banner */}
          <div className="p-4 bg-[#F5FBFD] border border-[#90E0EF] rounded-xl text-xs text-[#354B55] space-y-1.5">
            <strong className="text-[#00B4D8] block">Vetting &amp; Safety Rules for Travellers:</strong>
            <ul className="list-disc list-inside space-y-1 text-[#6A808C] text-[11px]">
              <li>You only ever receive pre-inspected, sealed packages with official Swiftvero tamper-evident serials.</li>
              <li>Never collect passport scans, biometric credentials, or airline login passwords in this prototype.</li>
              <li>Participation requires identity verification through Swiftvero's existing KYC framework and route approval.</li>
              <li>You can decline any parcel at any time without penalty.</li>
            </ul>
          </div>

          {trSubmitted ? (
            <div className="p-6 bg-[#CAF0F8] border border-[#90E0EF] rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#00B4D8] mx-auto" />
              <h3 className="text-base font-serif-display font-medium text-[#354B55]">
                Traveller Interest Registered (Demo Record)
              </h3>
              <p className="text-xs text-[#6A808C] max-w-md mx-auto">
                Thank you, {trName}. Your travel route ({trDepCity} → {trDestCity} on {trDate}) has been recorded in this preview. Swiftvero operations reviews route eligibility and KYC clearance before matching.
              </p>
              <button
                type="button"
                onClick={() => setTrSubmitted(false)}
                className="mt-2 text-xs font-semibold text-[#00B4D8] underline"
              >
                Register another flight
              </button>
            </div>
          ) : (
            <form onSubmit={handleTravellerInterestSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={trName}
                    onChange={(e) => setTrName(e.target.value)}
                    placeholder="e.g. Dr. Kelechi Obi"
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    Contact Phone / Email
                  </label>
                  <input
                    type="text"
                    value={trContact}
                    onChange={(e) => setTrContact(e.target.value)}
                    placeholder="+234 803 ... or email"
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    Departure City &amp; Country
                  </label>
                  <input
                    type="text"
                    value={`${trDepCity}, ${trDepCountry}`}
                    onChange={(e) => setTrDepCity(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    Destination City &amp; Country
                  </label>
                  <input
                    type="text"
                    value={`${trDestCity}, ${trDestCountry}`}
                    onChange={(e) => setTrDestCity(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    Expected Flight Date
                  </label>
                  <input
                    type="date"
                    value={trDate}
                    onChange={(e) => setTrDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    Spare Capacity (kg)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={trCapacity}
                    onChange={(e) => setTrCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    Flight Booking Ref (Optional)
                  </label>
                  <input
                    type="text"
                    value={trBookingRef}
                    onChange={(e) => setTrBookingRef(e.target.value)}
                    placeholder="e.g. BA-7890 (optional)"
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] cursor-pointer hover:bg-[#F5FBFD]">
                <input
                  type="checkbox"
                  checked={trAgreed}
                  onChange={(e) => setTrAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                  required
                />
                <span>
                  I understand that participation requires identity verification (KYC), route authorization, and strictly accepting sealed, pre-inspected consignments at the airport hub.
                </span>
              </label>

              <button
                type="submit"
                disabled={!trAgreed}
                className="w-full py-2.5 bg-[#00B4D8] text-white rounded-lg text-xs font-semibold hover:opacity-95 disabled:opacity-40 transition-opacity"
              >
                Submit Traveller Availability
              </button>
            </form>
          )}

          {/* Existing Registered Interests Demo List */}
          <div className="pt-4 border-t border-[#DCEFF3] space-y-3">
            <span className="text-xs font-semibold text-[#354B55] block">
              Sample Traveller Interest Registrations ({travellerInterests.length})
            </span>
            <div className="space-y-2">
              {travellerInterests.map((tint) => (
                <div key={tint.id} className="p-3 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-[#354B55]">{tint.name}</strong>
                    <p className="text-[11px] text-[#6A808C]">
                      {tint.departureCity} → {tint.destinationCity} · Flight Date: {tint.expectedTravelDate}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#00B4D8] bg-[#CAF0F8] px-2 py-0.5 rounded border border-[#90E0EF]">
                    {tint.approximateSpareCapacityKg} kg spare
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HOW IT WORKS / RULES SECTION */}
      <div id="how-swiftshare-works" className="bg-[#CAF0F8] border border-[#90E0EF] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-serif-display font-medium text-[#354B55]">
            How SwiftShare Works: 4 Simple Principles
          </h2>
          <p className="text-xs text-[#6A808C] mt-1">
            Built on Swiftvero’s verified identity, physical counter inspection, and escrow rules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-[#90E0EF] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-xs">
              1
            </span>
            <strong className="block text-[#354B55]">Accurate Declaration</strong>
            <p className="text-[#6A808C] leading-relaxed">
              Consignors declare clothing or documents truthfully. Misdeclaration or concealment results in refusal.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#90E0EF] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-xs">
              2
            </span>
            <strong className="block text-[#354B55]">100% Unpacked Inspection</strong>
            <p className="text-[#6A808C] leading-relaxed">
              Items are removed completely from retail boxes and weighed on calibrated scales before a tamper-evident seal is applied.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#90E0EF] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-xs">
              3
            </span>
            <strong className="block text-[#354B55]">Sealed Handover Only</strong>
            <p className="text-[#6A808C] leading-relaxed">
              A vetted passenger only carries pre-sealed barcode parcels with documented certificates. Never open packages.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#90E0EF] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-xs">
              4
            </span>
            <strong className="block text-[#354B55]">Escrow Protection</strong>
            <p className="text-[#6A808C] leading-relaxed">
              Delivery payouts are held in escrow and released strictly after recipient confirmation.
            </p>
          </div>
        </div>

        {/* Prototype Legal Disclaimer Box */}
        <div className="pt-4 border-t border-[#90E0EF] text-[11px] text-[#6A808C] space-y-2">
          <p>
            <strong className="text-[#354B55]">Prototype Notice &amp; Terms:</strong> SwiftShare is a prototype feature in this preview. Route approval, traveller matching, counter inspection, and payouts are simulated. No live carrier partnerships or universal insurance is implied. Personal data and flight booking references remain protected.
          </p>
        </div>
      </div>
    </div>
  );
};

export const TravelCarryPage = SwiftSharePage;
