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
    <div className="bg-[#F5FBFD] min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Hero */}
        <div className="bg-white border border-[#DCEFF3] rounded-2xl p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CAF0F8] border border-[#90E0EF] rounded-full text-xs font-semibold text-[#00B4D8]">
                <Box className="w-3.5 h-3.5" />
                <span>Commercial Freight &amp; Cargo Coordination</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#354B55] tracking-tight">
                Air Cargo, Sea Freight &amp; Commercial Pallet Logistics
              </h1>
              <p className="text-sm sm:text-base text-[#6A808C] leading-relaxed max-w-2xl">
                When shipments exceed standard parcel weight thresholds (50kg to 20,000kg+), Swiftvero coordinates
                consolidated air cargo and sea freight arrangements with transparent quotation, physical intake verification,
                and regulatory export documentation.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#cargo-form"
                  className="px-5 py-2.5 bg-[#00B4D8] text-white text-xs sm:text-sm font-semibold rounded-lg hover:opacity-95 transition-opacity inline-flex items-center gap-2 shadow-xs"
                >
                  <span>Request a Cargo Quotation</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <div className="flex items-center gap-2 text-xs text-[#6A808C]">
                  <Clock className="w-4 h-4 text-[#00B4D8]" />
                  <span>Quotations issued within 4–6 business hours</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl border border-[#DCE8DF] shadow-xs bg-white overflow-hidden space-y-0">
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                  <img
                    src="/assets/aistudio/IMG_1994_fa0341f9.jpeg"
                    alt="SwiftVero operations officer supervising export cargo pallet stacks in Ikeja air logistics warehouse"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                    <div className="text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2F7D53] text-white px-2 py-0.5 rounded">
                        Certified Operations Facility
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-white">Ikeja Cargo Gateway (LOS) · Floor Staging &amp; Security</h4>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-[#F5FAF6] rounded-lg border border-[#DCE8DF] space-y-1">
                      <span className="text-[11px] text-[#66736B]">Calibrated Scales</span>
                      <p className="font-semibold text-[#174B35]">Floor &amp; Pallet Scales</p>
                    </div>
                    <div className="p-2.5 bg-[#F5FAF6] rounded-lg border border-[#DCE8DF] space-y-1">
                      <span className="text-[11px] text-[#66736B]">Custody Protocol</span>
                      <p className="font-semibold text-[#174B35]">Barcoded Tamper Seals</p>
                    </div>
                    <div className="p-2.5 bg-[#F5FAF6] rounded-lg border border-[#DCE8DF] space-y-1">
                      <span className="text-[11px] text-[#66736B]">Consolidation</span>
                      <p className="font-semibold text-[#174B35]">Daily Flight Tenders</p>
                    </div>
                    <div className="p-2.5 bg-[#F5FAF6] rounded-lg border border-[#DCE8DF] space-y-1">
                      <span className="text-[11px] text-[#66736B]">Manifest Compliance</span>
                      <p className="font-semibold text-[#174B35]">100% Export Screened</p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#EAF6EE] rounded-lg border border-[#DCE8DF] text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#2F7D53] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#174B35] leading-relaxed">
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
            <h2 className="text-2xl font-bold text-[#354B55]">Supported Commercial Freight Modes</h2>
            <p className="text-xs sm:text-sm text-[#6A808C]">
              Choose the right balance of transit speed, container capacity, and budget for your commercial cargo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Air Cargo */}
            <div className="bg-white border border-[#DCEFF3] rounded-xl p-5 space-y-4 hover:border-[#90E0EF] transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#354B55]">Air Cargo Consolidation</h3>
                  <p className="text-xs text-[#00B4D8] font-medium mt-0.5">50kg – 5,000kg+ | 3–6 business days</p>
                </div>
                <p className="text-xs text-[#6A808C] leading-relaxed">
                  Scheduled air freight departures from Lagos (LOS) to London Heathrow (LHR), Atlanta (ATL), JFK, Frankfurt (FRA), and Dubai (DXB).
                </p>
                <div className="space-y-1.5 pt-2 border-t border-[#DCEFF3] text-[11px] text-[#6A808C]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Master Air Waybill (MAWB) tracking</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Perishable &amp; dry commodity handling</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Airport-to-airport or door delivery</span>
                  </div>
                </div>
              </div>
              <a
                href="#cargo-form"
                onClick={() => setCargoType('air_cargo')}
                className="w-full text-center py-2 text-xs font-semibold text-[#00B4D8] bg-[#CAF0F8] hover:bg-[#CAF0F8] rounded-lg transition-colors border border-[#90E0EF]"
              >
                Quote Air Cargo
              </a>
            </div>

            {/* Sea Freight FCL */}
            <div className="bg-white border border-[#DCEFF3] rounded-xl p-5 space-y-4 hover:border-[#90E0EF] transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#354B55]">Sea Freight (FCL)</h3>
                  <p className="text-xs text-[#00B4D8] font-medium mt-0.5">20ft &amp; 40ft Containers | 18–35 days</p>
                </div>
                <p className="text-xs text-[#6A808C] leading-relaxed">
                  Full container load bookings from Apapa Port &amp; Tin Can Island. Dedicated dry van, reefer, and high-cube containers.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-[#DCEFF3] text-[11px] text-[#6A808C]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Bill of Lading &amp; Clean Port Clearance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Fumigation &amp; Phytosanitary certificates</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Factory loading or port gate-in</span>
                  </div>
                </div>
              </div>
              <a
                href="#cargo-form"
                onClick={() => setCargoType('sea_fcl')}
                className="w-full text-center py-2 text-xs font-semibold text-[#00B4D8] bg-[#CAF0F8] hover:bg-[#CAF0F8] rounded-lg transition-colors border border-[#90E0EF]"
              >
                Quote 20ft/40ft FCL
              </a>
            </div>

            {/* Sea Freight LCL */}
            <div className="bg-white border border-[#DCEFF3] rounded-xl p-5 space-y-4 hover:border-[#90E0EF] transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#354B55]">Sea Freight (LCL)</h3>
                  <p className="text-xs text-[#00B4D8] font-medium mt-0.5">1 to 10 CBM Pallets | 21–40 days</p>
                </div>
                <p className="text-xs text-[#6A808C] leading-relaxed">
                  Shared container space for commercial consignments too large for express air courier but under a full 20ft container load.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-[#DCEFF3] text-[11px] text-[#6A808C]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Priced per Cubic Metre (CBM)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Pallet consolidation at Ikeja Hub</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Cost-effective for non-urgent bulk</span>
                  </div>
                </div>
              </div>
              <a
                href="#cargo-form"
                onClick={() => setCargoType('sea_lcl')}
                className="w-full text-center py-2 text-xs font-semibold text-[#00B4D8] bg-[#CAF0F8] hover:bg-[#CAF0F8] rounded-lg transition-colors border border-[#90E0EF]"
              >
                Quote LCL Consolidation
              </a>
            </div>

            {/* Project Cargo */}
            <div className="bg-white border border-[#DCEFF3] rounded-xl p-5 space-y-4 hover:border-[#90E0EF] transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#354B55]">Project &amp; Heavy Cargo</h3>
                  <p className="text-xs text-[#00B4D8] font-medium mt-0.5">Over-dimensional | Custom routing</p>
                </div>
                <p className="text-xs text-[#6A808C] leading-relaxed">
                  Specialised logistics for agricultural processing machinery, solar installations, and heavy commercial fabrications.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-[#DCEFF3] text-[11px] text-[#6A808C]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Custom crating &amp; lashing inspection</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Direct customs clearance desk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Dedicated account coordinator</span>
                  </div>
                </div>
              </div>
              <a
                href="#cargo-form"
                onClick={() => setCargoType('project_cargo')}
                className="w-full text-center py-2 text-xs font-semibold text-[#00B4D8] bg-[#CAF0F8] hover:bg-[#CAF0F8] rounded-lg transition-colors border border-[#90E0EF]"
              >
                Enquire Project Cargo
              </a>
            </div>
          </div>
        </div>

        {/* Operational Notice / Transparency */}
        <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-xl p-5 text-xs text-[#354B55] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#00B4D8]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Commercial Cargo Quotation Transparency Standard</span>
          </div>
          <p className="text-[#6A808C] leading-relaxed">
            Swiftvero Express does not publish fabricated or automated live freight prices. Commercial air and ocean freight rates
            fluctuate according to airline master fuel surcharges, container ocean carrier spot rates, destination terminal handling
            charges, and commodity compliance classification. Our freight desk reviews your exact package weight, dimensional profile,
            and customs documentation to return a firm, itemised quotation within 4–6 business hours.
          </p>
        </div>

        {/* Interactive Cargo Enquiry Form */}
        <div id="cargo-form" className="bg-white border border-[#DCEFF3] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="max-w-3xl">
            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-bold text-[#354B55]">Commercial Cargo Enquiry &amp; Quotation Request</h2>
              <p className="text-xs text-[#6A808C]">
                Submit your shipment details below. Our logistics desk will review capacity, packaging requirements, and export paperwork.
              </p>
            </div>

            {submittedRef ? (
              <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#00B4D8] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#354B55]">
                      Cargo Enquiry Submitted Successfully
                    </h3>
                    <p className="text-xs text-[#6A808C]">
                      Your enquiry reference is <span className="font-mono font-bold text-[#00B4D8]">{submittedRef}</span>.
                      Our commercial freight coordinator will inspect airline/sea carrier schedules and reply with a formal itemised quote.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#DCEFF3] rounded-lg p-4 text-xs space-y-2">
                  <div className="font-semibold text-[#354B55]">Next Operational Steps:</div>
                  <ol className="list-decimal pl-4 space-y-1 text-[#6A808C]">
                    <li>Desk review of commodity description and destination customs rules.</li>
                    <li>Verification of package gross weight ({estimatedWeightKg} kg) vs volumetric cubic capacity.</li>
                    <li>Itemised quote dispatched to <span className="font-medium text-[#354B55]">{contactEmail}</span>.</li>
                    <li>Intake and pallet consolidation at the Ikeja Cargo Hub.</li>
                  </ol>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleResetForm}
                    className="px-4 py-2 text-xs font-semibold text-[#00B4D8] bg-white border border-[#90E0EF] rounded-lg hover:bg-[#F5FBFD]"
                  >
                    Submit Another Cargo Enquiry
                  </button>
                  <button
                    onClick={() => {
                      setRole('customer');
                      setActiveCustomerTab('overview');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#00B4D8] rounded-lg hover:opacity-95"
                  >
                    View in Customer Portal
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                  <div className="bg-[#FDF2F2] border border-[#F8D7DA] text-[#B42318] text-xs p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Route & Mode */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#354B55] uppercase tracking-wider">1. Routing &amp; Freight Mode</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Origin City (Nigeria)</label>
                      <input
                        type="text"
                        value={originCity}
                        onChange={(e) => setOriginCity(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                        placeholder="e.g. Lagos, Kano, Port Harcourt"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Destination Country</label>
                      <select
                        value={destinationCountry}
                        onChange={(e) => setDestinationCountry(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
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
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Destination City / Airport / Port</label>
                      <input
                        type="text"
                        value={destinationCity}
                        onChange={(e) => setDestinationCity(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                        placeholder="e.g. London Heathrow, Houston TX"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#354B55] mb-1.5">Selected Freight Service</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
                            className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                              isSelected
                                ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#00B4D8] font-semibold'
                                : 'bg-[#F5FBFD] border-[#DCEFF3] text-[#354B55] hover:bg-slate-50'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 2: Commodity & Dimensions */}
                <div className="space-y-4 pt-3 border-t border-[#DCEFF3]">
                  <h3 className="text-xs font-bold text-[#354B55] uppercase tracking-wider">2. Cargo Description &amp; Dimensions</h3>
                  <div>
                    <label className="block text-xs font-medium text-[#354B55] mb-1">
                      Commodity / Item Description
                    </label>
                    <input
                      type="text"
                      value={cargoDescription}
                      onChange={(e) => setCargoDescription(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                      placeholder="e.g. 10 wooden crates of dried hibiscus flowers, or 3 pallets of textiles"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Packages / Pallets</label>
                      <input
                        type="number"
                        min="1"
                        value={packageCount}
                        onChange={(e) => setPackageCount(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Total Weight (kg)</label>
                      <input
                        type="number"
                        min="1"
                        value={estimatedWeightKg}
                        onChange={(e) => setEstimatedWeightKg(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Length (cm)</label>
                      <input
                        type="number"
                        min="1"
                        value={lengthCm}
                        onChange={(e) => setLengthCm(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Width (cm)</label>
                      <input
                        type="number"
                        min="1"
                        value={widthCm}
                        onChange={(e) => setWidthCm(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Height (cm)</label>
                      <input
                        type="number"
                        min="1"
                        value={heightCm}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Desired Shipping Timeframe</label>
                      <select
                        value={desiredTimeframe}
                        onChange={(e) => setDesiredTimeframe(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                      >
                        <option value="Urgent (Next Available Flight / Sailing)">Urgent (Next Available Flight / Sailing)</option>
                        <option value="Within 5-7 business days">Within 5–7 business days</option>
                        <option value="Within 2-3 weeks">Within 2–3 weeks</option>
                        <option value="Flexible monthly schedule">Flexible monthly consolidation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Special Handling / Export Notes</label>
                      <input
                        type="text"
                        value={specialHandlingNotes}
                        onChange={(e) => setSpecialHandlingNotes(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                        placeholder="e.g. Phytosanitary certificate ready, requires forklift at destination"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Contact & Company Details */}
                <div className="space-y-4 pt-3 border-t border-[#DCEFF3]">
                  <h3 className="text-xs font-bold text-[#354B55] uppercase tracking-wider">3. Commercial Contact Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Company / Enterprise Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                        placeholder="e.g. Lekki Heritage Agro Exports Ltd"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Authorized Contact Person</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                        placeholder="e.g. Babatunde Adeleke"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Official Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                        placeholder="trade@company.ng"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#354B55] mb-1">Phone Number (with WhatsApp)</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                        placeholder="+234 803 000 0000"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DCEFF3] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[11px] text-[#6A808C]">
                    Enquiries are securely logged with an audit reference and assigned to a Swiftvero commercial logistics officer.
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#00B4D8] text-white text-xs sm:text-sm font-semibold rounded-lg hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-xs shrink-0 disabled:opacity-50"
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
          <div className="bg-white border border-[#DCEFF3] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#354B55]">Active Cargo Enquiries ({cargoEnquiries.length})</h3>
                <p className="text-xs text-[#6A808C]">Track real-time commercial desk review status and quote preparations.</p>
              </div>
              <span className="text-[11px] font-semibold text-[#00B4D8] bg-[#CAF0F8] px-2.5 py-1 rounded-full border border-[#90E0EF]">
                Live Logistics Desk
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cargoEnquiries.map((enq) => (
                <div key={enq.id} className="border border-[#DCEFF3] rounded-lg p-4 bg-[#F5FBFD] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#00B4D8]">{enq.enquiryReference}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize bg-amber-50 text-amber-700 border border-amber-200">
                      {enq.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="font-medium text-[#354B55]">{enq.cargoDescription}</div>
                  <div className="text-[#6A808C] grid grid-cols-2 gap-1 text-[11px]">
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
