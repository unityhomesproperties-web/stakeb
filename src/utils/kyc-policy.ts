import { CustomerProfile, KycStatus } from '../types';

export type KycMethod = 'nin' | 'bvn' | 'passport';

export interface KycPolicyConfig {
  domesticThresholdNgn: number;
  internationalThresholdNgn: number;
  swiftShareRequiresKyc: boolean;
  businessRequiresCac: boolean;
}

export const DEFAULT_KYC_POLICY: KycPolicyConfig = {
  domesticThresholdNgn: 500000,
  internationalThresholdNgn: 150000,
  swiftShareRequiresKyc: true,
  businessRequiresCac: true,
};

export type KycDemoScenario =
  | 'valid_nin'
  | 'invalid_nin'
  | 'valid_bvn'
  | 'invalid_bvn'
  | 'name_mismatch'
  | 'provider_unavailable'
  | 'passport_valid'
  | 'passport_blurry'
  | 'passport_expired'
  | 'manual_review'
  | 'additional_info_required';

export interface VerificationResult {
  status: KycStatus;
  method: KycMethod;
  maskedId: string;
  matchedName?: string;
  providerName: string;
  auditReference: string;
  message: string;
  isSimulated: true;
  requiresReverification?: boolean;
}

/**
 * Masks an identity number to protect sensitive PII.
 * Example: '12345678901' -> '*******8901'
 */
export function maskIdentityNumber(val: string): string {
  const cleaned = val.trim();
  if (cleaned.length <= 4) return '****';
  const last4 = cleaned.slice(-4);
  return '*'.repeat(Math.max(4, cleaned.length - 4)) + last4;
}

/**
 * Validates that NIN or BVN is strictly 11 numeric digits.
 */
export function validateElevenDigitNumber(num: string): { valid: boolean; error?: string } {
  const digitsOnly = num.replace(/\D/g, '');
  if (digitsOnly.length !== 11) {
    return {
      valid: false,
      error: `Must be exactly 11 numeric digits (currently ${digitsOnly.length} digits).`,
    };
  }
  return { valid: true };
}

/**
 * Evaluates whether a shipment or customer action mandates verified KYC based on policy rules.
 */
export function evaluateKycRequirement(params: {
  customer: CustomerProfile;
  shipmentValueNgn?: number;
  isInternational?: boolean;
  isSwiftShare?: boolean;
  policy?: KycPolicyConfig;
}): {
  required: boolean;
  reason?: string;
  recommendedMethod: KycMethod;
} {
  const policy = params.policy || DEFAULT_KYC_POLICY;
  const isBiz = params.customer.customerType === 'business';

  if (params.isSwiftShare && policy.swiftShareRequiresKyc) {
    return {
      required: true,
      reason: 'Aviation security & peer delivery protocol mandate KYC verification for all SwiftShare participants.',
      recommendedMethod: 'passport',
    };
  }

  if (params.isInternational) {
    const val = params.shipmentValueNgn || 0;
    if (val >= policy.internationalThresholdNgn) {
      return {
        required: true,
        reason: `International export valued above ₦${policy.internationalThresholdNgn.toLocaleString()} mandates statutory NCAA/Customs identity verification.`,
        recommendedMethod: 'passport',
      };
    }
  }

  if (params.shipmentValueNgn && params.shipmentValueNgn >= policy.domesticThresholdNgn) {
    return {
      required: true,
      reason: `Consignment value exceeds high-value threshold (₦${policy.domesticThresholdNgn.toLocaleString()}). Anti-money laundering compliance applies.`,
      recommendedMethod: 'nin',
    };
  }

  if (isBiz) {
    return {
      required: true,
      reason: 'Commercial consignor accounts require statutory corporate CAC & director verification.',
      recommendedMethod: 'nin',
    };
  }

  return {
    required: false,
    recommendedMethod: 'nin',
  };
}

/**
 * Simulates backend KYC provider verification adapters (NIMC, NIBSS, Seamfix, Smile Identity, VerifyMe).
 */
export async function simulateIdentityVerification(params: {
  method: KycMethod;
  idNumber: string;
  customerName: string;
  issuingCountry?: string;
  hasConsent: boolean;
  passportExpiryDate?: string;
  scenario?: KycDemoScenario;
}): Promise<VerificationResult> {
  const auditReference = `KYC-VERIF-${Date.now().toString().slice(-8)}`;
  const maskedId = maskIdentityNumber(params.idNumber || '00000000000');

  if (!params.hasConsent) {
    return {
      status: 'failed',
      method: params.method,
      maskedId,
      providerName: 'Swiftvero Verification Gateway',
      auditReference,
      message: 'Explicit customer consent is required before querying identity databases.',
      isSimulated: true,
    };
  }

  // Pre-configured scenario overrides for demo inspection
  const scenario = params.scenario;

  if (scenario === 'provider_unavailable') {
    return {
      status: 'verification_service_unavailable',
      method: params.method,
      maskedId,
      providerName: 'NIMC / NIBSS Interswitch Core Gateway',
      auditReference,
      message: 'Identity verification provider service timed out. Please retry or choose an alternative method.',
      isSimulated: true,
    };
  }

  if (scenario === 'invalid_nin' || scenario === 'invalid_bvn') {
    return {
      status: 'failed',
      method: params.method,
      maskedId,
      providerName: params.method === 'nin' ? 'NIMC Portal Engine' : 'NIBSS Central BVN Portal',
      auditReference,
      message: `The entered ${params.method.toUpperCase()} does not match any registered citizen records in the central directory.`,
      isSimulated: true,
    };
  }

  if (scenario === 'name_mismatch') {
    return {
      status: 'failed',
      method: params.method,
      maskedId,
      matchedName: 'Emeka Chukwu',
      providerName: 'Statutory Verification Service',
      auditReference,
      message: `Name mismatch: Identity record belongs to a different individual than "${params.customerName}".`,
      isSimulated: true,
    };
  }

  if (scenario === 'passport_blurry') {
    return {
      status: 'failed',
      method: 'passport',
      maskedId,
      providerName: 'ICAO Machine-Readable OCR Scanner',
      auditReference,
      message: 'Document scan failed: Image resolution is too blurry to extract the MRZ zone or verify holograms.',
      isSimulated: true,
    };
  }

  if (scenario === 'passport_expired') {
    return {
      status: 'failed',
      method: 'passport',
      maskedId,
      providerName: 'Immigration Document Registry',
      auditReference,
      message: 'Document expired: Government identity document expired prior to consignment booking.',
      isSimulated: true,
    };
  }

  if (scenario === 'manual_review') {
    return {
      status: 'manual_review',
      method: params.method,
      maskedId,
      providerName: 'Swiftvero Compliance Bureau',
      auditReference,
      message: 'Your document has been submitted for review. We will notify you when the review is complete.',
      isSimulated: true,
    };
  }

  if (scenario === 'additional_info_required') {
    return {
      status: 'additional_info_required',
      method: params.method,
      maskedId,
      providerName: 'NIMC Enhanced Assurance Desk',
      auditReference,
      message: 'Additional information required: Secondary proof of address (utility bill) needed to clear export tier.',
      isSimulated: true,
    };
  }

  // Format checks
  if (params.method === 'nin' || params.method === 'bvn') {
    const check = validateElevenDigitNumber(params.idNumber);
    if (!check.valid) {
      return {
        status: 'failed',
        method: params.method,
        maskedId,
        providerName: params.method === 'nin' ? 'NIMC' : 'NIBSS',
        auditReference,
        message: check.error || 'Invalid 11-digit identifier format.',
        isSimulated: true,
      };
    }
  }

  // Default success
  return {
    status: 'verified',
    method: params.method,
    maskedId,
    matchedName: params.customerName,
    providerName:
      params.method === 'nin'
        ? 'National Identity Management Commission (NIMC)'
        : params.method === 'bvn'
        ? 'Nigeria Inter-Bank Settlement System (NIBSS)'
        : 'Nigerian Immigration Service (NIS) / ICAO Doc 9303',
    auditReference,
    message: 'Your identity has been successfully verified. You can continue using Swiftvero Express.',
    isSimulated: true,
  };
}
