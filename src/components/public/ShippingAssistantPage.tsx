import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  HelpCircle,
  Package,
  FileText,
  ShoppingBag,
  Layers,
  Scale,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  ShieldAlert,
  Calculator,
} from 'lucide-react';

interface ShippingAssistantPageProps {
  onStartBooking?: (initialData?: any) => void;
  onOpenQuote?: () => void;
}

export const ShippingAssistantPage: React.FC<ShippingAssistantPageProps> = ({
  onStartBooking,
  onOpenQuote,
}) => {
  const { setRole, setActiveCustomerTab } = useDemo();

  // Wizard Step: 1 = Item Type & Nature, 2 = Route, 3 = Weight & Dimensional Calculator, 4 = Speed & Pickup, 5 = Recommendation
  const [step, setStep] = useState<number>(1);

  // Form states
  const [itemType, setItemType] = useState<'apparel' | 'documents' | 'food_dry' | 'electronics' | 'general_goods' | 'heavy_cargo'>('apparel');
  const [shippingNature, setShippingNature] = useState<'personal' | 'commercial'>('personal');
  const [originCity, setOriginCity] = useState('Lagos');
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [packageCount, setPackageCount] = useState<number>(1);
  const [actualWeightKg, setActualWeightKg] = useState<number>(3.5);
  const [lengthCm, setLengthCm] = useState<number>(35);
  const [widthCm, setWidthCm] = useState<number>(25);
  const [heightCm, setHeightCm] = useState<number>(20);
  const [deliverySpeed, setDeliverySpeed] = useState<'priority' | 'standard' | 'economy_cargo'>('priority');
  const [collectionMethod, setCollectionMethod] = useState<'free_pickup' | 'walk_in'>('free_pickup');

  // Dimensional calculation
  const volumetricWeightKg = Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(2));
  const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeightKg);
  const isVolumetricHigher = volumetricWeightKg > actualWeightKg;

  // Rate estimation logic (transparent estimate)
  const getEstimatedRateNgn = () => {
    let baseRatePerKg = 14500;
    if (destinationCountry === 'United States' || destinationCountry === 'Canada') {
      baseRatePerKg = 16800;
    } else if (destinationCountry === 'United Arab Emirates') {
      baseRatePerKg = 13900;
    }

    if (deliverySpeed === 'priority') {
      baseRatePerKg *= 1.25;
    } else if (deliverySpeed === 'economy_cargo') {
      baseRatePerKg = Math.max(4500, baseRatePerKg * 0.55);
    }

    const subtotal = Math.round(chargeableWeightKg * baseRatePerKg);
    const fuelSurcharge = Math.round(subtotal * 0.12);
    const vat = Math.round((subtotal + fuelSurcharge) * 0.075);
    const total = subtotal + fuelSurcharge + vat;

    return {
      subtotal,
      fuelSurcharge,
      vat,
      total,
      perKg: Math.round(baseRatePerKg),
    };
  };

  const rateDetails = getEstimatedRateNgn();

  const handleFinishAndBook = () => {
    setRole('customer');
    setActiveCustomerTab('new_shipment');
    if (onStartBooking) {
      onStartBooking({
        category: itemType === 'documents' ? 'documents' : 'goods',
        destinationCountry,
        weightKg: chargeableWeightKg,
        dimensions: { length: lengthCm, width: widthCm, height: heightCm },
        serviceTier: deliverySpeed === 'economy_cargo' ? 'standard' : deliverySpeed,
      });
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 px-4 sm:px-6 text-[#1F2937]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CAF0F8] border border-[#90E0EF] rounded-full text-[12px] font-medium text-[#0F172A]">
            <Sparkles className="w-3.5 h-3.5 text-[#00B4D8]" />
            <span>Interactive Guided Shipping Assistant</span>
          </div>
          <h1 className="sv-h1">
            Find the Best Shipping Route &amp; Calculate Accurate Weight
          </h1>
          <p className="sv-body text-[#4B5563]">
            Answer 4 quick questions. We will calculate your chargeable volumetric weight, recommend the
            fastest and most economical service tier, and prepare your booking.
          </p>
        </div>

        {/* Wizard Progress Stepper */}
        <div className="sv-card p-4 sm:p-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E2E8F0] -translate-y-1/2 z-0" />
            {[
              { num: 1, title: 'Item Nature' },
              { num: 2, title: 'Route' },
              { num: 3, title: 'Measurements' },
              { num: 4, title: 'Preferences' },
              { num: 5, title: 'Recommendation' },
            ].map((s) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all tabular-nums ${
                      isCurrent
                        ? 'bg-[#00B4D8] text-white ring-4 ring-[#CAF0F8]'
                        : isPassed
                        ? 'bg-[#CAF0F8] border border-[#90E0EF] text-[#0F172A]'
                        : 'bg-white border border-[#CBD5E1] text-[#4B5563]'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" /> : s.num}
                  </div>
                  <span
                    className={`text-[12px] hidden sm:block ${
                      isCurrent ? 'text-[#0096C7] font-bold' : 'text-[#4B5563] font-medium'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Body Card */}
        <div className="sv-card p-6 sm:p-8">
          {/* STEP 1: Item Nature */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="sv-h2">Step 1: What are you sending?</h2>
                <p className="sv-body text-[#4B5563]">
                  Select the commodity category and indicate whether this is a personal package or commercial merchandise.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#111827] uppercase tracking-wider">
                  Shipping Context
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShippingNature('personal')}
                    className={`p-4 rounded-[12px] border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      shippingNature === 'personal'
                        ? 'bg-[#CAF0F8]/50 border-2 border-[#00B4D8] text-[#111827]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#4B5563] hover:border-[#90E0EF]'
                    }`}
                  >
                    <Package className="w-5 h-5 text-[#00B4D8] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[14px] font-bold text-[#111827]">Personal Shipment</div>
                      <div className="text-[12px] text-[#4B5563] mt-0.5">
                        Gifts to family, personal wardrobe, documents, university transcripts
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShippingNature('commercial')}
                    className={`p-4 rounded-[12px] border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      shippingNature === 'commercial'
                        ? 'bg-[#CAF0F8]/50 border-2 border-[#00B4D8] text-[#111827]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#4B5563] hover:border-[#90E0EF]'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 text-[#00B4D8] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[14px] font-bold text-[#111827]">Commercial &amp; Business Orders</div>
                      <div className="text-[12px] text-[#4B5563] mt-0.5">
                        Customer sales, fashion collections, African foods, sample merchandise
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#111827] uppercase tracking-wider">
                  Commodity Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'apparel', label: 'Fashion & Textiles', desc: 'Aso-Oke, Ankara, bespoke dresses' },
                    { id: 'documents', label: 'Official Documents', desc: 'Passports, legal deeds, transcripts' },
                    { id: 'food_dry', label: 'Packaged Dry Food', desc: 'Sealed spices, dried fish, garri' },
                    { id: 'electronics', label: 'Gadgets & Electronics', desc: 'Laptops, parts (battery rules apply)' },
                    { id: 'general_goods', label: 'Art, Crafts & Goods', desc: 'Carvings, beauty, hair bundles' },
                    { id: 'heavy_cargo', label: 'Heavy Bulk & Pallets', desc: '50kg+ crates, multi-box inventory' },
                  ].map((cat) => {
                    const isSelected = itemType === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setItemType(cat.id as any)}
                        className={`p-3.5 rounded-[10px] border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#CAF0F8]/50 border-2 border-[#00B4D8] text-[#111827]'
                            : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#4B5563] hover:border-[#90E0EF]'
                        }`}
                      >
                        <div className={`text-[14px] font-bold ${isSelected ? 'text-[#0096C7]' : 'text-[#111827]'}`}>
                          {cat.label}
                        </div>
                        <div className="text-[12px] text-[#4B5563] mt-0.5">{cat.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {itemType === 'food_dry' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-[10px] text-[13px] text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <span>
                    <strong>Food Export Advisory:</strong> Nigerian food items must be industrially dried, vacuum-sealed, and commercially labelled. Fresh vegetables and perishable meats cannot be accepted for international carriage.
                  </span>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="sv-btn-primary min-h-[44px] px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Continue to Routing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Route */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="sv-h2">Step 2: Where is the shipment going?</h2>
                <p className="sv-body text-[#4B5563]">
                  Swiftvero operates international consolidation out of Lagos, Abuja, Kano, and Port Harcourt.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="sv-label block mb-1">Origin City (Nigeria)</label>
                  <select
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                  >
                    <option value="Lagos">Lagos (Victoria Island &amp; Ikeja Hubs)</option>
                    <option value="Abuja">Abuja (Federal Capital Territory)</option>
                    <option value="Kano">Kano (Bompai Industrial Area)</option>
                    <option value="Port Harcourt">Port Harcourt (Rivers State)</option>
                    <option value="Ibadan">Ibadan (Oyo State)</option>
                    <option value="Enugu">Enugu (Enugu State)</option>
                  </select>
                </div>

                <div>
                  <label className="sv-label block mb-1">Destination Country</label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827]"
                  >
                    <option value="United Kingdom">United Kingdom (London, Manchester, Birmingham)</option>
                    <option value="United States">United States (Houston, New York, Atlanta, Dallas)</option>
                    <option value="Canada">Canada (Toronto, Calgary, Montreal)</option>
                    <option value="Germany">Germany &amp; European Union</option>
                    <option value="United Arab Emirates">United Arab Emirates (Dubai &amp; Abu Dhabi)</option>
                    <option value="South Africa">South Africa (Johannesburg, Cape Town)</option>
                    <option value="Ghana">Ghana (Accra, Kumasi)</option>
                  </select>
                </div>
              </div>

              {/* Destination regulatory guidance */}
              <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] p-4 space-y-1.5 text-[#0F172A]">
                <div className="font-bold text-[14px] text-[#0F172A] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#00B4D8]" />
                  <span>Destination Clearance Profile: {destinationCountry}</span>
                </div>
                <p className="text-[13px] text-[#0F172A]/85 leading-relaxed">
                  {destinationCountry === 'United Kingdom' &&
                    'UK shipments arrive via London Heathrow (LHR). Low-value gifts under £39 qualify for duty exemption. Commercial parcels require itemised commercial invoice.'}
                  {destinationCountry === 'United States' &&
                    'US shipments arrive via JFK or Atlanta gateways. De minimis threshold allows up to $800 duty-free clearance for non-restricted consumer items.'}
                  {destinationCountry === 'Canada' &&
                    'Canada Border Services Agency (CBSA) applies GST/HST at port of entry. Commercial exports require Canadian business identification or receiver import tax number.'}
                  {destinationCountry !== 'United Kingdom' && destinationCountry !== 'United States' && destinationCountry !== 'Canada' &&
                    'Standard international customs air clearance applies. Full receiver phone and physical address required for pre-clearance notification.'}
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] px-5 py-2 border border-[#CBD5E1] text-[#111827] text-[14px] font-bold rounded-full hover:border-[#00B4D8] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="sv-btn-primary min-h-[44px] px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Continue to Measurements</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Weight & Dimensional Explainer */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="sv-h2">Step 3: Weight &amp; Dimensions Explained</h2>
                <p className="sv-body text-[#4B5563]">
                  International air carriage pricing is based on <span className="font-bold text-[#111827]">Chargeable Weight</span> — which is whichever is higher between the package's actual scale weight and its volumetric (dimensional) weight.
                </p>
              </div>

              {/* Dimensional Weight Educational Callout */}
              <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] p-4 space-y-1.5 text-[#0F172A]">
                <div className="flex items-center gap-2 font-bold text-[14px] text-[#0F172A]">
                  <Calculator className="w-4 h-4 text-[#00B4D8]" />
                  <span>Why Dimensional Weight Matters</span>
                </div>
                <p className="text-[13px] text-[#0F172A]/85 leading-relaxed">
                  “A large, lightweight carton (e.g. bulky hats or puffed fabrics) takes up significant space in an aircraft cargo hold, even if it weighs only 1kg. Carriers calculate dimensional weight as:
                  <span className="font-bold text-[#0F172A] ml-1 tabular-nums">(Length × Width × Height in cm) ÷ 5,000</span>.”
                </p>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="sv-label block mb-1">
                    Actual Scale Weight (kg) <span className="text-[#B42318]">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={actualWeightKg}
                    onChange={(e) => setActualWeightKg(Math.max(0.1, Number(e.target.value)))}
                    className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                    required
                  />
                </div>
                <div>
                  <label className="sv-label block mb-1">Length (cm)</label>
                  <input
                    type="number"
                    min="5"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Math.max(1, Number(e.target.value)))}
                    className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                  />
                </div>
                <div>
                  <label className="sv-label block mb-1">Width (cm)</label>
                  <input
                    type="number"
                    min="5"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Math.max(1, Number(e.target.value)))}
                    className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                  />
                </div>
                <div>
                  <label className="sv-label block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="2"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Math.max(1, Number(e.target.value)))}
                    className="sv-input w-full min-h-[44px] text-[14px] px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] text-[#111827] tabular-nums"
                  />
                </div>
              </div>

              {/* Dynamic Comparison Visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px]">
                <div className="space-y-1">
                  <div className="sv-label">Actual Scale Weight</div>
                  <div className="text-[18px] font-extrabold text-[#111827] tabular-nums">{actualWeightKg} kg</div>
                  <div className="text-[12px] text-[#4B5563]">Physical reading on calibrated scale</div>
                </div>

                <div className="space-y-1">
                  <div className="sv-label tabular-nums">
                    Volumetric Weight ({lengthCm}×{widthCm}×{heightCm}÷5000)
                  </div>
                  <div className="text-[18px] font-extrabold text-[#111827] tabular-nums">{volumetricWeightKg} kg</div>
                  <div className="text-[12px] text-[#4B5563]">Space occupied in cargo hold</div>
                </div>

                <div className="space-y-1 sm:border-l sm:border-[#E2E8F0] sm:pl-4">
                  <div className="text-[12px] font-bold text-[#0096C7]">Chargeable Weight (Billed)</div>
                  <div className="text-[20px] font-extrabold text-[#0096C7] tabular-nums">{chargeableWeightKg} kg</div>
                  <div className="text-[12px] text-[#4B5563]">
                    {isVolumetricHigher
                      ? 'Volumetric weight is higher than scale weight.'
                      : 'Actual scale weight is higher.'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-5 py-2 border border-[#CBD5E1] text-[#111827] text-[14px] font-bold rounded-full hover:border-[#00B4D8] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="sv-btn-primary min-h-[44px] px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Continue to Preferences</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Speed & Collection */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="sv-h2">Step 4: Speed &amp; Collection Preferences</h2>
                <p className="sv-body text-[#4B5563]">
                  Tell us your transit timeline and whether you prefer doorstep pickup or walk-in branch drop-off.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#111827] uppercase tracking-wider">
                  Transit Speed Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliverySpeed('priority')}
                    className={`p-4 rounded-[12px] border text-left transition-all cursor-pointer ${
                      deliverySpeed === 'priority'
                        ? 'bg-[#CAF0F8]/50 border-2 border-[#00B4D8] text-[#111827]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#4B5563] hover:border-[#90E0EF]'
                    }`}
                  >
                    <div className="text-[14px] font-bold text-[#0096C7]">Priority Air Express</div>
                    <div className="text-[13px] text-[#111827] mt-1 font-bold">2–3 Business Days</div>
                    <div className="text-[12px] text-[#4B5563] mt-0.5">
                      Direct commercial airline connections, prioritized flight uplift
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySpeed('standard')}
                    className={`p-4 rounded-[12px] border text-left transition-all cursor-pointer ${
                      deliverySpeed === 'standard'
                        ? 'bg-[#CAF0F8]/50 border-2 border-[#00B4D8] text-[#111827]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#4B5563] hover:border-[#90E0EF]'
                    }`}
                  >
                    <div className="text-[14px] font-bold text-[#111827]">Standard Air Courier</div>
                    <div className="text-[13px] text-[#111827] mt-1 font-bold">4–6 Business Days</div>
                    <div className="text-[12px] text-[#4B5563] mt-0.5">
                      Balanced cost and transit speed for regular commercial &amp; gift parcels
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySpeed('economy_cargo')}
                    className={`p-4 rounded-[12px] border text-left transition-all cursor-pointer ${
                      deliverySpeed === 'economy_cargo'
                        ? 'bg-[#CAF0F8]/50 border-2 border-[#00B4D8] text-[#111827]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#4B5563] hover:border-[#90E0EF]'
                    }`}
                  >
                    <div className="text-[14px] font-bold text-[#111827]">Consolidated Freight</div>
                    <div className="text-[13px] text-[#111827] mt-1 font-bold">7–12 Business Days</div>
                    <div className="text-[12px] text-[#4B5563] mt-0.5">
                      Most economical for shipments exceeding 20kg
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#111827] uppercase tracking-wider">
                  Intake &amp; Collection
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCollectionMethod('free_pickup')}
                    className={`p-4 rounded-[12px] border text-left transition-all cursor-pointer ${
                      collectionMethod === 'free_pickup'
                        ? 'bg-[#CAF0F8]/50 border-2 border-[#00B4D8] text-[#111827]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#4B5563] hover:border-[#90E0EF]'
                    }`}
                  >
                    <div className="text-[14px] font-bold text-[#0096C7]">Doorstep Pickup (Always Free)</div>
                    <div className="text-[12px] text-[#4B5563] mt-0.5 leading-relaxed">
                      Swiftvero field courier visits your residence or business with calibrated scales and tamper tape.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollectionMethod('walk_in')}
                    className={`p-4 rounded-[12px] border text-left transition-all cursor-pointer ${
                      collectionMethod === 'walk_in'
                        ? 'bg-[#CAF0F8]/50 border-2 border-[#00B4D8] text-[#111827]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#4B5563] hover:border-[#90E0EF]'
                    }`}
                  >
                    <div className="text-[14px] font-bold text-[#111827]">Walk-In Counter Intake</div>
                    <div className="text-[12px] text-[#4B5563] mt-0.5 leading-relaxed">
                      Drop off at Victoria Island Center or Ikeja Cargo Hub for immediate digital weighing and intake receipt.
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="min-h-[44px] px-5 py-2 border border-[#CBD5E1] text-[#111827] text-[14px] font-bold rounded-full hover:border-[#00B4D8] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="sv-btn-primary min-h-[44px] px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Generate Recommended Solution</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Recommendation & Transparent Quote Breakdown */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#CAF0F8] border border-[#90E0EF] rounded-full text-[12px] font-medium text-[#0F172A]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8]" />
                  <span>Optimal Route Identified</span>
                </div>
                <h2 className="sv-h2">
                  Recommended: {deliverySpeed === 'priority' ? 'Priority Air Express' : deliverySpeed === 'standard' ? 'Standard Air Courier' : 'Consolidated Air Freight'}
                </h2>
                <p className="sv-body text-[#4B5563] tabular-nums">
                  {originCity}, Nigeria → {destinationCountry} ({chargeableWeightKg} kg chargeable weight)
                </p>
              </div>

              {/* Transparent Quote Breakdown Card */}
              <div className="border border-[#90E0EF] bg-[#CAF0F8] rounded-[12px] p-5 sm:p-6 space-y-4 text-[#0F172A]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#90E0EF]">
                  <div>
                    <span className="text-[14px] font-bold text-[#0F172A]">Estimated Transparent Quotation</span>
                    <div className="text-[12px] font-medium text-[#0F172A]/80">
                      Based on verified route &amp; volumetric measurements
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div className="sv-price-lg text-[#0F172A] tabular-nums">
                      ₦{rateDetails.total.toLocaleString()}
                    </div>
                    <div className="text-[12px] font-medium text-[#0F172A]/80">Estimated Total (All-Inclusive)</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px] bg-white/85 rounded-[10px] p-4 border border-[#90E0EF]">
                  <div>
                    <div className="sv-label">Base Airfreight ({chargeableWeightKg} kg)</div>
                    <div className="font-bold text-[#111827] tabular-nums mt-0.5">₦{rateDetails.subtotal.toLocaleString()}</div>
                    <div className="text-[11px] text-[#4B5563] tabular-nums">@ ₦{rateDetails.perKg.toLocaleString()}/kg</div>
                  </div>
                  <div>
                    <div className="sv-label">Airline Fuel Surcharge</div>
                    <div className="font-bold text-[#111827] tabular-nums mt-0.5">₦{rateDetails.fuelSurcharge.toLocaleString()}</div>
                    <div className="text-[11px] text-[#4B5563]">Pass-through carrier rate</div>
                  </div>
                  <div>
                    <div className="sv-label">Doorstep Pickup</div>
                    <div className="font-bold text-[#247347] tabular-nums mt-0.5">₦0 (FREE)</div>
                    <div className="text-[11px] text-[#4B5563]">Swiftvero standard benefit</div>
                  </div>
                  <div>
                    <div className="sv-label">Statutory VAT (7.5%)</div>
                    <div className="font-bold text-[#111827] tabular-nums mt-0.5">₦{rateDetails.vat.toLocaleString()}</div>
                    <div className="text-[11px] text-[#4B5563]">Nigerian fiscal compliance</div>
                  </div>
                </div>

                <div className="text-[12px] text-[#0F172A] bg-white/80 p-3 rounded-[8px] border border-[#90E0EF]">
                  <strong>Quotation Policy:</strong> This estimate is based on the declared dimensions. Upon pickup or counter intake, our certified digital scale reading and laser measurement will generate your final itemised quotation before payment is required.
                </div>
              </div>

              {/* What Happens Next Checklist */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-4 space-y-2.5">
                <div className="text-[14px] font-bold text-[#111827]">What Happens When You Book:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px] text-[#4B5563]">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#CAF0F8] border border-[#90E0EF] text-[#0F172A] font-bold text-[11px] flex items-center justify-center shrink-0 tabular-nums">1</span>
                    <span>Doorstep courier dispatched to your address with digital scale.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#CAF0F8] border border-[#90E0EF] text-[#0F172A] font-bold text-[11px] flex items-center justify-center shrink-0 tabular-nums">2</span>
                    <span>Item sealed with security tamper tape; intake receipt generated.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#CAF0F8] border border-[#90E0EF] text-[#0F172A] font-bold text-[11px] flex items-center justify-center shrink-0 tabular-nums">3</span>
                    <span>Live tracking number activated with scheduled flight uplift.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2 border border-[#CBD5E1] text-[#111827] text-[14px] font-bold rounded-full hover:border-[#00B4D8] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Adjust Preferences</span>
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-[14px] font-semibold text-[#4B5563] hover:text-[#111827] cursor-pointer"
                  >
                    Start Over
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishAndBook}
                    className="sv-btn-primary w-full sm:w-auto min-h-[46px] px-7 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Proceed to Book This Shipment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
