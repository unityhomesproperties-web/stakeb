import React from 'react';
import { ShieldCheck, Globe, Scale, Clock, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AboutPageProps {
  onOpenQuote: () => void;
  onOpenPolicy: (key: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenQuote }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14 text-[#1F2937]">
      {/* Hero Section */}
      <div className="max-w-3xl space-y-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium text-[#0F172A] bg-[#CAF0F8] border border-[#90E0EF]">
          About Swiftvero Express Ltd
        </span>
        <h1 className="sv-h1">
          Built to an international operating standard, from Nigeria to the world.
        </h1>
        <p className="sv-body text-[#4B5563]">
          Swiftvero Express is an international logistics technology company, headquartered in Nigeria, coordinating cargo, parcel, and express shipping to destinations worldwide, built to an international operating standard.
        </p>
      </div>

      {/* Core Principle Quote */}
      <div className="sv-card p-6 sm:p-10 relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <span className="text-[12px] font-bold text-[#0096C7] uppercase tracking-wider">
            Our Core Operating Promise
          </span>
          <blockquote className="sv-h2 leading-snug">
            “When your shipment needs attention, you shouldn’t have to chase us for answers.”
          </blockquote>
          <p className="sv-body text-[#4B5563] pt-1">
            Most international shippers experience the same anxiety: a package stops updating, customer service gives evasive replies, and unexpected fees arrive after pickup. Swiftvero was built to eliminate this friction through certified physical weighing, clear itemized billing, and proactive notification the moment an update is overdue.
          </p>
        </div>
      </div>

      {/* Real Operations Infrastructure Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="sv-card p-6 sm:p-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8] shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center text-[12px] font-medium text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Victoria Island Intake Counter
                </span>
                <h3 className="sv-h3 mt-1.5">
                  Certified Digital Scale Intake
                </h3>
              </div>
            </div>
          </div>
          <p className="sv-body text-[#4B5563]">
            Trained frontline intake officers verify carton dimensions and gross weight on calibrated scales. No rounded estimates, no surprise post-pickup invoices.
          </p>
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center gap-2 text-[13px] font-medium text-[#111827]">
            <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
            <span>Dual-calibrated physical scale verification before billing</span>
          </div>
        </div>

        <div className="sv-card p-6 sm:p-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center text-[12px] font-medium text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Ikeja Cargo Consolidation Depot
                </span>
                <h3 className="sv-h3 mt-1.5">
                  Rigorous Consolidation &amp; Security
                </h3>
              </div>
            </div>
          </div>
          <p className="sv-body text-[#4B5563]">
            Our central operations hub audits each carton, generates unique tracking barcodes, and performs NCAA-compliant cargo security screening before flight handoff.
          </p>
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center gap-2 text-[13px] font-medium text-[#111827]">
            <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
            <span>100% individual barcode audit &amp; flight manifest prep</span>
          </div>
        </div>
      </div>

      {/* Key Tenets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="sv-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] text-[#00B4D8] flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="sv-h3">Certified Digital Weighing</h2>
          <p className="sv-body text-[#4B5563]">
            Every parcel is weighed with a calibrated digital scale in front of the sender or at our consolidation depot. We do not invent arbitrary weights or round up without documented proof.
          </p>
        </div>

        <div className="sv-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] text-[#00B4D8] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h2 className="sv-h3">Proactive Delay Detection</h2>
          <p className="sv-body text-[#4B5563]">
            Our systems monitor tracking scan freshness continuously. If a scheduled carrier update does not arrive within the expected window, we flag it proactively before you have to ask.
          </p>
        </div>

        <div className="sv-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] text-[#00B4D8] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="sv-h3">Regulatory Compliance</h2>
          <p className="sv-body text-[#4B5563]">
            Strict adherence to Nigerian Civil Aviation Authority (NCAA) cargo security guidelines, civil aviation prohibited goods verification, and lawful KYC identity checks.
          </p>
        </div>
      </div>

      {/* Bidirectional Scope */}
      <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] p-6 sm:p-8 space-y-6 text-[#0F172A]">
        <div className="max-w-2xl space-y-2">
          <span className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">Global Reach</span>
          <h2 className="sv-h2 text-[#0F172A]">
            Exporting Out of Nigeria &amp; Importing Into Nigeria
          </h2>
          <p className="sv-body text-[#0F172A]/85">
            Whether you are sending commercial samples to North America, delivering retail fashion orders to London, or receiving vital components from Guangzhou into Lagos, Swiftvero manages the entire journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[10px] border border-[#E2E8F0] space-y-1.5">
            <div className="text-[15px] font-bold text-[#111827] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
              <span>Doorstep Collection Across Nigeria — ₦0 (Free)</span>
            </div>
            <p className="text-[13px] text-[#4B5563] leading-relaxed">
              We pick up from your home, workshop, or business in Lagos, Abuja, Port Harcourt, Ibadan, and Kano at zero collection surcharge.
            </p>
          </div>
          <div className="bg-white p-5 rounded-[10px] border border-[#E2E8F0] space-y-1.5">
            <div className="text-[15px] font-bold text-[#111827] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
              <span>Two Clear Air Freight Tiers</span>
            </div>
            <p className="text-[13px] text-[#4B5563] leading-relaxed">
              Choose Priority Air Express (2–3 business days) for time-critical shipments or Standard Air Courier (4–6 business days) for cost efficiency.
            </p>
          </div>
        </div>

        <div className="pt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenQuote}
            className="sv-btn-primary min-h-[46px] px-7 py-2.5 rounded-full flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Get an Upfront Quote</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
