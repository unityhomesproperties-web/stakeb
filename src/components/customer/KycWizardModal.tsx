import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { PolicyKey } from '../common/LegalModal';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface KycWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPolicy: (key: PolicyKey) => void;
}

export const KycWizardModal: React.FC<KycWizardModalProps> = ({ isOpen, onClose, onOpenPolicy }) => {
  const { currentCustomer, updateCustomerKyc } = useDemo();

  const [step, setStep] = useState<number>(1);
  const [legalName, setLegalName] = useState(currentCustomer.name || 'Amara Okafor');
  const [dob, setDob] = useState('1990-06-15');
  const [address, setAddress] = useState('Plot 14 Admiralty Way, Lekki Phase 1, Lagos');
  const [stateOfResidence, setStateOfResidence] = useState('Lagos State');
  const [idType, setIdType] = useState('Nigerian International Passport');
  const [idNumber, setIdNumber] = useState('A09823411');
  const [uploadedFile, setUploadedFile] = useState<string>('passport_bio_page_amara.pdf');
  const [agreedCompliance, setAgreedCompliance] = useState(false);
  const [simulatedReviewOutcome, setSimulatedReviewOutcome] = useState<'submitted' | 'verified'>('verified');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = () => {
    updateCustomerKyc(simulatedReviewOutcome, idType, uploadedFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-[#DCEFF3] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCEFF3] bg-[#F5FBFD]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00B4D8]" />
            <div>
              <h3 className="text-sm font-bold text-[#354B55]">Identity Verification (KYC) Demonstration</h3>
              <p className="text-[11px] text-[#6A808C]">Step {step} of 5 · Statutory export compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6A808C] hover:text-[#354B55] p-1 rounded-md"
            aria-label="Close KYC modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#DCEFF3] h-1.5">
          <div
            className="bg-[#00B4D8] h-1.5 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Step 1: Basic Identity Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-[#354B55]">Step 1: Consignor Identity Details</h4>
                <p className="text-xs text-[#6A808C] mt-0.5">
                  Civil aviation regulations require sender legal details to match official government identification.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#354B55] mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden bg-[#F5FBFD] text-[#354B55]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#354B55] mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden bg-[#F5FBFD] text-[#354B55]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#354B55] mb-1">State of Residence</label>
                    <select
                      value={stateOfResidence}
                      onChange={(e) => setStateOfResidence(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden bg-[#F5FBFD] text-[#354B55]"
                    >
                      <option value="Lagos State">Lagos State</option>
                      <option value="Abuja (FCT)">Abuja (FCT)</option>
                      <option value="Kano State">Kano State</option>
                      <option value="Rivers State">Rivers State</option>
                      <option value="Oyo State">Oyo State</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#354B55] mb-1">Registered Residential / Dispatch Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden bg-[#F5FBFD] text-[#354B55]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Identification Type */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-[#354B55]">Step 2: Select Official Identification Type</h4>
                <p className="text-xs text-[#6A808C] mt-0.5">
                  Choose the document you will present during parcel custody verification.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    name: 'Nigerian International Passport',
                    desc: 'Standard bio-data page with valid expiration date.',
                  },
                  {
                    name: 'National Identity Number (NIN) Slip',
                    desc: 'Official NIMC slip with verifiable tracking QR code.',
                  },
                  {
                    name: 'FRSC National Driver’s Licence',
                    desc: 'Valid, unexpired driver’s licence issued by FRSC.',
                  },
                ].map((item) => (
                  <label
                    key={item.name}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      idType === item.name
                        ? 'border-[#00B4D8] bg-[#CAF0F8]/40'
                        : 'border-[#DCEFF3] hover:bg-[#F5FBFD]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="idType"
                      checked={idType === item.name}
                      onChange={() => setIdType(item.name)}
                      className="mt-0.5 text-[#00B4D8] focus:ring-[#00B4D8]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#354B55]">{item.name}</div>
                      <div className="text-[11px] text-[#6A808C]">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#354B55] mb-1">
                  Document Reference Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. A09823411 or 11-digit NIN"
                  className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden bg-[#F5FBFD] text-[#354B55]"
                />
              </div>
            </div>
          )}

          {/* Step 3: Document Attachment Simulation */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-[#354B55]">Step 3: Document Attachment Simulation</h4>
                <p className="text-xs text-[#6A808C] mt-0.5">
                  Simulate uploading a clear photo or PDF scan of your selected document.
                </p>
              </div>

              <div className="border-2 border-dashed border-[#DCEFF3] bg-[#F5FBFD] rounded-xl p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#CAF0F8] text-[#008EA8] flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5 text-[#00B4D8]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#354B55]">
                    {uploadedFile ? `Attached: ${uploadedFile}` : 'Select sample document to attach'}
                  </div>
                  <div className="text-[11px] text-[#6A808C] mt-0.5">
                    Accepted simulated formats: PDF, JPG, PNG (Max 5MB)
                  </div>
                </div>

                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setUploadedFile('passport_bio_page_amara.pdf')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white border border-[#DCEFF3] rounded hover:bg-[#CAF0F8]/50 text-[#354B55] transition-colors"
                  >
                    Simulate Passport Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadedFile('nin_verification_slip.pdf')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white border border-[#DCEFF3] rounded hover:bg-[#CAF0F8]/50 text-[#354B55] transition-colors"
                  >
                    Simulate NIN Slip
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-[#DCEFF3] text-[11px] text-[#6A808C] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                <span>
                  Demo notice: Real identity documents are never transmitted or saved in this environment. Fictional sample files are used for interactive testing.
                </span>
              </div>
            </div>
          )}

          {/* Step 4: Review and Consent */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-[#354B55]">Step 4: Review & Legal Acknowledgement</h4>
                <p className="text-xs text-[#6A808C] mt-0.5">
                  Confirm your details and acknowledge the statutory identity verification notice.
                </p>
              </div>

              <div className="bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Legal Name:</span>
                  <span className="font-semibold text-[#354B55]">{legalName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">ID Document Type:</span>
                  <span className="font-semibold text-[#354B55]">{idType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Document Number:</span>
                  <span className="font-semibold text-[#354B55] font-mono">{idNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                  <span className="text-[#6A808C]">Address:</span>
                  <span className="font-semibold text-[#354B55]">{address}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6A808C]">Simulated Attachment:</span>
                  <span className="font-semibold text-[#008EA8]">{uploadedFile}</span>
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-[#6A808C] cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={agreedCompliance}
                  onChange={(e) => setAgreedCompliance(e.target.checked)}
                  className="mt-0.5 rounded border-[#DCEFF3] text-[#00B4D8] focus:ring-[#00B4D8]"
                />
                <span>
                  I confirm the provided identity details are accurate and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => onOpenPolicy('kyc')}
                    className="text-[#00B4D8] underline font-medium"
                  >
                    KYC & Identity Verification Notice
                  </button>
                  .
                </span>
              </label>

              {/* Demo review outcome selector */}
              <div className="mt-3 p-2.5 bg-[#CAF0F8]/50 rounded-lg border border-[#90E0EF] text-xs space-y-1.5">
                <span className="font-semibold text-[#008EA8]">Test Demo State Result:</span>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="outcome"
                      checked={simulatedReviewOutcome === 'verified'}
                      onChange={() => setSimulatedReviewOutcome('verified')}
                      className="text-[#00B4D8]"
                    />
                    <span>Simulate Instant Approval (Verified)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="outcome"
                      checked={simulatedReviewOutcome === 'submitted'}
                      onChange={() => setSimulatedReviewOutcome('submitted')}
                      className="text-[#00B4D8]"
                    />
                    <span>Simulate Pending Review</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Submission & Result */}
          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#CAF0F8] text-[#008EA8] flex items-center justify-center mx-auto">
                {simulatedReviewOutcome === 'verified' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                ) : (
                  <Clock className="w-7 h-7 text-amber-500" />
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#354B55]">
                  {simulatedReviewOutcome === 'verified'
                    ? 'Identity Successfully Verified (Demo)'
                    : 'KYC Submitted for Operations Review'}
                </h4>
                <p className="text-xs text-[#6A808C] mt-1 max-w-sm mx-auto leading-relaxed">
                  {simulatedReviewOutcome === 'verified'
                    ? 'Your demo account is now approved for international shipping booking and carrier tender.'
                    : 'Your sample identity documents have been queued in the Operations Admin verification console.'}
                </p>
              </div>

              <div className="p-3 bg-[#F5FBFD] border border-[#DCEFF3] rounded-md text-xs text-[#354B55] max-w-xs mx-auto">
                <div className="font-medium">Audit Reference: KYC-{Date.now().toString().slice(-6)}</div>
                <div className="text-[11px] text-[#6A808C] mt-0.5">
                  Consignor: {legalName} · Document: {idType}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 border-t border-[#DCEFF3] bg-[#F5FBFD] flex items-center justify-between">
          <div>
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3 py-1.5 text-xs font-medium text-[#354B55] hover:bg-white rounded transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 && (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!agreedCompliance}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-md transition-colors flex items-center gap-1.5 shadow-xs ${
                  agreedCompliance
                    ? 'bg-[#00B4D8] hover:bg-[#0096B4]'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <span>Submit Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 5 && (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-md transition-colors shadow-xs"
              >
                Proceed to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
