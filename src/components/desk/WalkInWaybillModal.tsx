import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, MapPin, Phone, User, Calendar, QrCode, Barcode, Building2 } from 'lucide-react';
import { ShipmentRecord } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';

interface WalkInWaybillModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: ShipmentRecord | null;
  branchName?: string;
  staffName?: string;
}

export const WalkInWaybillModal: React.FC<WalkInWaybillModalProps> = ({
  isOpen,
  onClose,
  shipment,
  branchName = 'Ikeja Cargo Hub (Lagos Mainland)',
  staffName = 'Chioma Eze',
}) => {
  if (!isOpen || !shipment) return null;

  const handlePrint = () => {
    window.print();
  };

  const barcodeValue = shipment.trackingNumber.replace(/-/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#DDEEF2] bg-[#F7FCFD] print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-md">
              Official Branch Waybill &amp; Consignment Note
            </span>
            <span className="text-xs text-[#637984] font-mono">{shipment.trackingNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#00B4D8] hover:bg-[#009BB8] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Waybill (A4 / Thermal)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              aria-label="Close waybill"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Waybill Sheet */}
        <div className="p-8 overflow-y-auto space-y-6 text-[#1D2922] bg-white print:p-0 print:m-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-[#174B35]">SWIFTVERO</span>
                <span className="text-2xl font-light tracking-wide text-[#00B4D8]">EXPRESS</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                Physical Branch Consignment Note · Walk-In Cargo Waybill
              </p>
              <div className="text-xs text-slate-700 mt-1 space-y-0.5">
                <p className="font-semibold">{branchName}</p>
                <p>NCAA Cargo Certified · RC 1892041 · Phone: +234 1 291 0011</p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="border border-black px-3 py-1 text-center bg-slate-50 rounded">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Waybill / Tracking No.</div>
                <div className="text-lg font-black font-mono tracking-wider">{shipment.trackingNumber}</div>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 font-mono">
                Date: {shipment.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)}
              </div>
            </div>
          </div>

          {/* Barcode Strip */}
          <div className="border border-dashed border-slate-400 p-3 bg-slate-50 flex items-center justify-between rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-44 bg-black flex items-center justify-center text-white font-mono text-[10px] tracking-widest px-2">
                ||| | |||| || ||| | ||| ||
              </div>
              <div className="text-xs font-mono font-bold">{barcodeValue}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF6EE] text-[#2F7D53] border border-[#2F7D53]/30 px-2 py-0.5 rounded">
                Tier: {shipment.selectedTier.toUpperCase()}
              </span>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {shipment.originCity} → {shipment.destinationCity}
              </div>
            </div>
          </div>

          {/* Sender & Receiver Dual Column Grid */}
          <div className="grid grid-cols-2 gap-4 border border-black rounded-lg overflow-hidden text-xs">
            {/* Sender */}
            <div className="p-3 border-r border-black space-y-1.5 bg-slate-50/50">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                1. SENDER / CONSIGNOR DETAILS
              </div>
              <div><span className="text-slate-500">Name:</span> <span className="font-bold">{shipment.senderName}</span></div>
              <div><span className="text-slate-500">Phone:</span> <span className="font-mono">{shipment.senderPhone}</span></div>
              <div><span className="text-slate-500">Email:</span> <span>{shipment.customerEmail}</span></div>
              <div><span className="text-slate-500">Origin:</span> <span>{shipment.senderAddress}, {shipment.originCity}</span></div>
              <div><span className="text-slate-500">Intake Desk:</span> <span className="font-semibold">{staffName} ({branchName.split(' ')[0]})</span></div>
            </div>

            {/* Receiver */}
            <div className="p-3 space-y-1.5">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                2. RECEIVER / CONSIGNEE DETAILS
              </div>
              <div><span className="text-slate-500">Name:</span> <span className="font-bold">{shipment.recipientName}</span></div>
              <div><span className="text-slate-500">Phone:</span> <span className="font-mono">{shipment.recipientPhone}</span></div>
              <div><span className="text-slate-500">Destination:</span> <span>{shipment.recipientAddress}, {shipment.destinationCity}, {shipment.destinationCountry}</span></div>
              <div><span className="text-slate-500">Delivery Est:</span> <span className="font-bold text-[#2F7D53]">{shipment.quote?.estimatedDeliveryDisplay || shipment.estimatedDeliveryDisplay}</span></div>
            </div>
          </div>

          {/* Package Details & Inspection Table */}
          <div className="border border-black rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 font-bold px-3 py-1.5 border-b border-black flex justify-between items-center text-[11px] uppercase">
              <span>3. PACKAGE DETAILS & PHYSICAL INSPECTION</span>
              <span className="text-[#2F7D53]">NCAA Security Cleared</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50 text-[10px] text-slate-600 uppercase font-bold">
                  <th className="p-2">Item Description</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Actual Wt</th>
                  <th className="p-2">Volumetric</th>
                  <th className="p-2">Declared Value</th>
                  <th className="p-2">Special Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(shipment.items && shipment.items.length > 0 ? shipment.items : [
                  { id: '1', description: 'Assorted Personal Effects & Export Goods', quantity: 1, declaredValue: shipment.declaredValueNgn || 50000 }
                ]).map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-medium">{it.description}</td>
                    <td className="p-2">{it.quantity || 1}</td>
                    <td className="p-2">{shipment.declaredWeightKg} kg</td>
                    <td className="p-2">{shipment.quote?.chargeableWeightKg || shipment.declaredWeightKg} kg</td>
                    <td className="p-2 font-mono">{formatNaira(it.declaredValue || shipment.declaredValueNgn || 50000)}</td>
                    <td className="p-2 text-slate-500">
                      Standard Reinforced Carton (NCAA Inspected)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Shipment Protection & Liability Terms */}
          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="font-bold text-[11px] uppercase text-[#1D2922] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2F7D53]" />
                <span>Protection Option: {shipment.protectionPlan === 'premium' ? 'Premium Shipment Coverage (Leadway Alliance)' : 'Included Basic Protection'}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {shipment.protectionPlan === 'premium'
                  ? `Covered up to declared value ${formatNaira(shipment.protectionCoverageNgn || shipment.declaredValueNgn || 50000)}. Ref: ${shipment.protectionReference || 'PROT-ACTIVE'}. Deductible: 5% or ₦10,000.`
                  : 'Standard contractual carrier liability applies under Warsaw/Montreal Convention limits.'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Protection Fee</span>
              <div className="font-mono font-bold text-sm text-[#2F7D53]">
                {formatNaira(shipment.protectionFeeNgn || 0)}
              </div>
            </div>
          </div>

          {/* Payment & Charges Breakdown */}
          <div className="border border-black rounded-lg p-3 text-xs flex justify-between items-center bg-slate-50">
            <div className="space-y-0.5">
              <span className="font-bold uppercase tracking-wider text-[11px]">Payment Summary</span>
              <div className="text-slate-600">
                Payment Status: <span className="font-bold text-[#2F7D53] uppercase">{shipment.paymentStatus}</span> · Method: {shipment.paymentMethod || 'Walk-In Counter (Cash/POS)'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-500 font-bold">Total Freight & Service Charges</span>
              <div className="text-xl font-black font-mono text-[#174B35]">
                {formatNaira(shipment.quote?.totalAmount || 0)}
              </div>
            </div>
          </div>

          {/* Physical Branch Stamp & Signatures Box */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-300 text-[10px]">
            {/* Sender Sign */}
            <div className="border border-slate-300 rounded p-2.5 h-24 flex flex-col justify-between">
              <span className="font-bold text-slate-600 uppercase">Sender Signature & Declaration</span>
              <p className="text-[9px] text-slate-500 italic">I declare that goods do not contain prohibited items or hazardous goods.</p>
              <div className="border-t border-slate-400 pt-1 font-mono">{shipment.senderName}</div>
            </div>

            {/* Branch Officer Stamp */}
            <div className="border-2 border-dashed border-[#2F7D53] rounded p-2.5 h-24 flex flex-col items-center justify-center text-center relative bg-[#EAF6EE]/30">
              <div className="w-14 h-14 rounded-full border-2 border-[#2F7D53] flex flex-col items-center justify-center text-[#2F7D53] font-bold rotate-[-12deg]">
                <span className="text-[7px] uppercase tracking-tighter">SWIFTVERO</span>
                <span className="text-[9px] font-black uppercase">OFFICIAL</span>
                <span className="text-[7px]">STAMP</span>
              </div>
              <span className="text-[8px] font-mono text-[#2F7D53] mt-1 font-bold">
                {branchName.split(' ')[0].toUpperCase()} BRANCH · INTAKE OK
              </span>
            </div>

            {/* Receiving Driver / Operations */}
            <div className="border border-slate-300 rounded p-2.5 h-24 flex flex-col justify-between">
              <span className="font-bold text-slate-600 uppercase">Ops Handover Sign-Off</span>
              <p className="text-[9px] text-slate-500 italic">Received package in sealed tamper-evident condition for airport sorting.</p>
              <div className="border-t border-slate-400 pt-1 font-mono text-slate-400">Driver / Dispatch Officer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
