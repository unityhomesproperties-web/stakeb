import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  SUPPORTED_DESTINATIONS,
  generateQuoteBreakdown,
  formatNaira,
} from '../../utils/shipping-calculator';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Star,
  Search,
  Package,
  Clock,
  Globe2,
  ChevronDown,
  ChevronUp,
  Scale,
  Building2,
  Briefcase,
  Plane,
} from 'lucide-react';

interface HomePageProps {
  onOpenQuote: () => void;
  onOpenTrack: () => void;
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  onOpenComingSoon: () => void;
  onNavigateToSwiftShare?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenQuote,
  onOpenTrack,
  onOpenAuth,
  onOpenComingSoon,
  onNavigateToSwiftShare,
}) => {
  const { reviews, setActivePublicNav } = useDemo();

  // Quick estimator state
  const [direction, setDirection] = useState<'export' | 'import'>('export');
  const [calcCountry, setCalcCountry] = useState('United Kingdom');
  const [calcWeight, setCalcWeight] = useState(3.0);
  const [calcTier, setCalcTier] = useState<'standard' | 'priority'>('standard');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const quickQuote = generateQuoteBreakdown({
    destinationCountry: calcCountry,
    actualWeightKg: calcWeight,
    lengthCm: 25,
    widthCm: 20,
    heightCm: 15,
    tier: calcTier,
    pickupRequired: true,
  });

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="pt-8 md:pt-14 pb-6 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Hero Copy (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]">
              <Globe2 className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>International Air Freight &amp; Express Cargo</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#354B55] tracking-tight leading-[1.12]">
              Shipping Made Clear. <br className="hidden sm:inline" />Logistics Made Easier.
            </h1>

            <p className="text-base sm:text-lg text-[#6A808C] leading-relaxed max-w-xl font-normal">
              From personal packages and artisan crafts to commercial cargo and diaspora logistics, Swiftvero coordinates transparent air carriage with doorstep collection and certified scale intake.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onOpenQuote}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-lg transition-colors shadow-xs flex items-center gap-2"
              >
                <span>Get a Shipping Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenTrack}
                className="px-5 py-3.5 text-sm font-semibold text-[#354B55] bg-white hover:bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <Search className="w-4 h-4 text-[#00B4D8]" />
                <span>Track a Shipment</span>
              </button>
            </div>

            {/* Core Trust Principle */}
            <div className="pt-4 border-t border-[#DCEFF3] flex flex-wrap items-center gap-6 text-xs text-[#6A808C]">
              <div className="flex items-center gap-1.5 font-medium text-[#354B55]">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Free doorstep pickup &amp; intake</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#354B55]">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Verified physical scale weighing</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#354B55]">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Proactive overdue update alerts</span>
              </div>
            </div>
          </div>

          {/* Quick Rate Estimator Box (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-[#DCEFF3] pb-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#354B55]">Instant Rate Estimator</h3>
                <span className="text-[11px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Pickup Free
                </span>
              </div>
              <p className="text-xs text-[#6A808C] mt-1">Get an upfront price estimate in seconds.</p>
            </div>

            {/* Direction switcher */}
            <div className="flex rounded-lg border border-[#DCEFF3] p-1 bg-[#F5FBFD]">
              <button
                type="button"
                onClick={() => setDirection('export')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  direction === 'export' ? 'bg-white text-[#354B55] shadow-xs' : 'text-[#6A808C] hover:text-[#354B55]'
                }`}
              >
                Export (Out of Nigeria)
              </button>
              <button
                type="button"
                onClick={() => setDirection('import')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  direction === 'import' ? 'bg-white text-[#354B55] shadow-xs' : 'text-[#6A808C] hover:text-[#354B55]'
                }`}
              >
                Import (Into Nigeria)
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#354B55] mb-1.5">
                  {direction === 'export' ? 'Destination Country' : 'Origin Country'}
                </label>
                <select
                  value={calcCountry}
                  onChange={(e) => setCalcCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg bg-[#F5FBFD] text-[#354B55] focus:outline-hidden focus:border-[#00B4D8]"
                >
                  {Object.keys(SUPPORTED_DESTINATIONS).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#354B55] mb-1.5">Scale Weight (kg)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg text-[#354B55] font-mono bg-[#F5FBFD] focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#354B55] mb-1.5">Service Speed</label>
                  <select
                    value={calcTier}
                    onChange={(e) => setCalcTier(e.target.value as 'standard' | 'priority')}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg bg-[#F5FBFD] text-[#354B55] focus:outline-hidden focus:border-[#00B4D8]"
                  >
                    <option value="standard">Standard Air Courier (4–6 Days)</option>
                    <option value="priority">Priority Air Express (2–3 Days)</option>
                  </select>
                </div>
              </div>

              {/* Estimate breakdown output */}
              <div className="pt-3 border-t border-[#DCEFF3] space-y-2">
                <div className="flex justify-between items-center text-xs text-[#6A808C]">
                  <span>Air Carriage Linehaul</span>
                  <span className="font-mono text-[#354B55]">{formatNaira(quickQuote.freightCharge)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#6A808C]">
                  <span>Jet Fuel &amp; Airport Security</span>
                  <span className="font-mono text-[#354B55]">{formatNaira(quickQuote.jetFuelSurcharge + quickQuote.handlingCharge)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#6A808C]">
                  <span>Doorstep Collection</span>
                  <span className="text-[#008EA8] font-semibold">Free (₦0)</span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#6A808C]">
                  <span>Statutory VAT (7.5%)</span>
                  <span className="font-mono text-[#354B55]">{formatNaira(quickQuote.vatAmount)}</span>
                </div>

                <div className="pt-2 border-t border-[#DCEFF3] flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-semibold text-[#354B55]">Estimated Total:</span>
                    <p className="text-[10px] text-[#6A808C]">Target delivery: {quickQuote.estimatedDeliveryDisplay}</p>
                  </div>
                  <span className="text-lg font-bold font-mono text-[#008EA8]">
                    {formatNaira(quickQuote.totalAmount)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenQuote}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Book This Shipment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Authentic Operational Trust & Artisan Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Certified Scale Weighing */}
          <div className="bg-white border border-[#DCEFF3] rounded-2xl overflow-hidden shadow-xs flex flex-col p-6 sm:p-7 justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#DCEFF3]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                      Victoria Island Hub · Certified Intake
                    </span>
                    <h3 className="text-xl font-bold text-[#354B55] mt-1">
                      Certified Scales. No Invented Weights.
                    </h3>
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
                Every parcel is weighed on calibrated digital scales at our walk-in reception counter or right at your doorstep. We show you the exact verified weight and itemized quote for your approval before you pay a single kobo.
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
                <div className="p-3 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                  <span className="text-[11px] text-[#6A808C]">Verification</span>
                  <p className="font-semibold text-[#354B55] mt-0.5">Dual-Axis Calibrated</p>
                </div>
                <div className="p-3 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                  <span className="text-[11px] text-[#6A808C]">Transparency</span>
                  <p className="font-semibold text-[#354B55] mt-0.5">Itemized Quote Lock</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-[#DCEFF3] flex items-center justify-between text-xs text-[#008EA8] font-medium">
              <span>Free doorstep pickup &amp; scale intake</span>
              <span className="font-semibold">₦0 Surcharge</span>
            </div>
          </div>

          {/* Card 2: Empowering Nigerian Artisans & Merchants */}
          <div className="bg-white border border-[#DCEFF3] rounded-2xl overflow-hidden shadow-xs flex flex-col p-6 sm:p-7 justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#DCEFF3]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                    <Globe2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                      Local Artisans · Global Reach
                    </span>
                    <h3 className="text-xl font-bold text-[#354B55] mt-1">
                      From Nigerian Ateliers to Global Doors
                    </h3>
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
                Empowering local fashion designers, Adire crafters, leather artisans, and families sending gifts abroad. We coordinate compliant international air carriage to the UK, US, Canada, Europe, and 180+ global destinations.
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
                <div className="p-3 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                  <span className="text-[11px] text-[#6A808C]">Packaging</span>
                  <p className="font-semibold text-[#354B55] mt-0.5">Export Standard Cartons</p>
                </div>
                <div className="p-3 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                  <span className="text-[11px] text-[#6A808C]">Network</span>
                  <p className="font-semibold text-[#354B55] mt-0.5">180+ World Gateways</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-[#DCEFF3] flex items-center justify-between text-xs text-[#008EA8] font-medium">
              <span>Compliant commercial packaging guide</span>
              <span className="font-semibold">Export Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2b. Trust Principle Banner */}
      <section className="bg-[#CAF0F8]/40 border-y border-[#DCEFF3] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#354B55] leading-snug">
              “When your shipment needs attention, you shouldn’t have to chase us for answers.”
            </h2>
            <p className="text-sm text-[#6A808C] leading-relaxed">
              We monitor every scan milestone. If an expected update is overdue or an exception occurs, our team flags it and notifies you honestly before you have to ask.
            </p>
          </div>
        </div>
      </section>

      {/* 3. The 6-Step Visual Shipping Journey */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]">
            Transparent Operational Lifecycle
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#354B55]">
            The Swiftvero Shipping Journey
          </h2>
          <p className="text-sm text-[#6A808C]">
            From initial booking to final destination sign-off, every phase is transparent and verified.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            {
              num: '01',
              title: 'Create Your Shipment',
              desc: 'Declare package contents, approximate weight, and destination recipient address online.',
            },
            {
              num: '02',
              title: 'Collection or Drop-off',
              desc: 'Book free doorstep collection across Nigerian cities or visit our walk-in intake counters.',
            },
            {
              num: '03',
              title: 'Confirm Your Quotation',
              desc: 'Calibrated scale weighing generates your itemized quote for review. You approve before paying.',
            },
            {
              num: '04',
              title: 'Complete Payment',
              desc: 'Pay securely via debit card or virtual bank transfer with an immediate digital VAT receipt.',
            },
            {
              num: '05',
              title: 'Follow Your Shipment',
              desc: 'Track flight departures, customs milestones, and transit scans without chasing updates.',
            },
            {
              num: '06',
              title: 'Delivery Confirmation',
              desc: 'Recipient signs upon delivery abroad. Milestone closed and 3% cashback unlocked.',
            },
          ].map((item) => (
            <div
              key={item.num}
              className="bg-white border border-[#DCEFF3] rounded-xl p-5 space-y-2.5 hover:border-[#00B4D8] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded border border-[#90E0EF]">
                  {item.num}
                </span>
                <h3 className="text-xs font-bold text-[#354B55]">{item.title}</h3>
                <p className="text-[11px] text-[#6A808C] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3b. "Sending Your First Package?" - Personal Shipping Starter Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#F5FBFD] border border-[#DCEFF3] rounded-2xl p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#008EA8] uppercase tracking-wider">
                First-Time Shipper Friendly
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#354B55]">
                Sending Your First Package Abroad?
              </h2>
              <p className="text-xs sm:text-sm text-[#6A808C] max-w-xl">
                You don't need to be an export logistics expert. Swiftvero takes care of the paperwork, scales, and customs details.
              </p>
            </div>
            <button
              onClick={() => setActivePublicNav('assistant')}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <span>Try Guided Shipping Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="bg-white border border-[#DCEFF3] rounded-xl p-5 space-y-2 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#008EA8] font-bold text-xs">
                A
              </div>
              <h3 className="text-xs font-bold text-[#354B55]">No Scale at Home? No Problem.</h3>
              <p className="text-[11px] text-[#6A808C] leading-relaxed">
                Give us your best guess online. Our courier brings a certified digital scale to your doorstep and weighs it right in front of you for free.
              </p>
            </div>

            <div className="bg-white border border-[#DCEFF3] rounded-xl p-5 space-y-2 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#008EA8] font-bold text-xs">
                B
              </div>
              <h3 className="text-xs font-bold text-[#354B55]">Clear Prohibited Goods Check</h3>
              <p className="text-[11px] text-[#6A808C] leading-relaxed">
                We clearly guide you on what cannot fly (pressurized sprays, raw meat, unsealed foods) so your package clears customs smoothly without seizure.
              </p>
            </div>

            <div className="bg-white border border-[#DCEFF3] rounded-xl p-5 space-y-2 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#008EA8] font-bold text-xs">
                C
              </div>
              <h3 className="text-xs font-bold text-[#354B55]">You Approve Before Paying</h3>
              <p className="text-[11px] text-[#6A808C] leading-relaxed">
                We never deduct payment without your explicit confirmation. You see the verified weight, route linehaul, and delivery window before paying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Our Service Tiers (Carrier Neutral) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="border-b border-[#DCEFF3] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#354B55]">
              International Service Tiers
            </h2>
            <p className="text-xs text-[#6A808C] mt-1">
              Export and import on supported commercial lanes worldwide.
            </p>
          </div>
          <button
            onClick={onOpenQuote}
            className="text-xs font-semibold text-[#00B4D8] hover:underline flex items-center gap-1"
          >
            <span>Compare specific route</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Priority Air Express */}
          <div className="bg-white border border-[#DCEFF3] rounded-2xl p-7 space-y-4 relative shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]">
              Fastest Available Lane
            </div>
            <h3 className="text-xl font-bold text-[#354B55]">Priority Air Express</h3>
            <p className="text-xs text-[#6A808C] leading-relaxed">
              Fastest scheduled air transit for time-sensitive cargo, artisan exports, and critical documents.
            </p>
            <div className="pt-3 border-t border-[#DCEFF3] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6A808C]">Target Transit:</span>
                <span className="font-semibold text-[#354B55]">2 – 3 business days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A808C]">Intake Handling:</span>
                <span className="font-semibold text-[#354B55]">Same-day flight tender</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A808C]">Doorstep Collection:</span>
                <span className="text-[#008EA8] font-semibold">Free (₦0)</span>
              </div>
            </div>
            <button
              onClick={onOpenQuote}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-lg transition-colors shadow-xs"
            >
              Select Priority Express
            </button>
          </div>

          {/* Standard Air Courier */}
          <div className="bg-white border border-[#DCEFF3] rounded-2xl p-7 space-y-4 shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-[#6A808C]">
              Cost-Optimized Lane
            </div>
            <h3 className="text-xl font-bold text-[#354B55]">Standard Air Courier</h3>
            <p className="text-xs text-[#6A808C] leading-relaxed">
              Reliable, consolidated air cargo for small businesses, commercial parcels, and non-urgent shipments.
            </p>
            <div className="pt-3 border-t border-[#DCEFF3] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6A808C]">Target Transit:</span>
                <span className="font-semibold text-[#354B55]">4 – 6 business days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A808C]">Intake Handling:</span>
                <span className="font-semibold text-[#354B55]">Consolidated scheduled flight</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A808C]">Doorstep Collection:</span>
                <span className="text-[#008EA8] font-semibold">Free (₦0)</span>
              </div>
            </div>
            <button
              onClick={onOpenQuote}
              className="w-full py-2.5 text-xs font-semibold text-[#354B55] border border-[#DCEFF3] hover:bg-[#F5FBFD] rounded-lg transition-colors"
            >
              Select Standard Courier
            </button>
          </div>
        </div>
      </section>

      {/* 5. Proactive Delay Alerts Feature */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-[#DCEFF3] rounded-2xl p-8 md:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Automated Scan-Gap Detection</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#354B55]">
                We notify you first when an update is delayed.
              </h2>
              <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
                Logistics transfers can occasionally experience airport documentation checks or customs queues.
                Instead of leaving you wondering why a status hasn’t changed, our system flags scan gaps automatically
                and sends an honest explanation.
              </p>
              <div className="p-4 bg-[#CAF0F8]/40 border border-[#90E0EF] rounded-xl text-xs text-[#354B55] space-y-1">
                <p className="font-semibold text-[#008EA8]">Our Real-World Customer Notice:</p>
                <p className="italic text-[#6A808C]">
                  “Your shipment has not received a new tracking update within the expected window. Our team is checking the latest available information. We will update you as soon as we have confirmation.”
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="p-5 border border-[#DCEFF3] rounded-xl bg-[#F5FBFD] space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-[#354B55]">
                  <span>Consignment SWV-2026-NG8491</span>
                  <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full text-[11px]">Under Review</span>
                </div>
                <p className="text-xs text-[#6A808C]">
                  Heathrow Airport transfer scan pending. Logistics desk opened active liaison with ground handler.
                </p>
                <button
                  onClick={onOpenTrack}
                  className="w-full py-2 text-xs font-semibold text-[#008EA8] bg-white border border-[#DCEFF3] rounded-lg hover:bg-[#CAF0F8]/30 transition-colors"
                >
                  View Live Tracking Screen
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Genuine Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#DCEFF3] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#354B55]">Verified Customer Reviews</h2>
            <p className="text-xs text-[#6A808C] mt-0.5">Reviews submitted by customers with verified completed shipments.</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#008EA8] font-semibold">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>4.9 / 5.0 Average</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.slice(0, 2).map((rev) => (
            <div key={rev.id} className="bg-white border border-[#DCEFF3] rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#CAF0F8] text-[#008EA8] font-bold text-xs flex items-center justify-center border border-[#90E0EF]">
                    {rev.customerName[0]}
                  </div>
                  <span className="text-xs font-semibold text-[#354B55]">{rev.customerName}</span>
                </div>
                {rev.verifiedShipment && (
                  <span className="text-[10px] text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 border border-[#90E0EF]">
                    <CheckCircle2 className="w-3 h-3 text-[#00B4D8]" />
                    <span>Verified Shipment</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(rev.ratingOverall)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>

              <p className="text-xs text-[#6A808C] leading-relaxed">
                “{rev.writtenFeedback}”
              </p>

              {rev.companyResponse && (
                <div className="pt-3 border-t border-[#DCEFF3] text-[11px] text-[#6A808C] bg-[#F5FBFD] p-3 rounded-lg">
                  <span className="font-semibold text-[#008EA8]">Swiftvero Response: </span>
                  {rev.companyResponse}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SwiftShare Homepage Introduction Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#CAF0F8]/50 border border-[#90E0EF] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-[#008EA8] bg-white border border-[#90E0EF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8]" />
              <span>Pilot concept · Availability depends on route approval</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#354B55]">
              SwiftShare
            </h2>
            <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
              A simpler way to send eligible items through verified, traveller-assisted routes — inspected, sealed, and carried by vetted international passengers.
            </p>
          </div>
          <button
            onClick={() => {
              if (onNavigateToSwiftShare) {
                onNavigateToSwiftShare();
              } else {
                setActivePublicNav('swift-share');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="px-5 py-2.5 bg-[#00B4D8] hover:bg-[#0096B4] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Explore SwiftShare</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Operations & Warehouse Facility Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-[#DCEFF3] rounded-2xl overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5 bg-[#F5FBFD] p-7 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#DCEFF3] space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#354B55]">Ikeja Consolidation Hub</h4>
                      <p className="text-[11px] text-[#6A808C]">Lagos Murtala Muhammed Gateway</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-full border border-[#90E0EF]">
                    Active Facility
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#DCEFF3]">
                    <span className="text-[#6A808C]">Dual Scale Line</span>
                    <span className="font-semibold text-[#354B55]">Floor &amp; Bench Digital</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#DCEFF3]">
                    <span className="text-[#6A808C]">Tamper Security</span>
                    <span className="font-semibold text-[#354B55]">Sequential Numbered Seals</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#DCEFF3]">
                    <span className="text-[#6A808C]">Export Compliance</span>
                    <span className="font-semibold text-[#354B55]">NCAA Certified Screening</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#DCEFF3]">
                    <span className="text-[#6A808C]">Flight Tenders</span>
                    <span className="font-semibold text-[#354B55]">Scheduled LOS/ABV Departures</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#CAF0F8]/50 rounded-lg border border-[#90E0EF] text-[11px] text-[#354B55] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Zero undocumented handoffs. Every transition logged to audit trail.</span>
              </div>
            </div>

            <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]">
                  <ShieldCheck className="w-4 h-4 text-[#00B4D8]" />
                  <span>Ground Operations &amp; Cargo Custody</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#354B55]">
                  Real Logistics. Real People. No Guesswork.
                </h2>
                <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
                  International shipping requires disciplined ground custody. At our Ikeja consolidation facility, every parcel received from doorstep dispatch or counter intake is audited, measured, barcoded, and prepared according to Nigerian Civil Aviation Authority (NCAA) security guidelines before air tender.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-[#DCEFF3] bg-[#F5FBFD] space-y-1">
                  <div className="text-xs font-semibold text-[#354B55] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>Individual Barcode Audit</span>
                  </div>
                  <p className="text-[11px] text-[#6A808C]">
                    Every box receives a unique consignment barcode for custody scans at each handoff.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#DCEFF3] bg-[#F5FBFD] space-y-1">
                  <div className="text-xs font-semibold text-[#354B55] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>Flight Tender Liaison</span>
                  </div>
                  <p className="text-[11px] text-[#6A808C]">
                    Direct handoff to scheduled international carrier flights out of Lagos and Abuja airports.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={onOpenQuote}
                  className="px-5 py-2.5 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs"
                >
                  <span>Book Pickup for Your Shipment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onOpenTrack}
                  className="px-4 py-2.5 bg-white border border-[#DCEFF3] hover:bg-[#F5FBFD] text-[#354B55] rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Lookup Tracking Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6b. Frequently Asked Questions (FAQ) Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-[#DCEFF3] rounded-2xl p-6 sm:p-10 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DCEFF3] pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]">
                <HelpCircle className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#354B55]">
                Clear Answers to Common Questions
              </h2>
              <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
                Everything you need to know about international air shipping from Nigeria, free doorstep collections, calibrated scale weighing, and customs clearances.
              </p>
            </div>

            <button
              onClick={() => {
                setActivePublicNav('faq');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <span>Explore All FAQs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {[
              {
                q: 'Is doorstep pickup across Lagos and Abuja genuinely free?',
                a: 'Yes, 100% free with zero hidden collection surcharges. When you book an export shipment, our authorized pickup agent arrives at your designated address with a certified digital scale and measuring tape to verify package specs right in front of you.',
              },
              {
                q: 'What is the difference between actual scale weight and volumetric weight?',
                a: 'Actual weight is measured on calibrated digital scales in kilograms. Volumetric weight is calculated using the standard airline cubic formula: (Length × Width × Height in cm) ÷ 5,000. Under international IATA rules, airlines charge based on whichever is higher (Chargeable Weight).',
              },
              {
                q: 'What happens if the courier verifies a different weight than my online estimate?',
                a: 'We never silently alter or bill an accepted price. If the physical intake measurements differ from your online guess, our system automatically generates a revised, itemized quote explaining the variance. You must review and approve it before payment is completed.',
              },
              {
                q: 'What goods are strictly prohibited from international air export?',
                a: 'Prohibited items include pressurized aerosol sprays, lithium batteries without manufacturer packaging certification, raw or unpackaged foodstuffs, counterfeit merchandise, currency, and hazardous materials. View our full Prohibited Goods Guide in the Help Center.',
              },
              {
                q: 'When do I actually pay for my consignment?',
                a: 'You only pay after your parcel has been physically collected/intake-verified and you have reviewed and approved your final itemized quotation. There is zero upfront pre-charging before physical parcel verification.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-xl transition-colors overflow-hidden ${
                    isOpen ? 'border-[#00B4D8] bg-[#F5FBFD]' : 'border-[#DCEFF3] bg-white hover:border-[#90E0EF]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#354B55]"
                  >
                    <span>{faq.q}</span>
                    <span className="p-1 rounded-full bg-[#CAF0F8] text-[#008EA8] shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[#00B4D8]" /> : <ChevronDown className="w-4 h-4 text-[#00B4D8]" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs text-[#6A808C] leading-relaxed border-t border-[#DCEFF3]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick link banner to help center */}
          <div className="p-4 bg-[#CAF0F8]/40 border border-[#90E0EF] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[#354B55]">
              <span className="font-bold text-[#008EA8]">Have a more specific question?</span> Browse topics on customs documentation, SwiftShare traveller pilot, or claims.
            </div>
            <button
              onClick={() => {
                setActivePublicNav('faq');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-semibold text-[#00B4D8] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Open Help Center &amp; FAQ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. Business Shipping Section - Authentic Commercial Partnership Photography */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#F5FBFD] border border-[#DCEFF3] rounded-2xl overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left overview column */}
            <div className="lg:col-span-5 bg-white p-7 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#DCEFF3] space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#00B4D8]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#354B55]">Commercial Logistics</h4>
                      <p className="text-[11px] text-[#6A808C]">SME &amp; Corporate Export Accounts</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-full border border-[#90E0EF]">
                    B2B Services
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                    <span className="text-[#6A808C]">Volume Pricing</span>
                    <span className="font-semibold text-[#354B55]">Tiered Air Freight Rates</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                    <span className="text-[#6A808C]">Documentation</span>
                    <span className="font-semibold text-[#354B55]">Commercial Invoices &amp; Form M/NXP</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                    <span className="text-[#6A808C]">Consignment Batching</span>
                    <span className="font-semibold text-[#354B55]">Multi-Recipient Dispatch</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                    <span className="text-[#6A808C]">Account Desk</span>
                    <span className="font-semibold text-[#354B55]">Dedicated Operations Lead</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#CAF0F8]/50 rounded-lg border border-[#90E0EF] text-[11px] text-[#354B55] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Scheduled daily collections from warehouses across Lagos &amp; Ogun.</span>
              </div>
            </div>

            {/* Right content column */}
            <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008EA8] bg-[#CAF0F8] border border-[#90E0EF] px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#00B4D8]" />
                  <span>Enterprise &amp; Merchant Export Accounts</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#008EA8] uppercase tracking-wider block">
                    Commercial Partnerships
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#354B55] leading-tight">
                    The secret ingredient to global success is a strong partnership.
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
                  Swiftvero supports Nigerian manufacturers, agro-allied exporters, spice traders, fashion brands, and international procurement teams with predictable volume rates, dedicated account officers, and export documentation assistance.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-[#354B55]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                  <span>Tiered volume rate cards with no surprise destination terminal surcharges</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                  <span>Commercial invoice and NEPC export documentation guidance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                  <span>Free scheduled warehouse and boutique collections across Lagos, Abuja, and Port Harcourt</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-6 py-3 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-lg transition-colors shadow-xs flex items-center gap-2"
                >
                  <span>Open a Business Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setActivePublicNav('business');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-3 text-xs font-semibold text-[#354B55] bg-white border border-[#DCEFF3] hover:bg-[#F5FBFD] rounded-lg transition-colors shadow-xs"
                >
                  View Commercial Rates &amp; Sectors
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
