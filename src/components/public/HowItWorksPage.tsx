import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Scale, FileText, Truck, Clock, Building2, Package } from 'lucide-react';
import { PolicyKey } from '../common/LegalModal';

interface HowItWorksPageProps {
  onOpenQuote: () => void;
  onOpenPolicy: (key: PolicyKey) => void;
  onNavigate?: (navId: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onOpenQuote, onOpenPolicy, onNavigate }) => {
  const [activeJourney, setActiveJourney] = React.useState<'personal' | 'business' | 'bulk' | 'cargo'>('personal');

  const journeyDetails = {
    personal: {
      title: 'Personal Shipment Journey',
      subtitle: 'Sending gifts, apparel, documents, or personal belongings to family & friends abroad.',
      customerActions: [
        'Enter recipient address and approximate weight (or use the Shipping Assistant).',
        'Verify your phone number and National Identification Number (NIN) for aviation compliance.',
        'Choose free doorstep pickup or drop off at our Victoria Island or Ikeja intake desks.',
        'Review final verified quote on your mobile screen and confirm payment securely.',
      ],
      swiftveroActions: [
        'Dispatches courier with certified calibrated scales right to your doorstep at ₦0 fee.',
        'Seals package with tamper-evident serial tape and issues digital custody intake receipt.',
        'Processes civil aviation security clearance and tenders to scheduled international flight.',
        'Monitors transit scan intervals and notifies you proactively until recipient signs.',
      ],
    },
    business: {
      title: 'Business & Artisan Export Journey',
      subtitle: 'Selling products online to international buyers in the UK, USA, Canada, and Europe.',
      customerActions: [
        'Save repeat buyers in your Customer Portal Address Book or select saved shipment templates.',
        'Generate commercial proforma export invoices directly from your order details.',
        'Schedule a single consolidated pickup for multiple customer orders from your studio or store.',
        'Monitor delivery status across all buyers in your centralized business dashboard.',
      ],
      swiftveroActions: [
        'Conducts weight & dimension verification per carton with itemized business receipts.',
        'Provides individual tracking numbers for each of your international end-customers.',
        'Handles destination customs documentation and airline cargo master scheduling.',
        'Dispatches branded WhatsApp / Email delivery confirmations to your overseas buyers.',
      ],
    },
    bulk: {
      title: 'Bulk Batch Shipment Journey',
      subtitle: 'Organizing 10 to 100+ recipient packages in a single coordinated shipping batch.',
      customerActions: [
        'Upload recipient spreadsheet (CSV) or enter multiple destination addresses in one batch.',
        'Assign carton weights and contents descriptions to individual receivers.',
        'Receive a unified batch reference (e.g. SV-BATCH-001) with individual tracking IDs.',
        'Download consolidated batch financial invoices and printable shipping labels.',
      ],
      swiftveroActions: [
        'Performs warehouse package sorting, barcode labeling, and pallet staging at Ikeja Hub.',
        'Creates independent, auditable tracking timelines for every individual recipient parcel.',
        'Consolidates air freight uplift while ensuring separate destination last-mile delivery.',
        'Generates automated exception reports if any individual parcel in the batch faces customs hold.',
      ],
    },
    cargo: {
      title: 'Commercial Cargo & Freight Forwarding',
      subtitle: 'Moving 50kg to 20,000kg+ commercial freight, agricultural exports, or sea containers.',
      customerActions: [
        'Submit a Cargo Enquiry with package counts, gross weight, pallet dimensions, and timeframe.',
        'Provide export commodity documentation (Phytosanitary, NAFDAC, or Fumigation if needed).',
        'Approve itemized freight quotation based on actual airline MAWB or ocean container tariffs.',
        'Deliver goods to our Ikeja Consolidation Depot or book container factory loading.',
      ],
      swiftveroActions: [
        'Performs industrial floor scale digital weighing, pallet wrapping, and strapping verification.',
        'Books space on scheduled international cargo freighters or sea container vessels.',
        'Manages export customs clearance, Form NXP filing assistance, and port gate-in.',
        'Issues Master Air Waybill (MAWB) or Ocean Bill of Lading with commercial port tracking.',
      ],
    },
  };

  const currentJourney = journeyDetails[activeJourney];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14 text-[#1F2937]">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium text-[#0F172A] bg-[#CAF0F8] border border-[#90E0EF]">
          Operational Standards
        </span>
        <h1 className="sv-h1">
          How international shipping works with Swiftvero.
        </h1>
        <p className="sv-body text-[#4B5563]">
          From free doorstep pickup anywhere in supported Nigerian cities to final delivery abroad, every stage is verified with certified scales, itemized pricing, and proactive tracking.
        </p>
      </div>

      {/* 4 Multi-Journey Selector */}
      <div className="sv-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="sv-h2">Choose Your Shipping Journey</h2>
            <p className="sv-body text-[#4B5563] mt-0.5">
              Compare what you do versus what Swiftvero coordinates for each shipping type.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'personal', label: 'Personal Shipment' },
              { id: 'business', label: 'Business Order' },
              { id: 'bulk', label: 'Bulk Batch' },
              { id: 'cargo', label: 'Commercial Cargo' },
            ].map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveJourney(tab.id as any)}
                className={`min-h-[38px] px-4 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                  activeJourney === tab.id
                    ? 'bg-[#00B4D8] text-white shadow-xs'
                    : 'bg-[#CAF0F8] text-[#0F172A] border border-[#90E0EF] hover:bg-[#90E0EF]/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Journey Breakdown Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-5 sm:p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="sv-h3">{currentJourney.title}</h3>
            <p className="sv-body text-[#4B5563]">{currentJourney.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* What Customer Does */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-[12px] uppercase tracking-wider text-[#111827]">
                <span className="w-5 h-5 rounded-full bg-[#CAF0F8] text-[#0F172A] flex items-center justify-center text-[11px] font-extrabold">
                  ✓
                </span>
                <span>What You Do (The Customer)</span>
              </div>
              <ul className="space-y-2.5 text-[14px] text-[#4B5563]">
                {currentJourney.customerActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#F8FAFC] text-[#0F172A] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-[#90E0EF] tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What Swiftvero Does */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-[12px] uppercase tracking-wider text-[#0096C7]">
                <span className="w-5 h-5 rounded-full bg-[#00B4D8] text-white flex items-center justify-center text-[11px]">
                  ★
                </span>
                <span>What Swiftvero Coordinates</span>
              </div>
              <ul className="space-y-2.5 text-[14px] text-[#4B5563]">
                {currentJourney.swiftveroActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0 mt-1" />
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Steps detailed */}
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="sv-card p-6 sm:p-7 flex flex-col md:flex-row gap-6">
          <div className="text-[28px] font-extrabold text-[#00B4D8] tabular-nums shrink-0 md:w-16">
            01
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="sv-h3">
              Declare Contents &amp; Receive Indicative Quote
            </h2>
            <p className="sv-body text-[#4B5563]">
              Select whether you are exporting out of Nigeria or importing into Nigeria. Itemize your carton contents, approximate weight, and dimensions. We calculate chargeable volumetric weight and check your items against international civil aviation safety rules.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-[13px] font-medium text-[#111827]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Volumetric calculation (L×W×H/5000)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Civil aviation prohibited goods filter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Itemized cost preview</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="sv-card p-6 sm:p-7 flex flex-col md:flex-row gap-6">
          <div className="text-[28px] font-extrabold text-[#00B4D8] tabular-nums shrink-0 md:w-16">
            02
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="sv-h3">
              Identity Verification (KYC)
            </h2>
            <p className="sv-body text-[#4B5563]">
              Under Nigerian Civil Aviation Authority (NCAA) cargo security directives, all international senders must verify their identity. Simply provide your National Identification Number (NIN) or international passport number.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-[13px] font-medium text-[#111827]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Required by civil aviation security regulations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Encrypted and restricted compliance access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Completed once for your profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 - with photo of certified scale intake */}
        <div className="sv-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-8 p-6 sm:p-7 flex flex-col md:flex-row gap-6">
              <div className="text-[28px] font-extrabold text-[#00B4D8] tabular-nums shrink-0 md:w-16">
                03
              </div>
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#CAF0F8] border border-[#90E0EF] text-[#0F172A]">
                  Free Doorstep Collection (₦0)
                </div>
                <h2 className="sv-h3">
                  Doorstep Pickup &amp; Calibrated Digital Weighing
                </h2>
                <p className="sv-body text-[#4B5563]">
                  Our dispatch agent arrives at your address with a certified digital scale, or you can drop off at our Victoria Island counter. We physically verify measurements, seal your carton with tamper-evident security tape, and record custody in front of you. Pickup is 100% free (₦0).
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-[13px] font-medium text-[#111827]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>Free doorstep pickup across Nigeria (₦0)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>Calibrated digital scale verification</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>Instant digital custody receipt</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 relative h-64 sm:h-72 lg:h-full min-h-[260px] overflow-hidden bg-[#F1F5F9] border-t lg:border-t-0 lg:border-l border-[#E2E8F0]">
              <img
                src="/assets/aistudio/IMG_1995_d35e33d0.jpeg"
                alt="SwiftVero customer service specialist weighing export package on certified digital counter scale"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <div className="text-white text-[13px]">
                  <span className="font-bold block">SwiftVero Counter &amp; Intake Specialist</span>
                  <span className="text-[12px] text-slate-200">Certified Digital Weight Verification · Victoria Island Intake Counter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="sv-card p-6 sm:p-7 flex flex-col md:flex-row gap-6">
          <div className="text-[28px] font-extrabold text-[#00B4D8] tabular-nums shrink-0 md:w-16">
            04
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="sv-h3">
              Final Quote Confirmation &amp; Transparent Payment
            </h2>
            <p className="sv-body text-[#4B5563]">
              If verified scale measurements match your declaration, your price is exactly as quoted. If actual weight differs, an itemized adjustment is presented for your explicit approval before payment. No hidden deductions or arbitrary markups.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-[13px] font-medium text-[#111827]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Customer approval required for changes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>No surprise terminal charges</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Instant debit card or virtual bank transfer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5 - with consolidation hub card */}
        <div className="sv-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-8 p-6 sm:p-7 flex flex-col md:flex-row gap-6">
              <div className="text-[28px] font-extrabold text-[#00B4D8] tabular-nums shrink-0 md:w-16">
                05
              </div>
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#CAF0F8] border border-[#90E0EF] text-[#0F172A]">
                  Continuous Scan Monitoring
                </div>
                <h2 className="sv-h3">
                  International Air Transit &amp; Proactive Tracking
                </h2>
                <p className="sv-body text-[#4B5563]">
                  Your shipment is audited at our Ikeja consolidation depot and tendered for scheduled international carrier flights out of Lagos or Abuja. Our system continuously monitors scan freshness. If a tracking update does not arrive within the expected window, we flag it proactively before you have to ask.
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-[13px] font-medium text-[#111827]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>Automated scan gap detection</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>Truthful updates without invented excuses</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>Recipient signature upon delivery</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-[#F8FAFC] border-t lg:border-t-0 lg:border-l border-[#E2E8F0] p-6 flex flex-col justify-between space-y-4 h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#111827]">Ikeja Consolidation Hub</h4>
                  <p className="text-[12px] font-medium text-[#4B5563]">Murtala Muhammed Air Gateway</p>
                </div>
              </div>
              <div className="space-y-2 text-[13px] text-[#111827]">
                <div className="p-2.5 bg-white rounded-[8px] border border-[#E2E8F0] flex justify-between">
                  <span className="text-[#4B5563]">Custody Seal:</span>
                  <span className="font-semibold">Sequential Barcode</span>
                </div>
                <div className="p-2.5 bg-white rounded-[8px] border border-[#E2E8F0] flex justify-between">
                  <span className="text-[#4B5563]">Transit Notice:</span>
                  <span className="font-semibold text-[#0096C7]">Proactive Flight Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Packing Guidance */}
      <div className="sv-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 bg-[#F8FAFC] p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-[#E2E8F0] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
              <div className="w-12 h-12 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8] shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center text-[12px] font-medium text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Packaging &amp; Export Standard
                </span>
                <h3 className="sv-h3 mt-1.5">
                  Aviation Grade Carton Standard
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 text-[13px]">
              <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0]">
                <span className="sv-label block">Carton Wall Strength</span>
                <p className="font-bold text-[#111827] mt-0.5">Double-Wall Corrugated Fibreboard</p>
              </div>
              <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0]">
                <span className="sv-label block">Moisture &amp; Dust Barrier</span>
                <p className="font-bold text-[#111827] mt-0.5">Heavy Gauge Polyethylene Inner Liner</p>
              </div>
              <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0]">
                <span className="sv-label block">External Sealing</span>
                <p className="font-bold text-[#111827] mt-0.5">H-Tape Configuration (48mm Reinforced)</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 p-6 sm:p-9 space-y-4">
            <div className="space-y-2">
              <span className="text-[12px] font-bold text-[#0096C7] uppercase tracking-wider">
                Sender Checklist
              </span>
              <h2 className="sv-h2">
                How to Pack Your Items for Safe International Flight
              </h2>
              <p className="sv-body text-[#4B5563]">
                Whether sending bespoke textiles, handcrafted leather goods, or diaspora provisions, proper packing ensures safe transit through airport handling and customs scanning.
              </p>
            </div>

            <div className="space-y-2.5 text-[14px] text-[#111827]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0 mt-1" />
                <span>Use sturdy, rigid double-wall corrugated cartons suitable for air cargo pressure.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0 mt-1" />
                <span>Wrap textiles and apparel in protective waterproof poly-sleeves before boxing.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0 mt-1" />
                <span>Our dispatch agent applies certified tamper-evident security tape upon collection.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 sm:p-10 bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] text-center space-y-4 text-[#0F172A]">
        <h2 className="sv-h2 text-[#0F172A]">
          Ready to experience international shipping without the guesswork?
        </h2>
        <p className="sv-body text-[#0F172A]/85 max-w-md mx-auto">
          Calculate your itemized air freight quote in under 60 seconds with free doorstep collection included.
        </p>
        <div className="pt-1 flex justify-center">
          <button
            type="button"
            onClick={onOpenQuote}
            className="sv-btn-primary min-h-[46px] px-7 py-2.5 rounded-full shadow-xs cursor-pointer"
          >
            Get an Instant Quote
          </button>
        </div>
      </div>
    </div>
  );
};
