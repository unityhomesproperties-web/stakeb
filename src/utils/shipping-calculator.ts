import { QuoteBreakdown, ServiceTier, ShippingDirection } from '../types';

export interface RoutePricing {
  country: string;
  code: string;
  baseKgRateNgn: number;
  prioritySupported: boolean;
  priorityMultiplier: number;
  transitStandard: string;
  transitPriority: string;
}

export const SUPPORTED_DESTINATIONS: Record<string, RoutePricing> = {
  'United Kingdom': {
    country: 'United Kingdom',
    code: 'GB',
    baseKgRateNgn: 18500,
    prioritySupported: true,
    priorityMultiplier: 1.45,
    transitStandard: '4 - 6 business days',
    transitPriority: '2 - 3 business days',
  },
  'United States': {
    country: 'United States',
    code: 'US',
    baseKgRateNgn: 22000,
    prioritySupported: true,
    priorityMultiplier: 1.40,
    transitStandard: '5 - 7 business days',
    transitPriority: '3 - 4 business days',
  },
  'Canada': {
    country: 'Canada',
    code: 'CA',
    baseKgRateNgn: 23500,
    prioritySupported: true,
    priorityMultiplier: 1.42,
    transitStandard: '5 - 8 business days',
    transitPriority: '3 - 5 business days',
  },
  'Germany': {
    country: 'Germany',
    code: 'DE',
    baseKgRateNgn: 20500,
    prioritySupported: true,
    priorityMultiplier: 1.45,
    transitStandard: '4 - 7 business days',
    transitPriority: '2 - 4 business days',
  },
  'South Africa': {
    country: 'South Africa',
    code: 'ZA',
    baseKgRateNgn: 16500,
    prioritySupported: true,
    priorityMultiplier: 1.35,
    transitStandard: '4 - 6 business days',
    transitPriority: '2 - 3 business days',
  },
  'Ghana': {
    country: 'Ghana',
    code: 'GH',
    baseKgRateNgn: 12000,
    prioritySupported: true,
    priorityMultiplier: 1.30,
    transitStandard: '2 - 4 business days',
    transitPriority: '1 - 2 business days',
  },
  'United Arab Emirates': {
    country: 'United Arab Emirates',
    code: 'AE',
    baseKgRateNgn: 19500,
    prioritySupported: true,
    priorityMultiplier: 1.40,
    transitStandard: '4 - 6 business days',
    transitPriority: '2 - 4 business days',
  },
  'Greenland (Remote)': {
    country: 'Greenland (Remote)',
    code: 'GL',
    baseKgRateNgn: 38000,
    prioritySupported: false, // Priority unavailable demo route
    priorityMultiplier: 1.0,
    transitStandard: '12 - 18 business days',
    transitPriority: 'Not available for this destination',
  },
};

export const PROHIBITED_KEYWORDS = [
  'firearm',
  'gun',
  'ammunition',
  'bullet',
  'explosive',
  'firework',
  'narcotic',
  'cannabis',
  'weed',
  'cash',
  'currency notes',
  'counterfeit',
  'flammable liquid',
  'petrol',
  'aerosol',
  'poison',
  'toxic chemical',
  'live animal',
  'human remains',
];

/**
 * Calculates volumetric weight using standard industry divisor (5000 cm3/kg)
 */
export function calculateVolumetricWeight(lengthCm: number, widthCm: number, heightCm: number): number {
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0;
  const vol = (lengthCm * widthCm * heightCm) / 5000;
  return Math.round(vol * 10) / 10;
}

/**
 * Chargeable weight is the greater of actual scale weight and volumetric weight
 */
export function calculateChargeableWeight(
  actualWeightKg: number,
  lengthCm?: number,
  widthCm?: number,
  heightCm?: number
): number {
  const actual = Math.max(0.1, Number(actualWeightKg) || 0.5);
  const hasDimensions = lengthCm && widthCm && heightCm && lengthCm > 0 && widthCm > 0 && heightCm > 0;
  const vol = hasDimensions ? calculateVolumetricWeight(lengthCm, widthCm, heightCm) : 0;
  const chargeable = Math.max(actual, vol);
  return Math.max(0.5, Math.round(chargeable * 10) / 10);
}

/**
 * Prohibited goods scan
 */
export function checkProhibitedGoods(text: string): { isProhibited: boolean; matchedKeyword?: string } {
  const lower = text.toLowerCase();
  for (const word of PROHIBITED_KEYWORDS) {
    if (lower.includes(word)) {
      return { isProhibited: true, matchedKeyword: word };
    }
  }
  return { isProhibited: false };
}

/**
 * Helper to calculate business days delivery date from a base dispatch date
 */
export function calculateEstimatedDeliveryDate(
  baseDateInput: string | Date = new Date(),
  tier: ServiceTier = 'standard'
): { dateIso: string; displayDate: string; daysCount: number } {
  const base = typeof baseDateInput === 'string' ? new Date(baseDateInput) : new Date(baseDateInput.getTime());
  // Default to 2 days for priority, 5 days for standard
  const targetBusinessDays = tier === 'priority' ? 3 : 5;
  
  const current = new Date(base.getTime());
  let addedDays = 0;
  while (addedDays < targetBusinessDays) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  return {
    dateIso: current.toISOString().split('T')[0],
    displayDate: current.toLocaleDateString('en-GB', options),
    daysCount: targetBusinessDays,
  };
}

/**
 * Itemized Quote Generator (Provider-Neutral)
 * Pickup is strictly FREE (₦0) across all services as per Revision 3 & Consolidated Prompt.
 */
export function generateQuoteBreakdown(params: {
  destinationCountry: string;
  actualWeightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  tier: ServiceTier;
  pickupRequired?: boolean;
  baseDate?: string | Date;
  direction?: ShippingDirection;
  protectionCharge?: number;
  protectionPlan?: 'basic' | 'premium';
  protectionCoverageNgn?: number;
  protectionRatePercentage?: number;
  protectionDeductibleText?: string;
}): QuoteBreakdown {
  const destination = SUPPORTED_DESTINATIONS[params.destinationCountry] || {
    country: params.destinationCountry,
    code: 'XX',
    baseKgRateNgn: 25000,
    prioritySupported: false,
    priorityMultiplier: 1.0,
    transitStandard: '7 - 12 business days',
    transitPriority: 'Unavailable',
  };

  const hasDimensions =
    params.lengthCm && params.widthCm && params.heightCm &&
    params.lengthCm > 0 && params.widthCm > 0 && params.heightCm > 0;
  const volKg = hasDimensions
    ? calculateVolumetricWeight(params.lengthCm!, params.widthCm!, params.heightCm!)
    : params.actualWeightKg;
  const chargeableKg = calculateChargeableWeight(
    params.actualWeightKg,
    params.lengthCm,
    params.widthCm,
    params.heightCm
  );

  const effectiveTier: ServiceTier = destination.prioritySupported ? params.tier : 'standard';
  const multiplier = effectiveTier === 'priority' ? destination.priorityMultiplier : 1.0;
  
  // Base air carriage / linehaul
  const baseFreight = Math.round(chargeableKg * destination.baseKgRateNgn * multiplier);
  
  // Jet fuel surcharge (realistic Nigerian air logistics variable index)
  const jetFuel = Math.round(baseFreight * 0.10);

  // Terminal security screening & NCAA export manifest lodging
  const handlingFee = 4500;

  // Doorstep collection / Hub intake is ALWAYS ₦0
  const pickupFee = 0;

  // Protection premium (₦0 for basic, calculated rate for premium coverage)
  const protectionFee = Number(params.protectionCharge) || 0;

  const subtotal = baseFreight + jetFuel + handlingFee + pickupFee + protectionFee;
  const vat = Math.round((baseFreight + jetFuel + handlingFee) * 0.075); // 7.5% statutory VAT on carriage & handling services
  const total = subtotal + vat;

  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day validity
  const deliveryEst = calculateEstimatedDeliveryDate(params.baseDate || now, effectiveTier);

  return {
    id: 'QUO-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    chargeableWeightKg: chargeableKg,
    actualWeightKg: params.actualWeightKg,
    volumetricWeightKg: volKg,
    serviceTier: effectiveTier,
    serviceName: effectiveTier === 'priority' ? 'Priority Air Express' : 'Standard Air Courier',
    laneDescription:
      effectiveTier === 'priority'
        ? 'Fastest available international lane'
        : 'Cost-optimized international lane, consolidated for efficiency',
    freightCharge: baseFreight,
    jetFuelSurcharge: jetFuel,
    handlingCharge: handlingFee,
    pickupCharge: 0, // Always free
    protectionCharge: protectionFee,
    protectionPlan: params.protectionPlan || 'basic',
    protectionCoverageNgn: params.protectionCoverageNgn,
    protectionRatePercentage: params.protectionRatePercentage,
    protectionDeductibleText: params.protectionDeductibleText,
    subtotal: subtotal,
    vatAmount: vat,
    totalAmount: total,
    transitWindow: effectiveTier === 'priority' ? destination.transitPriority : destination.transitStandard,
    estimatedDeliveryDate: deliveryEst.dateIso,
    estimatedDeliveryDisplay: deliveryEst.displayDate,
    generatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

/**
 * Calculate revised quote after physical depot intake measurements
 */
export function recalculateVerifiedQuote(
  originalQuote: QuoteBreakdown,
  destinationCountry: string,
  verifiedWeightKg: number,
  verifiedL: number,
  verifiedW: number,
  verifiedH: number
): QuoteBreakdown {
  const newBreakdown = generateQuoteBreakdown({
    destinationCountry,
    actualWeightKg: verifiedWeightKg,
    lengthCm: verifiedL,
    widthCm: verifiedW,
    heightCm: verifiedH,
    tier: originalQuote.serviceTier,
    pickupRequired: true,
  });

  const diff = newBreakdown.totalAmount - originalQuote.totalAmount;

  return {
    ...newBreakdown,
    isDiscrepancyRevised: Math.abs(diff) > 50,
    previousTotal: originalQuote.totalAmount,
    discrepancyReason:
      diff > 0
        ? `Verified chargeable weight increased from ${originalQuote.chargeableWeightKg}kg to ${newBreakdown.chargeableWeightKg}kg upon physical intake measurement.`
        : undefined,
  };
}

/**
 * Calculate eligible customer cashback
 * Business rule: 3% of eligible freight charge only upon completed delivery. Excludes pass-through VAT and handling.
 */
export function calculateEligibleCashback(quote: QuoteBreakdown, status: string): {
  isEligible: boolean;
  amountNgn: number;
  reason: string;
} {
  if (status !== 'delivered') {
    return {
      isEligible: false,
      amountNgn: 0,
      reason: 'Cashback releases only after confirmed delivery closure and reconciliation.',
    };
  }

  // 3% of freight charge, capped at ₦15,000 per shipment
  const raw = Math.round(quote.freightCharge * 0.03);
  const amount = Math.min(15000, raw);

  return {
    isEligible: true,
    amountNgn: amount,
    reason: '3% of eligible freight carriage upon verified delivery closure.',
  };
}

/**
 * Format currency in Nigerian Naira (NGN)
 */
export function formatNaira(amount: number): string {
  return `NGN ${amount.toLocaleString('en-US')}`;
}

export function calculateShippingQuote(params: {
  direction?: ShippingDirection;
  originCountry?: string;
  originCity?: string;
  destinationCountry: string;
  destinationCity?: string;
  weightKg: number;
  dimensions: { length: number; width: number; height: number };
  serviceTier: ServiceTier;
  pickupType?: 'doorstep' | 'hub';
}): QuoteBreakdown {
  return generateQuoteBreakdown({
    destinationCountry: params.destinationCountry,
    actualWeightKg: params.weightKg,
    lengthCm: params.dimensions.length,
    widthCm: params.dimensions.width,
    heightCm: params.dimensions.height,
    tier: params.serviceTier,
    direction: params.direction,
    pickupRequired: params.pickupType === 'doorstep',
  });
}

export function isProhibitedItem(text: string): { prohibited: boolean; reason?: string } {
  const result = checkProhibitedGoods(text);
  return {
    prohibited: result.isProhibited,
    reason: result.isProhibited
      ? `Prohibited item detected: Contains "${result.matchedKeyword}". Aviation safety regulations strictly prohibit this item.`
      : undefined,
  };
}

