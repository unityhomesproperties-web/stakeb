import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  X,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { formatNaira } from '../../utils/shipping-calculator';

/* -------------------------------------------------------------------------- */
/* 1. QuoteOptionCard & QuoteOptionDetailsModal (DHL Benchmark)               */
/* -------------------------------------------------------------------------- */
export interface QuoteOptionDetailSpec {
  id: string;
  badge: string;
  badgeTone?: 'cyan' | 'neutral' | 'warning';
  title: string;
  subtitle: string;
  estimatedCostNgn: number;
  deliveryWindow: string;
  selected?: boolean;
  disabled?: boolean;
  disabledNote?: string;
  ctaLabel: string;
  includedItems: string[];
  exclusions?: string[];
  disclaimer?: string;
}

interface QuoteOptionCardProps {
  option: QuoteOptionDetailSpec;
  onSelect: () => void;
  onViewDetails?: (option: QuoteOptionDetailSpec) => void;
}

export const QuoteOptionCard: React.FC<QuoteOptionCardProps> = ({
  option,
  onSelect,
  onViewDetails,
}) => {
  const badgeStyles =
    option.badgeTone === 'cyan'
      ? 'bg-[#CAF0F8] text-[#0F172A] border-[#90E0EF] dark:bg-sky-950 dark:text-[#90E0EF] dark:border-sky-800'
      : option.badgeTone === 'warning'
      ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      : 'bg-[#F1F5F9] text-[#1F2937] border-[#CBD5E1] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-[12px] p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all ${
        option.disabled
          ? 'opacity-65 border border-[#E2E8F0] dark:border-slate-700'
          : option.selected
          ? 'border-2 border-[#00B4D8] shadow-[0_4px_14px_rgba(0,180,216,0.12)]'
          : 'border border-[#E2E8F0] dark:border-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:border-[#90E0EF]'
      }`}
    >
      <div className="space-y-4">
        {/* Status Pill Badge */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium border ${badgeStyles}`}
          >
            {option.badge}
          </span>
          {option.selected && !option.disabled && (
            <span
              className="w-6 h-6 rounded-full bg-[#00B4D8] text-white flex items-center justify-center shrink-0"
              aria-label="Selected shipping option"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.75]" />
            </span>
          )}
        </div>

        {/* Service Title & Concise 1-Line Subtitle */}
        <div className="space-y-1">
          <h3 className="text-[17px] font-bold leading-[1.3] text-[#111827] dark:text-white">
            {option.title}
          </h3>
          <p className="text-[14px] font-normal leading-[1.5] text-[#4B5563] dark:text-slate-400">
            {option.subtitle}
          </p>
        </div>

        {/* Centered Soft Surface Tint / Estimated Cost Box */}
        <div
          className={`rounded-[10px] p-4 text-center border ${
            option.selected
              ? 'bg-[#CAF0F8] border-[#90E0EF] dark:bg-sky-950/60 dark:border-sky-800'
              : 'bg-[#F1F5F9] border-[#E2E8F0] dark:bg-slate-900/80 dark:border-slate-700'
          }`}
        >
          <span className="block text-[12px] font-medium text-[#4B5563] dark:text-slate-300">
            Estimated Total Cost
          </span>
          <div className="text-[24px] sm:text-[28px] font-extrabold tracking-[-0.02em] text-[#111827] dark:text-white tabular-nums mt-0.5">
            {option.disabled ? 'Unavailable' : `${formatNaira(option.estimatedCostNgn)}*`}
          </div>
          <span className="block text-[12px] font-medium text-[#4B5563] dark:text-slate-400 mt-1">
            Includes 7.5% VAT · Verified at intake scale
          </span>
        </div>

        {/* Delivery Date Block & View Details Trigger */}
        <div className="flex items-center justify-between gap-2 pt-1 text-[13px]">
          <div>
            <span className="text-[12px] font-medium text-[#4B5563] dark:text-slate-400 block">
              Estimated Transit Window
            </span>
            <span className="text-[14px] font-semibold text-[#111827] dark:text-white">
              {option.disabled ? option.disabledNote || 'Unsupported on this route' : option.deliveryWindow}
            </span>
          </div>
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(option)}
              className="text-[13px] font-semibold text-[#0F172A] dark:text-[#90E0EF] underline underline-offset-4 hover:text-[#00B4D8] transition-colors shrink-0 cursor-pointer"
            >
              View Details →
            </button>
          )}
        </div>
      </div>

      {/* Full-Width Pill-Shaped Primary CTA Button */}
      <button
        type="button"
        disabled={option.disabled}
        onClick={onSelect}
        className={`w-full min-h-[46px] px-5 py-2.5 rounded-full text-[15px] font-bold tracking-[0.01em] transition-all flex items-center justify-center gap-2 ${
          option.disabled
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            : option.selected
            ? 'bg-[#0096C7] text-white shadow-xs'
            : 'bg-[#00B4D8] hover:bg-[#0096C7] text-white shadow-xs cursor-pointer'
        }`}
      >
        <span>{option.selected ? `Selected · ${option.ctaLabel}` : option.ctaLabel}</span>
        {!option.disabled && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
};

interface QuoteOptionDetailsModalProps {
  option: QuoteOptionDetailSpec | null;
  onClose: () => void;
  onSelectOption?: () => void;
}

export const QuoteOptionDetailsModal: React.FC<QuoteOptionDetailsModalProps> = ({
  option,
  onClose,
  onSelectOption,
}) => {
  if (!option) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-detail-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-[12px] shadow-xl max-w-lg w-full overflow-hidden">
        <div className="bg-[#00B4D8] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[12px] font-medium text-white/90 block">Service Breakdown</span>
            <h3 id="quote-detail-modal-title" className="text-[17px] font-bold text-white">
              {option.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close service details"
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 text-[14px] text-[#1F2937] dark:text-slate-200">
          <div className="p-4 rounded-[10px] bg-[#CAF0F8] dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 flex items-center justify-between gap-3 text-[#0F172A] dark:text-white">
            <div>
              <span className="text-[12px] font-medium block text-[#0F172A]/80 dark:text-slate-300">
                Estimated Total
              </span>
              <span className="text-[22px] font-extrabold tabular-nums">
                {option.disabled ? 'Route Confirmation Needed' : `${formatNaira(option.estimatedCostNgn)}*`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-medium block text-[#0F172A]/80 dark:text-slate-300">
                Transit Target
              </span>
              <span className="text-[14px] font-bold">{option.deliveryWindow}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[15px] font-bold text-[#111827] dark:text-white">
              Included in this Quote
            </h4>
            <ul className="space-y-1.5 text-[14px]">
              {option.includedItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {option.exclusions && option.exclusions.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-[#E2E8F0] dark:border-slate-700">
              <h4 className="text-[14px] font-bold text-[#111827] dark:text-white">
                Conditions &amp; Exclusions
              </h4>
              <ul className="space-y-1 text-[13px] text-[#4B5563] dark:text-slate-400">
                {option.exclusions.map((ex, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-[#00B4D8] shrink-0 mt-0.5" />
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {option.disclaimer && (
            <p className="text-[12px] text-[#4B5563] dark:text-slate-400 leading-[1.4]">
              {option.disclaimer}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0] dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 rounded-full border border-[#CBD5E1] dark:border-slate-600 text-[14px] font-semibold text-[#1F2937] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Close
            </button>
            {onSelectOption && !option.disabled && (
              <button
                type="button"
                onClick={() => {
                  onSelectOption();
                  onClose();
                }}
                className="min-h-[44px] px-6 py-2 rounded-full bg-[#00B4D8] hover:bg-[#0096C7] text-white text-[15px] font-bold tracking-[0.01em]"
              >
                Select Service
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. Expandable Accordion Row ("Optional Services" — DHL Benchmark)          */
/* -------------------------------------------------------------------------- */
interface OptionalServiceAccordionProps {
  title: string;
  priceLabel: string;
  description: string;
  checked?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onToggle?: (next: boolean) => void;
  defaultOpen?: boolean;
}

export const OptionalServiceAccordion: React.FC<OptionalServiceAccordionProps> = ({
  title,
  priceLabel,
  description,
  checked = false,
  disabled = false,
  disabledReason,
  onToggle,
  defaultOpen = false,
}) => {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <div
      className={`rounded-[8px] border transition-colors ${
        checked
          ? 'border-[#00B4D8] bg-[#CAF0F8]/25 dark:bg-sky-950/30'
          : 'border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800'
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onToggle && (
            <input
              type="checkbox"
              disabled={disabled}
              checked={checked}
              onChange={(e) => onToggle(e.target.checked)}
              aria-label={`Select optional service: ${title}`}
              className="w-4 h-4 rounded border-[#CBD5E1] text-[#00B4D8] focus:ring-[#90E0EF] shrink-0 cursor-pointer disabled:opacity-50"
            />
          )}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-left min-w-0 flex-1 flex flex-wrap items-center justify-between gap-2 cursor-pointer"
          >
            <span className="text-[14px] sm:text-[15px] font-bold text-[#111827] dark:text-white">
              {title}
            </span>
            <span className="text-[13px] font-semibold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8]/70 dark:bg-sky-950 px-2.5 py-0.5 rounded-full tabular-nums shrink-0">
              {priceLabel}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-slate-700 hover:bg-[#CAF0F8] text-[#111827] dark:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3.5 pt-2 border-t border-[#E2E8F0] dark:border-slate-700 text-[13px] text-[#4B5563] dark:text-slate-300 leading-[1.5]">
          <p>{description}</p>
          {disabled && disabledReason && (
            <p className="mt-1.5 text-[12px] font-medium text-[#986B16] dark:text-amber-400">
              {disabledReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Two-Column Price Breakdown Rows with Dotted Leader Lines                */
/* -------------------------------------------------------------------------- */
export interface PriceLineItem {
  label: string;
  value: string;
  emphasize?: boolean;
  tone?: 'default' | 'discount' | 'total';
}

interface PriceBreakdownListProps {
  items: PriceLineItem[];
}

export const PriceBreakdownList: React.FC<PriceBreakdownListProps> = ({ items }) => {
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const isTotal = item.tone === 'total';
        return (
          <div
            key={`${item.label}-${idx}`}
            className={`flex items-baseline gap-2 ${
              isTotal
                ? 'pt-3 mt-1 border-t border-[#CBD5E1] dark:border-slate-700'
                : ''
            }`}
          >
            <span
              className={`text-[14px] shrink-0 ${
                isTotal
                  ? 'font-bold text-[#111827] dark:text-white'
                  : 'font-semibold text-[#1F2937] dark:text-slate-200'
              }`}
            >
              {item.label}
            </span>
            {!isTotal && (
              <span
                className="flex-1 border-b border-dotted border-[#CBD5E1] dark:border-slate-600 mx-1"
                aria-hidden="true"
              />
            )}
            {isTotal && <span className="flex-1" />}
            <span
              className={`tabular-nums shrink-0 ${
                isTotal
                  ? 'text-[22px] sm:text-[24px] font-extrabold tracking-[-0.02em] text-[#111827] dark:text-white'
                  : item.tone === 'discount'
                  ? 'text-[14px] font-semibold text-[#247347] dark:text-emerald-400'
                  : 'text-[14px] font-normal text-[#1F2937] dark:text-slate-200'
              }`}
            >
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Collapsible / Sticky Payment Summary Drawer (#CAF0F8 Tint)              */
/* -------------------------------------------------------------------------- */
interface StickyPaymentSummaryDrawerProps {
  title?: string;
  itemCountLabel: string;
  totalDisplay: string;
  lineItems: PriceLineItem[];
  promoInput?: string;
  onPromoInputChange?: (val: string) => void;
  onApplyPromo?: () => void;
  promoMessage?: string | null;
  onCancel?: () => void;
  cancelLabel?: string;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}

export const StickyPaymentSummaryDrawer: React.FC<StickyPaymentSummaryDrawerProps> = ({
  title = 'Payment Summary',
  itemCountLabel,
  totalDisplay,
  lineItems,
  promoInput,
  onPromoInputChange,
  onApplyPromo,
  promoMessage,
  onCancel,
  cancelLabel = 'Cancel',
  onNext,
  nextLabel,
  nextDisabled = false,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <div className="rounded-[12px] bg-[#CAF0F8] dark:bg-sky-950/70 border border-[#90E0EF] dark:border-sky-800 shadow-[0_2px_8px_rgba(15,23,42,0.06)] overflow-hidden text-[#0F172A] dark:text-white">
      <button
        type="button"
        onClick={() => setDrawerOpen((prev) => !prev)}
        aria-expanded={drawerOpen}
        className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#90E0EF]/25 transition-colors"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[16px] font-bold text-[#0F172A] dark:text-white">{title}</span>
          <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/70 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800">
            {itemCountLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[18px] sm:text-[22px] font-extrabold tracking-[-0.02em] tabular-nums text-[#0F172A] dark:text-white">
            {totalDisplay}
          </span>
          <span className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-[#90E0EF] dark:border-sky-700">
            {drawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {drawerOpen && (
        <div className="px-5 pb-5 pt-3 border-t border-[#90E0EF] dark:border-sky-800 bg-white/85 dark:bg-slate-900/85 space-y-4">
          <PriceBreakdownList items={lineItems} />

          {onApplyPromo && onPromoInputChange && (
            <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-700 space-y-1.5">
              <label className="block text-[12px] font-medium text-[#4B5563] dark:text-slate-300">
                Promo or Referral Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput || ''}
                  onChange={(e) => onPromoInputChange(e.target.value)}
                  placeholder="Enter code (e.g. SWIFT10)"
                  className="sv-input flex-1 min-h-[42px] px-3.5 py-2 text-[14px] uppercase rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
                />
                <button
                  type="button"
                  onClick={onApplyPromo}
                  className="min-h-[42px] px-5 py-2 rounded-full bg-[#0F172A] dark:bg-[#00B4D8] text-white text-[13px] font-bold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
              {promoMessage && (
                <p
                  className={`text-[12px] font-medium ${
                    /(invalid|expired|paused|inactive|required|limit|not started|error)/i.test(promoMessage)
                      ? 'text-[#B42318] dark:text-rose-400'
                      : 'text-[#247347] dark:text-emerald-400'
                  }`}
                >
                  {promoMessage}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="min-h-[44px] px-6 py-2.5 rounded-full border border-[#CBD5E1] dark:border-slate-600 bg-white dark:bg-slate-800 text-[#1F2937] dark:text-slate-200 text-[15px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              disabled={nextDisabled}
              onClick={onNext}
              className={`min-h-[44px] px-7 py-2.5 rounded-full text-[15px] font-bold tracking-[0.01em] transition-all flex items-center justify-center gap-2 ${
                nextDisabled
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-[#00B4D8] hover:bg-[#0096C7] text-white shadow-xs cursor-pointer'
              }`}
            >
              <span>{nextLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. Package / Box Selector Card with Top-Right Checkmark Badge              */
/* -------------------------------------------------------------------------- */
interface PackageSelectorCardProps {
  title: string;
  dimensionsLabel: string;
  maxWeightLabel: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
}

export const PackageSelectorCard: React.FC<PackageSelectorCardProps> = ({
  title,
  dimensionsLabel,
  maxWeightLabel,
  selected,
  onSelect,
  icon,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative text-left p-4 rounded-[12px] transition-all cursor-pointer ${
        selected
          ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/35 dark:bg-sky-950/40'
          : 'border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#90E0EF]'
      }`}
    >
      {selected && (
        <span
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#00B4D8] text-white flex items-center justify-center shadow-2xs"
          aria-hidden="true"
        >
          <Check className="w-3 h-3 stroke-[3]" />
        </span>
      )}
      <div className="space-y-1.5 pr-6">
        {icon && <div className="text-[#00B4D8]">{icon}</div>}
        <div className="text-[14px] font-bold text-[#111827] dark:text-white leading-[1.3]">
          {title}
        </div>
        <div className="text-[12px] font-medium text-[#4B5563] dark:text-slate-400 tabular-nums">
          {dimensionsLabel}
        </div>
        <div className="text-[12px] font-semibold text-[#0F172A] dark:text-[#90E0EF] tabular-nums">
          {maxWeightLabel}
        </div>
      </div>
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* 6. Unit-Suffix Input (kg/cm) + Red Asterisk + Green Check + Stepper        */
/* -------------------------------------------------------------------------- */
interface UnitSuffixInputProps {
  label: string;
  unit: string;
  value: string | number;
  onChange: (val: string) => void;
  required?: boolean;
  isValid?: boolean;
  min?: string | number;
  step?: string | number;
  placeholder?: string;
  helperText?: string;
}

export const UnitSuffixInput: React.FC<UnitSuffixInputProps> = ({
  label,
  unit,
  value,
  onChange,
  required = false,
  isValid = false,
  min = '0.1',
  step = '0.5',
  placeholder,
  helperText,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300 leading-[1.4]">
          {label}
          {required && <span className="text-[#B42318] ml-0.5">*</span>}
        </label>
        {isValid && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#247347] dark:text-emerald-400"
            aria-label="Valid input"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
        )}
      </div>

      <div className="flex items-stretch rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:border-[#00B4D8] focus-within:ring-2 focus-within:ring-[#90E0EF]/60 transition-all">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[44px] px-3.5 py-2 text-[14px] font-normal text-[#111827] dark:text-white bg-transparent focus:outline-none tabular-nums"
        />
        <span className="px-3 bg-[#F1F5F9] dark:bg-slate-800 border-l border-[#CBD5E1] dark:border-slate-700 text-[13px] font-semibold text-[#4B5563] dark:text-slate-300 flex items-center justify-center shrink-0">
          {unit}
        </span>
      </div>
      {helperText && (
        <p className="text-[12px] font-medium text-[#4B5563] dark:text-slate-400 leading-[1.4]">
          {helperText}
        </p>
      )}
    </div>
  );
};

interface QuantityStepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  required?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  label,
  value,
  min = 1,
  max = 50,
  onChange,
  required = false,
}) => {
  return (
    <div className="space-y-1">
      <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300 leading-[1.4]">
        {label}
        {required && <span className="text-[#B42318] ml-0.5">*</span>}
      </label>
      <div className="inline-flex items-center rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden min-h-[44px] w-full justify-between">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-11 min-h-[44px] flex items-center justify-center bg-[#F1F5F9] dark:bg-slate-800 hover:bg-[#CAF0F8] text-[#111827] dark:text-white disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="px-4 text-[15px] font-bold text-[#111827] dark:text-white tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-11 min-h-[44px] flex items-center justify-center bg-[#F1F5F9] dark:bg-slate-800 hover:bg-[#CAF0F8] text-[#111827] dark:text-white disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
