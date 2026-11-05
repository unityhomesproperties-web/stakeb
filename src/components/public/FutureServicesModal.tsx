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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl border border-[#DCEFF3] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCEFF3] bg-[#F5FBFD] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#00B4D8]" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#354B55]">Future Domestic & Relocation Services</h3>
                <span className="text-[10px] font-semibold text-[#956B16] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Coming Soon / Simulated Preview
                </span>
              </div>
              <p className="text-[11px] text-[#6A808C]">
                Interactive demonstration of planned local logistics services. No actual bookings or charges.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#6A808C] hover:text-[#354B55] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Service Category Tabs */}
        <div className="flex border-b border-[#DCEFF3] px-6 bg-[#F5FBFD] gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('moving')}
            className={`py-2.5 transition-colors border-b-2 ${
              activeTab === 'moving'
                ? 'border-[#00B4D8] text-[#00B4D8] font-semibold'
                : 'border-transparent text-[#6A808C] hover:text-[#354B55]'
            }`}
          >
            Moving Vans & Relocation
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`py-2.5 transition-colors border-b-2 ${
              activeTab === 'local'
                ? 'border-[#00B4D8] text-[#00B4D8] font-semibold'
                : 'border-transparent text-[#6A808C] hover:text-[#354B55]'
            }`}
          >
            Lagos Local Delivery
          </button>
          <button
            onClick={() => setActiveTab('interstate')}
            className={`py-2.5 transition-colors border-b-2 ${
              activeTab === 'interstate'
                ? 'border-[#00B4D8] text-[#00B4D8] font-semibold'
                : 'border-transparent text-[#6A808C] hover:text-[#354B55]'
            }`}
          >
            Interstate Line-Haul
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Relocation Service */}
          {activeTab === 'moving' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-bold text-[#354B55]">Moving Vans Demonstration</h4>
                <p className="text-[#6A808C] text-[11px] mt-0.5">
                  Select relocation tier, inventory scale, and preview locked price estimate.
                </p>
              </div>

              {/* 3 Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMovingTier(1)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    movingTier === 1
                      ? 'border-[#00B4D8] bg-[#CAF0F8]'
                      : 'border-[#DCEFF3] hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-[#354B55] mb-1">Tier 1: Van + Driver</div>
                  <p className="text-[11px] text-[#6A808C] leading-snug">
                    Dedicated commercial van and licensed driver. Client handles all loading.
                  </p>
                  <div className="mt-2 font-mono font-semibold text-[#00B4D8]">From NGN 45,000</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMovingTier(2)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    movingTier === 2
                      ? 'border-[#00B4D8] bg-[#CAF0F8]'
                      : 'border-[#DCEFF3] hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-[#354B55] mb-1">Tier 2: Van + Helpers</div>
                  <p className="text-[11px] text-[#6A808C] leading-snug">
                    Van, driver, and 2 trained crew members for loading, lifting, and unloading.
                  </p>
                  <div className="mt-2 font-mono font-semibold text-[#00B4D8]">From NGN 85,000</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMovingTier(3)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    movingTier === 3
                      ? 'border-[#00B4D8] bg-[#CAF0F8]'
                      : 'border-[#DCEFF3] hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-[#354B55] mb-1">Tier 3: Full Relocation</div>
                  <p className="text-[11px] text-[#6A808C] leading-snug">
                    Full packing materials, bubble wrap, dismantle, transport & reassembly.
                  </p>
                  <div className="mt-2 font-mono font-semibold text-[#00B4D8]">From NGN 160,000</div>
                </button>
              </div>

              {/* Inventory details */}
              <div className="p-4 bg-[#F5FBFD] rounded-md border border-[#DCEFF3] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#354B55] mb-1">Pickup Location</label>
                    <input
                      type="text"
                      value={pickupArea}
                      onChange={(e) => setPickupArea(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#DCEFF3] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#354B55] mb-1">Destination Location</label>
                    <input
                      type="text"
                      value={deliveryArea}
                      onChange={(e) => setDeliveryArea(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#DCEFF3] rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-[#354B55] mb-1">Number of Bedrooms</label>
                    <select
                      value={roomsCount}
                      onChange={(e) => setRoomsCount(parseInt(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-[#DCEFF3] rounded text-xs"
                    >
                      <option value={1}>1 Bedroom / Studio</option>
                      <option value={2}>2 Bedrooms</option>
                      <option value={3}>3 Bedrooms</option>
                      <option value={4}>4+ Bedrooms</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-[#354B55]">
                      <input
                        type="checkbox"
                        checked={hasHeavyItems}
                        onChange={(e) => setHasHeavyItems(e.target.checked)}
                        className="rounded border-[#DCEFF3] text-[#00B4D8]"
                      />
                      <span>Includes heavy appliances / piano</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DCEFF3] flex items-center justify-between">
                  <div>
                    <span className="text-[#6A808C]">Simulated Locked Estimate:</span>
                    <div className="text-base font-bold text-[#00B4D8] font-mono">
                      NGN {simulatedMovingTotal.toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEstimateLocked(!estimateLocked)}
                    className="px-3 py-1.5 bg-[#00B4D8] text-white rounded text-xs font-semibold hover:bg-[#0096B4] transition-colors"
                  >
                    {estimateLocked ? 'Estimate Locked (Demo)' : 'Lock Price Simulation'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Local Lagos Delivery */}
          {activeTab === 'local' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-bold text-[#354B55]">Lagos Local Dispatch (Preview)</h4>
                <p className="text-[#6A808C] text-[11px] mt-0.5">
                  Same-day intra-city document and package delivery across Lagos metropolis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[#F5FBFD] border border-[#DCEFF3] rounded-md space-y-1">
                  <div className="font-bold text-[#354B55]">Motorcycle Courier (Up to 5kg)</div>
                  <p className="text-[11px] text-[#6A808C]">Fast dispatch for documents, fashion apparel, and electronics.</p>
                  <div className="text-xs font-semibold text-[#00B4D8] pt-1">Estimated: ₦2,500 – ₦4,500</div>
                </div>
                <div className="p-3 bg-[#F5FBFD] border border-[#DCEFF3] rounded-md space-y-1">
                  <div className="font-bold text-[#354B55]">Cargo Mini-Van (Up to 350kg)</div>
                  <p className="text-[11px] text-[#6A808C]">Multi-package batch deliveries and commercial merchandise.</p>
                  <div className="text-xs font-semibold text-[#00B4D8] pt-1">Estimated: ₦18,000 – ₦32,000</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-[#DCEFF3] rounded text-[11px] text-[#6A808C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#956B16] shrink-0" />
                <span>Notice: Local dispatch is currently in technical simulation. Live booking will open following operational deployment.</span>
              </div>
            </div>
          )}

          {/* Interstate Transport */}
          {activeTab === 'interstate' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-bold text-[#354B55]">Interstate Freight & Trunking (Preview)</h4>
                <p className="text-[#6A808C] text-[11px] mt-0.5">
                  Scheduled intercity line-haul routes connecting Lagos, Ibadan, Abuja, Port Harcourt, and Kano.
                </p>
              </div>

              <div className="border border-[#DCEFF3] rounded-md overflow-hidden">
                <div className="bg-[#F5FBFD] px-3 py-2 font-bold text-[#354B55] border-b border-[#DCEFF3] grid grid-cols-3">
                  <span>Trunk Route</span>
                  <span>Schedule</span>
                  <span className="text-right">Est. Rate per kg</span>
                </div>
                <div className="divide-y divide-[#DCEFF3] text-[11px]">
                  <div className="p-3 grid grid-cols-3">
                    <span className="font-semibold text-[#354B55]">Lagos ↔ Abuja FCT</span>
                    <span className="text-[#6A808C]">Daily overnight departure</span>
                    <span className="text-right font-mono font-semibold text-[#00B4D8]">₦450 / kg</span>
                  </div>
                  <div className="p-3 grid grid-cols-3">
                    <span className="font-semibold text-[#354B55]">Lagos ↔ Port Harcourt</span>
                    <span className="text-[#6A808C]">Tue, Thu, Sat departure</span>
                    <span className="text-right font-mono font-semibold text-[#00B4D8]">₦480 / kg</span>
                  </div>
                  <div className="p-3 grid grid-cols-3">
                    <span className="font-semibold text-[#354B55]">Lagos ↔ Kano Central</span>
                    <span className="text-[#6A808C]">Mon, Wed, Fri departure</span>
                    <span className="text-right font-mono font-semibold text-[#00B4D8]">₦520 / kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#DCEFF3] bg-[#F5FBFD] flex items-center justify-between">
          <span className="text-[11px] text-[#6A808C]">
            Swiftvero Logistics Research & Expansion Division
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#DCEFF3] hover:bg-slate-50 text-[#354B55] rounded text-xs font-semibold"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
