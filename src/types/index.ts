export type StaffWorkspace = 'pickup_shipping' | 'customer_service' | 'operations_admin';

export type DemoRole =
  | 'visitor'
  | 'customer'
  | 'business'
  // Consolidated 3 Staff Workspaces:
  | 'pickup_shipping'
  | 'customer_service'
  | 'operations_admin'
  // Legacy aliases maintained for backwards-compatibility:
  | 'front_desk'
  | 'pickup_agent'
  | 'operations'
  | 'finance'
  | 'platform_admin'
  | 'super_admin'
  | 'owner';

export type StaffRole =
  | 'owner'
  | 'platform_admin'
  | 'super_admin'
  | 'front_desk'
  | 'pickup_agent'
  | 'operations'
  | 'finance';

export type StaffStatus = 'active' | 'suspended' | 'deactivated';

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  staffCount: number;
  managerName: string;
  operatingHours?: string;
  dropoffInstructions?: string;
}

export interface StaffAccount {
  id: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  workspace?: StaffWorkspace;
  assignedDuties?: string[];
  department: string;
  branchId?: string;
  branchName?: string;
  allowedBranches?: string[];
  status: StaffStatus;
  lastActive: string;
  createdAt: string;
  isInitialSuperAdmin?: boolean;
  isOwner?: boolean;
  sessionRevoked?: boolean;
}

export type ApprovalRequestType =
  | 'high_risk_refund'
  | 'bulk_customer_export'
  | 'payout_bank_change'
  | 'privileged_staff_elevation';

export interface SecurityApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  title: string;
  requesterId: string;
  requesterName: string;
  requesterRole: DemoRole;
  targetId: string;
  amountNgn?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export type SecurityAlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityAlert {
  id: string;
  severity: SecurityAlertSeverity;
  type:
    | 'unauthorized_elevation_attempt'
    | 'suspicious_refund_attempt'
    | 'bulk_export_attempt'
    | 'unauthorized_payment_override'
    | 'audit_tamper_attempt';
  actorName: string;
  actorRole: DemoRole;
  timestamp: string;
  details: string;
  status: 'unresolved' | 'investigated' | 'resolved';
}

export interface CompanyPayoutSettings {
  bankName: string;
  accountNumberMasked: string;
  accountName: string;
  settlementCurrency: 'NGN' | 'USD';
  gatewayProvider: string;
  refundThresholdNgn: number;
  twoPersonControlEnforced: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId?: string;
  actorName: string;
  actorRole: DemoRole;
  userName?: string;
  userRole?: DemoRole;
  branchId?: string;
  branchName?: string;
  action: string;
  targetType: 'staff' | 'shipment' | 'payment' | 'kyc' | 'pickup' | 'config' | 'security' | 'export' | 'branch';
  targetId: string;
  details: string;
  beforeValue?: string;
  afterValue?: string;
  reason?: string;
  ipAddress?: string;
  isImmutable?: boolean;
}

export type KycStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'pending_review'
  | 'verified'
  | 'additional_info_required'
  | 'rejected'
  | 'expired'
  | 'verification_in_progress'
  | 'failed'
  | 'manual_review'
  | 'verification_service_unavailable'
  | 'expired_or_reverification';

export type SwiftShareCategory = 'clothing' | 'documents' | 'hair_wigs';
export type TravelCarryCategory = SwiftShareCategory;

export type SwiftShareStatus =
  | 'submitted'
  | 'reviewed'
  | 'inspected_and_sealed'
  | 'in_transit'
  | 'delivered'
  | 'on_hold_safety_review';
export type TravelCarryStatus = SwiftShareStatus;

export interface SwiftShareRequest {
  id: string;
  requestReference: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  recipientName: string;
  recipientPhone: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  preferredDate: string;
  category: SwiftShareCategory;
  // Specific item details
  itemDescription: string;
  pieceCount?: number;
  weightKg?: number;
  declaredValueNgn: number;
  ownershipConfirmed: boolean;
  documentType?: string;
  packCount?: number;
  handlingNotes?: string;
  photoProvided?: boolean;
  // Inspection & Sealing
  status: SwiftShareStatus;
  inspectedAt?: string;
  sealReferenceNumber?: string;
  inspectionNotes?: string;
  measuredWeightKg?: number;
  unpackedForInspection?: boolean;
  weightDiscrepancyDetected?: boolean;
  // Escrow Payout to Traveller
  assignedTravellerId?: string;
  assignedTravellerName?: string;
  travellerPayoutNgn: number;
  payoutStatus: 'held_in_escrow' | 'released' | 'cancelled';
  deliveryConfirmedByRecipient: boolean;
  // Safety review
  isSafetyHold?: boolean;
  safetyHoldReason?: string;
  createdAt: string;
}
export type TravelCarryRequest = SwiftShareRequest;

export interface TravellerInterest {
  id: string;
  name: string;
  contact: string;
  departureCity: string;
  departureCountry: string;
  destinationCity: string;
  destinationCountry: string;
  expectedTravelDate: string;
  approximateSpareCapacityKg: number;
  travelBookingReference?: string;
  termsAgreed: boolean;
  createdAt: string;
}

export type ServiceTier = 'standard' | 'priority';

export type ShippingDirection = 'export' | 'import';

export type CollectionMethod = 'standard_pickup' | 'priority_pickup' | 'dropoff';

export type PickupStatus =
  | 'requested'
  | 'scheduled'
  | 'pickup_scheduled'
  | 'awaiting_dropoff'
  | 'agent_assigned'
  | 'driver_assigned'
  | 'agent_en_route'
  | 'picked_up'
  | 'failed_attempt'
  | 'rescheduled'
  | 'cancelled';

export type PickupJobStatus =
  | 'requested'
  | 'booking_received'
  | 'awaiting_arrangement'
  | 'scheduled'
  | 'in_progress'
  | 'collection_in_progress'
  | 'picked_up'
  | 'collected'
  | 'collected_in_transit'
  | 'delivered_to_hub'
  | 'arrived_at_facility'
  | 'facility_received'
  | 'inspection_and_weighing'
  | 'quotation_ready'
  | 'awaiting_approval'
  | 'awaiting_payment'
  | 'processing_shipment'
  | 'completed'
  | 'failed'
  | 'failed_attempt'
  | 'rescheduled'
  | 'cancelled'
  | 'assigned'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'unsuccessful'
  | 'handed_over';

export interface PickupJob {
  id: string;
  shipmentId: string;
  bookingGroupId?: string;
  shipmentIds?: string[];
  trackingNumber: string;
  pickupReference: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  senderAddress: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerId?: string;
  pickupAddress?: string;
  state?: string;
  city?: string;
  landmark?: string;
  branchId?: string;
  branchName?: string;
  scheduledSlot: string;
  scheduledDate: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  bookingConfirmedAt?: string;
  collectionDeadline?: string; // 24-hour collection deadline from booking
  declaredWeightKg: number;
  declaredDimensions: { length: number; width: number; height: number };
  packageCount?: number;
  packageDescription?: string;
  estimatedWeightKg?: number;
  pickupType?: 'standard' | 'priority' | 'dropoff';
  pickupFeeNgn?: number;
  estimatedWindow?: string;
  isPriorityFlag?: boolean;
  packagePhotoUrl?: string;
  plannedVehicleType?: 'motorcycle' | 'car' | 'van' | 'truck';
  estimatedSizeCategory?: 'small' | 'medium' | 'large' | 'multiple';
  country?: string;
  specialInstructions?: string;
  specialHandlingNotes?: string;
  isFragile?: boolean;
  fragileHandlingNotes?: string;
  isDemo?: boolean;
  verifiedWeightKg?: number;
  verifiedDimensions?: { length: number; width: number; height: number };
  status: PickupJobStatus;
  notes?: string;
  collectionHandlerType?: 'staff' | 'external_partner' | 'manual';
  collectionHandlerName?: string;
  collectionHandlerPhone?: string;
  collectionHandlerNotes?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assigningStaffId?: string;
  assigningStaffName?: string;
  assignedAt?: string;
  inspectionStatus?: 'pending' | 'passed' | 'discrepancy';
  handoverStatus?: 'pending' | 'handed_over';
  handoverConfirmedBy?: string;
  handoverTimestamp?: string;
  // Collection evidence at customer's doorstep (NO scale weighing at customer address)
  doorstepCollection?: {
    collectedAt: string;
    packagesCollected: number;
    visibleCondition: 'good' | 'minor_outer_scuff' | 'carton_damaged' | 'unsealed';
    customerSignatureName: string;
    notes?: string;
    photos?: string[];
  };
  collectionConfirmedAt?: string;
  collectionPackageCount?: number;
  collectionVisibleCondition?: 'good' | 'minor_outer_scuff' | 'carton_damaged' | 'unsealed';
  collectionPhotos?: string[];
  collectionCustomerSigned?: boolean;
  collectionCustomerName?: string;
  // Facility receiving & weighing
  facilityReceivedAt?: string;
  facilityStaffId?: string;
  facilityStaffName?: string;
  facilityPackageCountConfirmed?: number;
  facilityConditionNotes?: string;
  facilityRepackagingApplied?: boolean;
  facilityRepackagingApproved?: boolean;
  pickupCode?: string;
  quoteReference?: string;
  collectionMethod?: CollectionMethod;
  fragileNotes?: string;
  address?: string;
  alternateContactName?: string;
  alternateContactPhone?: string;
  failureReason?: string;
  failedAt?: string;
  rescheduledFromDate?: string;
  rescheduledReason?: string;
  rescheduledAt?: string;
  facilityReceipt?: FacilityReceiptRecord;
  packageMeasurements?: PackageMeasurement[];
  carrierDivisorId?: string;
  carrierDivisorUsed?: number;
  appliedDivisor?: number;
  facilityActualWeightKg?: number;
  facilityDimensions?: { length: number; width: number; height: number };
  facilityVolumetricWeightKg?: number;
  facilityChargeableWeightKg?: number;
  finalQuoteGenerated?: boolean;
}

export type ShipmentStatus =
  | 'draft'
  | 'awaiting_dropoff'
  | 'pickup_requested'
  | 'pickup_scheduled'
  | 'pickup_on_the_way'
  | 'picked_up'
  | 'pickup_completed'
  | 'arrived_at_facility'
  | 'at_facility'
  | 'awaiting_measurement'
  | 'measured'
  | 'quote_ready'
  | 'pending_reweigh_approval'
  | 'awaiting_customer_approval'
  | 'quote_approved'
  | 'payment_pending'
  | 'awaiting_payment'
  | 'payment_confirmed'
  | 'ready_for_carrier_booking'
  | 'carrier_booking_in_progress'
  | 'booking_failed'
  | 'booked'
  | 'shipment_booked'
  | 'in_transit'
  | 'out_for_delivery'
  | 'overdue_investigation'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export interface RouteInfo {
  direction: ShippingDirection;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  postalCode?: string;
  prioritySupported: boolean;
  transitStandardDays: string;
  transitPriorityDays: string;
}

export interface ParcelItem {
  id: string;
  description: string;
  quantity: number;
  declaredValue: number; // in NGN
  category?: string;
  isFragile?: boolean;
  fragileHandlingNotes?: string;
  isExcludedFromProtection?: boolean;
  exclusionReason?: string;
}

export interface QuoteBreakdown {
  id: string;
  chargeableWeightKg: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  serviceTier: ServiceTier;
  serviceName: string; // 'Priority Air Express' | 'Standard Air Courier'
  laneDescription: string; // 'Fastest available international lane' | 'Cost-optimized international lane, consolidated for efficiency'
  freightCharge: number; // NGN
  jetFuelSurcharge: number; // NGN (industry fuel index)
  handlingCharge: number; // NGN (terminal documentation & manifest lodging)
  pickupCharge: number; // Always 0 (Free pickup)
  protectionCharge: number; // 0 for basic, calculated rate (e.g. 1.5%) for premium
  protectionPlan?: 'basic' | 'premium';
  protectionCoverageNgn?: number;
  protectionRatePercentage?: number;
  protectionDeductibleText?: string;
  subtotal: number;
  vatAmount: number; // 7.5% Nigerian VAT
  totalAmount: number; // NGN
  transitWindow: string;
  estimatedDeliveryDate: string;
  estimatedDeliveryDisplay: string;
  isDiscrepancyRevised?: boolean;
  previousTotal?: number;
  discrepancyReason?: string;
  generatedAt: string;
  expiresAt: string;
}

export interface QuoteVersion {
  version: number;
  quote: QuoteBreakdown;
  measuredWeightKg: number;
  measuredDimensions?: { length: number; width: number; height: number };
  changedBy: string;
  reason: string;
  status: 'active' | 'replaced' | 'expired' | 'approved' | 'paid';
  createdAt: string;
}

export interface MeasurementReviewRequest {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  customerId?: string;
  customerName?: string;
  reason: string;
  status: 'open' | 'in_review' | 'adjusted' | 'upheld';
  staffResolutionNote?: string;
  reviewedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface BookingGroup {
  id: string;
  groupCode: string;
  customerId: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  sharedCollectionAddress: string;
  collectionArrangement: 'shared' | 'split';
  collectionMethod: CollectionMethod;
  collectionBranchId?: string;
  dropoffBranchId?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  pickupFeeNgn: number;
  shipmentIds: string[];
  status: 'booked' | 'unpaid' | 'partially_paid' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  sourceQuoteRef?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface TrackingEvent {
  id: string;
  timestamp: string;
  stage: string;
  location: string;
  description: string;
  isDelayed?: boolean;
  exceptionNotice?: string;
  isProactiveAlert?: boolean;
}

export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // percentage (e.g. 10 for 10%) or fixed NGN (e.g. 5000)
  minTransactionAmountNgn?: number;
  maxDiscountNgn?: number;
  description: string;
  isActive: boolean;
  isDemo?: boolean;
}

export interface ShipmentRecord {
  id: string;
  trackingNumber: string;
  direction: ShippingDirection;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  originCountry: string;
  originCity: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  destinationCountry: string;
  destinationCity: string;
  category?: 'goods' | 'documents' | 'apparel';
  contentsDescription: string;
  items: ParcelItem[];
  packageCount?: number;
  declaredWeightKg: number;
  declaredDimensions?: { length: number; width: number; height: number };
  declaredValueNgn?: number;
  verifiedWeightKg?: number;
  verifiedDimensions?: { length: number; width: number; height: number };
  pickupScheduledDate?: string;
  pickupScheduledSlot?: string;
  pickupAddress?: string;
  pickupType: 'doorstep' | 'hub' | 'branch_dropoff';
  pickupStatus: PickupStatus;
  pickupStatusLabel: string;
  assignedAgentName?: string;
  branchId?: string;
  branchName?: string;
  dropoffBranchId?: string;
  dropoffBranchName?: string;
  intakeStaffId?: string;
  intakeStaffName?: string;
  batchReference?: string;
  status: ShipmentStatus;
  quote: QuoteBreakdown;
  selectedTier: ServiceTier;
  estimatedDeliveryDisplay: string;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed';
  paymentReference?: string;
  paymentMethod?: string;
  finalQuoteNgn?: number;
  originalPaidAmountNgn?: number;
  adjustmentBalanceDueNgn?: number;
  adjustmentRefundNgn?: number;
  chargeableWeightKg?: number;
  overdueAlert?: boolean;
  carrierBooking?: any;
  discountCode?: string;
  discountAmountNgn?: number;
  creditAppliedNgn?: number;
  cashbackRedeemedNgn?: number;
  bonusRedeemedNgn?: number;
  finalAmountPaidNgn?: number;
  trackingEvents: TrackingEvent[];
  lastUpdateTimestamp: string;
  isUpdateOverdue?: boolean;
  overdueAlertSent?: boolean;
  investigationNote?: string;
  customerAcknowledgedTerms: boolean;
  customerAcknowledgedDeclaration: boolean;
  kycRequiredAtBooking: boolean;
  kycRequired?: boolean;
  deliveredAt?: string;
  cashbackEarned: number;
  cashbackStatus: 'none' | 'pending' | 'eligible' | 'released';
  hasReview: boolean;
  protectionSelected?: boolean;
  protectionPlan?: 'basic' | 'premium';
  protectionFeeNgn?: number;
  protectionPremiumNgn?: number;
  protectionCoverageNgn?: number;
  protectionCoverageLimitNgn?: number;
  protectionReference?: string;
  protectionTermsAccepted?: boolean;
  protectionProvider?: string;
  protectionStatus?: 'active' | 'certificate_issued' | 'claim_pending' | 'settled';
  // DHL 2-Reference Carrier Integration
  swiftveroCode?: string;
  dhlTrackingNumber?: string;
  dhlWaybillNumber?: string;
  dhlBookingId?: string;
  dhlShipmentRef?: string;
  carrierName?: string;
  carrierStatus?: string;
  carrierBookingError?: string;
  isDemoCarrier?: boolean;
  // Cancellation stages: A (before pickup), B (collected, awaiting approval), C (handed to carrier), D (delivered)
  cancellationStage?: 'A' | 'B' | 'C' | 'D';
  cancellationStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'cancelled';
  cancellationReason?: string;
  bookingGroupId?: string;
  bookingGroupCode?: string;
  collectionMethod?: CollectionMethod;
  priorityCollectionWindow?: string;
  collectionFeeNgn?: number;
  collectionBranchId?: string;
  quoteVersions?: QuoteVersion[];
  measurementReviews?: MeasurementReviewRequest[];
  facilityReceipt?: FacilityReceiptRecord;
  packageMeasurements?: PackageMeasurement[];
  carrierDivisorId?: string;
  carrierDivisorUsed?: number;
  appliedDivisor?: number;
  availableServiceQuotes?: QuoteBreakdown[];
  quoteRejectedReason?: string;
  quoteRejectedAt?: string;
  reapprovalRequired?: boolean;
  sourceQuoteRef?: string;
  quoteReference?: string;
  isFragile?: boolean;
  fragileNotes?: string;
  fragileHandlingNotes?: string;
  isArchived?: boolean;
  archivedByCustomer?: boolean;
  archivedAt?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  customerType: 'individual' | 'business';
  accountType?: 'individual' | 'business';
  companyName?: string;
  address?: string;
  country?: string;
  profilePhotoUrl?: string;
  kycStatus: KycStatus;
  kycVerificationMethod?: 'nin' | 'bvn' | 'passport';
  kycMaskedId?: string; // e.g. *******1234
  kycIdType?: string;
  kycDocName?: string;
  kycSubmittedAt?: string;
  kycVerifiedAt?: string;
  kycLastResult?: string;
  kycReverificationRequired?: boolean;
  kycReverificationReason?: string;
  cashbackBalance: number;
  accountCreditNgn?: number;
  bonusBalanceNgn?: number;
  earnedCashbackNgn?: number;
  earnedReferralBonusNgn?: number;
  promotionalRewardsNgn?: number;
  promoDiscountsBalance?: number;
  walletId?: string;
  walletBalance?: number;
  walletStatus?: 'active' | 'frozen' | 'suspended';
  cacNumber?: string;
  taxId?: string;
  businessTier?: string;
  teamMembersCount?: number;
  totalShipments?: number;
  referralCode: string;
  referralsCount: number;
  termsAcceptedAt: string;
  isWalkIn?: boolean;
  createdByStaffId?: string;
  assignedBranchId?: string;
  isDemo?: boolean;
}

export interface WalkInPackage {
  id: string;
  description: string;
  quantity: number;
  actualWeightKg: number;
  packageType: 'box' | 'carton' | 'envelope' | 'pallet' | 'crate' | 'sack';
  declaredValueNgn: number;
  currency: string;
  isFragile: boolean;
  requiresSpecialHandling?: boolean;
  inspectionNotes?: string;
  photoUrl?: string;
}

export interface HandoverManifestRecord {
  id: string;
  manifestNumber: string;
  branchId: string;
  branchName: string;
  driverName: string;
  driverPhone: string;
  vehicleRegistration: string;
  destinationHub: string;
  shipmentIds: string[];
  totalPackages: number;
  totalWeightKg: number;
  tamperSealNumbers: string[];
  handedOverByStaffName: string;
  handedOverAt: string;
  receivedByOpsSignature?: string;
  status: 'pending_dispatch' | 'in_transit_to_hub' | 'received_at_hub';
}

export interface CustomerReview {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  customerId?: string;
  customerName: string;
  verifiedShipment: boolean;
  ratingOverall: number; // 1-5
  ratingCommunication: number; // 1-5
  ratingSpeed: number; // 1-5
  ratingCondition: number; // 1-5
  writtenFeedback: string;
  photoUrl?: string;
  photoUrls?: string[];
  publicConsentGiven?: boolean;
  status: 'pending' | 'published' | 'rejected';
  moderationStatus?: 'pending_review' | 'approved' | 'rejected' | 'disputed';
  moderationNote?: string;
  disputeNote?: string;
  companyResponse?: string;
  isDemo?: boolean;
  createdAt: string;
}

export type RefundStatus =
  | 'request_received'
  | 'under_review'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected';

export interface RefundRequestRecord {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amountNgn: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reason: string;
  status: RefundStatus;
  statusTimeline: Array<{
    status: RefundStatus;
    title: string;
    description: string;
    timestamp: string;
  }>;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SupportTicketCategory =
  | 'pickup_complaint'
  | 'missed_pickup'
  | 'shipment_delay'
  | 'tracking_problem'
  | 'damaged_package'
  | 'missing_package'
  | 'incorrect_charge'
  | 'payment_problem'
  | 'wallet_topup'
  | 'cashback_problem'
  | 'promo_code'
  | 'refund_request'
  | 'kyc_verification'
  | 'delivery_problem'
  | 'general_enquiry'
  | 'other'
  | 'tracking'
  | 'pickup'
  | 'quote'
  | 'payment'
  | 'customs'
  | 'damage'
  | 'general';

export type SupportTicketStatus =
  | 'new'
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'waiting_for_customer'
  | 'waiting_for_operations'
  | 'escalated'
  | 'resolved'
  | 'closed'
  | 'investigating';

export interface SupportTicketMessage {
  id: string;
  sender: 'customer' | 'support' | 'operations';
  senderName: string;
  senderRole?: string;
  text: string;
  timestamp: string;
  isInternalNote?: boolean; // Strictly internal, hidden from customer view
  attachments?: string[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g. SWV-CS-2026-000001
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shipmentTracking?: string;
  trackingNumber?: string;
  pickupReference?: string;
  category: SupportTicketCategory;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  subject: string;
  description?: string;
  status: SupportTicketStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedToStaffName?: string;
  escalatedTo?: string;
  escalationReason?: string;
  escalatedAt?: string;
  satisfactionRating?:
    | number
    | {
        rating: number;
        feedback?: string;
        submittedAt?: string;
      }; // 1 to 5 stars or detailed feedback object
  satisfactionFeedback?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  messages: SupportTicketMessage[];
}

export type WalletTransactionType =
  | 'wallet_topup'
  | 'shipping_payment'
  | 'shipping_refund'
  | 'overpayment_credit'
  | 'account_credit_redemption'
  | 'cashback_credit'
  | 'cashback_redemption'
  | 'bonus_credit'
  | 'bonus_redemption'
  | 'reward_expiry'
  | 'promotional_discount'
  | 'payment_reversal'
  | 'manual_adjustment';

export interface WalletTransaction {
  id: string;
  walletId: string;
  customerId: string;
  customerName?: string;
  transactionReference: string; // e.g. SWV-TXN-2026-00123
  type: WalletTransactionType;
  entryType?: 'credit' | 'debit';
  isDemo?: boolean;
  amountNgn: number;
  balanceBeforeNgn: number;
  balanceAfterNgn: number;
  balanceType: 'wallet' | 'cashback' | 'account_credit' | 'bonus';
  description: string;
  paymentGatewayReference?: string;
  paymentMethod?: string;
  status: 'successful' | 'pending' | 'failed' | 'reversed';
  shipmentTrackingNumber?: string;
  createdAt: string;
}

export interface PromoCampaign {
  id: string;
  code: string;
  type?: 'percentage' | 'fixed';
  value?: number; // e.g. 10 for 10% or 5000 for ₦5,000
  title?: string;
  description?: string;
  discountType?: 'percentage' | 'fixed' | 'fixed_amount';
  discountValue?: number;
  minShipmentValueNgn?: number;
  minShipmentAmountNgn?: number;
  maxDiscountNgn?: number;
  maxDiscountAmountNgn?: number;
  startDate?: string;
  endDate?: string;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  maxUsesTotal?: number;
  usedCount?: number;
  timesUsed?: number;
  perCustomerLimit?: number;
  eligibleDestinations?: string[]; // ['All'] or specific country names
  eligibleServices?: ('standard' | 'priority')[];
  canCombineWithCashback?: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface CashbackCampaignConfig {
  percentage: number;
  minShipmentAmountNgn: number;
  maxCashbackPerShipmentNgn: number;
  expiryDays: number;
  eligibleServices: ('standard' | 'priority')[];
  enabled: boolean;
  campaignStartDate: string;
  campaignEndDate: string;
  defaultCashbackPercentage?: number;
  holdingPeriodHoursAfterDelivery?: number;
  minEligibleShipmentValueNgn?: number;
  isProgramActive?: boolean;
}

export interface OperationalHandoverRecord {
  id: string;
  handoverReference?: string; // e.g. SWV-HND-2026-001
  manifestNumber?: string;
  shipmentId?: string;
  trackingNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  originFacilityName?: string;
  destinationFacilityName?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleReg?: string;
  packageCount: number;
  packageCondition?: 'good' | 'minor_scuff' | 'damaged' | 'repacked';
  dispatcherStaffName?: string;
  releasingStaffId?: string;
  releasingStaffName?: string;
  receivingStaffId?: string;
  receivingStaffName?: string;
  receiverStaffName?: string;
  dispatchedAt: string;
  receivedAt?: string;
  status: 'pending_receipt' | 'completed' | 'disputed' | 'dispatched' | 'received' | 'discrepancy_reported';
  notes?: string;
}

export interface ShipmentClarificationRecord {
  id: string;
  clarificationReference?: string; // e.g. CLF-2026-001
  shipmentId: string;
  trackingNumber: string;
  customerId?: string;
  customerName?: string;
  category?: string;
  issueType?:
    | 'incomplete_address'
    | 'customer_unavailable'
    | 'contents_unclear'
    | 'contents_discrepancy'
    | 'incorrect_receiver'
    | 'oversized_package'
    | 'restricted_goods'
    | 'missing_documentation'
    | 'pending_quote_approval';
  description: string;
  raisedBy?: string;
  raisedAt?: string;
  status: 'open' | 'contacted' | 'resolved' | 'cancelled' | 'pending';
  contactedAt?: string;
  customerResponse?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  staffNotes?: string;
  assignedToStaffName?: string;
  createdAt?: string;
}

export interface CashbackLedgerItem {
  id: string;
  customerId: string;
  shipmentId: string;
  trackingNumber: string;
  amountNgn: number;
  status: 'pending' | 'eligible' | 'released' | 'reversed';
  type?: 'cashback_earned' | 'referral_bonus' | 'credits_redeemed' | 'credit_reversal';
  balanceAfterNgn?: number;
  description: string;
  isDemo?: boolean;
  createdAt: string;
  releasedAt?: string;
}

export interface ReferralItem {
  id: string;
  referrerId?: string;
  referrerCode: string;
  refereeName: string;
  refereeEmail: string;
  status: 'invited' | 'registered' | 'qualifying_shipment_completed' | 'bonus_released';
  bonusNgn: number;
  date: string;
  isDemo?: boolean;
}

export interface AddressBookEntry {
  id: string;
  customerId: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  destinationCountry: string;
  destinationCity: string;
  recipientAddress: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface ShipmentTemplate {
  id: string;
  customerId: string;
  name: string;
  category: 'goods' | 'documents' | 'apparel';
  description: string;
  estimatedWeightKg: number;
  dimensions: { lengthCm: number; widthCm: number; heightCm: number };
  declaredValueNgn: number;
  preferredTier: ServiceTier;
  createdAt: string;
}

export type CargoType = 'air_cargo' | 'sea_fcl' | 'sea_lcl' | 'palletized_freight' | 'project_cargo';

export interface CargoEnquiry {
  id: string;
  enquiryReference: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  cargoType: CargoType;
  cargoDescription: string;
  packageCount: number;
  estimatedWeightKg: number;
  dimensionsCm: { length: number; width: number; height: number };
  desiredTimeframe: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName?: string;
  specialHandlingNotes?: string;
  status: 'submitted' | 'under_review' | 'quoted';
  createdAt: string;
}

export interface BusinessTeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'operations_manager' | 'shipping_staff' | 'finance_viewer';
  status: 'active' | 'invited';
  joinedAt: string;
}

export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'additional_info_required'
  | 'accepted'
  | 'rejected'
  | 'approved_for_compensation'
  | 'payment_processing'
  | 'settled'
  | 'closed'
  | 'awaiting_customer_info'
  | 'resolved';

export interface SupportClaim {
  id: string;
  claimNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  shipmentTracking: string;
  type: 'delay' | 'damaged' | 'missing' | 'failed_delivery' | 'other' | 'damaged_contents' | 'missing_items' | 'total_loss' | 'address_delivery_issue';
  incidentType?: 'missing_items' | 'damaged_contents' | 'total_loss' | 'delay';
  description: string;
  declaredValueNgn: number;
  evidenceAttached: boolean;
  evidenceFileName?: string;
  photoUrls?: string[];
  supportingDocuments?: string[];
  itemsClaimed?: string;
  requestedAmountNgn?: number;
  approvedAmountNgn?: number;
  decisionNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: ClaimStatus;
  history?: Array<{
    status: string;
    timestamp: string;
    actor: string;
    note: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProtectionCertificateRecord {
  id?: string;
  certificateNumber: string;
  shipmentTrackingNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  declaredValueNgn: number;
  protectionPlan: 'basic' | 'premium';
  coverageAmountNgn: number;
  premiumPaidNgn: number;
  ratePercentage?: number;
  deductibleText: string;
  termsVersion: string;
  providerName: string;
  bookingDate: string;
  status: string;
  isSimulated?: boolean;
  itemsCovered?: ParcelItem[];
  excludedItems?: ParcelItem[];
}

export type ConsentCategory =
  | 'registration'
  | 'pickup_booking'
  | 'pickup_terms'
  | 'facility_weighing'
  | 'packaging_standards'
  | 'prohibited_goods'
  | 'contents_declaration'
  | 'quote_approval'
  | 'quotation_approval'
  | 'cargo_protection'
  | 'priority_shipping'
  | 'payment_terms'
  | 'payment_authorization'
  | 'carrier_terms'
  | 'protection_disclosure'
  | 'claims_procedure'
  | 'privacy_notice'
  | 'marketing';

export interface CustomerConsentRecord {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  bookingId?: string;
  shipmentTrackingNumber?: string;
  category: ConsentCategory;
  policyKey?: string;
  policyVersion: string;
  statement: string;
  status: 'accepted' | 'declined';
  timestamp: string;
  ipAddress?: string;
  auditDetails?: string;
}

export type AppEnvironmentMode = 'demo' | 'production_sandbox';

export type QuoteRecordStatus =
  | 'estimate'
  | 'saved'
  | 'manual_enquiry'
  | 'manual_quoted'
  | 'quoted'
  | 'converted'
  | 'converted_to_booking'
  | 'expired';

export interface QuoteItemDraft {
  id: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  serviceTier: ServiceTier;
  contentsDescription: string;
  packageCount: number;
  declaredWeightKg: number;
  declaredDimensions?: { length: number; width: number; height: number };
  declaredValueNgn: number;
  isFragile: boolean;
  fragileHandlingNotes?: string;
  packagingPreset?: string;
  collectionAddressOverride?: string;
}

export interface QuoteRecord {
  id: string;
  quoteRef: string; // QTE-YY-XXXXXX
  quoteReference?: string; // Legacy server alias
  type: 'instant_estimate' | 'manual_enquiry';
  status: QuoteRecordStatus;
  customerId?: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  senderState?: string;
  senderCity?: string;
  sharedCollectionAddress?: string;
  collectionMethod?: CollectionMethod;
  direction?: ShippingDirection;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  packageCategory?: string;
  contentsSummary?: string;
  estimatedWeightKg?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  isFragile?: boolean;
  fragileNotes?: string;
  serviceTier: ServiceTier;
  items: QuoteItemDraft[];
  quoteBreakdown?: QuoteBreakdown;
  quote?: QuoteBreakdown;
  totalEstimatedNgn: number;
  enquiryNotes?: string;
  staffQuoteNotes?: string;
  staffNotes?: string;
  quotedBy?: string;
  staffIssuedBy?: string;
  quotedAt?: string;
  expiresAt: string;
  convertedGroupCode?: string;
  convertedShipmentCodes?: string[];
  convertedShipmentId?: string;
  convertedTrackingNumber?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface QuoteEnquiry {
  id: string;
  quoteReference: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  packageDescription: string;
  estimatedWeightKg: number;
  dimensionsCm?: { length: number; width: number; height: number };
  isFragile: boolean;
  notes?: string;
  status: 'pending_review' | 'quoted' | 'converted' | 'cancelled';
  quotedTotalNgn?: number;
  quotedByStaff?: string;
  quotedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OtpChallengeRecord {
  id: string;
  contactValue: string;
  channel: 'email' | 'sms' | 'whatsapp';
  targetRef?: string;
  code: string;
  expiresAt: string;
  resendAvailableAt: string;
  attempts: number;
  maxAttempts: number;
  lockedUntil?: string;
  verifiedAt?: string;
  deliveryStatus: 'sent' | 'failed' | 'provider_unconfigured';
  deliveryError?: string;
  createdAt: string;
  isDemo: boolean;
}

export interface OtpDeliveryLog {
  id: string;
  channel: 'email' | 'sms' | 'whatsapp';
  recipientMasked: string;
  purpose: 'quote_access' | 'quote_recovery' | 'manual_quote_reply' | 'weight_adjustment';
  status: 'sent' | 'failed' | 'provider_unconfigured';
  providerName: string;
  errorDetail?: string;
  createdAt: string;
  isDemo: boolean;
}

export type PaymentAdjustmentStatus =
  | 'pending'
  | 'settled'
  | 'pending_customer_approval'
  | 'approved_and_paid'
  | 'paid'
  | 'refund_pending'
  | 'refund_credited'
  | 'credited_to_wallet'
  | 'refunded'
  | 'cancelled'
  | 'disputed';

export interface PaymentAdjustmentRecord {
  id: string;
  adjustmentRef: string; // ADJ-YY-XXXXXX
  adjustmentReference?: string;
  adjustmentCode?: string;
  adjustmentType?: 'additional_charge' | 'refund_credit' | 'no_change';
  shipmentId: string;
  trackingNumber: string; // Immutable SWV-YY-XXXXXX
  customerId: string;
  quoteVersionNumber?: number;
  originalWeightKg?: number;
  verifiedBillableWeightKg?: number;
  originalAmountPaidNgn: number;
  previousAmountNgn?: number;
  previousPaidNgn?: number;
  revisedAmountNgn: number;
  newTotalNgn?: number;
  differenceNgn: number; // >0 customer owes balance; <0 refund/credit owed to customer
  deltaNgn?: number;
  status: PaymentAdjustmentStatus;
  reason: string;
  inspectionNotes?: string;
  inspectionPhotoUrl?: string;
  requiresExplicitCheckout?: boolean;
  approvedAt?: string;
  paidAt?: string;
  resolvedAt?: string;
  paymentReference?: string;
  paymentMethod?: string;
  walletCreditedAt?: string;
  createdByStaffName?: string;
  createdAt: string;
  isDemo: boolean;
}

export interface PaymentRecord {
  id: string;
  paymentReference: string;
  customerId: string;
  shipmentId: string;
  trackingNumber: string;
  bookingGroupId?: string;
  amountNgn: number;
  method: string;
  kind: 'initial_booking' | 'adjustment_balance' | 'refund_credit';
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  gatewayMode: 'live' | 'demo_simulated';
  createdAt: string;
}

export interface PaymentReceiptRecord {
  id: string;
  receiptNumber: string; // RCT-YY-XXXXXX
  customerId: string;
  shipmentTrackingNumber?: string;
  bookingGroupCode?: string;
  adjustmentRef?: string;
  kind: 'initial_payment' | 'weight_adjustment' | 'wallet_topup' | 'refund_credit' | 'failed_attempt';
  amountNgn: number;
  paymentMethod: string;
  gatewayReference: string;
  accountCreditUsedNgn?: number;
  cashbackUsedNgn?: number;
  bonusUsedNgn?: number;
  gatewayAmountChargedNgn?: number;
  status: 'successful' | 'failed' | 'refunded' | 'pending';
  description: string;
  createdAt: string;
  isDemo: boolean;
}

export interface StaffNotification {
  id: string;
  targetWorkspace: StaffWorkspace;
  targetRole?: string;
  title: string;
  message: string;
  severity: 'info' | 'priority' | 'warning' | 'action_required';
  relatedRef?: string;
  isRead: boolean;
  createdAt: string;
  isDemo: boolean;
}

export interface NotificationDeliveryRecord {
  id: string;
  customerId: string;
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'sms' | 'whatsapp';
  recipientAddress?: string;
  deliveryStatus: 'delivered_in_app' | 'simulated_demo' | 'sent' | 'provider_unconfigured';
  relatedReference?: string;
  category: 'booking' | 'pickup' | 'quote' | 'payment' | 'tracking' | 'system' | 'account' | 'security';
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  inAppEnabled: boolean;
}

export type NotificationTriggerType =
  | 'pickup_booked'
  | 'pickup_scheduled'
  | 'pickup_failed'
  | 'pickup_rescheduled'
  | 'package_collected'
  | 'arrived_at_facility'
  | 'measurement_completed'
  | 'revised_quote_ready'
  | 'approval_required'
  | 'payment_required'
  | 'additional_payment_confirmed'
  | 'overpayment_credit_created'
  | 'reward_earned'
  | 'carrier_booked'
  | 'tracking_available'
  | 'status_changed'
  | 'delivered';

export interface CustomerNotification {
  id: string;
  eventKey: string;
  triggerType: NotificationTriggerType;
  customerId: string;
  title: string;
  message: string;
  relatedReference?: string;
  channel: 'in_app' | 'email' | 'sms';
  isRead: boolean;
  deliveryStatus: 'delivered_in_app' | 'simulated_demo' | 'sent' | 'failed';
  createdAt: string;
  isDemo: boolean;
}

export type PaystackOutcome = 'success' | 'pending' | 'failed';

export interface PackageMeasurement {
  id: string;
  boxNumber: number;
  description?: string;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  billableWeightKg: number;
  measuredAt: string;
  measuredBy: string;
  photoUrl?: string;
  notes?: string;
}

export interface CarrierDivisorRule {
  id: string;
  carrierName: string;
  routeScope: string;
  serviceTier: 'all' | ServiceTier;
  divisor: number;
  minChargeableKg: number;
  roundingStepKg: number;
  label: string;
  isActive: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export interface FacilityReceiptRecord {
  confirmedAt: string;
  confirmedByStaffId?: string;
  confirmedByStaffName: string;
  packageCountReceived: number;
  visibleCondition: 'good' | 'minor_scuff' | 'carton_damaged' | 'unsealed';
  packageDescription: string;
  discrepancies?: string;
  photoUrls?: string[];
}

export interface ShipmentCreditRecord {
  id: string;
  creditRef: string;
  customerId: string;
  sourceShipmentId: string;
  sourceTrackingNumber: string;
  sourceAdjustmentRef?: string;
  originalCreditNgn: number;
  remainingCreditNgn: number;
  status: 'available' | 'partially_used' | 'exhausted' | 'refunded';
  createdAt: string;
  expiresAt?: string;
  isDemo: boolean;
}

export interface BonusGrantRecord {
  id: string;
  grantRef: string;
  customerId: string;
  title: string;
  source: 'referral' | 'campaign' | 'promo' | 'welcome' | 'admin_award';
  initialAmountNgn: number;
  remainingAmountNgn: number;
  expiresAt: string;
  eligibleServices: ('standard' | 'priority')[];
  eligibleDestinations: string[];
  status: 'active' | 'exhausted' | 'expired';
  createdAt: string;
  isDemo: boolean;
}

export interface AdminFeatureFlags {
  insuranceEnabled: boolean;
  insurerConfigured: boolean;
  insurerName: string;
  insurerRatePercentage: number;
  insurerMinDeclaredValueNgn: number;
  insurerRuleSummary: string;
  smsProviderConfigured: boolean;
  emailProviderConfigured: boolean;
  whatsappProviderConfigured: boolean;
  updatedBy: string;
  updatedAt: string;
}

