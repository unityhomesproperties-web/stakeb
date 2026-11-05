import { ParcelItem } from '../types';

export interface ProtectionConfig {
  basicLiabilityDescription: string;
  basicLiabilityLimitNgn: number;
  premiumRatePercentage: number; // e.g. 1.5
  minPremiumNgn: number; // e.g. 1500
  maxPremiumNgn: number; // e.g. 150000
  minEligibleDeclaredValueNgn: number; // e.g. 20000
  maxEligibleDeclaredValueNgn: number; // e.g. 15000000
  deductiblePercentage: number; // e.g. 5%
  deductibleMinNgn: number; // e.g. 10,000 NGN
  claimsDeadlineDays: number; // e.g. 14 days
  providerName: string;
  providerStatus: 'demo_simulated' | 'sandbox_active' | 'live_connected';
  providerLicenseRef: string;
  excludedCategories: string[];
  eligibleRoutes: string[];
  termsVersion: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export const DEFAULT_PROTECTION_CONFIG: ProtectionConfig = {
  basicLiabilityDescription: 'Contractual carrier liability (Warsaw/Montreal convention standards up to standard liability limits). Excludes undeclared items and improper customer packaging.',
  basicLiabilityLimitNgn: 50000,
  premiumRatePercentage: 1.5, // 1.5% in demo mode
  minPremiumNgn: 1500,
  maxPremiumNgn: 250000,
  minEligibleDeclaredValueNgn: 20000,
  maxEligibleDeclaredValueNgn: 15000000,
  deductiblePercentage: 5,
  deductibleMinNgn: 10000,
  claimsDeadlineDays: 14,
  providerName: 'Leadway Assurance PLC (Demo Underwriting Alliance)',
  providerStatus: 'demo_simulated',
  providerLicenseRef: 'NAICOM/RIC/029-DEMO',
  excludedCategories: [
    'Cash, banknotes, bullion, & precious metal coins',
    'Unpackaged loose glassware & ceramic antiques',
    'Perishable unprocessed foodstuffs without health permit',
    'Aerosols, flammable liquids, & lithium batteries over 100Wh',
    'Counterfeit, pirated, or contraband merchandise',
  ],
  eligibleRoutes: ['United Kingdom', 'United States', 'Canada', 'European Union', 'South Africa', 'Ghana', 'UAE'],
  termsVersion: 'SV-PROT-2026-v2.1',
  lastUpdatedBy: 'Chief Underwriting Officer (Admin)',
  lastUpdatedAt: '2026-10-28T10:00:00Z',
};

export interface ProtectionCalculationInput {
  plan: 'basic' | 'premium';
  declaredValueNgn: number;
  items?: ParcelItem[];
  config?: ProtectionConfig;
  destinationCountry?: string;
}

export interface ProtectionCalculationResult {
  plan: 'basic' | 'premium';
  isEligible: boolean;
  ineligibilityReason?: string;
  totalDeclaredValueNgn: number;
  eligibleDeclaredValueNgn: number;
  excludedDeclaredValueNgn: number;
  premiumRatePercentage: number;
  calculatedPremiumNgn: number;
  minPremiumApplied: boolean;
  maxPremiumApplied: boolean;
  coverageLimitNgn: number;
  deductibleText: string;
  providerName: string;
  isSimulated: boolean;
  breakdownSummary: string;
  // Aliases for convenience across UI components
  premiumNgn: number;
  coverageNgn: number;
  ratePercentage: number;
  excludedItems: ParcelItem[];
}

/**
 * Checks whether an item category or description matches standard policy exclusions.
 */
export function isItemExcludedFromProtection(description: string, category?: string): { excluded: boolean; reason?: string } {
  const text = `${description} ${category || ''}`.toLowerCase();
  
  if (/cash|banknote|money|currency|gold bar|bullion|coin/i.test(text)) {
    return { excluded: true, reason: 'Cash, currency, or precious bullion are strictly excluded from shipment coverage.' };
  }
  if (/perishable|raw meat|fresh fish|unpasteurized/i.test(text)) {
    return { excluded: true, reason: 'Perishable foodstuffs subject to rapid spoilage are excluded from carriage coverage.' };
  }
  if (/loose glass|ceramic antique|unwrapped mirror/i.test(text)) {
    return { excluded: true, reason: 'Unpackaged fragile glassware requires specialized wooden crating to qualify for coverage.' };
  }
  if (/gunpowder|ammunition|flammable liquid|firearm/i.test(text)) {
    return { excluded: true, reason: 'Hazardous or restricted explosive/flammable goods are prohibited from all air cargo coverage.' };
  }
  return { excluded: false };
}

/**
 * Calculates premium, eligible values, and coverage limits for chosen protection plan.
 */
export function calculateProtectionPremium(input: ProtectionCalculationInput): ProtectionCalculationResult {
  const config = input.config || DEFAULT_PROTECTION_CONFIG;
  const items = input.items || [];
  const excludedItemsList = items.filter((it) => isItemExcludedFromProtection(it.description, it.category).excluded);
  
  // Calculate total and item-by-item breakdown if items provided
  let totalDeclared = input.declaredValueNgn;
  let eligibleDeclared = 0;
  let excludedDeclared = 0;

  if (items.length > 0) {
    totalDeclared = items.reduce((sum, item) => sum + (Number(item.declaredValue) || 0) * (Number(item.quantity) || 1), 0);
    for (const item of items) {
      const exclusion = isItemExcludedFromProtection(item.description, item.category);
      const itemVal = (Number(item.declaredValue) || 0) * (Number(item.quantity) || 1);
      if (exclusion.excluded) {
        excludedDeclared += itemVal;
      } else {
        eligibleDeclared += itemVal;
      }
    }
  } else {
    // Single item fallback
    const exclusion = isItemExcludedFromProtection(input.declaredValueNgn ? 'Declared goods' : '');
    if (exclusion.excluded) {
      excludedDeclared = totalDeclared;
      eligibleDeclared = 0;
    } else {
      eligibleDeclared = totalDeclared;
    }
  }

  // Basic Plan
  if (input.plan === 'basic') {
    return {
      plan: 'basic',
      isEligible: true,
      totalDeclaredValueNgn: totalDeclared,
      eligibleDeclaredValueNgn: eligibleDeclared,
      excludedDeclaredValueNgn: excludedDeclared,
      premiumRatePercentage: 0,
      calculatedPremiumNgn: 0,
      minPremiumApplied: false,
      maxPremiumApplied: false,
      coverageLimitNgn: config.basicLiabilityLimitNgn,
      deductibleText: 'None for contractual standard liability limit (terms apply)',
      providerName: 'Swiftvero Standard Conditions of Carriage',
      isSimulated: false,
      breakdownSummary: `Included Basic Protection: ₦0 additional charge. Standard contractual carrier liability applies up to ₦${config.basicLiabilityLimitNgn.toLocaleString()}.`,
      premiumNgn: 0,
      coverageNgn: config.basicLiabilityLimitNgn,
      ratePercentage: 0,
      excludedItems: excludedItemsList,
    };
  }

  // Premium Coverage Plan
  // Check route eligibility if provided
  if (input.destinationCountry) {
    const isRouteEligible = config.eligibleRoutes.some(
      (r) => input.destinationCountry?.toLowerCase().includes(r.toLowerCase())
    );
    if (!isRouteEligible && config.eligibleRoutes.length > 0) {
      return {
        plan: 'premium',
        isEligible: false,
        ineligibilityReason: `Premium coverage is currently available on high-volume commercial air routes (${config.eligibleRoutes.slice(0, 4).join(', ')}). Standard liability applies for other destinations.`,
        totalDeclaredValueNgn: totalDeclared,
        eligibleDeclaredValueNgn: eligibleDeclared,
        excludedDeclaredValueNgn: excludedDeclared,
        premiumRatePercentage: config.premiumRatePercentage,
        calculatedPremiumNgn: 0,
        minPremiumApplied: false,
        maxPremiumApplied: false,
        coverageLimitNgn: config.basicLiabilityLimitNgn,
        deductibleText: 'N/A',
        providerName: config.providerName,
        isSimulated: true,
        breakdownSummary: 'Route not eligible for optional premium underwriting.',
        premiumNgn: 0,
        coverageNgn: config.basicLiabilityLimitNgn,
        ratePercentage: config.premiumRatePercentage,
        excludedItems: excludedItemsList,
      };
    }
  }

  // Validate declared value thresholds
  if (eligibleDeclared < config.minEligibleDeclaredValueNgn) {
    // Below minimum eligible threshold for premium coverage
    return {
      plan: 'premium',
      isEligible: true, // Still allow purchase, but apply minimum premium
      totalDeclaredValueNgn: totalDeclared,
      eligibleDeclaredValueNgn: eligibleDeclared,
      excludedDeclaredValueNgn: excludedDeclared,
      premiumRatePercentage: config.premiumRatePercentage,
      calculatedPremiumNgn: config.minPremiumNgn,
      minPremiumApplied: true,
      maxPremiumApplied: false,
      coverageLimitNgn: Math.min(eligibleDeclared, config.maxEligibleDeclaredValueNgn),
      deductibleText: `${config.deductiblePercentage}% or ₦${config.deductibleMinNgn.toLocaleString()} (whichever is higher)`,
      providerName: config.providerName,
      isSimulated: true,
      breakdownSummary: `Declared eligible value ₦${eligibleDeclared.toLocaleString()} is below baseline threshold; minimum premium of ₦${config.minPremiumNgn.toLocaleString()} applied.`,
      premiumNgn: config.minPremiumNgn,
      coverageNgn: Math.min(eligibleDeclared, config.maxEligibleDeclaredValueNgn),
      ratePercentage: config.premiumRatePercentage,
      excludedItems: excludedItemsList,
    };
  }

  // Calculate percentage rate (e.g., 1.5% of eligible declared value)
  const rawPremium = Math.round((eligibleDeclared * config.premiumRatePercentage) / 100);
  let finalPremium = rawPremium;
  let minApplied = false;
  let maxApplied = false;

  if (finalPremium < config.minPremiumNgn) {
    finalPremium = config.minPremiumNgn;
    minApplied = true;
  } else if (finalPremium > config.maxPremiumNgn) {
    finalPremium = config.maxPremiumNgn;
    maxApplied = true;
  }

  const effectiveCoverage = Math.min(eligibleDeclared, config.maxEligibleDeclaredValueNgn);

  return {
    plan: 'premium',
    isEligible: true,
    totalDeclaredValueNgn: totalDeclared,
    eligibleDeclaredValueNgn: eligibleDeclared,
    excludedDeclaredValueNgn: excludedDeclared,
    premiumRatePercentage: config.premiumRatePercentage,
    calculatedPremiumNgn: finalPremium,
    minPremiumApplied: minApplied,
    maxPremiumApplied: maxApplied,
    coverageLimitNgn: effectiveCoverage,
    deductibleText: `${config.deductiblePercentage}% or ₦${config.deductibleMinNgn.toLocaleString()} (whichever is higher)`,
    providerName: config.providerName,
    isSimulated: true,
    breakdownSummary: `${config.premiumRatePercentage}% of ₦${eligibleDeclared.toLocaleString()} eligible declared value = ₦${finalPremium.toLocaleString()}${minApplied ? ' (Minimum premium applied)' : ''}${maxApplied ? ' (Capped at maximum premium)' : ''}.`,
    premiumNgn: finalPremium,
    coverageNgn: effectiveCoverage,
    ratePercentage: config.premiumRatePercentage,
    excludedItems: excludedItemsList,
  };
}

/**
 * Generates an auditable protection reference code.
 */
export function generateProtectionReference(trackingNumber?: string): string {
  const seed = trackingNumber ? trackingNumber.replace(/[^A-Za-z0-9]/g, '').slice(-4) : Math.floor(1000 + Math.random() * 9000).toString();
  return `PROT-2026-${seed.toUpperCase()}`;
}
