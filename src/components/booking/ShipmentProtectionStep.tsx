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
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-[#CAF0F8] text-[#00B4D8] border border-[#90E0EF] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="sv-h3">
              Shipment Protection
            </h3>
            <p className="sv-label">
              Choose the level of protection that suits the value of your shipment.
            </p>
          </div>
        </div>
      </div>

      {/* Excluded items warning if detected */}
      {excludedItems.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-[12px] text-[13px] text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Policy Exclusion Notice for Declared Items</span>
          </div>
          <p className="text-[12px] text-amber-800 leading-relaxed">
            The following declared item{excludedItems.length > 1 ? 's are' : ' is'} excluded from optional comprehensive coverage under aviation underwriting guidelines:
          </p>
          <ul className="list-disc list-inside text-[12px] font-medium text-amber-900">
            {excludedItems.map((item) => (
              <li key={item.id}>
                {item.description} ({formatNaira(item.declaredValue)}) — {isItemExcludedFromProtection(item.description, item.category).reason}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-amber-800 tabular-nums">
            Premium coverage applies only to your eligible declared items ({formatNaira(premiumCalc.eligibleDeclaredValueNgn)}).
          </p>
        </div>
      )}

      {/* Two Large Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* OPTION A: INCLUDED BASIC PROTECTION */}
        <div
          onClick={() => onSelectPlan('basic')}
          className={`relative rounded-[12px] p-5 sm:p-6 cursor-pointer transition-all border-2 flex flex-col justify-between ${
            selectedPlan === 'basic'
              ? 'bg-[#CAF0F8]/70 border-[#00B4D8] shadow-md ring-2 ring-[#90E0EF]/50'
              : 'bg-white border-[#E2E8F0] hover:border-[#00B4D8]/60 hover:bg-[#F8FAFC]'
          }`}
        >
          {/* Active selection badge */}
          {selectedPlan === 'basic' && (
            <div className="absolute top-4 right-4 bg-[#00B4D8] text-white p-1 rounded-full shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[10px] bg-white border border-[#E2E8F0] text-[#247347] flex items-center justify-center shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Standard Inclusion
                </span>
                <h4 className="sv-h3 mt-1">
                  Included Basic Protection
                </h4>
              </div>
            </div>

            <div className="py-2.5 border-y border-[#E2E8F0]">
              <div className="flex items-baseline gap-2">
                <span className="sv-price-lg tabular-nums">₦0</span>
                <span className="sv-label">Included at no additional charge</span>
              </div>
              <p className="text-[12px] text-[#247347] font-semibold mt-0.5">
                Included where applicable carrier service terms provide it
              </p>
            </div>

            {/* Coverage Specifications */}
            <div className="space-y-2.5 text-[13px] text-[#1F2937]">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                <div>
                  <strong className="text-[#111827]">Contractual Liability Limit:</strong>
                  <p className="sv-label tabular-nums">
                    Warsaw / Montreal Convention standard carriage liability up to ₦{config.basicLiabilityLimitNgn.toLocaleString()} per approved claim.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                <div>
                  <strong className="text-[#111827]">Eligible Loss Protection:</strong>
                  <p className="sv-label">
                    Covers verified carrier non-delivery or catastrophic flight linehaul loss.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                <div>
                  <strong className="text-[#111827]">Eligible Damage Protection:</strong>
                  <p className="sv-label">
                    Limited to visible external carton damage caused by carrier handling negligence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4B5563] mt-2 shrink-0" />
                <div>
                  <strong className="text-[#111827]">Important Exclusions:</strong>
                  <p className="sv-label">
                    Excludes undeclared items, improper internal cushioning, indirect or consequential market losses.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[12px] text-[#4B5563]">
            <span>Standard shipment liability applies.</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPolicy('shipping');
              }}
              className="text-[#0F172A] font-semibold underline underline-offset-4 hover:text-[#00B4D8] cursor-pointer"
            >
              See our terms
            </button>
          </div>
        </div>

        {/* OPTION B: FULL SHIPPING PROTECTION */}
        <div
          onClick={() => onSelectPlan('premium')}
          className={`relative rounded-[12px] p-5 sm:p-6 cursor-pointer transition-all border-2 flex flex-col justify-between ${
            selectedPlan === 'premium'
              ? 'bg-[#CAF0F8]/70 border-[#00B4D8] shadow-md ring-2 ring-[#90E0EF]/50'
              : 'bg-white border-[#E2E8F0] hover:border-[#00B4D8]/60 hover:bg-[#F8FAFC]'
          }`}
        >
          {/* Active selection badge */}
          {selectedPlan === 'premium' && (
            <div className="absolute top-4 right-4 bg-[#00B4D8] text-white p-1 rounded-full shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[10px] bg-white border border-[#E2E8F0] text-[#00B4D8] flex items-center justify-center shadow-2xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Comprehensive Coverage
                </span>
                <h4 className="sv-h3 mt-1">
                  Protect My Package with Shipping Insurance
                </h4>
              </div>
            </div>

            <div className="py-2.5 border-y border-[#E2E8F0]">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <span className="sv-price-lg text-[#0F172A] tabular-nums">
                    {formatNaira(premiumCalc.calculatedPremiumNgn)}
                  </span>
                  <span className="sv-label ml-2 tabular-nums">
                    ({config.premiumRatePercentage}% of declared value)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#0F172A] bg-white border border-[#90E0EF] px-2.5 py-0.5 rounded-full shrink-0">
                  Optional Protection
                </span>
              </div>
              <p className="text-[12px] text-[#0F172A] font-semibold mt-1 tabular-nums">
                Your package will be insured up to {formatNaira(premiumCalc.coverageLimitNgn)}
              </p>
            </div>

            {/* Coverage Specifications */}
            <div className="space-y-2.5 text-[13px] text-[#1F2937]">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                <div>
                  <strong className="text-[#111827]">Full Declared Value Protection:</strong>
                  <p className="sv-label tabular-nums">
                    Covers verified loss or damage up to {formatNaira(premiumCalc.coverageLimitNgn)} with proof of value.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                <div>
                  <strong className="text-[#111827]">Applicable Deductible:</strong>
                  <p className="sv-label">
                    {premiumCalc.deductibleText}. Applies only upon claim payout.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 shrink-0" />
                <div>
                  <strong className="text-[#111827]">Quick Claims Window:</strong>
                  <p className="sv-label tabular-nums">
                    Lodge claims within {config.claimsDeadlineDays} calendar days with photos and delivery receipt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[12px] text-[#4B5563]">
            <span>Full value protection.</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPolicy('protection');
              }}
              className="text-[#0F172A] font-semibold underline underline-offset-4 hover:text-[#00B4D8] cursor-pointer"
            >
              Coverage details
            </button>
          </div>
        </div>
      </div>

      {/* Item-by-item calculation transparent breakdown */}
      <div className="bg-[#F8FAFC] rounded-[12px] p-4 border border-[#E2E8F0] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[13px] text-[#111827] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#00B4D8]" />
            <span>Protection Calculation Transparency</span>
          </span>
          <span className="font-bold text-[14px] text-[#111827] tabular-nums">
            {selectedPlan === 'basic' ? '₦0 (Included)' : formatNaira(premiumCalc.calculatedPremiumNgn)}
          </span>
        </div>
        <p className="sv-label leading-relaxed">
          {selectedPlan === 'basic' ? basicCalc.breakdownSummary : premiumCalc.breakdownSummary}
        </p>
      </div>

      {/* Mandatory Terms Acceptance Checkpoint */}
      <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onToggleTermsAccepted(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-[#CBD5E1] text-[#00B4D8] focus:ring-[#00B4D8]"
          />
          <div className="text-[13px] text-[#111827] leading-relaxed">
            <span>
              I accept the{' '}
              <button
                type="button"
                onClick={() => onOpenPolicy('protection')}
                className="text-[#0F172A] font-semibold underline underline-offset-4 hover:text-[#00B4D8] cursor-pointer"
              >
                Shipment Protection Terms &amp; Conditions
              </button>
              , and I acknowledge the declared item limits, exclusions, applicable deductibles, and {config.claimsDeadlineDays}-day claim submission procedure.
            </span>
            <span className="block sv-label mt-1">
              Swiftvero coordinates carriage and insurance coverage in partnership with licensed underwriting institutions. In demo mode, selections and policies operate as realistic interactive simulations.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};
