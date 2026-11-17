import React, { useState } from 'react';
import { X, Truck, MapPin, Box, ShieldCheck, ArrowRight, Check, AlertCircle } from 'lucide-react';

interface FutureServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FutureServicesModal: React.FC<FutureServicesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'moving' | 'local' | 'interstate'>('moving');

  // Moving demo state
  const [movingTier, setMovingTier] = useState<1 | 2 | 3>(2);
  const [pickupArea, setPickupArea] = useState('Lekki Phase 1, Lagos');
  const [deliveryArea, setDeliveryArea] = useState('Ikeja GRA, Lagos');
  const [roomsCount, setRoomsCount] = useState(2);
  const [hasHeavyItems, setHasHeavyItems] = useState(true);
  const [estimateLocked, setEstimateLocked] = useState(false);

  if (!isOpen) return null;

  // Calculate simulated moving price
  const basePrice = movingTier === 1 ? 45000 : movingTier === 2 ? 85000 : 160000;
  const roomFactor = roomsCount * 15000;
  const heavyFactor = hasHeavyItems ? 20000 : 0;
  const simulatedMovingTotal = basePrice + roomFactor + heavyFactor;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Future Domestic & Relocation Services"
    >
      <div className="bg-white rounded-[12px] shadow-xl border border-[#E2E8F0] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1F2937]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#00B4D8] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-white shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[17px] font-bold text-white">Future Domestic &amp; Relocation Services</h3>
                <span className="text-[11px] font-semibold text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full">
                  Simulated Preview
                </span>
              </div>
              <p className="text-[12px] text-white/90">
                Interactive demonstration of planned local logistics services. No actual bookings or charges.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-white hover:bg-white/15 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Service Category Tabs */}
        <div className="flex border-b border-[#E2E8F0] px-6 bg-[#F8FAFC] gap-5 text-[13px] font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('moving')}
            className={`py-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'moving'
                ? 'border-[#00B4D8] text-[#0096C7] font-bold'
                : 'border-transparent text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Moving Vans &amp; Relocation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`py-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'local'
                ? 'border-[#00B4D8] text-[#0096C7] font-bold'
                : 'border-transparent text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Lagos Local Delivery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('interstate')}
            className={`py-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'interstate'
                ? 'border-[#00B4D8] text-[#0096C7] font-bold'
                : 'border-transparent text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Interstate Line-Haul
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Relocation Service */}
          {activeTab === 'moving' && (
            <div className="space-y-4">
              <div>
                <h4 className="sv-h3">Moving Vans Demonstration</h4>
                <p className="sv-label mt-0.5">
                  Select relocation tier, inventory scale, and preview locked price estimate.
                </p>
              </div>

              {/* 3 Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMovingTier(1)}
                  className={`p-3.5 rounded-[12px] border text-left transition-colors cursor-pointer ${
                    movingTier === 1
                      ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/50'
                      : 'border-[#CBD5E1] hover:border-[#90E0EF]'
                  }`}
                >
                  <div className="text-[14px] font-bold text-[#111827] mb-1">Tier 1: Van + Driver</div>
                  <p className="text-[12px] text-[#4B5563] leading-snug">
                    Dedicated commercial van and licensed driver. Client handles all loading.
                  </p>
                  <div className="mt-2.5 text-[13px] font-bold text-[#0096C7] tabular-nums">From ₦45,000</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMovingTier(2)}
                  className={`p-3.5 rounded-[12px] border text-left transition-colors cursor-pointer ${
                    movingTier === 2
                      ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/50'
                      : 'border-[#CBD5E1] hover:border-[#90E0EF]'
                  }`}
                >
                  <div className="text-[14px] font-bold text-[#111827] mb-1">Tier 2: Van + Helpers</div>
                  <p className="text-[12px] text-[#4B5563] leading-snug">
                    Van, driver, and 2 trained crew members for loading, lifting, and unloading.
                  </p>
                  <div className="mt-2.5 text-[13px] font-bold text-[#0096C7] tabular-nums">From ₦85,000</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMovingTier(3)}
                  className={`p-3.5 rounded-[12px] border text-left transition-colors cursor-pointer ${
                    movingTier === 3
                      ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/50'
                      : 'border-[#CBD5E1] hover:border-[#90E0EF]'
                  }`}
                >
                  <div className="text-[14px] font-bold text-[#111827] mb-1">Tier 3: Full Relocation</div>
                  <p className="text-[12px] text-[#4B5563] leading-snug">
                    Full packing materials, bubble wrap, dismantle, transport &amp; reassembly.
                  </p>
                  <div className="mt-2.5 text-[13px] font-bold text-[#0096C7] tabular-nums">From ₦160,000</div>
                </button>
              </div>

              {/* Inventory details */}
              <div className="p-4 bg-[#F8FAFC] rounded-[12px] border border-[#E2E8F0] space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="sv-label block mb-1">Pickup Location</label>
                    <input
                      type="text"
                      value={pickupArea}
                      onChange={(e) => setPickupArea(e.target.value)}
                      className="sv-input w-full min-h-[40px] px-3 py-1.5 border border-[#CBD5E1] rounded-[8px] bg-white text-[14px] text-[#111827]"
                    />
                  </div>
                  <div>
                    <label className="sv-label block mb-1">Destination Location</label>
                    <input
                      type="text"
                      value={deliveryArea}
                      onChange={(e) => setDeliveryArea(e.target.value)}
                      className="sv-input w-full min-h-[40px] px-3 py-1.5 border border-[#CBD5E1] rounded-[8px] bg-white text-[14px] text-[#111827]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="sv-label block mb-1">Number of Bedrooms</label>
                    <select
                      value={roomsCount}
                      onChange={(e) => setRoomsCount(parseInt(e.target.value))}
                      className="sv-input w-full min-h-[40px] px-3 py-1.5 border border-[#CBD5E1] rounded-[8px] bg-white text-[14px] text-[#111827]"
                    >
                      <option value={1}>1 Bedroom / Studio</option>
                      <option value={2}>2 Bedrooms</option>
                      <option value={3}>3 Bedrooms</option>
                      <option value={4}>4+ Bedrooms</option>
                    </select>
                  </div>
                  <div className="flex items-center sm:pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-[13px] font-medium text-[#111827]">
                      <input
                        type="checkbox"
                        checked={hasHeavyItems}
                        onChange={(e) => setHasHeavyItems(e.target.checked)}
                        className="w-4 h-4 rounded border-[#CBD5E1] text-[#00B4D8]"
                      />
                      <span>Includes heavy appliances / piano</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="sv-label">Simulated Locked Estimate:</span>
                    <div className="text-[20px] font-extrabold text-[#111827] tabular-nums">
                      ₦{simulatedMovingTotal.toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEstimateLocked(!estimateLocked)}
                    className="sv-btn-primary min-h-[40px] px-5 py-2 rounded-full text-[13px] cursor-pointer"
                  >
                    {estimateLocked ? 'Estimate Locked (Demo)' : 'Lock Price Simulation'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Local Lagos Delivery */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              <div>
                <h4 className="sv-h3">Lagos Local Dispatch (Preview)</h4>
                <p className="sv-label mt-0.5">
                  Same-day intra-city document and package delivery across Lagos metropolis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] space-y-1">
                  <div className="text-[14px] font-bold text-[#111827]">Motorcycle Courier (Up to 5kg)</div>
                  <p className="text-[13px] text-[#4B5563]">Fast dispatch for documents, fashion apparel, and electronics.</p>
                  <div className="text-[13px] font-bold text-[#0096C7] pt-1 tabular-nums">Estimated: ₦2,500 – ₦4,500</div>
                </div>
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] space-y-1">
                  <div className="text-[14px] font-bold text-[#111827]">Cargo Mini-Van (Up to 350kg)</div>
                  <p className="text-[13px] text-[#4B5563]">Multi-package batch deliveries and commercial merchandise.</p>
                  <div className="text-[13px] font-bold text-[#0096C7] pt-1 tabular-nums">Estimated: ₦18,000 – ₦32,000</div>
                </div>
              </div>

              <div className="p-3.5 bg-[#CAF0F8] border border-[#90E0EF] rounded-[10px] text-[13px] text-[#0F172A] flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Notice: Local dispatch is currently in technical simulation. Live booking will open following operational deployment.</span>
              </div>
            </div>
          )}

          {/* Interstate Transport */}
          {activeTab === 'interstate' && (
            <div className="space-y-4">
              <div>
                <h4 className="sv-h3">Interstate Freight &amp; Trunking (Preview)</h4>
                <p className="sv-label mt-0.5">
                  Scheduled intercity line-haul routes connecting Lagos, Ibadan, Abuja, Port Harcourt, and Kano.
                </p>
              </div>

              <div className="border border-[#E2E8F0] rounded-[10px] overflow-hidden">
                <div className="bg-[#F8FAFC] px-4 py-2.5 text-[13px] font-bold text-[#111827] border-b border-[#E2E8F0] grid grid-cols-3">
                  <span>Trunk Route</span>
                  <span>Schedule</span>
                  <span className="text-right">Est. Rate per kg</span>
                </div>
                <div className="divide-y divide-[#E2E8F0] text-[13px]">
                  <div className="p-3.5 grid grid-cols-3 items-center">
                    <span className="font-semibold text-[#111827]">Lagos ↔ Abuja FCT</span>
                    <span className="text-[#4B5563]">Daily overnight departure</span>
                    <span className="text-right font-bold text-[#0096C7] tabular-nums">₦450 / kg</span>
                  </div>
                  <div className="p-3.5 grid grid-cols-3 items-center">
                    <span className="font-semibold text-[#111827]">Lagos ↔ Port Harcourt</span>
                    <span className="text-[#4B5563]">Tue, Thu, Sat departure</span>
                    <span className="text-right font-bold text-[#0096C7] tabular-nums">₦480 / kg</span>
                  </div>
                  <div className="p-3.5 grid grid-cols-3 items-center">
                    <span className="font-semibold text-[#111827]">Lagos ↔ Kano Central</span>
                    <span className="text-[#4B5563]">Mon, Wed, Fri departure</span>
                    <span className="text-right font-bold text-[#0096C7] tabular-nums">₦520 / kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <span className="sv-label">
            Swiftvero Logistics Research &amp; Expansion Division
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-1.5 bg-white border border-[#CBD5E1] hover:border-[#00B4D8] text-[#111827] rounded-full text-[13px] font-bold cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
