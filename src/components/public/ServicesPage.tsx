import React, { useState } from 'react';
import { Package, CheckCircle2, Zap } from 'lucide-react';
import { SUPPORTED_DESTINATIONS, calculateShippingQuote } from '../../utils/shipping-calculator';
import {
  QuoteOptionCard,
  QuoteOptionDetailsModal,
  QuoteOptionDetailSpec,
} from '../common/DhlStylePrimitives';

interface ServicesPageProps {
  onOpenQuote: () => void;
  onOpenComingSoon: () => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onOpenQuote }) => {
  const [detailModalOption, setDetailModalOption] = useState<QuoteOptionDetailSpec | null>(null);

  // Representative 2kg Lagos -> United Kingdom comparison estimate (clearly labeled as sample)
  const prioritySample = calculateShippingQuote({
    destinationCountry: 'United Kingdom',
    weightKg: 2,
    dimensions: { length: 30, width: 25, height: 15 },
    serviceTier: 'priority',
  });
  const standardSample = calculateShippingQuote({
    destinationCountry: 'United Kingdom',
    weightKg: 2,
    dimensions: { length: 30, width: 25, height: 15 },
    serviceTier: 'standard',
  });

  const prioritySpec: QuoteOptionDetailSpec = {
    id: 'priority',
    badge: 'Fastest International Lane',
    badgeTone: 'cyan',
    title: 'Priority Air Express',
    subtitle: 'Prioritized next-flight tender from Lagos (LOS) or Abuja (ABV) with 12h proactive monitoring.',
    estimatedCostNgn: prioritySample.totalAmount,
    deliveryWindow: '2 – 3 business days (target)',
    selected: true,
    ctaLabel: 'Quote Priority Air Express',
    includedItems: [
      'Free doorstep pickup (₦0) in Lagos, Abuja, and Port Harcourt',
      'Calibrated digital intake weighing & barcode photo manifest',
      'Expedited commercial airline tender & formal clearance queue',
      'Automated 12-hour tracking scan freshness alerts',
    ],
    exclusions: [
      'Customs duties & destination import VAT billed by destination authorities',
      'Subject to airline capacity on unsupported express lanes',
    ],
    disclaimer: 'Sample 2 kg Lagos → United Kingdom estimate including 7.5% VAT. Final price is locked after calibrated hub scale verification.',
  };

  const standardSpec: QuoteOptionDetailSpec = {
    id: 'standard',
    badge: 'Value Consolidated',
    badgeTone: 'neutral',
    title: 'Standard Air Courier',
    subtitle: 'Cost-optimized scheduled consolidation through our Ikeja International Hub for everyday shipments.',
    estimatedCostNgn: standardSample.totalAmount,
    deliveryWindow: '4 – 6 business days (target)',
    selected: false,
    ctaLabel: 'Quote Standard Air Courier',
    includedItems: [
      'Free doorstep pickup (₦0) across supported Nigerian hubs',
      'Calibrated digital intake weighing & photo verification',
      'Daily consolidated dispatch (0.5 kg to 500+ kg)',
      'Proactive delay & scan-window notifications',
    ],
    exclusions: [
      'Customs duties & destination import VAT billed by destination authorities',
      'Prohibited and dangerous goods excluded',
    ],
    disclaimer: 'Sample 2 kg Lagos → United Kingdom estimate including 7.5% VAT. Final price is locked after calibrated hub scale verification.',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="inline-block text-[12px] font-semibold text-[#0F172A] tracking-wide uppercase bg-[#CAF0F8] border border-[#90E0EF] px-3 py-1 rounded-full">
          Worldwide Shipping Solutions
        </span>
        <h1 className="sv-h1">
          Two clear international air tiers. Zero ambiguity.
        </h1>
        <p className="sv-body">
          Coordinated export carriage from Nigeria to over 180 global destinations and import coordination into Nigeria, backed by transparent itemized quotes, certified digital weighing, and free doorstep collection nationwide.
        </p>
      </div>

      {/* Free Pickup Callout */}
      <div className="p-4 sm:p-5 bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#00B4D8] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-[14px] text-[#0F172A]">
            <span className="font-bold">Complimentary Doorstep Collection: </span>
            <span className="text-[#0F172A]/85">Pickup from your home or business in Lagos, Abuja, Port Harcourt, and other hubs is completely free (₦0) on all bookings.</span>
          </div>
        </div>
        <button
          onClick={onOpenQuote}
          className="text-[13px] font-bold text-[#0F172A] underline underline-offset-4 hover:text-[#0096C7] whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          Book Pickup &rarr;
        </button>
      </div>

      {/* Services Grid using DHL-benchmark QuoteOptionCard */}
      <div className="space-y-4">
        <div>
          <h2 className="sv-h2">Available shipping options</h2>
          <p className="sv-label mt-0.5">
            Sample 2 kg Lagos (LOS) to United Kingdom estimates shown below (Demo rates).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuoteOptionCard
            option={prioritySpec}
            onSelect={onOpenQuote}
            onViewDetails={(opt) => setDetailModalOption(opt)}
          />
          <QuoteOptionCard
            option={standardSpec}
            onSelect={onOpenQuote}
            onViewDetails={(opt) => setDetailModalOption(opt)}
          />
        </div>
      </div>

      {/* Supported Global Routes Table */}
      <div className="sv-card p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="sv-h2">Major International Routes</h2>
          <p className="sv-label mt-0.5">Representative air transit timelines dispatched from Lagos (LOS) and Abuja (ABV).</p>
        </div>

        <div className="border border-[#E2E8F0] rounded-[10px] overflow-hidden text-[14px]">
          <div className="bg-[#F8FAFC] px-4 py-3 font-semibold text-[#111827] border-b border-[#E2E8F0] grid grid-cols-12 gap-2">
            <span className="col-span-5 sm:col-span-4">Destination Territory</span>
            <span className="col-span-4 sm:col-span-4">Standard Air Courier</span>
            <span className="col-span-3 sm:col-span-4">Priority Air Express</span>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {Object.values(SUPPORTED_DESTINATIONS).map((dest) => (
              <div key={dest.country} className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-[#F8FAFC] transition-colors">
                <span className="col-span-5 sm:col-span-4 font-semibold text-[#111827]">{dest.country}</span>
                <span className="col-span-4 sm:col-span-4 text-[#4B5563] tabular-nums">{dest.transitStandard}</span>
                <span className="col-span-3 sm:col-span-4">
                  {dest.prioritySupported ? (
                    <span className="inline-block text-[12px] font-semibold text-[#0F172A] bg-[#CAF0F8] border border-[#90E0EF] px-2.5 py-0.5 rounded-full tabular-nums">
                      Available ({dest.transitPriority})
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#4B5563] italic">Standard only</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Operational Comparison for Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="sv-card flex flex-col p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#0F172A]">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Priority Express Handling
                </span>
                <h3 className="sv-h3 mt-1">
                  Immediate Counter Intake &amp; Next-Flight Tender
                </h3>
              </div>
            </div>
          </div>
          <p className="sv-body text-[14px]">
            Consignments booked under Priority Air Express receive expedited counter intake on calibrated digital scales and same-day tender to commercial airlines departing Lagos (LOS) or Abuja (ABV).
          </p>
          <div className="space-y-2 pt-3 border-t border-[#E2E8F0] text-[13px] text-[#1F2937]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
              <span>Dedicated priority manifest line &amp; flight tender</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
              <span>Real-time flight departure and airway bill synchronization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
              <span>Target transit: 2–4 business days to UK, US, &amp; Europe</span>
            </div>
          </div>
        </div>

        <div className="sv-card flex flex-col p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#00B4D8]">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#111827] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#CBD5E1]">
                  Standard Courier Consolidation
                </span>
                <h3 className="sv-h3 mt-1">
                  Consolidated Linehaul &amp; High-Volume Efficiency
                </h3>
              </div>
            </div>
          </div>
          <p className="sv-body text-[14px]">
            Standard Air Courier packages are audited, barcode-scanned, and batched at our Ikeja consolidation depot, passing cost savings directly onto everyday shippers and small businesses.
          </p>
          <div className="space-y-2 pt-3 border-t border-[#E2E8F0] text-[13px] text-[#1F2937]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
              <span>Batch consolidated dispatch for optimal cost efficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
              <span>Calibrated scale intake with itemized weight receipts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
              <span>Target transit: 4–6 business days worldwide</span>
            </div>
          </div>
        </div>
      </div>

      <QuoteOptionDetailsModal
        option={detailModalOption}
        onClose={() => setDetailModalOption(null)}
        onSelectOption={onOpenQuote}
      />
    </div>
  );
};
