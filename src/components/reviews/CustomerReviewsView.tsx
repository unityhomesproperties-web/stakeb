import React, { useState, useRef } from 'react';
import { useDemo } from '../../context/DemoContext';
import { canSubmitReviewForShipment, getPublicApprovedReviews } from '../../utils/review-rules';
import { verifyGuestLookupOtp } from '../../utils/quote-lifecycle';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Camera,
  Upload,
  X,
  ZoomIn,
  Lock,
} from 'lucide-react';

interface CustomerReviewsViewProps {
  initialShipmentId?: string;
}

export const CustomerReviewsView: React.FC<CustomerReviewsViewProps> = ({ initialShipmentId }) => {
  const { role, reviews, shipments, currentCustomer, submitReview } = useDemo();

  const isGuest = role === 'visitor';

  const myDeliveredShipments = shipments.filter(
    (s) => s.status === 'delivered' && s.customerId === currentCustomer.id
  );
  const eligibleDelivered = myDeliveredShipments.filter(
    (s) =>
      canSubmitReviewForShipment({
        shipment: s,
        existingReviews: reviews,
        customerId: currentCustomer.id,
      }).eligible
  );

  // Guest verification state (when not signed in)
  const [guestTrackingInput, setGuestTrackingInput] = useState('');
  const [guestOtpInput, setGuestOtpInput] = useState('');
  const [guestVerifiedShipmentId, setGuestVerifiedShipmentId] = useState<string>('');
  const [guestVerifyMsg, setGuestVerifyMsg] = useState<string>('');

  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(
    initialShipmentId || eligibleDelivered[0]?.id || ''
  );
  const [ratingOverall, setRatingOverall] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingSpeed, setRatingSpeed] = useState(5);
  const [ratingCondition, setRatingCondition] = useState(5);
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [displayName, setDisplayName] = useState(isGuest ? '' : currentCustomer.name);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [submittedNotice, setSubmittedNotice] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [photoErrorMsg, setPhotoErrorMsg] = useState('');
  const [activeZoomPhoto, setActiveZoomPhoto] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'with_photos' | 'five_star'>('all');
  // Unpreselected consent checkbox
  const [publicConsentGiven, setPublicConsentGiven] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTargetId = isGuest ? guestVerifiedShipmentId : selectedShipmentId;
  const currentDelivered = shipments.find((s) => s.id === activeTargetId);

  const handleGuestVerify = () => {
    const match = shipments.find(
      (s) => s.trackingNumber.toUpperCase() === guestTrackingInput.trim().toUpperCase()
    );
    if (!match) {
      setGuestVerifyMsg('Shipment code not found.');
      return;
    }
    if (match.status !== 'delivered') {
      setGuestVerifyMsg('Reviews can only be submitted after delivery confirmation.');
      return;
    }
    if (!verifyGuestLookupOtp(guestOtpInput)) {
      setGuestVerifyMsg('Enter verification code 123456 (Demo OTP).');
      return;
    }
    setGuestVerifiedShipmentId(match.id);
    setDisplayName(match.senderName);
    setGuestVerifyMsg('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoErrorMsg('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedPhotos.length + files.length > 3) {
      setPhotoErrorMsg('You can attach at most 3 photos per review.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024;

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setPhotoErrorMsg(`"${file.name}" is not a supported format (use JPG, PNG, or WebP).`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setPhotoErrorMsg(`"${file.name}" exceeds the 5MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedPhotos((prev) => (prev.length >= 3 ? prev : [...prev, event.target!.result as string]));
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (idxToRemove: number) => {
    setUploadedPhotos((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetId || !currentDelivered) {
      setErrorMsg('Please select or verify a completed delivered shipment.');
      return;
    }
    if (!writtenFeedback.trim()) {
      setErrorMsg('Please share written feedback about your delivery.');
      return;
    }

    const res = submitReview(
      {
        shipmentId: currentDelivered.id,
        trackingNumber: currentDelivered.trackingNumber,
        customerId: currentDelivered.customerId,
        customerName: displayName.trim() || currentCustomer.name,
        verifiedShipment: true,
        ratingOverall,
        ratingCommunication,
        ratingSpeed,
        ratingCondition,
        writtenFeedback: writtenFeedback.trim(),
        photoUrls: uploadedPhotos,
        photoUrl: uploadedPhotos[0] || undefined,
        publicConsentGiven,
        status: 'pending',
        moderationStatus: 'pending_review',
      },
      { isVerifiedGuest: isGuest }
    );

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setSubmittedNotice(res.message);
    setErrorMsg('');
    setWrittenFeedback('');
    setUploadedPhotos([]);
  };

  const renderStars = (rating: number, onChange?: (val: number) => void) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          aria-label={`Rate ${star} out of 5`}
          className={`p-0.5 ${onChange ? 'hover:scale-110 transition-transform cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-[#00B4D8] text-[#00B4D8]'
                : 'text-slate-300 dark:text-slate-600 fill-slate-100 dark:fill-slate-800'
            }`}
          />
        </button>
      ))}
    </div>
  );

  // Publicly approved reviews vs Customer's own pending/moderated reviews
  const publicApproved = getPublicApprovedReviews(reviews);
  const myPendingOrModerated = !isGuest
    ? reviews.filter(
        (r) =>
          (r.customerId === currentCustomer.id ||
            myDeliveredShipments.some((s) => s.id === r.shipmentId)) &&
          !(r.status === 'published' && r.moderationStatus === 'approved')
      )
    : [];

  const displayedPublic = publicApproved.filter((rev) => {
    if (filterMode === 'with_photos') {
      return (rev.photoUrls && rev.photoUrls.length > 0) || Boolean(rev.photoUrl);
    }
    if (filterMode === 'five_star') {
      return rev.ratingOverall === 5;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#008EA8] dark:text-[#90E0EF]">
            Verified Delivery Feedback
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            How was your shipping experience?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            Only senders with a confirmed delivered shipment can submit a verified review (one review per completed shipment). All submissions enter moderation before public display.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-[#CAF0F8]/60 dark:bg-sky-950/50 text-[#008EA8] dark:text-[#90E0EF] px-3 py-2 rounded-xl border border-[#90E0EF] dark:border-sky-800 font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#00B4D8]" />
          <span>1 Verified Review per Delivery</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Review Submission Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Submit Your Delivery Review
          </h3>

          {submittedNotice ? (
            <div className="p-5 bg-[#CAF0F8]/40 dark:bg-sky-950/40 border border-[#90E0EF] dark:border-sky-800 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#008EA8] dark:text-[#90E0EF] mx-auto" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Submitted for Moderation
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {submittedNotice}
              </p>
              <button
                type="button"
                onClick={() => setSubmittedNotice('')}
                className="px-4 py-2 text-xs font-bold text-[#008EA8] dark:text-[#90E0EF] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Shipment Verification / Selector */}
              {isGuest ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Lock className="w-3.5 h-3.5 text-[#00B4D8]" />
                    <span>Verify Completed Shipment (Guest)</span>
                  </div>
                  <input
                    type="text"
                    value={guestTrackingInput}
                    onChange={(e) => setGuestTrackingInput(e.target.value)}
                    placeholder="Tracking code (e.g. SWV-2026-NG3102)"
                    className="w-full px-3 py-2 font-mono uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guestOtpInput}
                      onChange={(e) => setGuestOtpInput(e.target.value)}
                      placeholder="OTP (Demo: 123456)"
                      className="flex-1 px-3 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleGuestVerify}
                      className="px-3 py-2 bg-[#00B4D8] text-white font-bold rounded-lg"
                    >
                      Verify
                    </button>
                  </div>
                  {guestVerifyMsg && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">{guestVerifyMsg}</p>
                  )}
                  {currentDelivered && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      Verified: {currentDelivered.trackingNumber} ({currentDelivered.destinationCountry})
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Eligible Delivered Shipment *
                  </label>
                  {eligibleDelivered.length > 0 ? (
                    <select
                      value={selectedShipmentId}
                      onChange={(e) => setSelectedShipmentId(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#00B4D8] focus:outline-hidden"
                    >
                      {eligibleDelivered.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.trackingNumber} — {s.destinationCity}, {s.destinationCountry}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                      {myDeliveredShipments.length > 0
                        ? 'All delivered shipments on this account have already been reviewed.'
                        : 'No delivered shipments found yet on this account. Once a shipment reaches Delivered status, you can rate it here.'}
                    </div>
                  )}
                </div>
              )}

              {/* Ratings */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">Overall Rating</span>
                  {renderStars(ratingOverall, setRatingOverall)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Communication Clarity</span>
                  {renderStars(ratingCommunication, setRatingCommunication)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Delivery Speed vs Quote</span>
                  {renderStars(ratingSpeed, setRatingSpeed)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Condition on Arrival</span>
                  {renderStars(ratingCondition, setRatingCondition)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Experience *
                </label>
                <textarea
                  rows={3}
                  value={writtenFeedback}
                  onChange={(e) => setWrittenFeedback(e.target.value)}
                  placeholder="Share honest feedback on pickup, weight quote clarity, tracking updates, and delivery condition..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#00B4D8] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#00B4D8] focus:outline-hidden"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Arrival Photos (Optional, max 3)
                  </label>
                  <span className="text-[10px] text-slate-500">{uploadedPhotos.length} / 3</span>
                </div>
                {photoErrorMsg && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">{photoErrorMsg}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                {uploadedPhotos.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-[#90E0EF] dark:border-sky-800 rounded-xl bg-[#CAF0F8]/15 dark:bg-sky-950/20 hover:bg-[#CAF0F8]/30 text-center space-y-1"
                  >
                    <Upload className="w-5 h-5 text-[#00B4D8] mx-auto" />
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Attach Arrival Photos
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      JPG, PNG or WebP up to 5MB each
                    </span>
                  </button>
                )}

                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedPhotos.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={img} alt={`Arrival proof ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full"
                          aria-label="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicConsentGiven}
                  onChange={(e) => setPublicConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded text-[#00B4D8]"
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  I consent to my review, display name, and optional photos appearing publicly on Swiftvero Express after moderation approval.
                </span>
              </label>

              <button
                type="submit"
                disabled={!currentDelivered}
                className={`w-full min-h-[44px] py-2.5 text-xs font-bold text-white rounded-xl transition-colors ${
                  currentDelivered
                    ? 'bg-[#00B4D8] hover:bg-[#009BB8]'
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                }`}
              >
                Submit Review for Moderation
              </button>
            </form>
          )}
        </div>

        {/* Right: Your Submissions + Approved Public Reviews */}
        <div className="lg:col-span-7 space-y-5">
          {myPendingOrModerated.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Reviews in Moderation ({myPendingOrModerated.length})
              </h3>
              {myPendingOrModerated.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {rev.trackingNumber}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      {(rev.moderationStatus || rev.status).replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{rev.writtenFeedback}</p>
                  {rev.disputeNote && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      Moderation Note: {rev.disputeNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Approved Verified Reviews ({publicApproved.length})
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Negative and positive genuine feedback is preserved transparently.
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                {[
                  { id: 'all', label: `All (${publicApproved.length})` },
                  { id: 'with_photos', label: 'With Photos' },
                  { id: 'five_star', label: '5★ Rated' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterMode(f.id as any)}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      filterMode === f.id
                        ? 'bg-[#00B4D8] text-white font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {displayedPublic.map((rev) => {
              const reviewPhotos =
                rev.photoUrls && rev.photoUrls.length > 0
                  ? rev.photoUrls
                  : rev.photoUrl
                  ? [rev.photoUrl]
                  : [];

              return (
                <div
                  key={rev.id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {rev.customerName}
                      </span>
                      {rev.verifiedShipment && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#008EA8] dark:text-[#90E0EF] bg-[#CAF0F8]/60 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-[#90E0EF] dark:border-sky-800">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Shipment ({rev.trackingNumber})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {rev.createdAt.slice(0, 10)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1">
                      {renderStars(rev.ratingOverall)}
                      <span className="font-bold text-slate-900 dark:text-white ml-1">
                        {rev.ratingOverall}.0
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                      <span>Comms: <strong className="text-slate-900 dark:text-white">{rev.ratingCommunication}/5</strong></span>
                      <span>·</span>
                      <span>Speed: <strong className="text-slate-900 dark:text-white">{rev.ratingSpeed}/5</strong></span>
                      <span>·</span>
                      <span>Condition: <strong className="text-slate-900 dark:text-white">{rev.ratingCondition}/5</strong></span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {rev.writtenFeedback}
                  </p>

                  {reviewPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {reviewPhotos.map((imgUrl, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setActiveZoomPhoto(imgUrl)}
                          className="relative w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden group"
                        >
                          <img src={imgUrl} alt={`Arrival proof ${pIdx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {rev.companyResponse && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                      <div className="font-semibold text-[#008EA8] dark:text-[#90E0EF] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#00B4D8]" />
                        <span>Swiftvero Logistics Desk Response</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-5">
                        {rev.companyResponse}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {displayedPublic.length === 0 && (
              <div className="p-8 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400">
                No approved reviews match this filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {activeZoomPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveZoomPhoto(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveZoomPhoto(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full z-10"
              aria-label="Close zoomed photo"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={activeZoomPhoto} alt="Enlarged shipment arrival proof" className="w-full max-h-[75vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
