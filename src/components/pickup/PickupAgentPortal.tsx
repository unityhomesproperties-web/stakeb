import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Scale,
  Package,
  AlertCircle,
  Camera,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { PickupJob } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';

export const PickupAgentPortal: React.FC = () => {
  const { currentStaffUser, pickupJobs, updatePickupJobStatus, branches, activeBranchId } = useDemo();
  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [scaleWeight, setScaleWeight] = useState<number>(5.5);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const myJobs = pickupJobs.filter(
    (j) => !j.assignedAgentId || j.assignedAgentId === currentStaffUser?.id || j.assignedAgentName?.includes('Emeka')
  );

  const filteredJobs = myJobs.filter((j) => {
    if (filter === 'pending') return j.status !== 'collected' && j.status !== 'handed_over';
    if (filter === 'completed') return j.status === 'collected' || j.status === 'handed_over';
    return true;
  });

  const activeJob = myJobs.find((j) => j.id === activeJobId) || filteredJobs[0] || null;

  const handleConfirmPickup = (jobId: string) => {
    updatePickupJobStatus(jobId, 'collected', inspectionNotes || 'Inspected and collected at doorstep. Calibrated scale verified.', scaleWeight);
    setActiveJobId(null);
  };

  const handleHandoverToOps = (jobId: string) => {
    updatePickupJobStatus(jobId, 'handed_over', 'Package handed over to MMIA Sorting Hub');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Staff Identity & Shift Ribbon */}
      <div className="bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-lg shadow-2xs border border-[#90E0EF]">
            <Truck className="w-5 h-5 text-[#00B4D8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#253B45]">{currentStaffUser?.name || 'Emeka Nwosu'}</span>
              <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF] px-2 py-0.5 rounded-md">
                Field Courier Agent
              </span>
            </div>
            <p className="text-xs text-[#637984] mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>Assigned Zone: {currentBranch.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-[#253B45]">Calibrated Mobile Scale</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Scale #NG-SCL-048 Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Operational Questions: What is happening? What needs attention? What should I do next? */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">1. What is happening?</span>
          <div className="text-xl font-black text-[#253B45] font-mono mt-1">{myJobs.length} Assigned Pickups</div>
          <p className="text-xs text-[#637984] mt-0.5">Scheduled for today across {currentBranch.city}.</p>
        </div>

        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">2. Needs Attention</span>
          <div className="text-xl font-black text-amber-800 font-mono mt-1">
            {myJobs.filter((j) => j.status !== 'collected' && j.status !== 'handed_over').length} Awaiting Collection
          </div>
          <p className="text-xs text-amber-700 mt-0.5">En route or scheduled within current dispatch window.</p>
        </div>

        <div className="p-4 bg-[#CAF0F8]/30 border border-[#90E0EF] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#008EA8] block">3. Next Action</span>
          <div className="text-sm font-bold text-[#253B45] mt-1 truncate">
            {activeJob ? `Collect from ${activeJob.senderName}` : 'All pickups cleared'}
          </div>
          <p className="text-xs text-[#637984] mt-0.5">Weigh package &amp; apply barcoded security seal.</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Pickup Task List */}
        <div className="lg:col-span-2 bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#253B45]">Today's Scheduled Pickups</h3>
              <p className="text-xs text-[#637984]">Doorstep visits with calibrated scale verification</p>
            </div>

            <div className="flex border border-[#DDEEF2] rounded-lg p-0.5 bg-[#F7FCFD] text-xs">
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  filter === 'pending' ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#637984]'
                }`}
              >
                Pending ({myJobs.filter((j) => j.status !== 'collected' && j.status !== 'handed_over').length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  filter === 'completed' ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#637984]'
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  filter === 'all' ? 'bg-white text-[#00B4D8] shadow-2xs' : 'text-[#637984]'
                }`}
              >
                All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="py-8 text-center text-[#637984] text-xs">No pickups match the filter.</div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setActiveJobId(job.id)}
                  className={`p-4 border rounded-xl transition-all cursor-pointer ${
                    activeJob?.id === job.id
                      ? 'border-[#00B4D8] bg-[#CAF0F8]/20 ring-1 ring-[#00B4D8]'
                      : 'border-[#DDEEF2] hover:border-[#90E0EF] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#253B45]">{job.senderName}</span>
                        <span className="font-mono text-xs text-[#00B4D8]">{job.trackingNumber}</span>
                      </div>
                      <p className="text-xs text-[#637984] mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{job.senderAddress}</span>
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${
                      job.status === 'collected'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : job.status === 'handed_over'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#DDEEF2] text-xs text-[#637984]">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-[#00B4D8]" />
                      {job.senderPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Slot: {job.scheduledSlot || '10:00 - 12:00'}
                    </span>
                    <span className="font-semibold text-[#253B45]">
                      Declared: {job.declaredWeightKg} kg
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Active Field Action Card */}
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDEEF2]">
            <h3 className="text-sm font-bold text-[#253B45]">Field Inspection &amp; Collection</h3>
            <span className="text-[10px] font-bold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-md">
              Step-by-Step
            </span>
          </div>

          {activeJob ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F7FCFD] border border-[#DDEEF2] rounded-xl space-y-1.5">
                <div className="font-bold text-[#253B45]">{activeJob.senderName}</div>
                <div className="text-[11px] text-[#637984]">{activeJob.senderAddress}</div>
                <div className="font-mono text-[11px] text-[#00B4D8]">{activeJob.senderPhone}</div>
              </div>

              {/* Digital Scale Entry */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#253B45] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#00B4D8]" />
                    <span>Calibrated Scale Weight (kg)</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Scale Linked</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={scaleWeight}
                  onChange={(e) => setScaleWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-base font-bold font-mono border border-[#DDEEF2] rounded-xl bg-[#F7FCFD] focus:border-[#00B4D8] focus:outline-hidden"
                />
              </div>

              {/* Inspection Notes */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#253B45]">Packaging &amp; Dangerous Goods Note</label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="e.g. Verified reinforced box, provisions sealed, no prohibited chemicals or lithium batteries."
                  className="w-full px-3 py-2 text-xs border border-[#DDEEF2] rounded-xl bg-[#F7FCFD] focus:border-[#00B4D8] focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {activeJob.status !== 'collected' && activeJob.status !== 'handed_over' ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmPickup(activeJob.id)}
                    className="w-full py-2.5 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Pickup &amp; Affix Barcode</span>
                  </button>
                ) : activeJob.status === 'collected' ? (
                  <button
                    type="button"
                    onClick={() => handleHandoverToOps(activeJob.id)}
                    className="w-full py-2.5 bg-[#008EA8] hover:bg-[#00B4D8] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Hand Over to Airport Hub</span>
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center font-bold text-emerald-700">
                    Handed over to Operations Sorting Hub
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[#637984] text-xs">
              Select a pickup job to record scale weight and inspection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
