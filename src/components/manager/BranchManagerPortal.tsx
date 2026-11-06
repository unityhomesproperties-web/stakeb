import React, { useState } from 'react';
import {
  Building2,
  Users,
  Package,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { formatNaira } from '../../utils/shipping-calculator';

export const BranchManagerPortal: React.FC = () => {
  const { currentStaffUser, branches, activeBranchId, setActiveBranchId, staffMembers, shipments, handoverManifests } = useDemo();
  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  const branchStaff = staffMembers.filter((s) => s.branchId === currentBranch.id || s.branchId === 'all');
  const branchShipments = shipments.filter((s) => s.branchId === currentBranch.id || !s.branchId);
  const branchManifests = handoverManifests.filter((m) => m.branchId === currentBranch.id);

  const totalRevenue = branchShipments
    .filter((s) => s.paymentStatus === 'paid')
    .reduce((acc, s) => acc + (s.quote?.totalAmount || 0), 0);

  return (
    <div className="space-y-5 pb-12">
      {/* Branch Manager Header */}
      <div className="bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-lg shadow-2xs border border-[#90E0EF]">
            <Building2 className="w-5 h-5 text-[#00B4D8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#253B45]">{currentBranch.name}</span>
              <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF] px-2 py-0.5 rounded-md">
                Hub General Manager
              </span>
            </div>
            <p className="text-xs text-[#637984] mt-0.5">
              Branch Manager: {currentBranch.managerName || 'Adebayo Ogunlesi'} · Hub Code: {currentBranch.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[#637984] font-semibold">Active Hub:</label>
          <select
            value={activeBranchId}
            onChange={(e) => setActiveBranchId(e.target.value)}
            className="text-xs bg-[#F7FCFD] border border-[#DDEEF2] rounded-lg px-2.5 py-1 text-[#253B45] font-semibold focus:border-[#00B4D8] focus:outline-hidden"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Branch Revenue</span>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">{formatNaira(totalRevenue)}</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Today's settled walk-ins</p>
        </div>

        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Consignments Handled</span>
          <div className="text-xl font-black text-[#253B45] font-mono mt-1">{branchShipments.length}</div>
          <p className="text-[10px] text-[#00B4D8] font-semibold mt-0.5">Intake &amp; doorstep pickups</p>
        </div>

        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Active Shift Staff</span>
          <div className="text-xl font-black text-[#253B45] font-mono mt-1">{branchStaff.length}</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Intake &amp; courier agents</p>
        </div>

        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Airport Handover Batches</span>
          <div className="text-xl font-black text-[#008EA8] font-mono mt-1">{branchManifests.length}</div>
          <p className="text-[10px] text-[#637984] mt-0.5">Signed transit manifests</p>
        </div>
      </div>

      {/* Two Column Layout: Staff Performance & Handover Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Staff Attendance & Activity */}
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#253B45]">Branch Staff Performance</h3>
            <p className="text-xs text-[#637984]">Roster, operational attendance, and individual intake volume</p>
          </div>

          <div className="space-y-2.5">
            {branchStaff.map((st) => (
              <div key={st.id} className="p-3 border border-[#DDEEF2] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#253B45] flex items-center gap-1.5">
                    <span>{st.name}</span>
                    <span className="text-[10px] text-[#00B4D8] font-mono">({st.staffId})</span>
                  </div>
                  <div className="text-[11px] text-[#637984] capitalize">{st.role.replace(/_/g, ' ')} · {st.department}</div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    st.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {st.status.toUpperCase()}
                  </span>
                  <div className="text-[10px] text-[#637984] mt-0.5">{st.lastActive}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Handover Dispatch History */}
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#253B45]">MMIA Transit Handover Logs</h3>
            <p className="text-xs text-[#637984]">Vehicle dispatches and tamper-evident seal records</p>
          </div>

          <div className="space-y-2.5">
            {branchManifests.length === 0 ? (
              <div className="py-8 text-center text-[#637984] text-xs">No dispatches logged today.</div>
            ) : (
              branchManifests.map((m) => (
                <div key={m.id} className="p-3.5 border border-[#DDEEF2] rounded-xl bg-[#F7FCFD] space-y-1.5 text-xs text-[#253B45]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#00B4D8]">{m.manifestNumber}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#637984]">
                    Driver: <span className="font-semibold text-[#253B45]">{m.driverName}</span> ({m.vehicleRegistration})
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#637984] pt-1 border-t border-[#DDEEF2]">
                    <span>{m.totalPackages} Packages ({m.totalWeightKg} kg)</span>
                    <span className="font-mono text-[#00B4D8]">Seals: {m.tamperSealNumbers.join(', ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
