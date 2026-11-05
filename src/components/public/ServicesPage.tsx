import React from 'react';
import { Package, Truck, Clock, ShieldCheck, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { SUPPORTED_DESTINATIONS, formatNaira } from '../../utils/shipping-calculator';

interface ServicesPageProps {
  onOpenQuote: () => void;
  onOpenComingSoon: () => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onOpenQuote, onOpenComingSoon }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-semibold text-[#00B4D8] tracking-wider uppercase bg-[#CAF0F8] px-2.5 py-1 rounded">
          International Air Freight Solutions
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif-display font-medium text-[#354B55] tracking-tight">
          Two clear international air tiers. Zero ambiguity.
        </h1>
        <p className="text-sm text-[#6A808C] leading-relaxed">
          Coordinated export carriage from Nigeria to over 180 global destinations and import coordination into Nigeria, backed by transparent itemized quotes, certified digital weighing, and free doorstep collection nationwide.
        </p>
      </div>

      {/* Free Pickup Callout */}
      <div className="p-4 bg-[#CAF0F8] border border-[#DCEFF3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#00B4D8] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[#354B55]">Complimentary Doorstep Collection: </span>
            <span className="text-[#6A808C]">Pickup from your home or business in Lagos, Abuja, Port Harcourt, and other hubs is completely free (₦0) on all bookings.</span>
          </div>
        </div>
        <button
          onClick={onOpenQuote}
          className="text-xs font-semibold text-[#00B4D8] hover:underline whitespace-nowrap self-start sm:self-auto"
        >
          Book Pickup &rarr;
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Priority Air Express */}
        <div className="bg-white rounded-xl border-2 border-[#00B4D8] p-7 shadow-xs space-y-5 relative">
          <div className="absolute top-4 right-4 bg-[#CAF0F8] text-[#00B4D8] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Fastest International Lane</span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#6A808C]">Expedited Air Carriage</span>
            <h2 className="text-2xl font-serif-display font-medium text-[#354B55]">Priority Air Express</h2>
          </div>

          <p className="text-xs text-[#6A808C] leading-relaxed">
            Prioritized airport tender on the next available commercial flight out of Lagos or Abuja. Designed for time-sensitive commercial contracts, original legal documents, urgent product samples, and critical merchandise.
          </p>

          <div className="p-4 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#6A808C]">Target Transit:</span>
              <span className="font-semibold text-[#354B55]">2 – 3 business days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6A808C]">Doorstep Collection:</span>
              <span className="font-semibold text-[#00B4D8]">₦0 (Included Free)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6A808C]">Proactive Monitoring:</span>
              <span className="font-semibold text-[#00B4D8]">Automated 12h scan freshness</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6A808C]">Customs Clearance:</span>
              <span className="font-semibold text-[#354B55]">Expedited formal queue</span>
            </div>
          </div>

          <button
            onClick={onOpenQuote}
            className="w-full py-2.5 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Quote Priority Air Express</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Standard Air Courier */}
        <div className="bg-white rounded-xl border border-[#DCEFF3] p-7 shadow-xs space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#6A808C]">Consolidated Air Carriage</span>
            <h2 className="text-2xl font-serif-display font-medium text-[#354B55]">Standard Air Courier</h2>
          </div>

          <p className="text-xs text-[#6A808C] leading-relaxed">
            Cost-optimized scheduled air cargo carriage balancing transit speed and budget. Consolidated daily through our Ikeja consolidation facility for everyday commercial orders, fashion consignments, gifts, and personal parcels.
          </p>

          <div className="p-4 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#6A808C]">Target Transit:</span>
              <span className="font-semibold text-[#354B55]">4 – 6 business days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6A808C]">Doorstep Collection:</span>
              <span className="font-semibold text-[#00B4D8]">₦0 (Included Free)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6A808C]">Consolidation Hub:</span>
              <span className="font-semibold text-[#354B55]">Ikeja International Hub, Lagos</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6A808C]">Weight Range:</span>
              <span className="font-semibold text-[#354B55]">0.5 kg to 500+ kg</span>
            </div>
          </div>

          <button
            onClick={onOpenQuote}
            className="w-full py-2.5 bg-white border border-[#DCEFF3] hover:bg-[#CAF0F8] text-[#354B55] hover:text-[#00B4D8] rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Quote Standard Air Courier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Supported Global Routes Table */}
      <div className="bg-white rounded-xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h2 className="text-lg font-serif-display font-medium text-[#354B55]">Major International Routes</h2>
          <p className="text-xs text-[#6A808C] mt-0.5">Representative air transit timelines dispatched from Lagos (LOS) and Abuja (ABV).</p>
        </div>

        <div className="border border-[#DCEFF3] rounded-lg overflow-hidden text-xs">
          <div className="bg-[#F5FBFD] px-4 py-3 font-semibold text-[#354B55] border-b border-[#DCEFF3] grid grid-cols-12 gap-2">
            <span className="col-span-5 sm:col-span-4">Destination Territory</span>
            <span className="col-span-4 sm:col-span-4">Standard Air Courier</span>
            <span className="col-span-3 sm:col-span-4">Priority Air Express</span>
          </div>
          <div className="divide-y divide-[#DCEFF3]">
            {Object.values(SUPPORTED_DESTINATIONS).map((dest) => (
              <div key={dest.country} className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-[#F5FBFD] transition-colors">
                <span className="col-span-5 sm:col-span-4 font-medium text-[#354B55]">{dest.country}</span>
                <span className="col-span-4 sm:col-span-4 text-[#6A808C]">{dest.transitStandard}</span>
                <span className="col-span-3 sm:col-span-4">
                  {dest.prioritySupported ? (
                    <span className="text-[11px] font-semibold text-[#00B4D8] bg-[#CAF0F8] px-2 py-0.5 rounded">
                      Available ({dest.transitPriority})
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#6A808C] italic">Standard only</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Operational Comparison for Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-[#DCEFF3] overflow-hidden shadow-xs flex flex-col p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#DCEFF3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Priority Express Handling
                </span>
                <h3 className="text-base font-bold text-[#354B55] mt-1">
                  Immediate Counter Intake &amp; Next-Flight Tender
                </h3>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
            Consignments booked under Priority Air Express receive expedited counter intake on calibrated digital scales and same-day tender to commercial airlines departing Lagos (LOS) or Abuja (ABV).
          </p>
          <div className="space-y-2 pt-2 border-t border-[#DCEFF3] text-xs text-[#354B55]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
              <span>Dedicated priority manifest line &amp; flight tender</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
              <span>Real-time flight departure and airway bill synchronization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
              <span>Target transit: 2–4 business days to UK, US, &amp; Europe</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCEFF3] overflow-hidden shadow-xs flex flex-col p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#DCEFF3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F5FBFD] border border-[#DCEFF3] flex items-center justify-center text-[#00B4D8]">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#354B55] bg-[#F5FBFD] px-2.5 py-0.5 rounded-full border border-[#DCEFF3]">
                  Standard Courier Consolidation
                </span>
                <h3 className="text-base font-bold text-[#354B55] mt-1">
                  Consolidated Linehaul &amp; High-Volume Efficiency
                </h3>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
            Standard Air Courier packages are audited, barcode-scanned, and batched at our Ikeja consolidation depot, passing cost savings directly onto everyday shippers and small businesses.
          </p>
          <div className="space-y-2 pt-2 border-t border-[#DCEFF3] text-xs text-[#354B55]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
              <span>Batch consolidated dispatch for optimal cost efficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
              <span>Calibrated scale intake with itemized weight receipts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
              <span>Target transit: 4–6 business days worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
