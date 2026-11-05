import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  ShieldAlert,
  Plus,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  X,
  FileCheck,
  Camera,
  ArrowRight,
  ChevronRight,
  Filter,
  DollarSign,
  UserCheck,
  Check,
  XCircle,
  FileWarning,
  Eye,
  Sliders,
} from 'lucide-react';
import { SupportClaim, ClaimStatus } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';

interface ClaimsManagementViewProps {
  initialTracking?: string;
}

export const ClaimsManagementView: React.FC<ClaimsManagementViewProps> = ({ initialTracking }) => {
  const {
    supportClaims,
    addSupportClaim,
    updateSupportClaimStatus,
    currentCustomer,
    shipments,
    role,
  } = useDemo();

  const [showFileClaimModal, setShowFileClaimModal] = useState(false);
  const [selectedClaimDetails, setSelectedClaimDetails] = useState<SupportClaim | null>(null);
  const [successClaimNumber, setSuccessClaimNumber] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'approved' | 'settled'>('all');

  // Form states
  const [selectedTracking, setSelectedTracking] = useState(initialTracking || (shipments[0]?.trackingNumber || ''));
  const [incidentType, setIncidentType] = useState<'damaged_contents' | 'missing_items' | 'total_loss' | 'delay'>('damaged_contents');
  const [itemsClaimed, setItemsClaimed] = useState('');
  const [description, setDescription] = useState('');
  const [requestedAmountNgn, setRequestedAmountNgn] = useState<number>(50000);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedDocName, setUploadedDocName] = useState('');

  // Admin Review Modal state
  const [adminReviewModalClaim, setAdminReviewModalClaim] = useState<SupportClaim | null>(null);
  const [adminNextStatus, setAdminNextStatus] = useState<ClaimStatus>('under_review');
  const [adminDecisionNote, setAdminDecisionNote] = useState('');
  const [adminApprovedAmount, setAdminApprovedAmount] = useState<number>(0);

  const myClaims = supportClaims.filter(
    (c) => c.customerId === currentCustomer.id || currentCustomer.customerType === 'business' || role === 'platform_admin' || role === 'operations' || role === 'super_admin' || role === 'owner'
  );

  const filteredClaims = myClaims.filter((c) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return ['submitted', 'under_review', 'additional_info_required', 'accepted'].includes(c.status);
    if (filterStatus === 'approved') return ['approved_for_compensation', 'payment_processing'].includes(c.status);
    if (filterStatus === 'settled') return ['settled', 'closed'].includes(c.status);
    return true;
  });

  const handleSimulatePhotoUpload = () => {
    const samplePhotos = [
      '/assets/aistudio/IMG_1995_d35e33d0.jpeg',
      '/assets/aistudio/IMG_1994_fa0341f9.jpeg',
    ];
    setUploadedPhotos((prev) => [...prev, samplePhotos[prev.length % samplePhotos.length]]);
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !selectedTracking.trim()) return;

    const matchedShipment = shipments.find((s) => s.trackingNumber === selectedTracking);

    const claimNum = addSupportClaim({
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerEmail: currentCustomer.email,
      shipmentTracking: selectedTracking.trim(),
      type: incidentType,
      incidentType: incidentType,
      itemsClaimed: itemsClaimed.trim() || 'Consignment parcel contents',
      description: description.trim(),
      declaredValueNgn: matchedShipment?.declaredValueNgn || Number(requestedAmountNgn) || 0,
      requestedAmountNgn: Number(requestedAmountNgn) || 0,
      evidenceAttached: uploadedPhotos.length > 0 || Boolean(uploadedDocName),
      evidenceFileName: uploadedDocName || (uploadedPhotos.length > 0 ? `${uploadedPhotos.length} Photos Attached` : undefined),
      photoUrls: uploadedPhotos,
    });

    setShowFileClaimModal(false);
    setSuccessClaimNumber(claimNum);
    setDescription('');
    setItemsClaimed('');
    setUploadedPhotos([]);
    setUploadedDocName('');
  };

  const handleOpenAdminReview = (claim: SupportClaim) => {
    setAdminReviewModalClaim(claim);
    setAdminNextStatus(claim.status);
    setAdminApprovedAmount(claim.approvedAmountNgn || claim.requestedAmountNgn || claim.declaredValueNgn);
    setAdminDecisionNote(claim.decisionNotes || '');
  };

  const handleSaveAdminDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReviewModalClaim) return;

    updateSupportClaimStatus(
      adminReviewModalClaim.id,
      adminNextStatus,
      adminDecisionNote || `Status updated to ${adminNextStatus.replace(/_/g, ' ')} by claims assessor.`,
      ['approved_for_compensation', 'payment_processing', 'settled'].includes(adminNextStatus)
        ? Number(adminApprovedAmount)
        : undefined
    );

    setAdminReviewModalClaim(null);
  };

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">Draft</span>;
      case 'submitted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">Submitted</span>;
      case 'under_review':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Under Review</span>;
      case 'additional_info_required':
      case 'awaiting_customer_info':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">Action Required</span>;
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Accepted</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Rejected</span>;
      case 'approved_for_compensation':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Compensation Approved</span>;
      case 'payment_processing':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">Payment Processing</span>;
      case 'settled':
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF6EE] text-[#247347] border border-[#2F7D53]/30">Settled (Paid)</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DCE8DF] p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE8DF]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF6EE] text-[#2F7D53] flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1D2922]">
              Claims Management &amp; Cargo Protection Desk
            </h2>
          </div>
          <p className="text-xs text-[#66736B]">
            Report missing, damaged, or delayed parcels with photographic evidence and auditable tracking.
          </p>
        </div>

        <button
          onClick={() => setShowFileClaimModal(true)}
          className="px-4 py-2.5 bg-[#2F7D53] hover:bg-[#174B35] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>File a Formal Claim</span>
        </button>
      </div>

      {/* Success Notification */}
      {successClaimNumber && (
        <div className="bg-[#EAF6EE] border border-[#2F7D53]/40 rounded-xl p-4 text-xs text-[#1D2922] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#247347]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2F7D53]" />
            <span>Formal Claim Lodged Successfully</span>
          </div>
          <p className="text-[#66736B] leading-relaxed">
            Your claim reference is <strong className="font-mono text-[#247347]">{successClaimNumber}</strong>. Our Claims &amp; Underwriting Desk reviews your photographic evidence against physical intake logs and responds within 24–48 business hours.
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#DCE8DF] pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterStatus === 'all'
                ? 'bg-[#2F7D53] text-white'
                : 'bg-[#F5FAF6] text-[#66736B] hover:text-[#1D2922]'
            }`}
          >
            All Claims ({myClaims.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterStatus === 'active'
                ? 'bg-[#2F7D53] text-white'
                : 'bg-[#F5FAF6] text-[#66736B] hover:text-[#1D2922]'
            }`}
          >
            In Review ({myClaims.filter((c) => ['submitted', 'under_review', 'additional_info_required'].includes(c.status)).length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterStatus === 'approved'
                ? 'bg-[#2F7D53] text-white'
                : 'bg-[#F5FAF6] text-[#66736B] hover:text-[#1D2922]'
            }`}
          >
            Approved ({myClaims.filter((c) => ['approved_for_compensation', 'payment_processing'].includes(c.status)).length})
          </button>
          <button
            onClick={() => setFilterStatus('settled')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterStatus === 'settled'
                ? 'bg-[#2F7D53] text-white'
                : 'bg-[#F5FAF6] text-[#66736B] hover:text-[#1D2922]'
            }`}
          >
            Settled ({myClaims.filter((c) => ['settled', 'resolved', 'closed'].includes(c.status)).length})
          </button>
        </div>

        <div className="text-[11px] text-[#66736B] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#2F7D53]" />
          <span>Claim Filing Window: 14 days from delivery / 21 days for loss</span>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.map((claim) => (
          <div
            key={claim.id}
            className="border border-[#DCE8DF] rounded-xl p-5 hover:border-[#2F7D53]/50 transition-all space-y-4 bg-white"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#DCE8DF]/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-[#1D2922]">
                    {claim.claimNumber}
                  </span>
                  {getStatusBadge(claim.status)}
                </div>
                <div className="text-xs text-[#66736B]">
                  Linked Consignment: <strong className="font-mono text-[#1D2922]">{claim.shipmentTracking}</strong> · Filed on {claim.createdAt.slice(0, 10)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#66736B] block">Claimed Amount:</span>
                <span className="font-mono font-bold text-sm text-[#1D2922]">
                  {formatNaira(claim.requestedAmountNgn || claim.declaredValueNgn)}
                </span>
                {claim.approvedAmountNgn && (
                  <span className="text-[11px] font-bold text-[#247347] block font-mono">
                    Approved: {formatNaira(claim.approvedAmountNgn)}
                  </span>
                )}
              </div>
            </div>

            {/* Description & items claimed */}
            <div className="space-y-2 text-xs">
              <div className="bg-[#F5FAF6] p-3 rounded-lg border border-[#DCE8DF] space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#66736B]">
                  <span>Incident Category: <strong className="capitalize text-[#1D2922]">{(claim.incidentType || claim.type).replace(/_/g, ' ')}</strong></span>
                  {claim.itemsClaimed && <span>Items: <strong className="text-[#1D2922]">{claim.itemsClaimed}</strong></span>}
                </div>
                <p className="text-[#1D2922] leading-relaxed">
                  {claim.description}
                </p>
              </div>

              {/* Assessor Decision Notes if present */}
              {claim.decisionNotes && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] text-[#1D2922] space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#247347]">
                    <span>Assessor Decision Note ({claim.reviewedBy || 'Claims Desk'})</span>
                    <span className="text-[10px] text-[#66736B] font-mono">{claim.updatedAt?.slice(0, 10)}</span>
                  </div>
                  <p className="text-[#66736B]">{claim.decisionNotes}</p>
                </div>
              )}
            </div>

            {/* Evidence Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-[#66736B]">
              <div className="flex items-center gap-3">
                {claim.evidenceAttached && (
                  <span className="flex items-center gap-1 text-[#247347] font-semibold">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{claim.evidenceFileName || 'Photographic Proof Attached'}</span>
                  </span>
                )}
                {claim.photoUrls && claim.photoUrls.length > 0 && (
                  <span className="flex items-center gap-1 text-[#2F7D53] font-semibold">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{claim.photoUrls.length} Photo{claim.photoUrls.length > 1 ? 's' : ''} Uploaded</span>
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClaimDetails(claim)}
                  className="px-3 py-1.5 border border-[#DCE8DF] rounded-lg text-xs font-semibold text-[#1D2922] hover:bg-[#F5FAF6] flex items-center gap-1"
                >
                  <Eye className="w-3 h-3 text-[#2F7D53]" />
                  <span>View Timeline ({claim.history?.length || 1})</span>
                </button>

                {/* Admin / Assessor Review Trigger */}
                <button
                  type="button"
                  onClick={() => handleOpenAdminReview(claim)}
                  className="px-3 py-1.5 bg-[#EAF6EE] border border-[#2F7D53]/30 rounded-lg text-xs font-bold text-[#247347] hover:bg-[#EAF6EE]/80 flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Update Decision</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredClaims.length === 0 && (
          <div className="p-8 text-center text-xs text-[#66736B] space-y-2 border border-dashed border-[#DCE8DF] rounded-xl">
            <p>No claims found under the selected filter.</p>
            <p className="text-[11px]">
              If you experience any damage, shortage, or delay, you can file a formal claim anytime.
            </p>
          </div>
        )}
      </div>

      {/* File Formal Claim Modal */}
      {showFileClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#DCE8DF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#EAF6EE] border-b border-[#DCE8DF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#2F7D53]" />
                <h3 className="text-sm font-bold text-[#1D2922]">File a Formal Shipment Claim</h3>
              </div>
              <button
                onClick={() => setShowFileClaimModal(false)}
                className="p-1 rounded-md text-[#66736B] hover:text-[#1D2922]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-[#1D2922]">
              <div>
                <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                  Select Consignment Tracking Number <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTracking}
                  onChange={(e) => setSelectedTracking(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs bg-white focus:outline-none focus:border-[#2F7D53]"
                  required
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.trackingNumber}>
                      {s.trackingNumber} — {s.destinationCity}, {s.destinationCountry} ({s.quote.serviceName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                    Incident Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg text-xs bg-white focus:outline-none focus:border-[#2F7D53]"
                  >
                    <option value="damaged_contents">Damaged Contents</option>
                    <option value="missing_items">Missing Items / Shortage</option>
                    <option value="total_loss">Total Consignment Loss</option>
                    <option value="delay">Overdue Carrier Delay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                    Claimed Compensation (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={requestedAmountNgn}
                    onChange={(e) => setRequestedAmountNgn(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                  Specific Items Affected <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemsClaimed}
                  onChange={(e) => setItemsClaimed(e.target.value)}
                  placeholder="e.g. 2 carved stone figurines, 1 silk agbada top"
                  className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg text-xs focus:outline-none focus:border-[#2F7D53]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                  Detailed Incident Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe package condition upon delivery, outer seal status, and extent of damage or missing pieces."
                  className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg text-xs focus:outline-none focus:border-[#2F7D53]"
                />
              </div>

              {/* Photographic & Document Proof Uploader */}
              <div className="p-4 bg-[#F5FAF6] rounded-xl border border-[#DCE8DF] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#1D2922]">
                    Photographs &amp; Invoices
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulatePhotoUpload}
                    className="text-xs font-bold text-[#2F7D53] hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Attach Photo</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {uploadedPhotos.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#DCE8DF]">
                      <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {uploadedPhotos.length === 0 && (
                    <div
                      onClick={handleSimulatePhotoUpload}
                      className="w-full py-4 border-2 border-dashed border-[#DCE8DF] rounded-xl text-center text-[#66736B] hover:border-[#2F7D53] cursor-pointer"
                    >
                      <Upload className="w-5 h-5 mx-auto text-[#2F7D53] mb-1" />
                      <span className="text-[11px] block">Click to upload photos of damaged carton &amp; contents</span>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    value={uploadedDocName}
                    onChange={(e) => setUploadedDocName(e.target.value)}
                    placeholder="Document proof name (e.g. commercial_invoice_receipt.pdf)"
                    className="w-full px-3 py-1.5 bg-white border border-[#DCE8DF] rounded-lg text-[11px]"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg text-[11px] text-amber-900">
                Notice: All claims are verified against origin depot weight logs and tamper-evident serial tape. False claims forfeit protection coverage under civil aviation guidelines.
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFileClaimModal(false)}
                  className="px-4 py-2 border border-[#DCE8DF] rounded-xl text-[#66736B] hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2F7D53] hover:bg-[#174B35] text-white font-bold rounded-xl shadow-sm"
                >
                  Submit Formal Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Detail & History Modal */}
      {selectedClaimDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#DCE8DF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#EAF6EE] border-b border-[#DCE8DF] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1D2922]">
                  Claim Timeline: {selectedClaimDetails.claimNumber}
                </h3>
                <span className="text-[11px] text-[#66736B]">
                  Consignment: {selectedClaimDetails.shipmentTracking}
                </span>
              </div>
              <button
                onClick={() => setSelectedClaimDetails(null)}
                className="p-1 rounded-md text-[#66736B] hover:text-[#1D2922]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#F5FAF6] rounded-xl border border-[#DCE8DF]">
                <div>
                  <span className="text-[11px] text-[#66736B] block">Current Status:</span>
                  <div className="mt-0.5">{getStatusBadge(selectedClaimDetails.status)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#66736B] block">Claimed:</span>
                  <span className="font-mono font-bold text-[#1D2922]">
                    {formatNaira(selectedClaimDetails.requestedAmountNgn || selectedClaimDetails.declaredValueNgn)}
                  </span>
                </div>
              </div>

              {/* History Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#66736B]">
                  Audit History &amp; Decision Logs
                </h4>
                <div className="border-l-2 border-[#DCE8DF] pl-4 space-y-4 ml-1">
                  {(selectedClaimDetails.history || [
                    {
                      status: selectedClaimDetails.status,
                      timestamp: selectedClaimDetails.createdAt.slice(0, 16),
                      actor: selectedClaimDetails.customerName || 'Consignor',
                      note: selectedClaimDetails.description,
                    },
                  ]).map((h, i) => (
                    <div key={i} className="relative space-y-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2F7D53] absolute -left-[21px] top-1" />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#1D2922] capitalize">
                          {h.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[#66736B] font-mono">{h.timestamp}</span>
                      </div>
                      <p className="text-[#66736B] text-[11px]">{h.note}</p>
                      <span className="text-[10px] text-[#2F7D53] font-medium block">by {h.actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-[#DCE8DF] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedClaimDetails(null)}
                className="px-4 py-1.5 bg-white border border-[#DCE8DF] rounded-lg text-xs font-semibold text-[#1D2922]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin / Assessor Review Decision Modal */}
      {adminReviewModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#DCE8DF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#EAF6EE] border-b border-[#DCE8DF] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1D2922]">
                  Assessor Decision: {adminReviewModalClaim.claimNumber}
                </h3>
                <span className="text-[11px] text-[#66736B]">
                  Consignor: {adminReviewModalClaim.customerName || 'Customer'}
                </span>
              </div>
              <button
                onClick={() => setAdminReviewModalClaim(null)}
                className="p-1 rounded-md text-[#66736B] hover:text-[#1D2922]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminDecision} className="p-6 overflow-y-auto space-y-4 text-xs text-[#1D2922]">
              <div>
                <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                  Update Workflow Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={adminNextStatus}
                  onChange={(e) => setAdminNextStatus(e.target.value as ClaimStatus)}
                  className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg text-xs bg-white focus:outline-none focus:border-[#2F7D53]"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under review</option>
                  <option value="additional_info_required">Additional information required</option>
                  <option value="accepted">Accepted (Liability Verified)</option>
                  <option value="approved_for_compensation">Approved for compensation</option>
                  <option value="payment_processing">Payment processing</option>
                  <option value="settled">Settled (Disbursed)</option>
                  <option value="rejected">Rejected (Exclusion Applies)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {['approved_for_compensation', 'payment_processing', 'settled'].includes(adminNextStatus) && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                    Approved Compensation Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={adminApprovedAmount}
                    onChange={(e) => setAdminApprovedAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg font-mono text-xs focus:outline-none focus:border-[#2F7D53]"
                  />
                  <span className="text-[10px] text-[#66736B] mt-0.5 block">
                    Claimed: {formatNaira(adminReviewModalClaim.requestedAmountNgn || adminReviewModalClaim.declaredValueNgn)}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#66736B] mb-1">
                  Assessor Decision Rationale &amp; Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={adminDecisionNote}
                  onChange={(e) => setAdminDecisionNote(e.target.value)}
                  placeholder="Record operational evidence checked (e.g. intake scale logs, external handling ramp reports)."
                  className="w-full px-3 py-2 border border-[#DCE8DF] rounded-lg text-xs focus:outline-none focus:border-[#2F7D53]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAdminReviewModalClaim(null)}
                  className="px-4 py-2 border border-[#DCE8DF] rounded-xl text-[#66736B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2F7D53] hover:bg-[#174B35] text-white font-bold rounded-xl shadow-sm"
                >
                  Save &amp; Log Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
