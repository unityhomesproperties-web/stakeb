import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { PolicyKey } from '../common/LegalModal';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileText,
  Upload,
  Camera,
  RotateCcw,
  RefreshCw,
  Lock,
  Building2,
  CreditCard,
  UserCheck,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  KycMethod,
  KycDemoScenario,
  validateElevenDigitNumber,
  maskIdentityNumber,
  simulateIdentityVerification,
} from '../../utils/kyc-policy';
import { KycStatus } from '../../types';

interface KycWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPolicy: (key: PolicyKey) => void;
}

export const KycWizardModal: React.FC<KycWizardModalProps> = ({ isOpen, onClose, onOpenPolicy }) => {
  const { currentCustomer, updateCustomerKyc } = useDemo();

  // Wizard Step: 'select_method' | 'form' | 'submitting' | 'result'
  const [activeStep, setActiveStep] = useState<'select_method' | 'form' | 'submitting' | 'result'>('select_method');
  const [selectedMethod, setSelectedMethod] = useState<KycMethod>('nin');

  // Input states
  const [ninNumber, setNinNumber] = useState('29384756102');
  const [bvnNumber, setBvnNumber] = useState('22194857391');
  const [passportCountry, setPassportCountry] = useState('Nigeria');
  const [passportNumber, setPassportNumber] = useState('A09823411');
  const [passportExpiry, setPassportExpiry] = useState('2028-11-20');
  const [uploadedFile, setUploadedFile] = useState<string>('passport_bio_page_sample.jpg');
  const [explicitConsent, setExplicitConsent] = useState(true);

  // Validation & Error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Demo Scenario Overrides
  const [demoScenario, setDemoScenario] = useState<KycDemoScenario>('valid_nin');

  // Result state
  const [verificationResult, setVerificationResult] = useState<{
    status: KycStatus;
    method: KycMethod;
    maskedId: string;
    message: string;
    auditReference: string;
    providerName: string;
    matchedName?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectMethod = (method: KycMethod) => {
    setSelectedMethod(method);
    setValidationError(null);
    if (method === 'nin') setDemoScenario('valid_nin');
    else if (method === 'bvn') setDemoScenario('valid_bvn');
    else setDemoScenario('passport_valid');
    setActiveStep('form');
  };

  const handleSubmitVerification = async () => {
    setValidationError(null);

    // 1. Consent check
    if (!explicitConsent) {
      setValidationError('You must consent to identity verification to proceed.');
      return;
    }

    // 2. Format validation
    if (selectedMethod === 'nin') {
      const check = validateElevenDigitNumber(ninNumber);
      if (!check.valid) {
        setValidationError(check.error || 'NIN must be exactly 11 numeric digits.');
        return;
      }
    } else if (selectedMethod === 'bvn') {
      const check = validateElevenDigitNumber(bvnNumber);
      if (!check.valid) {
        setValidationError(check.error || 'BVN must be exactly 11 numeric digits.');
        return;
      }
    } else if (selectedMethod === 'passport') {
      if (!passportNumber.trim()) {
        setValidationError('Please enter your passport document number.');
        return;
      }
      if (!uploadedFile) {
        setValidationError('Please upload a clear photograph of your passport bio-data page.');
        return;
      }
    }

    setActiveStep('submitting');

    const idNumber =
      selectedMethod === 'nin'
        ? ninNumber
        : selectedMethod === 'bvn'
        ? bvnNumber
        : passportNumber;

    // Simulate backend verification call
    setTimeout(async () => {
      const result = await simulateIdentityVerification({
        method: selectedMethod,
        idNumber,
        customerName: currentCustomer.name,
        issuingCountry: passportCountry,
        hasConsent: explicitConsent,
        passportExpiryDate: passportExpiry,
        scenario: demoScenario,
      });

      setVerificationResult(result);
      setActiveStep('result');

      // Update customer profile state
      const idTypeName =
        selectedMethod === 'nin'
          ? 'National Identity Number (NIN)'
          : selectedMethod === 'bvn'
          ? 'Bank Verification Number (BVN)'
          : `International Passport (${passportCountry})`;

      const docReference =
        selectedMethod === 'passport'
          ? uploadedFile
          : `${selectedMethod.toUpperCase()}_Slip_${result.maskedId.slice(-4)}.pdf`;

      updateCustomerKyc(result.status, idTypeName, docReference, {
        verificationMethod: selectedMethod,
        maskedId: result.maskedId,
        lastResult: result.message,
      });
    }, 1200);
  };

  const handleResetAndRetry = () => {
    setValidationError(null);
    setActiveStep('select_method');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DCEFF3] w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCEFF3] bg-[#F5FBFD]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2F7D53]/10 flex items-center justify-center text-[#2F7D53]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D2922]">Verify Your Identity</h3>
              <p className="text-xs text-[#6A808C]">
                Verify your identity securely to access Swiftvero Express services.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6A808C] hover:text-[#1D2922] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Mode Notice & Scenario Picker */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>DEMO MODE: NIMC / NIBSS / NIS Sandbox</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-amber-800">Test Scenario:</span>
            <select
              value={demoScenario}
              onChange={(e) => {
                const sc = e.target.value as KycDemoScenario;
                setDemoScenario(sc);
                if (sc.includes('nin')) setSelectedMethod('nin');
                else if (sc.includes('bvn')) setSelectedMethod('bvn');
                else if (sc.includes('passport')) setSelectedMethod('passport');
              }}
              className="text-[11px] bg-white border border-amber-300 rounded px-2 py-0.5 text-[#1D2922] focus:outline-hidden"
            >
              <option value="valid_nin">Valid NIN (Success)</option>
              <option value="invalid_nin">Invalid NIN (Not Found)</option>
              <option value="valid_bvn">Valid BVN (Success)</option>
              <option value="invalid_bvn">Invalid BVN (Fail)</option>
              <option value="name_mismatch">Name Mismatch (Fail)</option>
              <option value="passport_valid">Passport Valid (Success)</option>
              <option value="passport_blurry">Passport Blurry (Fail)</option>
              <option value="passport_expired">Passport Expired (Fail)</option>
              <option value="manual_review">Flag for Manual Review</option>
              <option value="additional_info_required">Additional Info Required</option>
              <option value="provider_unavailable">Gateway Timeout (Unavailable)</option>
            </select>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* STEP 1: METHOD SELECTION */}
          {activeStep === 'select_method' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#6A808C]">
                  Select one verification method below. You do not need to provide multiple documents.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Method 1: NIN */}
                <button
                  type="button"
                  onClick={() => handleSelectMethod('nin')}
                  className="flex items-start gap-4 p-4 border border-[#DCEFF3] rounded-xl text-left hover:border-[#2F7D53] hover:bg-[#EAF6EE]/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#EAF6EE] text-[#2F7D53] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#1D2922]">National Identification Number (NIN)</h4>
                      <span className="text-[10px] font-semibold text-[#2F7D53] bg-[#EAF6EE] px-2 py-0.5 rounded-full">
                        Instant (Recommended)
                      </span>
                    </div>
                    <p className="text-xs text-[#6A808C] mt-1">
                      Instantly validated through the National Identity Management Commission (NIMC) API.
                    </p>
                  </div>
                </button>

                {/* Method 2: BVN */}
                <button
                  type="button"
                  onClick={() => handleSelectMethod('bvn')}
                  className="flex items-start gap-4 p-4 border border-[#DCEFF3] rounded-xl text-left hover:border-[#2F7D53] hover:bg-[#EAF6EE]/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#EBF4FA] text-[#008EA8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#1D2922]">Bank Verification Number (BVN)</h4>
                      <span className="text-[10px] font-semibold text-[#008EA8] bg-[#EBF4FA] px-2 py-0.5 rounded-full">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-[#6A808C] mt-1">
                      Verified securely via Nigeria Inter-Bank Settlement System (NIBSS). No banking passwords or PINs required.
                    </p>
                  </div>
                </button>

                {/* Method 3: International Passport */}
                <button
                  type="button"
                  onClick={() => handleSelectMethod('passport')}
                  className="flex items-start gap-4 p-4 border border-[#DCEFF3] rounded-xl text-left hover:border-[#2F7D53] hover:bg-[#EAF6EE]/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#1D2922]">International Passport</h4>
                      <span className="text-[10px] font-semibold text-[#7E22CE] bg-[#F3E8FF] px-2 py-0.5 rounded-full">
                        NCAA Export Compliant
                      </span>
                    </div>
                    <p className="text-xs text-[#6A808C] mt-1">
                      Upload photo or use camera capture. Validated via ICAO optical character recognition and immigration checks.
                    </p>
                  </div>
                </button>
              </div>

              {/* Data Privacy Note */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F5FAF6] border border-[#DCEFF3] text-[11px] text-[#4F685B]">
                <Lock className="w-4 h-4 text-[#2F7D53] shrink-0 mt-0.5" />
                <span>
                  Your personal identity data is transmitted over encrypted TLS channels and never stored in plain text.
                  Swiftvero Express complies with the Nigeria Data Protection Act (NDPA) and NCAA cargo security mandates.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: METHOD FORM */}
          {activeStep === 'form' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCEFF3]">
                <button
                  onClick={() => setActiveStep('select_method')}
                  className="text-xs font-semibold text-[#2F7D53] hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Choose a different method</span>
                </button>
                <span className="text-xs font-semibold text-[#6A808C] uppercase tracking-wider">
                  {selectedMethod === 'nin'
                    ? 'NIN Verification'
                    : selectedMethod === 'bvn'
                    ? 'BVN Verification'
                    : 'International Passport'}
                </span>
              </div>

              {/* Method 1: NIN */}
              {selectedMethod === 'nin' && (
                <div className="space-y-3.5">
                  <p className="text-xs text-[#6A808C]">
                    Your NIN will be securely checked through an authorised identity verification service.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D2922] mb-1">
                      National Identification Number (NIN)
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={ninNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setNinNumber(val);
                      }}
                      placeholder="e.g. 29384756102"
                      className="w-full px-3 py-2.5 text-sm font-mono tracking-wider border border-[#DCEFF3] rounded-lg focus:border-[#2F7D53] focus:outline-hidden bg-[#F5FAF6] text-[#1D2922]"
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-[#6A808C]">
                      <span>Exactly 11 numeric digits</span>
                      <span className={ninNumber.length === 11 ? 'text-[#2F7D53] font-bold' : 'text-amber-600'}>
                        {ninNumber.length}/11 digits
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F5FAF6] rounded-lg border border-[#DCEFF3] text-xs text-[#4F685B] space-y-1">
                    <div className="font-semibold text-[#1D2922]">Profile Identity Match:</div>
                    <div>Account Name: <span className="font-bold text-[#1D2922]">{currentCustomer.name}</span></div>
                    <div>Registered Phone: <span className="font-bold text-[#1D2922]">{currentCustomer.phone}</span></div>
                  </div>
                </div>
              )}

              {/* Method 2: BVN */}
              {selectedMethod === 'bvn' && (
                <div className="space-y-3.5">
                  <p className="text-xs text-[#6A808C]">
                    Your BVN will be securely checked through an authorised verification provider.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D2922] mb-1">
                      Bank Verification Number (BVN)
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={bvnNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setBvnNumber(val);
                      }}
                      placeholder="e.g. 22194857391"
                      className="w-full px-3 py-2.5 text-sm font-mono tracking-wider border border-[#DCEFF3] rounded-lg focus:border-[#2F7D53] focus:outline-hidden bg-[#F5FAF6] text-[#1D2922]"
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-[#6A808C]">
                      <span>Exactly 11 numeric digits</span>
                      <span className={bvnNumber.length === 11 ? 'text-[#2F7D53] font-bold' : 'text-amber-600'}>
                        {bvnNumber.length}/11 digits
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span>
                      Swiftvero Express will NEVER ask for your bank password, card PIN, ATM PIN, or internet banking credentials.
                      BVN is only used to verify your full legal name and date of birth with NIBSS.
                    </span>
                  </div>
                </div>
              )}

              {/* Method 3: Passport */}
              {selectedMethod === 'passport' && (
                <div className="space-y-3.5">
                  <p className="text-xs text-[#6A808C]">
                    Upload a clear photo of your passport biodata page or use camera capture.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1D2922] mb-1">Passport Issuing Country</label>
                      <select
                        value={passportCountry}
                        onChange={(e) => setPassportCountry(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-lg focus:border-[#2F7D53] focus:outline-hidden bg-[#F5FAF6] text-[#1D2922]"
                      >
                        <option value="Nigeria">Nigeria</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="Ghana">Ghana</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1D2922] mb-1">Passport Number</label>
                      <input
                        type="text"
                        value={passportNumber}
                        onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. A09823411"
                        className="w-full px-3 py-2 text-xs font-mono border border-[#DCEFF3] rounded-lg focus:border-[#2F7D53] focus:outline-hidden bg-[#F5FAF6] text-[#1D2922]"
                      >
                      </input>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D2922] mb-1">Document Expiry Date</label>
                    <input
                      type="date"
                      value={passportExpiry}
                      onChange={(e) => setPassportExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-lg focus:border-[#2F7D53] focus:outline-hidden bg-[#F5FAF6] text-[#1D2922]"
                    />
                  </div>

                  {/* Upload Dropzone */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D2922] mb-1">
                      Passport Biodata Page (JPEG, PNG or PDF)
                    </label>
                    <div className="border-2 border-dashed border-[#2F7D53]/40 rounded-xl p-4 bg-[#F5FAF6] flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#EAF6EE] text-[#2F7D53] flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#1D2922]">{uploadedFile}</span>
                        <p className="text-[11px] text-[#6A808C]">Resolution verified: 300 DPI · Machine Readable Zone (MRZ) detected</p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setUploadedFile(`passport_scan_${Date.now().toString().slice(-4)}.jpg`)}
                          className="px-2.5 py-1 text-[11px] font-semibold border border-[#2F7D53] text-[#2F7D53] rounded-md hover:bg-[#EAF6EE]"
                        >
                          Replace File
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadedFile(`camera_capture_live_${Date.now().toString().slice(-4)}.jpg`)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-[#2F7D53] text-white rounded-md hover:bg-[#174B35] flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Simulate Camera</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#1D2922]">
                  <input
                    type="checkbox"
                    checked={explicitConsent}
                    onChange={(e) => setExplicitConsent(e.target.checked)}
                    className="mt-0.5 text-[#2F7D53] rounded border-[#DCEFF3] focus:ring-[#2F7D53]"
                  />
                  <span>
                    I give explicit consent to Swiftvero Express and authorised verification partners to verify my identity details
                    against statutory government registries for export compliance and fraud prevention.
                  </span>
                </label>
              </div>

              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#DCEFF3]">
                <button
                  type="button"
                  onClick={() => setActiveStep('select_method')}
                  className="px-3.5 py-2 text-xs font-semibold text-[#6A808C] hover:text-[#1D2922]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  className="px-5 py-2.5 bg-[#2F7D53] hover:bg-[#174B35] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <span>Verify Identity</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMITTING / SPINNER */}
          {activeStep === 'submitting' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-[#EAF6EE] border-t-[#2F7D53] animate-spin flex items-center justify-center text-[#2F7D53]">
                <RefreshCw className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#1D2922]">Contacting Verification Gateway...</h4>
                <p className="text-xs text-[#6A808C] max-w-sm">
                  Connecting to {selectedMethod === 'nin' ? 'NIMC statutory API' : selectedMethod === 'bvn' ? 'NIBSS Central Directory' : 'Immigration Document Registry'} for biometric match and sanctions screening.
                </p>
              </div>
              <div className="text-[11px] text-[#2F7D53] font-semibold bg-[#EAF6EE] px-3 py-1 rounded-full">
                Secure 256-bit TLS encrypted session
              </div>
            </div>
          )}

          {/* STEP 4: VERIFICATION RESULT */}
          {activeStep === 'result' && verificationResult && (
            <div className="space-y-5">
              {/* SUCCESS */}
              {verificationResult.status === 'verified' && (
                <div className="text-center space-y-3 p-6 bg-[#EAF6EE] border border-[#2F7D53]/20 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-[#2F7D53] text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1D2922]">Identity Successfully Verified</h4>
                    <p className="text-xs text-[#2F7D53] font-medium mt-1">
                      Your identity has been successfully verified. You can continue using Swiftvero Express.
                    </p>
                  </div>
                  <div className="text-left bg-white p-3.5 rounded-xl border border-[#DCEFF3] text-xs space-y-1.5 mt-3">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#6A808C]">Verification Method:</span>
                      <span className="font-bold text-[#1D2922] uppercase">{verificationResult.method}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#6A808C]">Masked Reference:</span>
                      <span className="font-mono font-bold text-[#1D2922]">{verificationResult.maskedId}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#6A808C]">Provider Authority:</span>
                      <span className="font-medium text-[#1D2922]">{verificationResult.providerName}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#6A808C]">Audit Reference:</span>
                      <span className="font-mono text-[11px] text-[#2F7D53]">{verificationResult.auditReference}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* MANUAL REVIEW */}
              {verificationResult.status === 'manual_review' && (
                <div className="text-center space-y-3 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1D2922]">Submitted for Manual Review</h4>
                    <p className="text-xs text-blue-800 font-medium mt-1">
                      Your document has been submitted for review. We will notify you when the review is complete.
                    </p>
                  </div>
                  <div className="text-left bg-white p-3.5 rounded-xl border border-blue-100 text-xs space-y-1.5 mt-3">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#6A808C]">Assessor Queue:</span>
                      <span className="font-bold text-[#1D2922]">Swiftvero Security & Compliance Desk</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#6A808C]">Audit Reference:</span>
                      <span className="font-mono text-[11px] text-blue-700">{verificationResult.auditReference}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FAILED */}
              {verificationResult.status === 'failed' && (
                <div className="text-center space-y-3 p-6 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1D2922]">Verification Unsuccessful</h4>
                    <p className="text-xs text-red-700 font-medium mt-1">
                      We could not verify your information. Please check your details or use another verification method.
                    </p>
                  </div>
                  <div className="text-left bg-white p-3.5 rounded-xl border border-red-100 text-xs text-red-800">
                    <p className="font-medium">{verificationResult.message}</p>
                    <p className="text-[11px] text-[#6A808C] mt-1">Reference: {verificationResult.auditReference}</p>
                  </div>
                </div>
              )}

              {/* SERVICE TIMEOUT / UNAVAILABLE */}
              {verificationResult.status === 'verification_service_unavailable' && (
                <div className="text-center space-y-3 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <RefreshCw className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1D2922]">Verification Service Unavailable</h4>
                    <p className="text-xs text-amber-800 font-medium mt-1">
                      {verificationResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* ADDITIONAL INFO REQUIRED */}
              {verificationResult.status === 'additional_info_required' && (
                <div className="text-center space-y-3 p-6 bg-purple-50 border border-purple-200 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <Info className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1D2922]">Additional Information Required</h4>
                    <p className="text-xs text-purple-800 font-medium mt-1">
                      {verificationResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#DCEFF3]">
                {verificationResult.status !== 'verified' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleResetAndRetry}
                      className="px-4 py-2 border border-[#DCEFF3] hover:bg-slate-50 text-xs font-semibold rounded-lg text-[#1D2922] flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Verification</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2 bg-[#2F7D53] text-white text-xs font-bold rounded-lg hover:bg-[#174B35]"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 bg-[#2F7D53] hover:bg-[#174B35] text-white text-xs font-bold rounded-lg shadow-sm transition-colors text-center"
                  >
                    Continue to Swiftvero Services
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
