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
    <div className="bg-[#F5FBFD] min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CAF0F8] border border-[#90E0EF] rounded-full text-xs font-semibold text-[#00B4D8]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Guided Shipping Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#354B55]">
            Find the Best Shipping Route &amp; Calculate Accurate Weight
          </h1>
          <p className="text-xs sm:text-sm text-[#6A808C] leading-relaxed">
            Answer 4 quick questions. We will calculate your chargeable volumetric weight, recommend the
            fastest and most economical service tier, and prepare your booking.
          </p>
        </div>

        {/* Wizard Progress Stepper */}
        <div className="bg-white border border-[#DCEFF3] rounded-xl p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#DCEFF3] -translate-y-1/2 z-0" />
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#00B4D8] text-white ring-4 ring-[#CAF0F8]'
                        : isPassed
                        ? 'bg-[#90E0EF] text-[#00B4D8]'
                        : 'bg-white border border-[#DCEFF3] text-[#6A808C]'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] hidden sm:block font-medium ${
                      isCurrent ? 'text-[#00B4D8] font-bold' : 'text-[#6A808C]'
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
        <div className="bg-white border border-[#DCEFF3] rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* STEP 1: Item Nature */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#354B55]">Step 1: What are you sending?</h2>
                <p className="text-xs text-[#6A808C]">
                  Select the commodity category and indicate whether this is a personal package or commercial merchandise.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#354B55] uppercase tracking-wider">Shipping Context</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShippingNature('personal')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      shippingNature === 'personal'
                        ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#354B55]'
                        : 'bg-[#F5FBFD] border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                    }`}
                  >
                    <Package className="w-5 h-5 text-[#00B4D8] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">Personal Consignment</div>
                      <div className="text-[11px] text-[#6A808C] mt-0.5">Gifts to family, personal wardrobe, documents, university transcripts</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShippingNature('commercial')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      shippingNature === 'commercial'
                        ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#354B55]'
                        : 'bg-[#F5FBFD] border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 text-[#00B4D8] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">Commercial &amp; Business Orders</div>
                      <div className="text-[11px] text-[#6A808C] mt-0.5">Customer sales, fashion collections, African foods, sample merchandise</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#354B55] uppercase tracking-wider">Commodity Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#354B55]'
                            : 'bg-[#F5FBFD] border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                        }`}
                      >
                        <div className={`text-xs font-bold ${isSelected ? 'text-[#00B4D8]' : 'text-[#354B55]'}`}>
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-[#6A808C] mt-0.5">{cat.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {itemType === 'food_dry' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Food Export Advisory:</strong> Nigerian food items must be industrially dried, vacuum-sealed, and commercially labelled. Fresh vegetables and perishable meats cannot be accepted for international carriage.
                  </span>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-[#DCEFF3]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-[#00B4D8] text-white text-xs font-semibold rounded-lg hover:opacity-95 flex items-center gap-1.5 shadow-xs"
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
                <h2 className="text-lg font-bold text-[#354B55]">Step 2: Where is the shipment going?</h2>
                <p className="text-xs text-[#6A808C]">
                  Swiftvero operates international consolidation out of Lagos, Abuja, Kano, and Port Harcourt.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Origin City (Nigeria)</label>
                  <select
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
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
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Destination Country</label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
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
              <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-xl p-4 space-y-2 text-xs">
                <div className="font-bold text-[#00B4D8] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Destination Clearance Profile: {destinationCountry}</span>
                </div>
                <p className="text-[#6A808C] leading-relaxed">
                  {destinationCountry === 'United Kingdom' &&
                    'UK shipments arrive via London Heathrow (LHR). Low-value gifts under £39 qualify for duty exemption. Commercial parcels require itemised commercial invoice.'}
                  {destinationCountry === 'United States' &&
                    'US shipments arrive via JFK or Atlanta gateways. De minimis threshold allows up to $800 duty-free clearance for non-restricted consumer items.'}
                  {destinationCountry === 'Canada' &&
                    'Canada Border Services Agency (CBSA) applies GST/HST at port of entry. Commercial exports require Canadian business identification or consignee import tax number.'}
                  {destinationCountry !== 'United Kingdom' && destinationCountry !== 'United States' && destinationCountry !== 'Canada' &&
                    'Standard international customs air clearance applies. Full consignee phone and physical address required for pre-clearance notification.'}
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#DCEFF3]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-[#DCEFF3] text-[#354B55] text-xs font-semibold rounded-lg hover:bg-[#F5FBFD] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-[#00B4D8] text-white text-xs font-semibold rounded-lg hover:opacity-95 flex items-center gap-1.5 shadow-xs"
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
                <h2 className="text-lg font-bold text-[#354B55]">Step 3: Weight &amp; Dimensions Explained</h2>
                <p className="text-xs text-[#6A808C]">
                  International air carriage pricing is based on <span className="font-semibold text-[#354B55]">Chargeable Weight</span> — which is whichever is higher between the package's actual scale weight and its volumetric (dimensional) weight.
                </p>
              </div>

              {/* Dimensional Weight Educational Callout */}
              <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#00B4D8]">
                  <Calculator className="w-4 h-4" />
                  <span>Why Dimensional Weight Matters</span>
                </div>
                <p className="text-[#6A808C] leading-relaxed">
                  “A large, lightweight carton (e.g. bulky hats or puffed fabrics) takes up significant space in an aircraft cargo hold, even if it weighs only 1kg. Carriers calculate dimensional weight as:
                  <span className="font-mono font-bold text-[#354B55] ml-1">(Length × Width × Height in cm) ÷ 5,000</span>.”
                </p>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    Actual Scale Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={actualWeightKg}
                    onChange={(e) => setActualWeightKg(Math.max(0.1, Number(e.target.value)))}
                    className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Length (cm)</label>
                  <input
                    type="number"
                    min="5"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Width (cm)</label>
                  <input
                    type="number"
                    min="5"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="2"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>
              </div>

              {/* Dynamic Comparison Visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl text-xs">
                <div className="space-y-1">
                  <div className="text-[11px] text-[#6A808C]">Actual Scale Weight</div>
                  <div className="text-base font-extrabold text-[#354B55]">{actualWeightKg} kg</div>
                  <div className="text-[10px] text-[#6A808C]">Physical reading on calibrated scale</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-[#6A808C]">Volumetric Weight ({lengthCm}×{widthCm}×{heightCm}÷5000)</div>
                  <div className="text-base font-extrabold text-[#354B55]">{volumetricWeightKg} kg</div>
                  <div className="text-[10px] text-[#6A808C]">Space occupied in cargo hold</div>
                </div>

                <div className="space-y-1 sm:border-l sm:border-[#DCEFF3] sm:pl-3">
                  <div className="text-[11px] font-bold text-[#00B4D8]">Chargeable Weight (Billed)</div>
                  <div className="text-lg font-black text-[#00B4D8]">{chargeableWeightKg} kg</div>
                  <div className="text-[10px] text-[#6A808C]">
                    {isVolumetricHigher
                      ? 'Volumetric weight is higher than scale weight.'
                      : 'Actual scale weight is higher.'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#DCEFF3]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-[#DCEFF3] text-[#354B55] text-xs font-semibold rounded-lg hover:bg-[#F5FBFD] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 bg-[#00B4D8] text-white text-xs font-semibold rounded-lg hover:opacity-95 flex items-center gap-1.5 shadow-xs"
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
                <h2 className="text-lg font-bold text-[#354B55]">Step 4: Speed &amp; Collection Preferences</h2>
                <p className="text-xs text-[#6A808C]">
                  Tell us your transit timeline and whether you prefer doorstep pickup or walk-in branch drop-off.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#354B55] uppercase tracking-wider">Transit Speed Preference</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliverySpeed('priority')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      deliverySpeed === 'priority'
                        ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#354B55]'
                        : 'bg-[#F5FBFD] border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#00B4D8]">Priority Air Express</div>
                    <div className="text-[11px] text-[#354B55] mt-1 font-semibold">2–3 Business Days</div>
                    <div className="text-[10px] text-[#6A808C] mt-0.5">Direct commercial airline connections, prioritized flight uplift</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySpeed('standard')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      deliverySpeed === 'standard'
                        ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#354B55]'
                        : 'bg-[#F5FBFD] border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#354B55]">Standard Air Courier</div>
                    <div className="text-[11px] text-[#354B55] mt-1 font-semibold">4–6 Business Days</div>
                    <div className="text-[10px] text-[#6A808C] mt-0.5">Balanced cost and transit speed for regular commercial &amp; gift parcels</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySpeed('economy_cargo')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      deliverySpeed === 'economy_cargo'
                        ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#354B55]'
                        : 'bg-[#F5FBFD] border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#354B55]">Consolidated Freight</div>
                    <div className="text-[11px] text-[#354B55] mt-1 font-semibold">7–12 Business Days</div>
                    <div className="text-[10px] text-[#6A808C] mt-0.5">Most economical for shipments exceeding 20kg</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#354B55] uppercase tracking-wider">Intake &amp; Collection</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCollectionMethod('free_pickup')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      collectionMethod === 'free_pickup'
                        ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#354B55]'
                        : 'bg-[#F5FBFD] border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#00B4D8]">Doorstep Pickup (Always Free)</div>
                    <div className="text-[11px] text-[#6A808C] mt-0.5">
                      Swiftvero field courier visits your residence or business with calibrated scales and tamper tape.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollectionMethod('walk_in')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      collectionMethod === 'walk_in'
                        ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#354B55]'
                        : 'bg-[#F5FBFD] border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#354B55]">Walk-In Counter Intake</div>
                    <div className="text-[11px] text-[#6A808C] mt-0.5">
                      Drop off at Victoria Island Center or Ikeja Cargo Hub for immediate digital weighing and intake receipt.
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#DCEFF3]">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-[#DCEFF3] text-[#354B55] text-xs font-semibold rounded-lg hover:bg-[#F5FBFD] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-5 py-2.5 bg-[#00B4D8] text-white text-xs font-semibold rounded-lg hover:opacity-95 flex items-center gap-1.5 shadow-xs"
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
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#CAF0F8] border border-[#90E0EF] rounded-full text-[11px] font-semibold text-[#00B4D8]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Optimal Route Identified</span>
                </div>
                <h2 className="text-xl font-extrabold text-[#354B55]">
                  Recommended: {deliverySpeed === 'priority' ? 'Priority Air Express' : deliverySpeed === 'standard' ? 'Standard Air Courier' : 'Consolidated Air Freight'}
                </h2>
                <p className="text-xs text-[#6A808C]">
                  {originCity}, Nigeria → {destinationCountry} ({chargeableWeightKg} kg chargeable weight)
                </p>
              </div>

              {/* Transparent Quote Breakdown Card */}
              <div className="border border-[#90E0EF] bg-[#CAF0F8] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
                  <div>
                    <span className="text-xs font-bold text-[#354B55]">Estimated Transparent Quotation</span>
                    <div className="text-[11px] text-[#6A808C]">Based on verified route &amp; volumetric measurements</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#00B4D8]">
                      ₦{rateDetails.total.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#6A808C]">Estimated Total (All-Inclusive)</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-[11px] text-[#6A808C]">Base Airfreight ({chargeableWeightKg} kg)</div>
                    <div className="font-semibold text-[#354B55]">₦{rateDetails.subtotal.toLocaleString()}</div>
                    <div className="text-[10px] text-[#6A808C]">@ ₦{rateDetails.perKg.toLocaleString()}/kg</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6A808C]">Airline Fuel Surcharge</div>
                    <div className="font-semibold text-[#354B55]">₦{rateDetails.fuelSurcharge.toLocaleString()}</div>
                    <div className="text-[10px] text-[#6A808C]">Pass-through carrier rate</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6A808C]">Doorstep Pickup</div>
                    <div className="font-semibold text-[#00B4D8]">₦0 (FREE)</div>
                    <div className="text-[10px] text-[#6A808C]">Swiftvero standard benefit</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6A808C]">Statutory VAT (7.5%)</div>
                    <div className="font-semibold text-[#354B55]">₦{rateDetails.vat.toLocaleString()}</div>
                    <div className="text-[10px] text-[#6A808C]">Nigerian fiscal compliance</div>
                  </div>
                </div>

                <div className="text-[11px] text-[#6A808C] bg-white/70 p-2.5 rounded-lg border border-[#DCEFF3]">
                  <strong>Quotation Policy:</strong> This estimate is based on the declared dimensions. Upon pickup or counter intake, our certified digital scale reading and laser measurement will generate your final itemised quotation before payment is required.
                </div>
              </div>

              {/* What Happens Next Checklist */}
              <div className="bg-white border border-[#DCEFF3] rounded-xl p-4 text-xs space-y-2">
                <div className="font-bold text-[#354B55]">What Happens When You Book:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-[#6A808C]">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#CAF0F8] text-[#00B4D8] font-bold flex items-center justify-center shrink-0">1</span>
                    <span>Doorstep courier dispatched to your address with digital scale.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#CAF0F8] text-[#00B4D8] font-bold flex items-center justify-center shrink-0">2</span>
                    <span>Item sealed with security tamper tape; intake receipt generated.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#CAF0F8] text-[#00B4D8] font-bold flex items-center justify-center shrink-0">3</span>
                    <span>Live tracking number activated with scheduled flight uplift.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#DCEFF3]">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full sm:w-auto px-4 py-2 border border-[#DCEFF3] text-[#354B55] text-xs font-semibold rounded-lg hover:bg-[#F5FBFD] flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Adjust Preferences</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-3.5 py-2.5 text-xs font-semibold text-[#6A808C] hover:text-[#354B55]"
                  >
                    Start Over
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishAndBook}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#00B4D8] text-white text-xs font-semibold rounded-lg hover:opacity-95 flex items-center justify-center gap-2 shadow-xs"
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
