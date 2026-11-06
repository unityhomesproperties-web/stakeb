import React, { useState } from 'react';
import {
  Package,
  UserPlus,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Building2,
  DollarSign,
  CreditCard,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  UserCheck,
  ArrowRight,
  Eye,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { ShipmentRecord, CustomerProfile } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';
import { WalkInCustomerModal } from './WalkInCustomerModal';
import { WalkInShipmentWizardModal } from './WalkInShipmentWizardModal';
import { WalkInWaybillModal } from './WalkInWaybillModal';
import { HandoverManifestModal } from './HandoverManifestModal';
import { Logo } from '../common/Logo';

interface BranchDeskPortalProps {
  onOpenKycModal: () => void;
}

export const BranchDeskPortal: React.FC<BranchDeskPortalProps> = ({ onOpenKycModal }) => {
  const {
    currentStaffUser,
    activeBranchId,
    setActiveBranchId,
    branches,
    shipments,
    customers,
    setRole,
  } = useDemo();

  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Modals state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [shipmentWizardOpen, setShipmentWizardOpen] = useState(false);
  const [waybillModalOpen, setWaybillModalOpen] = useState(false);
  const [manifestModalOpen, setManifestModalOpen] = useState(false);
  const [selectedShipmentForWaybill, setSelectedShipmentForWaybill] = useState<ShipmentRecord | null>(null);
  const [preselectedCustomer, setPreselectedCustomer] = useState<CustomerProfile | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'paid' | 'pending' | 'in_transit' | 'awaiting_inspection' | 'ready_handover'
  >('all');

  // Branch shipments
  const branchShipments = shipments.filter(
    (s) => s.branchId === currentBranch.id || !s.branchId
  );

  const filteredShipments = branchShipments.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.trackingNumber.toLowerCase().includes(q) ||
      s.senderName.toLowerCase().includes(q) ||
      s.senderPhone.includes(q) ||
      s.recipientName.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'paid') return s.paymentStatus === 'paid';
    if (statusFilter === 'pending') return s.paymentStatus === 'unpaid';
    if (statusFilter === 'awaiting_inspection') return s.status === 'booked' || s.status === 'draft';
    if (statusFilter === 'ready_handover') return s.paymentStatus === 'paid' && s.status === 'booked';
    if (statusFilter === 'in_transit') return s.status === 'pickup_completed' || s.status === 'in_transit';
    return true;
  });

  // Operational metrics
  const countCreatedToday = branchShipments.length;
  const countCustomersServed = Object.values(customers).length;
  const countPackagesReceived = branchShipments.reduce((acc, s) => acc + (s.items?.length || 1), 0);
  const countAwaitingInspection = branchShipments.filter((s) => s.status === 'booked' || s.status === 'draft').length;
  const countAwaitingPayment = branchShipments.filter((s) => s.paymentStatus === 'unpaid').length;
  const countPaidShipments = branchShipments.filter((s) => s.paymentStatus === 'paid').length;
  const countReadyForHandover = branchShipments.filter((s) => s.paymentStatus === 'paid' && s.status === 'booked').length;
  const countHandedToOps = branchShipments.filter((s) => s.status === 'pickup_completed' || s.status === 'in_transit').length;

  const handleOpenWaybillFor = (shipment: ShipmentRecord) => {
    setSelectedShipmentForWaybill(shipment);
    setWaybillModalOpen(true);
  };

  const handleCustomerSelectedFromModal = (customer: CustomerProfile) => {
    setPreselectedCustomer(customer);
    setShipmentWizardOpen(true);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* SECTION 3A: Compact Staff Identity & Counter Selector */}
      <div className="bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Logo & Branch Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-lg shadow-2xs border border-[#90E0EF]">
            <Building2 className="w-5 h-5 text-[#00B4D8]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-black text-[#253B45]">Swiftvero Express</span>
              <span className="text-slate-300">|</span>
              <span className="text-sm sm:text-base font-bold text-[#00B4D8]">{currentBranch.name}</span>
              <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF] px-2 py-0.5 rounded-md">
                {currentBranch.code}
              </span>
            </div>
            <p className="text-xs text-[#637984] mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span className="truncate max-w-xs sm:max-w-md">{currentBranch.address} · Tel: {currentBranch.phone}</span>
            </p>
          </div>
        </div>

        {/* Right: Staff Identity & Branch Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#DDEEF2]">
          <div className="text-left md:text-right">
            <div className="text-xs font-bold text-[#253B45] flex items-center gap-1.5 md:justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>{currentStaffUser?.name || 'Chioma Eze'}</span>
            </div>
            <div className="text-[11px] text-[#637984]">
              Front Desk Admin · ID: <span className="font-mono font-bold text-[#00B4D8]">{currentStaffUser?.staffId || 'SWV-STAFF-002'}</span>
            </div>
          </div>

          {/* Branch Switcher Dropdown */}
          <div className="border-l border-[#DDEEF2] pl-3 flex items-center gap-2">
            <div>
              <label className="block text-[9px] text-[#637984] font-semibold mb-0.5">Switch Hub:</label>
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

            <button
              onClick={() => setRole('visitor')}
              title="Sign out to Public Site"
              className="p-1.5 text-[#637984] hover:text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3B: Priority Operational Action Bar */}
      <div className="bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#253B45]">Desk Priority Actions</h3>
            <p className="text-xs text-[#637984]">Fast-track operations for physical walk-in consignors</p>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#00B4D8] bg-[#CAF0F8] px-2 py-0.5 rounded-md">
            Counter Ready
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Action 1: Create Shipment (Primary prominent) */}
          <button
            type="button"
            onClick={() => {
              setPreselectedCustomer(null);
              setShipmentWizardOpen(true);
            }}
            className="p-3 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-xl flex flex-col items-center justify-center text-center gap-1.5 shadow-sm transition-all hover:scale-102 col-span-2 sm:col-span-1"
          >
            <Plus className="w-5 h-5 text-white" />
            <span className="text-xs font-bold leading-tight">Create Shipment</span>
          </button>

          {/* Action 2: Register Walk-in Customer */}
          <button
            type="button"
            onClick={() => setCustomerModalOpen(true)}
            className="p-3 bg-white hover:bg-[#F7FCFD] text-[#253B45] border border-[#DDEEF2] hover:border-[#90E0EF] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-2xs"
          >
            <UserPlus className="w-5 h-5 text-[#00B4D8]" />
            <span className="text-xs font-bold leading-tight">Register Walk-in</span>
          </button>

          {/* Action 3: Find Existing Customer */}
          <button
            type="button"
            onClick={() => setCustomerModalOpen(true)}
            className="p-3 bg-white hover:bg-[#F7FCFD] text-[#253B45] border border-[#DDEEF2] hover:border-[#90E0EF] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-2xs"
          >
            <Search className="w-5 h-5 text-[#637984]" />
            <span className="text-xs font-bold leading-tight">Find Customer</span>
          </button>

          {/* Action 4: Pending Inspections */}
          <button
            type="button"
            onClick={() => setStatusFilter('awaiting_inspection')}
            className={`p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all border shadow-2xs ${
              statusFilter === 'awaiting_inspection'
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                : 'bg-white hover:bg-amber-50/50 text-[#253B45] border-[#DDEEF2]'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold leading-tight">Pending Inspect ({countAwaitingInspection})</span>
          </button>

          {/* Action 5: Awaiting Payments */}
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all border shadow-2xs ${
              statusFilter === 'pending'
                ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold'
                : 'bg-white hover:bg-orange-50/50 text-[#253B45] border-[#DDEEF2]'
            }`}
          >
            <CreditCard className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-bold leading-tight">Awaiting Pay ({countAwaitingPayment})</span>
          </button>

          {/* Action 6: Ready for Handover */}
          <button
            type="button"
            onClick={() => setStatusFilter('ready_handover')}
            className={`p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all border shadow-2xs ${
              statusFilter === 'ready_handover'
                ? 'bg-[#CAF0F8] border-[#00B4D8] text-[#008EA8] font-bold'
                : 'bg-white hover:bg-[#F7FCFD] text-[#253B45] border-[#DDEEF2]'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-[#00B4D8]" />
            <span className="text-xs font-bold leading-tight">Ready Handover ({countReadyForHandover})</span>
          </button>

          {/* Action 7: Dispatch Manifest */}
          <button
            type="button"
            onClick={() => setManifestModalOpen(true)}
            className="p-3 bg-white hover:bg-[#EDF7F9] text-[#253B45] border border-[#DDEEF2] hover:border-[#00B4D8] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-2xs"
          >
            <Truck className="w-5 h-5 text-[#00B4D8]" />
            <span className="text-xs font-bold leading-tight">Dispatch Manifest</span>
          </button>
        </div>
      </div>

      {/* SECTION 3C: Operational Summary (8 Clickable Filter Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#637984]">
            Today's Branch Intake &amp; Operational Metrics
          </h3>
          <span className="text-xs text-[#637984] font-mono">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Metric 1 */}
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-3 bg-white border rounded-xl text-left transition-all shadow-xs hover:border-[#00B4D8] ${
              statusFilter === 'all' ? 'border-[#00B4D8] ring-2 ring-[#CAF0F8]' : 'border-[#DDEEF2]'
            }`}
          >
            <span className="text-[10px] font-semibold text-[#637984] block">1. Created</span>
            <div className="text-xl font-black text-[#253B45] font-mono my-0.5">{countCreatedToday}</div>
            <div className="text-[9px] text-[#00B4D8] font-semibold truncate">Active counter</div>
          </button>

          {/* Metric 2 */}
          <button
            type="button"
            onClick={() => setCustomerModalOpen(true)}
            className="p-3 bg-white border border-[#DDEEF2] rounded-xl text-left transition-all shadow-xs hover:border-[#00B4D8]"
          >
            <span className="text-[10px] font-semibold text-[#637984] block">2. Customers</span>
            <div className="text-xl font-black text-[#253B45] font-mono my-0.5">{countCustomersServed}</div>
            <div className="text-[9px] text-[#008EA8] font-semibold truncate">Served today</div>
          </button>

          {/* Metric 3 */}
          <div className="p-3 bg-white border border-[#DDEEF2] rounded-xl text-left shadow-xs">
            <span className="text-[10px] font-semibold text-[#637984] block">3. Packages</span>
            <div className="text-xl font-black text-[#253B45] font-mono my-0.5">{countPackagesReceived}</div>
            <div className="text-[9px] text-[#637984] font-medium truncate">Cartons weighed</div>
          </div>

          {/* Metric 4 */}
          <button
            type="button"
            onClick={() => setStatusFilter('awaiting_inspection')}
            className={`p-3 bg-white border rounded-xl text-left transition-all shadow-xs hover:border-amber-400 ${
              statusFilter === 'awaiting_inspection' ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/30' : 'border-[#DDEEF2]'
            }`}
          >
            <span className="text-[10px] font-semibold text-amber-700 block">4. Inspection</span>
            <div className="text-xl font-black text-amber-700 font-mono my-0.5">{countAwaitingInspection}</div>
            <div className="text-[9px] text-amber-600 font-semibold truncate">Pending visual</div>
          </button>

          {/* Metric 5 */}
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`p-3 bg-white border rounded-xl text-left transition-all shadow-xs hover:border-orange-400 ${
              statusFilter === 'pending' ? 'border-orange-400 ring-2 ring-orange-100 bg-orange-50/30' : 'border-[#DDEEF2]'
            }`}
          >
            <span className="text-[10px] font-semibold text-orange-700 block">5. Awaiting Pay</span>
            <div className="text-xl font-black text-orange-700 font-mono my-0.5">{countAwaitingPayment}</div>
            <div className="text-[9px] text-orange-600 font-semibold truncate">POS/Cash</div>
          </button>

          {/* Metric 6 */}
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`p-3 bg-white border rounded-xl text-left transition-all shadow-xs hover:border-emerald-500 ${
              statusFilter === 'paid' ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/30' : 'border-[#DDEEF2]'
            }`}
          >
            <span className="text-[10px] font-semibold text-emerald-700 block">6. Paid</span>
            <div className="text-xl font-black text-emerald-700 font-mono my-0.5">{countPaidShipments}</div>
            <div className="text-[9px] text-emerald-600 font-semibold truncate">Cleared</div>
          </button>

          {/* Metric 7 */}
          <button
            type="button"
            onClick={() => setStatusFilter('ready_handover')}
            className={`p-3 bg-white border rounded-xl text-left transition-all shadow-xs hover:border-[#00B4D8] ${
              statusFilter === 'ready_handover' ? 'border-[#00B4D8] ring-2 ring-[#CAF0F8] bg-[#CAF0F8]/20' : 'border-[#DDEEF2]'
            }`}
          >
            <span className="text-[10px] font-semibold text-[#008EA8] block">7. Ready Handover</span>
            <div className="text-xl font-black text-[#008EA8] font-mono my-0.5">{countReadyForHandover}</div>
            <div className="text-[9px] text-[#008EA8] font-semibold truncate">To Van</div>
          </button>

          {/* Metric 8 */}
          <button
            type="button"
            onClick={() => setStatusFilter('in_transit')}
            className={`p-3 bg-white border rounded-xl text-left transition-all shadow-xs hover:border-purple-500 ${
              statusFilter === 'in_transit' ? 'border-purple-500 ring-2 ring-purple-100 bg-purple-50/30' : 'border-[#DDEEF2]'
            }`}
          >
            <span className="text-[10px] font-semibold text-purple-700 block">8. To Ops</span>
            <div className="text-xl font-black text-purple-700 font-mono my-0.5">{countHandedToOps}</div>
            <div className="text-[9px] text-purple-600 font-semibold truncate">En route hub</div>
          </button>
        </div>
      </div>

      {/* RECENT SHIPMENTS INTAKE TABLE & SEARCH */}
      <div className="bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#253B45]">Counter Consignments</h3>
              <span className="text-xs bg-[#EDF7F9] text-[#637984] px-2 py-0.5 rounded-full font-mono font-medium">
                {filteredShipments.length} total
              </span>
            </div>
            <p className="text-xs text-[#637984]">Manage walk-in parcels, collect counter payments, and print thermal waybills</p>
          </div>

          {/* Search Input & Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tracking, sender, phone..."
                className="pl-9 pr-3 py-1.5 text-xs border border-[#DDEEF2] rounded-lg focus:border-[#00B4D8] focus:outline-hidden bg-[#F7FCFD] text-[#253B45] w-full sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-[#DDEEF2] rounded-lg px-2.5 py-1.5 bg-[#F7FCFD] text-[#253B45] font-semibold focus:border-[#00B4D8] focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid Shipments</option>
              <option value="pending">Awaiting Payment</option>
              <option value="awaiting_inspection">Awaiting Inspection</option>
              <option value="ready_handover">Ready for Handover</option>
              <option value="in_transit">Handed Over to Ops</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DDEEF2] text-[11px] text-[#637984] uppercase tracking-wider font-bold bg-[#F7FCFD]">
                <th className="py-2.5 px-3">Tracking / Waybill</th>
                <th className="py-2.5 px-3">Consignor</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Weight</th>
                <th className="py-2.5 px-3">Speed</th>
                <th className="py-2.5 px-3">Protection</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Waybill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDEEF2]">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No shipments match the current search filter.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7FCFD]/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#253B45]">
                      <div className="flex items-center gap-1.5">
                        <span>{s.trackingNumber}</span>
                      </div>
                      <span className="text-[10px] text-[#637984] font-normal">
                        {s.createdAt?.slice(0, 10) || '2026-10-24'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#253B45]">{s.senderName}</div>
                      <div className="text-[10px] text-[#637984] font-mono">{s.senderPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#253B45]">{s.destinationCity}</div>
                      <div className="text-[10px] text-[#637984]">{s.destinationCountry}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {s.declaredWeightKg} kg
                    </td>
                    <td className="py-3 px-3">
                      {s.selectedTier === 'priority' ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                          Priority
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[#EDF7F9] text-[#637984] px-2 py-0.5 rounded-md font-medium">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {s.protectionPlan === 'premium' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3 text-amber-600" />
                          <span>Premium ({formatNaira(s.protectionFeeNgn || 0)})</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#637984] bg-slate-100 px-2 py-0.5 rounded-md">
                          Basic (₦0)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {s.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                          <AlertCircle className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenWaybillFor(s)}
                        className="px-2.5 py-1 bg-[#CAF0F8]/50 hover:bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3 text-[#00B4D8]" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View (< 768px) */}
        <div className="md:hidden space-y-3">
          {filteredShipments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No consignments found.
            </div>
          ) : (
            filteredShipments.map((s) => (
              <div
                key={s.id}
                className="p-3.5 border border-[#DDEEF2] rounded-xl bg-white shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-sm text-[#253B45] flex items-center gap-1.5">
                    <span>{s.trackingNumber}</span>
                    {s.selectedTier === 'priority' && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                        PRIORITY
                      </span>
                    )}
                  </div>
                  {s.paymentStatus === 'paid' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Paid
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                      Unpaid
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#253B45]">
                  <div>
                    <span className="text-[10px] text-[#637984] block">Consignor:</span>
                    <span className="font-semibold">{s.senderName}</span>
                    <span className="block text-[10px] text-[#637984] font-mono">{s.senderPhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#637984] block">Destination:</span>
                    <span className="font-medium">{s.destinationCity}, {s.destinationCountry}</span>
                    <span className="block text-[10px] text-[#637984] font-mono">{s.declaredWeightKg} kg</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#DDEEF2]">
                  <div className="text-[11px]">
                    <span className="text-[#637984]">Protection: </span>
                    <span className="font-semibold text-[#253B45]">
                      {s.protectionPlan === 'premium' ? `Premium (${formatNaira(s.protectionFeeNgn || 0)})` : 'Basic (₦0)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenWaybillFor(s)}
                    className="px-3 py-1 bg-[#CAF0F8] hover:bg-[#90E0EF] text-[#008EA8] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#00B4D8]" />
                    <span>Print Thermal Waybill</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Global Modals */}
      <WalkInCustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelectCustomer={handleCustomerSelectedFromModal}
        onOpenKycForCustomer={(cust) => {
          setCustomerModalOpen(false);
          onOpenKycModal();
        }}
      />

      <WalkInShipmentWizardModal
        isOpen={shipmentWizardOpen}
        onClose={() => setShipmentWizardOpen(false)}
        initialCustomer={preselectedCustomer}
        onOpenWaybill={(shipment) => {
          setSelectedShipmentForWaybill(shipment);
          setWaybillModalOpen(true);
        }}
        onOpenKycForCustomer={(cust) => {
          setShipmentWizardOpen(false);
          onOpenKycModal();
        }}
      />

      <WalkInWaybillModal
        isOpen={waybillModalOpen}
        onClose={() => setWaybillModalOpen(false)}
        shipment={selectedShipmentForWaybill}
        branchName={currentBranch.name}
        staffName={currentStaffUser?.name || 'Chioma Eze'}
      />

      <HandoverManifestModal
        isOpen={manifestModalOpen}
        onClose={() => setManifestModalOpen(false)}
        eligibleShipments={branchShipments.filter((s) => s.paymentStatus === 'paid')}
      />
    </div>
  );
};
