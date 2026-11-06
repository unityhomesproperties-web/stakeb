export type DemoRole =
  | 'visitor'
  | 'customer'
  | 'business'
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
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  staffCount: number;
  managerName: string;
}

export interface StaffAccount {
  id: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
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

export type PickupStatus = 'requested' | 'agent_assigned' | 'agent_en_route' | 'picked_up';

export interface PickupJob {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  branchId?: string;
  branchName?: string;
  scheduledSlot: string;
  scheduledDate: string;
  declaredWeightKg: number;
  declaredDimensions: { length: number; width: number; height: number };
  verifiedWeightKg?: number;
  verifiedDimensions?: { length: number; width: number; height: number };
  status:
    | 'assigned'
    | 'accepted'
    | 'en_route'
    | 'arrived'
    | 'collected'
    | 'unsuccessful'
    | 'rescheduled'
    | 'handed_over'
    | 'picked_up';
  notes?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assigningStaffId?: string;
  assigningStaffName?: string;
  assignedAt?: string;
  inspectionStatus?: 'pending' | 'passed' | 'discrepancy';
  handoverStatus?: 'pending' | 'handed_over';
  handoverConfirmedBy?: string;
  handoverTimestamp?: string;
}

export type ShipmentStatus =
  | 'draft'
  | 'quote_ready'
  | 'quote_approved'
  | 'payment_pending'
  | 'booked'
  | 'pickup_scheduled'
  | 'pickup_completed'
  | 'in_transit'
  | 'overdue_investigation'
  | 'delivered'
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
  pickupType: 'doorstep' | 'hub';
  pickupStatus: PickupStatus;
  pickupStatusLabel: string;
  assignedAgentName?: string;
  branchId?: string;
  branchName?: string;
  intakeStaffId?: string;
  intakeStaffName?: string;
  batchReference?: string;
  status: ShipmentStatus;
  quote: QuoteBreakdown;
  selectedTier: ServiceTier;
  estimatedDeliveryDisplay: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'failed';
  paymentReference?: string;
  paymentMethod?: string;
  discountCode?: string;
  discountAmountNgn?: number;
  cashbackRedeemedNgn?: number;
  finalAmountPaidNgn?: number;
  trackingEvents: TrackingEvent[];
  lastUpdateTimestamp: string;
  isUpdateOverdue?: boolean;
  overdueAlertSent?: boolean;
  investigationNote?: string;
  customerAcknowledgedTerms: boolean;
  customerAcknowledgedDeclaration: boolean;
  kycRequiredAtBooking: boolean;
  deliveredAt?: string;
  cashbackEarned: number;
  cashbackStatus: 'none' | 'pending' | 'eligible' | 'released';
  hasReview: boolean;
  protectionPlan?: 'basic' | 'premium';
  protectionFeeNgn?: number;
  protectionCoverageNgn?: number;
  protectionReference?: string;
  protectionTermsAccepted?: boolean;
  protectionProvider?: string;
  protectionStatus?: 'active' | 'certificate_issued' | 'claim_pending' | 'settled';
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  customerType: 'individual' | 'business';
  companyName?: string;
  address?: string;
  country?: string;
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
  referralCode: string;
  referralsCount: number;
  termsAcceptedAt: string;
  isWalkIn?: boolean;
  createdByStaffId?: string;
  assignedBranchId?: string;
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
  customerName: string;
  verifiedShipment: boolean;
  ratingOverall: number; // 1-5
  ratingCommunication: number; // 1-5
  ratingSpeed: number; // 1-5
  ratingCondition: number; // 1-5
  writtenFeedback: string;
  photoUrl?: string;
  photoUrls?: string[];
  status: 'pending' | 'published' | 'rejected';
  moderationStatus?: 'pending_review' | 'approved' | 'rejected';
  moderationNote?: string;
  companyResponse?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  shipmentTracking?: string;
  category: 'tracking' | 'pickup' | 'quote' | 'payment' | 'customs' | 'damage' | 'general';
  subject: string;
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: 'customer' | 'support';
    senderName: string;
    text: string;
    timestamp: string;
  }>;
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
  createdAt: string;
  releasedAt?: string;
}

export interface ReferralItem {
  id: string;
  referrerCode: string;
  refereeName: string;
  refereeEmail: string;
  status: 'invited' | 'registered' | 'qualifying_shipment_completed' | 'bonus_released';
  bonusNgn: number;
  date: string;
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
