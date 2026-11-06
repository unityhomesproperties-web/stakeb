import React, { useState } from 'react';
import {
  DollarSign,
  CreditCard,
  Building2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  ArrowRight,
  Filter,
  Search,
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { formatNaira } from '../../utils/shipping-calculator';

export const FinanceLeadPortal: React.FC = () => {
  const {
    currentStaffUser,
    shipments,
    approvalRequests,
    reviewApprovalRequest,
    submitApprovalRequest,
    payoutSettings,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<'transactions' | 'refunds' | 'reconciliation'>('transactions');
  const [refundNote, setRefundNote] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Revenue computations
  const paidShipments = shipments.filter((s) => s.paymentStatus === 'paid');
  const pendingShipments = shipments.filter((s) => s.paymentStatus === 'unpaid');
  const totalRevenueNgn = paidShipments.reduce((acc, s) => acc + (s.quote?.totalAmount || 0), 0);
  const vatCollectedNgn = paidShipments.reduce((acc, s) => acc + (s.quote?.vatAmount || 0), 0);
  const protectionPremiumsNgn = paidShipments.reduce((acc, s) => acc + (s.protectionFeeNgn || 0), 0);

  const pendingRefunds = approvalRequests.filter((r) => r.type === 'high_risk_refund' && r.status === 'pending');

  const handleApproveRefund = (reqId: string) => {
    const res = reviewApprovalRequest(reqId, 'approved', refundNote || 'Finance verified refund against bank terminal settlement.');
    alert(res.message);
    setRefundNote('');
  };

  const handleRejectRefund = (reqId: string) => {
    const res = reviewApprovalRequest(reqId, 'rejected', refundNote || 'Declined: Discrepancy in proof of payment.');
    alert(res.message);
    setRefundNote('');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Finance Header */}
      <div className="bg-white border border-[#DDEEF2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center font-bold text-lg shadow-2xs border border-[#90E0EF]">
            <DollarSign className="w-5 h-5 text-[#00B4D8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#253B45]">Corporate Finance &amp; VAT Audit Bureau</span>
              <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF] px-2 py-0.5 rounded-md">
                Ledger Authority
              </span>
            </div>
            <p className="text-xs text-[#637984] mt-0.5">
              Officer: {currentStaffUser?.name || 'Haruna Aliyu'} (Finance Lead) · Dual-Control Refund Guard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#637984]">Settlement Currency:</span>
          <span className="text-xs font-mono font-bold text-[#253B45] bg-[#F7FCFD] border border-[#DDEEF2] px-3 py-1 rounded-lg">
            NGN / USD Dual Treasury
          </span>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Verified Revenue</span>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">{formatNaira(totalRevenueNgn)}</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{paidShipments.length} settled consignments</p>
        </div>

        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Awaiting Collection</span>
          <div className="text-xl font-black text-orange-600 font-mono mt-1">
            {formatNaira(pendingShipments.reduce((acc, s) => acc + (s.quote?.totalAmount || 0), 0))}
          </div>
          <p className="text-[10px] text-orange-600 font-semibold mt-0.5">{pendingShipments.length} counter receivables</p>
        </div>

        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Statutory VAT (7.5%)</span>
          <div className="text-xl font-black text-[#253B45] font-mono mt-1">{formatNaira(vatCollectedNgn)}</div>
          <p className="text-[10px] text-[#637984] mt-0.5">FIRS quarterly tax accrual</p>
        </div>

        <div className="p-4 bg-white border border-[#DDEEF2] rounded-xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#637984] block">Protection Premiums</span>
          <div className="text-xl font-black text-amber-800 font-mono mt-1">{formatNaira(protectionPremiumsNgn)}</div>
          <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Leadway Assurance escrow</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#DDEEF2] text-xs font-bold gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'transactions'
              ? 'border-[#00B4D8] text-[#00B4D8]'
              : 'border-transparent text-[#637984] hover:text-[#253B45]'
          }`}
        >
          Verified Transaction Ledger ({paidShipments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('refunds')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'refunds'
              ? 'border-[#00B4D8] text-[#00B4D8]'
              : 'border-transparent text-[#637984] hover:text-[#253B45]'
          }`}
        >
          <span>Dual-Control Refunds</span>
          {pendingRefunds.length > 0 && (
            <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded-full font-bold">
              {pendingRefunds.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'reconciliation'
              ? 'border-[#00B4D8] text-[#00B4D8]'
              : 'border-transparent text-[#637984] hover:text-[#253B45]'
          }`}
        >
          Terminal &amp; Bank Settlement
        </button>
      </div>

      {/* Tab 1: Transaction Ledger */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-[#253B45]">Consignment Payment Records</h3>
              <p className="text-xs text-[#637984]">All counter POS, card, and bank transfers reconciled in real time</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDEEF2] text-[11px] text-[#637984] uppercase tracking-wider font-bold bg-[#F7FCFD]">
                  <th className="py-2.5 px-3">Waybill / Payment Ref</th>
                  <th className="py-2.5 px-3">Consignor</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Amount Paid</th>
                  <th className="py-2.5 px-3">VAT (7.5%)</th>
                  <th className="py-2.5 px-3">Protection</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDEEF2]">
                {paidShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7FCFD]/60">
                    <td className="py-3 px-3 font-mono font-bold text-[#253B45]">
                      <div>{s.trackingNumber}</div>
                      <span className="text-[10px] text-[#637984] font-normal">{s.paymentReference || 'POS-REC-01'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#253B45]">{s.senderName}</div>
                      <div className="text-[10px] text-[#637984] font-mono">{s.senderPhone}</div>
                    </td>
                    <td className="py-3 px-3 capitalize text-[#637984]">
                      {s.paymentMethod || 'POS Terminal'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {formatNaira(s.quote?.totalAmount || 0)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#637984]">
                      {formatNaira(s.quote?.vatAmount || 0)}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-800">
                      {formatNaira(s.protectionFeeNgn || 0)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Reconciled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Dual Control Refunds */}
      {activeTab === 'refunds' && (
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#253B45]">Two-Person Dual-Control Refund Queue</h3>
            <p className="text-xs text-[#637984]">
              Mandatory anti-fraud policy: Refund initiator cannot self-approve. Refunds above ₦50,000 require executive owner authorization.
            </p>
          </div>

          <div className="space-y-3">
            {pendingRefunds.length === 0 ? (
              <div className="p-8 text-center text-[#637984] text-xs">
                No refund requests pending review. All customer refund requests are reconciled.
              </div>
            ) : (
              pendingRefunds.map((req) => (
                <div key={req.id} className="p-4 border border-amber-200 bg-amber-50/30 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#253B45]">{req.title}</div>
                      <div className="text-xs text-[#637984] mt-0.5">
                        Requester: <span className="font-semibold text-[#253B45]">{req.requesterName}</span> ({req.requesterRole}) · Target: {req.targetId}
                      </div>
                      <p className="text-xs text-slate-700 mt-1 italic">"{req.reason}"</p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black font-mono text-amber-900 block">
                        {formatNaira(req.amountNgn || 0)}
                      </span>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                        Pending 2nd Signature
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      placeholder="Audit reason or bank transaction reversal reference..."
                      value={refundNote}
                      onChange={(e) => setRefundNote(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-[#DDEEF2] rounded-lg bg-white"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleRejectRefund(req.id)}
                        className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveRefund(req.id)}
                        className="flex-1 sm:flex-initial px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                      >
                        Approve &amp; Release Refund
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Reconciliation Settings */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white border border-[#DDEEF2] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#253B45]">Corporate Payout Bank Account</h3>
            <p className="text-xs text-[#637984]">Verified settlement account for gateway disbursements</p>
          </div>

          <div className="p-4 border border-[#DDEEF2] rounded-xl bg-[#F7FCFD] max-w-md space-y-2 text-xs text-[#253B45]">
            <div className="flex justify-between">
              <span className="text-[#637984]">Bank Name:</span>
              <span className="font-bold">{payoutSettings.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#637984]">Account Number:</span>
              <span className="font-mono font-bold">{payoutSettings.accountNumberMasked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#637984]">Beneficiary:</span>
              <span className="font-semibold">{payoutSettings.accountName}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#DDEEF2]">
              <span className="text-[#637984]">Refund Threshold:</span>
              <span className="font-bold text-[#00B4D8]">{formatNaira(payoutSettings.refundThresholdNgn)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
