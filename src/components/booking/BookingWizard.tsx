import React, { useState, useEffect } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  SUPPORTED_ORIGINS,
  SUPPORTED_DESTINATIONS,
  evaluateRouteAvailability,
  generateQuoteBreakdown,
  isProhibitedItem,
  formatNaira,
} from '../../utils/shipping-calculator';
import { evaluateCollectionOptions } from '../../utils/collection-options';
import {
  isShippingInsuranceAvailable,
  calculateAdminGatedInsurancePremium,
} from '../../utils/adjustment-engine';
import { CollectionMethod, QuoteRecord, ServiceTier, ShipmentRecord } from '../../types';
import { PolicyKey } from '../common/LegalModal';
import {
  PackageSelectorCard,
  UnitSuffixInput,
  QuantityStepper,
  QuoteOptionCard,
  QuoteOptionDetailsModal,
  QuoteOptionDetailSpec,
  OptionalServiceAccordion,
  StickyPaymentSummaryDrawer,
} from '../common/DhlStylePrimitives';
import { ReferenceQrBadge } from '../common/ReferenceQrBadge';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Upload,
  Check,
  Plus,
  Trash2,
  Edit3,
  Zap,
  Building2,
  Clock,
  Layers,
  FileText,
  Box,
  BookmarkCheck,
  ShieldAlert,
  UserCheck,
  X,
  RotateCcw,
} from 'lucide-react';

interface BookingWizardProps {
  initialQuoteRef?: string;
  onComplete: (trackingNumber: string) => void;
  onOpenPolicy: (key: PolicyKey) => void;
  onOpenKyc: () => void;
}

interface DraftShipmentItem {
  id: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  serviceTier: ServiceTier;
  contentsDescription: string;
  packageCount: number;
  declaredWeightKg: number;
  declaredDimensions?: { length: number; width: number; height: number };
  declaredValueNgn: number;
  isFragile: boolean;
  fragileHandlingNotes?: string;
  collectionAddressOverride?: string;
  photoName?: string;
  packagingPreset?: string;
}

const BOOKING_DRAFT_STORAGE_KEY = 'swiftvero_booking_draft_v2';

const NIGERIA_STATES = ['Lagos', 'Abuja (FCT)', 'Rivers (Port Harcourt)', 'Oyo (Ibadan)', 'Kano', 'Ogun'];

const PACKAGING_PRESETS = [
  {
    id: 'envelope',
    title: 'Document Envelope',
    dimensions: '35 × 25 × 3 cm',
    maxWeight: 'Up to 1.0 kg',
    weightKg: 1.0,
    dims: { length: 35, width: 25, height: 3 },
  },
  {
    id: 'small_box',
    title: 'Small Parcel Box',
    dimensions: '30 × 25 × 20 cm',
    maxWeight: 'Up to 5.0 kg',
    weightKg: 3.5,
    dims: { length: 30, width: 25, height: 20 },
  },
  {
    id: 'medium_carton',
    title: 'Medium Export Carton',
    dimensions: '45 × 35 × 30 cm',
    maxWeight: 'Up to 15.0 kg',
    weightKg: 10.0,
    dims: { length: 45, width: 35, height: 30 },
  },
  {
    id: 'custom',
    title: 'Custom Packaging',
    dimensions: 'Enter L × W × H (cm)',
    maxWeight: 'Flexible weight',
    weightKg: 5.0,
    dims: null,
  },
];

export const BookingWizard: React.FC<BookingWizardProps> = ({
  initialQuoteRef,
  onComplete,
  onOpenPolicy,
}) => {
  const {
    role,
    setRole,
    setActiveCustomerKey,
    currentCustomer,
    updateCurrentCustomer,
    branches,
    pickupJobs,
    addressBook,
    quotes,
    adminFeatureFlags,
    createBookingGroup,
    saveGuestQuote,
    validatePromoCode,
    setSelectedShipmentForTracking,
  } = useDemo();

  const readSavedDraft = () => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(BOOKING_DRAFT_STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const savedDraft = !initialQuoteRef ? readSavedDraft() : null;

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(savedDraft?.step || 1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadedQuoteRef, setLoadedQuoteRef] = useState<string | undefined>(
    initialQuoteRef || savedDraft?.loadedQuoteRef
  );

  // STEP 1: SENDER & COLLECTION LOCATION
  const [senderName, setSenderName] = useState(
    savedDraft?.senderName ?? (role !== 'visitor' ? currentCustomer.name : '')
  );
  const [senderPhone, setSenderPhone] = useState(
    savedDraft?.senderPhone ?? (role !== 'visitor' ? currentCustomer.phone : '')
  );
  const [senderEmail, setSenderEmail] = useState(
    savedDraft?.senderEmail ?? (role !== 'visitor' ? currentCustomer.email : '')
  );
  const [senderState, setSenderState] = useState(savedDraft?.senderState || 'Lagos');
  const [senderCity, setSenderCity] = useState(savedDraft?.senderCity || 'Lekki');
  const [sharedCollectionAddress, setSharedCollectionAddress] = useState(
    savedDraft?.sharedCollectionAddress ??
      (role !== 'visitor' ? currentCustomer.address || 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos' : '')
  );

  const defaultInitialItem: DraftShipmentItem = {
    id: 'draft_1',
    originCountry: 'Nigeria',
    originCity: 'Lagos',
    destinationCountry: 'United Kingdom',
    destinationCity: 'London',
    recipientName: 'Eleanor Sterling',
    recipientPhone: '+44 20 7946 0881',
    recipientAddress: '18 St. Mary Axe, London, EC3A 8EP',
    serviceTier: 'standard',
    contentsDescription: 'Personal clothing, Adire textiles & documents',
    packageCount: 1,
    declaredWeightKg: 3.5,
    declaredDimensions: { length: 30, width: 25, height: 20 },
    declaredValueNgn: 85000,
    isFragile: false,
    fragileHandlingNotes: '',
    packagingPreset: 'small_box',
  };

  // STEP 2: MULTIPLE SHIPMENTS IN GROUP
  const [items, setItems] = useState<DraftShipmentItem[]>(savedDraft?.items || [defaultInitialItem]);

  const [editingItemId, setEditingItemId] = useState<string>(
    savedDraft?.items?.[0]?.id || 'draft_1'
  );
  const [showItemEditor, setShowItemEditor] = useState<boolean>(true);
  const [originCountry, setOriginCountry] = useState('Nigeria');
  const [originCity, setOriginCity] = useState('Lagos');
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [destinationCity, setDestinationCity] = useState('London');
  const [recipientName, setRecipientName] = useState('Eleanor Sterling');
  const [recipientPhone, setRecipientPhone] = useState('+44 20 7946 0881');
  const [recipientAddress, setRecipientAddress] = useState('18 St. Mary Axe, London, EC3A 8EP');
  const [serviceTier, setServiceTier] = useState<ServiceTier>('standard');
  const [contentsDescription, setContentsDescription] = useState('Personal clothing, Adire textiles & documents');
  const [packageCount, setPackageCount] = useState<number>(1);
  const [packagingPreset, setPackagingPreset] = useState<string>('small_box');
  const [estimatedWeightStr, setEstimatedWeightStr] = useState<string>('3.5');
  const [showOptionalDimensions, setShowOptionalDimensions] = useState<boolean>(false);
  const [dimL, setDimL] = useState<string>('30');
  const [dimW, setDimW] = useState<string>('25');
  const [dimH, setDimH] = useState<string>('20');
  const [declaredValueStr, setDeclaredValueStr] = useState<string>('85000');
  const [isFragile, setIsFragile] = useState<boolean>(false);
  const [fragileHandlingNotes, setFragileHandlingNotes] = useState<string>('');
  const [photoName, setPhotoName] = useState<string | undefined>(undefined);
  const [useDifferentPickupAddress, setUseDifferentPickupAddress] = useState(false);
  const [collectionAddressOverride, setCollectionAddressOverride] = useState('');
  const [detailModalOption, setDetailModalOption] = useState<QuoteOptionDetailSpec | null>(null);

  // STEP 3: COLLECTION METHOD
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>(
    savedDraft?.collectionMethod || 'standard_pickup'
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    branches.find((b) => b.status === 'active')?.id || 'branch_ikeja'
  );
  const [scheduledDate, setScheduledDate] = useState(savedDraft?.scheduledDate || '2026-11-13');
  const [scheduledSlot, setScheduledSlot] = useState(savedDraft?.scheduledSlot || '10:00 AM - 1:00 PM');

  // STEP 4: OPTIONAL SERVICES, PROMO & UNPRESELECTED LEGAL CHECKBOXES
  const [fragileCareOptIn, setFragileCareOptIn] = useState(Boolean(savedDraft?.fragileCareOptIn));
  const [exportSealOptIn, setExportSealOptIn] = useState(Boolean(savedDraft?.exportSealOptIn));
  const [insuranceOptIn, setInsuranceOptIn] = useState(Boolean(savedDraft?.insuranceOptIn));
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoDiscountNgn, setPromoDiscountNgn] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [prohibitedDeclared, setProhibitedDeclared] = useState(false);

  // Journey A Quote-Only Save state
  const [savedQteFeedback, setSavedQteFeedback] = useState<QuoteRecord | null>(null);

  // Journey B Inline Auth Modal state
  const [inlineAuthOpen, setInlineAuthOpen] = useState(false);
  const [inlineAuthTab, setInlineAuthTab] = useState<'quick' | 'register'>('quick');
  const [regPassword, setRegPassword] = useState('');
  const [inlineAuthError, setInlineAuthError] = useState<string | null>(null);

  // STEP 5: CONFIRMATION OUTPUT
  const [confirmedGroupCode, setConfirmedGroupCode] = useState('');
  const [confirmedShipments, setConfirmedShipments] = useState<ShipmentRecord[]>([]);

  // Load QuoteRecord when initialQuoteRef is passed (e.g. from Retrieve a Quote -> Continue to Book)
  useEffect(() => {
    if (!initialQuoteRef) return;
    const match = quotes.find((q) => q.quoteRef.toUpperCase() === initialQuoteRef.toUpperCase());
    if (!match) return;
    setLoadedQuoteRef(match.quoteRef);
    setSenderName(match.contactName || '');
    setSenderPhone(match.contactPhone || '');
    setSenderEmail(match.contactEmail || '');
    if (match.senderState) setSenderState(match.senderState);
    if (match.senderCity) setSenderCity(match.senderCity);
    if (match.sharedCollectionAddress) setSharedCollectionAddress(match.sharedCollectionAddress);
    if (match.collectionMethod) setCollectionMethod(match.collectionMethod);
    if (match.items && match.items.length > 0) {
      const hydrated: DraftShipmentItem[] = match.items.map((it, idx) => ({
        id: it.id || `q_item_${idx + 1}`,
        originCountry: it.originCountry,
        originCity: it.originCity,
        destinationCountry: it.destinationCountry,
        destinationCity: it.destinationCity,
        recipientName: '',
        recipientPhone: '',
        recipientAddress: '',
        serviceTier: it.serviceTier,
        contentsDescription: it.contentsDescription,
        packageCount: it.packageCount,
        declaredWeightKg: it.declaredWeightKg,
        declaredDimensions: it.declaredDimensions || { length: 30, width: 25, height: 20 },
        declaredValueNgn: it.declaredValueNgn || 60000,
        isFragile: Boolean(it.isFragile),
        fragileHandlingNotes: it.fragileHandlingNotes || '',
        packagingPreset: 'custom',
      }));
      setItems(hydrated);
      const first = hydrated[0];
      setEditingItemId(first.id);
      setOriginCountry(first.originCountry);
      setOriginCity(first.originCity);
      setDestinationCountry(first.destinationCountry);
      setDestinationCity(first.destinationCity);
      setServiceTier(first.serviceTier);
      setContentsDescription(first.contentsDescription);
      setPackageCount(first.packageCount);
      setEstimatedWeightStr(String(first.declaredWeightKg));
      setDeclaredValueStr(String(first.declaredValueNgn));
      setIsFragile(first.isFragile);
      setFragileHandlingNotes(first.fragileHandlingNotes || '');
    }
    setStep(1);
  }, [initialQuoteRef]);

  // Persist unsubmitted draft state cleanly in localStorage
  useEffect(() => {
    if (step === 5) return;
    try {
      window.localStorage.setItem(
        BOOKING_DRAFT_STORAGE_KEY,
        JSON.stringify({
          step,
          senderName,
          senderPhone,
          senderEmail,
          senderState,
          senderCity,
          sharedCollectionAddress,
          items,
          collectionMethod,
          scheduledDate,
          scheduledSlot,
          fragileCareOptIn,
          exportSealOptIn,
          insuranceOptIn,
          loadedQuoteRef,
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [
    step,
    senderName,
    senderPhone,
    senderEmail,
    senderState,
    senderCity,
    sharedCollectionAddress,
    items,
    collectionMethod,
    scheduledDate,
    scheduledSlot,
    fragileCareOptIn,
    exportSealOptIn,
    insuranceOptIn,
    loadedQuoteRef,
  ]);

  const savedCustomerAddresses = addressBook.filter((a) => a.customerId === currentCustomer.id);

  const buildQuoteForItem = (it: DraftShipmentItem) =>
    generateQuoteBreakdown({
      destinationCountry: it.destinationCountry,
      actualWeightKg: Math.max(0.5, it.declaredWeightKg || 1),
      lengthCm: it.declaredDimensions?.length,
      widthCm: it.declaredDimensions?.width,
      heightCm: it.declaredDimensions?.height,
      tier: it.serviceTier,
      pickupRequired: collectionMethod !== 'dropoff',
    });

  const routeEval = evaluateRouteAvailability(originCountry, destinationCountry);
  const destConfig = SUPPORTED_DESTINATIONS[destinationCountry];
  const priorityRouteSupported = destConfig ? destConfig.prioritySupported : false;
  const prohibitedCheck = isProhibitedItem(contentsDescription);

  const currentEditorWeight = Math.max(0.5, parseFloat(estimatedWeightStr) || 1);
  const editorStandardQuote = generateQuoteBreakdown({
    destinationCountry,
    actualWeightKg: currentEditorWeight,
    lengthCm: showOptionalDimensions ? parseFloat(dimL) || 30 : 30,
    widthCm: showOptionalDimensions ? parseFloat(dimW) || 25 : 25,
    heightCm: showOptionalDimensions ? parseFloat(dimH) || 20 : 20,
    tier: 'standard',
    pickupRequired: collectionMethod !== 'dropoff',
  });
  const editorPriorityQuote = generateQuoteBreakdown({
    destinationCountry,
    actualWeightKg: currentEditorWeight,
    lengthCm: showOptionalDimensions ? parseFloat(dimL) || 30 : 30,
    widthCm: showOptionalDimensions ? parseFloat(dimW) || 25 : 25,
    heightCm: showOptionalDimensions ? parseFloat(dimH) || 20 : 20,
    tier: 'priority',
    pickupRequired: collectionMethod !== 'dropoff',
  });

  const editorQuoteCards: QuoteOptionDetailSpec[] = [
    {
      id: 'standard',
      badge: 'Standard Value',
      badgeTone: 'neutral',
      title: 'Standard Air Courier',
      subtitle: 'Consolidated air dispatch with free doorstep collection.',
      estimatedCostNgn: editorStandardQuote.totalAmount,
      deliveryWindow: editorStandardQuote.estimatedDeliveryDisplay,
      selected: serviceTier === 'standard',
      ctaLabel: 'Select Standard',
      includedItems: [
        'Free doorstep collection or Ikeja hub drop-off',
        'Certified digital scale & volumetric check',
        'Airport security screening & 7.5% statutory VAT',
      ],
      disclaimer:
        'Final quotation is issued after facility intake verification and requires your approval prior to settlement.',
    },
    {
      id: 'priority',
      badge: priorityRouteSupported ? 'Fastest Lane' : 'Unavailable',
      badgeTone: priorityRouteSupported ? 'cyan' : 'warning',
      title: 'Priority Air Express',
      subtitle: priorityRouteSupported
        ? 'Expedited counter tender on the next commercial flight.'
        : 'Priority service is not offered on this destination route.',
      estimatedCostNgn: editorPriorityQuote.totalAmount,
      deliveryWindow: priorityRouteSupported
        ? editorPriorityQuote.estimatedDeliveryDisplay
        : 'Standard Courier Only',
      selected: serviceTier === 'priority' && priorityRouteSupported,
      disabled: !priorityRouteSupported,
      disabledNote: 'Route supports Standard Air Courier only',
      ctaLabel: priorityRouteSupported ? 'Select Priority' : 'Unavailable',
      includedItems: [
        'Next-flight commercial airline tender from LOS/ABV',
        '12-hour scan freshness proactive alert SLA',
        'Priority intake queue and documentation screening',
      ],
      exclusions: [
        'Not a guaranteed next-day courier commitment; destination customs clearance varies.',
      ],
    },
  ];

  const handleSelectPackagingPreset = (presetId: string) => {
    setPackagingPreset(presetId);
    const preset = PACKAGING_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    if (preset.dims) {
      setDimL(String(preset.dims.length));
      setDimW(String(preset.dims.width));
      setDimH(String(preset.dims.height));
      setEstimatedWeightStr(String(preset.weightKg));
      setShowOptionalDimensions(false);
    } else {
      setShowOptionalDimensions(true);
    }
  };

  const loadEditorFromItem = (it: DraftShipmentItem) => {
    setEditingItemId(it.id);
    setOriginCountry(it.originCountry);
    setOriginCity(it.originCity);
    setDestinationCountry(it.destinationCountry);
    setDestinationCity(it.destinationCity);
    setRecipientName(it.recipientName);
    setRecipientPhone(it.recipientPhone);
    setRecipientAddress(it.recipientAddress);
    setServiceTier(it.serviceTier);
    setContentsDescription(it.contentsDescription);
    setPackageCount(it.packageCount);
    setPackagingPreset(it.packagingPreset || 'small_box');
    setEstimatedWeightStr(String(it.declaredWeightKg));
    if (it.declaredDimensions) {
      setDimL(String(it.declaredDimensions.length));
      setDimW(String(it.declaredDimensions.width));
      setDimH(String(it.declaredDimensions.height));
      setShowOptionalDimensions(it.packagingPreset === 'custom');
    } else {
      setShowOptionalDimensions(false);
    }
    setDeclaredValueStr(String(it.declaredValueNgn));
    setIsFragile(Boolean(it.isFragile));
    setFragileHandlingNotes(it.fragileHandlingNotes || '');
    setPhotoName(it.photoName);
    setUseDifferentPickupAddress(Boolean(it.collectionAddressOverride));
    setCollectionAddressOverride(it.collectionAddressOverride || '');
    setShowItemEditor(true);
    setValidationError(null);
  };

  const resetEditorForNewItem = () => {
    const newId = `draft_${Date.now()}`;
    setEditingItemId(newId);
    setOriginCountry('Nigeria');
    setOriginCity(senderCity || 'Lagos');
    setDestinationCountry('United States');
    setDestinationCity('Houston');
    setRecipientName('');
    setRecipientPhone('');
    setRecipientAddress('');
    setServiceTier('standard');
    setContentsDescription('');
    setPackageCount(1);
    setPackagingPreset('small_box');
    setEstimatedWeightStr('2.0');
    setShowOptionalDimensions(false);
    setDeclaredValueStr('60000');
    setIsFragile(false);
    setFragileHandlingNotes('');
    setPhotoName(undefined);
    setUseDifferentPickupAddress(false);
    setCollectionAddressOverride('');
    setShowItemEditor(true);
    setValidationError(null);
  };

  const handleClearEntireDraft = () => {
    try {
      window.localStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setLoadedQuoteRef(undefined);
    setSavedQteFeedback(null);
    setItems([]);
    resetEditorForNewItem();
    setStep(1);
    setValidationError(null);
  };

  const saveCurrentItemToList = (): DraftShipmentItem[] | null => {
    if (!routeEval.isConfirmed) {
      setValidationError(
        routeEval.message || `Route ${originCountry} → ${destinationCountry} requires desk confirmation.`
      );
      return null;
    }
    if (!contentsDescription.trim()) {
      setValidationError('Please enter a short description of the package contents.');
      return null;
    }
    if (prohibitedCheck.prohibited) {
      setValidationError(prohibitedCheck.reason || 'Prohibited contents detected.');
      return null;
    }
    if (!recipientName.trim() || !recipientPhone.trim() || !recipientAddress.trim()) {
      setValidationError('Please provide the recipient name, phone number, and delivery address.');
      return null;
    }

    const parsedWeight = Math.max(0.5, parseFloat(estimatedWeightStr) || 1);
    const effectiveTier: ServiceTier = priorityRouteSupported ? serviceTier : 'standard';

    const draftItem: DraftShipmentItem = {
      id: editingItemId,
      originCountry,
      originCity: originCity.trim() || 'Lagos',
      destinationCountry,
      destinationCity: destinationCity.trim() || 'London',
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      recipientAddress: recipientAddress.trim(),
      serviceTier: effectiveTier,
      contentsDescription: contentsDescription.trim(),
      packageCount: Math.max(1, packageCount || 1),
      declaredWeightKg: parsedWeight,
      declaredDimensions: {
        length: Math.max(1, parseFloat(dimL) || 30),
        width: Math.max(1, parseFloat(dimW) || 25),
        height: Math.max(1, parseFloat(dimH) || 20),
      },
      declaredValueNgn: Math.max(1000, parseFloat(declaredValueStr) || 50000),
      isFragile,
      fragileHandlingNotes: isFragile && fragileHandlingNotes.trim() ? fragileHandlingNotes.trim() : undefined,
      collectionAddressOverride:
        useDifferentPickupAddress && collectionAddressOverride.trim()
          ? collectionAddressOverride.trim()
          : undefined,
      photoName,
      packagingPreset,
    };

    const existingIdx = items.findIndex((x) => x.id === editingItemId);
    const nextList =
      existingIdx >= 0
        ? items.map((x, idx) => (idx === existingIdx ? draftItem : x))
        : [...items, draftItem];
    setItems(nextList);
    setValidationError(null);
    return nextList;
  };

  const handleStep1Next = () => {
    if (!senderName.trim() || !senderPhone.trim() || !sharedCollectionAddress.trim()) {
      setValidationError('Please fill in your sender name, phone number, and collection address.');
      return;
    }
    setValidationError(null);
    setStep(2);
  };

  const handleSaveItemAndStay = () => {
    const updated = saveCurrentItemToList();
    if (updated) {
      setShowItemEditor(false);
    }
  };

  const handleAddAnotherShipment = () => {
    if (showItemEditor) {
      const updated = saveCurrentItemToList();
      if (!updated) return;
    }
    resetEditorForNewItem();
  };

  const handleRemoveItem = (id: string) => {
    const filtered = items.filter((i) => i.id !== id);
    setItems(filtered);
    setValidationError(null);
    if (filtered.length === 0) {
      resetEditorForNewItem();
    } else if (editingItemId === id) {
      setShowItemEditor(false);
    }
  };

  const handleStep2Next = () => {
    if (showItemEditor) {
      const updated = saveCurrentItemToList();
      if (!updated) return;
      setShowItemEditor(false);
    } else if (items.length === 0) {
      setValidationError('Add at least one shipment package before continuing.');
      setShowItemEditor(true);
      return;
    }
    setValidationError(null);
    setStep(3);
  };

  // Collection Evaluation for Step 3
  const activeDispatchLoad = pickupJobs.filter(
    (j) => j.status === 'booking_received' || j.status === 'scheduled'
  ).length;
  const totalEstimatedWeightKg = items.reduce((sum, i) => sum + i.declaredWeightKg, 0);
  const collectionEval = evaluateCollectionOptions({
    state: senderState,
    city: senderCity,
    activeDispatchLoad,
    branches,
    shipmentCount: items.length,
    totalEstimatedWeightKg,
  });

  const activeCollectionOption =
    collectionMethod === 'priority_pickup' && !collectionEval.priorityPickup.available
      ? collectionEval.standardPickup.available
        ? 'standard_pickup'
        : 'dropoff'
      : collectionMethod === 'standard_pickup' && !collectionEval.standardPickup.available
      ? 'dropoff'
      : collectionMethod;

  const activePickupFeeNgn =
    activeCollectionOption === 'priority_pickup' ? collectionEval.priorityPickup.feeNgn : 0;

  const hasSplitPickupAddresses = items.some(
    (i) =>
      i.collectionAddressOverride &&
      i.collectionAddressOverride.trim().toLowerCase() !==
        sharedCollectionAddress.trim().toLowerCase()
  );

  const handleStep3Next = () => {
    if (activeCollectionOption === 'dropoff' && !selectedBranchId) {
      setValidationError('Please select a drop-off branch location.');
      return;
    }
    setCollectionMethod(activeCollectionOption);
    setValidationError(null);
    setStep(4);
  };

  const itemQuotes = items.map((it) => ({
    item: it,
    quote: buildQuoteForItem(it),
  }));
  const insuranceAvailable = isShippingInsuranceAvailable(adminFeatureFlags);
  const totalDeclaredValueNgn = items.reduce((sum, x) => sum + (x.declaredValueNgn || 0), 0);
  const dynamicInsuranceFee = insuranceAvailable
    ? calculateAdminGatedInsurancePremium({
        declaredValueNgn: totalDeclaredValueNgn,
        flags: adminFeatureFlags,
      }).premiumNgn
    : 0;
  const optionalServicesFee =
    (fragileCareOptIn ? 3500 : 0) +
    (exportSealOptIn ? 4500 : 0) +
    (insuranceAvailable && insuranceOptIn ? dynamicInsuranceFee : 0);
  const subtotalBeforePromo =
    itemQuotes.reduce((sum, x) => sum + x.quote.totalAmount, 0) +
    activePickupFeeNgn +
    optionalServicesFee;
  const groupEstimatedTotal = Math.max(0, subtotalBeforePromo - promoDiscountNgn);

  const handleApplyPromo = () => {
    if (!promoCodeInput.trim()) return;
    const res = validatePromoCode(promoCodeInput.trim(), subtotalBeforePromo);
    if (res.valid) {
      setPromoDiscountNgn(res.discountNgn);
      setPromoMessage(`Applied ${promoCodeInput.trim().toUpperCase()} (-${formatNaira(res.discountNgn)})`);
    } else {
      setPromoDiscountNgn(0);
      setPromoMessage(res.message);
    }
  };

  const handleSaveAsQuoteOnly = () => {
    let workingItems = items;
    if (step === 2 && showItemEditor) {
      const saved = saveCurrentItemToList();
      if (!saved) return;
      workingItems = saved;
    }
    if (workingItems.length === 0) {
      setValidationError('Add at least one parcel estimate before saving a quote.');
      return;
    }
    if (!senderName.trim() || (!senderEmail.trim() && !senderPhone.trim())) {
      setValidationError('Enter Sender Name and Email/Phone in Step 1 to receive a retrievable QTE reference.');
      setStep(1);
      return;
    }
    const createdQuote = saveGuestQuote({
      type: 'instant_estimate',
      contactName: senderName.trim(),
      contactEmail: senderEmail.trim() || undefined,
      contactPhone: senderPhone.trim() || undefined,
      senderState,
      senderCity,
      sharedCollectionAddress: sharedCollectionAddress.trim(),
      collectionMethod: activeCollectionOption,
      items: workingItems.map((it) => ({
        id: it.id,
        originCountry: it.originCountry,
        originCity: it.originCity,
        destinationCountry: it.destinationCountry,
        destinationCity: it.destinationCity,
        serviceTier: it.serviceTier,
        contentsDescription: it.contentsDescription,
        packageCount: it.packageCount,
        declaredWeightKg: it.declaredWeightKg,
        declaredDimensions: it.declaredDimensions,
        declaredValueNgn: it.declaredValueNgn,
        isFragile: it.isFragile,
        fragileHandlingNotes: it.fragileHandlingNotes,
      })),
      quoteBreakdown: buildQuoteForItem(workingItems[0]),
      totalEstimatedNgn: groupEstimatedTotal,
      enquiryNotes: `Saved from Booking Wizard (${workingItems.length} item${workingItems.length > 1 ? 's' : ''})`,
    });
    setSavedQteFeedback(createdQuote);
    setValidationError(null);
  };

  const executeBookingSubmit = () => {
    const { group, shipments: created } = createBookingGroup({
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderEmail: senderEmail.trim() || undefined,
      sharedCollectionAddress: sharedCollectionAddress.trim(),
      collectionMethod: activeCollectionOption,
      collectionBranchId: activeCollectionOption === 'dropoff' ? selectedBranchId : undefined,
      scheduledDate: activeCollectionOption === 'standard_pickup' ? scheduledDate : undefined,
      scheduledSlot: activeCollectionOption === 'standard_pickup' ? scheduledSlot : undefined,
      pickupFeeNgn: activePickupFeeNgn,
      priorityWindow:
        activeCollectionOption === 'priority_pickup'
          ? collectionEval.priorityPickup.estimatedWindow
          : undefined,
      sourceQuoteRef: loadedQuoteRef,
      items: itemQuotes.map(({ item, quote }) => ({
        originCountry: item.originCountry,
        originCity: item.originCity,
        destinationCountry: item.destinationCountry,
        destinationCity: item.destinationCity,
        recipientName: item.recipientName,
        recipientPhone: item.recipientPhone,
        recipientAddress: item.recipientAddress,
        serviceTier: item.serviceTier,
        contentsDescription: item.contentsDescription,
        packageCount: item.packageCount,
        declaredWeightKg: item.declaredWeightKg,
        declaredDimensions: item.declaredDimensions,
        declaredValueNgn: item.declaredValueNgn,
        isFragile: item.isFragile,
        fragileHandlingNotes: item.fragileHandlingNotes,
        collectionAddressOverride: item.collectionAddressOverride,
        quote,
      })),
    });

    try {
      window.localStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setConfirmedGroupCode(group.groupCode);
    setConfirmedShipments(created);
    if (created[0]) {
      setSelectedShipmentForTracking(created[0].trackingNumber);
    }
    setStep(5);
  };

  const handleFinalSubmit = () => {
    if (!termsAgreed || !prohibitedDeclared) {
      setValidationError('Please review and check both required declarations before booking.');
      return;
    }
    setValidationError(null);

    // Journey B: If user is still a guest/visitor, trigger inline Login/Signup modal WITHOUT losing any entered form fields
    if (role === 'visitor') {
      setInlineAuthError(null);
      setInlineAuthOpen(true);
      return;
    }

    executeBookingSubmit();
  };

  return (
    <div className="sv-card overflow-hidden text-[#1F2937] dark:text-slate-100 transition-colors duration-200">
      {/* Progress Header */}
      {step <= 4 && (
        <div className="px-5 sm:px-6 py-4 border-b border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="sv-h2">
                Book Shipment{items.length > 1 ? `s (${items.length} in Group)` : ''}
              </h1>
              {loadedQuoteRef && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] tabular-nums">
                  From {loadedQuoteRef}
                </span>
              )}
            </div>
            <p className="text-[13px] font-medium text-[#4B5563] dark:text-slate-400">
              Step {step} of 4 ·{' '}
              {step === 1
                ? 'Sender & Collection Location'
                : step === 2
                ? 'Package Specs, Destinations & Options'
                : step === 3
                ? 'Collection / Drop-off Option'
                : 'Optional Services & Booking Summary'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[
                { num: 1, label: 'Sender' },
                { num: 2, label: 'Shipments' },
                { num: 3, label: 'Collection' },
                { num: 4, label: 'Review' },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-1.5 text-[12px] font-semibold">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold tabular-nums ${
                      step === s.num
                        ? 'bg-[#00B4D8] text-white'
                        : step > s.num
                        ? 'bg-[#247347] text-white'
                        : 'bg-[#E2E8F0] dark:bg-slate-700 text-[#4B5563] dark:text-slate-400'
                    }`}
                  >
                    {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </span>
                  <span
                    className={`hidden sm:inline ${
                      step === s.num
                        ? 'text-[#111827] dark:text-white font-bold'
                        : 'text-[#4B5563] dark:text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                  {s.num < 4 && <span className="text-[#CBD5E1] dark:text-slate-700">›</span>}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleClearEntireDraft}
              className="px-3 py-1.5 rounded-full border border-[#CBD5E1] dark:border-slate-700 text-[12px] font-semibold text-[#4B5563] dark:text-slate-300 hover:border-rose-400 hover:text-[#B42318] flex items-center gap-1 cursor-pointer"
              title="Clear draft and start over"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Draft</span>
            </button>
          </div>
        </div>
      )}

      {savedQteFeedback && step <= 4 && (
        <div className="m-5 mb-0 p-4 rounded-[12px] bg-[#CAF0F8]/70 dark:bg-sky-950/50 border border-[#90E0EF] dark:border-sky-800 text-[#0F172A] dark:text-sky-200 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5 text-[13px]">
            <div className="font-bold flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-[#00B4D8]" />
              <span>Quote Saved Only — Reference: <strong className="tabular-nums">{savedQteFeedback.quoteRef}</strong></span>
            </div>
            <p className="text-[12px] text-[#4B5563] dark:text-slate-300">
              No customer account, pickup dispatch, or confirmed SWV shipment was created. Retrieve anytime via “Retrieve Quote”.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSavedQteFeedback(null)}
            className="text-[12px] font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {validationError && (
        <div className="m-5 mb-0 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-[10px] text-[13px] font-medium text-[#B42318] dark:text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 1: SENDER & COLLECTION LOCATION */}
      {step === 1 && (
        <div className="p-5 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="wizard-sender-name"
                  className="text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300"
                >
                  Sender Full Name <span className="text-[#B42318]">*</span>
                </label>
                {senderName.trim().length > 2 && (
                  <Check className="w-3.5 h-3.5 text-[#247347] stroke-[2.5]" />
                )}
              </div>
              <input
                id="wizard-sender-name"
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Full name or business name"
                className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                  Sender Phone Number <span className="text-[#B42318]">*</span>
                </label>
                {senderPhone.trim().length > 6 && (
                  <Check className="w-3.5 h-3.5 text-[#247347] stroke-[2.5]" />
                )}
              </div>
              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="+234 803 555 0192"
                className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white tabular-nums"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                Sender Email Address (For QTE quotes &amp; receipts)
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="you@example.com"
                className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                Collection State / Region <span className="text-[#B42318]">*</span>
              </label>
              <select
                value={senderState}
                onChange={(e) => setSenderState(e.target.value)}
                className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
              >
                {NIGERIA_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                City / Zone
              </label>
              <input
                type="text"
                value={senderCity}
                onChange={(e) => setSenderCity(e.target.value)}
                placeholder="e.g. Lekki, Ikeja, Wuse II"
                className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                  Default Collection Address (Nigeria) <span className="text-[#B42318]">*</span>
                </label>
                {sharedCollectionAddress.trim().length > 5 && (
                  <Check className="w-3.5 h-3.5 text-[#247347] stroke-[2.5]" />
                )}
              </div>
              <input
                type="text"
                value={sharedCollectionAddress}
                onChange={(e) => setSharedCollectionAddress(e.target.value)}
                placeholder="House/Plot number, street name, estate, landmark"
                className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white"
              />
              <p className="text-[12px] font-medium text-[#4B5563] dark:text-slate-400">
                Multiple shipments from this address are grouped into 1 unified collection job.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-700 flex justify-end">
            <button
              type="button"
              onClick={handleStep1Next}
              className="min-h-[46px] px-7 py-2.5 text-[15px] font-bold tracking-[0.01em] text-white bg-[#00B4D8] hover:bg-[#0096C7] rounded-full transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Shipments</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SHIPMENTS LIST & MULTI-SHIPMENT BUILDER */}
      {step === 2 && (
        <div className="p-5 sm:p-8 space-y-6">
          {/* Existing Shipments in Group */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00B4D8]" />
                <h2 className="sv-h3">Shipments in This Booking ({items.length})</h2>
              </div>
              <button
                type="button"
                onClick={handleAddAnotherShipment}
                className="min-h-[38px] px-4 py-1.5 rounded-full text-[13px] font-bold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950 border border-[#90E0EF] dark:border-sky-800 hover:bg-[#90E0EF]/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add another shipment</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((it, idx) => {
                const q = buildQuoteForItem(it);
                const isEditing = showItemEditor && editingItemId === it.id;
                return (
                  <div
                    key={it.id}
                    className={`p-4 rounded-[12px] border flex flex-wrap items-center justify-between gap-3 ${
                      isEditing
                        ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/30 dark:bg-sky-950/30'
                        : 'border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[14px] text-[#111827] dark:text-white tabular-nums">
                          Shipment #{idx + 1}
                        </span>
                        <span className="text-[14px] text-[#1F2937] dark:text-slate-300 font-semibold">
                          {it.originCity} → {it.destinationCity}, {it.destinationCountry}
                        </span>
                        <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-600 capitalize">
                          {it.serviceTier}
                        </span>
                        {it.isFragile && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            Fragile
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#4B5563] dark:text-slate-400 truncate">
                        To: {it.recipientName || 'Recipient pending'} · {it.contentsDescription || 'Contents pending'} · {it.declaredWeightKg} kg
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[15px] font-bold text-[#0F172A] dark:text-[#90E0EF] tabular-nums">
                        {formatNaira(q.totalAmount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => loadEditorFromItem(it)}
                        className="p-2 rounded-full border border-[#CBD5E1] dark:border-slate-700 text-[#1F2937] dark:text-slate-300 hover:border-[#00B4D8] cursor-pointer"
                        title="Edit shipment"
                        aria-label={`Edit shipment ${idx + 1}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="p-2 rounded-full border border-rose-200 dark:border-rose-900 text-[#B42318] dark:text-rose-400 hover:bg-rose-50 cursor-pointer"
                        title="Remove package from draft"
                        aria-label={`Remove shipment ${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Item Editor Panel */}
          {showItemEditor && (
            <div className="p-5 sm:p-6 rounded-[12px] border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-700">
                <h3 className="sv-h3">Configure Shipment Details</h3>
                {items.some((x) => x.id === editingItemId) && (
                  <button
                    type="button"
                    onClick={handleSaveItemAndStay}
                    className="text-[13px] font-bold text-[#0096C7] hover:underline cursor-pointer"
                  >
                    Save Item
                  </button>
                )}
              </div>

              {savedCustomerAddresses.length > 0 && (
                <div className="p-4 rounded-[10px] bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[#4B5563] dark:text-slate-400 block">
                    Quick-Fill Recipient from Saved Address Book
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {savedCustomerAddresses.slice(0, 4).map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setRecipientName(addr.recipientName);
                          setRecipientPhone(addr.recipientPhone);
                          setDestinationCountry(addr.destinationCountry);
                          setDestinationCity(addr.destinationCity);
                          setRecipientAddress(addr.recipientAddress);
                          if (SUPPORTED_DESTINATIONS[addr.destinationCountry]?.prioritySupported === false) {
                            setServiceTier('standard');
                          }
                        }}
                        className="text-[13px] px-3.5 py-1.5 rounded-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 hover:border-[#00B4D8] text-[#111827] dark:text-slate-200 font-medium cursor-pointer"
                      >
                        {addr.label} ({addr.destinationCity})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Route & Recipient Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                    Origin Country <span className="text-[#B42318]">*</span>
                  </label>
                  <select
                    value={originCountry}
                    onChange={(e) => setOriginCountry(e.target.value)}
                    className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                  >
                    {SUPPORTED_ORIGINS.map((o) => (
                      <option key={o.code} value={o.country}>
                        {o.country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                    Destination Country <span className="text-[#B42318]">*</span>
                  </label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => {
                      const nextCountry = e.target.value;
                      setDestinationCountry(nextCountry);
                      if (SUPPORTED_DESTINATIONS[nextCountry]?.prioritySupported === false) {
                        setServiceTier('standard');
                      }
                    }}
                    className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                  >
                    {Object.keys(SUPPORTED_DESTINATIONS).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                    Destination City
                  </label>
                  <input
                    type="text"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    placeholder="e.g. London, Toronto, Houston"
                    className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                      Recipient Full Name <span className="text-[#B42318]">*</span>
                    </label>
                    {recipientName.trim().length > 2 && (
                      <Check className="w-3.5 h-3.5 text-[#247347] stroke-[2.5]" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Receiver full name"
                    className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                      Recipient Phone <span className="text-[#B42318]">*</span>
                    </label>
                    {recipientPhone.trim().length > 6 && (
                      <Check className="w-3.5 h-3.5 text-[#247347] stroke-[2.5]" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+44 20 ..."
                    className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                      Recipient Delivery Address <span className="text-[#B42318]">*</span>
                    </label>
                    {recipientAddress.trim().length > 6 && (
                      <Check className="w-3.5 h-3.5 text-[#247347] stroke-[2.5]" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Street, apartment, city, postcode"
                    className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                  />
                </div>
              </div>

              {/* Selectable Package / Packaging Cards with Top-Right Checkmark */}
              <div className="space-y-2.5">
                <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                  Packaging Format <span className="text-[#B42318]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PACKAGING_PRESETS.map((preset) => (
                    <PackageSelectorCard
                      key={preset.id}
                      title={preset.title}
                      dimensionsLabel={preset.dimensions}
                      maxWeightLabel={preset.maxWeight}
                      selected={packagingPreset === preset.id}
                      onSelect={() => handleSelectPackagingPreset(preset.id)}
                      icon={
                        preset.id === 'envelope' ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <Box className="w-5 h-5" />
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Weight, Quantity Stepper & Declared Value */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                      Package Contents Description <span className="text-[#B42318]">*</span>
                    </label>
                    {contentsDescription.trim().length > 3 && !prohibitedCheck.prohibited && (
                      <Check className="w-3.5 h-3.5 text-[#247347] stroke-[2.5]" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={contentsDescription}
                    onChange={(e) => setContentsDescription(e.target.value)}
                    placeholder="e.g. 3 boxes of African fabrics, books, documents"
                    className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                  />
                  {prohibitedCheck.prohibited && (
                    <p className="text-[12px] text-[#B42318] dark:text-rose-400 font-semibold">
                      {prohibitedCheck.reason}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <QuantityStepper
                    label="Package Quantity"
                    value={packageCount}
                    min={1}
                    max={25}
                    onChange={setPackageCount}
                    required
                  />

                  <UnitSuffixInput
                    label="Est. Weight (Optional)"
                    unit="kg"
                    min="0.5"
                    step="0.5"
                    isValid={parseFloat(estimatedWeightStr) >= 0.5}
                    value={estimatedWeightStr}
                    onChange={setEstimatedWeightStr}
                  />

                  <UnitSuffixInput
                    label="Est. Contents Value"
                    unit="NGN"
                    min="1000"
                    step="1000"
                    isValid={parseFloat(declaredValueStr) >= 1000}
                    value={declaredValueStr}
                    onChange={setDeclaredValueStr}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowOptionalDimensions(!showOptionalDimensions)}
                    className="text-[13px] font-bold text-[#0096C7] hover:underline cursor-pointer"
                  >
                    {showOptionalDimensions ? '− Hide dimensions' : '+ Edit parcel dimensions (cm)'}
                  </button>

                  <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0F172A] dark:text-[#90E0EF] cursor-pointer">
                    <Upload className="w-4 h-4 text-[#00B4D8]" />
                    <span>{photoName ? `Photo: ${photoName}` : 'Attach Package Photo (Optional)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setPhotoName(f.name);
                      }}
                    />
                  </label>
                </div>

                {showOptionalDimensions && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <UnitSuffixInput
                      label="Length"
                      unit="cm"
                      min="1"
                      step="1"
                      value={dimL}
                      onChange={setDimL}
                    />
                    <UnitSuffixInput
                      label="Width"
                      unit="cm"
                      min="1"
                      step="1"
                      value={dimW}
                      onChange={setDimW}
                    />
                    <UnitSuffixInput
                      label="Height"
                      unit="cm"
                      min="1"
                      step="1"
                      value={dimH}
                      onChange={setDimH}
                    />
                  </div>
                )}

                {/* Per-Package Fragile Declaration + Handling Notes */}
                <div className="p-4 rounded-[10px] bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="text-[13px] font-bold text-[#111827] dark:text-white block">
                          Is this package fragile?
                        </span>
                        <span className="text-[12px] text-[#4B5563] dark:text-slate-400">
                          Visible immediately to pickup riders and Lagos intake scale staff.
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex rounded-full border border-[#CBD5E1] dark:border-slate-600 overflow-hidden bg-[#F8FAFC] dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => setIsFragile(false)}
                        className={`px-4 py-1.5 text-[12px] font-bold cursor-pointer ${
                          !isFragile
                            ? 'bg-[#00B4D8] text-white'
                            : 'text-[#4B5563] dark:text-slate-300'
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFragile(true)}
                        className={`px-4 py-1.5 text-[12px] font-bold cursor-pointer ${
                          isFragile
                            ? 'bg-amber-600 text-white'
                            : 'text-[#4B5563] dark:text-slate-300'
                        }`}
                      >
                        Yes (Fragile)
                      </button>
                    </div>
                  </div>
                  {isFragile && (
                    <input
                      type="text"
                      value={fragileHandlingNotes}
                      onChange={(e) => setFragileHandlingNotes(e.target.value)}
                      placeholder="Optional fragile handling notes (e.g. Glass bottles — keep upright, do not stack)"
                      className="sv-input w-full min-h-[40px] px-3 py-2 text-[13px] rounded-[8px] border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 text-[#111827] dark:text-white"
                    />
                  )}
                </div>

                {items.length > 1 && (
                  <div className="pt-2 space-y-2">
                    <label className="flex items-center gap-2 text-[13px] font-medium text-[#1F2937] dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useDifferentPickupAddress}
                        onChange={(e) => setUseDifferentPickupAddress(e.target.checked)}
                        className="rounded text-[#00B4D8]"
                      />
                      <span>Collect this specific shipment from a different address</span>
                    </label>
                    {useDifferentPickupAddress && (
                      <input
                        type="text"
                        value={collectionAddressOverride}
                        onChange={(e) => setCollectionAddressOverride(e.target.value)}
                        placeholder="Enter separate pickup street address for this shipment"
                        className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* DHL-Benchmark Shipping Option Cards */}
              <div className="space-y-3 pt-2 border-t border-[#E2E8F0] dark:border-slate-700">
                <h3 className="sv-h3">Available Shipping Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editorQuoteCards.map((opt) => (
                    <QuoteOptionCard
                      key={opt.id}
                      option={opt}
                      onSelect={() => {
                        if (!opt.disabled) setServiceTier(opt.id as ServiceTier);
                      }}
                      onViewDetails={(spec) => setDetailModalOption(spec)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-[44px] px-5 py-2 rounded-full border border-[#CBD5E1] dark:border-slate-700 text-[14px] font-bold text-[#1F2937] dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sender</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveAsQuoteOnly}
                className="min-h-[44px] px-5 py-2 rounded-full border border-[#00B4D8] bg-[#CAF0F8]/60 dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] hover:bg-[#90E0EF]/50 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4 text-[#00B4D8]" />
                <span>Save as Quote Only (QTE)</span>
              </button>

              <button
                type="button"
                onClick={handleStep2Next}
                className="min-h-[46px] px-7 py-2.5 text-[15px] font-bold tracking-[0.01em] text-white bg-[#00B4D8] hover:bg-[#0096C7] rounded-full transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Choose Collection Option</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: EXPLICIT 3 COLLECTION OPTIONS */}
      {step === 3 && (
        <div className="p-5 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="sv-h2">
              Select How We Collect Your Shipment{items.length > 1 ? 's' : ''} ({senderState})
            </h2>
            <p className="text-[14px] text-[#4B5563] dark:text-slate-400">
              {hasSplitPickupAddresses
                ? 'Shipments have different collection addresses, so separate pickup jobs will be dispatched.'
                : `All ${items.length} shipment${items.length > 1 ? 's share' : ' uses'} 1 single collection location (${sharedCollectionAddress}).`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option 1: Standard Pickup */}
            <button
              type="button"
              disabled={!collectionEval.standardPickup.available}
              onClick={() => setCollectionMethod('standard_pickup')}
              className={`relative p-5 rounded-[12px] text-left flex flex-col justify-between transition-all cursor-pointer ${
                !collectionEval.standardPickup.available
                  ? 'opacity-60 cursor-not-allowed border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                  : activeCollectionOption === 'standard_pickup'
                  ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/35 dark:bg-sky-950/30'
                  : 'border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#90E0EF]'
              }`}
            >
              {activeCollectionOption === 'standard_pickup' && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00B4D8] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <div className="space-y-2.5 pr-6">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-[#247347] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Free (₦0)
                </span>
                <div className="text-[16px] font-bold text-[#111827] dark:text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#00B4D8]" />
                  <span>Standard Pickup</span>
                </div>
                <p className="text-[13px] text-[#4B5563] dark:text-slate-400 leading-[1.45]">
                  {collectionEval.standardPickup.available
                    ? collectionEval.standardPickup.estimatedWindow
                    : collectionEval.standardPickup.unavailableReason}
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E2E8F0] dark:border-slate-700 text-[12px] font-semibold text-[#0F172A] dark:text-[#90E0EF]">
                {collectionEval.standardPickup.available ? 'Target: Within 24h' : 'Use Drop-off below'}
              </div>
            </button>

            {/* Option 2: Priority Pickup */}
            <button
              type="button"
              disabled={!collectionEval.priorityPickup.available}
              onClick={() => setCollectionMethod('priority_pickup')}
              className={`relative p-5 rounded-[12px] text-left flex flex-col justify-between transition-all cursor-pointer ${
                !collectionEval.priorityPickup.available
                  ? 'opacity-65 cursor-not-allowed border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                  : activeCollectionOption === 'priority_pickup'
                  ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/35 dark:bg-sky-950/30'
                  : 'border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#90E0EF]'
              }`}
            >
              {activeCollectionOption === 'priority_pickup' && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00B4D8] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <div className="space-y-2.5 pr-6">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-medium tabular-nums ${
                    collectionEval.priorityPickup.available
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {collectionEval.priorityPickup.available
                    ? formatNaira(collectionEval.priorityPickup.feeNgn)
                    : 'Unavailable'}
                </span>
                <div className="text-[16px] font-bold text-[#111827] dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Priority Pickup</span>
                </div>
                <p className="text-[13px] text-[#4B5563] dark:text-slate-400 leading-[1.45]">
                  {collectionEval.priorityPickup.available
                    ? collectionEval.priorityPickup.estimatedWindow
                    : collectionEval.priorityPickup.unavailableReason}
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E2E8F0] dark:border-slate-700 text-[12px] font-semibold text-[#986B16] dark:text-amber-400">
                {collectionEval.priorityPickup.available
                  ? 'Est. 1 – 6 hours (Dynamic Fee)'
                  : collectionEval.priorityPickup.fallbackSuggestion}
              </div>
            </button>

            {/* Option 3: Drop-off */}
            <button
              type="button"
              disabled={!collectionEval.dropoff.available}
              onClick={() => setCollectionMethod('dropoff')}
              className={`relative p-5 rounded-[12px] text-left flex flex-col justify-between transition-all cursor-pointer ${
                activeCollectionOption === 'dropoff'
                  ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/35 dark:bg-sky-950/30'
                  : 'border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#90E0EF]'
              }`}
            >
              {activeCollectionOption === 'dropoff' && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00B4D8] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <div className="space-y-2.5 pr-6">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800">
                  Free ({collectionEval.dropoff.branches.length} Hubs)
                </span>
                <div className="text-[16px] font-bold text-[#111827] dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#00B4D8]" />
                  <span>Drop-off at Hub</span>
                </div>
                <p className="text-[13px] text-[#4B5563] dark:text-slate-400 leading-[1.45]">
                  Hand over directly at a verified Swiftvero branch counter for immediate certified scale verification.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E2E8F0] dark:border-slate-700 text-[12px] font-semibold text-[#0F172A] dark:text-[#90E0EF]">
                Instant intake check-in
              </div>
            </button>
          </div>

          {activeCollectionOption === 'standard_pickup' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-700">
              <div className="space-y-1">
                <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                  Preferred Pickup Date <span className="text-[#B42318]">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12px] sm:text-[13px] font-medium text-[#4B5563] dark:text-slate-300">
                  Preferred Time Window <span className="text-[#B42318]">*</span>
                </label>
                <select
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                >
                  <option>10:00 AM - 1:00 PM</option>
                  <option>1:00 PM - 5:00 PM</option>
                  <option>Within 24 Hours (Flexible)</option>
                </select>
              </div>
            </div>
          )}

          {activeCollectionOption === 'dropoff' && (
            <div className="space-y-3">
              <span className="text-[13px] font-bold text-[#111827] dark:text-white block">
                Select Active Swiftvero Drop-off Hub:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {collectionEval.dropoff.branches.map((br) => (
                  <label
                    key={br.id}
                    className={`p-4 rounded-[12px] border cursor-pointer space-y-1.5 transition-all ${
                      selectedBranchId === br.id
                        ? 'border-2 border-[#00B4D8] bg-[#CAF0F8]/35 dark:bg-sky-950/30'
                        : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-bold text-[#111827] dark:text-white">
                        {br.name}
                      </span>
                      <input
                        type="radio"
                        name="dropoffBranch"
                        checked={selectedBranchId === br.id}
                        onChange={() => setSelectedBranchId(br.id)}
                        className="text-[#00B4D8]"
                      />
                    </div>
                    <p className="text-[13px] text-[#4B5563] dark:text-slate-300">{br.address}</p>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#0F172A] dark:text-[#90E0EF] font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                      <span>{br.operatingHours || 'Mon–Sat 08:00 AM – 06:00 PM'}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-700 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[44px] px-5 py-2 rounded-full border border-[#CBD5E1] dark:border-slate-700 text-[14px] font-bold text-[#1F2937] dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Shipments</span>
            </button>

            <button
              type="button"
              onClick={handleStep3Next}
              className="min-h-[46px] px-7 py-2.5 text-[15px] font-bold tracking-[0.01em] text-white bg-[#00B4D8] hover:bg-[#0096C7] rounded-full transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Review Booking Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: OPTIONAL SERVICES, STICKY PAYMENT SUMMARY & LEGAL ACCEPTANCE */}
      {step === 4 && (
        <div className="p-5 sm:p-8 space-y-6">
          <div className="space-y-3">
            <h2 className="sv-h2">Optional Services</h2>
            <OptionalServiceAccordion
              title="Fragile Handling & Cushioning Liner"
              priceLabel="+₦3,500"
              description="Adds foam cushioning and priority upright handling during consolidation."
              checked={fragileCareOptIn}
              onToggle={setFragileCareOptIn}
            />
            <OptionalServiceAccordion
              title="Export Moisture Seal & Carton Strapping"
              priceLabel="+₦4,500"
              description="Protective shrink-wrap and reinforced corner strapping for air freight."
              checked={exportSealOptIn}
              onToggle={setExportSealOptIn}
            />
            {insuranceAvailable && (
              <OptionalServiceAccordion
                title={`Shipping Insurance (${adminFeatureFlags.insurerName || 'Authorized Coverage'})`}
                priceLabel={`+${formatNaira(dynamicInsuranceFee)}`}
                description={`Covers ${formatNaira(totalDeclaredValueNgn)} declared contents value at ${adminFeatureFlags.insurerRatePercentage}% underwriter rate.`}
                checked={insuranceOptIn}
                onToggle={setInsuranceOptIn}
              />
            )}
          </div>

          {/* Unpreselected Legal Checkboxes */}
          <div className="p-5 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-700 space-y-3">
            <h3 className="sv-h3">Required Acknowledgements</h3>
            <label className="flex items-start gap-2.5 text-[14px] text-[#1F2937] dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-[#CBD5E1] text-[#00B4D8]"
              />
              <span>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => onOpenPolicy('terms')}
                  className="text-[#0096C7] underline font-semibold"
                >
                  Shipping Terms
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => onOpenPolicy('pricing')}
                  className="text-[#0096C7] underline font-semibold"
                >
                  Pricing Policy
                </button>
                , and{' '}
                <button
                  type="button"
                  onClick={() => onOpenPolicy('cancellation')}
                  className="text-[#0096C7] underline font-semibold"
                >
                  Cancellation Policy
                </button>
                .
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-[14px] text-[#1F2937] dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={prohibitedDeclared}
                onChange={(e) => setProhibitedDeclared(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-[#CBD5E1] text-[#00B4D8]"
              />
              <span>
                I declare that none of the shipments contain dangerous or{' '}
                <button
                  type="button"
                  onClick={() => onOpenPolicy('prohibited')}
                  className="text-[#0096C7] underline font-semibold"
                >
                  prohibited aviation goods
                </button>
                .
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveAsQuoteOnly}
              className="min-h-[40px] px-5 py-2 rounded-full border border-[#00B4D8] bg-[#CAF0F8]/60 dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] hover:bg-[#90E0EF]/50 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4 text-[#00B4D8]" />
              <span>Save Estimate as Quote Only (No Shipment Created)</span>
            </button>
          </div>

          {/* Collapsible #CAF0F8 Payment Summary Drawer */}
          <StickyPaymentSummaryDrawer
            title="*Price Breakdown & Booking Summary"
            itemCountLabel={`${items.length} Shipment${items.length > 1 ? 's' : ''}`}
            totalDisplay={`${formatNaira(groupEstimatedTotal)}*`}
            lineItems={[
              ...itemQuotes.map(({ item, quote }, idx) => ({
                label: `#${idx + 1} ${item.originCity} → ${item.destinationCity} (${item.declaredWeightKg} kg, ${item.packageCount} pkg${item.isFragile ? ' · Fragile' : ''})`,
                value: formatNaira(quote.totalAmount),
              })),
              ...(activePickupFeeNgn > 0
                ? [{ label: 'Priority Pickup Dispatch (1–6h)', value: formatNaira(activePickupFeeNgn) }]
                : [{ label: 'Collection Option', value: activeCollectionOption === 'dropoff' ? 'Hub Drop-off (Free)' : 'Standard Pickup (Free)' }]),
              ...(fragileCareOptIn
                ? [{ label: 'Fragile Handling Cushioning', value: formatNaira(3500) }]
                : []),
              ...(exportSealOptIn
                ? [{ label: 'Export Moisture Seal', value: formatNaira(4500) }]
                : []),
              ...(insuranceAvailable && insuranceOptIn
                ? [{ label: 'Shipping Insurance', value: formatNaira(dynamicInsuranceFee) }]
                : []),
              ...(promoDiscountNgn > 0
                ? [{ label: 'Promo Discount', value: `-${formatNaira(promoDiscountNgn)}`, tone: 'discount' as const }]
                : []),
              {
                label: 'Estimated Gross Total*',
                value: `${formatNaira(groupEstimatedTotal)}*`,
                tone: 'total',
              },
            ]}
            promoInput={promoCodeInput}
            onPromoInputChange={setPromoCodeInput}
            onApplyPromo={handleApplyPromo}
            promoMessage={promoMessage}
            onCancel={() => setStep(3)}
            cancelLabel="Back"
            onNext={handleFinalSubmit}
            nextLabel={role === 'visitor' ? 'Sign In & Confirm Booking' : 'Confirm & Book'}
            nextDisabled={!termsAgreed || !prohibitedDeclared}
          />
        </div>
      )}

      {/* STEP 5: CONFIRMED */}
      {step === 5 && (
        <div className="p-6 sm:p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#247347] dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="sv-h2">
              {confirmedShipments.length > 1
                ? `${confirmedShipments.length} Shipments Booked!`
                : 'Shipment Booking Confirmed!'}
            </h2>
            <p className="text-[14px] text-[#4B5563] dark:text-slate-400 tabular-nums">
              Booking Group Reference:{' '}
              <span className="font-bold text-[#0F172A] dark:text-[#90E0EF]">{confirmedGroupCode}</span>
            </p>
          </div>

          <div className="max-w-lg mx-auto space-y-3 text-left">
            {confirmedShipments.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <ReferenceQrBadge value={s.trackingNumber} label="Intake QR" size={64} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[15px] text-[#111827] dark:text-white tabular-nums">
                        {s.trackingNumber}
                      </span>
                      {s.isFragile && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300">
                          Fragile
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] text-[#4B5563] dark:text-slate-400 tabular-nums">
                      {s.destinationCity}, {s.destinationCountry} · {formatNaira(s.quote.totalAmount)} est.
                    </div>
                    <div className="text-[11px] text-[#4B5563] dark:text-slate-500">
                      Final price confirmed after calibrated facility weighing
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onComplete(s.trackingNumber)}
                  className="min-h-[40px] px-5 py-2 bg-[#00B4D8] hover:bg-[#0096C7] text-white rounded-full text-[14px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Track</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journey B: Inline Login / Signup Modal preserving 100% of entered draft fields */}
      {inlineAuthOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in or create account to confirm booking"
        >
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-[14px] max-w-md w-full p-6 space-y-4 shadow-xl text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#00B4D8]" />
                <div>
                  <h3 className="sv-h3">Sign In to Complete Booking</h3>
                  <p className="text-[12px] text-[#4B5563] dark:text-slate-400">
                    All {items.length} shipment package{items.length > 1 ? 's' : ''} and route details stay preserved.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInlineAuthOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close sign in dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-[#E2E8F0] dark:border-slate-700 pb-2">
              <button
                type="button"
                onClick={() => setInlineAuthTab('quick')}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold cursor-pointer ${
                  inlineAuthTab === 'quick'
                    ? 'bg-[#00B4D8] text-white'
                    : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#4B5563] dark:text-slate-300'
                }`}
              >
                Quick Sign In
              </button>
              <button
                type="button"
                onClick={() => setInlineAuthTab('register')}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold cursor-pointer ${
                  inlineAuthTab === 'register'
                    ? 'bg-[#00B4D8] text-white'
                    : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#4B5563] dark:text-slate-300'
                }`}
              >
                Create Account
              </button>
            </div>

            {inlineAuthTab === 'quick' ? (
              <div className="space-y-2.5">
                <p className="text-[12px] text-[#4B5563] dark:text-slate-400">
                  Select a customer profile to sign in and submit your booking immediately:
                </p>
                {[
                  { key: 'verified' as const, label: 'Amara Okafor (Verified Individual · Lagos)', nextRole: 'customer' as const },
                  { key: 'business' as const, label: 'Zuri Styles Atelier (Business · VI Lagos)', nextRole: 'business' as const },
                  { key: 'pending' as const, label: 'Chinedu Eze (Standard Customer · Lekki)', nextRole: 'customer' as const },
                ].map((acc) => (
                  <button
                    key={acc.key}
                    type="button"
                    onClick={() => {
                      setActiveCustomerKey(acc.key);
                      setRole(acc.nextRole);
                      setInlineAuthOpen(false);
                      executeBookingSubmit();
                    }}
                    className="w-full p-3 rounded-[10px] border border-[#CBD5E1] dark:border-slate-700 hover:border-[#00B4D8] bg-[#F8FAFC] dark:bg-slate-800 text-left text-[13px] font-bold text-[#111827] dark:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>{acc.label}</span>
                    <ArrowRight className="w-4 h-4 text-[#00B4D8]" />
                  </button>
                ))}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!senderName.trim() || !senderEmail.trim() || regPassword.length < 4) {
                    setInlineAuthError('Enter Sender Name, Email in Step 1 (or confirm below), and a password (min 4 chars).');
                    return;
                  }
                  setActiveCustomerKey('new');
                  updateCurrentCustomer({
                    name: senderName.trim(),
                    phone: senderPhone.trim(),
                    email: senderEmail.trim(),
                    address: sharedCollectionAddress.trim(),
                  });
                  setRole('customer');
                  setInlineAuthOpen(false);
                  executeBookingSubmit();
                }}
                className="space-y-3 text-[13px]"
              >
                <div className="p-3 rounded-[8px] bg-[#CAF0F8]/50 dark:bg-sky-950/40 text-[12px] text-[#0F172A] dark:text-[#90E0EF]">
                  Account profile prefilled from Step 1: <strong>{senderName || 'Guest'}</strong> ({senderEmail || 'Add email below'})
                </div>
                {!senderEmail.trim() && (
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="Email address *"
                    className="sv-input w-full min-h-[40px] px-3 py-2 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                  />
                )}
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create password (min 4 characters) *"
                  className="sv-input w-full min-h-[40px] px-3 py-2 rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-white"
                />
                {inlineAuthError && (
                  <p className="text-[12px] text-[#B42318] dark:text-rose-400 font-medium">{inlineAuthError}</p>
                )}
                <button
                  type="submit"
                  className="w-full min-h-[42px] px-5 py-2 rounded-full bg-[#00B4D8] hover:bg-[#0096C7] text-white font-bold cursor-pointer"
                >
                  Create Account &amp; Confirm Booking
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <QuoteOptionDetailsModal
        option={detailModalOption}
        onClose={() => setDetailModalOption(null)}
        onSelectOption={() => {
          if (detailModalOption && !detailModalOption.disabled) {
            setServiceTier(detailModalOption.id as ServiceTier);
          }
        }}
      />
    </div>
  );
};
