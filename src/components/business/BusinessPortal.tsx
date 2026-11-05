import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { calculateShippingQuote, formatNaira } from '../../utils/shipping-calculator';
import { ParcelItem, ServiceTier, ShipmentRecord } from '../../types';
import { StatusPill } from '../common/StatusPill';
import {
  Building2,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Clock,
  Printer,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Download,
  X,
  Plane,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface BatchRecipient {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  destinationCountry: string;
  destinationCity: string;
  weightKg: number;
  dimensions: { length: number; width: number; height: number };
  contentsDescription: string;
  declaredValueNgn: number;
  serviceTier: ServiceTier;
}

export const BusinessPortal: React.FC = () => {
  const { currentCustomer, shipments, addShipment, addAuditLog } = useDemo();

  const [activeTab, setActiveTab] = useState<'shipments' | 'batch_booking' | 'profile'>('shipments');

  // Saved sender details (entered once)
  const [senderName, setSenderName] = useState('Babatunde Adeleke (Lekki Heritage Exports PLC)');
  const [senderPhone, setSenderPhone] = useState('+234 802 888 7766');
  const [senderEmail, setSenderEmail] = useState('babatunde@lekkiheritage.ng');
  const [senderAddress, setSenderAddress] = useState('Plot 8, Commercial Avenue, Lekki Free Trade Zone, Lagos');

  const [recipients, setRecipients] = useState<BatchRecipient[]>([
    {
      id: 'rec_1',
      recipientName: 'Harrods Luxury Consignment UK',
      recipientPhone: '+44 20 7730 1234',
      recipientAddress: '87-135 Brompton Rd, Knightsbridge, London SW1X 7XL',
      destinationCountry: 'United Kingdom',
      destinationCity: 'London',
      weightKg: 8.5,
      dimensions: { length: 45, width: 35, height: 25 },
      contentsDescription: 'Handcrafted Nigerian Bronze Sculptures & Yoruba Carvings',
      declaredValueNgn: 650000,
      serviceTier: 'priority',
    },
    {
      id: 'rec_2',
      recipientName: 'African Art Boutique LLC',
      recipientPhone: '+1 212 555 9812',
      recipientAddress: '520 West 28th St, Chelsea, New York, NY 10001',
      destinationCountry: 'United States',
      destinationCity: 'New York',
      weightKg: 6.2,
      dimensions: { length: 40, width: 30, height: 20 },
      contentsDescription: 'Indigo Dyed Adire Textiles & Silk Embroidered Agbada',
      declaredValueNgn: 420000,
      serviceTier: 'priority',
    },
  ]);

  const [batchCreated, setBatchCreated] = useState<string[] | null>(null);

  const handleAddRecipient = () => {
    const newRec: BatchRecipient = {
      id: `rec_${Date.now()}`,
      recipientName: '',
      recipientPhone: '',
      recipientAddress: '',
      destinationCountry: 'United Kingdom',
      destinationCity: 'London',
      weightKg: 5.0,
      dimensions: { length: 35, width: 25, height: 20 },
      contentsDescription: 'Export Handicrafts & Commercial Samples',
      declaredValueNgn: 250000,
      serviceTier: 'priority',
    };
    setRecipients([...recipients, newRec]);
  };

  const handleRemoveRecipient = (id: string) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const handleUpdateRecipient = (id: string, updates: Partial<BatchRecipient>) => {
    setRecipients(recipients.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'RecipientName,Phone,Address,DestinationCountry,DestinationCity,WeightKg,LengthCm,WidthCm,HeightCm,ContentsDescription,DeclaredValueNgn,ServiceTier\n' +
      'Harrods Luxury Consignment UK,+44 20 7730 1234,87-135 Brompton Rd,United Kingdom,London,8.5,45,35,25,Handcrafted Nigerian Bronze Sculptures,650000,priority\n' +
      'African Art Boutique LLC,+1 212 555 9812,520 West 28th St,United States,New York,6.2,40,30,20,Indigo Dyed Adire Textiles,420000,priority\n' +
      'Toronto Afro Trade Distributors,+1 416 555 8820,400 University Ave,Canada,Toronto,10.0,45,35,30,Wood Carvings & Artwork,450000,standard\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'swiftvero_bulk_recipient_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateCsvUpload = () => {
    const imported: BatchRecipient[] = [
      {
        id: `rec_${Date.now()}_1`,
        recipientName: 'Harrods Luxury Consignment UK',
        recipientPhone: '+44 20 7730 1234',
        recipientAddress: '87-135 Brompton Rd, Knightsbridge, London SW1X 7XL',
        destinationCountry: 'United Kingdom',
        destinationCity: 'London',
        weightKg: 8.5,
        dimensions: { length: 45, width: 35, height: 25 },
        contentsDescription: 'Handcrafted Nigerian Bronze Sculptures & Yoruba Carvings',
        declaredValueNgn: 650000,
        serviceTier: 'priority',
      },
      {
        id: `rec_${Date.now()}_2`,
        recipientName: 'African Art Boutique LLC',
        recipientPhone: '+1 212 555 9812',
        recipientAddress: '520 West 28th St, Chelsea, New York, NY 10001',
        destinationCountry: 'United States',
        destinationCity: 'New York',
        weightKg: 6.2,
        dimensions: { length: 40, width: 30, height: 20 },
        contentsDescription: 'Indigo Dyed Adire Textiles & Silk Embroidered Agbada',
        declaredValueNgn: 420000,
        serviceTier: 'priority',
      },
      {
        id: `rec_${Date.now()}_3`,
        recipientName: 'Toronto Afro Trade Distributors',
        recipientPhone: '+1 416 555 8820',
        recipientAddress: '400 University Ave, Toronto, ON M5G 1S5',
        destinationCountry: 'Canada',
        destinationCity: 'Toronto',
        weightKg: 10.0,
        dimensions: { length: 45, width: 35, height: 30 },
        contentsDescription: 'Yoruba Wooden Sculptures & Beaded Regalia',
        declaredValueNgn: 450000,
        serviceTier: 'standard',
      },
    ];
    setRecipients(imported);
  };

  const batchQuotes = recipients.map((r) => {
    return calculateShippingQuote({
      direction: 'export',
      originCountry: 'Nigeria',
      originCity: 'Lagos',
      destinationCountry: r.destinationCountry,
      destinationCity: r.destinationCity,
      weightKg: r.weightKg,
      dimensions: r.dimensions,
      serviceTier: r.serviceTier,
      pickupType: 'doorstep',
    });
  });

  const totalBatchNgn = batchQuotes.reduce((acc, q) => acc + q.totalAmount, 0);
  const totalWeightKg = recipients.reduce((acc, r) => acc + r.weightKg, 0);

  const handleCommitBatch = () => {
    const createdTrackingNumbers: string[] = [];

    recipients.forEach((rec, idx) => {
      const q = batchQuotes[idx];
      const trackingNumber = `SWV-2026-NG${Math.floor(2000 + Math.random() * 7000)}`;
      createdTrackingNumbers.push(trackingNumber);

      const items: ParcelItem[] = [
        {
          id: `item_${Date.now()}_${idx}`,
          description: rec.contentsDescription,
          quantity: 1,
          declaredValue: rec.declaredValueNgn,
        },
      ];

      const record: ShipmentRecord = {
        id: `ship_batch_${Date.now()}_${idx}`,
        trackingNumber,
        direction: 'export',
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        customerEmail: currentCustomer.email,
        customerPhone: currentCustomer.phone,
        senderName,
        senderPhone,
        senderAddress,
        originCountry: 'Nigeria',
        originCity: 'Lagos',
        recipientName: rec.recipientName,
        recipientPhone: rec.recipientPhone,
        recipientAddress: rec.recipientAddress,
        destinationCountry: rec.destinationCountry,
        destinationCity: rec.destinationCity,
        contentsDescription: rec.contentsDescription,
        items,
        declaredWeightKg: rec.weightKg,
        declaredDimensions: rec.dimensions,
        pickupType: 'doorstep',
        pickupStatus: 'requested',
        pickupStatusLabel: 'Doorstep Pickup Requested (Free ₦0)',
        pickupAddress: senderAddress,
        status: 'booked',
        quote: q,
        selectedTier: rec.serviceTier,
        estimatedDeliveryDisplay: q.estimatedDeliveryDisplay,
        paymentStatus: 'paid',
        paymentReference: `CORP-INV-BATCH-${Date.now().toString().slice(-6)}`,
        paymentMethod: 'Corporate Credit Line (30-day Invoice)',
        trackingEvents: [
          {
            id: `ev_batch_${Date.now()}_${idx}`,
            timestamp: new Date().toISOString(),
            stage: 'Batch Booking Confirmed',
            location: 'Lekki Commercial Terminal, Lagos',
            description: `Commercial export consignment registered under enterprise account ${currentCustomer.companyName}. Free doorstep collection scheduled.`,
          },
        ],
        lastUpdateTimestamp: new Date().toISOString(),
        customerAcknowledgedTerms: true,
        customerAcknowledgedDeclaration: true,
        kycRequiredAtBooking: true,
        cashbackEarned: Math.round(q.freightCharge * 0.03),
        cashbackStatus: 'pending',
        hasReview: false,
        createdAt: new Date().toISOString(),
      };

      addShipment(record);
    });

    addAuditLog({
      actorName: currentCustomer.name,
      actorRole: 'business',
      action: 'BATCH_CONSIGNMENT_COMMITTED',
      targetType: 'shipment',
      targetId: `BATCH-${Date.now().toString().slice(-5)}`,
      details: `Enterprise consignor booked ${recipients.length} consignments (${totalWeightKg.toFixed(1)} kg total). Value: ₦${totalBatchNgn.toLocaleString()}.`,
    });

    setBatchCreated(createdTrackingNumbers);
    setActiveTab('shipments');
  };

  const businessShipments = shipments.filter(
    (s) =>
      s.customerId === currentCustomer.id ||
      s.customerEmail.includes('lekki') ||
      s.senderName.includes('Lekki')
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Restrained Clean Header (No dark green anywhere) */}
      <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00B4D8]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[#6A808C]">
              Enterprise Consignor Desk
            </span>
          </div>
          <h1 className="text-2xl font-serif-display font-medium text-[#354B55] mt-1">
            {currentCustomer.companyName || 'Lekki Heritage Exports PLC'}
          </h1>
          <p className="text-xs text-[#6A808C] mt-0.5">
            Consignor: {currentCustomer.name} · RC 1948201 · FIRS TIN Verified
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('batch_booking')}
            className="px-4 py-2 bg-[#00B4D8] hover:opacity-95 text-white text-xs font-semibold rounded-lg transition-opacity flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Multi-Recipient Batch</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {batchCreated && (
        <div className="p-4 bg-[#CAF0F8] border border-[#90E0EF] rounded-xl text-xs text-[#354B55] flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#00B4D8] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-[#354B55]">
                Commercial Batch Consignment Dispatched
              </h4>
              <p className="mt-0.5 text-[#6A808C]">
                Generated {batchCreated.length} official waybills: {batchCreated.join(', ')}. Doorstep pickup has been scheduled for your facility.
              </p>
            </div>
          </div>
          <button
            onClick={() => setBatchCreated(null)}
            className="text-[#6A808C] hover:text-[#354B55] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Visual Anchor: Active Commercial Consignments */}
      {activeTab === 'shipments' && (
        <>
          <div className="bg-white rounded-2xl border border-[#DCEFF3] p-8 sm:p-10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[#6A808C]">
                Active Commercial Export Consignments
              </span>
              <span className="text-xs text-[#00B4D8] font-medium bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                Enterprise Account
              </span>
            </div>

            {/* Anchor number */}
            <div className="flex items-baseline gap-3">
              <span className="text-6xl sm:text-7xl font-serif-display font-bold text-[#354B55] tracking-tight">
                {businessShipments.length}
              </span>
              <span className="text-sm text-[#6A808C]">
                active commercial consignments
              </span>
            </div>

            {/* Secondary stats */}
            <div className="pt-4 border-t border-[#DCEFF3] flex flex-wrap items-center gap-6 sm:gap-10 text-xs text-[#6A808C]">
              <div>
                <span className="text-[#6A808C]">Volume Cashback Accrued: </span>
                <strong className="text-[#00B4D8] font-semibold">{formatNaira(currentCustomer.cashbackBalance)}</strong>
              </div>
              <div className="h-3 w-px bg-[#DCEFF3]" />
              <div>
                <span className="text-[#6A808C]">Scheduled Pickup Facility: </span>
                <strong className="text-[#354B55] font-semibold">Lekki Free Trade Zone</strong>
              </div>
              <div className="h-3 w-px bg-[#DCEFF3]" />
              <div>
                <span className="text-[#6A808C]">Billing Terms: </span>
                <strong className="text-[#354B55] font-semibold">30-day Invoicing</strong>
              </div>
            </div>
          </div>

          {/* Simple icon-plus-label shipment rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-serif-display font-medium text-[#354B55]">
                Commercial Shipments Ledger
              </h2>
              <button
                onClick={() => window.print()}
                className="text-xs text-[#6A808C] hover:text-[#00B4D8] transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Manifest</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#DCEFF3] divide-y divide-[#DCEFF3] overflow-hidden shadow-xs">
              {businessShipments.map((s) => (
                <div
                  key={s.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F5FBFD] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#354B55]">
                          {s.trackingNumber}
                        </span>
                        <span className="text-xs text-[#6A808C] truncate">
                          · {s.recipientName}
                        </span>
                      </div>
                      <p className="text-xs text-[#6A808C]">
                        → {s.destinationCity}, {s.destinationCountry} ({s.contentsDescription})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="mb-1">
                        <StatusPill status={s.status} isOverdue={s.isUpdateOverdue} />
                      </div>
                      <div className="text-xs font-mono font-medium text-[#354B55]">
                        {formatNaira(s.quote.totalAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Quick Links at bottom */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[#6A808C] px-1">
              Enterprise Tools
            </h3>
            <div className="bg-white rounded-2xl border border-[#DCEFF3] divide-y divide-[#DCEFF3] overflow-hidden shadow-xs">
              <button
                onClick={() => setActiveTab('batch_booking')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-[#00B4D8]" />
                  <div>
                    <span className="text-xs font-medium text-[#354B55] block">Multi-Recipient Batch Booking</span>
                    <span className="text-[11px] text-[#6A808C]">Enter sender once, configure multiple destinations</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#00B4D8]" />
                  <div>
                    <span className="text-xs font-medium text-[#354B55] block">Corporate CAC &amp; FIRS Credentials</span>
                    <span className="text-[11px] text-[#6A808C]">Tax identification and commercial volume rate terms</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sub-view navigation */}
      {activeTab !== 'shipments' && (
        <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
          <button
            onClick={() => setActiveTab('shipments')}
            className="text-xs font-medium text-[#00B4D8] hover:underline flex items-center gap-1"
          >
            ← Back to Commercial Ledger
          </button>
          <span className="text-xs text-[#6A808C] capitalize">
            {activeTab.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Batch Booking Tab */}
      {activeTab === 'batch_booking' && (
        <div className="space-y-6 text-xs">
          {/* Saved Consignor Header */}
          <div className="p-5 bg-white rounded-2xl border border-[#DCEFF3] space-y-3 shadow-xs">
            <span className="text-xs font-semibold text-[#354B55] block">
              Corporate Sender (Saved Once for Entire Batch)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-[#6A808C] mb-1">Company</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg bg-[#F5FBFD]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#6A808C] mb-1">Phone</label>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg bg-[#F5FBFD]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#6A808C] mb-1">Work Email</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg bg-[#F5FBFD]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#6A808C] mb-1">Collection Address</label>
                <input
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg bg-[#F5FBFD]"
                />
              </div>
            </div>
          </div>

          {/* Multiple Independent Destinations */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#DCEFF3]">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-serif-display font-medium text-[#354B55]">
                  Destinations in Batch ({recipients.length})
                </h2>
                <span className="font-mono text-xs font-bold text-[#00B4D8] bg-[#CAF0F8] px-2.5 py-0.5 rounded border border-[#90E0EF]">
                  Ref: SV-BATCH-001
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="px-3 py-1.5 bg-[#F5FBFD] text-[#354B55] text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors border border-[#DCEFF3] flex items-center gap-1.5"
                  title="Download blank Excel / CSV template"
                >
                  <Download className="w-3.5 h-3.5 text-[#00B4D8]" />
                  <span>CSV Template</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateCsvUpload}
                  className="px-3 py-1.5 bg-[#CAF0F8] text-[#00B4D8] text-xs font-medium rounded-lg hover:bg-[#CAF0F8] transition-colors border border-[#90E0EF] flex items-center gap-1.5"
                  title="Simulate importing recipient data from CSV"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Import CSV File</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="px-3.5 py-1.5 bg-[#00B4D8] text-white font-semibold rounded-lg hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Recipient</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {recipients.map((rec, index) => {
                const q = batchQuotes[index];
                return (
                  <div
                    key={rec.id}
                    className="p-5 bg-white rounded-2xl border border-[#DCEFF3] shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#DCEFF3] pb-2">
                      <span className="font-semibold text-xs text-[#354B55]">
                        Destination #{index + 1}
                      </span>
                      {recipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(rec.id)}
                          className="text-[#6A808C] hover:text-[#9B2E26] p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#6A808C] mb-1">Recipient Name</label>
                        <input
                          type="text"
                          value={rec.recipientName}
                          onChange={(e) => handleUpdateRecipient(rec.id, { recipientName: e.target.value })}
                          className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6A808C] mb-1">Phone</label>
                        <input
                          type="tel"
                          value={rec.recipientPhone}
                          onChange={(e) => handleUpdateRecipient(rec.id, { recipientPhone: e.target.value })}
                          className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6A808C] mb-1">Destination Country</label>
                        <select
                          value={rec.destinationCountry}
                          onChange={(e) => handleUpdateRecipient(rec.id, { destinationCountry: e.target.value })}
                          className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg bg-white"
                        >
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="Germany">Germany</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#6A808C] mb-1">Full Address</label>
                        <input
                          type="text"
                          value={rec.recipientAddress}
                          onChange={(e) => handleUpdateRecipient(rec.id, { recipientAddress: e.target.value })}
                          className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6A808C] mb-1">Commercial Contents</label>
                        <input
                          type="text"
                          value={rec.contentsDescription}
                          onChange={(e) => handleUpdateRecipient(rec.id, { contentsDescription: e.target.value })}
                          className="w-full px-3 py-2 border border-[#DCEFF3] rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#CAF0F8] p-3 rounded-xl border border-[#90E0EF]">
                      <div>
                        <span className="text-[10px] text-[#6A808C] block">Weight (kg)</span>
                        <input
                          type="number"
                          step="0.5"
                          value={rec.weightKg}
                          onChange={(e) => handleUpdateRecipient(rec.id, { weightKg: parseFloat(e.target.value) || 1 })}
                          className="w-full px-2 py-1 border border-[#DCEFF3] rounded-lg bg-white font-mono text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6A808C] block">Customs Value</span>
                        <input
                          type="number"
                          value={rec.declaredValueNgn}
                          onChange={(e) => handleUpdateRecipient(rec.id, { declaredValueNgn: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-2 py-1 border border-[#DCEFF3] rounded-lg bg-white font-mono text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6A808C] block">Service Tier</span>
                        <select
                          value={rec.serviceTier}
                          onChange={(e) => handleUpdateRecipient(rec.id, { serviceTier: e.target.value as ServiceTier })}
                          className="w-full px-2 py-1 border border-[#DCEFF3] rounded-lg bg-white text-xs mt-1"
                        >
                          <option value="priority">Priority Express (2-4d)</option>
                          <option value="standard">Standard Air (5-7d)</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-center text-right">
                        <span className="text-[10px] text-[#6A808C]">Quoted Rate</span>
                        <span className="font-mono font-bold text-xs text-[#00B4D8]">
                          {formatNaira(q.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Batch Summary */}
          <div className="p-6 bg-white rounded-2xl border border-[#DCEFF3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-0.5">
              <span className="text-xs text-[#6A808C]">
                Consolidated Batch Invoice ({recipients.length} consignments · {totalWeightKg.toFixed(1)} kg)
              </span>
              <div className="text-2xl font-serif-display font-bold text-[#354B55]">
                {formatNaira(totalBatchNgn)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCommitBatch}
              className="px-6 py-3 bg-[#00B4D8] hover:opacity-95 text-white font-semibold rounded-lg transition-opacity shadow-xs"
            >
              Book Commercial Batch
            </button>
          </div>
        </div>
      )}

      {/* Corporate Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs max-w-xl mx-auto space-y-4 text-xs">
          <div className="border-b border-[#DCEFF3] pb-3">
            <h2 className="text-base font-serif-display font-medium text-[#354B55]">
              Corporate Credentials
            </h2>
            <p className="text-[#6A808C] mt-0.5">
              Corporate Affairs Commission (CAC) and FIRS tax details.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">Company:</span>
              <span className="font-medium text-[#354B55]">{currentCustomer.companyName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">Registration:</span>
              <span className="font-mono text-[#354B55]">RC 1948201</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">FIRS TIN:</span>
              <span className="font-mono text-[#354B55]">29481920-0001</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">Signatory:</span>
              <span className="font-medium text-[#354B55]">{currentCustomer.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
