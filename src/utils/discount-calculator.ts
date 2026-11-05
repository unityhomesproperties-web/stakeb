import { DiscountCode } from '../types';

export const DEMO_DISCOUNT_CODES: DiscountCode[] = [
  {
    code: 'SWIFT10',
    type: 'percentage',
    value: 10,
    maxDiscountNgn: 15000,
    description: '10% promotional discount on international shipment order',
    isActive: true,
    isDemo: true,
  },
  {
    code: 'SWIFT5K',
    type: 'fixed',
    value: 5000,
    minTransactionAmountNgn: 40000,
    description: '₦5,000 flat discount on orders ₦40,000 and above',
    isActive: true,
    isDemo: true,
  },
  {
    code: 'EXPIRED20',
    type: 'percentage',
    value: 20,
    description: 'Expired promotional campaign code',
    isActive: false,
    isDemo: true,
  },
];

export interface ValidationResult {
  valid: boolean;
  discount: DiscountCode | null;
  discountAmountNgn: number;
  error?: string;
}

/**
 * Validates a promo discount code against order total
 */
export function validateDiscountCode(
  rawCode: string,
  subtotalAmountNgn: number
): ValidationResult {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, discount: null, discountAmountNgn: 0, error: 'Please enter a promo code.' };
  }

  const found = DEMO_DISCOUNT_CODES.find((d) => d.code === code);
  if (!found) {
    return {
      valid: false,
      discount: null,
      discountAmountNgn: 0,
      error: `Promo code "${code}" is invalid or does not exist.`,
    };
  }

  if (!found.isActive) {
    return {
      valid: false,
      discount: found,
      discountAmountNgn: 0,
      error: `Promo code "${code}" has expired and can no longer be applied.`,
    };
  }

  if (found.minTransactionAmountNgn && subtotalAmountNgn < found.minTransactionAmountNgn) {
    return {
      valid: false,
      discount: found,
      discountAmountNgn: 0,
      error: `Promo code "${code}" requires a minimum shipment total of ₦${found.minTransactionAmountNgn.toLocaleString()}.`,
    };
  }

  let discountAmount = 0;
  if (found.type === 'percentage') {
    discountAmount = Math.round((subtotalAmountNgn * found.value) / 100);
    if (found.maxDiscountNgn && discountAmount > found.maxDiscountNgn) {
      discountAmount = found.maxDiscountNgn;
    }
  } else if (found.type === 'fixed') {
    discountAmount = Math.min(found.value, subtotalAmountNgn);
  }

  return {
    valid: true,
    discount: found,
    discountAmountNgn: discountAmount,
  };
}

export interface CheckoutCalculationInput {
  originalQuotationNgn: number;
  discountCode?: string;
  creditsToApplyNgn: number;
  availableCreditBalanceNgn: number;
}

export interface CheckoutCalculationResult {
  originalQuotationNgn: number;
  discountApplied: DiscountCode | null;
  discountAmountNgn: number;
  subtotalAfterDiscountNgn: number;
  creditsAppliedNgn: number;
  remainingCreditBalanceNgn: number;
  finalPayableNgn: number;
}

/**
 * Strict 5-step mathematical checkout calculation:
 * 1. Original Quotation
 * 2. Less: Promo Discount Code
 * 3. Subtotal after Discount
 * 4. Less: Available Shipping Credits Applied
 * 5. Final Amount Payable
 */
export function calculateCheckoutPricing(
  input: CheckoutCalculationInput
): CheckoutCalculationResult {
  const original = Math.max(0, Math.round(input.originalQuotationNgn));

  let discountApplied: DiscountCode | null = null;
  let discountAmountNgn = 0;

  if (input.discountCode) {
    const val = validateDiscountCode(input.discountCode, original);
    if (val.valid && val.discount) {
      discountApplied = val.discount;
      discountAmountNgn = val.discountAmountNgn;
    }
  }

  const subtotalAfterDiscountNgn = Math.max(0, original - discountAmountNgn);

  // Available shipping credits can only be applied up to customer's available unlocked balance AND remaining subtotal
  const maxApplicableCredits = Math.min(
    Math.max(0, input.availableCreditBalanceNgn),
    subtotalAfterDiscountNgn
  );

  const desiredCredits = Math.max(0, Math.round(input.creditsToApplyNgn));
  const creditsAppliedNgn = Math.min(desiredCredits, maxApplicableCredits);

  const remainingCreditBalanceNgn = Math.max(
    0,
    input.availableCreditBalanceNgn - creditsAppliedNgn
  );

  const finalPayableNgn = Math.max(0, subtotalAfterDiscountNgn - creditsAppliedNgn);

  return {
    originalQuotationNgn: original,
    discountApplied,
    discountAmountNgn,
    subtotalAfterDiscountNgn,
    creditsAppliedNgn,
    remainingCreditBalanceNgn,
    finalPayableNgn,
  };
}
