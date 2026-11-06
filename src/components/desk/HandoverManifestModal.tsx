import React, { useState } from 'react';
import { X, Truck, CheckCircle2, ShieldCheck, Printer, Calendar, FileText, AlertCircle } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { ShipmentRecord } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';

interface HandoverManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibleShipments: ShipmentRecord[];
}

export const HandoverManifestModal: React.FC<HandoverManifestModalProps> = ({
  isOpen,
  onClose,
  eligibleShipments,
}) => {
  const { currentStaffUser, activeBranchId, branches, createHandoverManifest } = useDemo();
  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  const [driverName, setDriverName] = useState('Ibrahim Danladi');
  const [driverPhone, setDriverPhone] = useState('+234 803 111 2233');
  const [vehicleReg, setVehicleReg] = useState('KJA-482-XA (Toyota Hiace Van)');
  const [destinationHub, setDestinationHub] = useState('Murtala Muhammed Int. Airport (MMIA Cargo Sorting Facility)');
  const [seal1, setSeal1] = useState('SWV-SEAL-89421');
  const [seal2, setSeal2] = useState('SWV-SEAL-89422');
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>(
    eligibleShipments.slice(0, 5).map((s) => s.id)
  );

  const [completedManifest, setCompletedManifest] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleToggleShipment = (id: string) => {
    if (selectedShipmentIds.includes(id)) {
      setSelectedShipmentIds(selectedShipmentIds.filter((s) => s !== id));
    } else {
      setSelectedShipmentIds([...selectedShipmentIds, id]);
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedShipmentIds.length === 0) return;

    const totalWeightKg = eligibleShipments
      .filter((s) => selectedShipmentIds.includes(s.id))
      .reduce((acc, s) => acc + s.declaredWeightKg, 0);

    const manifest = createHandoverManifest({
      branchId: currentBranch.id,
      branchName: currentBranch.name,
      driverName,
      driverPhone,
      vehicleRegistration: vehicleReg,
      destinationHub,
      shipmentIds: selectedShipmentIds,
      totalPackages: selectedShipmentIds.length,
      totalWeightKg,
      tamperSealNumbers: [seal1, seal2].filter(Boolean),
      handedOverByStaffName: currentStaffUser?.name || 'Chioma Eze',
      status: 'in_transit_to_hub',
    });

    setCompletedManifest(manifest);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#253B45]/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DDEEF2] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDEEF2] bg-[#F7FCFD]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00B4D8] text-white flex items-center justify-center shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#253B45]">Branch Dispatch &amp; Operations Handover</h3>
              <p className="text-[11px] text-[#637984]">{currentBranch.name} → Airport Logistics Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {!completedManifest ? (
            <form onSubmit={handleDispatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#253B45] mb-1">Dispatch Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#253B45] mb-1">Driver Telephone *</label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#253B45] mb-1">Vehicle Registration</label>
                  <input
                    type="text"
                    value={vehicleReg}
                    onChange={(e) => setVehicleReg(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#253B45] mb-1">Destination Sorting Hub</label>
                  <input
                    type="text"
                    value={destinationHub}
                    onChange={(e) => setDestinationHub(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                  />
                </div>
              </div>

              {/* Tamper Seal Serials */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#253B45] mb-1">Tamper-Evident Seal #1</label>
                  <input
                    type="text"
                    value={seal1}
                    onChange={(e) => setSeal1(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#253B45] mb-1">Tamper-Evident Seal #2</label>
                  <input
                    type="text"
                    value={seal2}
                    onChange={(e) => setSeal2(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                  />
                </div>
              </div>

              {/* Package Selection */}
              <div>
                <label className="block font-semibold text-[#253B45] mb-1.5">
                  Select Packages to Include in Manifest ({selectedShipmentIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#DDEEF2] rounded-xl p-2 bg-[#F7FCFD]">
                  {eligibleShipments.length === 0 ? (
                    <p className="text-center py-4 text-slate-500">No shipments currently awaiting handover.</p>
                  ) : (
                    eligibleShipments.map((ship) => (
                      <label
                        key={ship.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#DDEEF2] cursor-pointer hover:border-[#00B4D8]"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedShipmentIds.includes(ship.id)}
                            onChange={() => handleToggleShipment(ship.id)}
                            className="rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                          />
                          <span className="font-mono font-bold text-[#253B45]">{ship.trackingNumber}</span>
                          <span className="text-[#637984]">· {ship.senderName}</span>
                        </div>
                        <div className="font-mono text-[#637984]">
                          {ship.declaredWeightKg} kg
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDEEF2]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#DDEEF2] rounded-lg font-semibold text-[#637984] hover:bg-[#F7FCFD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedShipmentIds.length === 0}
                  className="px-5 py-2 bg-[#00B4D8] hover:bg-[#009BB8] text-white font-bold rounded-lg shadow-sm disabled:opacity-40"
                >
                  Sign &amp; Dispatch Manifest
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-[#CAF0F8]/50 border border-[#90E0EF] rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#00B4D8] mx-auto" />
                <h4 className="font-bold text-sm text-[#253B45]">Manifest Dispatched to Operations</h4>
                <p className="text-xs text-[#008EA8]">
                  Manifest {completedManifest.manifestNumber} generated and signed. Driver has custody of packages.
                </p>
                <div className="text-xs font-mono font-bold bg-white p-2 rounded border border-[#90E0EF] inline-block">
                  {completedManifest.totalPackages} Packages · {completedManifest.totalWeightKg} kg
                </div>
              </div>

              <div className="p-3 bg-[#F7FCFD] rounded-xl border border-[#DDEEF2] text-xs space-y-1 text-[#253B45]">
                <div>Vehicle: <span className="font-semibold">{completedManifest.vehicleRegistration}</span></div>
                <div>Driver: <span className="font-semibold">{completedManifest.driverName} ({completedManifest.driverPhone})</span></div>
                <div>Destination: <span className="font-semibold">{completedManifest.destinationHub}</span></div>
                <div>Seals: <span className="font-mono text-[#00B4D8]">{completedManifest.tamperSealNumbers.join(', ')}</span></div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDEEF2]">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-[#DDEEF2] rounded-lg font-semibold text-[#253B45] flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dispatch Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#00B4D8] text-white font-bold rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
