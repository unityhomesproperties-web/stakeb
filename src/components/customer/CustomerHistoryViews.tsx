import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { formatNaira } from '../../utils/shipping-calculator';
import { getCustomerFriendlyStatusLabel } from '../../utils/quote-lifecycle';
import { ReferenceQrBadge } from '../common/ReferenceQrBadge';
import { PaymentReceiptRecord } from '../../types';
import {
  FileText,
  Truck,
  Building2,
  Receipt,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Download,
  X,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface MyQuotesViewProps {
  onContinueQuoteToBooking: (quoteRef: string) => void;
  onReviewShipmentQuote: (trackingNumber: string) => void;
}

export const MyQuotesView: React.FC<MyQuotesViewProps> = ({
  onContinueQuoteToBooking,
  onReviewShipmentQuote,
}) => {
  const { currentCustomer, quotes, shipments } = useDemo();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'estimate' | 'manual_enquiry' | 'quoted' | 'converted'
  >('all');

  const normEmail = (currentCustomer.email || '').trim().toLowerCase();
  const normPhone = (currentCustomer.phone || '').replace(/[\s\-()]/g, '');

  const myQuotes = quotes.filter((q) => {
    const matchesCustomer =
      q.customerId === currentCustomer.id ||
      (normEmail && q.contactEmail?.trim().toLowerCase() === normEmail) ||
      (normPhone && q.contactPhone?.replace(/[\s\-()]/g, '') === normPhone);
    if (!matchesCustomer) return false;
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      q.quoteRef.toLowerCase().includes(s) ||
      q.destinationCountry.toLowerCase().includes(s) ||
      q.destinationCity.toLowerCase().includes(s) ||
      q.items.some((it) => it.contentsDescription.toLowerCase().includes(s))
    );
  });

  const revisedShipmentQuotes = shipments.filter(
    (s) =>
      s.customerId === currentCustomer.id &&
      (s.status === 'quote_ready' || (s.quoteVersions && s.quoteVersions.length > 0))
  );

  return (
    <div className="space-y-5 text-xs">
      <div className="sv-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
          <div>
            <h2 className="sv-h2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00B4D8]" />
              <span>My Saved Quotes &amp; Enquiries ({myQuotes.length})</span>
            </h2>
            <p className="sv-label mt-0.5">
              Saved quotes carry a <span className="font-mono font-semibold">QTE-YY-XXXXXX</span> reference and do not create a shipment or pickup until you continue to book.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search QTE ref, country..."
                className="pl-8 pr-3 py-1.5 rounded-full border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-full border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="estimate">Saved Estimates</option>
              <option value="manual_enquiry">Awaiting Quote Desk</option>
              <option value="quoted">Official Staff Quote Ready</option>
              <option value="converted">Converted to Booking</option>
            </select>
          </div>
        </div>

        {myQuotes.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">
            No saved quotes match your current filter.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {myQuotes.map((q) => (
              <div
                key={q.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#111827] dark:text-white">
                      {q.quoteRef}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        q.status === 'converted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : q.status === 'quoted'
                          ? 'bg-[#CAF0F8] text-[#0F172A] dark:bg-sky-950 dark:text-[#90E0EF]'
                          : q.status === 'manual_enquiry'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {q.status.replace('_', ' ')}
                    </span>
                    {q.items.some((i) => i.isFragile) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                        Fragile Declared
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#1F2937] dark:text-slate-300 font-medium">
                    {q.originCity} → {q.destinationCity}, {q.destinationCountry} · {q.items.length} package group(s)
                  </p>
                  {q.staffQuoteNotes && (
                    <p className="text-[11px] text-[#007791] dark:text-[#90E0EF]">
                      Quote Desk Note: {q.staffQuoteNotes}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Valid until {q.expiresAt.slice(0, 10)}
                    {q.convertedGroupCode ? ` · Booked as ${q.convertedGroupCode}` : ''}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">
                      {q.type === 'manual_enquiry' && q.status === 'manual_enquiry'
                        ? 'Estimated Reference'
                        : 'Total Quote'}
                    </span>
                    <span className="text-base font-extrabold text-[#111827] dark:text-white tabular-nums">
                      {q.totalEstimatedNgn > 0 ? formatNaira(q.totalEstimatedNgn) : 'Pending Review'}
                    </span>
                  </div>
                  {q.status !== 'converted' && (
                    <button
                      type="button"
                      onClick={() => onContinueQuoteToBooking(q.quoteRef)}
                      className="sv-btn-primary px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Continue to Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {revisedShipmentQuotes.length > 0 && (
        <div className="sv-card p-5 sm:p-6 space-y-3">
          <h3 className="sv-h3">Verified Facility Shipment Quotes ({revisedShipmentQuotes.length})</h3>
          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {revisedShipmentQuotes.map((s) => (
              <div key={s.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-[#111827] dark:text-white">
                    {s.trackingNumber}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {s.destinationCity}, {s.destinationCountry} · {s.quoteVersions?.length || 1} version(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold tabular-nums text-sm">
                    {formatNaira(s.quote.totalAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onReviewShipmentQuote(s.trackingNumber)}
                    className="px-3.5 py-1.5 rounded-full bg-[#CAF0F8] text-[#0F172A] border border-[#90E0EF] font-bold hover:bg-[#90E0EF]/50 cursor-pointer"
                  >
                    Review Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MyPickupsViewProps {
  onBookPickup?: () => void;
}

export const MyPickupsView: React.FC<MyPickupsViewProps> = ({ onBookPickup }) => {
  const { currentCustomer, pickupJobs, shipments, branches } = useDemo();
  const [searchTerm, setSearchTerm] = useState('');

  const myShipmentIds = new Set(
    shipments.filter((s) => s.customerId === currentCustomer.id).map((s) => s.id)
  );
  const myPickupJobs = pickupJobs.filter((job) => {
    const belongs =
      job.customerId === currentCustomer.id ||
      myShipmentIds.has(job.shipmentId) ||
      (job.senderEmail &&
        currentCustomer.email &&
        job.senderEmail.toLowerCase() === currentCustomer.email.toLowerCase());
    if (!belongs) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      job.pickupReference.toLowerCase().includes(q) ||
      job.trackingNumber.toLowerCase().includes(q) ||
      job.senderAddress.toLowerCase().includes(q)
    );
  });

  const myDropoffs = shipments.filter((s) => {
    if (s.customerId !== currentCustomer.id || s.collectionMethod !== 'dropoff') return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.destinationCountry.toLowerCase().includes(q) ||
      (s.branchName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 text-xs">
      <div className="sv-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
          <div>
            <h2 className="sv-h2 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#00B4D8]" />
              <span>My Pickups &amp; Hub Drop-Offs</span>
            </h2>
            <p className="sv-label mt-0.5">
              Doorstep pickup dispatches are tracked separately from branch drop-off consignments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search PKP ref, SWV code..."
                className="pl-8 pr-3 py-1.5 rounded-full border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            {onBookPickup && (
              <button
                type="button"
                onClick={onBookPickup}
                className="sv-btn-primary px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Book a Pickup</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="sv-h3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#00B4D8]" />
            <span>Doorstep Pickups ({myPickupJobs.length})</span>
          </h3>
          {myPickupJobs.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-[#E2E8F0] dark:border-slate-800 text-slate-500">
              No doorstep pickups scheduled under your account.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800 border border-[#E2E8F0] dark:border-slate-800 rounded-xl px-4">
              {myPickupJobs.map((job) => {
                const isPriority = job.isPriorityFlag || job.pickupType === 'priority';
                return (
                  <div key={job.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-[#111827] dark:text-white">
                          {job.pickupReference}
                        </span>
                        <span className="font-mono text-slate-500">({job.trackingNumber})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPriority
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {isPriority
                            ? `Priority Pickup (${formatNaira(job.pickupFeeNgn || 5000)})`
                            : 'Standard Pickup (₦0 Free)'}
                        </span>
                        {job.isFragile && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Fragile
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Collection Address: <strong className="text-slate-800 dark:text-slate-200">{job.senderAddress}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Window: {job.scheduledDate} &bull; {job.estimatedWindow || job.scheduledSlot}
                        {job.collectionHandlerName ? ` · Courier: ${job.collectionHandlerName}` : ''}
                      </p>
                      {job.failureReason && (
                        <p className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                          Attempt Notice: {job.failureReason}
                        </p>
                      )}
                      {job.rescheduledFromDate && (
                        <p className="text-[11px] text-amber-800 dark:text-amber-300">
                          Rescheduled from {job.rescheduledFromDate}
                          {job.rescheduledReason ? ` — ${job.rescheduledReason}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ReferenceQrBadge value={job.trackingNumber} size={52} />
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-[#CAF0F8] text-[#0F172A] dark:bg-sky-950 dark:text-[#90E0EF]">
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="sv-h3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#00B4D8]" />
            <span>Self Drop-Off Consignments ({myDropoffs.length})</span>
          </h3>
          {myDropoffs.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-[#E2E8F0] dark:border-slate-800 text-slate-500">
              No branch drop-off consignments found.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800 border border-[#E2E8F0] dark:border-slate-800 rounded-xl px-4">
              {myDropoffs.map((s) => {
                const branch =
                  branches.find((b) => b.id === (s.collectionBranchId || s.branchId)) ||
                  branches[0];
                return (
                  <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#111827] dark:text-white">
                          {s.trackingNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CAF0F8] text-[#0F172A]">
                          Branch Drop-off (₦0)
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Hub: <strong>{branch?.name || s.branchName || 'Ikeja Cargo Hub'}</strong> ({branch?.address || 'Lagos'})
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ReferenceQrBadge value={s.trackingNumber} size={52} />
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {getCustomerFriendlyStatusLabel(s.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface PaymentsReceiptsViewProps {
  onOpenWeightAdjustment: (trackingNumber: string) => void;
}

export const PaymentsReceiptsView: React.FC<PaymentsReceiptsViewProps> = ({
  onOpenWeightAdjustment,
}) => {
  const { currentCustomer, paymentReceipts, paymentAdjustments } = useDemo();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceiptRecord | null>(null);

  const myAdjustments = paymentAdjustments.filter(
    (adj) =>
      adj.customerId === currentCustomer.id &&
      (adj.status === 'pending_customer_approval' || adj.status === 'disputed')
  );

  const myReceipts = paymentReceipts.filter((r) => {
    if (r.customerId !== currentCustomer.id) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.receiptNumber.toLowerCase().includes(q) ||
      (r.shipmentTrackingNumber || '').toLowerCase().includes(q) ||
      (r.gatewayReference || '').toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  const handleDownloadReceiptText = (rct: PaymentReceiptRecord) => {
    const content = [
      'SWIFTVERO EXPRESS — PAYMENT RECEIPT',
      '===================================',
      `Receipt Number: ${rct.receiptNumber}`,
      `Date: ${new Date(rct.createdAt).toLocaleString()}`,
      `Shipment Code: ${rct.shipmentTrackingNumber || 'N/A'}`,
      `Adjustment Ref: ${rct.adjustmentRef || 'N/A'}`,
      `Gateway Ref: ${rct.gatewayReference}`,
      `Payment Method: ${rct.paymentMethod}`,
      `Status: ${rct.status.toUpperCase()}`,
      `Amount: ${formatNaira(rct.amountNgn)}`,
      `Description: ${rct.description}`,
      rct.isDemo ? 'Environment: DEMO MODE (Simulated Transaction)' : 'Environment: Production',
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${rct.receiptNumber}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 text-xs">
      {myAdjustments.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Action Required: Weight Verification Adjustments ({myAdjustments.length})</span>
          </div>
          {myAdjustments.map((adj) => (
            <div
              key={adj.id}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#111827] dark:text-white">
                    {adj.adjustmentRef}
                  </span>
                  <span className="font-mono text-slate-500">({adj.trackingNumber})</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Original {adj.originalWeightKg} kg → Verified {adj.verifiedBillableWeightKg} kg · Balance Due:{' '}
                  <strong className="text-amber-800 dark:text-amber-300">{formatNaira(adj.differenceNgn)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenWeightAdjustment(adj.trackingNumber)}
                className="sv-btn-primary px-4 py-1.5 rounded-full text-xs cursor-pointer"
              >
                Approve &amp; Pay Balance
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="sv-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
          <div>
            <h2 className="sv-h2 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#00B4D8]" />
              <span>Payments &amp; Official NGN Receipts ({myReceipts.length})</span>
            </h2>
            <p className="sv-label mt-0.5">
              Download or view itemized Naira payment receipts for shipments, wallet top-ups, and weight adjustments.
            </p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search RCT ref, SWV code..."
              className="pl-8 pr-3 py-1.5 rounded-full border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
        </div>

        {myReceipts.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">
            No payment receipts match your search.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {myReceipts.map((rct) => (
              <div
                key={rct.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#111827] dark:text-white">
                      {rct.receiptNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rct.status === 'successful'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : rct.status === 'refunded'
                          ? 'bg-[#CAF0F8] text-[#0F172A]'
                          : rct.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rct.status}
                    </span>
                    {rct.shipmentTrackingNumber && (
                      <span className="font-mono text-slate-500">{rct.shipmentTrackingNumber}</span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{rct.description}</p>
                  <p className="text-[11px] text-slate-500">
                    {rct.paymentMethod} · Ref: <span className="font-mono">{rct.gatewayReference}</span> ·{' '}
                    {new Date(rct.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <span className="text-base font-extrabold text-[#111827] dark:text-white tabular-nums">
                    {formatNaira(rct.amountNgn)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(rct)}
                      className="px-3 py-1.5 rounded-full border border-[#CBD5E1] dark:border-slate-700 font-semibold hover:border-[#00B4D8] cursor-pointer"
                    >
                      View Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadReceiptText(rct)}
                      className="px-3 py-1.5 rounded-full bg-[#CAF0F8] text-[#0F172A] border border-[#90E0EF] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B4D8]">
                  Swiftvero Express Receipt
                </span>
                <h3 className="font-mono font-bold text-base text-[#111827] dark:text-white">
                  {selectedReceipt.receiptNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close receipt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount (NGN)</span>
                <span className="font-extrabold text-base text-[#111827] dark:text-white tabular-nums">
                  {formatNaira(selectedReceipt.amountNgn)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold uppercase text-emerald-700 dark:text-emerald-400">
                  {selectedReceipt.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipment Code</span>
                <span className="font-mono font-semibold">{selectedReceipt.shipmentTrackingNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span>{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Ref</span>
                <span className="font-mono">{selectedReceipt.gatewayReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issued At</span>
                <span>{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700 text-[11px]">
                {selectedReceipt.description}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-full border border-[#CBD5E1] dark:border-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadReceiptText(selectedReceipt)}
                className="sv-btn-primary px-4 py-2 rounded-full font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
