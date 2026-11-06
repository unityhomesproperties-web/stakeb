import React, { useState } from 'react';
import { X, Search, UserPlus, CheckCircle2, AlertCircle, ShieldCheck, UserCheck, ExternalLink, Copy, Phone, Mail, MapPin } from 'lucide-react';
import { CustomerProfile, KycStatus } from '../../types';
import { useDemo } from '../../context/DemoContext';

interface WalkInCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: CustomerProfile) => void;
  onOpenKycForCustomer?: (customer: CustomerProfile) => void;
}

export const WalkInCustomerModal: React.FC<WalkInCustomerModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onOpenKycForCustomer,
}) => {
  const { customers, searchCustomers, registerWalkInCustomer } = useDemo();

  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerProfile[]>(Object.values(customers));

  // Form fields for new customer
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+234 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [formError, setFormError] = useState<string | null>(null);

  // Success result
  const [createdResult, setCreatedResult] = useState<{
    customer: CustomerProfile;
    inviteLink: string;
    message: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const results = searchCustomers(query);
    setSearchResults(results);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First name and last name are required.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      setFormError('Please enter a valid telephone number.');
      return;
    }

    const res = registerWalkInCustomer({
      firstName,
      lastName,
      phone,
      email: email.trim(),
      address: address.trim(),
      country,
    });

    if (res.isDuplicate) {
      setFormError(`${res.message} You can select this customer directly from search.`);
      return;
    }

    setCreatedResult({
      customer: res.customer,
      inviteLink: res.inviteLink,
      message: res.message,
    });
  };

  const getKycBadge = (status: KycStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>KYC Verified</span>
          </span>
        );
      case 'in_progress':
      case 'verification_in_progress':
      case 'submitted':
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            <span>KYC Pending</span>
          </span>
        );
      case 'manual_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            <span>Manual Review</span>
          </span>
        );
      case 'failed':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            <span>KYC Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            <span>Not Verified</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#253B45]/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DDEEF2] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDEEF2] bg-[#F7FCFD]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#253B45]">Walk-In Customer Intake</h3>
              <p className="text-xs text-[#637984]">Search existing consignor or register counter walk-in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Bar */}
        <div className="px-6 pt-4 pb-2 bg-[#F7FCFD]/50 border-b border-[#DDEEF2] flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('search');
              setCreatedResult(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
              mode === 'search'
                ? 'bg-white border-[#00B4D8] text-[#00B4D8] shadow-xs'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Existing Customer</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setCreatedResult(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
              mode === 'create'
                ? 'bg-white border-[#00B4D8] text-[#00B4D8] shadow-xs'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Walk-In</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {mode === 'search' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by name, phone (+234...), email, or customer ID..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-[#DDEEF2] rounded-xl focus:border-[#00B4D8] focus:outline-hidden bg-[#F7FCFD] text-[#253B45]"
                />
              </div>

              {/* Customer List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 space-y-2">
                    <p className="text-xs">No matching customer found for "{searchQuery}".</p>
                    <button
                      onClick={() => setMode('create')}
                      className="text-xs font-bold text-[#00B4D8] hover:underline"
                    >
                      + Create new walk-in customer profile
                    </button>
                  </div>
                ) : (
                  searchResults.map((cust) => (
                    <div
                      key={cust.id}
                      className="p-3 border border-[#DDEEF2] rounded-xl hover:border-[#00B4D8] hover:bg-[#CAF0F8]/20 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#253B45] group-hover:text-[#00B4D8]">
                            {cust.name}
                          </span>
                          {getKycBadge(cust.kycStatus)}
                          {cust.isWalkIn && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              Walk-in
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6A808C]">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" />
                            {cust.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {cust.email}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectCustomer(cust);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-[#00B4D8] hover:bg-[#009BB8] text-white text-xs font-bold rounded-lg shrink-0 transition-colors shadow-2xs"
                      >
                        Select
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {mode === 'create' && !createdResult && (
            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#253B45] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. David"
                    className="w-full px-3 py-2 text-xs border border-[#DDEEF2] rounded-lg focus:border-[#00B4D8] focus:outline-hidden bg-[#F7FCFD] text-[#253B45]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#253B45] mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Okafor"
                    className="w-full px-3 py-2 text-xs border border-[#DDEEF2] rounded-lg focus:border-[#00B4D8] focus:outline-hidden bg-[#F7FCFD] text-[#253B45]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#253B45] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full px-3 py-2 text-xs font-mono border border-[#DDEEF2] rounded-lg focus:border-[#00B4D8] focus:outline-hidden bg-[#F7FCFD] text-[#253B45]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#253B45] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@email.com (optional)"
                    className="w-full px-3 py-2 text-xs border border-[#DDEEF2] rounded-lg focus:border-[#00B4D8] focus:outline-hidden bg-[#F7FCFD] text-[#253B45]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#253B45] mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, state"
                  className="w-full px-3 py-2 text-xs border border-[#DDEEF2] rounded-lg focus:border-[#00B4D8] focus:outline-hidden bg-[#F7FCFD] text-[#253B45]"
                />
              </div>

              <div className="p-3 bg-[#CAF0F8]/50 border border-[#90E0EF] rounded-lg text-xs text-[#008EA8] space-y-1">
                <div className="font-bold">Fast Counter Registration Guarantee:</div>
                <p className="text-[11px] text-[#253B45]/80">
                  No passwords required at counter. An account reference code will be generated immediately,
                  and an online activation link will be issued for the customer to claim their web portal account later.
                </p>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDEEF2]">
                <button
                  type="button"
                  onClick={() => setMode('search')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00B4D8] hover:bg-[#009BB8] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Register Walk-In Customer
                </button>
              </div>
            </form>
          )}

          {/* Success After Registration */}
          {mode === 'create' && createdResult && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-[#EAF6EE] border border-[#2F7D53]/30 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#2F7D53] mx-auto" />
                <h4 className="font-bold text-sm text-[#1D2922]">Customer Successfully Registered</h4>
                <p className="text-xs text-[#2F7D53]">{createdResult.message}</p>
                <div className="text-xs font-mono font-bold bg-white p-2 rounded border border-[#2F7D53]/20 inline-block">
                  Reference: {createdResult.customer.id}
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Online Access Invitation Link:</span>
                <p className="text-[11px] text-slate-500">
                  Customer can use this link to set their password and manage tracking online without exposing credentials at the counter:
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={createdResult.inviteLink}
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdResult.inviteLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DCEFF3]">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCustomer(createdResult.customer);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-[#2F7D53] hover:bg-[#174B35] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Select &amp; Create Shipment for {createdResult.customer.name}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
