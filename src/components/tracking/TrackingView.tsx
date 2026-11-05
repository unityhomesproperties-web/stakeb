import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { ShipmentRecord } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';
import {
  Search,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  MessageSquare,
  ShieldAlert,
  Star,
  Calendar,
  XCircle,
  Mail,
  Bell,
  Check,
} from 'lucide-react';

interface TrackingViewProps {
  onOpenSupportWithShipment: (trackingNumber: string) => void;
  onOpenReviewForShipment: (shipmentId: string) => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  onOpenSupportWithShipment,
  onOpenReviewForShipment,
}) => {
  const {
    shipments,
    selectedShipmentForTracking,
    setSelectedShipmentForTracking,
    currentCustomer,
    triggerOverdueAlert,
    resolveOverdueAlert,
    cancelShipment,
  } = useDemo();

  const [searchInput, setSearchInput] = useState(selectedShipmentForTracking || 'SWV-2026-NG8491');
  const [resolutionInput, setResolutionInput] = useState('Ground transfer scan recorded at destination intake facility.');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelDisclaimerChecked, setCancelDisclaimerChecked] = useState(false);

  // 'Get email updates' notification toggle state
  const [emailUpdatesEnabled, setEmailUpdatesEnabled] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [emailSubscribedMessage, setEmailSubscribedMessage] = useState<string | null>(null);

  const handleToggleEmailUpdates = () => {
    if (emailUpdatesEnabled) {
      setEmailUpdatesEnabled(false);
      setEmailSubscribedMessage(null);
    } else {
      setEmailUpdatesEnabled(true);
      if (!subscriberEmail && currentCustomer?.email) {
        setSubscriberEmail(currentCustomer.email);
      }
    }
  };

  const handleConfirmEmailSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail.trim() || !subscriberEmail.includes('@')) return;
    setEmailSubscribedMessage(
      `Subscribed! Live milestone updates for ${activeShipment?.trackingNumber} will be dispatched to ${subscriberEmail.trim()}.`
    );
  };

  // Find active shipment
  const activeShipment =
    shipments.find((s) => s.trackingNumber.toUpperCase() === searchInput.trim().toUpperCase()) ||
    shipments[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = shipments.find((s) => s.trackingNumber.toUpperCase() === searchInput.trim().toUpperCase());
    if (found) {
      setSelectedShipmentForTracking(found.trackingNumber);
    }
  };

  const handleSelectQuickShipment = (tracking: string) => {
    setSearchInput(tracking);
    setSelectedShipmentForTracking(tracking);
  };

  const handleConfirmCancel = () => {
    if (!activeShipment || !cancelDisclaimerChecked) return;
    cancelShipment(activeShipment.id);
    setCancelModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs">
        <div className="max-w-xl mx-auto text-center space-y-2 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[#354B55]">
            Track Your International Shipment
          </h2>
          <p className="text-xs text-[#6A808C]">
            Live milestone tracking with proactive updates and transparent custody records.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. SWV-2026-NG8491"
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#DCEFF3] rounded-lg focus:border-[#00B4D8] focus:outline-hidden font-mono uppercase bg-[#F5FBFD] text-[#354B55]"
            />
            <Search className="w-4 h-4 text-[#6A808C] absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-lg transition-colors shadow-xs"
          >
            Track
          </button>
        </form>

        {/* Quick Sample Tracking Reference Pills */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-[#6A808C] text-[11px]">Consignment Samples:</span>
          {shipments.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectQuickShipment(s.trackingNumber)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-colors border ${
                activeShipment?.id === s.id
                  ? 'border-[#00B4D8] bg-[#CAF0F8] text-[#008EA8] font-semibold'
                  : 'border-[#DCEFF3] text-[#354B55] hover:bg-[#F5FBFD]'
              }`}
            >
              {s.trackingNumber} ({s.status === 'delivered' ? 'Delivered' : s.isUpdateOverdue ? 'Overdue Alert' : s.status === 'cancelled' ? 'Cancelled' : 'In Transit'})
            </button>
          ))}
        </div>
      </div>

      {activeShipment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tracking Details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCEFF3]">
                <div>
                  <div className="text-[11px] text-[#6A808C] uppercase font-semibold">Consignment Reference</div>
                  <h3 className="text-2xl font-bold text-[#354B55] font-mono mt-0.5">
                    {activeShipment.trackingNumber}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {activeShipment.status === 'delivered' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Delivered &amp; Signed
                    </span>
                  ) : activeShipment.status === 'cancelled' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                      <XCircle className="w-3.5 h-3.5" />
                      Shipment Cancelled
                    </span>
                  ) : activeShipment.isUpdateOverdue ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Scan Overdue (Investigating)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]">
                      <Clock className="w-3.5 h-3.5 text-[#00B4D8]" />
                      In Transit · On Schedule
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Estimation Banner */}
              <div className="p-3.5 bg-[#CAF0F8]/50 border border-[#90E0EF] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#00B4D8] shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-[#354B55]">
                      Estimated Delivery Date: {activeShipment.estimatedDeliveryDisplay || activeShipment.quote.estimatedDeliveryDisplay}
                    </span>
                    <p className="text-[11px] text-[#6A808C]">
                      Transit estimation based on selected {activeShipment.quote.serviceName} (Estimate — not a guarantee).
                    </p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-[#008EA8] shrink-0 font-mono">
                  {activeShipment.quote.transitWindow}
                </div>
              </div>

              {/* Pickup Status Tracker (For Doorstep Pickups) */}
              <div className="p-4 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#354B55]">Doorstep Pickup Progress</span>
                  <span className="text-[#008EA8] font-semibold text-[11px]">Free Collection</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded-lg bg-white border border-[#DCEFF3] font-medium text-[#008EA8]">
                    1. Requested
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#DCEFF3] font-medium text-[#008EA8]">
                    2. Assigned
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#DCEFF3] font-medium text-[#008EA8]">
                    3. En Route
                  </div>
                  <div className="p-2 rounded-lg bg-[#CAF0F8] border border-[#00B4D8] font-bold text-[#008EA8]">
                    4. Picked Up
                  </div>
                </div>
              </div>

              {/* Overdue Alert Banner (Proactive Delay Detection) */}
              {activeShipment.isUpdateOverdue && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Proactive Delay Detection Alert
                    </span>
                    <span className="text-[10px] uppercase font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Customer Alert Dispatched
                    </span>
                  </div>
                  <p className="text-[#354B55] leading-relaxed">
                    “Your shipment has not received a new tracking update within the expected window. Our logistics team is checking the latest available information with the destination transfer terminal. We will update you as soon as we have confirmation.”
                  </p>
                  <div className="text-[11px] text-[#6A808C] pt-1 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2">
                    <span>Truthful communication policy: Swiftvero does not invent reasons without verified confirmation.</span>
                    <button
                      onClick={() => onOpenSupportWithShipment(activeShipment.trackingNumber)}
                      className="text-[#00B4D8] font-semibold underline hover:text-[#0096B4]"
                    >
                      Open Support Ticket
                    </button>
                  </div>
                </div>
              )}

              {/* Route Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
                <div>
                  <span className="text-[#6A808C] text-[11px]">Origin:</span>
                  <div className="font-semibold text-[#354B55] mt-0.5">{activeShipment.originCountry || 'Nigeria'}</div>
                </div>
                <div>
                  <span className="text-[#6A808C] text-[11px]">Destination:</span>
                  <div className="font-semibold text-[#354B55] mt-0.5">
                    {activeShipment.destinationCountry} ({activeShipment.destinationCity})
                  </div>
                </div>
                <div>
                  <span className="text-[#6A808C] text-[11px]">Service Tier:</span>
                  <div className="font-semibold text-[#008EA8] mt-0.5">{activeShipment.quote.serviceName}</div>
                </div>
                <div>
                  <span className="text-[#6A808C] text-[11px]">Chargeable Weight:</span>
                  <div className="font-semibold text-[#354B55] mt-0.5 font-mono">
                    {activeShipment.quote.chargeableWeightKg} kg
                  </div>
                </div>
              </div>

              {/* Get email updates toggle module */}
              <div className="pt-4 border-t border-[#DCEFF3]">
                <div className="p-4 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#354B55] block">
                          Get email updates for this shipment
                        </span>
                        <span className="text-[11px] text-[#6A808C]">
                          Receive milestone notifications and proactive status alerts directly in your inbox.
                        </span>
                      </div>
                    </div>

                    {/* Interactive Switch Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleEmailUpdates}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        emailUpdatesEnabled ? 'bg-[#00B4D8]' : 'bg-slate-200'
                      }`}
                      role="switch"
                      aria-checked={emailUpdatesEnabled}
                      aria-label="Toggle email notifications for shipment tracking"
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          emailUpdatesEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expanded Subscription Form */}
                  {emailUpdatesEnabled && (
                    <div className="pt-2 border-t border-[#DCEFF3]/70 space-y-2">
                      {!emailSubscribedMessage ? (
                        <form onSubmit={handleConfirmEmailSubscription} className="flex gap-2">
                          <input
                            type="email"
                            required
                            value={subscriberEmail}
                            onChange={(e) => setSubscriberEmail(e.target.value)}
                            placeholder="Enter your email (e.g. consignor@email.ng)"
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8] text-[#354B55]"
                          />
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-[#00B4D8] hover:bg-[#0096B4] text-white text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-2xs"
                          >
                            Subscribe
                          </button>
                        </form>
                      ) : (
                        <div className="p-2.5 bg-[#CAF0F8] border border-[#90E0EF] rounded-lg text-xs text-[#008EA8] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#00B4D8]" />
                            <span>{emailSubscribedMessage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEmailSubscribedMessage(null)}
                            className="text-[11px] underline text-[#008EA8] hover:text-[#354B55] ml-2"
                          >
                            Change Email
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tracking Milestones Timeline */}
            <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs">
              <h4 className="text-sm font-bold text-[#354B55] mb-4">Milestone Progress &amp; Custody Trail</h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DCEFF3]">
                {activeShipment.trackingEvents.map((evt, idx) => (
                  <div key={evt.id} className="relative group">
                    <div
                      className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                        evt.isProactiveAlert
                          ? 'border-amber-500 bg-amber-400'
                          : idx === activeShipment.trackingEvents.length - 1
                          ? 'border-[#00B4D8] bg-[#00B4D8]'
                          : 'border-[#90E0EF] bg-white'
                      }`}
                    />

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#354B55]">{evt.stage}</span>
                        <span className="text-[11px] text-[#6A808C] font-mono">{evt.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#008EA8] font-medium mt-0.5">
                        <MapPin className="w-3 h-3 text-[#00B4D8]" />
                        <span>{evt.location}</span>
                      </div>
                      <p className="text-xs text-[#6A808C] mt-1 leading-relaxed">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Controls & Details (1 col) */}
          <div className="space-y-6">
            {/* Proactive Delay Trigger Sandbox */}
            <div className="bg-[#F5FBFD] border border-[#DCEFF3] rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="text-xs font-bold text-[#354B55]">Proactive Delay Demonstration:</div>
              <p className="text-[11px] text-[#6A808C]">
                Test Swiftvero’s automated scan-gap detector and truthful exception handling.
              </p>

              <div className="space-y-2 pt-1">
                {!activeShipment.isUpdateOverdue ? (
                  <button
                    onClick={() => triggerOverdueAlert(activeShipment.id)}
                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-semibold text-amber-800 transition-colors text-left flex items-center justify-between"
                  >
                    <span>Simulate Scan Gap (Overdue Alert)</span>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={resolutionInput}
                      onChange={(e) => setResolutionInput(e.target.value)}
                      placeholder="Resolution note"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#DCEFF3] rounded-lg focus:outline-hidden text-[#354B55]"
                    />
                    <button
                      onClick={() => resolveOverdueAlert(activeShipment.id, resolutionInput)}
                      className="w-full py-2 px-3 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve &amp; Clear Scan Gap</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Shipment Summary Card */}
            <div className="bg-white rounded-2xl border border-[#DCEFF3] p-4 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-[#354B55] border-b border-[#DCEFF3] pb-2">Shipment Overview</h4>

              <div>
                <span className="text-[#6A808C]">Contents:</span>
                <div className="font-semibold text-[#354B55] mt-0.5">{activeShipment.contentsDescription}</div>
              </div>

              <div>
                <span className="text-[#6A808C]">Sender:</span>
                <div className="font-semibold text-[#354B55] mt-0.5">{activeShipment.senderName}</div>
                <div className="text-[11px] text-[#6A808C]">{activeShipment.senderAddress}</div>
              </div>

              <div>
                <span className="text-[#6A808C]">Recipient:</span>
                <div className="font-semibold text-[#354B55] mt-0.5">{activeShipment.recipientName}</div>
                <div className="text-[11px] text-[#6A808C]">{activeShipment.recipientAddress}</div>
              </div>

              <div className="pt-2 border-t border-[#DCEFF3] flex justify-between">
                <span className="text-[#6A808C]">Paid Freight &amp; Fees:</span>
                <span className="font-bold text-[#354B55] font-mono">
                  {formatNaira(activeShipment.quote.totalAmount)}
                </span>
              </div>

              {/* Delivery actions */}
              {activeShipment.status === 'delivered' && (
                <div className="pt-3 border-t border-[#DCEFF3] space-y-2">
                  <div className="p-2.5 bg-[#CAF0F8] rounded-lg text-[#008EA8] font-semibold text-[11px] flex items-center gap-1.5 border border-[#90E0EF]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#00B4D8]" />
                    <span>Eligible for Verified Review &amp; Cashback</span>
                  </div>
                  {!activeShipment.hasReview ? (
                    <button
                      onClick={() => onOpenReviewForShipment(activeShipment.id)}
                      className="w-full py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Write Verified Review</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-[#6A808C] text-center">
                      Review submitted for this delivery.
                    </div>
                  )}
                </div>
              )}

              {/* Cancel shipment trigger (if not yet delivered or cancelled) */}
              {activeShipment.status !== 'delivered' && activeShipment.status !== 'cancelled' && (
                <div className="pt-2 border-t border-[#DCEFF3]">
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                  >
                    Cancel Shipment
                  </button>
                </div>
              )}
            </div>

            {/* Need Assistance box */}
            <div className="bg-white rounded-2xl border border-[#DCEFF3] p-4 shadow-xs space-y-2 text-xs">
              <h4 className="font-bold text-[#354B55]">Need Assistance?</h4>
              <p className="text-[#6A808C] leading-relaxed text-[11px]">
                Have a question regarding this consignment? Our operations team monitors every active air waybill.
              </p>
              <button
                onClick={() => onOpenSupportWithShipment(activeShipment.trackingNumber)}
                className="w-full py-2 border border-[#DCEFF3] hover:bg-[#F5FBFD] text-[#354B55] rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Contact Dispatch Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal with Mandatory Disclaimer */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-[#354B55]">Confirm Shipment Cancellation</h3>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#354B55] leading-relaxed space-y-2">
              <p className="font-semibold text-red-700">Mandatory Facility Collection Notice:</p>
              <p>
                “Once your shipment has arrived at a Swiftvero facility, cancelling it does not include returning or redelivering the goods to you — Swiftvero is not responsible for returning or delivering the goods back after a cancellation at this stage. Arranging collection of cancelled goods from our facility is the customer’s responsibility.”
              </p>
            </div>

            <label className="flex items-start gap-2 text-xs text-[#6A808C] cursor-pointer">
              <input
                type="checkbox"
                checked={cancelDisclaimerChecked}
                onChange={(e) => setCancelDisclaimerChecked(e.target.checked)}
                className="mt-0.5 rounded border-[#DCEFF3] text-[#00B4D8] focus:ring-[#00B4D8]"
              />
              <span>
                I have read and agree that I am solely responsible for collecting any cancelled items from the Swiftvero facility.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCEFF3]">
              <button
                type="button"
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancelDisclaimerChecked(false);
                }}
                className="px-3 py-1.5 text-xs border border-[#DCEFF3] rounded-lg hover:bg-slate-50 text-[#354B55] transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={!cancelDisclaimerChecked}
                onClick={handleConfirmCancel}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors ${
                  cancelDisclaimerChecked
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
