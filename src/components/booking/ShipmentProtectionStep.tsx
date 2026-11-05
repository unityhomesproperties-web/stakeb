import React from 'react';
import { ShieldCheck, ShieldAlert, Check, AlertCircle, FileText, Info } from 'lucide-react';
import { ParcelItem } from '../../types';
import {
  ProtectionConfig,
  DEFAULT_PROTECTION_CONFIG,
  calculateProtectionPremium,
  isItemExcludedFromProtection,
} from '../../utils/protection-calculator';
import { formatNaira } from '../../utils/shipping-calculator';
import { PolicyKey } from '../common/LegalModal';

interface ShipmentProtectionStepProps {
  selectedPlan: 'basic' | 'premium';
  onSelectPlan: (plan: 'basic' | 'premium') => void;
  declaredValueNgn: number;
  items: ParcelItem[];
  destinationCountry: string;
  termsAccepted: boolean;
  onToggleTermsAccepted: (accepted: boolean) => void;
  onOpenPolicy: (key: PolicyKey) => void;
  config?: ProtectionConfig;
}

export const ShipmentProtectionStep: React.FC<ShipmentProtectionStepProps> = ({
  selectedPlan,
  onSelectPlan,
  declaredValueNgn,
  items,
  destinationCountry,
  termsAccepted,
  onToggleTermsAccepted,
  onOpenPolicy,
  config = DEFAULT_PROTECTION_CONFIG,
}) => {
  // Run calculation for both plans to show transparent comparisons
  const basicCalc = calculateProtectionPremium({
    plan: 'basic',
    declaredValueNgn,
    items,
    config,
    destinationCountry,
  });

  const premiumCalc = calculateProtectionPremium({
    plan: 'premium',
    declaredValueNgn,
    items,
    config,
    destinationCountry,
  });

  // Check if any items have exclusions
  const excludedItems = items.filter((item) => isItemExcludedFromProtection(item.description, item.category).excluded);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#DCE8DF] pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#EAF6EE] text-[#2F7D53] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1D2922]">
              Shipment Protection
            </h3>
            <p className="text-xs text-[#66736B]">
              Choose the level of protection that suits the value of your shipment.
            </p>
          </div>
        </div>
      </div>

      {/* Excluded items warning if detected */}
      {excludedItems.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Policy Exclusion Notice for Declared Items</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            The following declared item{excludedItems.length > 1 ? 's are' : ' is'} excluded from optional comprehensive coverage under aviation underwriting guidelines:
          </p>
          <ul className="list-disc list-inside text-[11px] font-medium text-amber-900">
            {excludedItems.map((item) => (
              <li key={item.id}>
                {item.description} ({formatNaira(item.declaredValue)}) — {isItemExcludedFromProtection(item.description, item.category).reason}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-amber-800">
            Premium coverage applies only to your eligible declared items ({formatNaira(premiumCalc.eligibleDeclaredValueNgn)}).
          </p>
        </div>
      )}

      {/* Two Large Selection Cards (Inspired by the Reference Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* OPTION A: INCLUDED BASIC PROTECTION */}
        <div
          onClick={() => onSelectPlan('basic')}
          className={`relative rounded-2xl p-5 sm:p-6 cursor-pointer transition-all border-2 flex flex-col justify-between ${
            selectedPlan === 'basic'
              ? 'bg-[#EAF6EE] border-[#2F7D53] shadow-md ring-2 ring-[#2F7D53]/20'
              : 'bg-white border-[#DCE8DF] hover:border-[#2F7D53]/50 hover:bg-[#F5FAF6]'
          }`}
        >
          {/* Active selection badge */}
          {selectedPlan === 'basic' && (
            <div className="absolute top-4 right-4 bg-[#2F7D53] text-white p-1 rounded-full shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#DCE8DF] text-[#247347] flex items-center justify-center shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#247347] bg-[#EAF6EE] px-2 py-0.5 rounded-md border border-[#2F7D53]/30">
                  Standard Inclusion
                </span>
                <h4 className="text-base font-bold text-[#1D2922] mt-0.5">
                  Included Basic Protection
                </h4>
              </div>
            </div>

            <div className="py-2 border-y border-[#DCE8DF]/70">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-[#1D2922]">₦0</span>
                <span className="text-xs text-[#66736B]">Included at no additional charge</span>
              </div>
              <p className="text-[11px] text-[#247347] font-medium mt-0.5">
                Included where applicable carrier service terms provide it
              </p>
            </div>

            {/* Coverage Specifications */}
            <div className="space-y-2.5 text-xs text-[#1D2922]">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2F7D53] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#1D2922]">Contractual Liability Limit:</strong>
                  <p className="text-[#66736B] text-[11px]">
                    Warsaw / Montreal Convention standard carriage liability up to ₦{config.basicLiabilityLimitNgn.toLocaleString()} per approved claim.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2F7D53] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#1D2922]">Eligible Loss Protection:</strong>
                  <p className="text-[#66736B] text-[11px]">
                    Covers verified carrier non-delivery or catastrophic flight linehaul loss.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2F7D53] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#1D2922]">Eligible Damage Protection:</strong>
                  <p className="text-[#66736B] text-[11px]">
                    Limited to visible external carton damage caused by carrier handling negligence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#66736B] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#1D2922]">Important Exclusions:</strong>
                  <p className="text-[#66736B] text-[11px]">
                    Excludes undeclared items, improper internal cushioning, indirect or consequential market losses.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#DCE8DF] flex items-center justify-between text-[11px] text-[#66736B]">
            <span>Standard shipment liability applies.</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPolicy('shipping');
              }}
              className="text-[#2F7D53] font-semibold underline hover:text-[#174B35]"
            >
              See our terms
            </button>
          </div>
        </div>

        {/* OPTION B: PREMIUM SHIPMENT COVERAGE */}
        <div
          onClick={() => onSelectPlan('premium')}
          className={`relative rounded-2xl p-5 sm:p-6 cursor-pointer transition-all border-2 flex flex-col justify-between ${
            selectedPlan === 'premium'
              ? 'bg-[#FFF8F0] border-[#EA580C] shadow-md ring-2 ring-[#EA580C]/20'
              : 'bg-white border-[#FED7AA] hover:border-[#EA580C]/50 hover:bg-[#FFFBF5]'
          }`}
        >
          {/* Active selection badge */}
          {selectedPlan === 'premium' && (
            <div className="absolute top-4 right-4 bg-[#EA580C] text-white p-1 rounded-full shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#FED7AA] text-[#EA580C] flex items-center justify-center shadow-2xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C2410C] bg-[#FFEDD5] px-2 py-0.5 rounded-md border border-[#FDBA74]">
                  Full Value Protection
                </span>
                <h4 className="text-base font-bold text-[#1D2922] mt-0.5">
                  Premium Shipment Coverage
                </h4>
              </div>
            </div>

            <div className="py-2 border-y border-[#FED7AA]/60">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono text-[#C2410C]">
                    {formatNaira(premiumCalc.calculatedPremiumNgn)}
                  </span>
                  <span className="text-xs text-[#66736B] ml-2">
                    ({config.premiumRatePercentage}% of eligible value)
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#9A3412] bg-[#FFEDD5] px-2 py-0.5 rounded">
                  Demo Underwriting
                </span>
              </div>
              <p className="text-[11px] text-[#66736B] mt-1">
                Eligible Declared Value: <strong className="text-[#1D2922] font-mono">{formatNaira(premiumCalc.eligibleDeclaredValueNgn)}</strong>
                {premiumCalc.excludedDeclaredValueNgn > 0 && (
                  <span className="text-amber-700 ml-1">
                    ({formatNaira(premiumCalc.excludedDeclaredValueNgn)} excluded)
                  </span>
                )}
              </p>
            </div>

            {/* Coverage Specifications */}
            <div className="space-y-2.5 text-xs text-[#1D2922]">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#1D2922]">Maximum Protected Amount:</strong>
                  <p className="text-[#66736B] text-[11px]">
                    Covers up to <strong className="text-[#1D2922] font-mono">{formatNaira(premiumCalc.coverageLimitNgn)}</strong> based on declared invoices and proof of purchase.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#1D2922]">Applicable Deductible / Excess:</strong>
                  <p className="text-[#66736B] text-[11px]">
                    {premiumCalc.deductibleText}. Deductible applies only upon claim settlement.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#1D2922]">Claims Submission Window:</strong>
                  <p className="text-[#66736B] text-[11px]">
                    Must be lodged within {config.claimsDeadlineDays} calendar days of delivery or confirmed carrier non-delivery with photographic proof.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#66736B] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#1D2922]">Underwriting Alliance:</strong>
                  <p className="text-[#66736B] text-[11px]">
                    {config.providerName} · Ref {config.providerLicenseRef} (Simulated in Demo Mode).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#FED7AA] flex items-center justify-between text-[11px] text-[#66736B]">
            <span>Comprehensive loss &amp; damage.</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPolicy('protection');
              }}
              className="text-[#EA580C] font-semibold underline hover:text-[#9A3412]"
            >
              Full coverage terms
            </button>
          </div>
        </div>
      </div>

      {/* Item-by-item calculation transparent breakdown */}
      <div className="bg-[#F5FAF6] rounded-xl p-4 border border-[#DCE8DF] space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#1D2922] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#2F7D53]" />
            <span>Protection Calculation Transparency</span>
          </span>
          <span className="font-mono font-bold text-[#1D2922]">
            {selectedPlan === 'basic' ? '₦0 (Included)' : formatNaira(premiumCalc.calculatedPremiumNgn)}
          </span>
        </div>
        <p className="text-[#66736B] text-[11px] leading-relaxed">
          {selectedPlan === 'basic' ? basicCalc.breakdownSummary : premiumCalc.breakdownSummary}
        </p>
      </div>

      {/* Mandatory Terms Acceptance Checkpoint */}
      <div className="p-4 bg-white rounded-xl border border-[#DCE8DF] space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onToggleTermsAccepted(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-[#DCE8DF] text-[#2F7D53] focus:ring-[#2F7D53]"
          />
          <div className="text-xs text-[#1D2922] leading-relaxed">
            <span>
              I accept the{' '}
              <button
                type="button"
                onClick={() => onOpenPolicy('protection')}
                className="text-[#2F7D53] font-semibold underline hover:text-[#174B35]"
              >
                Shipment Protection Terms &amp; Conditions
              </button>
              , and I acknowledge the declared item limits, exclusions, applicable deductibles, and {config.claimsDeadlineDays}-day claim submission procedure.
            </span>
            <span className="block text-[11px] text-[#66736B] mt-0.5">
              Swiftvero coordinates carriage and insurance coverage in partnership with licensed underwriting institutions. In demo mode, selections and policies operate as realistic interactive simulations.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};
