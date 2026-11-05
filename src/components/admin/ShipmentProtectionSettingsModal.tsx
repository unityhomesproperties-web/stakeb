import React, { useState } from 'react';
import { X, ShieldCheck, Save, RotateCcw, AlertCircle, CheckCircle2, History, Sliders } from 'lucide-react';
import { ProtectionConfig, DEFAULT_PROTECTION_CONFIG } from '../../utils/protection-calculator';
import { formatNaira } from '../../utils/shipping-calculator';

interface ShipmentProtectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProtectionConfig;
  onSaveConfig: (updatedConfig: ProtectionConfig, reason: string) => void;
  auditHistory?: Array<{
    date: string;
    updatedBy: string;
    reason: string;
    rate: number;
    basicLimit: number;
  }>;
}

export const ShipmentProtectionSettingsModal: React.FC<ShipmentProtectionSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  auditHistory = [
    {
      date: '2026-10-28 10:00:00',
      updatedBy: 'Chief Underwriting Officer',
      reason: 'Standard baseline demo rate established at 1.5% with Leadway Assurance Alliance.',
      rate: 1.5,
      basicLimit: 50000,
    },
    {
      date: '2026-09-15 14:30:00',
      updatedBy: 'Operations Director',
      reason: 'Initial setup of Warsaw/Montreal standard carriage liability parameters.',
      rate: 2.0,
      basicLimit: 40000,
    },
  ],
}) => {
  const [formData, setFormData] = useState<ProtectionConfig>({ ...config });
  const [updateReason, setUpdateReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateReason.trim()) {
      setErrorMsg('Audit requirement: Please enter an operational justification reason before saving changes.');
      return;
    }

    const updated: ProtectionConfig = {
      ...formData,
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedBy: 'Admin User (Active Session)',
    };

    onSaveConfig(updated, updateReason.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetToDefault = () => {
    setFormData({ ...DEFAULT_PROTECTION_CONFIG });
    setUpdateReason('Reverted to system default underwriting settings.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#DCE8DF] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#EAF6EE] border-b border-[#DCE8DF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#2F7D53]/20 text-[#2F7D53] flex items-center justify-center shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D2922]">
                Shipment Protection &amp; Underwriting Settings
              </h3>
              <p className="text-xs text-[#66736B]">
                Configure liability limits, premium rates, deductibles, and underwriter rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#66736B] hover:text-[#1D2922] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Settings vs Audit Trail */}
        <div className="px-6 py-2.5 bg-[#F5FAF6] border-b border-[#DCE8DF] flex items-center justify-between text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                !showHistory ? 'bg-[#2F7D53] text-white' : 'text-[#66736B] hover:text-[#1D2922]'
              }`}
            >
              Active Underwriting Configuration
            </button>
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                showHistory ? 'bg-[#2F7D53] text-white' : 'text-[#66736B] hover:text-[#1D2922]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Change Audit Trail ({auditHistory.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-[#66736B] hover:text-[#2F7D53] text-[11px] font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-[#1D2922]">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-[#EAF6EE] border border-[#2F7D53] rounded-xl text-[#247347] flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2F7D53]" />
              <span>Protection Settings successfully updated and logged to audit trail!</span>
            </div>
          )}

          {!showHistory ? (
            <form id="protection-settings-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Basic Protection Limits */}
              <div className="space-y-3 p-4 bg-white rounded-xl border border-[#DCE8DF]">
                <h4 className="font-bold text-sm text-[#1D2922] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2F7D53]" />
                  <span>1. Included Basic Protection Parameters</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Basic Liability Limit (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.basicLiabilityLimitNgn}
                      onChange={(e) =>
                        setFormData({ ...formData, basicLiabilityLimitNgn: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                    />
                    <span className="text-[10px] text-[#66736B] mt-0.5 block">
                      Contractual liability cap for non-premium consignments
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Terms Version Reference
                    </label>
                    <input
                      type="text"
                      value={formData.termsVersion}
                      onChange={(e) => setFormData({ ...formData, termsVersion: e.target.value })}
                      className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                    Standard Liability Legal Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.basicLiabilityDescription}
                    onChange={(e) => setFormData({ ...formData, basicLiabilityDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg text-xs focus:outline-none focus:border-[#2F7D53]"
                  />
                </div>
              </div>

              {/* Section 2: Premium Coverage Rates & Thresholds */}
              <div className="space-y-3 p-4 bg-white rounded-xl border border-[#DCE8DF]">
                <h4 className="font-bold text-sm text-[#1D2922] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                  <span>2. Premium Coverage Rates &amp; Thresholds</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Premium Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="10.0"
                        value={formData.premiumRatePercentage}
                        onChange={(e) =>
                          setFormData({ ...formData, premiumRatePercentage: parseFloat(e.target.value) || 1.5 })
                        }
                        className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                      />
                      <span className="absolute right-3 top-2 font-bold text-[#66736B]">%</span>
                    </div>
                    <span className="text-[10px] text-[#66736B] mt-0.5 block">
                      Default demo rate: 1.5%
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Minimum Premium (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.minPremiumNgn}
                      onChange={(e) => setFormData({ ...formData, minPremiumNgn: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Maximum Premium (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.maxPremiumNgn}
                      onChange={(e) => setFormData({ ...formData, maxPremiumNgn: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Min Eligible Value (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.minEligibleDeclaredValueNgn}
                      onChange={(e) =>
                        setFormData({ ...formData, minEligibleDeclaredValueNgn: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Max Coverage Limit (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.maxEligibleDeclaredValueNgn}
                      onChange={(e) =>
                        setFormData({ ...formData, maxEligibleDeclaredValueNgn: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Deductible (% &amp; Min ₦)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.deductiblePercentage}
                        onChange={(e) =>
                          setFormData({ ...formData, deductiblePercentage: Number(e.target.value) || 0 })
                        }
                        className="w-16 px-2 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs text-center"
                        title="Deductible %"
                      />
                      <input
                        type="number"
                        value={formData.deductibleMinNgn}
                        onChange={(e) =>
                          setFormData({ ...formData, deductibleMinNgn: Number(e.target.value) || 0 })
                        }
                        className="flex-1 px-2 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs"
                        title="Deductible Min NGN"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Underwriter Partner & Operational Procedures */}
              <div className="space-y-3 p-4 bg-white rounded-xl border border-[#DCE8DF]">
                <h4 className="font-bold text-sm text-[#1D2922] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2F7D53]" />
                  <span>3. Insurance Provider Integration &amp; Claims SLA</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Underwriter / Provider Name
                    </label>
                    <input
                      type="text"
                      value={formData.providerName}
                      onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                      className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg text-xs focus:outline-none focus:border-[#2F7D53]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Provider Status
                    </label>
                    <select
                      value={formData.providerStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          providerStatus: e.target.value as ProtectionConfig['providerStatus'],
                        })
                      }
                      className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg text-xs bg-white"
                    >
                      <option value="demo_simulated">Demo Simulated (Active)</option>
                      <option value="sandbox_active">Sandbox API Connected</option>
                      <option value="live_connected">Production NAICOM Live</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                      Claim Filing Deadline (Days)
                    </label>
                    <input
                      type="number"
                      value={formData.claimsDeadlineDays}
                      onChange={(e) =>
                        setFormData({ ...formData, claimsDeadlineDays: Number(e.target.value) || 14 })
                      }
                      className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                    />
                  </div>
                </div>
              </div>

              {/* Mandatory Operational Audit Justification */}
              <div className="p-4 bg-[#F5FAF6] rounded-xl border border-[#DCE8DF] space-y-2">
                <label className="block text-xs font-bold text-[#1D2922]">
                  Audit Justification for Modification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={updateReason}
                  onChange={(e) => {
                    setUpdateReason(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="e.g. Updated premium rate per Q4 Leadway underwriting agreement review."
                  className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg text-xs bg-white focus:outline-none focus:border-[#2F7D53]"
                />
                <span className="text-[11px] text-[#66736B]">
                  Required by Swiftvero dual-control policy: all pricing and liability adjustments are permanently recorded.
                </span>
              </div>
            </form>
          ) : (
            /* Audit Trail View */
            <div className="space-y-4">
              <div className="border border-[#DCE8DF] rounded-xl overflow-hidden divide-y divide-[#DCE8DF]">
                {auditHistory.map((item, idx) => (
                  <div key={idx} className="p-4 hover:bg-[#F5FAF6] transition-colors space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#1D2922]">{item.updatedBy}</span>
                      <span className="font-mono text-[11px] text-[#66736B]">{item.date}</span>
                    </div>
                    <p className="text-xs text-[#66736B]">{item.reason}</p>
                    <div className="flex gap-4 text-[11px] pt-1 font-mono text-[#2F7D53]">
                      <span>Rate: {item.rate}%</span>
                      <span>Standard Liability: {formatNaira(item.basicLimit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-[#DCE8DF] flex items-center justify-between">
          <span className="text-[11px] text-[#66736B]">
            Effective: {config.lastUpdatedAt.slice(0, 10)} by {config.lastUpdatedBy}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#DCE8DF] rounded-xl text-xs font-semibold text-[#66736B] hover:bg-white"
            >
              Cancel
            </button>
            {!showHistory && (
              <button
                type="submit"
                form="protection-settings-form"
                className="px-5 py-2 bg-[#2F7D53] hover:bg-[#174B35] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save &amp; Log Changes</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
