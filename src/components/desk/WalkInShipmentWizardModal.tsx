import React, { useState } from 'react';
import {
  X,
  Package,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Camera,
  Printer,
  DollarSign,
  CreditCard,
  Building2,
  FileText,
  User,
  MapPin,
  Phone,
  Scale,
  Sparkles,
  Info,
  Clock,
  Zap,
  Check,
} from 'lucide-react';
import { CustomerProfile, ShipmentRecord, WalkInPackage, ServiceTier } from '../../types';
import { useDemo } from '../../context/DemoContext';
import { calculateProtectionPremium } from '../../utils/protection-calculator';
import { calculateShippingQuote, formatNaira } from '../../utils/shipping-calculator';

interface WalkInShipmentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomer?: CustomerProfile | null;
  onOpenWaybill: (shipment: ShipmentRecord) => void;
  onOpenKycForCustomer: (customer: CustomerProfile) => void;
}

export const WalkInShipmentWizardModal: React.FC<WalkInShipmentWizardModalProps> = ({
  isOpen,
  onClose,
  initialCustomer,
  onOpenWaybill,
  onOpenKycForCustomer,
}) => {
  const {
    currentStaffUser,
    activeBranchId,
    branches,
    customers,
    addShipment,
    protectionConfig,
    addProtectionCertificate,
  } = useDemo();

  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // 8-Step Clean Wizard
  // 1: Customer -> 2: Sender/Receiver -> 3: Package Details -> 4: Shipping Speed -> 5: Cargo Protection -> 6: Inspection & Weighing -> 7: Quotation & Checkout -> 8: Payment & Issue
  const [step, setStep] = useState<number>(1);

  // STEP 1: Customer identification
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(
    initialCustomer || Object.values(customers)[0] || null
  );

  // New Walk-in Quick Fields
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCountry, setNewCustCountry] = useState('Nigeria');

  // STEP 2: Sender & Receiver
  const [senderName, setSenderName] = useState(initialCustomer?.name || 'David Okafor');
  const [senderPhone, setSenderPhone] = useState(initialCustomer?.phone || '+234 803 555 0192');
  const [senderEmail, setSenderEmail] = useState(initialCustomer?.email || 'david.okafor@gmail.com');
  const [senderAddress, setSenderAddress] = useState(currentBranch.address);

  const [receiverName, setReceiverName] = useState('Dr. Chinedu Eze');
  const [receiverPhone, setReceiverPhone] = useState('+44 7700 900123');
  const [receiverEmail, setReceiverEmail] = useState('chinedu.eze@nhs.co.uk');
  const [destCountry, setDestCountry] = useState('United Kingdom');
  const [destCity, setDestCity] = useState('London');
  const [destAddress, setDestAddress] = useState('42 Kensington Church Street, London W8 4DB');
  const [destPostalCode, setDestPostalCode] = useState('W8 4DB');

  // STEP 3: Multi-Package Details
  const [packages, setPackages] = useState<WalkInPackage[]>([
    {
      id: 'pkg_1',
      description: 'Nigerian Provisions, Dry Seasonings & Native Fabrics',
      quantity: 1,
      actualWeightKg: 5.5,
      packageType: 'carton',
      declaredValueNgn: 120000,
      currency: 'NGN',
      isFragile: false,
      requiresSpecialHandling: false,
      inspectionNotes: 'Intake verified: Dry foodstuffs securely packed in food-grade wrapping, no restricted seeds or biologicals.',
      photoUrl: '/assets/aistudio/IMG-20261103-WA0011_710ee58a.jpg',
    },
  ]);

  // STEP 4: SHIPPING SPEED SELECTION (MANDATORY)
  const [serviceSpeed, setServiceSpeed] = useState<ServiceTier>('standard');

  // STEP 5: Cargo Protection
  const [protectionPlan, setProtectionPlan] = useState<'basic' | 'premium'>('basic');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // STEP 6: Inspection Checklist
  const [inspectionPassed, setInspectionPassed] = useState(true);
  const [prohibitedGoodsChecked, setProhibitedGoodsChecked] = useState(true);
  const [securitySealNumber, setSecuritySealNumber] = useState('SWV-SEAL-89421');

  // STEP 8: Payment
  const [paymentMethod, setPaymentMethod] = useState<'pos_terminal' | 'cash' | 'bank_transfer' | 'online_link'>('pos_terminal');
  const [posReference, setPosReference] = useState('POS-STANBIC-9824');
  const [isPaid, setIsPaid] = useState(true);

  if (!isOpen) return null;

  // Aggregate Calculations
  const totalWeightKg = packages.reduce((acc, p) => acc + (p.actualWeightKg * p.quantity), 0);
  const totalDeclaredValueNgn = packages.reduce((acc, p) => acc + (p.declaredValueNgn * p.quantity), 0);

  // Protection Calculation
  const protectionResult = calculateProtectionPremium({
    plan: protectionPlan,
    declaredValueNgn: totalDeclaredValueNgn,
    items: packages.map((p) => ({
      id: p.id,
      description: p.description,
      quantity: p.quantity,
      declaredValue: p.declaredValueNgn,
    })),
    config: protectionConfig,
  });

  // Shipping Quote Calculation with Speed and Protection
  const quote = calculateShippingQuote({
    direction: 'export',
    originCountry: 'Nigeria',
    originCity: currentBranch.city,
    destinationCountry: destCountry,
    destinationCity: destCity,
    weightKg: Math.max(1, totalWeightKg),
    dimensions: { length: 45, width: 35, height: 30 },
    serviceTier: serviceSpeed,
    protectionCharge: protectionResult.calculatedPremiumNgn,
    protectionPlan,
    protectionCoverageNgn: protectionResult.coverageLimitNgn,
    protectionRatePercentage: protectionResult.ratePercentage,
    protectionDeductibleText: '5% or ₦10,000 (whichever is higher)',
    items: packages.map((p) => ({
      id: p.id,
      description: p.description,
      quantity: p.quantity,
      declaredValue: p.declaredValueNgn,
    })),
  });

  // Priority fee difference calculation (illustrative clean difference)
  const priorityDifference = Math.max(0, quote.freightCharge - Math.round(quote.freightCharge / 1.35));

  // Customer selection helper
  const handleSelectCustomer = (c: CustomerProfile) => {
    setSelectedCustomer(c);
    setSenderName(c.name);
    setSenderPhone(c.phone);
    setSenderEmail(c.email);
  };

  const handleAddPackage = () => {
    const newPkg: WalkInPackage = {
      id: `pkg_${Date.now()}`,
      description: 'Carton of Assorted Goods',
      quantity: 1,
      actualWeightKg: 4.0,
      packageType: 'carton',
      declaredValueNgn: 45000,
      currency: 'NGN',
      isFragile: false,
      requiresSpecialHandling: false,
      inspectionNotes: 'Weighed on calibrated digital counter scale.',
      photoUrl: '/assets/aistudio/IMG-20261103-WA0011_710ee58a.jpg',
    };
    setPackages([...packages, newPkg]);
  };

  const handleRemovePackage = (index: number) => {
    if (packages.length <= 1) return;
    setPackages(packages.filter((_, idx) => idx !== index));
  };

  const handleUpdatePackage = (index: number, updates: Partial<WalkInPackage>) => {
    setPackages(
      packages.map((pkg, idx) => (idx === index ? { ...pkg, ...updates } : pkg))
    );
  };

  const handleFinishAndIssue = () => {
    const trackingNumber = `SWV-2026-WALK${Date.now().toString().slice(-4)}`;
    const newShipment: ShipmentRecord = {
      id: `ship_${Date.now()}`,
      trackingNumber,
      direction: 'export',
      customerId: selectedCustomer?.id || 'cust_walkin_01',
      customerName: senderName,
      customerEmail: senderEmail,
      customerPhone: senderPhone,
      senderName,
      senderPhone,
      senderAddress,
      originCountry: 'Nigeria',
      originCity: currentBranch.city,
      recipientName: receiverName,
      recipientPhone: receiverPhone,
      recipientAddress: destAddress,
      destinationCountry: destCountry,
      destinationCity: destCity,
      category: 'goods',
      contentsDescription: packages.map((p) => p.description).join(', '),
      items: packages.map((p) => ({
        id: p.id,
        description: p.description,
        quantity: p.quantity,
        declaredValue: p.declaredValueNgn,
      })),
      packageCount: packages.length,
      declaredWeightKg: totalWeightKg,
      declaredDimensions: { length: 45, width: 35, height: 30 },
      declaredValueNgn: totalDeclaredValueNgn,
      pickupType: 'hub',
      pickupStatus: 'picked_up',
      pickupStatusLabel: 'Received at Branch Counter',
      branchId: currentBranch.id,
      branchName: currentBranch.name,
      intakeStaffId: currentStaffUser?.staffId || 'SWV-STAFF-002',
      intakeStaffName: currentStaffUser?.name || 'Chioma Eze',
      status: 'booked',
      quote,
      selectedTier: serviceSpeed,
      estimatedDeliveryDisplay: quote.estimatedDeliveryDisplay,
      paymentStatus: isPaid ? 'paid' : 'unpaid',
      paymentMethod: `${paymentMethod.toUpperCase()} (${posReference || 'Counter'})`,
      paymentReference: posReference || `PAY-${Date.now().toString().slice(-6)}`,
      trackingEvents: [
        {
          id: 'evt_1',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          stage: 'Walk-In Consignment Received at Branch Counter',
          location: currentBranch.name,
          description: `Consignment accepted, physically inspected, and sealed by Desk Admin ${currentStaffUser?.name || 'Chioma Eze'}.`,
        },
      ],
      createdAt: new Date().toISOString(),
      lastUpdateTimestamp: new Date().toISOString(),
      customerAcknowledgedTerms: termsAccepted,
      customerAcknowledgedDeclaration: true,
      kycRequiredAtBooking: true,
      cashbackEarned: Math.round(quote.totalAmount * 0.05),
      cashbackStatus: 'pending',
      hasReview: false,
      protectionPlan,
      protectionFeeNgn: protectionResult.calculatedPremiumNgn,
      protectionCoverageNgn: protectionResult.coverageLimitNgn,
      protectionReference: `PROT-2026-${trackingNumber.slice(-6)}`,
      protectionTermsAccepted: termsAccepted,
      protectionProvider:
        protectionPlan === 'premium'
          ? 'Leadway Assurance Alliance (Underwriter Ref: LDW-NG-2026)'
          : 'Swiftvero Contractual Liability (Warsaw/Montreal Rule)',
    };

    addShipment(newShipment);

    if (protectionPlan === 'premium') {
      addProtectionCertificate({
        certificateNumber: `SWV-PROT-${trackingNumber.slice(-6)}`,
        shipmentTrackingNumber: newShipment.trackingNumber,
        customerName: senderName,
        customerEmail: senderEmail,
        customerPhone: senderPhone,
        declaredValueNgn: totalDeclaredValueNgn,
        protectionPlan: 'premium',
        coverageAmountNgn: protectionResult.coverageLimitNgn,
        premiumPaidNgn: protectionResult.calculatedPremiumNgn,
        ratePercentage: 1.5,
        deductibleText: '₦0 (Zero Deductible on Verified Courier Cargo)',
        termsVersion: 'v2.4-2026',
        providerName: 'Leadway Assurance Alliance (Nigeria)',
        bookingDate: new Date().toISOString().slice(0, 10),
        status: 'active',
        isSimulated: true,
      });
    }

    onClose();
    onOpenWaybill(newShipment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#253B45]/40 backdrop-blur-xs">
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl border border-[#DDEEF2] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header with Swiftvero Cyan Line */}
        <div className="h-1.5 w-full bg-[#00B4D8]" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDEEF2] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#253B45]">Create Walk-in Consignment</h3>
              <p className="text-[11px] text-[#637984]">
                Counter intake at {currentBranch.name} · Step {step} of 8
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#F7FCFD] border-b border-[#DDEEF2] flex items-center justify-between text-[11px] font-semibold text-[#637984] overflow-x-auto gap-2">
          {[
            '1. Customer',
            '2. Sender & Receiver',
            '3. Packages',
            '4. Shipping Speed',
            '5. Protection',
            '6. Inspection',
            '7. Quotation',
            '8. Payment',
          ].map((title, idx) => (
            <span
              key={idx}
              className={`whitespace-nowrap px-2 py-0.5 rounded-md transition-colors ${
                step === idx + 1
                  ? 'bg-[#00B4D8] text-white font-bold'
                  : step > idx + 1
                  ? 'text-[#00B4D8] font-bold bg-[#CAF0F8]/50'
                  : 'text-slate-400'
              }`}
            >
              {title}
            </span>
          ))}
        </div>

        {/* Wizard Step Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* STEP 1: CUSTOMER IDENTIFICATION */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#253B45]">Step 1: Customer Identification</h4>
                <p className="text-xs text-[#637984]">
                  Select an existing registered customer or enter quick details for a walk-in consignor.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex border border-[#DDEEF2] rounded-xl overflow-hidden p-1 bg-[#F7FCFD] max-w-sm">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    customerMode === 'existing'
                      ? 'bg-white text-[#00B4D8] shadow-2xs'
                      : 'text-[#637984] hover:text-[#253B45]'
                  }`}
                >
                  Existing Customer
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    customerMode === 'new'
                      ? 'bg-white text-[#00B4D8] shadow-2xs'
                      : 'text-[#637984] hover:text-[#253B45]'
                  }`}
                >
                  New Walk-in Customer
                </button>
              </div>

              {customerMode === 'existing' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search customer by name, phone, or ID..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#DDEEF2] rounded-xl bg-white text-xs focus:border-[#00B4D8] focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto border border-[#DDEEF2] rounded-xl p-2 bg-[#F7FCFD]">
                    {Object.values(customers)
                      .filter((c) =>
                        !customerSearchQuery ||
                        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                        c.phone.includes(customerSearchQuery) ||
                        c.id.toLowerCase().includes(customerSearchQuery.toLowerCase())
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            selectedCustomer?.id === c.id
                              ? 'border-[#00B4D8] bg-[#CAF0F8]/40'
                              : 'border-transparent bg-white hover:border-[#DDEEF2]'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-[#253B45]">{c.name}</div>
                            <div className="text-[11px] text-[#637984] font-mono">{c.phone} · {c.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              c.kycStatus === 'verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              KYC: {c.kycStatus}
                            </span>
                            {selectedCustomer?.id === c.id && (
                              <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {selectedCustomer && (
                    <div className="p-3.5 border border-[#DDEEF2] rounded-xl bg-white flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#637984] block font-semibold">Selected Consignor:</span>
                        <span className="font-bold text-sm text-[#253B45]">{selectedCustomer.name}</span>
                        <span className="block text-xs text-[#637984] font-mono">{selectedCustomer.phone} · ID: {selectedCustomer.id}</span>
                      </div>
                      <div className="text-right">
                        {selectedCustomer.kycStatus === 'verified' ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Statutory KYC Verified</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenKycForCustomer(selectedCustomer)}
                            className="text-xs font-bold text-[#00B4D8] hover:underline flex items-center gap-1"
                          >
                            <span>Verify KYC Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 p-4 border border-[#DDEEF2] rounded-xl bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#253B45] mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Adebayo Adeleke"
                        value={newCustName}
                        onChange={(e) => {
                          setNewCustName(e.target.value);
                          setSenderName(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD] focus:border-[#00B4D8] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#253B45] mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="e.g. +234 803 123 4567"
                        value={newCustPhone}
                        onChange={(e) => {
                          setNewCustPhone(e.target.value);
                          setSenderPhone(e.target.value);
                        }}
                        className="w-full px-3 py-2 font-mono border border-[#DDEEF2] rounded-lg bg-[#F7FCFD] focus:border-[#00B4D8] focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#253B45] mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="customer@email.com"
                        value={newCustEmail}
                        onChange={(e) => {
                          setNewCustEmail(e.target.value);
                          setSenderEmail(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD] focus:border-[#00B4D8] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#253B45] mb-1">Country of Residence</label>
                      <input
                        type="text"
                        readOnly
                        value={newCustCountry}
                        className="w-full px-3 py-2 bg-slate-100 border border-[#DDEEF2] rounded-lg text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SENDER & RECEIVER */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#253B45]">Step 2: Sender &amp; Receiver Addresses</h4>
                <p className="text-xs text-[#637984]">
                  Confirm sender contact details and enter delivery destination.
                </p>
              </div>

              {/* Sender Details */}
              <div className="p-4 border border-[#DDEEF2] rounded-xl bg-[#F7FCFD] space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00B4D8] block">
                  Sender (Consignor)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Sender Name</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Sender Phone</label>
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full px-3 py-2 font-mono border border-[#DDEEF2] rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Receiver Details */}
              <div className="p-4 border border-[#DDEEF2] rounded-xl bg-white space-y-3 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00B4D8] block">
                  Recipient (Consignee)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Recipient Name *</label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Recipient Phone *</label>
                    <input
                      type="tel"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      className="w-full px-3 py-2 font-mono border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Destination Country</label>
                    <select
                      value={destCountry}
                      onChange={(e) => setDestCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD] font-semibold"
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Ghana">Ghana</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#253B45] mb-1">City</label>
                    <input
                      type="text"
                      value={destCity}
                      onChange={(e) => setDestCity(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={destPostalCode}
                      onChange={(e) => setDestPostalCode(e.target.value)}
                      className="w-full px-3 py-2 font-mono border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Delivery Street Address *</label>
                  <input
                    type="text"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PACKAGE DETAILS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#253B45]">Step 3: Package Details &amp; Declaration</h4>
                  <p className="text-xs text-[#637984]">
                    Add one or multiple packages. Itemize description, weight, and declared value.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPackage}
                  className="px-3 py-1.5 bg-[#CAF0F8] text-[#008EA8] hover:bg-[#90E0EF] rounded-lg font-bold flex items-center gap-1 transition-colors text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Package</span>
                </button>
              </div>

              {packages.map((pkg, idx) => (
                <div key={pkg.id} className="p-4 border border-[#DDEEF2] rounded-xl bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DDEEF2]">
                    <span className="font-bold text-[#253B45]">Package #{idx + 1}</span>
                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Package Contents Description</label>
                      <input
                        type="text"
                        value={pkg.description}
                        onChange={(e) => handleUpdatePackage(idx, { description: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Packaging Type</label>
                      <select
                        value={pkg.packageType}
                        onChange={(e) => handleUpdatePackage(idx, { packageType: e.target.value as any })}
                        className="w-full px-3 py-1.5 border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                      >
                        <option value="carton">Reinforced Carton</option>
                        <option value="box">Standard Box</option>
                        <option value="envelope">Document Envelope</option>
                        <option value="crate">Wooden Crate</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={pkg.actualWeightKg}
                        onChange={(e) => handleUpdatePackage(idx, { actualWeightKg: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 font-mono border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#253B45] mb-1">Declared Value (₦)</label>
                      <input
                        type="number"
                        step="1000"
                        value={pkg.declaredValueNgn}
                        onChange={(e) => handleUpdatePackage(idx, { declaredValueNgn: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 font-mono border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#253B45]">
                        <input
                          type="checkbox"
                          checked={pkg.isFragile}
                          onChange={(e) => handleUpdatePackage(idx, { isFragile: e.target.checked })}
                          className="rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                        />
                        <span>Fragile Handling</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-3 bg-[#EDF7F9] rounded-xl flex justify-between items-center font-bold text-[#253B45]">
                <span>Total Combined Weight: {totalWeightKg} kg</span>
                <span>Total Declared Value: {formatNaira(totalDeclaredValueNgn)}</span>
              </div>
            </div>
          )}

          {/* STEP 4: SHIPPING SPEED SELECTION (MANDATORY) */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#253B45]">Step 4: Select Shipping Speed</h4>
                <p className="text-xs text-[#637984]">
                  Choose your preferred transit speed for {destCountry}. The selected speed updates your final quotation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* STANDARD SHIPPING CARD */}
                <div
                  onClick={() => setServiceSpeed('standard')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                    serviceSpeed === 'standard'
                      ? 'border-[#00B4D8] bg-[#CAF0F8]/30 shadow-md ring-2 ring-[#00B4D8]/20'
                      : 'border-[#DDEEF2] hover:border-[#90E0EF] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#00B4D8]" />
                      <div>
                        <div className="font-bold text-sm text-[#253B45]">Standard Shipping</div>
                        <div className="text-[11px] text-[#637984]">Regular international linehaul</div>
                      </div>
                    </div>
                    {serviceSpeed === 'standard' && (
                      <span className="w-5 h-5 rounded-full bg-[#00B4D8] text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DDEEF2] space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#637984]">Delivery Window:</span>
                      <span className="font-bold text-[#253B45]">5 – 8 business days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#637984]">Priority Surcharge:</span>
                      <span className="font-bold text-emerald-600">₦0 (Included)</span>
                    </div>
                    <div className="text-[11px] text-[#637984] pt-1">
                      Ideal for planned shipments not requiring expedited customs pre-clearance.
                    </div>
                  </div>
                </div>

                {/* PRIORITY SHIPPING CARD */}
                <div
                  onClick={() => setServiceSpeed('priority')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                    serviceSpeed === 'priority'
                      ? 'border-amber-400 bg-amber-50/40 shadow-md ring-2 ring-amber-300'
                      : 'border-[#DDEEF2] hover:border-amber-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <div>
                        <div className="font-bold text-sm text-[#253B45]">Priority Shipping</div>
                        <div className="text-[11px] text-[#637984]">Fastest express international flight lane</div>
                      </div>
                    </div>
                    {serviceSpeed === 'priority' && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DDEEF2] space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#637984]">Delivery Window:</span>
                      <span className="font-bold text-amber-800">2 – 4 business days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#637984]">Priority Express Fee:</span>
                      <span className="font-bold text-amber-700">+{formatNaira(priorityDifference || 8500)}</span>
                    </div>
                    <div className="text-[11px] text-[#637984] pt-1">
                      Includes priority MMIA airport tarmac handling and expedited destination clearance.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CARGO PROTECTION */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#253B45]">Step 5: Cargo Protection Selection</h4>
                <p className="text-xs text-[#637984]">
                  Optional coverage for eligible loss or damage during international transit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* OPTION A: INCLUDED BASIC */}
                <div
                  onClick={() => setProtectionPlan('basic')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    protectionPlan === 'basic'
                      ? 'border-[#00B4D8] bg-[#CAF0F8]/30 shadow-md ring-2 ring-[#00B4D8]/20'
                      : 'border-[#DDEEF2] hover:border-[#90E0EF] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#253B45]">Included Basic Protection</span>
                    <span className="font-bold text-xs text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-full">
                      ₦0 (Included)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#637984] mt-2">
                    Standard contractual carrier liability under Warsaw/Montreal international convention.
                  </p>
                  <div className="mt-3 space-y-1 text-[11px] text-[#637984] border-t border-[#DDEEF2] pt-2">
                    <div>Coverage: <span className="font-bold text-[#253B45]">Standard Liability</span></div>
                    <div>Protection Premium: <span className="font-bold text-[#00B4D8]">₦0</span></div>
                  </div>
                </div>

                {/* OPTION B: PREMIUM SHIPMENT COVERAGE */}
                <div
                  onClick={() => setProtectionPlan('premium')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    protectionPlan === 'premium'
                      ? 'border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300'
                      : 'border-[#DDEEF2] hover:border-amber-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#253B45]">Premium Shipment Coverage</span>
                    <span className="font-bold text-xs text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      {formatNaira(protectionResult.calculatedPremiumNgn)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#637984] mt-2">
                    Comprehensive full declared value coverage underwritten via Leadway Assurance Alliance.
                  </p>
                  <div className="mt-3 space-y-1 text-[11px] text-[#637984] border-t border-amber-200 pt-2">
                    <div>Declared Value: <span className="font-bold text-[#253B45]">{formatNaira(totalDeclaredValueNgn)}</span></div>
                    <div>Demo Rate: <span className="font-bold text-[#253B45]">1.5%</span></div>
                    <div>Deductible: <span className="text-[#253B45]">5% or ₦10,000</span></div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer text-[11px] text-[#637984]">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span>
                    Consignor has accepted the Swiftvero Protection Terms &amp; Conditions (v2.1).
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: INSPECTION AND WEIGHING */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#253B45]">Step 6: Physical Inspection &amp; Scale Verification</h4>
                <p className="text-xs text-[#637984]">
                  Desk officer records digital scale weight and verifies packing integrity before security sealing.
                </p>
              </div>

              {/* Authentic Photo Preview */}
              <div className="p-4 border border-[#DDEEF2] rounded-2xl bg-[#F7FCFD] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#253B45] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#00B4D8]" />
                    <span>Inspection Record Photo &amp; Content Seal</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    NCAA Approved
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-[#DDEEF2]">
                  <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-300 relative group">
                    <img
                      src="/assets/aistudio/IMG-20261103-WA0011_710ee58a.jpg"
                      alt="Verified Cargo Packaging with Provisions"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] font-mono text-center py-0.5">
                      REF: NG43675912
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#637984]">
                    <div className="font-bold text-[#253B45]">
                      Consignment Package Contents Verified
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Provisions (Indomie, Peak Milk, Titus Mackerel), native clothing, electronics &amp; accessories inspected.
                      No prohibited lithium batteries in checked cargo or restricted biological seeds detected.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px] text-[#00B4D8]">
                      <span>Seal: {securitySealNumber}</span>
                      <span>·</span>
                      <span>Inspector: {currentStaffUser?.name || 'Chioma Eze'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#253B45]">
                    <input
                      type="checkbox"
                      checked={inspectionPassed}
                      onChange={(e) => setInspectionPassed(e.target.checked)}
                      className="rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                    />
                    <span>Physical inspection passed &amp; tamper-evident security seal affixed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#253B45]">
                    <input
                      type="checkbox"
                      checked={prohibitedGoodsChecked}
                      onChange={(e) => setProhibitedGoodsChecked(e.target.checked)}
                      className="rounded text-[#00B4D8] focus:ring-[#00B4D8]"
                    />
                    <span>Consignor has confirmed goods contain zero prohibited dangerous chemicals</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: QUOTATION AND CHECKOUT (SIMPLIFIED TO CUSTOMER-FACING CHARGES ONLY) */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#253B45]">Step 7: Transparent Cost Calculation</h4>
                <p className="text-xs text-[#637984]">
                  Clear itemized charges. No internal fuel surcharges or carrier logistics allocations are shown.
                </p>
              </div>

              {/* Simplified Customer-Facing Checkout Box */}
              <div className="p-5 border border-[#DDEEF2] rounded-2xl bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#DDEEF2]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#637984]">
                    Your Shipping Cost Summary
                  </span>
                  <span className="text-xs font-bold text-[#00B4D8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full">
                    {serviceSpeed === 'priority' ? 'Priority Express' : 'Standard Delivery'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#EDF7F9]">
                    <span className="text-[#637984]">Total Chargeable Weight:</span>
                    <span className="font-mono font-bold text-[#253B45]">{quote.chargeableWeightKg} kg</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#EDF7F9]">
                    <span className="text-[#637984]">Selected Shipping Service:</span>
                    <span className="font-semibold text-[#253B45] capitalize">
                      {serviceSpeed === 'priority' ? 'Priority Air Express (2 – 4 days)' : 'Standard Air Courier (5 – 8 days)'}
                    </span>
                  </div>

                  {serviceSpeed === 'priority' && (
                    <div className="flex justify-between py-1 border-b border-[#EDF7F9]">
                      <span className="text-amber-800 font-medium">Priority Speed Service Fee:</span>
                      <span className="font-mono font-bold text-amber-700">+{formatNaira(priorityDifference || 8500)}</span>
                    </div>
                  )}

                  {protectionPlan === 'premium' && (
                    <div className="flex justify-between py-1 border-b border-[#EDF7F9]">
                      <span className="text-amber-800 font-medium">Cargo Protection Fee (1.5% declared value):</span>
                      <span className="font-mono font-bold text-amber-700">
                        {formatNaira(protectionResult.calculatedPremiumNgn)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1 border-b border-[#EDF7F9]">
                    <span className="text-[#637984]">Doorstep Intake &amp; Handling:</span>
                    <span className="font-bold text-emerald-600">FREE (₦0)</span>
                  </div>

                  <div className="flex justify-between pt-3 text-base font-black text-[#253B45]">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono text-2xl text-[#00B4D8]">{formatNaira(quote.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: PAYMENT AND RECEIPT */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#253B45]">Step 8: Payment Collection &amp; Waybill Printing</h4>
                <p className="text-xs text-[#637984]">
                  Record counter payment method and generate the official thermal air waybill.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'pos_terminal', label: 'POS Terminal (Card)', icon: CreditCard },
                  { id: 'cash', label: 'Cash at Counter', icon: DollarSign },
                  { id: 'bank_transfer', label: 'Bank Transfer (Instant)', icon: Building2 },
                  { id: 'online_link', label: 'Online Payment Link', icon: FileText },
                ].map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                        paymentMethod === pm.id
                          ? 'border-[#00B4D8] bg-[#CAF0F8]/40 font-bold text-[#253B45]'
                          : 'border-[#DDEEF2] hover:bg-[#F7FCFD] text-[#637984]'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-[#00B4D8]" />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'pos_terminal' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#253B45] mb-1">POS Terminal Approval Code</label>
                  <input
                    type="text"
                    value={posReference}
                    onChange={(e) => setPosReference(e.target.value)}
                    placeholder="e.g. STANBIC-POS-8912"
                    className="w-full px-3 py-2 font-mono border border-[#DDEEF2] rounded-lg bg-[#F7FCFD]"
                  />
                </div>
              )}

              <div className="p-4 border border-[#DDEEF2] rounded-xl bg-[#F7FCFD] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#253B45] block">Total Collected at Counter:</span>
                  <span className="text-xl font-black text-[#00B4D8] font-mono">{formatNaira(quote.totalAmount)}</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Payment Verified</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 border-t border-[#DDEEF2] bg-[#F7FCFD] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (step > 1) setStep(step - 1);
            }}
            disabled={step === 1}
            className="px-4 py-2 border border-[#DDEEF2] rounded-xl text-xs font-bold text-[#253B45] hover:bg-white disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {step < 8 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishAndIssue}
              className="px-6 py-2 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 hover:scale-102"
            >
              <Printer className="w-4 h-4" />
              <span>Issue Consignment &amp; Print Waybill</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
