import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  Lock,
  FileText,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Scale,
  Settings,
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { StaffAccount, AuditLogEntry } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';

export const SuperAdminPortal: React.FC = () => {
  const {
    currentStaffUser,
    role,
    branches,
    staffMembers,
    shipments,
    auditLogs,
    payoutSettings,
    updatePayoutSettings,
    revokeStaffSession,
    reassignStaffBranch,
    approvalRequests,
    reviewApprovalRequest,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'staff' | 'audit' | 'governance'>('overview');
  const [staffSearch, setStaffSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // National aggregates
  const totalShipments = shipments.length;
  const totalPaidShipments = shipments.filter((s) => s.paymentStatus === 'paid');
  const nationalRevenue = totalPaidShipments.reduce((acc, s) => acc + (s.quote?.totalAmount || 0), 0);
  const activeStaffCount = staffMembers.filter((s) => s.status === 'active').length;

  const filteredStaff = staffMembers.filter((s) =>
    !staffSearch ||
    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.role.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.department.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter((a) =>
    !auditSearch ||
    a.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.targetType.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Super Admin Header */}
      <div className="bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-lg shadow-2xs border border-[#90E0EF]">
            <ShieldCheck className="w-5 h-5 text-[#00B4D8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#253B45]">Central Head Office Governance</span>
              <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF] px-2 py-0.5 rounded-md">
                Super Admin / Root Authority
              </span>
            </div>
            <p className="text-xs text-[#637984] mt-0.5">
              Officer: {currentStaffUser?.name || 'Sophie Balogun'} ({role.toUpperCase()}) · Enterprise Nationwide Oversight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#637984]">Audit Engine:</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Immutable Ledger Online</span>
          </span>
        </div>
      </div>

      {/* 4 Nationwide Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Nationwide Gross</span>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">{formatNaira(nationalRevenue)}</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Across all 4 physical hubs</p>
        </div>

        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Total Consignments</span>
          <div className="text-xl font-black text-[#253B45] font-mono mt-1">{totalShipments}</div>
          <p className="text-[10px] text-[#00B4D8] font-semibold mt-0.5">All international corridors</p>
        </div>

        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Active Physical Hubs</span>
          <div className="text-xl font-black text-[#253B45] font-mono mt-1">{branches.length}</div>
          <p className="text-[10px] text-[#637984] mt-0.5">Lagos, Abuja, Port Harcourt</p>
        </div>

        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Active Staff Accounts</span>
          <div className="text-xl font-black text-[#008EA8] font-mono mt-1">{activeStaffCount}</div>
          <p className="text-[10px] text-[#637984] mt-0.5">Roles strictly RBAC bounded</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#DDEEF2] text-xs font-bold gap-4 overflow-x-auto">
        {[
          { id: 'overview', label: 'Hub Performance' },
          { id: 'staff', label: 'Staff Management' },
          { id: 'audit', label: 'Immutable Audit Trail' },
          { id: 'governance', label: 'Governance & Dual-Control' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === t.id
                ? 'border-[#00B4D8] text-[#00B4D8]'
                : 'border-transparent text-[#637984] hover:text-[#253B45]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Hub Performance */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((b) => {
            const bShipments = shipments.filter((s) => s.branchId === b.id || (!s.branchId && b.id === 'branch_ikeja'));
            const bRevenue = bShipments
              .filter((s) => s.paymentStatus === 'paid')
              .reduce((acc, s) => acc + (s.quote?.totalAmount || 0), 0);

            return (
              <div key={b.id} className="p-5 bg-white border border-[#DDEEF2] rounded-2xl shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#253B45]">{b.name}</h4>
                      <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF] px-2 py-0.5 rounded">
                        {b.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#637984] mt-0.5">{b.address}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#DDEEF2] text-xs">
                  <div>
                    <span className="text-[10px] text-[#637984] block">Manager</span>
                    <span className="font-semibold text-[#253B45]">{b.managerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#637984] block">Consignments</span>
                    <span className="font-mono font-bold text-[#253B45]">{bShipments.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#637984] block">Revenue</span>
                    <span className="font-mono font-bold text-emerald-700">{formatNaira(bRevenue)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Staff Management */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#253B45]">Nationwide Staff Roster &amp; Access Control</h3>
              <p className="text-xs text-[#637984]">Enforce role boundaries and revoke unauthorized sessions</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name or role..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-[#DDEEF2] rounded-lg bg-[#F7FCFD] text-[#253B45]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDEEF2] text-[11px] text-[#637984] uppercase tracking-wider font-bold bg-[#F7FCFD]">
                  <th className="py-2.5 px-3">Staff Officer</th>
                  <th className="py-2.5 px-3">ID / Department</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Assigned Branch</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDEEF2]">
                {filteredStaff.map((st) => (
                  <tr key={st.id} className="hover:bg-[#F7FCFD]/60">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#253B45]">{st.name}</div>
                      <div className="text-[10px] text-[#637984] font-mono">{st.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-[#00B4D8] font-bold">{st.staffId}</div>
                      <div className="text-[10px] text-[#637984]">{st.department}</div>
                    </td>
                    <td className="py-3 px-3 capitalize font-semibold text-[#253B45]">
                      {st.role.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-3 text-[#637984]">
                      {st.branchName || 'All Hubs'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        st.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {st.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!st.isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = revokeStaffSession(st.id);
                            alert(res.message);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                        >
                          Revoke Session
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Immutable Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#253B45]">Cryptographic &amp; Immutable Audit Trail</h3>
              <p className="text-xs text-[#637984]">Non-repudiable logs of financial mutations, staff elevations, and status updates</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit actions..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-[#DDEEF2] rounded-lg bg-[#F7FCFD] text-[#253B45]"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAuditLogs.map((log) => (
              <div key={log.id} className="p-3 border border-[#DDEEF2] rounded-xl bg-[#F7FCFD] text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#253B45]">{log.action}</span>
                    <span className="text-[10px] font-mono text-[#00B4D8] bg-[#CAF0F8] px-1.5 py-0.2 rounded">
                      {log.targetType}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#637984] font-mono">{log.timestamp.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <div className="text-[11px] text-[#637984]">{log.details}</div>
                <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-0.5">
                  <span>Actor: {log.actorName} ({log.actorRole})</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold">✓ Cryptographically Sealed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Governance */}
      {activeTab === 'governance' && (
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#253B45]">Executive Governance &amp; Payout Settings</h3>
            <p className="text-xs text-[#637984]">Dual-control financial limits and privileged action requirements</p>
          </div>

          <div className="p-4 border border-[#DDEEF2] rounded-xl bg-[#F7FCFD] space-y-3 text-xs text-[#253B45] max-w-xl">
            <div className="flex justify-between py-1 border-b border-[#DDEEF2]">
              <span className="text-[#637984]">Primary Payout Bank:</span>
              <span className="font-bold">{payoutSettings.bankName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#DDEEF2]">
              <span className="text-[#637984]">Account Number:</span>
              <span className="font-mono font-bold">{payoutSettings.accountNumberMasked}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#DDEEF2]">
              <span className="text-[#637984]">Refund Auto-Approval Threshold:</span>
              <span className="font-bold text-[#00B4D8]">{formatNaira(payoutSettings.refundThresholdNgn)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#637984]">Two-Person Control Enforced:</span>
              <span className="font-bold text-emerald-700">ENABLED (Anti-Collusion Rule)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
