import React, { useState } from 'react';
import {
  Boxes,
  Plane,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Zap,
  ArrowRight,
  ShieldAlert,
  Building2,
  RefreshCw,
  FileText,
  MapPin,
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { ShipmentRecord } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';

export const OperationsDashboard: React.FC = () => {
  const {
    currentStaffUser,
    shipments,
    triggerOverdueAlert,
    resolveOverdueAlert,
    handoverManifests,
    updateShipmentStatus,
  } = useDemo();

  const [filter, setFilter] = useState<'all' | 'priority' | 'exceptions' | 'hub_queue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [carrierFlightRef, setCarrierFlightRef] = useState('BA-074 (LHR - Heathrow)');

  // Filtered shipments
  const operationalShipments = shipments.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matches =
      !q ||
      s.trackingNumber.toLowerCase().includes(q) ||
      s.recipientName.toLowerCase().includes(q) ||
      s.destinationCountry.toLowerCase().includes(q);

    if (!matches) return false;

    if (filter === 'priority') return s.selectedTier === 'priority';
    if (filter === 'exceptions') return s.isUpdateOverdue;
    if (filter === 'hub_queue') return s.status === 'pickup_completed' || s.status === 'booked';
    return true;
  });

  const priorityCount = shipments.filter((s) => s.selectedTier === 'priority').length;
  const overdueCount = shipments.filter((s) => s.isUpdateOverdue).length;
  const inTransitCount = shipments.filter((s) => s.status === 'in_transit' || s.status === 'pickup_completed').length;

  const handleDispatchToCarrier = (shipmentId: string) => {
    updateShipmentStatus(shipmentId, {
      status: 'in_transit',
      lastUpdateTimestamp: new Date().toISOString(),
      trackingEvents: [
        ...(shipments.find((s) => s.id === shipmentId)?.trackingEvents || []),
        {
          id: `evt_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          stage: 'Dispatched on Carrier International Flight',
          location: 'MMIA International Cargo Terminal, Lagos',
          description: `Consignment lodged into international flight ${carrierFlightRef} with pre-cleared customs manifest.`,
        },
      ],
    });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Operations Header */}
      <div className="bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-lg shadow-2xs border border-[#90E0EF]">
            <Plane className="w-5 h-5 text-[#00B4D8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#253B45]">MMIA Airport Operations Control Tower</span>
              <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF] px-2 py-0.5 rounded-md">
                Hub Transit
              </span>
            </div>
            <p className="text-xs text-[#637984] mt-0.5">
              Officer: {currentStaffUser?.name || 'Kemi Adeleke'} · NCAA Master Freight Manifest Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#637984]">Sorting Hub Status:</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>International Lane Clear</span>
          </span>
        </div>
      </div>

      {/* 3 Operational Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">1. What is happening?</span>
          <div className="text-xl font-black text-[#253B45] font-mono mt-1">{inTransitCount} Consignments</div>
          <p className="text-xs text-[#637984] mt-0.5">Under airport sorting and international linehaul.</p>
        </div>

        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">2. Needs Attention</span>
          <div className="text-xl font-black text-amber-800 font-mono mt-1">
            {overdueCount} Exception Alert{overdueCount === 1 ? '' : 's'}
          </div>
          <p className="text-xs text-amber-700 mt-0.5">Overdue carrier update intervals detected by system.</p>
        </div>

        <div className="p-4 bg-[#CAF0F8]/30 border border-[#90E0EF] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#008EA8] block">3. Priority Flights</span>
          <div className="text-xl font-black text-[#008EA8] font-mono mt-1">{priorityCount} Priority Parcels</div>
          <p className="text-xs text-[#637984] mt-0.5">Expedited tarmac loading window (2 – 4 days delivery).</p>
        </div>
      </div>

      {/* Operational Queue and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Queue */}
        <div className="lg:col-span-2 bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#253B45]">Consignment Processing Queue</h3>
              <p className="text-xs text-[#637984]">Manage flight allocation and handle overdue exceptions</p>
            </div>

            {/* Filter Pills */}
            <div className="flex border border-[#DDEEF2] rounded-lg p-0.5 bg-[#F7FCFD] text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md font-semibold ${filter === 'all' ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#637984]'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('priority')}
                className={`px-3 py-1 rounded-md font-semibold ${filter === 'priority' ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#637984]'}`}
              >
                Priority ({priorityCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('exceptions')}
                className={`px-3 py-1 rounded-md font-semibold ${filter === 'exceptions' ? 'bg-white text-red-600 shadow-2xs' : 'text-[#637984]'}`}
              >
                Exceptions ({overdueCount})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {operationalShipments.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedShipment(s)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedShipment?.id === s.id
                    ? 'border-[#00B4D8] bg-[#CAF0F8]/20 ring-1 ring-[#00B4D8]'
                    : 'border-[#DDEEF2] hover:border-[#90E0EF] bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#253B45]">{s.trackingNumber}</span>
                      {s.selectedTier === 'priority' && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                          PRIORITY
                        </span>
                      )}
                      {s.isUpdateOverdue && (
                        <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          OVERDUE SCAN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#637984] mt-1">
                      {s.originCity} → <span className="font-semibold text-[#253B45]">{s.destinationCity}, {s.destinationCountry}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-[#253B45]">
                    {s.declaredWeightKg} kg
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#DDEEF2] text-xs text-[#637984]">
                  <span>Consignor: {s.senderName}</span>
                  <span>Recipient: {s.recipientName}</span>
                  <span className="font-semibold text-[#00B4D8]">Status: {s.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Flight Allocation & Exception Console */}
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDEEF2]">
            <h3 className="text-sm font-bold text-[#253B45]">International Flight Console</h3>
            <span className="text-[10px] font-bold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-md">
              Carrier Dispatch
            </span>
          </div>

          {selectedShipment ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F7FCFD] border border-[#DDEEF2] rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-[#253B45]">{selectedShipment.trackingNumber}</span>
                  <span className="font-semibold text-[#00B4D8] capitalize">{selectedShipment.selectedTier} Lane</span>
                </div>
                <div className="text-[#637984]">Destination: {selectedShipment.destinationCity}, {selectedShipment.destinationCountry}</div>
                <div className="text-[#637984]">Chargeable Weight: {selectedShipment.declaredWeightKg} kg</div>
              </div>

              {/* Overdue Alert Sandbox / Proactive Escalation */}
              <div className="p-3.5 border rounded-xl space-y-2 bg-[#F7FCFD] border-[#DDEEF2]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#253B45]">Proactive Tracking Watch</span>
                  {selectedShipment.isUpdateOverdue ? (
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">Alert Fired</span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Normal Freshness</span>
                  )}
                </div>
                <p className="text-[11px] text-[#637984]">
                  Simulate carrier tracking scan delay to test automated proactive customer notification and operations SLA escalation.
                </p>
                {!selectedShipment.isUpdateOverdue ? (
                  <button
                    type="button"
                    onClick={() => triggerOverdueAlert(selectedShipment.id)}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-xs transition-colors"
                  >
                    Simulate Overdue Tracking Alert (&gt;18h No Scan)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => resolveOverdueAlert(selectedShipment.id, 'Destination carrier liaison confirmed clearance at Heathrow terminal.')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors"
                  >
                    Resolve Alert &amp; Notify Consignor
                  </button>
                )}
              </div>

              {/* International Flight Lodging */}
              <div className="space-y-2">
                <label className="block font-bold text-[#253B45]">Authorized Carrier Flight Lane</label>
                <select
                  value={carrierFlightRef}
                  onChange={(e) => setCarrierFlightRef(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDEEF2] rounded-xl bg-[#F7FCFD] font-semibold"
                >
                  <option value="BA-074 (LHR - London Heathrow)">BA-074 (LHR - London Heathrow)</option>
                  <option value="DL-055 (JFK - New York)">DL-055 (JFK - New York)</option>
                  <option value="AF-149 (CDG - Paris / Europe Transit)">AF-149 (CDG - Paris / Europe Transit)</option>
                  <option value="ET-900 (ACC - West Africa Express)">ET-900 (ACC - West Africa Express)</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleDispatchToCarrier(selectedShipment.id)}
                  className="w-full py-2.5 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Plane className="w-4 h-4" />
                  <span>Lodge onto Carrier Flight &amp; Update Waybill</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[#637984] text-xs">
              Select a consignment from the queue to manage airport lodging or resolve tracking exceptions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
