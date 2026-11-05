import React from 'react';
import { ShieldCheck, Globe, Scale, Clock, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AboutPageProps {
  onOpenQuote: () => void;
  onOpenPolicy: (key: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenQuote, onOpenPolicy }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Hero Section */}
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-semibold text-[#00B4D8] tracking-wider uppercase bg-[#CAF0F8] px-2.5 py-1 rounded">
          About Swiftvero Express Ltd
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-display font-medium text-[#354B55] tracking-tight leading-tight">
          Built to an international operating standard, from Nigeria to the world.
        </h1>
        <p className="text-sm sm:text-base text-[#6A808C] leading-relaxed">
          Swiftvero Express is an international logistics technology company, headquartered in Nigeria, coordinating cargo, parcel, and express shipping to destinations worldwide, built to an international operating standard.
        </p>
      </div>

      {/* Core Principle Quote */}
      <div className="p-8 sm:p-10 bg-white rounded-xl border border-[#DCEFF3] shadow-xs relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold text-[#00B4D8] uppercase tracking-wider">Our Core Operating Promise</span>
          <blockquote className="text-xl sm:text-2xl font-serif-display font-medium text-[#354B55] leading-snug">
            “When your shipment needs attention, you shouldn’t have to chase us for answers.”
          </blockquote>
          <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed pt-2">
            Most international shippers experience the same anxiety: a package stops updating, customer service gives evasive replies, and unexpected fees arrive after pickup. Swiftvero was built to eliminate this friction through certified physical weighing, clear itemized billing, and proactive notification the moment an update is overdue.
          </p>
        </div>
      </div>

      {/* Real Operations Infrastructure Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-[#DCEFF3] overflow-hidden shadow-xs flex flex-col p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Victoria Island Intake Counter
                </span>
                <h3 className="text-base font-bold text-[#354B55] mt-1">
                  Certified Digital Scale Intake
                </h3>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#6A808C] leading-relaxed">
            Trained frontline intake officers verify carton dimensions and gross weight on calibrated scales. No rounded estimates, no surprise post-pickup invoices.
          </p>
          <div className="pt-2 border-t border-[#DCEFF3] flex items-center gap-2 text-xs text-[#354B55]">
            <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
            <span>Dual-calibrated physical scale verification before billing</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCEFF3] overflow-hidden shadow-xs flex flex-col p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Ikeja Cargo Consolidation Depot
                </span>
                <h3 className="text-base font-bold text-[#354B55] mt-1">
                  Rigorous Consolidation &amp; Security
                </h3>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#6A808C] leading-relaxed">
            Our central operations hub audits each carton, generates unique tracking barcodes, and performs NCAA-compliant cargo security screening before flight handoff.
          </p>
          <div className="pt-2 border-t border-[#DCEFF3] flex items-center gap-2 text-xs text-[#354B55]">
            <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
            <span>100% individual barcode audit &amp; flight manifest prep</span>
          </div>
        </div>
      </div>

      {/* Key Tenets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-[#DCEFF3] p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-base font-serif-display font-medium text-[#354B55]">Certified Digital Weighing</h2>
          <p className="text-xs text-[#6A808C] leading-relaxed">
            Every parcel is weighed with a calibrated digital scale in front of the consignor or at our consolidation depot. We do not invent arbitrary weights or round up without documented proof.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#DCEFF3] p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-serif-display font-medium text-[#354B55]">Proactive Delay Detection</h2>
          <p className="text-xs text-[#6A808C] leading-relaxed">
            Our systems monitor tracking scan freshness continuously. If a scheduled carrier update does not arrive within the expected window, we flag it proactively before you have to ask.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#DCEFF3] p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-serif-display font-medium text-[#354B55]">Regulatory Compliance</h2>
          <p className="text-xs text-[#6A808C] leading-relaxed">
            Strict adherence to Nigerian Civil Aviation Authority (NCAA) cargo security guidelines, civil aviation prohibited goods verification, and lawful KYC identity checks.
          </p>
        </div>
      </div>

      {/* Bidirectional Scope */}
      <div className="bg-[#CAF0F8] border border-[#DCEFF3] rounded-xl p-8 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold text-[#00B4D8] uppercase tracking-wider">Global Reach</span>
          <h2 className="text-2xl font-serif-display font-medium text-[#354B55]">
            Exporting Out of Nigeria & Importing Into Nigeria
          </h2>
          <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
            Whether you are sending commercial samples to North America, delivering retail fashion orders to London, or receiving vital components from Guangzhou into Lagos, Swiftvero manages the entire journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-4 rounded-lg border border-[#DCEFF3] space-y-1.5">
            <div className="font-semibold text-[#354B55] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
              <span>Doorstep Collection Across Nigeria — ₦0 (Free)</span>
            </div>
            <p className="text-[#6A808C] text-[11px]">
              We pick up from your home, workshop, or business in Lagos, Abuja, Port Harcourt, Ibadan, and Kano at zero collection surcharge.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#DCEFF3] space-y-1.5">
            <div className="font-semibold text-[#354B55] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
              <span>Two Clear Air Freight Tiers</span>
            </div>
            <p className="text-[#6A808C] text-[11px]">
              Choose Priority Air Express (2–3 business days) for time-critical consignments or Standard Air Courier (4–6 business days) for cost efficiency.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={onOpenQuote}
            className="px-5 py-2.5 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-md text-xs font-semibold transition-colors shadow-xs flex items-center gap-2"
          >
            <span>Get an Upfront Quote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
