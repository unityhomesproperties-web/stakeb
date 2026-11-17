import { CarrierDivisorRule, PackageMeasurement, QuoteBreakdown, ServiceTier, ShippingDirection } from '../types';

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

export interface RouteOrigin {
  country: string;
  code: string;
  defaultCity: string;
  hubs: string[];
}

export const SUPPORTED_ORIGINS: RouteOrigin[] = [
  {
    country: 'Nigeria',
    code: 'NG',
    defaultCity: 'Lagos',
    hubs: ['Ikeja Hub (Mainland)', 'Victoria Island Center', 'Abuja Central Cargo Hub', 'Port Harcourt Gateway'],
  },
  {
    country: 'United Kingdom',
    code: 'GB',
    defaultCity: 'London',
    hubs: ['London Heathrow Cargo Terminal (LHR)'],
  },
  {
    country: 'United States',
    code: 'US',
    defaultCity: 'New York',
    hubs: ['New York JFK Airfreight Terminal', 'Atlanta Hartsfield-Jackson (ATL)'],
  },
  {
    country: 'Canada',
    code: 'CA',
    defaultCity: 'Toronto',
    hubs: ['Toronto Pearson Cargo Terminal (YYZ)'],
  },
  {
    country: 'Germany',
    code: 'DE',
    defaultCity: 'Frankfurt',
    hubs: ['Frankfurt Air Cargo Center (FRA)'],
  },
  {
    country: 'South Africa',
    code: 'ZA',
    defaultCity: 'Johannesburg',
    hubs: ['OR Tambo Cargo Terminal (JNB)'],
  },
  {
    country: 'Ghana',
    code: 'GH',
    defaultCity: 'Accra',
    hubs: ['Kotoka International Gateway (ACC)'],
  },
  {
    country: 'United Arab Emirates',
    code: 'AE',
    defaultCity: 'Dubai',
    hubs: ['Dubai DWC Air Logistics Hub'],
  },
];

export interface RouteEvaluation {
  isSupported: boolean;
  isConfirmed: boolean;
  message?: string;
}

export function evaluateRouteAvailability(originCountry: string, destinationCountry: string): RouteEvaluation {
  if (!originCountry || !destinationCountry) {
    return {
      isSupported: false,
      isConfirmed: false,
      message: 'Please choose both origin and destination countries.',
    };
  }

  if (originCountry.trim().toLowerCase() === destinationCountry.trim().toLowerCase()) {
    return {
      isSupported: false,
      isConfirmed: false,
      message: 'Origin and destination must be different countries for international air shipping.',
    };
  }

  // Confirmed bilateral routes from or to Nigeria
  const activeCorridors = [
    'United Kingdom',
    'United States',
    'Canada',
    'Germany',
    'South Africa',
    'Ghana',
    'United Arab Emirates',
  ];

  if (originCountry === 'Nigeria' && activeCorridors.includes(destinationCountry)) {
    return { isSupported: true, isConfirmed: true };
  }

  if (destinationCountry === 'Nigeria' && activeCorridors.includes(originCountry)) {
    return { isSupported: true, isConfirmed: true };
  }

  // Special/Remote or unconfirmed corridors
  return {
    isSupported: false,
    isConfirmed: false,
    message: 'Route availability needs to be confirmed.',
  };
}

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
      diff > 50
        ? `Verified chargeable weight increased from ${originalQuote.chargeableWeightKg}kg to ${newBreakdown.chargeableWeightKg}kg upon physical intake measurement.`
        : diff < -50
          ? `Verified chargeable weight decreased from ${originalQuote.chargeableWeightKg}kg to ${newBreakdown.chargeableWeightKg}kg upon physical intake measurement. Eligible for refund or wallet credit.`
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
  protectionCharge?: number;
  protectionPlan?: 'basic' | 'premium';
  protectionCoverageNgn?: number;
  protectionRatePercentage?: number;
  protectionDeductibleText?: string;
  items?: Array<{ id: string; description: string; quantity: number; declaredValue?: number }>;
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
    protectionCharge: params.protectionCharge,
    protectionPlan: params.protectionPlan,
    protectionCoverageNgn: params.protectionCoverageNgn,
    protectionRatePercentage: params.protectionRatePercentage,
    protectionDeductibleText: params.protectionDeductibleText,
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

export const DEFAULT_CARRIER_DIVISOR_RULES: CarrierDivisorRule[] = [
  {
    id: 'div_dhl_express_5000',
    carrierName: 'DHL Express International',
    routeScope: 'All International Air Corridors',
    serviceTier: 'priority',
    divisor: 5000,
    minChargeableKg: 0.5,
    roundingStepKg: 0.5,
    label: 'DHL Express (÷5000, 0.5kg step)',
    isActive: true,
    updatedAt: '2026-11-01T09:00:00Z',
  },
  {
    id: 'div_std_consolidated_6000',
    carrierName: 'Swiftvero Consolidated Air',
    routeScope: 'Standard Air Economy Lanes',
    serviceTier: 'standard',
    divisor: 6000,
    minChargeableKg: 0.5,
    roundingStepKg: 0.5,
    label: 'Consolidated Air (÷6000, 0.5kg step)',
    isActive: true,
    updatedAt: '2026-11-01T09:00:00Z',
  },
  {
    id: 'div_heavy_air_4000',
    carrierName: 'Heavy Cargo Air Freight',
    routeScope: 'Oversized / Palletized Air',
    serviceTier: 'all',
    divisor: 4000,
    minChargeableKg: 1.0,
    roundingStepKg: 1.0,
    label: 'Heavy Cargo Air (÷4000, 1.0kg step)',
    isActive: true,
    updatedAt: '2026-11-01T09:00:00Z',
  },
];

export function roundToStepKg(weightKg: number, stepKg = 0.5, minKg = 0.5): number {
  const safeWeight = Math.max(0, Number(weightKg) || 0);
  const safeStep = stepKg > 0 ? stepKg : 0.5;
  const rounded = Math.ceil(safeWeight / safeStep) * safeStep;
  const clamped = Math.max(minKg, rounded);
  return Math.round(clamped * 100) / 100;
}

export interface RawPackageInput {
  id?: string;
  description?: string;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  photoUrl?: string;
  notes?: string;
}

export function calculateMultiPackageMeasurements(params: {
  packages: RawPackageInput[];
  divisorRule: CarrierDivisorRule;
  measuredBy: string;
  now?: Date;
}): {
  packages: PackageMeasurement[];
  totalActualWeightKg: number;
  totalVolumetricWeightKg: number;
  totalBillableWeightKg: number;
  divisorUsed: number;
} {
  const timestamp = (params.now || new Date()).toISOString();
  const divisor = params.divisorRule.divisor > 0 ? params.divisorRule.divisor : 5000;
  const stepKg = params.divisorRule.roundingStepKg > 0 ? params.divisorRule.roundingStepKg : 0.5;
  const minKg = params.divisorRule.minChargeableKg > 0 ? params.divisorRule.minChargeableKg : 0.5;

  const measuredBoxes: PackageMeasurement[] = params.packages.map((pkg, idx) => {
    const actual = Math.max(0.1, Number(pkg.actualWeightKg) || 0.5);
    const l = Math.max(1, Number(pkg.lengthCm) || 1);
    const w = Math.max(1, Number(pkg.widthCm) || 1);
    const h = Math.max(1, Number(pkg.heightCm) || 1);
    const rawVol = (l * w * h) / divisor;
    const volumetricWeightKg = Math.round(rawVol * 100) / 100;
    const rawMax = Math.max(actual, rawVol);
    const billableWeightKg = roundToStepKg(rawMax, stepKg, minKg);

    return {
      id: pkg.id || `box_${Date.now()}_${idx + 1}`,
      boxNumber: idx + 1,
      description: pkg.description?.trim() || `Package #${idx + 1}`,
      actualWeightKg: Math.round(actual * 100) / 100,
      lengthCm: l,
      widthCm: w,
      heightCm: h,
      volumetricWeightKg,
      billableWeightKg,
      measuredAt: timestamp,
      measuredBy: params.measuredBy,
      photoUrl: pkg.photoUrl,
      notes: pkg.notes,
    };
  });

  const totalActualWeightKg =
    Math.round(measuredBoxes.reduce((sum, b) => sum + b.actualWeightKg, 0) * 100) / 100;
  const totalVolumetricWeightKg =
    Math.round(measuredBoxes.reduce((sum, b) => sum + b.volumetricWeightKg, 0) * 100) / 100;
  const totalBillableWeightKg = roundToStepKg(
    measuredBoxes.reduce((sum, b) => sum + b.billableWeightKg, 0),
    stepKg,
    minKg
  );

  return {
    packages: measuredBoxes,
    totalActualWeightKg,
    totalVolumetricWeightKg,
    totalBillableWeightKg,
    divisorUsed: divisor,
  };
}

export function recalculateVerifiedQuoteFromPackages(params: {
  originalQuote: QuoteBreakdown;
  destinationCountry: string;
  packages: RawPackageInput[];
  divisorRule: CarrierDivisorRule;
  measuredBy: string;
  tierOverride?: ServiceTier;
  now?: Date;
}): {
  measurementSummary: ReturnType<typeof calculateMultiPackageMeasurements>;
  revisedQuote: QuoteBreakdown;
  availableOptions: QuoteBreakdown[];
} {
  const measurementSummary = calculateMultiPackageMeasurements({
    packages: params.packages,
    divisorRule: params.divisorRule,
    measuredBy: params.measuredBy,
    now: params.now,
  });

  const dest = SUPPORTED_DESTINATIONS[params.destinationCountry];
  const buildForTier = (tier: ServiceTier): QuoteBreakdown => {
    const base = generateQuoteBreakdown({
      destinationCountry: params.destinationCountry,
      actualWeightKg: measurementSummary.totalBillableWeightKg,
      tier,
      protectionCharge: params.originalQuote.protectionCharge,
      protectionPlan: params.originalQuote.protectionPlan,
      protectionCoverageNgn: params.originalQuote.protectionCoverageNgn,
      protectionRatePercentage: params.originalQuote.protectionRatePercentage,
      protectionDeductibleText: params.originalQuote.protectionDeductibleText,
      baseDate: params.now,
    });

    const diff = base.totalAmount - params.originalQuote.totalAmount;
    return {
      ...base,
      actualWeightKg: measurementSummary.totalActualWeightKg,
      volumetricWeightKg: measurementSummary.totalVolumetricWeightKg,
      chargeableWeightKg: measurementSummary.totalBillableWeightKg,
      isDiscrepancyRevised: Math.abs(diff) > 50,
      previousTotal: params.originalQuote.totalAmount,
      discrepancyReason:
        diff > 50
          ? `Verified billable weight across ${measurementSummary.packages.length} box(es) (${measurementSummary.totalBillableWeightKg}kg via divisor /${measurementSummary.divisorUsed}) increased total from ₦${params.originalQuote.totalAmount.toLocaleString()} to ₦${base.totalAmount.toLocaleString()}.`
          : diff < -50
            ? `Verified billable weight across ${measurementSummary.packages.length} box(es) (${measurementSummary.totalBillableWeightKg}kg via divisor /${measurementSummary.divisorUsed}) reduced total from ₦${params.originalQuote.totalAmount.toLocaleString()} to ₦${base.totalAmount.toLocaleString()}.`
            : undefined,
    };
  };

  const selectedTier = params.tierOverride || params.originalQuote.serviceTier;
  const standardQuote = buildForTier('standard');
  const availableOptions: QuoteBreakdown[] = [standardQuote];
  if (!dest || dest.prioritySupported) {
    availableOptions.push(buildForTier('priority'));
  }

  const revisedQuote =
    availableOptions.find((opt) => opt.serviceTier === selectedTier) || standardQuote;

  return {
    measurementSummary,
    revisedQuote,
    availableOptions,
  };
}

