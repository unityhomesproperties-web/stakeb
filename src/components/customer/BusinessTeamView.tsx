import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Users,
  Plus,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Lock,
} from 'lucide-react';
import { BusinessTeamMember } from '../../types';

export const BusinessTeamView: React.FC = () => {
  const { businessTeam, addBusinessTeamMember, updateBusinessTeamRole, deleteBusinessTeamMember, currentCustomer } = useDemo();

  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BusinessTeamMember['role']>('shipping_staff');

  const roleLabels: Record<BusinessTeamMember['role'], { label: string; desc: string }> = {
    owner: {
      label: 'Business Owner',
      desc: 'Full corporate authority, bank payouts, and user management.',
    },
    operations_manager: {
      label: 'Operations Manager',
      desc: 'Can book shipments, schedule bulk batch pickups, and approve quotes.',
    },
    shipping_staff: {
      label: 'Shipping Staff',
      desc: 'Can create drafts, declare package weights, and print labels.',
    },
    finance_viewer: {
      label: 'Finance Viewer',
      desc: 'Read-only access to receipts, invoices, and cashback ledger.',
    },
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addBusinessTeamMember({
      name: name.trim(),
      email: email.trim(),
      role,
      status: 'active',
    });

    setShowAddModal(false);
    setSuccessMessage(`Team member ${name} invited as ${roleLabels[role].label}.`);
    setTimeout(() => setSuccessMessage(null), 3500);

    setName('');
    setEmail('');
    setRole('shipping_staff');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCEFF3]">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00B4D8]" />
            <h2 className="text-base font-bold text-[#354B55]">
              Authorized Team &amp; Role Permissions
            </h2>
          </div>
          <p className="text-xs text-[#6A808C] mt-0.5">
            Grant colleagues access to create shipments, view invoices, or manage bulk customer batches.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-[#CAF0F8] border border-[#90E0EF] text-[#008EA8] text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00B4D8]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Permissions Breakdown Table */}
      <div className="border border-[#DCEFF3] rounded-xl overflow-hidden text-xs">
        <div className="bg-[#F5FBFD] p-3.5 border-b border-[#DCEFF3] font-semibold text-[#354B55] flex items-center justify-between">
          <span>Active Organization Members ({businessTeam.length})</span>
          <span className="text-[11px] text-[#6A808C]">Role-Based Access Control</span>
        </div>

        <div className="divide-y divide-[#DCEFF3]">
          {businessTeam.map((member) => (
            <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-[#F5FBFD]/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#354B55]">{member.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]">
                    {roleLabels[member.role].label}
                  </span>
                </div>
                <div className="text-[11px] text-[#6A808C]">{member.email} · Joined {member.joinedAt}</div>
                <div className="text-[10px] text-[#6A808C] pt-0.5">{roleLabels[member.role].desc}</div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={member.role}
                  onChange={(e) => updateBusinessTeamRole(member.id, e.target.value as any)}
                  className="text-xs px-2.5 py-1.5 bg-[#F5FBFD] border border-[#DCEFF3] rounded-md focus:outline-hidden focus:border-[#00B4D8] text-[#354B55]"
                >
                  <option value="owner">Business Owner</option>
                  <option value="operations_manager">Operations Manager</option>
                  <option value="shipping_staff">Shipping Staff</option>
                  <option value="finance_viewer">Finance Viewer</option>
                </select>

                {member.role !== 'owner' && (
                  <button
                    onClick={() => deleteBusinessTeamMember(member.id)}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Remove access"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Invite Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-[#DCEFF3] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
              <h3 className="text-sm font-bold text-[#354B55]">Invite Team Member</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-[#6A808C] hover:text-[#354B55]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#354B55] mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Segun Fashola"
                  className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#354B55] mb-1">Corporate Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="segun@company.ng"
                  className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#354B55] mb-1">Assigned Operational Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                >
                  <option value="operations_manager">Operations Manager (Full shipping &amp; quote approval)</option>
                  <option value="shipping_staff">Shipping Staff (Draft creation &amp; weight declaration)</option>
                  <option value="finance_viewer">Finance Viewer (Invoices, receipts, ledger view only)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#DCEFF3] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#DCEFF3] rounded-lg text-[#6A808C] hover:bg-[#F5FBFD] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  Dispatch Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
