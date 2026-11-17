import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Plane,
  PlaneTakeoff,
  Anchor,
  Box,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Scale,
  Send,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { CargoType } from '../../types';

interface CargoPageProps {
  onOpenQuote?: () => void;
}

export const CargoPage: React.FC<CargoPageProps> = () => {
  const { cargoEnquiries, addCargoEnquiry, setActiveCustomerTab, setRole } = useDemo();

  // Enquiry form state
  const [originCity, setOriginCity] = useState('Lagos (Ikeja Cargo Gateway)');
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [destinationCity, setDestinationCity] = useState('London Heathrow (LHR)');
  const [cargoType, setCargoType] = useState<CargoType>('air_cargo');
  const [cargoDescription, setCargoDescription] = useState('');
  const [packageCount, setPackageCount] = useState<number>(4);
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<number>(250);
  const [lengthCm, setLengthCm] = useState<number>(120);
  const [widthCm, setWidthCm] = useState<number>(80);
  const [heightCm, setHeightCm] = useState<number>(90);
  const [desiredTimeframe, setDesiredTimeframe] = useState('Within 5-7 business days');
  const [specialHandlingNotes, setSpecialHandlingNotes] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!cargoDescription.trim()) {
      setFormError('Please enter a description of the cargo goods being transported.');
      return;
    }
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setFormError('Please provide your name, official email, and phone number so our commercial freight team can reach you.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const ref = addCargoEnquiry({
        originCountry: 'Nigeria',
        originCity,
        destinationCountry,
        destinationCity,
        cargoType,
        cargoDescription,
        packageCount: Number(packageCount) || 1,
        estimatedWeightKg: Number(estimatedWeightKg) || 50,
        dimensionsCm: {
          length: Number(lengthCm) || 100,
          width: Number(widthCm) || 100,
          height: Number(heightCm) || 100,
        },
        desiredTimeframe,
        specialHandlingNotes: specialHandlingNotes.trim() || undefined,
        companyName: companyName.trim() || undefined,
        contactName,
        contactEmail,
        contactPhone,
      });

      setIsSubmitting(false);
      setSubmittedRef(ref);
    }, 450);
  };

  const handleResetForm = () => {
    setSubmittedRef(null);
    setCargoDescription('');
    setSpecialHandlingNotes('');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 px-4 sm:px-6 text-[#1F2937]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Hero */}
        <div className="sv-card p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CAF0F8] border border-[#90E0EF] rounded-full text-[12px] font-medium text-[#0F172A]">
                <Box className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Commercial Freight &amp; Cargo Coordination</span>
              </div>
              <h1 className="sv-h1">
                Air Cargo, Sea Freight &amp; Commercial Pallet Logistics
              </h1>
              <p className="sv-body text-[#4B5563] max-w-2xl">
                When shipments exceed standard parcel weight thresholds (50kg to 20,000kg+), Swiftvero coordinates
                consolidated air cargo and sea freight arrangements with transparent quotation, physical intake verification,
                and regulatory export documentation.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#cargo-form"
                  className="sv-btn-primary min-h-[46px] px-7 py-2.5 rounded-full inline-flex items-center gap-2 shadow-xs"
                >
                  <span>Request a Cargo Quotation</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#4B5563]">
                  <Clock className="w-4 h-4 text-[#00B4D8]" />
                  <span>Quotations issued within 4–6 business hours</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="sv-card overflow-hidden">
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#F1F5F9]">
                  <img
                    src="/assets/aistudio/IMG_1994_fa0341f9.jpeg"
                    alt="SwiftVero operations officer supervising export cargo pallet stacks in Ikeja air logistics warehouse"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-4">
                    <div className="text-white">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-[#00B4D8] text-white px-2.5 py-0.5 rounded-full">
                        Certified Operations Facility
                      </span>
                      <h4 className="text-[13px] font-bold mt-1.5 text-white">
                        Ikeja Cargo Gateway (LOS) · Floor Staging &amp; Security
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div className="p-3 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] space-y-0.5">
                      <span className="sv-label block">Calibrated Scales</span>
                      <p className="font-bold text-[#111827]">Floor &amp; Pallet Scales</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] space-y-0.5">
                      <span className="sv-label block">Custody Protocol</span>
                      <p className="font-bold text-[#111827]">Barcoded Tamper Seals</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] space-y-0.5">
                      <span className="sv-label block">Consolidation</span>
                      <p className="font-bold text-[#111827]">Daily Flight Tenders</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] space-y-0.5">
                      <span className="sv-label block">Manifest Compliance</span>
                      <p className="font-bold text-[#111827]">100% Export Screened</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#CAF0F8] rounded-[10px] border border-[#90E0EF] flex items-start gap-2.5 text-[#0F172A]">
                    <ShieldCheck className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                    <p className="text-[12px] font-medium text-[#0F172A] leading-relaxed">
                      Transparent freight linehaul pricing with audited weigh-in receipts, commercial customs documentation, and scheduled departures.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Cargo Services Comparison */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <h2 className="sv-h2">Supported Commercial Freight Modes</h2>
            <p className="sv-body text-[#4B5563]">
              Choose the right balance of transit speed, container capacity, and budget for your commercial cargo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Air Cargo */}
            <div className="sv-card p-5 space-y-4 hover:border-[#90E0EF] transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="sv-h3">Air Cargo Consolidation</h3>
                  <p className="text-[12px] text-[#0096C7] font-semibold mt-0.5 tabular-nums">
                    50kg – 5,000kg+ | 3–6 business days
                  </p>
                </div>
                <p className="sv-body text-[#4B5563]">
                  Scheduled air freight departures from Lagos (LOS) to London Heathrow (LHR), Atlanta (ATL), JFK, Frankfurt (FRA), and Dubai (DXB).
                </p>
                <div className="space-y-1.5 pt-3 border-t border-[#E2E8F0] text-[13px] text-[#4B5563]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Master Air Waybill (MAWB) tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Perishable &amp; dry commodity handling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Airport-to-airport or door delivery</span>
                  </div>
                </div>
              </div>
              <a
                href="#cargo-form"
                onClick={() => setCargoType('air_cargo')}
                className="w-full min-h-[42px] flex items-center justify-center text-[13px] font-bold text-[#0F172A] bg-[#CAF0F8] hover:bg-[#90E0EF]/60 rounded-full transition-colors border border-[#90E0EF]"
              >
                Quote Air Cargo
              </a>
            </div>

            {/* Sea Freight FCL */}
            <div className="sv-card p-5 space-y-4 hover:border-[#90E0EF] transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="sv-h3">Sea Freight (FCL)</h3>
                  <p className="text-[12px] text-[#0096C7] font-semibold mt-0.5 tabular-nums">
                    20ft &amp; 40ft Containers | 18–35 days
                  </p>
                </div>
                <p className="sv-body text-[#4B5563]">
                  Full container load bookings from Apapa Port &amp; Tin Can Island. Dedicated dry van, reefer, and high-cube containers.
                </p>
                <div className="space-y-1.5 pt-3 border-t border-[#E2E8F0] text-[13px] text-[#4B5563]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Bill of Lading &amp; Clean Port Clearance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Fumigation &amp; Phytosanitary certificates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Factory loading or port gate-in</span>
                  </div>
                </div>
              </div>
              <a
                href="#cargo-form"
                onClick={() => setCargoType('sea_fcl')}
                className="w-full min-h-[42px] flex items-center justify-center text-[13px] font-bold text-[#0F172A] bg-[#CAF0F8] hover:bg-[#90E0EF]/60 rounded-full transition-colors border border-[#90E0EF]"
              >
                Quote 20ft/40ft FCL
              </a>
            </div>

            {/* Sea Freight LCL */}
            <div className="sv-card p-5 space-y-4 hover:border-[#90E0EF] transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="sv-h3">Sea Freight (LCL)</h3>
                  <p className="text-[12px] text-[#0096C7] font-semibold mt-0.5 tabular-nums">
                    1 to 10 CBM Pallets | 21–40 days
                  </p>
                </div>
                <p className="sv-body text-[#4B5563]">
                  Shared container space for commercial consignments too large for express air courier but under a full 20ft container load.
                </p>
                <div className="space-y-1.5 pt-3 border-t border-[#E2E8F0] text-[13px] text-[#4B5563]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Priced per Cubic Metre (CBM)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Pallet consolidation at Ikeja Hub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Cost-effective for non-urgent bulk</span>
                  </div>
                </div>
              </div>
              <a
                href="#cargo-form"
                onClick={() => setCargoType('sea_lcl')}
                className="w-full min-h-[42px] flex items-center justify-center text-[13px] font-bold text-[#0F172A] bg-[#CAF0F8] hover:bg-[#90E0EF]/60 rounded-full transition-colors border border-[#90E0EF]"
              >
                Quote LCL Consolidation
              </a>
            </div>

            {/* Project Cargo */}
            <div className="sv-card p-5 space-y-4 hover:border-[#90E0EF] transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="sv-h3">Project &amp; Heavy Cargo</h3>
                  <p className="text-[12px] text-[#0096C7] font-semibold mt-0.5">
                    Over-dimensional | Custom routing
                  </p>
                </div>
                <p className="sv-body text-[#4B5563]">
                  Specialised logistics for agricultural processing machinery, solar installations, and heavy commercial fabrications.
                </p>
                <div className="space-y-1.5 pt-3 border-t border-[#E2E8F0] text-[13px] text-[#4B5563]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Custom crating &amp; lashing inspection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Direct customs clearance desk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                    <span>Dedicated account coordinator</span>
                  </div>
                </div>
              </div>
              <a
                href="#cargo-form"
                onClick={() => setCargoType('project_cargo')}
                className="w-full min-h-[42px] flex items-center justify-center text-[13px] font-bold text-[#0F172A] bg-[#CAF0F8] hover:bg-[#90E0EF]/60 rounded-full transition-colors border border-[#90E0EF]"
              >
                Enquire Project Cargo
              </a>
            </div>
          </div>
        </div>

        {/* Operational Notice / Transparency */}
        <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] p-5 sm:p-6 text-[#0F172A] space-y-2">
          <div className="flex items-center gap-2 text-[14px] font-bold text-[#0F172A]">
            <AlertCircle className="w-4 h-4 text-[#00B4D8] shrink-0" />
            <span>Commercial Cargo Quotation Transparency Standard</span>
          </div>
          <p className="sv-body text-[#0F172A]/85">
            Swiftvero Express does not publish fabricated or automated live freight prices. Commercial air and ocean freight rates
            fluctuate according to airline master fuel surcharges, container ocean carrier spot rates, destination terminal handling
            charges, and commodity compliance classification. Our freight desk reviews your exact package weight, dimensional profile,
            and customs documentation to return a firm, itemised quotation within 4–6 business hours.
          </p>
        </div>

        {/* Interactive Cargo Enquiry Form */}
        <div id="cargo-form" className="sv-card p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="space-y-1 mb-6 pb-4 border-b border-[#E2E8F0]">
              <h2 className="sv-h2">Commercial Cargo Enquiry &amp; Quotation Request</h2>
              <p className="sv-body text-[#4B5563]">
                Submit your shipment details below. Our logistics desk will review capacity, packaging requirements, and export paperwork.
              </p>
            </div>

            {submittedRef ? (
              <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] p-6 space-y-4 text-[#0F172A]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#00B4D8] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="sv-h3 text-[#0F172A]">
                      Cargo Enquiry Submitted Successfully
                    </h3>
                    <p className="sv-body text-[#0F172A]/85">
                      Your enquiry reference is <span className="font-bold tabular-nums">{submittedRef}</span>.
                      Our commercial freight coordinator will inspect airline/sea carrier schedules and reply with a formal itemised quote.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 text-[13px] space-y-2">
                  <div className="font-bold text-[#111827]">Next Operational Steps:</div>
                  <ol className="list-decimal pl-4 space-y-1 text-[#4B5563]">
                    <li>Desk review of commodity description and destination customs rules.</li>
                    <li>Verification of package gross weight ({estimatedWeightKg} kg) vs volumetric cubic capacity.</li>
                    <li>Itemised quote dispatched to <span className="font-semibold text-[#111827]">{contactEmail}</span>.</li>
                    <li>Intake and pallet consolidation at the Ikeja Cargo Hub.</li>
                  </ol>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="min-h-[42px] px-5 py-2 text-[13px] font-bold text-[#111827] bg-white border border-[#CBD5E1] rounded-full hover:border-[#00B4D8] cursor-pointer"
                  >
                    Submit Another Cargo Enquiry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('customer');
                      setActiveCustomerTab('overview');
                    }}
                    className="sv-btn-primary min-h-[42px] px-5 py-2 rounded-full cursor-pointer"
                  >
                    View in Customer Portal
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                  <div className="bg-[#FDF2F2] border border-[#F8D7DA] text-[#B42318] text-[13px] font-medium p-3.5 rounded-[10px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Route & Mode */}
                <div className="space-y-4">
                  <h3 className="text-[12px] font-bold text-[#111827] uppercase tracking-wider">
                    1. Routing &amp; Freight Mode
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="sv-label block mb-1">
                        Origin City (Nigeria) <span className="text-[#B42318]">*</span>
                      </label>
                      <input
                        type="text"
                        value={originCity}
                        onChange={(e) => setOriginCity(e.target.value)}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                        placeholder="e.g. Lagos, Kano, Port Harcourt"
                        required
                      />
                    </div>
                    <div>
                      <label className="sv-label block mb-1">Destination Country</label>
                      <select
                        value={destinationCountry}
                        onChange={(e) => setDestinationCountry(e.target.value)}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                      >
                        <option value="United Kingdom">United Kingdom (UK)</option>
                        <option value="United States">United States (USA)</option>
                        <option value="Canada">Canada</option>
                        <option value="Germany">Germany (EU)</option>
                        <option value="United Arab Emirates">United Arab Emirates (Dubai)</option>
                        <option value="China">China</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Ghana">Ghana</option>
                      </select>
                    </div>
                    <div>
                      <label className="sv-label block mb-1">
                        Destination City / Airport / Port <span className="text-[#B42318]">*</span>
                      </label>
                      <input
                        type="text"
                        value={destinationCity}
                        onChange={(e) => setDestinationCity(e.target.value)}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                        placeholder="e.g. London Heathrow, Houston TX"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="sv-label block mb-1.5">Selected Freight Service</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[13px]">
                      {[
                        { id: 'air_cargo', label: 'Air Cargo', icon: Plane },
                        { id: 'sea_fcl', label: 'Sea FCL (20ft/40ft)', icon: Anchor },
                        { id: 'sea_lcl', label: 'Sea LCL (Pallet)', icon: Box },
                        { id: 'project_cargo', label: 'Project Freight', icon: Truck },
                      ].map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = cargoType === mode.id;
                        return (
                          <button
                            type="button"
                            key={mode.id}
                            onClick={() => setCargoType(mode.id as CargoType)}
                            className={`min-h-[44px] p-3 rounded-[10px] border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#CAF0F8] border-2 border-[#00B4D8] text-[#0F172A] font-bold'
                                : 'bg-white border-[#CBD5E1] text-[#1F2937] font-medium hover:border-[#90E0EF]'
                            }`}
                          >
                            <Icon className="w-4 h-4 text-[#00B4D8] shrink-0" />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 2: Commodity & Dimensions */}
                <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                  <h3 className="text-[12px] font-bold text-[#111827] uppercase tracking-wider">
                    2. Cargo Description &amp; Dimensions
                  </h3>
                  <div>
                    <label className="sv-label block mb-1">
                      Commodity / Item Description <span className="text-[#B42318]">*</span>
                    </label>
                    <input
                      type="text"
                      value={cargoDescription}
                      onChange={(e) => setCargoDescription(e.target.value)}
                      className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                      placeholder="e.g. 10 wooden crates of dried hibiscus flowers, or 3 pallets of textiles"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="sv-label block mb-1">
                        Packages / Pallets <span className="text-[#B42318]">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={packageCount}
                        onChange={(e) => setPackageCount(Number(e.target.value))}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                        required
                      />
                    </div>
                    <div>
                      <label className="sv-label block mb-1">
                        Total Weight (kg) <span className="text-[#B42318]">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={estimatedWeightKg}
                        onChange={(e) => setEstimatedWeightKg(Number(e.target.value))}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                        required
                      />
                    </div>
                    <div>
                      <label className="sv-label block mb-1">Length (cm)</label>
                      <input
                        type="number"
                        min="1"
                        value={lengthCm}
                        onChange={(e) => setLengthCm(Number(e.target.value))}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="sv-label block mb-1">Width (cm)</label>
                      <input
                        type="number"
                        min="1"
                        value={widthCm}
                        onChange={(e) => setWidthCm(Number(e.target.value))}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="sv-label block mb-1">Height (cm)</label>
                      <input
                        type="number"
                        min="1"
                        value={heightCm}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="sv-label block mb-1">Desired Shipping Timeframe</label>
                      <select
                        value={desiredTimeframe}
                        onChange={(e) => setDesiredTimeframe(e.target.value)}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                      >
                        <option value="Urgent (Next Available Flight / Sailing)">Urgent (Next Available Flight / Sailing)</option>
                        <option value="Within 5-7 business days">Within 5–7 business days</option>
                        <option value="Within 2-3 weeks">Within 2–3 weeks</option>
                        <option value="Flexible monthly schedule">Flexible monthly consolidation</option>
                      </select>
                    </div>
                    <div>
                      <label className="sv-label block mb-1">Special Handling / Export Notes (Optional)</label>
                      <input
                        type="text"
                        value={specialHandlingNotes}
                        onChange={(e) => setSpecialHandlingNotes(e.target.value)}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                        placeholder="e.g. Phytosanitary certificate ready, requires forklift at destination"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Contact & Company Details */}
                <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                  <h3 className="text-[12px] font-bold text-[#111827] uppercase tracking-wider">
                    3. Commercial Contact Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="sv-label block mb-1">Company / Enterprise Name (Optional)</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                        placeholder="e.g. Lekki Heritage Agro Exports Ltd"
                      />
                    </div>
                    <div>
                      <label className="sv-label block mb-1">
                        Authorized Contact Person <span className="text-[#B42318]">*</span>
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                        placeholder="e.g. Babatunde Adeleke"
                        required
                      />
                    </div>
                    <div>
                      <label className="sv-label block mb-1">
                        Official Email <span className="text-[#B42318]">*</span>
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                        placeholder="trade@company.ng"
                        required
                      />
                    </div>
                    <div>
                      <label className="sv-label block mb-1">
                        Phone Number (with WhatsApp) <span className="text-[#B42318]">*</span>
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                        placeholder="+234 803 000 0000"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="sv-label">
                    Enquiries are securely logged with an audit reference and assigned to a Swiftvero commercial logistics officer.
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="sv-btn-primary w-full sm:w-auto min-h-[46px] px-7 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-xs shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting Enquiry...' : 'Submit Cargo Enquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Existing / Submitted Enquiries Preview in Demo */}
        {cargoEnquiries.length > 0 && (
          <div className="sv-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="sv-h3">Active Cargo Enquiries ({cargoEnquiries.length})</h3>
                <p className="sv-label">Track real-time commercial desk review status and quote preparations.</p>
              </div>
              <span className="text-[12px] font-semibold text-[#0F172A] bg-[#CAF0F8] px-3 py-1 rounded-full border border-[#90E0EF]">
                Live Logistics Desk
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cargoEnquiries.map((enq) => (
                <div key={enq.id} className="border border-[#E2E8F0] rounded-[10px] p-4 bg-[#F8FAFC] space-y-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0096C7] tabular-nums">{enq.enquiryReference}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize bg-amber-50 text-amber-900 border border-amber-200">
                      {enq.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="font-bold text-[#111827]">{enq.cargoDescription}</div>
                  <div className="text-[#4B5563] grid grid-cols-2 gap-1 text-[12px] tabular-nums">
                    <div>Route: {enq.originCity} → {enq.destinationCity}</div>
                    <div>Mode: {enq.cargoType.replace('_', ' ').toUpperCase()}</div>
                    <div>Weight: {enq.estimatedWeightKg} kg ({enq.packageCount} units)</div>
                    <div>Company: {enq.companyName || enq.contactName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
