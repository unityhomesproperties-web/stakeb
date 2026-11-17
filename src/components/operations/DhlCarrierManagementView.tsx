import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Search,
  Package,
  Plane,
  FileText,
  Key,
} from 'lucide-react';
import { translateDhlStatusCodeToPlainEnglish } from '../../services/dhl-api';
import { canHandoverShipmentToCarrier } from '../../utils/adjustment-engine';

export const DhlCarrierManagementView: React.FC = () => {
  const {
    shipments,
    paymentAdjustments,
    dhlConfig,
    updateDhlConfig,
    testDhlConnection,
    bookDhlCarrierForShipment,
  } = useDemo();

  const [testResult, setTestResult] = useState<{
    connected: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(dhlConfig.apiKey || '');
  const [accountNumberInput, setAccountNumberInput] = useState(dhlConfig.accountNumber || '');
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>(dhlConfig.environment || 'sandbox');
  const [searchCode, setSearchCode] = useState('');
  const [queueFilter, setQueueFilter] = useState<'all' | 'ready' | 'booking_failed' | 'dispatched'>('all');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);

  const handleRunConnectionTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      const res = testDhlConnection();
      setTestResult(res);
      setIsTesting(false);
    }, 700);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    updateDhlConfig({
      apiKey: apiKeyInput.trim(),
      accountNumber: accountNumberInput.trim(),
      environment,
    });
    setBookingSuccessMsg('DHL Express credentials saved to local environment settings.');
    setTimeout(() => setBookingSuccessMsg(null), 3000);
  };

  const handleBookDhl = (shipmentId: string) => {
    setBookingErrorMsg(null);
    setBookingSuccessMsg(null);
    const res = bookDhlCarrierForShipment(shipmentId);
    if (!res.success) {
      setBookingErrorMsg(res.message || res.disclaimer || 'Carrier dispatch blocked or failed.');
      return;
    }
    setBookingSuccessMsg(
      `Waybill ${res.dhlTrackingNumber} attached cleanly! ${res.disclaimer}`
    );
    setTimeout(() => setBookingSuccessMsg(null), 5000);
  };

  // Shipments with DHL or eligible for DHL booking
  const dhlShipments = shipments.filter((s) => {
    const matchesQueue =
      queueFilter === 'all' ||
      (queueFilter === 'ready' && !s.dhlTrackingNumber && s.status !== 'booking_failed') ||
      (queueFilter === 'booking_failed' && s.status === 'booking_failed') ||
      (queueFilter === 'dispatched' && Boolean(s.dhlTrackingNumber));
    if (!matchesQueue) return false;
    if (!searchCode.trim()) return true;
    const q = searchCode.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      (s.dhlTrackingNumber && s.dhlTrackingNumber.toLowerCase().includes(q)) ||
      s.recipientName.toLowerCase().includes(q) ||
      s.destinationCountry.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Top Warning Banner: Honest Carrier Integration Disclosure */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">
            DHL Express Carrier Integration Architecture
          </span>
          <p className="leading-relaxed text-[11px]">
            Swiftvero coordinates pickups, performs certified digital scale weighing at our Lagos operations facility, and attaches international DHL waybills to permanent SWV- codes. If a carrier API request fails, status moves strictly to <strong>booking_failed</strong>—no fake waybill is generated and shipment will never advance to In Transit.
          </p>
        </div>
      </div>

      {bookingSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bookingSuccessMsg}</span>
        </div>
      )}

      {bookingErrorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{bookingErrorMsg}</span>
        </div>
      )}

      {/* Grid: 2 Columns (Credentials & Connection vs 2-Reference Architecture Lookup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Connection Testing & Credentials */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#DCEFF3] dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] dark:bg-sky-950 flex items-center justify-center text-[#00B4D8]">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B] dark:text-white">DHL API Credentials</h3>
                  <p className="text-[11px] text-[#6A808C] dark:text-slate-400">Carrier gateway connectivity</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  dhlConfig.isConfigured
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {dhlConfig.isConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="text-[11px] text-[#6A808C] dark:text-slate-400 font-semibold block mb-1">
                  Environment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEnvironment('sandbox')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      environment === 'sandbox'
                        ? 'bg-[#00B4D8] text-white border-[#00B4D8]'
                        : 'bg-white dark:bg-slate-800 border-[#DCEFF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#F5FBFD]'
                    }`}
                  >
                    Sandbox (Test Mode)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvironment('live')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      environment === 'live'
                        ? 'bg-[#00B4D8] text-white border-[#00B4D8]'
                        : 'bg-white dark:bg-slate-800 border-[#DCEFF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#F5FBFD]'
                    }`}
                  >
                    Live Production
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#6A808C] dark:text-slate-400 font-semibold block mb-1">
                  DHL API Key
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="e.g. dhl_sandbox_key_xxxx"
                  className="w-full px-3 py-2 rounded-xl border border-[#DCEFF3] dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:outline-hidden focus:border-[#00B4D8]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6A808C] dark:text-slate-400 font-semibold block mb-1">
                  DHL Account Number
                </label>
                <input
                  type="text"
                  value={accountNumberInput}
                  onChange={(e) => setAccountNumberInput(e.target.value)}
                  placeholder="e.g. 962819201"
                  className="w-full px-3 py-2 rounded-xl border border-[#DCEFF3] dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:outline-hidden focus:border-[#00B4D8]"
                />
              </div>

              {/* Demo API Failure Isolation Toggle */}
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1.5">
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="font-bold text-rose-900 dark:text-rose-200">
                    Simulate DHL API Failure (Demo Isolation)
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(dhlConfig.simulateFailure)}
                    onChange={(e) => updateDhlConfig({ simulateFailure: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                </label>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-snug">
                  When enabled, booking calls return a simulated gateway timeout, setting status to <strong>booking_failed</strong> without inventing a DHL waybill.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#00B4D8] hover:bg-[#009BB8] text-white font-bold transition-all shadow-xs"
                >
                  Save Configuration
                </button>
                <button
                  type="button"
                  onClick={handleRunConnectionTest}
                  disabled={isTesting}
                  className="py-2 px-3.5 rounded-xl border border-[#90E0EF] bg-[#CAF0F8] hover:bg-[#BDEBF5] text-[#0F172A] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>
              </div>
            </form>

            {/* Test Connection Outcome */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  testResult.connected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {testResult.connected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    {testResult.connected ? 'Connection Succeeded' : 'Integration Not Configured'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                {testResult.timestamp && (
                  <span className="text-[10px] text-slate-400 block pt-1">
                    Tested at: {new Date(testResult.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): 2-Reference Architecture Cross-Lookup */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#DCEFF3] dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCEFF3] dark:border-slate-800">
              <div>
                <h3 className="font-bold text-[#1E293B] dark:text-white">
                  2-Reference Cross-Lookup &amp; Carrier Dispatch
                </h3>
                <p className="text-[11px] text-[#6A808C] dark:text-slate-400">
                  Cross-reference permanent SWV-YY-XXXXXX with DHL Waybill Number (DHL-XXXXXXXXXX)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={queueFilter}
                  onChange={(e) => setQueueFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#DCEFF3] dark:border-slate-700 text-xs bg-[#F7FCFD] dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Shipments ({shipments.length})</option>
                  <option value="ready">Awaiting Dispatch ({shipments.filter((s) => !s.dhlTrackingNumber && s.status !== 'booking_failed').length})</option>
                  <option value="booking_failed">Booking Failed ({shipments.filter((s) => s.status === 'booking_failed').length})</option>
                  <option value="dispatched">Dispatched ({shipments.filter((s) => Boolean(s.dhlTrackingNumber)).length})</option>
                </select>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search SWV or DHL number..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    className="w-52 sm:w-56 pl-8 pr-3 py-1.5 rounded-xl border border-[#DCEFF3] dark:border-slate-700 text-xs bg-[#F7FCFD] dark:bg-slate-800 focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>
              </div>
            </div>

            {/* Shipments Table */}
            <div className="divide-y divide-[#DCEFF3] dark:divide-slate-800 border border-[#DCEFF3] dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              {dhlShipments.map((s) => {
                const guard = canHandoverShipmentToCarrier({
                  shipment: s,
                  adjustments: paymentAdjustments,
                });
                const isBookingFailed = s.status === 'booking_failed';
                return (
                <div
                  key={s.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7FCFD] dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#1E293B] dark:text-white">
                        {s.trackingNumber}
                      </span>
                      {s.dhlTrackingNumber ? (
                        <span className="font-mono text-[11px] font-bold text-[#0F172A] bg-[#CAF0F8] px-2 py-0.5 rounded-md border border-[#90E0EF]">
                          {s.dhlTrackingNumber}
                        </span>
                      ) : isBookingFailed ? (
                        <span className="text-[10px] font-bold text-rose-800 dark:text-rose-200 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-800">
                          BOOKING FAILED (Retry Required)
                        </span>
                      ) : !guard.allowed ? (
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                          Dispatch Locked {guard.blockingAdjustmentRef ? `(${guard.blockingAdjustmentRef})` : '(Unpaid)'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          Ready for DHL Dispatch
                        </span>
                      )}
                    </div>
                    <p className="text-[#6A808C] dark:text-slate-400 text-[11px]">
                      Destination: {s.destinationCity}, {s.destinationCountry} &bull; Receiver: {s.recipientName}
                    </p>
                    {isBookingFailed && s.carrierBookingError && (
                      <p className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold">
                        Error: {s.carrierBookingError}
                      </p>
                    )}
                    {!s.dhlTrackingNumber && !guard.allowed && guard.reason && (
                      <p className="text-[10px] text-rose-700 dark:text-rose-300 font-medium">{guard.reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {!s.dhlTrackingNumber ? (
                      <button
                        type="button"
                        onClick={() => handleBookDhl(s.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-all ${
                          isBookingFailed
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : guard.allowed
                            ? 'bg-[#00B4D8] hover:bg-[#009BB8] text-white'
                            : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                        }`}
                      >
                        <Plane className="w-3.5 h-3.5" />
                        <span>
                          {isBookingFailed
                            ? 'Retry DHL Booking'
                            : guard.allowed
                            ? 'Book with DHL'
                            : 'Attempt Handover'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Carrier Dispatched</span>
                      </span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
