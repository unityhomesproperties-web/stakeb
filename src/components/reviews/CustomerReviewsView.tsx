import React, { useState, useRef } from 'react';
import { useDemo } from '../../context/DemoContext';
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
  Image as ImageIcon,
  Sparkles,
  Filter,
} from 'lucide-react';

interface CustomerReviewsViewProps {
  initialShipmentId?: string;
}

export const CustomerReviewsView: React.FC<CustomerReviewsViewProps> = ({ initialShipmentId }) => {
  const { reviews, shipments, currentCustomer, submitReview } = useDemo();

  // Find delivered shipments belonging to current customer that can be reviewed
  const deliveredShipments = shipments.filter(
    (s) => s.status === 'delivered' && s.customerId === currentCustomer.id
  );

  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(
    initialShipmentId || deliveredShipments[0]?.id || ''
  );
  const [ratingOverall, setRatingOverall] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingSpeed, setRatingSpeed] = useState(5);
  const [ratingCondition, setRatingCondition] = useState(5);
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [displayName, setDisplayName] = useState(currentCustomer.name);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [photoErrorMsg, setPhotoErrorMsg] = useState('');
  const [activeZoomPhoto, setActiveZoomPhoto] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'with_photos' | 'five_star'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected shipment object
  const currentDelivered = shipments.find((s) => s.id === selectedShipmentId);
  const isEligibleForVerifiedBadge = currentDelivered?.status === 'delivered';

  // File Upload Handler (accepts jpeg, png, webp up to 5MB, max 3 photos)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoErrorMsg('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedPhotos.length + files.length > 3) {
      setPhotoErrorMsg('You can upload a maximum of 3 photos per review.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setPhotoErrorMsg(`"${file.name}" is not a supported format. Please upload JPG, PNG, or WebP.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setPhotoErrorMsg(`"${file.name}" exceeds the 5MB file size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedPhotos((prev) => {
            if (prev.length >= 3) return prev;
            return [...prev, event.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writtenFeedback.trim()) {
      setErrorMsg('Please provide written feedback describing your shipping experience.');
      return;
    }
    if (!selectedShipmentId) {
      setErrorMsg('Please select a completed delivered shipment to verify your review.');
      return;
    }

    submitReview({
      shipmentId: selectedShipmentId,
      trackingNumber: currentDelivered?.trackingNumber || 'SWV-VERIFIED',
      customerName: displayName || currentCustomer.name,
      verifiedShipment: isEligibleForVerifiedBadge,
      ratingOverall,
      ratingCommunication,
      ratingSpeed,
      ratingCondition,
      writtenFeedback,
      photoUrls: uploadedPhotos,
      photoUrl: uploadedPhotos[0] || undefined,
      status: 'published',
      moderationStatus: 'approved',
      companyResponse:
        'Thank you for sharing your experience and photo proof with Swiftvero Express! Our quality assurance desk has catalogued your transit rating.',
    });

    setSubmittedSuccess(true);
    setErrorMsg('');
  };

  const renderStars = (rating: number, onChange?: (val: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(star)}
            className={`p-0.5 ${onChange ? 'hover:scale-110 transition-transform cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`w-4 h-4 ${
                star <= rating ? 'fill-[#008EA8] text-[#008EA8]' : 'text-slate-200 fill-slate-100'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Filter reviews
  const filteredReviews = reviews.filter((rev) => {
    if (filterMode === 'with_photos') {
      return (rev.photoUrls && rev.photoUrls.length > 0) || Boolean(rev.photoUrl);
    }
    if (filterMode === 'five_star') {
      return rev.ratingOverall === 5;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Review Section Header */}
      <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B4D8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full">
              Consignor Feedback &amp; Evidence
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-display font-bold text-[#354B55] mt-1.5">
            Verified Customer Reviews &amp; Arrival Proof
          </h2>
          <p className="text-xs text-[#6A808C] mt-0.5 max-w-xl">
            Real evaluations from Nigerian consignors with confirmed delivery closure. Consignors can upload package photos to document arrival condition.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-[#CAF0F8] text-[#008EA8] px-3 py-2 rounded-xl border border-[#90E0EF] font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#00B4D8]" />
          <span>Verified Badge strictly tied to confirmed deliveries</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Review Submission Form (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#354B55]">Submit a Delivery Experience Review</h3>
            <span className="text-[10px] text-[#6A808C] bg-[#F5FBFD] px-2 py-0.5 rounded border border-[#DCEFF3]">
              Delivered Consignments Only
            </span>
          </div>

          {submittedSuccess ? (
            <div className="p-5 bg-[#CAF0F8]/50 border border-[#90E0EF] rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#008EA8] mx-auto" />
              <div className="text-sm font-bold text-[#354B55]">Review &amp; Photos Published!</div>
              <p className="text-xs text-[#6A808C] leading-relaxed">
                Thank you! Your feedback and uploaded arrival proof have been verified against #{currentDelivered?.trackingNumber} and added to the public feed.
              </p>
              <button
                onClick={() => {
                  setSubmittedSuccess(false);
                  setWrittenFeedback('');
                  setUploadedPhotos([]);
                }}
                className="px-4 py-2 text-xs font-bold text-[#00B4D8] bg-white border border-[#DCEFF3] rounded-xl hover:bg-slate-50 transition-all shadow-xs"
              >
                Submit Another Review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-[#B42318] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Shipment selector */}
              <div>
                <label className="block font-semibold text-[#354B55] mb-1">
                  Qualifying Delivered Consignment <span className="text-[#00B4D8]">*</span>
                </label>
                {deliveredShipments.length > 0 ? (
                  <select
                    value={selectedShipmentId}
                    onChange={(e) => setSelectedShipmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg focus:border-[#00B4D8] focus:outline-hidden text-xs bg-[#F5FBFD]"
                  >
                    {deliveredShipments.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.trackingNumber} — {s.destinationCountry} ({s.contentsDescription.slice(0, 30)}...)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-[#956B16] leading-relaxed">
                    No delivered shipment found under current account. Only completed deliveries receive verified badges. (Switch to Amara Okafor in top bar to test a completed delivery!)
                  </div>
                )}
              </div>

              {/* 4 Multi-criteria ratings */}
              <div className="p-3.5 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#354B55] font-semibold">Overall Experience:</span>
                  {renderStars(ratingOverall, setRatingOverall)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#354B55] font-medium">Communication &amp; Updates:</span>
                  {renderStars(ratingCommunication, setRatingCommunication)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#354B55] font-medium">Delivery Speed vs Quote:</span>
                  {renderStars(ratingSpeed, setRatingSpeed)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#354B55] font-medium">Condition on Arrival:</span>
                  {renderStars(ratingCondition, setRatingCondition)}
                </div>
              </div>

              {/* Written review */}
              <div>
                <label className="block font-semibold text-[#354B55] mb-1">
                  Written Feedback &amp; Transit Observations <span className="text-[#00B4D8]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={writtenFeedback}
                  onChange={(e) => setWrittenFeedback(e.target.value)}
                  placeholder="Describe quote transparency, doorstep collection experience, milestone updates, and parcel arrival condition..."
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg focus:border-[#00B4D8] focus:outline-hidden text-xs bg-[#F5FBFD]"
                />
              </div>

              {/* Display name */}
              <div>
                <label className="block font-semibold text-[#354B55] mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#DCEFF3] rounded-lg focus:border-[#00B4D8] focus:outline-hidden text-xs bg-[#F5FBFD]"
                />
              </div>

              {/* PHOTO UPLOAD WORKFLOW (User Prompt Requirement #4) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-[#354B55]">
                    Package Photos / Unboxing Proof (1–3 Photos)
                  </label>
                  <span className="text-[10px] text-[#6A808C]">
                    {uploadedPhotos.length} / 3 attached
                  </span>
                </div>

                {photoErrorMsg && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-[#B42318]">
                    {photoErrorMsg}
                  </div>
                )}

                {/* Hidden real file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Upload Trigger Area */}
                {uploadedPhotos.length < 3 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-[#90E0EF] rounded-xl bg-[#CAF0F8]/20 hover:bg-[#CAF0F8]/40 transition-colors text-center cursor-pointer space-y-1"
                  >
                    <Upload className="w-5 h-5 text-[#00B4D8] mx-auto" />
                    <div className="text-xs font-semibold text-[#354B55]">
                      Click to upload arrival photos
                    </div>
                    <p className="text-[10px] text-[#6A808C]">
                      Supports JPG, PNG, WebP up to 5MB each (drag-and-drop or file picker)
                    </p>
                  </div>
                )}



                {/* Uploaded Thumbnail Gallery with Remove Buttons */}
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {uploadedPhotos.map((photoUrl, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg border border-[#DCEFF3] overflow-hidden group bg-slate-100"
                      >
                        <img
                          src={photoUrl}
                          alt={`Customer delivery proof ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Zoom button */}
                        <button
                          type="button"
                          onClick={() => setActiveZoomPhoto(photoUrl)}
                          className="absolute bottom-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-black/80 transition-colors"
                          title="Zoom photo"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </button>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-xs"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!deliveredShipments.length}
                className={`w-full py-2.5 text-xs font-semibold text-white rounded-xl transition-all shadow-xs ${
                  deliveredShipments.length ? 'bg-[#00B4D8] hover:bg-[#0096B4]' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Submit Verified Review with Photos
              </button>
            </form>
          )}
        </div>

        {/* Right: Published Reviews List with Photo Gallery (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#DCEFF3] gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#354B55]">Published Consignor Reviews ({reviews.length})</h3>
              <span className="text-[11px] text-[#6A808C]">Authentic delivery experiences and arrival proofs</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#F5FBFD] p-1 rounded-lg border border-[#DCEFF3] text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterMode === 'all' ? 'bg-[#00B4D8] text-white font-bold' : 'text-[#354B55] hover:bg-white'
                }`}
              >
                All ({reviews.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('with_photos')}
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  filterMode === 'with_photos' ? 'bg-[#00B4D8] text-white font-bold' : 'text-[#354B55] hover:bg-white'
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>With Photos</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('five_star')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterMode === 'five_star' ? 'bg-[#00B4D8] text-white font-bold' : 'text-[#354B55] hover:bg-white'
                }`}
              >
                5★ Rated
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.map((rev) => {
              const reviewPhotos =
                rev.photoUrls && rev.photoUrls.length > 0
                  ? rev.photoUrls
                  : rev.photoUrl
                  ? [rev.photoUrl]
                  : [];

              return (
                <div key={rev.id} className="bg-white rounded-2xl border border-[#DCEFF3] p-5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#354B55]">{rev.customerName}</span>
                      {rev.verifiedShipment && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-full border border-[#90E0EF]">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Consignment ({rev.trackingNumber})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6A808C] font-mono">
                      {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Multi-criteria star rating display */}
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-[#F5FBFD] p-2.5 rounded-xl border border-[#DCEFF3]">
                    <div className="flex items-center gap-1">
                      {renderStars(rev.ratingOverall)}
                      <span className="font-bold text-[#354B55] ml-1">{rev.ratingOverall}.0</span>
                    </div>
                    <div className="text-[11px] text-[#6A808C] flex flex-wrap items-center gap-2">
                      <span>Communication: <strong className="text-[#354B55]">{rev.ratingCommunication}/5</strong></span>
                      <span>·</span>
                      <span>Speed: <strong className="text-[#354B55]">{rev.ratingSpeed}/5</strong></span>
                      <span>·</span>
                      <span>Condition: <strong className="text-[#354B55]">{rev.ratingCondition}/5</strong></span>
                    </div>
                  </div>

                  <p className="text-xs text-[#354B55] leading-relaxed">{rev.writtenFeedback}</p>

                  {/* Customer Photo Gallery */}
                  {reviewPhotos.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-semibold text-[#008EA8] flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#00B4D8]" />
                        <span>Consignor Arrival Evidence ({reviewPhotos.length} photo{reviewPhotos.length > 1 ? 's' : ''}):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reviewPhotos.map((imgUrl, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => setActiveZoomPhoto(imgUrl)}
                            className="relative w-20 h-20 rounded-lg border border-[#DCEFF3] overflow-hidden cursor-pointer group bg-slate-100"
                            title="Click to view full image"
                          >
                            <img
                              src={imgUrl}
                              alt={`Arrival photo ${pIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Official Company Response */}
                  {rev.companyResponse && (
                    <div className="p-3 bg-[#F5FBFD] rounded-xl border border-[#DCEFF3] space-y-1 text-xs">
                      <div className="font-semibold text-[#008EA8] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#00B4D8]" />
                        <span>Swiftvero Logistics Desk Response:</span>
                      </div>
                      <p className="text-[11px] text-[#6A808C] leading-relaxed pl-5">
                        {rev.companyResponse}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredReviews.length === 0 && (
              <div className="p-8 bg-white border border-[#DCEFF3] rounded-2xl text-center text-xs text-[#6A808C]">
                No reviews found matching this filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Photo Zoom Modal */}
      {activeZoomPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveZoomPhoto(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveZoomPhoto(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors z-10"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={activeZoomPhoto}
              alt="Enlarged consignment arrival proof"
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
            <div className="p-3 text-center text-xs text-[#6A808C]">
              Verified Consignment Photo Proof · Swiftvero Express Delivery Audit
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
