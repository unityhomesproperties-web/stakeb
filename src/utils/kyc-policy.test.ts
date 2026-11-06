import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maskIdentityNumber,
  validateElevenDigitNumber,
  evaluateKycRequirement,
  simulateIdentityVerification,
  DEFAULT_KYC_POLICY,
} from './kyc-policy';
import { CustomerProfile } from '../types';

const mockCustomer: CustomerProfile = {
  id: 'cust_01',
  name: 'Amara Okafor',
  email: 'amara@example.com',
  phone: '+234 803 555 0192',
  customerType: 'individual',
  kycStatus: 'not_started',
  cashbackBalance: 0,
  referralCode: 'SWV-AMARA',
  referralsCount: 0,
  termsAcceptedAt: '2026-09-01T00:00:00Z',
};

test('maskIdentityNumber - Masks all digits except the last 4', () => {
  assert.equal(maskIdentityNumber('12345678901'), '*******8901');
  assert.equal(maskIdentityNumber('A09823411'), '*****3411');
  assert.equal(maskIdentityNumber('123'), '****');
});

test('validateElevenDigitNumber - Enforces exact 11 digits for NIN and BVN', () => {
  assert.equal(validateElevenDigitNumber('12345678901').valid, true);
  assert.equal(validateElevenDigitNumber('1234567890').valid, false);
  assert.equal(validateElevenDigitNumber('123456789012').valid, false);
  assert.equal(validateElevenDigitNumber('123-4567-8901').valid, true); // strips non-digits
});

test('evaluateKycRequirement - Flags high-value international exports and SwiftShare', () => {
  const lowDomestic = evaluateKycRequirement({
    customer: mockCustomer,
    shipmentValueNgn: 40000,
    isInternational: false,
  });
  assert.equal(lowDomestic.required, false);

  const highInternational = evaluateKycRequirement({
    customer: mockCustomer,
    shipmentValueNgn: 300000,
    isInternational: true,
  });
  assert.equal(highInternational.required, true);

  const swiftShare = evaluateKycRequirement({
    customer: mockCustomer,
    isSwiftShare: true,
  });
  assert.equal(swiftShare.required, true);
});

test('simulateIdentityVerification - Successfully verifies valid NIN and BVN with consent', async () => {
  const result = await simulateIdentityVerification({
    method: 'nin',
    idNumber: '29384756102',
    customerName: 'Amara Okafor',
    hasConsent: true,
  });
  assert.equal(result.status, 'verified');
  assert.equal(result.maskedId, '*******6102');
  assert.equal(result.isSimulated, true);
});

test('simulateIdentityVerification - Handles demo failure scenarios and service timeouts', async () => {
  const failResult = await simulateIdentityVerification({
    method: 'bvn',
    idNumber: '11111111111',
    customerName: 'Amara Okafor',
    hasConsent: true,
    scenario: 'invalid_bvn',
  });
  assert.equal(failResult.status, 'failed');

  const timeoutResult = await simulateIdentityVerification({
    method: 'nin',
    idNumber: '29384756102',
    customerName: 'Amara Okafor',
    hasConsent: true,
    scenario: 'provider_unavailable',
  });
  assert.equal(timeoutResult.status, 'verification_service_unavailable');
});
