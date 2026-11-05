import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  SUPPORTED_DESTINATIONS,
  calculateVolumetricWeight,
  calculateChargeableWeight,
  checkProhibitedGoods,
  generateQuoteBreakdown,
  recalculateVerifiedQuote,
  calculateEstimatedDeliveryDate,
  formatNaira,
} from '../../utils/shipping-calculator';
import {
  calculateCheckoutPricing,
  validateDiscountCode,
  DEMO_DISCOUNT_CODES,
} from '../../utils/discount-calculator';
import {
  QuoteBreakdown,
  ServiceTier,
  ShipmentRecord,
  ShippingDirection,
  ParcelItem,
  ProtectionCertificateRecord,
} from '../../types';
import { PolicyKey } from '../common/LegalModal';
import { ShipmentProtectionStep } from './ShipmentProtectionStep';
import { ProtectionCertificateModal } from './ProtectionCertificateModal';
import {
  calculateProtectionPremium,
  generateProtectionReference,
} from '../../utils/protection-calculator';
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building2,
  Check,
  RotateCcw,
  Package,
  Calendar,
  Clock,
  ShieldCheck,
  Globe2,
  Tag,
  Coins,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Sliders,
  Plus,
  Trash2,
  FileCheck,
} from 'lucide-react';

interface BookingWizardProps {
  onComplete: (trackingNumber: string) => void;
  onOpenPolicy: (key: PolicyKey) => void;
  onOpenKyc: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ onComplete, onOpenPolicy, onOpenKyc }) => {
  const {
    currentCustomer,
    addShipment,
    setSelectedShipmentForTracking,
    applyShippingCredits,
    reverseShippingCredits,
    protectionConfig,
    addProtectionCertificate,
  } = useDemo();

  const [step, setStep] = useState<number>(1);

  // Direction: Export from Nigeria or Import into Nigeria
  const [direction, setDirection] = useState<ShippingDirection>('export');

  // Step 1: Route
  const [originCity, setOriginCity] = useState('Lagos (Ikeja Hub)');
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [destinationCity, setDestinationCity] = useState('London');
  const [postalCode, setPostalCode] = useState('E14 9GE');
  const [senderName, setSenderName] = useState(currentCustomer.name || 'Amara Okafor');
  const [senderPhone, setSenderPhone] = useState(currentCustomer.phone || '+234 803 555 0192');
  const [senderAddress, setSenderAddress] = useState('Plot 14 Admiralty Way, Lekki Phase 1, Lagos');
  const [recipientName, setRecipientName] = useState('Eleanor Sterling');
  const [recipientPhone, setRecipientPhone] = useState('+44 20 7946 0881');
  const [recipientAddress, setRecipientAddress] = useState('18 St. Mary Axe, London, EC3A 8EP');

  // Step 2: Parcel & Goods (Multi-item support & simplified weight)
  const [packageCategory, setPackageCategory] = useState<'goods' | 'documents' | 'apparel'>('goods');
  const [declaredItems, setDeclaredItems] = useState<ParcelItem[]>([
    {
      id: 'item_1',
      description: 'Traditional hand-woven textiles (Aso-Oke sets)',
      quantity: 2,
      declaredValue: 50000,
      category: 'apparel',
    },
    {
      id: 'item_2',
      description: 'Handcrafted bronze & carved wood decor pieces',
      quantity: 1,
      declaredValue: 50000,
      category: 'goods',
    },
  ]);
  const [contentsDescription, setContentsDescription] = useState('Handcrafted Nigerian cultural crafts & woven textiles');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<number>(4.0);
  const [weightInputStr, setWeightInputStr] = useState<string>('4.0');
  const [showOptionalDimensions, setShowOptionalDimensions] = useState(false);
  const [hasDimensionsProvided, setHasDimensionsProvided] = useState(false);
  const [dimL, setDimL] = useState<number>(30);
  const [dimW, setDimW] = useState<number>(25);
  const [dimH, setDimH] = useState<number>(20);
  const [goodsDeclarationAcknowledged, setGoodsDeclarationAcknowledged] = useState(false);

  // Computed total items & total declared value from multiple items
  const totalItemQuantity = declaredItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const totalDeclaredValueNgn = declaredItems.reduce(
    (acc, it) => acc + (it.declaredValue || 0) * (it.quantity || 1),
    0
  );

  // Step 3: Pickup or Drop-off (both 100% free)
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'dropoff'>('pickup');
  const [pickupDate, setPickupDate] = useState('2026-10-26');
  const [pickupSlot, setPickupSlot] = useState('10:00 AM - 1:00 PM');
  const [dropoffHub, setDropoffHub] = useState('Ikeja International Hub (Cargo Terminal)');

  // Step 4: Shipment Protection (Option A Basic vs Option B Premium)
  const [protectionPlan, setProtectionPlan] = useState<'basic' | 'premium'>('basic');
  const [protectionTermsAccepted, setProtectionTermsAccepted] = useState<boolean>(true);
  const [activeCertificate, setActiveCertificate] = useState<ProtectionCertificateRecord | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);

  // Protection calculation based on declared items & total value
  const protectionCalc = calculateProtectionPremium({
    plan: protectionPlan,
    declaredValueNgn: totalDeclaredValueNgn,
    items: declaredItems,
    config: protectionConfig,
    destinationCountry,
  });

  // Step 5: Compliance Review
  const [complianceConfirmed, setComplianceConfirmed] = useState(false);

  // Step 6: Service & Quote
  const [selectedTier, setSelectedTier] = useState<ServiceTier>('standard');
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);
  const [discrepancySimulated, setDiscrepancySimulated] = useState(false);
  const [customerApprovedDiscrepancy, setCustomerApprovedDiscrepancy] = useState(false);

  // Step 7: Payment & Unified Checkout Pricing
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'ussd'>('card');
  const [paymentState, setPaymentState] = useState<'pending' | 'success' | 'failed'>('pending');
  const [paymentRef, setPaymentRef] = useState('');
  const [reversalNotice, setReversalNotice] = useState<string | null>(null);

  // Promo Code & Shipping Credits State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [creditsToApplyNgn, setCreditsToApplyNgn] = useState<number>(0);

  // Step 8: Completed Shipment reference
  const [createdTrackingNumber, setCreatedTrackingNumber] = useState('');
  const [confirmedDiscountNgn, setConfirmedDiscountNgn] = useState<number>(0);
  const [confirmedCreditsNgn, setConfirmedCreditsNgn] = useState<number>(0);
  const [confirmedTotalPaidNgn, setConfirmedTotalPaidNgn] = useState<number>(0);

  // Prohibited scanner
  const prohibitedScan = checkProhibitedGoods(contentsDescription);

  // Volumetric & chargeable calculation
  const volWeight = hasDimensionsProvided ? calculateVolumetricWeight(dimL, dimW, dimH) : estimatedWeightKg;
  const chargeableWeight = calculateChargeableWeight(
    estimatedWeightKg,
    hasDimensionsProvided ? dimL : undefined,
    hasDimensionsProvided ? dimW : undefined,
    hasDimensionsProvided ? dimH : undefined
  );

  // Route support
  const routeInfo = SUPPORTED_DESTINATIONS[destinationCountry] || {
    prioritySupported: false,
    transitStandard: '6 - 10 business days',
    transitPriority: 'Unavailable',
  };

  // Generate initial quote with protection fee inclusion
  const generateInitialQuote = () => {
    const q = generateQuoteBreakdown({
      destinationCountry,
      actualWeightKg: estimatedWeightKg,
      lengthCm: hasDimensionsProvided ? dimL : undefined,
      widthCm: hasDimensionsProvided ? dimW : undefined,
      heightCm: hasDimensionsProvided ? dimH : undefined,
      tier: selectedTier,
      pickupRequired: true,
      baseDate: pickupDate,
      direction,
      protectionCharge: protectionCalc.premiumNgn,
      protectionPlan: protectionPlan,
      protectionCoverageNgn: protectionCalc.coverageNgn,
      protectionRatePercentage: protectionCalc.ratePercentage,
      protectionDeductibleText: protectionCalc.deductibleText,
    });
    setQuote(q);
    setDiscrepancySimulated(false);
    setCustomerApprovedDiscrepancy(false);
  };

  const handleSimulateDiscrepancy = () => {
    if (!quote) return;
    const revised = recalculateVerifiedQuote(quote, destinationCountry, estimatedWeightKg + 2.0, dimL + 5, dimW, dimH);
    setQuote(revised);
    setDiscrepancySimulated(true);
    setCustomerApprovedDiscrepancy(false);
  };

  // Unified checkout calculation
  const currentQuoteAmount = quote?.totalAmount || 0;
  const pricing = calculateCheckoutPricing({
    originalQuotationNgn: currentQuoteAmount,
    discountCode: appliedPromoCode || undefined,
    creditsToApplyNgn: creditsToApplyNgn,
    availableCreditBalanceNgn: currentCustomer.cashbackBalance,
  });

  // Demo Scenario Handler (Directly implements user prompt checkout test scenario)
  const handleLoadDemoCheckoutScenario = () => {
    // ₦30,000 shipment - 10% (₦3,000) discount - ₦5,000 shipping credits = ₦22,000 final payable
    if (quote) {
      setQuote({
        ...quote,
        freightCharge: 24000,
        jetFuelSurcharge: 2880,
        handlingCharge: 1028,
        vatAmount: 2092,
        totalAmount: 30000,
      });
    }
    setAppliedPromoCode('SWIFT10');
    setPromoCodeInput('SWIFT10');
    setPromoMessage({ text: 'Promo code SWIFT10 applied: 10% discount (-₦3,000)', isError: false });
    setCreditsToApplyNgn(5000);
    setReversalNotice(null);
  };

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoCodeInput).trim().toUpperCase();
    if (!code) {
      setPromoMessage({ text: 'Please enter a promotional discount code.', isError: true });
      return;
    }
    const result = validateDiscountCode(code, quote?.totalAmount || 0);
    if (!result.valid) {
      setPromoMessage({ text: result.error || 'Invalid code.', isError: true });
      setAppliedPromoCode(null);
    } else {
      setAppliedPromoCode(code);
      setPromoCodeInput(code);
      setPromoMessage({
        text: `Promo "${code}" applied: -${formatNaira(result.discountAmountNgn)} (${result.discount?.description})`,
        isError: false,
      });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromoCode(null);
    setPromoCodeInput('');
    setPromoMessage(null);
  };

  const handlePaymentSubmit = (simulateOutcome: 'success' | 'failed') => {
    if (simulateOutcome === 'success') {
      const ref = 'PAY-SWV-' + Math.floor(100000 + Math.random() * 900000);
      setPaymentRef(ref);
      setPaymentState('success');

      const trackingNum = 'SWV-2026-NG' + Math.floor(1000 + Math.random() * 9000);
      setCreatedTrackingNumber(trackingNum);

      // Generate verified protection certificate record
      const certRef = generateProtectionReference();
      const newCert: ProtectionCertificateRecord = {
        id: 'cert_' + Date.now(),
        certificateNumber: certRef,
        shipmentTrackingNumber: trackingNum,
        customerName: currentCustomer.name,
        customerEmail: currentCustomer.email,
        customerPhone: currentCustomer.phone,
        declaredValueNgn: totalDeclaredValueNgn,
        protectionPlan: protectionPlan,
        coverageAmountNgn: protectionCalc.coverageNgn,
        premiumPaidNgn: protectionCalc.premiumNgn,
        ratePercentage: protectionCalc.ratePercentage,
        deductibleText: protectionCalc.deductibleText,
        termsVersion: protectionConfig.termsVersion,
        providerName: protectionConfig.providerName,
        bookingDate: new Date().toISOString().split('T')[0],
        status: 'active',
        itemsCovered: declaredItems,
        excludedItems: protectionCalc.excludedItems,
      };
      addProtectionCertificate(newCert);
      setActiveCertificate(newCert);

      // Deduct applied shipping credits from customer promotional balance if any
      if (pricing.creditsAppliedNgn > 0) {
        applyShippingCredits(pricing.creditsAppliedNgn, trackingNum);
      }

      setConfirmedDiscountNgn(pricing.discountAmountNgn);
      setConfirmedCreditsNgn(pricing.creditsAppliedNgn);
      setConfirmedTotalPaidNgn(pricing.finalPayableNgn);

      const deliveryEst = calculateEstimatedDeliveryDate(pickupDate, selectedTier);

      const newShipment: ShipmentRecord = {
        id: 'ship_' + Date.now(),
        trackingNumber: trackingNum,
        direction,
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        customerEmail: currentCustomer.email,
        customerPhone: currentCustomer.phone,
        senderName,
        senderPhone,
        senderAddress,
        originCountry: direction === 'export' ? 'Nigeria' : destinationCountry,
        originCity: direction === 'export' ? originCity : destinationCity,
        recipientName,
        recipientPhone,
        recipientAddress,
        destinationCountry: direction === 'export' ? destinationCountry : 'Nigeria',
        destinationCity: direction === 'export' ? destinationCity : originCity,
        category: packageCategory,
        contentsDescription,
        items: declaredItems,
        packageCount: totalItemQuantity,
        declaredWeightKg: estimatedWeightKg,
        declaredDimensions: hasDimensionsProvided ? { length: dimL, width: dimW, height: dimH } : undefined,
        verifiedWeightKg: discrepancySimulated ? estimatedWeightKg + 2.0 : estimatedWeightKg,
        verifiedDimensions: { length: dimL, width: dimW, height: dimH },
        pickupScheduledDate: fulfillmentType === 'pickup' ? pickupDate : undefined,
        pickupScheduledSlot: fulfillmentType === 'pickup' ? pickupSlot : undefined,
        pickupAddress: fulfillmentType === 'pickup' ? senderAddress : dropoffHub,
        pickupType: fulfillmentType === 'pickup' ? 'doorstep' : 'hub',
        pickupStatus: 'requested',
        pickupStatusLabel: 'Pickup Requested',
        assignedAgentName: 'Assigned on Dispatch',
        status: 'booked',
        quote: quote!,
        selectedTier,
        estimatedDeliveryDisplay: deliveryEst.displayDate,
        paymentStatus: 'paid',
        paymentReference: ref,
        paymentMethod:
          paymentMethod === 'card'
            ? 'Debit Card'
            : paymentMethod === 'bank_transfer'
            ? 'Direct Bank Transfer'
            : 'USSD Code',
        discountCode: pricing.discountApplied?.code,
        discountAmountNgn: pricing.discountAmountNgn,
        cashbackRedeemedNgn: pricing.creditsAppliedNgn,
        finalAmountPaidNgn: pricing.finalPayableNgn,
        protectionPlan: protectionPlan,
        protectionFeeNgn: protectionCalc.premiumNgn,
        protectionCoverageNgn: protectionCalc.coverageNgn,
        protectionReference: certRef,
        protectionTermsAccepted: protectionTermsAccepted,
        protectionProvider: protectionConfig.providerName,
        protectionStatus: 'active',
        trackingEvents: [
          {
            id: 'evt_init',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            stage: 'Shipment Booked & Confirmed',
            location: originCity,
            description:
              fulfillmentType === 'pickup'
                ? `Free doorstep pickup scheduled for ${pickupDate} (${pickupSlot}). Certified scale verification upon arrival.`
                : `Shipment booked for free drop-off at ${dropoffHub}.`,
          },
        ],
        lastUpdateTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        customerAcknowledgedTerms: true,
        customerAcknowledgedDeclaration: true,
        kycRequiredAtBooking: true,
        cashbackEarned: Math.round(quote!.freightCharge * 0.03),
        cashbackStatus: 'pending',
        hasReview: false,
        createdAt: new Date().toISOString(),
      };

      addShipment(newShipment);
      setSelectedShipmentForTracking(trackingNum);
      setStep(8);
    } else {
      // Payment failed / declined
      setPaymentState('failed');
      const tempRef = 'DECLINE-' + Math.floor(1000 + Math.random() * 9000);
      if (pricing.creditsAppliedNgn > 0) {
        reverseShippingCredits(pricing.creditsAppliedNgn, tempRef);
        setReversalNotice(
          `Payment declined. ₦${pricing.creditsAppliedNgn.toLocaleString()} in shipping credits were immediately restored back to your available balance.`
        );
      } else {
        setReversalNotice(null);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#DCEFF3] shadow-xs overflow-hidden">
      {/* Wizard Header */}
      <div className="px-6 py-4 border-b border-[#DCEFF3] bg-[#CAF0F8] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#354B55]">International Shipment Booking</h2>
          <p className="text-xs text-[#6A808C]">
            Step {step} of 8 · {direction === 'export' ? 'Export from Nigeria' : 'Import into Nigeria'}
          </p>
        </div>

        {/* Step indicator (8 Steps) */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto py-1">
          {[
            { num: 1, label: 'Route' },
            { num: 2, label: 'Goods' },
            { num: 3, label: 'Pickup' },
            { num: 4, label: 'Protection' },
            { num: 5, label: 'Review' },
            { num: 6, label: 'Quote' },
            { num: 7, label: 'Payment' },
            { num: 8, label: 'Confirmed' },
          ].map((s) => (
            <div
              key={s.num}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                step === s.num
                  ? 'bg-[#00B4D8] text-white font-semibold'
                  : step > s.num
                  ? 'bg-white text-[#00B4D8] border border-[#DCEFF3]'
                  : 'text-[#6A808C]'
              }`}
            >
              {s.num}. {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* KYC Warning notice if customer hasn't completed KYC */}
      {currentCustomer.kycStatus === 'not_started' && (
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-[#93631B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Your account has not completed identity verification. You can complete the quote now; verification is required before flight tender.
            </span>
          </div>
          <button
            onClick={onOpenKyc}
            className="font-semibold underline hover:text-[#354B55] whitespace-nowrap ml-2"
          >
            Start Verification
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="p-6">
        {/* Step 1: Shipping Route */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#354B55]">1. Shipping Route & Addresses</h3>
                <p className="text-xs text-[#6A808C]">Select shipping direction and address details.</p>
              </div>

              {/* Direction selector */}
              <div className="flex rounded-md border border-[#DCEFF3] p-0.5 bg-[#CAF0F8] shrink-0">
                <button
                  type="button"
                  onClick={() => setDirection('export')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    direction === 'export' ? 'bg-white text-[#354B55] shadow-xs' : 'text-[#6A808C]'
                  }`}
                >
                  Export from Nigeria
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('import')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    direction === 'import' ? 'bg-white text-[#354B55] shadow-xs' : 'text-[#6A808C]'
                  }`}
                >
                  Import into Nigeria
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3.5 p-5 bg-[#FFFFFF] rounded-md border border-[#DCEFF3]">
                <h4 className="text-xs font-bold text-[#00B4D8] uppercase tracking-wider">
                  {direction === 'export' ? 'Origin (Nigeria)' : 'Destination (Nigeria)'}
                </h4>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Hub / City</label>
                  <select
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden bg-white"
                  >
                    <option value="Lagos (Ikeja Cargo Terminal)">Lagos (Ikeja Cargo Terminal)</option>
                    <option value="Lagos (Lekki Phase 1 Hub)">Lagos (Lekki Phase 1 Hub)</option>
                    <option value="Abuja (Central Cargo Hub)">Abuja (Central Cargo Hub)</option>
                    <option value="Port Harcourt Hub">Port Harcourt Hub</option>
                    <option value="Kano Regional Consolidation">Kano Regional Consolidation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    {direction === 'export' ? 'Sender Name' : 'Receiver Name'}
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Physical Address in Nigeria</label>
                  <input
                    type="text"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-3.5 p-5 bg-[#FFFFFF] rounded-md border border-[#DCEFF3]">
                <h4 className="text-xs font-bold text-[#00B4D8] uppercase tracking-wider">
                  {direction === 'export' ? 'International Destination' : 'International Origin'}
                </h4>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Country</label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => {
                      setDestinationCountry(e.target.value);
                      if (e.target.value === 'Greenland (Remote)') {
                        setSelectedTier('standard');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden bg-white"
                  >
                    {Object.keys(SUPPORTED_DESTINATIONS).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#354B55] mb-1">City</label>
                    <input
                      type="text"
                      value={destinationCity}
                      onChange={(e) => setDestinationCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#354B55] mb-1">Postal / ZIP Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">
                    {direction === 'export' ? 'Recipient Full Name' : 'Supplier / Shipper Name'}
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#354B55] mb-1">Address Line</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Parcel & Goods Details */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-[#354B55]">2. Parcel Contents & Estimated Measurements</h3>
              <p className="text-xs text-[#6A808C]">Describe items and dimensions for customs manifest.</p>
            </div>

            <div className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#354B55] mb-1.5">Package Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'goods', label: 'Goods / Merchandise', icon: Package },
                    { id: 'documents', label: 'Documents & Contracts', icon: ShieldCheck },
                    { id: 'apparel', label: 'Apparel & Textiles', icon: Globe2 },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = packageCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setPackageCategory(cat.id as any)}
                        className={`p-2.5 rounded-lg border text-left text-xs font-medium flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-[#00B4D8] bg-[#CAF0F8] text-[#008EA8] font-bold shadow-2xs'
                            : 'border-[#DCEFF3] text-[#354B55] hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-[#00B4D8]" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Item Declaration & Itemized Declared Values */}
              <div className="p-4 bg-[#F5FAF6] rounded-lg border border-[#DCE8DF] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#174B35] flex items-center gap-1.5">
                      <span>Itemized Goods Declaration &amp; Declared Values</span>
                      <span className="text-[#2F7D53]">*</span>
                    </label>
                    <p className="text-[11px] text-[#66736B]">
                      Declare each item, quantity, and market replacement value for customs clearance &amp; shipment protection.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = 'item_' + Date.now();
                      setDeclaredItems([
                        ...declaredItems,
                        {
                          id: newId,
                          description: 'Additional declared item',
                          quantity: 1,
                          declaredValue: 25000,
                          category: 'goods',
                        },
                      ]);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-[#2F7D53] bg-white border border-[#2F7D53]/40 rounded hover:bg-[#EAF6EE] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-2.5">
                  {declaredItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-md border border-[#DCE8DF] text-xs space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#174B35]">Item #{idx + 1}</span>
                        {declaredItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = declaredItems.filter((_, i) => i !== idx);
                              setDeclaredItems(updated);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-medium text-[#66736B] mb-0.5">Item Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...declaredItems];
                              updated[idx].description = e.target.value;
                              setDeclaredItems(updated);
                              setContentsDescription(updated.map((it) => it.description).join(', '));
                            }}
                            placeholder="e.g. Leather shoes, fabric rolls, books"
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8DF] rounded focus:border-[#2F7D53] focus:outline-hidden"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-medium text-[#66736B] mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...declaredItems];
                              updated[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                              setDeclaredItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8DF] rounded focus:border-[#2F7D53] focus:outline-hidden text-center"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-medium text-[#66736B] mb-0.5">
                            Unit Declared Value (NGN)
                          </label>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={item.declaredValue}
                            onChange={(e) => {
                              const updated = [...declaredItems];
                              updated[idx].declaredValue = Math.max(0, parseInt(e.target.value) || 0);
                              setDeclaredItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#DCE8DF] rounded focus:border-[#2F7D53] focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-[#66736B]">
                        <span>Subtotal for Item #{idx + 1}:</span>
                        <span className="font-mono font-semibold text-[#174B35]">
                          {formatNaira(item.declaredValue * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Declared Value Summary Banner */}
                <div className="p-3 bg-white rounded-md border-2 border-[#2F7D53]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[#66736B]">Consolidated Manifest Total: </span>
                    <strong className="text-[#174B35]">
                      {totalItemQuantity} item{totalItemQuantity !== 1 ? 's' : ''} declared
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#66736B] text-[11px]">Total Declared Value: </span>
                    <span className="text-sm font-bold font-mono text-[#2F7D53]">
                      {formatNaira(totalDeclaredValueNgn)}
                    </span>
                  </div>
                </div>

                {prohibitedScan.isProhibited && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-[#B42318] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      Alert: Prohibited keyword detected (<strong>{prohibitedScan.matchedKeyword}</strong>). Prohibited goods cannot be exported.
                    </span>
                  </div>
                )}
              </div>

              {/* SIMPLIFIED PACKAGE WEIGHT INPUT (User prompt requirement #1) */}
              <div className="p-4 bg-white rounded-lg border border-[#DCEFF3] space-y-3 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#354B55] flex items-center gap-1.5">
                      <span>Estimated Package Weight</span>
                      <span className="text-[#00B4D8]">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded">
                      Standard Unit: Kilograms (kg)
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Enter estimated weight in kg (e.g. 0.5, 1.5, 12.75)"
                      value={weightInputStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWeightInputStr(val);
                        const num = parseFloat(val);
                        if (!isNaN(num) && num > 0) {
                          setEstimatedWeightKg(num);
                        }
                      }}
                      className="w-full px-3 py-2.5 text-xs sm:text-sm border border-[#DCEFF3] rounded-lg font-mono focus:border-[#00B4D8] focus:outline-hidden bg-[#F5FBFD]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6A808C]">
                      KG
                    </span>
                  </div>

                  {(!estimatedWeightKg || estimatedWeightKg <= 0) && (
                    <p className="text-[11px] text-[#B42318] mt-1 font-medium">
                      Please enter a valid estimated weight greater than 0 kg.
                    </p>
                  )}

                  {/* Non-intrusive explanatory callout mandated by prompt */}
                  <div className="mt-2.5 p-3 bg-[#CAF0F8]/50 border border-[#90E0EF] rounded-lg text-[11px] text-[#354B55] leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                    <span>
                      <strong>No tape measure required:</strong> If you are unsure of the exact weight, enter your best estimate. Our operations team will verify the actual weight before confirming your shipping quotation.
                    </span>
                  </div>
                </div>

                {/* Optional dimensions accordion (Strictly optional for customers) */}
                <div className="pt-2 border-t border-[#DCEFF3]">
                  <button
                    type="button"
                    onClick={() => setShowOptionalDimensions(!showOptionalDimensions)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-[#6A808C] hover:text-[#00B4D8] py-1 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>I know my package dimensions</span>
                      <span className="text-[10px] font-normal text-[#6A808C] bg-slate-100 px-1.5 py-0.2 rounded">Optional</span>
                    </span>
                    {showOptionalDimensions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showOptionalDimensions && (
                    <div className="mt-3 p-3 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg space-y-3">
                      <div className="text-[11px] text-[#6A808C]">
                        Enter outer dimensions if already boxed. Leave blank if unsure; our depot staff records verified laser dimensions upon collection.
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-[#354B55] mb-1">Length (cm)</label>
                          <input
                            type="number"
                            min="1"
                            value={dimL}
                            onChange={(e) => {
                              setDimL(parseInt(e.target.value) || 1);
                              setHasDimensionsProvided(true);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCEFF3] bg-white rounded font-mono focus:border-[#00B4D8] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#354B55] mb-1">Width (cm)</label>
                          <input
                            type="number"
                            min="1"
                            value={dimW}
                            onChange={(e) => {
                              setDimW(parseInt(e.target.value) || 1);
                              setHasDimensionsProvided(true);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCEFF3] bg-white rounded font-mono focus:border-[#00B4D8] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#354B55] mb-1">Height (cm)</label>
                          <input
                            type="number"
                            min="1"
                            value={dimH}
                            onChange={(e) => {
                              setDimH(parseInt(e.target.value) || 1);
                              setHasDimensionsProvided(true);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCEFF3] bg-white rounded font-mono focus:border-[#00B4D8] focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#6A808C] pt-1">
                        <span>Calculated Volumetric Weight: <strong>{volWeight} kg</strong></span>
                        <button
                          type="button"
                          onClick={() => setHasDimensionsProvided(false)}
                          className="text-[#00B4D8] underline hover:text-[#0096B4]"
                        >
                          Clear Dimensions
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prohibited policy link and declaration checkbox */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6A808C]">Check restricted cargo guide:</span>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy('prohibited')}
                    className="text-[#00B4D8] font-semibold underline"
                  >
                    Prohibited Goods Policy
                  </button>
                </div>

                <label className="flex items-start gap-2 text-xs text-[#6A808C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={goodsDeclarationAcknowledged}
                    onChange={(e) => setGoodsDeclarationAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded border-[#DCEFF3] text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span>
                    I confirm this consignment contains no hazardous chemicals, firearms, narcotics, lithium batteries without authorization, or prohibited items.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pickup or Drop-off (Free) */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#354B55]">3. Pickup or Physical Drop-off</h3>
                <span className="text-[11px] font-semibold text-[#00B4D8] bg-[#CAF0F8] px-2 py-0.5 rounded">
                  Collection is Always Free
                </span>
              </div>
              <p className="text-xs text-[#6A808C]">Choose how we receive your shipment.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  fulfillmentType === 'pickup'
                    ? 'border-[#00B4D8] bg-[#CAF0F8]'
                    : 'border-[#DCEFF3] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentType === 'pickup'}
                    onChange={() => setFulfillmentType('pickup')}
                    className="text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span className="text-xs font-bold text-[#354B55]">Doorstep Pickup & Weighing</span>
                </div>
                <p className="text-[11px] text-[#6A808C] pl-5">
                  An authorized Swiftvero courier visits your address with certified scales and measuring tape.
                </p>
                <div className="mt-2 pl-5 text-xs font-semibold text-[#00B4D8]">
                  Pickup Fee: Free (₦0)
                </div>
              </label>

              <label
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  fulfillmentType === 'dropoff'
                    ? 'border-[#00B4D8] bg-[#CAF0F8]'
                    : 'border-[#DCEFF3] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentType === 'dropoff'}
                    onChange={() => setFulfillmentType('dropoff')}
                    className="text-[#00B4D8] focus:ring-[#00B4D8]"
                  />
                  <span className="text-xs font-bold text-[#354B55]">Depot Self Drop-off</span>
                </div>
                <p className="text-[11px] text-[#6A808C] pl-5">
                  Drop off directly at our secure international intake facility. Immediate screening on site.
                </p>
                <div className="mt-2 pl-5 text-xs font-semibold text-[#00B4D8]">
                  Drop-off Fee: Free (₦0)
                </div>
              </label>
            </div>

            {fulfillmentType === 'pickup' ? (
              <div className="p-4 bg-white rounded-md border border-[#DCEFF3] space-y-3">
                <div className="text-xs font-semibold text-[#354B55]">Schedule Pickup Date & Window</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#354B55] mb-1">Pickup Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#354B55] mb-1">Time Window</label>
                    <select
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden bg-white"
                    >
                      <option value="10:00 AM - 1:00 PM">Morning (10:00 AM - 1:00 PM)</option>
                      <option value="1:00 PM - 4:00 PM">Afternoon (1:00 PM - 4:00 PM)</option>
                      <option value="4:00 PM - 7:00 PM">Evening (4:00 PM - 7:00 PM)</option>
                    </select>
                  </div>
                </div>
                <div className="text-[11px] text-[#6A808C]">
                  Pickup Address: <span className="font-semibold text-[#354B55]">{senderAddress}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-md border border-[#DCEFF3] space-y-3">
                <div className="text-xs font-semibold text-[#354B55]">Select Drop-off Facility</div>
                <select
                  value={dropoffHub}
                  onChange={(e) => setDropoffHub(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden bg-white"
                >
                  <option value="Ikeja International Hub (Cargo Terminal)">
                    Ikeja International Hub (Cargo Terminal, Murtala Muhammed Airport)
                  </option>
                  <option value="Lekki Phase 1 Intake Office">
                    Lekki Phase 1 Intake Office (Plot 14 Admiralty Way)
                  </option>
                  <option value="Abuja Central Consolidation Depot">
                    Abuja Central Consolidation Depot (Nnamdi Azikiwe International Airport)
                  </option>
                </select>
                <div className="text-[11px] text-[#6A808C]">
                  Operating hours: Monday – Saturday, 8:00 AM – 6:00 PM. Please bring valid official photo identification.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Shipment Protection & Insurance Selection */}
        {step === 4 && (
          <div className="space-y-4">
            <ShipmentProtectionStep
              selectedPlan={protectionPlan}
              onSelectPlan={setProtectionPlan}
              declaredValueNgn={totalDeclaredValueNgn}
              items={declaredItems}
              destinationCountry={destinationCountry}
              termsAccepted={protectionTermsAccepted}
              onToggleTermsAccepted={setProtectionTermsAccepted}
              onOpenPolicy={onOpenPolicy}
              config={protectionConfig}
            />
          </div>
        )}

        {/* Step 5: Review & Checkpoint */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#174B35]">5. Review Booking Details &amp; Custody Declaration</h3>
              <p className="text-xs text-[#66736B]">Confirm your declared consignment details and protection level before quote generation.</p>
            </div>

            <div className="bg-white rounded-md border border-[#DCE8DF] p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#DCE8DF]">
                <span className="text-[#66736B]">Direction &amp; Route:</span>
                <span className="font-semibold text-[#174B35]">
                  {originCity} → {destinationCountry} ({destinationCity})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCE8DF]">
                <span className="text-[#66736B]">Consignment Contents:</span>
                <span className="font-semibold text-[#174B35] max-w-xs text-right">
                  {contentsDescription} ({totalItemQuantity} pcs)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCE8DF]">
                <span className="text-[#66736B]">Total Declared Value:</span>
                <span className="font-semibold text-[#2F7D53] font-mono-num">{formatNaira(totalDeclaredValueNgn)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCE8DF]">
                <span className="text-[#66736B]">Estimated Weight:</span>
                <span className="font-semibold text-[#174B35] font-mono-num">{estimatedWeightKg} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCE8DF]">
                <span className="text-[#66736B]">Selected Protection:</span>
                <span className="font-semibold flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      protectionPlan === 'premium'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-[#EAF6EE] text-[#2F7D53] border border-[#2F7D53]/30'
                    }`}
                  >
                    {protectionPlan === 'premium' ? 'Premium Shipment Coverage' : 'Included Basic Protection'}
                  </span>
                  <span className="text-[#66736B]">
                    (Coverage: {formatNaira(protectionCalc.coverageNgn)} · Fee: {formatNaira(protectionCalc.premiumNgn)})
                  </span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCE8DF]">
                <span className="text-[#66736B]">Dimensions:</span>
                <span className="font-semibold text-[#174B35] font-mono-num">
                  {dimL} × {dimW} × {dimH} cm (Volumetric: {volWeight} kg)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#66736B]">Collection Method:</span>
                <span className="font-semibold text-[#2F7D53]">
                  {fulfillmentType === 'pickup' ? `Doorstep Pickup (${pickupDate}) — Free` : `Depot Drop-off (${dropoffHub}) — Free`}
                </span>
              </div>
            </div>

            {/* Swiftvero Transparency Standard callout */}
            <div className="p-3.5 bg-[#EAF6EE] border border-[#DCE8DF] rounded-md text-xs text-[#66736B] leading-relaxed">
              <strong className="text-[#174B35]">Swiftvero Transparency Standard:</strong> Measurements are verified on certified equipment at intake. If physical scale weight or dimensions differ from your self-declaration, an itemized adjustment is sent for your explicit approval before payment.
            </div>

            <label className="flex items-start gap-2 text-xs text-[#66736B] cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={complianceConfirmed}
                onChange={(e) => setComplianceConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-[#DCE8DF] text-[#2F7D53] focus:ring-[#2F7D53]"
              />
              <span>
                I confirm the accuracy of these details and agree to Swiftvero’s{' '}
                <button
                  type="button"
                  onClick={() => onOpenPolicy('shipping')}
                  className="text-[#2F7D53] underline font-medium"
                >
                  Shipping Terms
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => onOpenPolicy('protection')}
                  className="text-[#2F7D53] underline font-medium"
                >
                  Shipment Protection Policy
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => onOpenPolicy('pricing')}
                  className="text-[#2F7D53] underline font-medium"
                >
                  Pricing Policy
                </button>
                .
              </span>
            </label>
          </div>
        )}

        {/* Step 6: Itemized Quote & Service Selection */}
        {step === 6 && quote && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#174B35]">6. Itemized Quotation &amp; Service Selection</h3>
                <span className="text-[11px] font-semibold text-[#2F7D53] bg-[#EAF6EE] px-2 py-0.5 rounded">
                  Estimated Delivery: {quote.estimatedDeliveryDisplay}
                </span>
              </div>
              <p className="text-xs text-[#66736B] mt-0.5">
                Transparent breakdown based on verified route, chargeable weight, and selected protection plan.
              </p>
            </div>

            {/* Service Selection: Standard vs Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Standard Air Courier */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTier('standard');
                  const q = generateQuoteBreakdown({
                    destinationCountry,
                    actualWeightKg: estimatedWeightKg,
                    lengthCm: dimL,
                    widthCm: dimW,
                    heightCm: dimH,
                    tier: 'standard',
                    pickupRequired: true,
                    baseDate: pickupDate,
                    direction,
                    protectionCharge: protectionCalc.premiumNgn,
                    protectionPlan: protectionPlan,
                    protectionCoverageNgn: protectionCalc.coverageNgn,
                    protectionRatePercentage: protectionCalc.ratePercentage,
                    protectionDeductibleText: protectionCalc.deductibleText,
                  });
                  setQuote(q);
                  setDiscrepancySimulated(false);
                }}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedTier === 'standard'
                    ? 'border-[#2F7D53] bg-[#EAF6EE]'
                    : 'border-[#DCE8DF] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#174B35]">Standard Air Courier</span>
                  {selectedTier === 'standard' && <Check className="w-4 h-4 text-[#2F7D53]" />}
                </div>
                <div className="text-[11px] text-[#66736B] mb-1">
                  Cost-optimized international lane · 4–6 business days
                </div>
                <div className="text-[10px] text-[#66736B] mb-2">
                  Est. Delivery: {calculateEstimatedDeliveryDate(pickupDate, 'standard').displayDate}
                </div>
                <div className="text-base font-bold text-[#2F7D53] font-mono-num">
                  {formatNaira(
                    generateQuoteBreakdown({
                      destinationCountry,
                      actualWeightKg: estimatedWeightKg,
                      lengthCm: dimL,
                      widthCm: dimW,
                      heightCm: dimH,
                      tier: 'standard',
                      baseDate: pickupDate,
                      direction,
                      protectionCharge: protectionCalc.premiumNgn,
                      protectionPlan: protectionPlan,
                      protectionCoverageNgn: protectionCalc.coverageNgn,
                      protectionRatePercentage: protectionCalc.ratePercentage,
                      protectionDeductibleText: protectionCalc.deductibleText,
                    }).totalAmount
                  )}
                </div>
              </button>

              {/* Priority Air Express */}
              <button
                type="button"
                disabled={!routeInfo.prioritySupported}
                onClick={() => {
                  if (routeInfo.prioritySupported) {
                    setSelectedTier('priority');
                    const q = generateQuoteBreakdown({
                      destinationCountry,
                      actualWeightKg: estimatedWeightKg,
                      lengthCm: dimL,
                      widthCm: dimW,
                      heightCm: dimH,
                      tier: 'priority',
                      pickupRequired: true,
                      baseDate: pickupDate,
                      direction,
                      protectionCharge: protectionCalc.premiumNgn,
                      protectionPlan: protectionPlan,
                      protectionCoverageNgn: protectionCalc.coverageNgn,
                      protectionRatePercentage: protectionCalc.ratePercentage,
                      protectionDeductibleText: protectionCalc.deductibleText,
                    });
                    setQuote(q);
                    setDiscrepancySimulated(false);
                  }
                }}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  !routeInfo.prioritySupported
                    ? 'border-[#DCE8DF] bg-slate-50 opacity-60 cursor-not-allowed'
                    : selectedTier === 'priority'
                    ? 'border-[#2F7D53] bg-[#EAF6EE]'
                    : 'border-[#DCE8DF] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#174B35]">Priority Air Express</span>
                    <span className="text-[10px] font-semibold text-[#2F7D53] bg-white border border-[#DCE8DF] px-1.5 py-0.2 rounded">
                      Fastest
                    </span>
                  </div>
                  {selectedTier === 'priority' && <Check className="w-4 h-4 text-[#2F7D53]" />}
                </div>
                <div className="text-[11px] text-[#66736B] mb-1">
                  Fastest available lane · 2–3 business days
                </div>
                <div className="text-[10px] text-[#66736B] mb-2">
                  {routeInfo.prioritySupported
                    ? `Est. Delivery: ${calculateEstimatedDeliveryDate(pickupDate, 'priority').displayDate}`
                    : 'Not supported on this remote route'}
                </div>
                {routeInfo.prioritySupported ? (
                  <div className="text-base font-bold text-[#2F7D53] font-mono-num">
                    {formatNaira(
                      generateQuoteBreakdown({
                        destinationCountry,
                        actualWeightKg: estimatedWeightKg,
                        lengthCm: dimL,
                        widthCm: dimW,
                        heightCm: dimH,
                        tier: 'priority',
                        baseDate: pickupDate,
                        direction,
                        protectionCharge: protectionCalc.premiumNgn,
                        protectionPlan: protectionPlan,
                        protectionCoverageNgn: protectionCalc.coverageNgn,
                        protectionRatePercentage: protectionCalc.ratePercentage,
                        protectionDeductibleText: protectionCalc.deductibleText,
                      }).totalAmount
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-[#66736B] italic">Unavailable</div>
                )}
              </button>
            </div>

            {/* Itemized Table */}
            <div className="border border-[#DCE8DF] rounded-md overflow-hidden text-xs">
              <div className="bg-[#EAF6EE] px-4 py-2 font-semibold text-[#174B35] border-b border-[#DCE8DF] flex justify-between">
                <span>Fee Breakdown</span>
                <span>Amount</span>
              </div>
              <div className="divide-y divide-[#DCE8DF] px-4">
                <div className="py-2.5 flex justify-between">
                  <div>
                    <div className="text-[#174B35] font-medium">International Air Carriage Linehaul</div>
                    <div className="text-[11px] text-[#66736B]">
                      Chargeable weight: {quote.chargeableWeightKg} kg ({quote.serviceName})
                    </div>
                  </div>
                  <span className="font-mono-num text-[#174B35]">{formatNaira(quote.freightCharge)}</span>
                </div>

                <div className="py-2.5 flex justify-between">
                  <div>
                    <div className="text-[#174B35] font-medium">Jet Fuel Surcharge (Index Rate)</div>
                    <div className="text-[11px] text-[#66736B]">Aviation standard fuel indexing</div>
                  </div>
                  <span className="font-mono-num text-[#174B35]">{formatNaira(quote.jetFuelSurcharge)}</span>
                </div>

                <div className="py-2.5 flex justify-between">
                  <div>
                    <div className="text-[#174B35] font-medium">Terminal Documentation &amp; Security Screening</div>
                    <div className="text-[11px] text-[#66736B]">NCAA export manifest lodging &amp; X-ray screening</div>
                  </div>
                  <span className="font-mono-num text-[#174B35]">{formatNaira(quote.handlingCharge)}</span>
                </div>

                <div className="py-2.5 flex justify-between">
                  <div>
                    <div className="text-[#174B35] font-medium">Doorstep Collection</div>
                    <div className="text-[11px] text-[#66736B]">Certified scale collection at your address</div>
                  </div>
                  <span className="text-[#2F7D53] font-medium">Free (₦0)</span>
                </div>

                {/* Itemized Shipment Protection Fee Line */}
                <div className="py-2.5 flex justify-between">
                  <div>
                    <div className="text-[#174B35] font-medium flex items-center gap-1.5">
                      <span>Shipment Protection ({protectionPlan === 'premium' ? 'Premium Coverage' : 'Included Basic'})</span>
                      {protectionPlan === 'premium' && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                          {protectionCalc.ratePercentage}% of value
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#66736B]">
                      Coverage limit: {formatNaira(protectionCalc.coverageNgn)} · Underwritten via {protectionConfig.providerName}
                    </div>
                  </div>
                  <span className={`font-mono-num ${protectionPlan === 'premium' ? 'text-[#174B35] font-semibold' : 'text-[#2F7D53] font-medium'}`}>
                    {protectionPlan === 'premium' ? formatNaira(protectionCalc.premiumNgn) : 'Free (₦0)'}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between">
                  <div className="text-[#66736B]">Statutory VAT (7.5% Nigerian Sales Tax)</div>
                  <span className="font-mono-num text-[#174B35]">{formatNaira(quote.vatAmount)}</span>
                </div>

                <div className="py-3 flex justify-between items-center text-sm font-bold bg-[#EAF6EE] -mx-4 px-4 border-t border-[#DCE8DF]">
                  <div>
                    <span className="text-[#174B35]">Total Payable:</span>
                    <p className="text-[11px] font-normal text-[#66736B]">
                      Estimated Delivery: {quote.estimatedDeliveryDisplay} (Estimate — not a guarantee)
                    </p>
                  </div>
                  <span className="text-base text-[#2F7D53] font-mono-num">{formatNaira(quote.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Discrepancy Demonstration Sandbox */}
            <div className="p-3.5 bg-slate-50 rounded-md border border-[#DCE8DF] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#174B35]">Depot Weighing Sandbox:</span>
                {!discrepancySimulated ? (
                  <button
                    type="button"
                    onClick={handleSimulateDiscrepancy}
                    className="px-2.5 py-1 bg-white border border-[#DCE8DF] rounded text-[11px] font-medium text-[#2F7D53] hover:bg-slate-50 transition-colors"
                  >
                    Simulate Intake Weighing (+2kg Difference)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={generateInitialQuote}
                    className="px-2.5 py-1 bg-white border border-[#DCE8DF] rounded text-[11px] font-medium text-[#66736B] hover:bg-slate-50 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Declared Weight</span>
                  </button>
                )}
              </div>

              {discrepancySimulated && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-2">
                  <div className="font-bold text-[#986B16] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Verified Weight Discrepancy Detected</span>
                  </div>
                  <p className="text-[#174B35] text-[11px] leading-relaxed">
                    {quote.discrepancyReason}
                  </p>
                  <div className="text-[11px] text-[#66736B]">
                    Previous estimate: <span className="line-through">{formatNaira(quote.previousTotal || 0)}</span> → Revised Total:{' '}
                    <strong className="text-[#174B35] font-mono-num">{formatNaira(quote.totalAmount)}</strong>
                  </div>

                  <label className="flex items-center gap-2 pt-1 font-semibold text-[#174B35] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerApprovedDiscrepancy}
                      onChange={(e) => setCustomerApprovedDiscrepancy(e.target.checked)}
                      className="rounded border-[#DCE8DF] text-[#2F7D53] focus:ring-[#2F7D53]"
                    />
                    <span>I approve the revised quotation based on physical intake measurements</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 7: Payment & Unified Checkout Pricing */}
        {step === 7 && quote && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#174B35]">7. Payment Settlement &amp; Rewards Application</h3>
                <span className="text-[11px] font-semibold text-[#2F7D53] bg-[#EAF6EE] px-2 py-0.5 rounded">
                  Secure Checkout
                </span>
              </div>
              <p className="text-xs text-[#66736B] mt-0.5">
                Apply promotional discount codes and available non-withdrawable shipping credits directly to your final bill.
              </p>
            </div>

            {/* Interactive Demo Test Scenario Quick Bar */}
            <div className="p-3 bg-[#EAF6EE]/50 border border-[#2F7D53]/30 rounded-lg text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2F7D53]" />
                  <span className="font-bold text-[#174B35]">Interactive Checkout Demo Scenario:</span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadDemoCheckoutScenario}
                  className="px-3 py-1 bg-[#2F7D53] hover:bg-[#174B35] text-white rounded text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <span>Load Demo Test Scenario (₦30k - 10% - ₦5k = ₦22k)</span>
                </button>
              </div>
              <p className="text-[11px] text-[#66736B] leading-relaxed">
                Click above to instantly set a ₦30,000 base quote, apply promo code <strong>SWIFT10</strong> (10% off = -₦3,000), and apply <strong>₦5,000</strong> from your available shipping credits to see the final ₦22,000 payable amount.
              </p>
            </div>

            {/* Payment Failure / Reversal Alert */}
            {paymentState === 'failed' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-[#B42318] space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Card Declined / Bank Timeout Simulation</span>
                </div>
                <p className="text-[11px]">
                  Authorization was declined by issuer. You can retry with an alternative card or bank transfer.
                </p>
                {reversalNotice && (
                  <div className="p-2 bg-white border border-red-200 rounded font-semibold text-[#247347]">
                    ✓ {reversalNotice}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentState('pending');
                    setReversalNotice(null);
                  }}
                  className="px-3 py-1 bg-white border border-red-200 rounded text-[11px] font-semibold text-[#B42318] hover:bg-slate-50"
                >
                  Retry Payment
                </button>
              </div>
            )}

            {/* PROMOTIONAL DISCOUNT CODE APPLICATION */}
            <div className="p-4 bg-white rounded-lg border border-[#DCE8DF] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#174B35] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#2F7D53]" />
                  <span>Have a Promotional Discount Code?</span>
                </label>
                {appliedPromoCode && (
                  <span className="text-[10px] font-bold text-[#247347] bg-[#EAF6EE] px-2 py-0.5 rounded">
                    Active Code: {appliedPromoCode}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. SWIFT10, SWIFT5K)"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 text-xs border border-[#DCE8DF] rounded-md font-mono uppercase focus:border-[#2F7D53] focus:outline-hidden bg-[#F5FAF6]"
                />
                {!appliedPromoCode ? (
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    className="px-4 py-2 bg-[#2F7D53] hover:bg-[#174B35] text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Apply Code
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-md transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {promoMessage && (
                <div
                  className={`text-[11px] p-2 rounded ${
                    promoMessage.isError ? 'bg-red-50 text-[#B42318]' : 'bg-[#EAF6EE] text-[#247347] font-medium'
                  }`}
                >
                  {promoMessage.text}
                </div>
              )}

              {/* Demo test promo chips */}
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#66736B]">
                <span>Try demo codes:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPromo('SWIFT10')}
                  className="px-2 py-0.5 bg-[#F5FAF6] border border-[#DCE8DF] hover:border-[#2F7D53] rounded text-[#174B35] font-mono text-[10px]"
                >
                  SWIFT10 (10% Off)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPromo('SWIFT5K')}
                  className="px-2 py-0.5 bg-[#F5FAF6] border border-[#DCE8DF] hover:border-[#2F7D53] rounded text-[#174B35] font-mono text-[10px]"
                >
                  SWIFT5K (₦5k Off)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPromo('EXPIRED20')}
                  className="px-2 py-0.5 bg-[#F5FAF6] border border-[#DCE8DF] hover:border-[#2F7D53] rounded text-slate-400 font-mono text-[10px]"
                >
                  EXPIRED20
                </button>
              </div>
            </div>

            {/* SHIPPING CREDITS REDEMPTION */}
            <div className="p-4 bg-white rounded-lg border border-[#DCE8DF] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#2F7D53]" />
                  <span className="text-xs font-bold text-[#174B35]">Apply Available Shipping Credits</span>
                </div>
                <div className="text-xs">
                  <span className="text-[#66736B]">Available Credit Balance: </span>
                  <span className="font-bold text-[#247347] font-mono">
                    {formatNaira(currentCustomer.cashbackBalance)}
                  </span>
                </div>
              </div>

              {currentCustomer.cashbackBalance > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max={Math.min(currentCustomer.cashbackBalance, pricing.subtotalAfterDiscountNgn)}
                      step="500"
                      value={creditsToApplyNgn}
                      onChange={(e) => setCreditsToApplyNgn(parseInt(e.target.value) || 0)}
                      className="flex-1 accent-[#2F7D53]"
                    />
                    <div className="relative w-36">
                      <input
                        type="number"
                        min="0"
                        max={Math.min(currentCustomer.cashbackBalance, pricing.subtotalAfterDiscountNgn)}
                        step="500"
                        value={creditsToApplyNgn}
                        onChange={(e) =>
                          setCreditsToApplyNgn(
                            Math.min(
                              currentCustomer.cashbackBalance,
                              pricing.subtotalAfterDiscountNgn,
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-[#247347] border border-[#DCE8DF] rounded focus:border-[#2F7D53] focus:outline-hidden"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#66736B]">NGN</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCreditsToApplyNgn(
                            Math.min(currentCustomer.cashbackBalance, pricing.subtotalAfterDiscountNgn)
                          )
                        }
                        className="text-[#2F7D53] font-semibold underline hover:text-[#174B35]"
                      >
                        Apply Maximum Credits
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setCreditsToApplyNgn(0)}
                        className="text-[#66736B] underline hover:text-[#174B35]"
                      >
                        Clear Credits
                      </button>
                    </div>
                    <span className="text-[#66736B]">
                      Remaining Balance after deduction: {formatNaira(pricing.remainingCreditBalanceNgn)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#F5FAF6] border border-[#DCE8DF] rounded text-[11px] text-[#66736B] leading-relaxed">
                    <strong>Notice:</strong> Your rewards are non-withdrawable promotional shipping credits. Applied credits reduce your payable balance and are immediately restored to your balance if payment fails.
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#66736B] italic">
                  No unlocked shipping credits currently available. Complete your first delivered shipment to unlock 3% freight cashback credits!
                </div>
              )}
            </div>

            {/* UNIFIED CHECKOUT PRICING SUMMARY */}
            <div className="p-4 bg-white rounded-lg border-2 border-[#DCE8DF] space-y-2.5 text-xs shadow-2xs">
              <div className="font-bold text-[#174B35] pb-1.5 border-b border-[#DCE8DF] flex items-center justify-between">
                <span>Unified Checkout Pricing Breakdown</span>
                <span className="text-[11px] font-normal text-[#66736B]">Strict Mathematical Order</span>
              </div>

              {/* 1. Original Quotation */}
              <div className="flex justify-between items-center py-1">
                <span className="text-[#66736B]">1. Original Shipping Quotation:</span>
                <span className="font-semibold text-[#174B35] font-mono-num">
                  {formatNaira(pricing.originalQuotationNgn)}
                </span>
              </div>

              {/* 2. Promo Code Discount */}
              <div className="flex justify-between items-center py-1 text-[#247347]">
                <span>
                  2. Less: Promotional Discount {pricing.discountApplied ? `(${pricing.discountApplied.code})` : ''}:
                </span>
                <span className="font-semibold font-mono-num">
                  {pricing.discountAmountNgn > 0 ? `-${formatNaira(pricing.discountAmountNgn)}` : '₦0'}
                </span>
              </div>

              {/* 3. Subtotal after Discount */}
              <div className="flex justify-between items-center py-1 text-[#174B35] font-medium border-t border-dashed border-[#DCE8DF]">
                <span>3. Subtotal after Promotional Discount:</span>
                <span className="font-mono-num">{formatNaira(pricing.subtotalAfterDiscountNgn)}</span>
              </div>

              {/* 4. Less: Available Shipping Credits */}
              <div className="flex justify-between items-center py-1 text-[#247347]">
                <span>4. Less: Available Shipping Credits Applied:</span>
                <span className="font-semibold font-mono-num">
                  {pricing.creditsAppliedNgn > 0 ? `-${formatNaira(pricing.creditsAppliedNgn)}` : '₦0'}
                </span>
              </div>

              {/* 5. Final Amount Payable */}
              <div className="flex justify-between items-center pt-2.5 pb-1 border-t-2 border-[#2F7D53] text-sm font-bold bg-[#EAF6EE]/30 -mx-4 px-4 rounded-b">
                <div>
                  <span className="text-[#174B35]">5. Final Amount Payable:</span>
                  <div className="text-[11px] font-normal text-[#66736B]">
                    Via Debit Card, Direct Bank Transfer, or USSD
                  </div>
                </div>
                <span className="text-lg font-mono font-bold text-[#247347]">
                  {formatNaira(pricing.finalPayableNgn)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#174B35]">Settlement Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-md border text-left text-xs font-medium flex items-center gap-2 ${
                    paymentMethod === 'card'
                      ? 'border-[#2F7D53] bg-[#EAF6EE] text-[#174B35] font-bold'
                      : 'border-[#DCE8DF] text-[#174B35] hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0 text-[#2F7D53]" />
                  <span>Debit / Credit Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded-md border text-left text-xs font-medium flex items-center gap-2 ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#2F7D53] bg-[#EAF6EE] text-[#174B35] font-bold'
                      : 'border-[#DCE8DF] text-[#174B35] hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0 text-[#2F7D53]" />
                  <span>Direct Bank Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ussd')}
                  className={`p-3 rounded-md border text-left text-xs font-medium flex items-center gap-2 ${
                    paymentMethod === 'ussd'
                      ? 'border-[#2F7D53] bg-[#EAF6EE] text-[#174B35] font-bold'
                      : 'border-[#DCE8DF] text-[#174B35] hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-4 h-4 shrink-0 text-[#2F7D53]" />
                  <span>USSD Instant Pay</span>
                </button>
              </div>
            </div>

            {/* Direct Confirmation Action */}
            <div className="p-4 bg-slate-50 border border-[#DCE8DF] rounded-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlePaymentSubmit('success')}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#2F7D53] hover:bg-[#174B35] rounded-md transition-colors shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment ({formatNaira(pricing.finalPayableNgn)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentSubmit('failed')}
                  className="px-3 py-2 text-xs font-medium text-[#B42318] hover:underline"
                >
                  Simulate Bank Decline (Reverses Credits)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Booking Confirmed & Itemized Receipt */}
        {step === 8 && (
          <div className="text-center py-6 space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#EAF6EE] text-[#2F7D53] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#247347]" />
            </div>

            <div>
              <span className="text-xs font-semibold text-[#247347] uppercase tracking-wider">
                Booking Confirmed &amp; Payment Settled
              </span>
              <h3 className="text-2xl font-bold font-serif-display text-[#174B35] mt-1 font-mono-num">
                {createdTrackingNumber}
              </h3>
              <p className="text-xs text-[#66736B] mt-1 max-w-md mx-auto leading-relaxed">
                Your consignment has been registered. Final settled amount of{' '}
                <strong className="text-[#174B35]">{formatNaira(confirmedTotalPaidNgn)}</strong> confirmed (Ref: {paymentRef}).
              </p>
            </div>

            {/* SHIPMENT PROTECTION CERTIFICATE RECORD CARD */}
            <div className="p-4 bg-white rounded-lg border-2 border-[#2F7D53]/40 max-w-md mx-auto text-left text-xs space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE8DF]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2F7D53]" />
                  <span className="font-bold text-[#174B35]">Shipment Protection Record</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    protectionPlan === 'premium'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-[#EAF6EE] text-[#2F7D53] border-[#2F7D53]/30'
                  }`}
                >
                  {protectionPlan === 'premium' ? 'Premium Coverage Active' : 'Basic Protection Active'}
                </span>
              </div>

              <div className="space-y-1.5 text-[#66736B]">
                <div className="flex justify-between">
                  <span>Certificate Reference:</span>
                  <span className="font-mono font-semibold text-[#174B35]">{activeCertificate?.certificateNumber || 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Declared Consignment Value:</span>
                  <span className="font-mono text-[#174B35]">{formatNaira(totalDeclaredValueNgn)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maximum Coverage Limit:</span>
                  <span className="font-mono font-bold text-[#2F7D53]">{formatNaira(protectionCalc.coverageNgn)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Protection Provider:</span>
                  <span className="font-medium text-[#174B35]">{protectionConfig.providerName}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DCE8DF] flex items-center justify-between">
                <span className="text-[11px] text-[#66736B]">Electronic Record Issued</span>
                <button
                  type="button"
                  onClick={() => setIsCertificateModalOpen(true)}
                  className="px-3 py-1.5 bg-[#2F7D53] hover:bg-[#174B35] text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>View &amp; Download Certificate</span>
                </button>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 bg-white rounded-lg border border-[#DCE8DF] max-w-md mx-auto text-left text-xs space-y-2 shadow-2xs">
              <div className="font-bold text-[#174B35] pb-1 border-b border-[#DCE8DF] flex justify-between">
                <span>Receipt Itemization:</span>
                <span className="text-[#247347]">{quote?.serviceName}</span>
              </div>
              <div className="flex justify-between text-[#66736B]">
                <span>Original Quotation:</span>
                <span className="font-mono text-[#174B35]">{formatNaira(quote?.totalAmount || 0)}</span>
              </div>
              {confirmedDiscountNgn > 0 && (
                <div className="flex justify-between text-[#247347]">
                  <span>Promo Discount Applied:</span>
                  <span className="font-mono">-{formatNaira(confirmedDiscountNgn)}</span>
                </div>
              )}
              {confirmedCreditsNgn > 0 && (
                <div className="flex justify-between text-[#247347]">
                  <span>Shipping Credits Redeemed:</span>
                  <span className="font-mono">-{formatNaira(confirmedCreditsNgn)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#174B35] pt-1 border-t border-[#DCE8DF]">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-sm text-[#247347]">{formatNaira(confirmedTotalPaidNgn)}</span>
              </div>
            </div>

            {/* Pickup tracking status preview */}
            <div className="p-4 bg-[#EAF6EE] rounded-md border border-[#DCE8DF] max-w-md mx-auto text-left text-xs space-y-2.5">
              <div className="font-semibold text-[#174B35] flex items-center justify-between">
                <span>Pickup Status Tracker:</span>
                <span className="text-[#247347] bg-white px-2 py-0.5 rounded border border-[#DCE8DF] text-[10px] font-bold">
                  Pickup Requested
                </span>
              </div>
              <p className="text-[#66736B] text-xs">
                {fulfillmentType === 'pickup'
                  ? `An authorized Swiftvero courier will arrive at ${senderAddress} on ${pickupDate} between ${pickupSlot}. Certified scale verification will be performed.`
                  : `Please present your consignment at ${dropoffHub} before 5:00 PM.`}
              </p>
              <div className="pt-2 border-t border-[#DCE8DF] text-[11px] text-[#247347] font-medium flex items-center justify-between">
                <span>Estimated 3% promotional cashback credit:</span>
                <span className="font-mono-num font-bold">
                  {formatNaira(Math.round((quote?.freightCharge || 0) * 0.03))}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => onComplete(createdTrackingNumber)}
                className="px-6 py-3 text-xs font-semibold text-white bg-[#2F7D53] hover:bg-[#174B35] rounded-md transition-colors shadow-xs flex items-center gap-2"
              >
                <span>Track This Consignment Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Stepper Buttons */}
      {step < 8 && (
        <div className="px-6 py-3.5 border-t border-[#DCE8DF] bg-white flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#174B35] hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#2F7D53] hover:bg-[#174B35] rounded-md transition-colors flex items-center gap-1.5"
              >
                <span>Continue to Goods Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={prohibitedScan.isProhibited || !goodsDeclarationAcknowledged}
                onClick={() => setStep(3)}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-md transition-colors flex items-center gap-1.5 ${
                  !prohibitedScan.isProhibited && goodsDeclarationAcknowledged
                    ? 'bg-[#2F7D53] hover:bg-[#174B35]'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <span>Continue to Pickup Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#2F7D53] hover:bg-[#174B35] rounded-md transition-colors flex items-center gap-1.5"
              >
                <span>Select Shipment Protection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={!protectionTermsAccepted}
                onClick={() => setStep(5)}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-md transition-colors flex items-center gap-1.5 ${
                  protectionTermsAccepted ? 'bg-[#2F7D53] hover:bg-[#174B35]' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <span>Review Declaration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 5 && (
              <button
                type="button"
                disabled={!complianceConfirmed}
                onClick={() => {
                  generateInitialQuote();
                  setStep(6);
                }}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-md transition-colors flex items-center gap-1.5 ${
                  complianceConfirmed ? 'bg-[#2F7D53] hover:bg-[#174B35]' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <span>Calculate Itemized Quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 6 && (
              <button
                type="button"
                disabled={discrepancySimulated && !customerApprovedDiscrepancy}
                onClick={() => setStep(7)}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-md transition-colors flex items-center gap-1.5 ${
                  !discrepancySimulated || customerApprovedDiscrepancy
                    ? 'bg-[#2F7D53] hover:bg-[#174B35]'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Printable / Downloadable Protection Certificate Modal */}
      <ProtectionCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        certificate={activeCertificate}
      />
    </div>
  );
};
