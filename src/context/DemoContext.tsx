import React, { createContext, useContext, useState } from 'react';
import {
  DemoRole,
  StaffRole,
  StaffStatus,
  StaffAccount,
  AuditLogEntry,
  CustomerProfile,
  ShipmentRecord,
  CustomerReview,
  SupportTicket,
  CashbackLedgerItem,
  ReferralItem,
  KycStatus,
  PickupJob,
  SecurityApprovalRequest,
  SecurityAlert,
  CompanyPayoutSettings,
  Branch,
  TravelCarryRequest,
  TravelCarryStatus,
  TravellerInterest,
  AddressBookEntry,
  ShipmentTemplate,
  CargoEnquiry,
  BusinessTeamMember,
  SupportClaim,
  ClaimStatus,
  ProtectionCertificateRecord,
  HandoverManifestRecord,
  CustomerConsentRecord,
  WalletTransaction,
  PromoCampaign,
  CashbackCampaignConfig,
  OperationalHandoverRecord,
  ShipmentClarificationRecord,
  SupportTicketStatus,
  RefundRequestRecord,
  RefundStatus,
  BookingGroup,
  CollectionMethod,
  QuoteVersion,
  MeasurementReviewRequest,
  AppEnvironmentMode,
  QuoteRecord,
  QuoteItemDraft,
  OtpChallengeRecord,
  OtpDeliveryLog,
  PaymentAdjustmentRecord,
  PaymentReceiptRecord,
  StaffNotification,
  AdminFeatureFlags,
  StaffWorkspace,
  PackageMeasurement,
  CarrierDivisorRule,
  FacilityReceiptRecord,
  ShipmentCreditRecord,
  BonusGrantRecord,
  CustomerNotification,
  NotificationTriggerType,
  PaystackOutcome,
  ServiceTier,
} from '../types';
import {
  DhlConfig,
  DEFAULT_DHL_CONFIG,
  checkDhlConnection,
  createDhlBooking,
  DhlConnectionTestResult,
  DhlShipmentCreationResult,
} from '../services/dhl-api';
import { ProtectionConfig, DEFAULT_PROTECTION_CONFIG } from '../utils/protection-calculator';
import {
  INITIAL_CUSTOMERS,
  INITIAL_SHIPMENTS,
  INITIAL_REVIEWS,
  INITIAL_TICKETS,
  INITIAL_CASHBACK_LEDGER,
  INITIAL_REFERRALS,
  INITIAL_STAFF_ACCOUNTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_APPROVAL_REQUESTS,
  INITIAL_SECURITY_ALERTS,
  INITIAL_PAYOUT_SETTINGS,
  INITIAL_BRANCHES,
  INITIAL_TRAVEL_CARRY_REQUESTS,
  INITIAL_TRAVELLER_INTERESTS,
  INITIAL_ADDRESS_BOOK,
  INITIAL_SHIPMENT_TEMPLATES,
  INITIAL_CARGO_ENQUIRIES,
  INITIAL_BUSINESS_TEAM,
  INITIAL_SUPPORT_CLAIMS,
  INITIAL_WALLET_TRANSACTIONS,
  INITIAL_PROMO_CAMPAIGNS,
  INITIAL_CASHBACK_CONFIG,
  INITIAL_OPERATIONAL_HANDOVERS,
  INITIAL_CLARIFICATIONS,
  INITIAL_BOOKING_GROUPS,
  INITIAL_QUOTES,
  INITIAL_PAYMENT_ADJUSTMENTS,
  INITIAL_PAYMENT_RECEIPTS,
  INITIAL_STAFF_NOTIFICATIONS,
  DEFAULT_ADMIN_FEATURE_FLAGS,
  INITIAL_SHIPMENT_CREDITS,
  INITIAL_BONUS_GRANTS,
  INITIAL_CUSTOMER_NOTIFICATIONS,
} from '../data/mockData';
import {
  hasPermission as checkPermission,
  Permission,
  canPromoteToOwner,
  canModifyPayoutSettings,
  evaluateRefundApproval,
  canExportCustomerDatabase,
} from '../utils/permissions';
import {
  generateQuoteBreakdown,
  recalculateVerifiedQuote,
  calculateEligibleCashback,
  DEFAULT_CARRIER_DIVISOR_RULES,
  RawPackageInput,
  recalculateVerifiedQuoteFromPackages,
} from '../utils/shipping-calculator';
import {
  canApproveAndPayQuote,
  createQuoteRevision,
  allocateGroupPayment,
} from '../utils/quote-lifecycle';
import {
  generateUniqueReference,
  createOtpChallenge,
  verifyOtpChallenge,
  buildGenericRecoveryNotice,
  findQuotesAndUnpaidShipmentsByContact,
} from '../utils/reference-engine';
import {
  buildWeightPaymentAdjustment,
  canHandoverShipmentToCarrier,
  evaluateShipmentFinancialSettlement,
  issueShipmentOverpaymentCreditIdempotently,
  applyPostApprovalQuoteChange,
} from '../utils/adjustment-engine';
import {
  canReleaseDeliveryReward,
  getCustomerSeparatedBalances,
  SeparatedCustomerBalances,
  allocateCheckoutDeductions,
  resolveCheckoutReservationOutcome,
} from '../utils/rewards-engine';
import { canSubmitReviewForShipment } from '../utils/review-rules';
import { validatePickupEligibility } from '../utils/collection-options';

interface DemoContextType {
  environmentMode: AppEnvironmentMode;
  setEnvironmentMode: (mode: AppEnvironmentMode) => void;
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  activeCustomerKey: 'verified' | 'pending' | 'new' | 'business';
  setActiveCustomerKey: (key: 'verified' | 'pending' | 'new' | 'business') => void;
  currentCustomer: CustomerProfile;
  updateCurrentCustomer: (updates: Partial<CustomerProfile>) => void;
  shipments: ShipmentRecord[];
  reviews: CustomerReview[];
  tickets: SupportTicket[];
  cashbackLedger: CashbackLedgerItem[];
  referrals: ReferralItem[];
  pickupJobs: PickupJob[];
  updatePickupJob: (jobId: string, updates: Partial<PickupJob>) => void;
  // Staff accounts & Provisioning
  staffMembers: StaffAccount[];
  currentStaffUser: StaffAccount | null;
  setCurrentStaffUser: (user: StaffAccount | null) => void;
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  createStaffAccount: (
    staff: Omit<StaffAccount, 'id' | 'staffId' | 'createdAt' | 'lastActive'>
  ) => { success: boolean; message: string; account?: StaffAccount };
  updateStaffStatus: (staffId: string, status: StaffStatus) => { success: boolean; message: string };
  resetStaffPassword: (staffId: string) => { success: boolean; message: string };
  hasPermission: (permission: Permission) => boolean;
  customers: Record<string, CustomerProfile>;
  branches: Branch[];
  activeBranchFilter: string;
  setActiveBranchFilter: (b: string) => void;
  switchDemoStaff: (staffId: string) => void;
  reassignStaffBranch: (staffId: string, newBranchId: string, reason: string) => { success: boolean; message: string };
  reassignPickupJob: (jobId: string, newAgentId: string, reason: string) => { success: boolean; message: string };
  reassignShipmentBranch: (shipmentId: string, newBranchId: string, reason: string) => { success: boolean; message: string };
  updatePickupJobStatus: (
    jobId: string,
    status: PickupJob['status'],
    notes?: string,
    weight?: number,
    dims?: { length: number; width: number; height: number }
  ) => void;
  activeAdminTab:
    | 'overview'
    | 'shipments'
    | 'front_desk'
    | 'pickup_operations'
    | 'branches'
    | 'customers'
    | 'quotes_payments'
    | 'receipts'
    | 'support'
    | 'staff'
    | 'audit'
    | 'settings'
    | 'approvals'
    | 'security'
    | 'payout'
    | 'kyc'
    | 'reviews'
    | 'finance';
  setActiveAdminTab: (tab: any) => void;
  // Owner Governance & Financial Control
  approvalRequests: SecurityApprovalRequest[];
  securityAlerts: SecurityAlert[];
  payoutSettings: CompanyPayoutSettings;
  submitApprovalRequest: (
    req: Omit<SecurityApprovalRequest, 'id' | 'requestedAt' | 'status'>
  ) => { success: boolean; message: string; request?: SecurityApprovalRequest };
  reviewApprovalRequest: (
    requestId: string,
    status: 'approved' | 'rejected',
    reviewNote: string
  ) => { success: boolean; message: string };
  resolveSecurityAlert: (alertId: string) => void;
  updatePayoutSettings: (newSettings: Partial<CompanyPayoutSettings>) => { success: boolean; message: string };
  revokeStaffSession: (staffId: string) => { success: boolean; message: string };
  recordUnauthorizedAttempt: (type: SecurityAlert['type'], details: string) => void;
  exportCustomerData: () => { success: boolean; message: string; data?: unknown };
  // Loading skeleton state
  isLoading: boolean;
  loadingMessage: string;
  triggerLoading: (message?: string, durationMs?: number) => void;
  // Actions
  resetDemoData: () => void;
  updateCustomerKyc: (
    status: KycStatus,
    idType?: string,
    docName?: string,
    meta?: {
      verificationMethod?: 'nin' | 'bvn' | 'passport';
      maskedId?: string;
      lastResult?: string;
    }
  ) => void;
  addShipment: (newShipment: ShipmentRecord) => void;
  updateShipmentStatus: (shipmentId: string, updates: Partial<ShipmentRecord>) => void;
  cancelShipment: (shipmentId: string) => { success: boolean; message: string };
  triggerOverdueAlert: (shipmentId: string) => void;
  resolveOverdueAlert: (shipmentId: string, note: string) => void;
  submitReview: (
    review: Omit<CustomerReview, 'id' | 'createdAt'>,
    options?: { isVerifiedGuest?: boolean }
  ) => { success: boolean; message: string };
  moderateReview: (
    reviewId: string,
    status: 'published' | 'rejected' | 'disputed',
    response?: string,
    disputeNote?: string
  ) => void;
  // Booking Groups, Quote Revisions, Measurement Reviews, & Drop-off Intake
  bookingGroups: BookingGroup[];
  measurementReviews: MeasurementReviewRequest[];
  createBookingGroup: (params: {
    senderName: string;
    senderPhone: string;
    senderEmail?: string;
    sharedCollectionAddress: string;
    collectionMethod: CollectionMethod;
    collectionBranchId?: string;
    scheduledDate?: string;
    scheduledSlot?: string;
    pickupFeeNgn: number;
    priorityWindow?: string;
    items: Array<{
      originCountry: string;
      originCity: string;
      destinationCountry: string;
      destinationCity: string;
      recipientName: string;
      recipientPhone: string;
      recipientAddress: string;
      serviceTier: 'standard' | 'priority';
      contentsDescription: string;
      packageCount: number;
      declaredWeightKg: number;
      declaredDimensions?: { length: number; width: number; height: number };
      declaredValueNgn: number;
      isFragile?: boolean;
      fragileHandlingNotes?: string;
      collectionAddressOverride?: string;
      quote: ShipmentRecord['quote'];
    }>;
    sourceQuoteRef?: string;
    idempotencyKey?: string;
  }) => { group: BookingGroup; shipments: ShipmentRecord[] };
  // Phase 1-4: Separated Quotes (QTE), OTP Recovery, Weight Payment Adjustments, Receipts, Feature Flags & Role Notifications
  quotes: QuoteRecord[];
  saveGuestQuote: (params: {
    type: 'instant_estimate' | 'manual_enquiry';
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    senderState?: string;
    senderCity?: string;
    sharedCollectionAddress?: string;
    collectionMethod?: CollectionMethod;
    items: QuoteItemDraft[];
    quoteBreakdown?: ShipmentRecord['quote'];
    totalEstimatedNgn: number;
    enquiryNotes?: string;
    idempotencyKey?: string;
  }) => QuoteRecord;
  respondToManualQuoteEnquiry: (params: {
    quoteId: string;
    quotedTotalNgn: number;
    staffQuoteNotes: string;
  }) => { success: boolean; message: string };
  otpChallenges: OtpChallengeRecord[];
  otpDeliveryLogs: OtpDeliveryLog[];
  requestOtpForContact: (params: {
    contactValue: string;
    channel: 'email' | 'sms' | 'whatsapp';
    targetRef?: string;
    purpose: OtpDeliveryLog['purpose'];
  }) => {
    allowed: boolean;
    cooldownRemainingSeconds: number;
    challengeId?: string;
    simulatedOtp?: string;
    userMessage: string;
    deliveryStatus: OtpDeliveryLog['status'];
  };
  verifyOtpForChallenge: (params: {
    challengeId: string;
    code: string;
  }) => { verified: boolean; locked: boolean; expired: boolean; remainingAttempts: number; message: string };
  recoverQuotesWithContact: (contactValue: string) => {
    genericNotice: string;
    challengeId?: string;
    simulatedOtp?: string;
    allowed: boolean;
    cooldownRemainingSeconds: number;
  };
  getRecoveredItemsAfterOtp: (contactValue: string) => {
    quotes: QuoteRecord[];
    shipments: ShipmentRecord[];
  };
  paymentAdjustments: PaymentAdjustmentRecord[];
  settlePaymentAdjustment: (params: {
    adjustmentId: string;
    paymentMethod: string;
    useWalletNgn?: number;
    useCreditsNgn?: number;
    useAccountCreditNgn?: number;
    useCashbackNgn?: number;
    useBonusNgn?: number;
    paystackOutcome?: PaystackOutcome;
  }) => { success: boolean; message: string; receipt?: PaymentReceiptRecord };
  paymentReceipts: PaymentReceiptRecord[];
  staffNotifications: StaffNotification[];
  markStaffNotificationRead: (id: string) => void;
  adminFeatureFlags: AdminFeatureFlags;
  updateAdminFeatureFlags: (updates: Partial<AdminFeatureFlags>, reason: string) => void;
  // Separated Balances, Divisor Rules, Facility Receipt, Quote Rejection & Notifications
  carrierDivisorRules: CarrierDivisorRule[];
  updateCarrierDivisorRule: (ruleId: string, updates: Partial<CarrierDivisorRule>, reason: string) => { success: boolean; message: string };
  shipmentCredits: ShipmentCreditRecord[];
  bonusGrants: BonusGrantRecord[];
  customerNotifications: CustomerNotification[];
  emitCustomerNotification: (params: {
    eventKey: string;
    triggerType: NotificationTriggerType;
    customerId: string;
    title: string;
    message: string;
    relatedReference?: string;
    channel?: 'in_app' | 'email' | 'sms';
  }) => void;
  markCustomerNotificationRead: (id: string) => void;
  markAllCustomerNotificationsRead: (customerId?: string) => void;
  getCustomerBalancesSnapshot: (customerId?: string) => SeparatedCustomerBalances;
  confirmFacilityReceipt: (params: {
    jobId: string;
    packageCountReceived: number;
    visibleCondition: FacilityReceiptRecord['visibleCondition'];
    packageDescription: string;
    discrepancies?: string;
    photoUrls?: string[];
  }) => { success: boolean; message: string };
  markPickupFailed: (jobId: string, reason: string) => { success: boolean; message: string };
  rejectRevisedQuote: (shipmentId: string, reason: string) => { success: boolean; message: string };
  archiveShipment: (shipmentId: string) => { success: boolean; message: string };
  requestMeasurementReview: (shipmentId: string, reason: string) => { success: boolean; message: string };
  issueRevisedQuoteVersion: (params: {
    shipmentId: string;
    measuredWeightKg: number;
    measuredDimensions: { length: number; width: number; height: number };
    reason: string;
    changedBy?: string;
    packages?: RawPackageInput[];
    divisorRuleId?: string;
    selectedServiceTier?: ServiceTier;
  }) => { success: boolean; message: string; newVersion?: QuoteVersion };
  resolveMeasurementReviewUphold: (reviewId: string, staffResolutionNote: string) => { success: boolean; message: string };
  approveAndPayShipmentQuote: (params: {
    shipmentId: string;
    useWalletNgn: number;
    useCreditsNgn: number;
    promoCode?: string;
    paymentMethod: string;
    useAccountCreditNgn?: number;
    useCashbackNgn?: number;
    useBonusNgn?: number;
    selectedServiceTier?: ServiceTier;
    paystackOutcome?: PaystackOutcome;
  }) => { success: boolean; message: string };
  approveAndPayGroupQuote: (params: {
    bookingGroupId: string;
    selectedShipmentIds: string[];
    useWalletNgn: number;
    useCreditsNgn: number;
    promoCode?: string;
    paymentMethod: string;
  }) => { success: boolean; message: string };
  markDropoffReceivedAtBranch: (shipmentId: string, branchId: string, notes?: string) => { success: boolean; message: string };
  releaseDeliveryRewards: (shipmentId: string) => { released: boolean; amountNgn: number; message: string };
  createSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages' | 'status'> & { status?: SupportTicketStatus }, initialMessage: string) => void;
  addTicketMessage: (ticketId: string, sender: 'customer' | 'support', text: string) => void;
  redeemCashback: (amountNgn: number) => { success: boolean; message: string };
  applyShippingCredits: (amountNgn: number, shipmentTracking?: string) => { success: boolean; message: string };
  reverseShippingCredits: (amountNgn: number, shipmentTracking?: string) => void;
  selectedShipmentForTracking: string | null;
  setSelectedShipmentForTracking: (id: string | null) => void;
  activePublicNav: string;
  setActivePublicNav: (nav: string) => void;
  activeCustomerTab: string;
  setActiveCustomerTab: (tab: string) => void;
  // SwiftShare (traveller-assisted delivery)
  swiftShareRequests: TravelCarryRequest[];
  travelCarryRequests: TravelCarryRequest[];
  addSwiftShareRequest: (req: Omit<TravelCarryRequest, 'id' | 'createdAt'>) => string;
  addTravelCarryRequest: (req: Omit<TravelCarryRequest, 'id' | 'createdAt'>) => string;
  updateSwiftShareStatus: (id: string, status: TravelCarryStatus, updates?: Partial<TravelCarryRequest>) => void;
  updateTravelCarryStatus: (id: string, status: TravelCarryStatus, updates?: Partial<TravelCarryRequest>) => void;
  flagSwiftShareSafetyHold: (id: string, reason: string) => void;
  flagTravelCarrySafetyHold: (id: string, reason: string) => void;
  confirmSwiftShareDeliveryAndReleasePayout: (id: string) => void;
  confirmTravelCarryDeliveryAndReleasePayout: (id: string) => void;
  travellerInterests: TravellerInterest[];
  registerTravellerInterest: (interest: Omit<TravellerInterest, 'id' | 'createdAt'>) => void;
  // Address Book
  addressBook: AddressBookEntry[];
  addAddressBookEntry: (entry: Omit<AddressBookEntry, 'id' | 'createdAt'>) => void;
  deleteAddressBookEntry: (id: string) => void;
  // Shipment Templates
  shipmentTemplates: ShipmentTemplate[];
  addShipmentTemplate: (template: Omit<ShipmentTemplate, 'id' | 'createdAt'>) => void;
  deleteShipmentTemplate: (id: string) => void;
  // Repeat Shipment
  repeatShipmentData: ShipmentRecord | null;
  setRepeatShipmentData: (shipment: ShipmentRecord | null) => void;
  // Cargo Enquiries
  cargoEnquiries: CargoEnquiry[];
  addCargoEnquiry: (enquiry: Omit<CargoEnquiry, 'id' | 'enquiryReference' | 'status' | 'createdAt'>) => string;
  // Business Team & Permissions
  businessTeam: BusinessTeamMember[];
  addBusinessTeamMember: (member: Omit<BusinessTeamMember, 'id' | 'joinedAt'>) => void;
  updateBusinessTeamRole: (id: string, role: BusinessTeamMember['role']) => void;
  deleteBusinessTeamMember: (id: string) => void;
  // Support Claims
  supportClaims: SupportClaim[];
  addSupportClaim: (claim: Omit<SupportClaim, 'id' | 'claimNumber' | 'status' | 'createdAt' | 'updatedAt'>) => string;
  updateSupportClaimStatus: (claimId: string, status: ClaimStatus, note: string, approvedAmountNgn?: number) => void;
  // Shipment Protection
  protectionConfig: ProtectionConfig;
  updateProtectionConfig: (updated: ProtectionConfig, reason: string) => void;
  protectionCertificates: ProtectionCertificateRecord[];
  addProtectionCertificate: (cert: ProtectionCertificateRecord) => void;
  // Branch Desk Operations & Walk-in Counter
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
  searchCustomers: (query: string) => CustomerProfile[];
  registerWalkInCustomer: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
    country?: string;
    kycStatus?: KycStatus;
  }) => {
    success: boolean;
    customer: CustomerProfile;
    isDuplicate: boolean;
    message: string;
    inviteLink: string;
  };
  handoverManifests: HandoverManifestRecord[];
  createHandoverManifest: (
    data: Omit<HandoverManifestRecord, 'id' | 'manifestNumber' | 'handedOverAt'>
  ) => HandoverManifestRecord;
  // Customer Consents & Auditable Records
  customerConsents: CustomerConsentRecord[];
  recordCustomerConsent: (record: Omit<CustomerConsentRecord, 'id' | 'timestamp'>) => void;
  recordBulkConsents: (records: Array<Omit<CustomerConsentRecord, 'id' | 'timestamp'>>) => void;
  // Centralized Operations Pickup Management
  bookPickupRequest: (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    alternateContactName?: string;
    alternateContactPhone?: string;
    pickupAddress: string;
    state?: string;
    city?: string;
    country?: string;
    landmark?: string;
    preferredDate: string;
    preferredTimeSlot?: string;
    pickupType?: 'standard' | 'priority';
    pickupFeeNgn?: number;
    estimatedWindow?: string;
    packagePhotoUrl?: string;
    estimatedSizeCategory?: 'small' | 'medium' | 'large' | 'multiple';
    packageDescription: string;
    packageCount: number;
    estimatedWeightKg?: number;
    specialInstructions?: string;
    isFragile?: boolean;
    fragileNotes?: string;
    destinationCountry?: string;
    destinationCity?: string;
    linkedQuoteRef?: string;
    linkedShipmentTracking?: string;
    consents: Array<{ category: any; statement: string; policyVersion: string }>;
    marketingOptIn: boolean;
  }) => { success: boolean; message: string; pickup?: PickupJob; trackingNumber?: string };
  assignPickupHandler: (
    jobId: string,
    handlerType: 'staff' | 'external_partner' | 'manual',
    handlerName: string,
    handlerPhone: string,
    scheduledTime: string,
    notes?: string
  ) => { success: boolean; message: string };
  confirmDoorstepCollection: (
    jobId: string,
    packageCount: number,
    visibleCondition: 'good' | 'minor_outer_scuff' | 'carton_damaged' | 'unsealed',
    customerSignatureName: string,
    notes?: string,
    photos?: string[]
  ) => { success: boolean; message: string };
  confirmFacilityArrivalAndWeigh: (
    jobId: string,
    actualWeightKg: number,
    dimensions: { length: number; width: number; height: number },
    repackagingApplied: boolean,
    conditionNotes?: string,
    options?: {
      packages?: RawPackageInput[];
      divisorRuleId?: string;
      selectedServiceTier?: ServiceTier;
    }
  ) => { success: boolean; message: string; chargeableWeightKg: number; newQuote?: any };
  reschedulePickup: (jobId: string, newDate: string, newTimeSlot: string, reason: string) => { success: boolean; message: string };
  cancelPickup: (jobId: string, reason: string) => { success: boolean; message: string };
  // Customer Wallet & Double-Entry Ledger
  walletTransactions: WalletTransaction[];
  topUpWallet: (amountNgn: number, paymentMethod: string, isDemo?: boolean) => { success: boolean; message: string; transaction?: WalletTransaction };
  payWithWallet: (shipmentId: string, walletAmount: number, cashbackAmount: number, promoDiscount: number) => { success: boolean; message: string };
  processWalletRefund: (shipmentId: string, amountNgn: number, reason: string) => { success: boolean; message: string };
  // Promo Campaigns & Configurable Cashback
  promoCampaigns: PromoCampaign[];
  addPromoCampaign: (camp: Omit<PromoCampaign, 'id' | 'createdAt' | 'timesUsed'>) => { success: boolean; message: string; campaign?: PromoCampaign };
  updatePromoCampaign: (id: string, updates: Partial<PromoCampaign>) => { success: boolean; message: string };
  validatePromoCode: (code: string, quoteAmountNgn: number) => { valid: boolean; discountNgn: number; message: string; campaign?: PromoCampaign };
  cashbackConfig: CashbackCampaignConfig;
  updateCashbackConfig: (updates: Partial<CashbackCampaignConfig>, reason: string) => { success: boolean; message: string };
  // Operational Handovers & Clarifications
  operationalHandovers: OperationalHandoverRecord[];
  createOperationalHandover: (data: Omit<OperationalHandoverRecord, 'id' | 'manifestNumber' | 'dispatchedAt' | 'status'>) => OperationalHandoverRecord;
  confirmOperationalHandoverReceipt: (id: string, receiverNotes?: string, discrepancyCount?: number) => { success: boolean; message: string };
  shipmentClarifications: ShipmentClarificationRecord[];
  createClarification: (data: Omit<ShipmentClarificationRecord, 'id' | 'raisedAt' | 'status'>) => ShipmentClarificationRecord;
  resolveClarification: (id: string, resolutionNotes: string) => { success: boolean; message: string };
  // Customer Service Support Ticket dialogue
  replySupportTicket: (ticketId: string, text: string, isInternalNote?: boolean, senderRole?: string, senderName?: string) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicketStatus) => void;
  escalateTicket: (ticketId: string, reason: string, escalateTo: string) => void;
  rateTicketSatisfaction: (ticketId: string, rating: number, feedback?: string) => void;
  // Customer Refund Requests (Deposited balance refund back to bank account)
  refundRequests: RefundRequestRecord[];
  submitRefundRequest: (amountNgn: number, bankName: string, accountNumber: string, accountName: string, reason: string) => { success: boolean; message: string; request?: RefundRequestRecord };
  updateRefundStatus: (requestId: string, newStatus: RefundStatus, adminNotes?: string) => { success: boolean; message: string };
  // Shipment Cancellation lifecycle (Stages A, B, C, D)
  requestShipmentCancellation: (shipmentId: string, reason: string) => { success: boolean; message: string; stage?: 'A' | 'B' | 'C' | 'D' };
  // DHL Carrier Integration
  dhlConfig: DhlConfig;
  updateDhlConfig: (updates: Partial<DhlConfig>) => void;
  testDhlConnection: () => DhlConnectionTestResult;
  bookDhlCarrierForShipment: (shipmentId: string) => DhlShipmentCreationResult;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const INITIAL_PICKUP_JOBS: PickupJob[] = [
  {
    id: 'job_01',
    shipmentId: 'ship_01',
    trackingNumber: 'SWV-2026-NG8491',
    pickupReference: 'PKP-2026-IKJ-8491',
    senderName: 'Amara Okafor (Lekki Artisan Creations Ltd)',
    senderPhone: '+234 803 555 0192',
    senderEmail: 'amara.okafor@crafts.ng',
    senderAddress: 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos',
    state: 'Lagos',
    city: 'Lekki',
    landmark: 'Near Ebeano Supermarket',
    branchId: 'branch_ikeja',
    branchName: 'Ikeja Cargo Hub (Lagos Mainland)',
    scheduledSlot: '10:00 AM - 1:00 PM',
    scheduledDate: '2026-11-06',
    bookingConfirmedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    collectionDeadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    packageCount: 2,
    packageDescription: 'Handmade Adire Textiles and Craft Goods',
    declaredWeightKg: 4.5,
    declaredDimensions: { length: 35, width: 25, height: 20 },
    verifiedWeightKg: 4.5,
    verifiedDimensions: { length: 35, width: 25, height: 20 },
    status: 'handed_over',
    collectionHandlerType: 'staff',
    collectionHandlerName: 'Emeka Nwosu',
    collectionHandlerPhone: '+234 803 300 0003',
    assignedAgentId: 'staff_03',
    assignedAgentName: 'Emeka Nwosu',
    assigningStaffId: 'staff_04',
    assigningStaffName: 'Kemi Adeleke',
    assignedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    inspectionStatus: 'passed',
    handoverStatus: 'handed_over',
    handoverConfirmedBy: 'Chioma Eze (Front Desk Intake)',
    handoverTimestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    collectionConfirmedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    collectionPackageCount: 2,
    collectionVisibleCondition: 'good',
    collectionCustomerSigned: true,
    collectionCustomerName: 'Amara Okafor',
    facilityReceivedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    facilityStaffName: 'Chioma Eze',
    facilityActualWeightKg: 4.5,
    facilityDimensions: { length: 35, width: 25, height: 20 },
    facilityVolumetricWeightKg: 3.5,
    facilityChargeableWeightKg: 4.5,
    finalQuoteGenerated: true,
    notes: 'Calibrated facility scale verified. Tamper seal verified.',
  },
  {
    id: 'job_02',
    shipmentId: 'ship_03',
    trackingNumber: 'SWV-2026-NG5519',
    pickupReference: 'PKP-2026-IKJ-5519',
    senderName: 'Fatima Bello (Kano Textile Collective)',
    senderPhone: '+234 802 444 8821',
    senderEmail: 'fatima@kanotextiles.ng',
    senderAddress: '42 Bompai Industrial Area, Kano',
    state: 'Kano',
    city: 'Kano',
    landmark: 'Bompai Gate 3',
    branchId: 'branch_ikeja',
    branchName: 'Ikeja Cargo Hub (Lagos Mainland)',
    scheduledSlot: '9:00 AM - 12:00 PM',
    scheduledDate: '2026-11-06',
    bookingConfirmedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    collectionDeadline: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
    packageCount: 1,
    packageDescription: 'Woven Tapestries and Cotton Fabric',
    declaredWeightKg: 3.5,
    declaredDimensions: { length: 30, width: 20, height: 15 },
    verifiedWeightKg: 5.2,
    verifiedDimensions: { length: 38, width: 25, height: 20 },
    status: 'arrived_at_facility',
    collectionHandlerType: 'external_partner',
    collectionHandlerName: 'Red Star Express Regional Linehaul',
    collectionHandlerPhone: '+234 802 111 9988',
    assignedAgentId: 'staff_03',
    assignedAgentName: 'Emeka Nwosu',
    assigningStaffId: 'staff_04',
    assigningStaffName: 'Kemi Adeleke',
    assignedAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    inspectionStatus: 'discrepancy',
    handoverStatus: 'pending',
    collectionConfirmedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    collectionPackageCount: 1,
    collectionVisibleCondition: 'minor_outer_scuff',
    facilityReceivedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    facilityStaffName: 'Chioma Eze',
    facilityActualWeightKg: 5.2,
    facilityDimensions: { length: 38, width: 25, height: 20 },
    facilityVolumetricWeightKg: 3.8,
    facilityChargeableWeightKg: 5.2,
    notes: 'Physical weighing at facility revealed difference (+1.7kg). Re-quote flagged for consignor approval.',
  },
  {
    id: 'job_03',
    shipmentId: 'ship_02',
    trackingNumber: 'SWV-2026-NG1088',
    pickupReference: 'PKP-2026-VI-1088',
    senderName: 'Babatunde Adeleke (Lekki Heritage Exports PLC)',
    senderPhone: '+234 802 888 7766',
    senderEmail: 'babatunde@heritage.ng',
    senderAddress: 'Plot 8, Commercial Ave, Lekki Free Trade Zone, Lagos',
    state: 'Lagos',
    city: 'Lekki',
    landmark: 'FTZ Gate 2',
    branchId: 'branch_vi',
    branchName: 'Victoria Island & Lekki Center',
    scheduledSlot: '11:00 AM - 2:00 PM',
    scheduledDate: '2026-11-06',
    bookingConfirmedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    collectionDeadline: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
    packageCount: 4,
    packageDescription: 'Commercial Leather Export Samples',
    declaredWeightKg: 14.7,
    declaredDimensions: { length: 45, width: 35, height: 25 },
    status: 'collection_in_progress',
    collectionHandlerType: 'staff',
    collectionHandlerName: 'Babatunde Lawal',
    collectionHandlerPhone: '+234 803 800 0008',
    assignedAgentId: 'staff_08',
    assignedAgentName: 'Babatunde Lawal',
    assigningStaffId: 'staff_01',
    assigningStaffName: 'Tunde Balogun',
    assignedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    inspectionStatus: 'pending',
    handoverStatus: 'pending',
    notes: 'Handler en route to Free Trade Zone for commercial export batch collection.',
  },
  {
    id: 'job_04',
    shipmentId: 'ship_04',
    trackingNumber: 'SWV-2026-NG7720',
    pickupReference: 'PKP-2026-VI-7720',
    senderName: 'Oluwaseun Adeleke',
    senderPhone: '+234 701 999 3320',
    senderEmail: 'seun.adeleke@gmail.com',
    senderAddress: '15 Bishop Oluwole Street, Victoria Island, Lagos',
    state: 'Lagos',
    city: 'Victoria Island',
    landmark: 'Behind Eko Hotel',
    branchId: 'branch_vi',
    branchName: 'Victoria Island & Lekki Center',
    scheduledSlot: '2:00 PM - 5:00 PM',
    scheduledDate: '2026-11-06',
    bookingConfirmedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    collectionDeadline: new Date(Date.now() + 19 * 3600 * 1000).toISOString(),
    packageCount: 1,
    packageDescription: 'Legal Documents and Fabric Samples',
    declaredWeightKg: 2.1,
    declaredDimensions: { length: 25, width: 20, height: 10 },
    status: 'scheduled',
    collectionHandlerType: 'staff',
    collectionHandlerName: 'Babatunde Lawal',
    collectionHandlerPhone: '+234 803 800 0008',
    assignedAgentId: 'staff_08',
    assignedAgentName: 'Babatunde Lawal',
    assigningStaffId: 'staff_07',
    assigningStaffName: 'Damilola Adeyemi',
    assignedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    inspectionStatus: 'pending',
    handoverStatus: 'pending',
    notes: 'Scheduled for afternoon collection.',
  },
  {
    id: 'job_05',
    shipmentId: 'ship_05',
    trackingNumber: 'SWV-2026-NG9912',
    pickupReference: 'PKP-2026-IKJ-9912',
    senderName: 'Dr. Ifeanyi Okeke',
    senderPhone: '+234 803 777 4422',
    senderEmail: 'ifeanyi.okeke@unilag.edu.ng',
    senderAddress: '22 Allen Avenue, Ikeja, Lagos',
    state: 'Lagos',
    city: 'Ikeja',
    landmark: 'Opposite Oshopey Plaza',
    branchId: 'branch_ikeja',
    branchName: 'Ikeja Cargo Hub (Lagos Mainland)',
    scheduledSlot: '11:00 AM - 2:00 PM',
    scheduledDate: '2026-11-07',
    bookingConfirmedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    collectionDeadline: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
    packageCount: 2,
    packageDescription: 'Academic Journals and Historical Folios',
    declaredWeightKg: 5.0,
    declaredDimensions: { length: 30, width: 25, height: 20 },
    status: 'booking_received',
    inspectionStatus: 'pending',
    handoverStatus: 'pending',
    notes: 'New pickup booking received via consignor portal. Awaiting Operations Admin scheduling.',
  },
  {
    id: 'job_06',
    shipmentId: 'ship_06',
    trackingNumber: 'SWV-2026-NG4110',
    pickupReference: 'PKP-2026-VI-4110',
    senderName: 'Folake Adeyemi',
    senderPhone: '+234 803 666 9911',
    senderEmail: 'folake@lagosboutique.com',
    senderAddress: '12 Akin Adesola Street, Victoria Island, Lagos',
    state: 'Lagos',
    city: 'Victoria Island',
    landmark: 'Beside Zenith Bank Head Office',
    branchId: 'branch_vi',
    branchName: 'Victoria Island & Lekki Center',
    scheduledSlot: '10:00 AM - 1:00 PM',
    scheduledDate: '2026-11-06',
    bookingConfirmedAt: new Date(Date.now() - 23 * 3600 * 1000).toISOString(),
    collectionDeadline: new Date(Date.now() + 1 * 3600 * 1000).toISOString(), // Approaching 24h deadline!
    packageCount: 1,
    packageDescription: 'Designer Sample Gowns',
    declaredWeightKg: 3.2,
    declaredDimensions: { length: 40, width: 30, height: 15 },
    status: 'scheduled',
    collectionHandlerType: 'external_partner',
    collectionHandlerName: 'GIG Logistics Courier Dispatch',
    collectionHandlerPhone: '+234 809 333 4411',
    assignedAgentId: 'partner_gig',
    assignedAgentName: 'GIG Logistics (Tunde S.)',
    assignedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    inspectionStatus: 'pending',
    handoverStatus: 'pending',
    notes: 'Approaching 24-hour collection deadline! Courier dispatched.',
  },
  {
    id: 'job_07',
    shipmentId: 'ship_07',
    trackingNumber: 'SWV-2026-NG2021',
    pickupReference: 'PKP-2026-IKJ-2021',
    senderName: 'Chinedu Eze',
    senderPhone: '+234 802 333 1199',
    senderEmail: 'chinedu.eze@auto.ng',
    senderAddress: '8 Toyin Street, Ikeja, Lagos',
    state: 'Lagos',
    city: 'Ikeja',
    landmark: 'Near Waterparks',
    branchId: 'branch_ikeja',
    branchName: 'Ikeja Cargo Hub (Lagos Mainland)',
    scheduledSlot: '9:00 AM - 12:00 PM',
    scheduledDate: '2026-11-07',
    bookingConfirmedAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
    collectionDeadline: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // Overdue / Rescheduled!
    packageCount: 1,
    packageDescription: 'Precision Mechanical Parts',
    declaredWeightKg: 6.8,
    declaredDimensions: { length: 30, width: 25, height: 25 },
    status: 'rescheduled',
    collectionHandlerType: 'manual',
    collectionHandlerName: 'Bayo Adeleke (Swiftvero Area Driver)',
    collectionHandlerPhone: '+234 803 999 1234',
    inspectionStatus: 'pending',
    handoverStatus: 'pending',
    notes: 'Consignor was unavailable at premises during first arrival. Rescheduled with customer consent for tomorrow morning.',
  },
];

const INITIAL_CONSENT_RECORDS: CustomerConsentRecord[] = [
  {
    id: 'cst_01',
    customerId: 'cust_01',
    customerName: 'Amara Okafor',
    customerEmail: 'amara.okafor@crafts.ng',
    category: 'registration',
    policyKey: 'terms',
    policyVersion: 'v2.2',
    statement: 'I have read and agree to Swiftvero Express Terms and Conditions and Privacy Policy.',
    status: 'accepted',
    timestamp: '2026-10-15T09:12:00Z',
    auditDetails: 'Consignor online onboarding accepted via web portal.',
  },
  {
    id: 'cst_02',
    customerId: 'cust_01',
    customerName: 'Amara Okafor',
    bookingId: 'job_01',
    shipmentTrackingNumber: 'SWV-2026-NG8491',
    category: 'pickup_booking',
    policyKey: 'pickup',
    policyVersion: 'v2.4',
    statement: '11 Statutory Pickup Acknowledgements: Free pickup within 24 hours, separate facility weighing, accurate declaration, prohibited goods check, and consignment availability.',
    status: 'accepted',
    timestamp: '2026-10-21T08:30:00Z',
    auditDetails: 'Consignor confirmed doorstep collection booking terms.',
  },
  {
    id: 'cst_03',
    customerId: 'cust_01',
    customerName: 'Amara Okafor',
    shipmentTrackingNumber: 'SWV-2026-NG8491',
    category: 'quotation_approval',
    policyKey: 'pricing',
    policyVersion: 'v2.0',
    statement: 'I have reviewed the confirmed package weight, applicable shipping service, selected optional services and total amount payable. I approve this quotation.',
    status: 'accepted',
    timestamp: '2026-10-21T15:20:00Z',
    auditDetails: 'Final quotation approved after facility scale inspection.',
  },
  {
    id: 'cst_04',
    customerId: 'cust_01',
    customerName: 'Amara Okafor',
    shipmentTrackingNumber: 'SWV-2026-NG8491',
    category: 'cargo_protection',
    policyKey: 'protection',
    policyVersion: 'v2.1',
    statement: 'I have reviewed the applicable cargo protection terms, eligibility, exclusions, declared value and compensation limits.',
    status: 'accepted',
    timestamp: '2026-10-21T15:22:00Z',
    auditDetails: 'Premium protection option B selected (1.5% underwritten by Leadway Assurance).',
  },
  {
    id: 'cst_05',
    customerId: 'cust_01',
    customerName: 'Amara Okafor',
    shipmentTrackingNumber: 'SWV-2026-NG8491',
    category: 'payment_authorization',
    policyKey: 'payment',
    policyVersion: 'v2.2',
    statement: 'I confirm that I have reviewed the final amount payable and authorize payment for the selected shipping service and optional services.',
    status: 'accepted',
    timestamp: '2026-10-21T15:25:00Z',
    auditDetails: 'Payment processed and verified.',
  },
];

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [environmentMode, setEnvironmentMode] = useState<AppEnvironmentMode>('demo');
  const [role, setRoleState] = useState<DemoRole>('visitor');
  const [activeCustomerKey, setActiveCustomerKey] = useState<'verified' | 'pending' | 'new' | 'business'>('verified');
  const [customers, setCustomers] = useState<Record<string, CustomerProfile>>(INITIAL_CUSTOMERS);
  const [quotes, setQuotes] = useState<QuoteRecord[]>(INITIAL_QUOTES);
  const [otpChallenges, setOtpChallenges] = useState<OtpChallengeRecord[]>([]);
  const [otpDeliveryLogs, setOtpDeliveryLogs] = useState<OtpDeliveryLog[]>([]);
  const [paymentAdjustments, setPaymentAdjustments] = useState<PaymentAdjustmentRecord[]>(INITIAL_PAYMENT_ADJUSTMENTS);
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceiptRecord[]>(INITIAL_PAYMENT_RECEIPTS);
  const [staffNotifications, setStaffNotifications] = useState<StaffNotification[]>(INITIAL_STAFF_NOTIFICATIONS);
  const [adminFeatureFlags, setAdminFeatureFlags] = useState<AdminFeatureFlags>(DEFAULT_ADMIN_FEATURE_FLAGS);
  const [carrierDivisorRules, setCarrierDivisorRules] = useState<CarrierDivisorRule[]>(DEFAULT_CARRIER_DIVISOR_RULES);
  const [shipmentCredits, setShipmentCredits] = useState<ShipmentCreditRecord[]>(INITIAL_SHIPMENT_CREDITS);
  const [bonusGrants, setBonusGrants] = useState<BonusGrantRecord[]>(INITIAL_BONUS_GRANTS);
  const [customerNotifications, setCustomerNotifications] = useState<CustomerNotification[]>(INITIAL_CUSTOMER_NOTIFICATIONS);
  const [bookingGroups, setBookingGroups] = useState<BookingGroup[]>(INITIAL_BOOKING_GROUPS);
  const [measurementReviews, setMeasurementReviews] = useState<MeasurementReviewRequest[]>([]);
  const [shipments, setShipments] = useState<ShipmentRecord[]>(INITIAL_SHIPMENTS);
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [cashbackLedger, setCashbackLedger] = useState<CashbackLedgerItem[]>(INITIAL_CASHBACK_LEDGER);
  const [referrals, setReferrals] = useState<ReferralItem[]>(INITIAL_REFERRALS);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [activeBranchFilter, setActiveBranchFilter] = useState<string>('all');
  const [pickupJobs, setPickupJobs] = useState<PickupJob[]>(INITIAL_PICKUP_JOBS);
  const [customerConsents, setCustomerConsents] = useState<CustomerConsentRecord[]>(INITIAL_CONSENT_RECORDS);
  const [staffMembers, setStaffMembers] = useState<StaffAccount[]>(INITIAL_STAFF_ACCOUNTS);
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffAccount | null>(INITIAL_STAFF_ACCOUNTS[0]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [activeAdminTab, setActiveAdminTab] = useState<any>('overview');
  
  // Security & Owner Governance State
  const [approvalRequests, setApprovalRequests] = useState<SecurityApprovalRequest[]>(INITIAL_APPROVAL_REQUESTS);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(INITIAL_SECURITY_ALERTS);
  const [payoutSettings, setPayoutSettings] = useState<CompanyPayoutSettings>(INITIAL_PAYOUT_SETTINGS);

  // TravelCarry traveller-assisted delivery state
  const [travelCarryRequests, setTravelCarryRequests] = useState<TravelCarryRequest[]>(INITIAL_TRAVEL_CARRY_REQUESTS);
  const [travellerInterests, setTravellerInterests] = useState<TravellerInterest[]>(INITIAL_TRAVELLER_INTERESTS);

  // Address Book, Templates, Cargo, Business Team, Claims
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>(INITIAL_ADDRESS_BOOK);
  const [shipmentTemplates, setShipmentTemplates] = useState<ShipmentTemplate[]>(INITIAL_SHIPMENT_TEMPLATES);
  const [cargoEnquiries, setCargoEnquiries] = useState<CargoEnquiry[]>(INITIAL_CARGO_ENQUIRIES);
  const [businessTeam, setBusinessTeam] = useState<BusinessTeamMember[]>(INITIAL_BUSINESS_TEAM);
  const [supportClaims, setSupportClaims] = useState<SupportClaim[]>(INITIAL_SUPPORT_CLAIMS);
  const [repeatShipmentData, setRepeatShipmentData] = useState<ShipmentRecord | null>(null);

  // Shipment Protection & Underwriting state
  const [protectionConfig, setProtectionConfig] = useState<ProtectionConfig>(DEFAULT_PROTECTION_CONFIG);
  const [protectionCertificates, setProtectionCertificates] = useState<ProtectionCertificateRecord[]>([
    {
      certificateNumber: 'PROT-2026-NG8491',
      shipmentTrackingNumber: 'SWV-2026-NG8491',
      customerName: 'Amara Okafor',
      customerEmail: 'amara.okafor@crafts.ng',
      declaredValueNgn: 140000,
      protectionPlan: 'premium',
      coverageAmountNgn: 140000,
      premiumPaidNgn: 2100,
      termsVersion: 'SV-PROT-2026-v2.1',
      providerName: 'Leadway Assurance PLC (Demo Underwriting Alliance)',
      bookingDate: '2026-10-20',
      status: 'Active - In Transit',
      deductibleText: '5% or ₦10,000 (whichever is higher)',
      isSimulated: true,
    },
    {
      certificateNumber: 'PROT-2026-NG3102',
      shipmentTrackingNumber: 'SWV-2026-NG3102',
      customerName: 'Amara Okafor',
      customerEmail: 'amara.okafor@crafts.ng',
      declaredValueNgn: 135000,
      protectionPlan: 'basic',
      coverageAmountNgn: 50000,
      premiumPaidNgn: 0,
      termsVersion: 'SV-PROT-2026-v2.1',
      providerName: 'Swiftvero Standard Conditions of Carriage',
      bookingDate: '2026-10-15',
      status: 'Standard Contractual Liability',
      deductibleText: 'None for contractual standard liability limit (terms apply)',
      isSimulated: false,
    },
  ]);

  // Customer Wallet, Double-Entry Transactions, Promo Campaigns & Central Cashback Config
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(INITIAL_WALLET_TRANSACTIONS);
  const [promoCampaigns, setPromoCampaigns] = useState<PromoCampaign[]>(INITIAL_PROMO_CAMPAIGNS);
  const [cashbackConfig, setCashbackConfig] = useState<CashbackCampaignConfig>(INITIAL_CASHBACK_CONFIG);
  const [operationalHandovers, setOperationalHandovers] = useState<OperationalHandoverRecord[]>(INITIAL_OPERATIONAL_HANDOVERS);
  const [shipmentClarifications, setShipmentClarifications] = useState<ShipmentClarificationRecord[]>(INITIAL_CLARIFICATIONS);
  const [refundRequests, setRefundRequests] = useState<RefundRequestRecord[]>([
    {
      id: 'ref_01',
      reference: 'SWV-REF-849102',
      customerId: 'cust_01',
      customerName: 'Chinedu Okeke',
      customerEmail: 'chinedu.okeke@example.com',
      amountNgn: 15000,
      bankName: 'Guaranty Trust Bank (GTBank)',
      accountNumber: '0129481920',
      accountName: 'CHINEDU OKEKE',
      reason: 'Cancelled doorstep pickup refund back to original debit card funding account',
      status: 'approved',
      statusTimeline: [
        {
          status: 'request_received',
          title: 'Refund Request Received',
          description: 'Customer requested ₦15,000 refund to GTBank account',
          timestamp: '2026-11-08T09:30:00Z',
        },
        {
          status: 'under_review',
          title: 'Compliance & Origin Audit',
          description: 'Source Paystack transaction verified. Account name matches KYC record.',
          timestamp: '2026-11-08T11:00:00Z',
        },
        {
          status: 'approved',
          title: 'Refund Approved for Disbursement',
          description: 'Finance desk approved refund. Queued for bank payout.',
          timestamp: '2026-11-08T14:15:00Z',
        },
      ],
      createdAt: '2026-11-08T09:30:00Z',
      updatedAt: '2026-11-08T14:15:00Z',
    },
  ]);
  const [dhlConfig, setDhlConfig] = useState<DhlConfig>(DEFAULT_DHL_CONFIG);

  // Branch Desk Operations & Walk-in Counters
  const [activeBranchId, setActiveBranchId] = useState<string>('branch_ikeja');
  const [handoverManifests, setHandoverManifests] = useState<HandoverManifestRecord[]>([
    {
      id: 'mnf_01',
      manifestNumber: 'MNF-2026-IKJ-0081',
      branchId: 'branch_ikeja',
      branchName: 'Ikeja Cargo Hub (Lagos Mainland)',
      driverName: 'Ibrahim Danladi',
      driverPhone: '+234 803 111 2233',
      vehicleRegistration: 'KJA-482-XA (Toyota Hiace Van)',
      destinationHub: 'Murtala Muhammed Int. Airport (MMIA Cargo Sorting Facility)',
      shipmentIds: ['ship_01'],
      totalPackages: 1,
      totalWeightKg: 4.8,
      tamperSealNumbers: ['SWV-SEAL-89421', 'SWV-SEAL-89422'],
      handedOverByStaffName: 'Chioma Eze',
      handedOverAt: '2026-10-24T15:30:00Z',
      receivedByOpsSignature: 'T. Alabi (Airport Cargo Ops)',
      status: 'in_transit_to_hub',
    },
  ]);

  // Loading skeleton state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading Swiftvero Express...');

  const triggerLoading = (message = 'Loading Swiftvero Express...', durationMs = 450) => {
    setLoadingMessage(message);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, durationMs);
  };

  const setRole = (newRole: DemoRole) => {
    const roleLabels: Record<DemoRole, string> = {
      visitor: 'Public Website View',
      customer: 'Customer & Consignor Portal',
      business: 'Enterprise Commercial Desk',
      pickup_shipping: 'Workspace A: Pickup & Shipping Management',
      customer_service: 'Workspace B: Customer Service & Dialogue',
      operations_admin: 'Workspace C: Operations & Executive Admin',
      front_desk: 'Front Desk Walk-In Intake Hub',
      pickup_agent: 'Field Courier Dispatch Unit',
      operations: 'Operations Control Tower',
      finance: 'Corporate Finance & VAT Audit',
      platform_admin: 'Platform Administrator Dashboard',
      super_admin: 'Platform Administrator Dashboard',
      owner: 'Owner / Root Admin Security Center',
    };
    triggerLoading(`Switching to ${roleLabels[newRole]}...`, 400);
    setRoleState(newRole);

    // Synchronize active staff member with selected role
    if (newRole === 'owner') {
      const ownerStaff = staffMembers.find((s) => s.role === 'owner' && s.status === 'active');
      if (ownerStaff) setCurrentStaffUser(ownerStaff);
    } else if (newRole === 'platform_admin' || newRole === 'super_admin') {
      const platformAdminStaff = staffMembers.find((s) => s.role === 'platform_admin' && s.status === 'active');
      if (platformAdminStaff) setCurrentStaffUser(platformAdminStaff);
    } else if (newRole !== 'visitor' && newRole !== 'customer' && newRole !== 'business') {
      const match = staffMembers.find((s) => s.role === newRole && s.status === 'active');
      if (match) setCurrentStaffUser(match);
    }
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      isImmutable: true,
      ipAddress: '105.112.44.89 (Lagos, Nigeria)',
      ...entry,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const recordUnauthorizedAttempt = (type: SecurityAlert['type'], details: string) => {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      severity: 'critical',
      type,
      actorName: currentStaffUser?.name || 'Anonymous User',
      actorRole: role,
      timestamp: new Date().toISOString(),
      details,
      status: 'unresolved',
    };
    setSecurityAlerts((prev) => [alert, ...prev]);
    addAuditLog({
      actorName: currentStaffUser?.name || 'Unauthenticated User',
      actorRole: role,
      action: 'SECURITY_VIOLATION_BLOCKED',
      targetType: 'security',
      targetId: alert.id,
      details: `Violation blocked: ${details}`,
    });
  };

  const createStaffAccount = (
    data: Omit<StaffAccount, 'id' | 'staffId' | 'createdAt' | 'lastActive'>
  ): { success: boolean; message: string; account?: StaffAccount } => {
    // Security restriction: ONLY Owner can provision or grant Owner role
    if (data.role === 'owner' && role !== 'owner') {
      recordUnauthorizedAttempt(
        'unauthorized_elevation_attempt',
        `Attempted unauthorized creation of an Owner account by ${currentStaffUser?.name || 'Platform Admin'}.`
      );
      return {
        success: false,
        message: 'Security Violation: Only the verified Company Owner can provision Owner accounts. Incident logged.',
      };
    }

    const newIdNum = staffMembers.length + 1;
    const staffId = `SWV-STAFF-${String(newIdNum).padStart(3, '0')}`;
    const newStaff: StaffAccount = {
      id: `staff_${Date.now()}`,
      staffId,
      ...data,
      createdAt: new Date().toISOString(),
      lastActive: 'Never logged in',
      isOwner: data.role === 'owner',
    };

    setStaffMembers((prev) => [...prev, newStaff]);
    addAuditLog({
      actorName: currentStaffUser?.name || 'Company Owner',
      actorRole: role,
      action: 'STAFF_ACCOUNT_PROVISIONED',
      targetType: 'staff',
      targetId: staffId,
      details: `Provisioned ${data.role} account for ${data.name} (${data.email}) in department ${data.department}.`,
      beforeValue: 'Account: none',
      afterValue: `Role: ${data.role}, Status: active`,
    });

    return {
      success: true,
      message: `Staff account ${staffId} successfully provisioned for ${data.name}. An activation invite was dispatched.`,
      account: newStaff,
    };
  };

  const updateStaffStatus = (staffId: string, newStatus: StaffStatus): { success: boolean; message: string } => {
    const target = staffMembers.find((s) => s.id === staffId || s.staffId === staffId);
    if (!target) return { success: false, message: 'Staff member not found.' };

    // Security Restriction: Platform Admin cannot alter Owner status
    if (target.role === 'owner' && role !== 'owner') {
      recordUnauthorizedAttempt(
        'unauthorized_elevation_attempt',
        `Unauthorized attempt to suspend/modify Owner account ${target.name} by ${currentStaffUser?.name || role}.`
      );
      return {
        success: false,
        message: 'Security Violation: Platform Administrators cannot alter Owner account status. Incident logged.',
      };
    }

    // Safeguard: Cannot deactivate or suspend the last active Owner!
    if (target.role === 'owner' && (newStatus === 'deactivated' || newStatus === 'suspended')) {
      const activeOwners = staffMembers.filter((s) => s.role === 'owner' && s.status === 'active');
      if (activeOwners.length <= 1) {
        return {
          success: false,
          message: 'Operation Blocked by Safeguard: Cannot deactivate or suspend the only active Owner / Root Admin account without an approved succession plan.',
        };
      }
    }

    setStaffMembers((prev) =>
      prev.map((s) => (s.id === staffId || s.staffId === staffId ? { ...s, status: newStatus } : s))
    );

    addAuditLog({
      actorName: currentStaffUser?.name || 'Company Owner',
      actorRole: role,
      action: `STAFF_STATUS_${newStatus.toUpperCase()}`,
      targetType: 'staff',
      targetId: target.staffId,
      details: `Changed account status of ${target.name} (${target.staffId}) to ${newStatus}.`,
      beforeValue: `Status: ${target.status}`,
      afterValue: `Status: ${newStatus}`,
    });

    return {
      success: true,
      message: `Staff account ${target.staffId} status updated to ${newStatus}.`,
    };
  };

  const revokeStaffSession = (staffId: string): { success: boolean; message: string } => {
    if (role !== 'owner') {
      return {
        success: false,
        message: 'Permission Denied: Only Owner / Root Admin can execute emergency session revocation.',
      };
    }

    const target = staffMembers.find((s) => s.id === staffId || s.staffId === staffId);
    if (!target) return { success: false, message: 'Staff member not found.' };

    setStaffMembers((prev) =>
      prev.map((s) =>
        s.id === staffId || s.staffId === staffId ? { ...s, status: 'suspended', sessionRevoked: true } : s
      )
    );

    addAuditLog({
      actorName: currentStaffUser?.name || 'Sophie Balogun',
      actorRole: 'owner',
      action: 'STAFF_EMERGENCY_SESSION_REVOKED',
      targetType: 'staff',
      targetId: target.staffId,
      details: `Owner initiated emergency token and session revocation for ${target.name} (${target.staffId}). Account suspended immediately.`,
      beforeValue: `Status: ${target.status}, Session: active`,
      afterValue: 'Status: suspended, Session: revoked',
    });

    return {
      success: true,
      message: `Active tokens and sessions immediately terminated for ${target.name}. Account placed under administrative suspension.`,
    };
  };

  const resetStaffPassword = (staffId: string): { success: boolean; message: string } => {
    const target = staffMembers.find((s) => s.id === staffId || s.staffId === staffId);
    if (!target) return { success: false, message: 'Staff member not found.' };

    addAuditLog({
      actorName: currentStaffUser?.name || 'Company Owner',
      actorRole: role,
      action: 'STAFF_PASSWORD_RESET_DISPATCHED',
      targetType: 'staff',
      targetId: target.staffId,
      details: `Password recovery verification link dispatched to official work address ${target.email}.`,
    });

    return {
      success: true,
      message: `Secure password reset link dispatched to ${target.email}.`,
    };
  };

  const submitApprovalRequest = (
    req: Omit<SecurityApprovalRequest, 'id' | 'requestedAt' | 'status'>
  ): { success: boolean; message: string; request?: SecurityApprovalRequest } => {
    const newReq: SecurityApprovalRequest = {
      id: `req_${Date.now()}`,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      ...req,
    };

    setApprovalRequests((prev) => [newReq, ...prev]);

    addAuditLog({
      actorName: req.requesterName,
      actorRole: req.requesterRole,
      action: 'PRIVILEGED_APPROVAL_REQUEST_SUBMITTED',
      targetType: 'security',
      targetId: newReq.id,
      details: `Submitted ${req.type}: "${req.title}". Routed to Owner Approval Queue. Reason: ${req.reason}`,
    });

    return {
      success: true,
      message: 'Request submitted to the Company Owner Approval Queue.',
      request: newReq,
    };
  };

  const reviewApprovalRequest = (
    requestId: string,
    status: 'approved' | 'rejected',
    reviewNote: string
  ): { success: boolean; message: string } => {
    if (role !== 'owner') {
      recordUnauthorizedAttempt(
        'unauthorized_elevation_attempt',
        `Unauthorized review attempt of approval request ${requestId} by non-owner role ${role}.`
      );
      return {
        success: false,
        message: 'Permission Denied: Only the Company Owner can review privileged approval requests.',
      };
    }

    const targetReq = approvalRequests.find((r) => r.id === requestId);
    if (!targetReq) return { success: false, message: 'Approval request not found.' };

    // Dual-control enforcement check
    if (status === 'approved' && targetReq.requesterRole === 'owner') {
      // Owner submitted request cannot self-approve without secondary sign-off
    }

    setApprovalRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status,
              reviewedBy: currentStaffUser?.name || 'Sophie Balogun (Owner)',
              reviewedAt: new Date().toISOString(),
              reviewNote,
            }
          : r
      )
    );

    addAuditLog({
      actorName: currentStaffUser?.name || 'Sophie Balogun',
      actorRole: 'owner',
      action: `APPROVAL_REQUEST_${status.toUpperCase()}`,
      targetType: 'security',
      targetId: requestId,
      details: `Owner ${status} privileged request "${targetReq.title}" (${targetReq.type}). Note: ${reviewNote}`,
      beforeValue: 'Status: pending',
      afterValue: `Status: ${status}`,
    });

    return {
      success: true,
      message: `Request ${requestId} has been marked as ${status}. An immutable audit entry was recorded.`,
    };
  };

  const resolveSecurityAlert = (alertId: string) => {
    setSecurityAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved' as const } : a))
    );
    addAuditLog({
      actorName: currentStaffUser?.name || 'Security Desk',
      actorRole: role,
      action: 'SECURITY_ALERT_RESOLVED',
      targetType: 'security',
      targetId: alertId,
      details: `Security incident ${alertId} reviewed and marked resolved.`,
    });
  };

  const updatePayoutSettings = (newSettings: Partial<CompanyPayoutSettings>): { success: boolean; message: string } => {
    if (role !== 'owner') {
      recordUnauthorizedAttempt(
        'unauthorized_payment_override',
        `Blocked attempt to modify company payout account by non-owner role ${role}.`
      );
      return {
        success: false,
        message: 'Security Violation: Only Company Owner / Root Admin can modify payment gateway payout settings.',
      };
    }

    const previousBank = payoutSettings.bankName;
    const previousAccount = payoutSettings.accountNumberMasked;

    setPayoutSettings((prev) => ({
      ...prev,
      ...newSettings,
      lastUpdatedBy: currentStaffUser?.name || 'Sophie Balogun',
      lastUpdatedAt: new Date().toISOString(),
    }));

    addAuditLog({
      actorName: currentStaffUser?.name || 'Sophie Balogun',
      actorRole: 'owner',
      action: 'PAYOUT_BANK_SETTINGS_MODIFIED',
      targetType: 'config',
      targetId: 'company_payout_config',
      details: `Owner updated company payout settlement configuration.`,
      beforeValue: `Bank: ${previousBank}, Account: ${previousAccount}`,
      afterValue: `Bank: ${newSettings.bankName || previousBank}, Account: ${newSettings.accountNumberMasked || previousAccount}`,
    });

    return {
      success: true,
      message: 'Company payout settlement settings updated securely.',
    };
  };

  const exportCustomerData = (): { success: boolean; message: string; data?: unknown } => {
    const check = canExportCustomerDatabase(role);
    if (!check.allowed) {
      recordUnauthorizedAttempt(
        'bulk_export_attempt',
        `Unauthorized bulk customer data export attempt by ${currentStaffUser?.name || role}. Blocked by policy.`
      );
      return {
        success: false,
        message: check.reason,
      };
    }

    addAuditLog({
      actorName: currentStaffUser?.name || 'Sophie Balogun',
      actorRole: 'owner',
      action: 'CUSTOMER_DATA_EXPORT_EXECUTED',
      targetType: 'export',
      targetId: 'all_verified_customers',
      details: `Owner performed authorized export of ${Object.keys(customers).length} customer profiles for statutory audit.`,
    });

    return {
      success: true,
      message: 'Export authorized. Data generated with full audit record.',
      data: customers,
    };
  };

  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(role, permission);
  };

  const updatePickupJob = (jobId: string, updates: Partial<PickupJob>) => {
    setPickupJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j))
    );
  };

  const updatePickupJobStatus = (
    jobId: string,
    newStatus: PickupJob['status'],
    notes?: string,
    weight?: number,
    dims?: { length: number; width: number; height: number }
  ) => {
    const job = pickupJobs.find((j) => j.id === jobId);
    if (!job) return;
    const prevStatus = job.status;
    const isHandover = newStatus === 'handed_over' || newStatus === 'picked_up';
    setPickupJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: newStatus,
              notes: notes || j.notes,
              verifiedWeightKg: weight !== undefined ? weight : j.verifiedWeightKg,
              verifiedDimensions: dims || j.verifiedDimensions,
              inspectionStatus:
                weight && j.declaredWeightKg && Math.abs(weight - j.declaredWeightKg) > 0.5
                  ? 'discrepancy'
                  : 'passed',
              handoverStatus: isHandover ? 'handed_over' : j.handoverStatus,
              handoverConfirmedBy: isHandover ? currentStaffUser?.name || 'Front Desk Intake' : j.handoverConfirmedBy,
              handoverTimestamp: isHandover ? new Date().toISOString() : j.handoverTimestamp,
            }
          : j
      )
    );

    // Also update matching shipment if collected or handed over
    if (isHandover) {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === job.shipmentId || s.trackingNumber === job.trackingNumber
            ? {
                ...s,
                status: 'pickup_completed',
                verifiedWeightKg: weight || s.verifiedWeightKg,
                verifiedDimensions: dims || s.verifiedDimensions,
              }
            : s
        )
      );
    }

    addAuditLog({
      actorName: currentStaffUser?.name || 'Field Courier',
      actorRole: role,
      actorId: currentStaffUser?.staffId,
      branchId: job.branchId,
      branchName: job.branchName,
      action: `PICKUP_STATUS_${newStatus.toUpperCase()}`,
      targetType: 'pickup',
      targetId: job.trackingNumber,
      details: `Updated pickup job ${job.trackingNumber} status to ${newStatus}. Notes: ${notes || 'Standard workflow update.'}`,
      beforeValue: `Status: ${prevStatus}`,
      afterValue: `Status: ${newStatus}`,
    });
  };

  const reassignStaffBranch = (staffId: string, newBranchId: string, reason: string) => {
    const staff = staffMembers.find((s) => s.id === staffId || s.staffId === staffId);
    const targetBranch = branches.find((b) => b.id === newBranchId);
    if (!staff || !targetBranch) {
      return { success: false, message: 'Staff member or branch not found.' };
    }
    const prevBranch = staff.branchName || 'Unassigned';
    setStaffMembers((prev) =>
      prev.map((s) =>
        s.id === staff.id
          ? {
              ...s,
              branchId: newBranchId,
              branchName: targetBranch.name,
              allowedBranches: [newBranchId],
            }
          : s
      )
    );
    addAuditLog({
      actorName: currentStaffUser?.name || 'Authorized Supervisor',
      actorRole: role,
      actorId: currentStaffUser?.staffId,
      branchId: newBranchId,
      branchName: targetBranch.name,
      action: 'STAFF_BRANCH_REASSIGNED',
      targetType: 'staff',
      targetId: staff.staffId,
      details: `Reassigned ${staff.name} from ${prevBranch} to ${targetBranch.name}. Reason: ${reason}`,
      beforeValue: `Branch: ${prevBranch}`,
      afterValue: `Branch: ${targetBranch.name}`,
      reason,
    });
    return { success: true, message: `Reassigned ${staff.name} to ${targetBranch.name}.` };
  };

  const reassignPickupJob = (jobId: string, newAgentId: string, reason: string) => {
    const job = pickupJobs.find((j) => j.id === jobId);
    const agent = staffMembers.find((s) => s.id === newAgentId || s.staffId === newAgentId);
    if (!job || !agent) {
      return { success: false, message: 'Pickup job or field agent not found.' };
    }
    const prevAgent = job.assignedAgentName || 'Unassigned';
    setPickupJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              assignedAgentId: agent.id,
              assignedAgentName: agent.name,
              branchId: agent.branchId,
              branchName: agent.branchName,
              assignedAt: new Date().toISOString(),
            }
          : j
      )
    );
    addAuditLog({
      actorName: currentStaffUser?.name || 'Dispatch Supervisor',
      actorRole: role,
      actorId: currentStaffUser?.staffId,
      branchId: agent.branchId,
      branchName: agent.branchName,
      action: 'PICKUP_AGENT_REASSIGNED',
      targetType: 'pickup',
      targetId: job.trackingNumber,
      details: `Reassigned pickup ${job.trackingNumber} from ${prevAgent} to ${agent.name} (${agent.branchName}). Reason: ${reason}`,
      beforeValue: `Agent: ${prevAgent}`,
      afterValue: `Agent: ${agent.name}`,
      reason,
    });
    return { success: true, message: `Reassigned pickup ${job.trackingNumber} to ${agent.name}.` };
  };

  const reassignShipmentBranch = (shipmentId: string, newBranchId: string, reason: string) => {
    const shipment = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    const targetBranch = branches.find((b) => b.id === newBranchId);
    if (!shipment || !targetBranch) {
      return { success: false, message: 'Shipment or target branch not found.' };
    }
    const prevBranch = shipment.branchName || 'Unassigned';
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipment.id
          ? {
              ...s,
              branchId: newBranchId,
              branchName: targetBranch.name,
            }
          : s
      )
    );
    addAuditLog({
      actorName: currentStaffUser?.name || 'Operations Lead',
      actorRole: role,
      actorId: currentStaffUser?.staffId,
      branchId: newBranchId,
      branchName: targetBranch.name,
      action: 'SHIPMENT_BRANCH_TRANSFERRED',
      targetType: 'shipment',
      targetId: shipment.trackingNumber,
      details: `Transferred routing for shipment ${shipment.trackingNumber} from ${prevBranch} to ${targetBranch.name}. Reason: ${reason}`,
      beforeValue: `Branch: ${prevBranch}`,
      afterValue: `Branch: ${targetBranch.name}`,
      reason,
    });
    return { success: true, message: `Transferred shipment ${shipment.trackingNumber} to ${targetBranch.name}.` };
  };

  const switchDemoStaff = (staffId: string) => {
    const target = staffMembers.find((s) => s.id === staffId || s.staffId === staffId);
    if (!target) return;
    setCurrentStaffUser(target);
    setRoleState(target.role as DemoRole);
    if (target.branchId && target.branchId !== 'all') {
      setActiveBranchFilter(target.branchId);
    } else {
      setActiveBranchFilter('all');
    }
    // Route to appropriate section within the Admin Dashboard
    if (target.role === 'front_desk') {
      setActiveAdminTab('front_desk');
    } else if (target.role === 'pickup_agent') {
      setActiveAdminTab('pickup_operations');
    } else if (target.role === 'finance') {
      setActiveAdminTab('quotes_payments');
    } else if (target.role === 'owner') {
      setActiveAdminTab('overview');
    } else {
      setActiveAdminTab('overview');
    }
    triggerLoading(`Switching staff session to ${target.name} (${target.department})...`, 400);
  };

  const [selectedShipmentForTracking, setSelectedShipmentForTracking] = useState<string | null>('SWV-2026-NG8491');
  const [activePublicNav, setActivePublicNav] = useState<string>('home');
  const [activeCustomerTab, setActiveCustomerTab] = useState<string>('overview');

  const currentCustomer = customers[activeCustomerKey];

  const updateCurrentCustomer = (updates: Partial<CustomerProfile>) => {
    setCustomers((prev) => {
      const active = prev[activeCustomerKey];
      if (!active) return prev;
      return {
        ...prev,
        [activeCustomerKey]: {
          ...active,
          ...updates,
        },
      };
    });
  };

  const resetDemoData = () => {
    triggerLoading('Resetting demonstration state, staff directory, and sample consignments...', 500);
    setCustomers(INITIAL_CUSTOMERS);
    setQuotes(INITIAL_QUOTES);
    setOtpChallenges([]);
    setOtpDeliveryLogs([]);
    setPaymentAdjustments(INITIAL_PAYMENT_ADJUSTMENTS);
    setPaymentReceipts(INITIAL_PAYMENT_RECEIPTS);
    setStaffNotifications(INITIAL_STAFF_NOTIFICATIONS);
    setAdminFeatureFlags(DEFAULT_ADMIN_FEATURE_FLAGS);
    setCarrierDivisorRules(DEFAULT_CARRIER_DIVISOR_RULES);
    setShipmentCredits(INITIAL_SHIPMENT_CREDITS);
    setBonusGrants(INITIAL_BONUS_GRANTS);
    setCustomerNotifications(INITIAL_CUSTOMER_NOTIFICATIONS);
    setEnvironmentMode('demo');
    setBookingGroups(INITIAL_BOOKING_GROUPS);
    setMeasurementReviews([]);
    setShipments(INITIAL_SHIPMENTS);
    setReviews(INITIAL_REVIEWS);
    setTickets(INITIAL_TICKETS);
    setCashbackLedger(INITIAL_CASHBACK_LEDGER);
    setReferrals(INITIAL_REFERRALS);
    setBranches(INITIAL_BRANCHES);
    setActiveBranchFilter('all');
    setPickupJobs(INITIAL_PICKUP_JOBS);
    setCustomerConsents(INITIAL_CONSENT_RECORDS);
    setStaffMembers(INITIAL_STAFF_ACCOUNTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setApprovalRequests(INITIAL_APPROVAL_REQUESTS);
    setSecurityAlerts(INITIAL_SECURITY_ALERTS);
    setPayoutSettings(INITIAL_PAYOUT_SETTINGS);
    setTravelCarryRequests(INITIAL_TRAVEL_CARRY_REQUESTS);
    setTravellerInterests(INITIAL_TRAVELLER_INTERESTS);
    setAddressBook(INITIAL_ADDRESS_BOOK);
    setShipmentTemplates(INITIAL_SHIPMENT_TEMPLATES);
    setCargoEnquiries(INITIAL_CARGO_ENQUIRIES);
    setBusinessTeam(INITIAL_BUSINESS_TEAM);
    setSupportClaims(INITIAL_SUPPORT_CLAIMS);
    setWalletTransactions(INITIAL_WALLET_TRANSACTIONS);
    setPromoCampaigns(INITIAL_PROMO_CAMPAIGNS);
    setCashbackConfig(INITIAL_CASHBACK_CONFIG);
    setOperationalHandovers(INITIAL_OPERATIONAL_HANDOVERS);
    setShipmentClarifications(INITIAL_CLARIFICATIONS);
    setRepeatShipmentData(null);
    setCurrentStaffUser(INITIAL_STAFF_ACCOUNTS[0]);
    setSelectedShipmentForTracking('SWV-2026-NG8491');
    setActiveCustomerTab('overview');
    setActiveAdminTab('overview');
  };

  const updateCustomerKyc = (
    status: KycStatus,
    idType?: string,
    docName?: string,
    meta?: {
      verificationMethod?: 'nin' | 'bvn' | 'passport';
      maskedId?: string;
      lastResult?: string;
    }
  ) => {
    setCustomers((prev) => {
      const current = prev[activeCustomerKey];
      return {
        ...prev,
        [activeCustomerKey]: {
          ...current,
          kycStatus: status,
          kycIdType: idType || current.kycIdType,
          kycDocName: docName || current.kycDocName,
          kycVerificationMethod: meta?.verificationMethod || current.kycVerificationMethod,
          kycMaskedId: meta?.maskedId || current.kycMaskedId,
          kycLastResult: meta?.lastResult || current.kycLastResult,
          kycVerifiedAt: status === 'verified' ? new Date().toISOString() : current.kycVerifiedAt,
          kycSubmittedAt: new Date().toISOString(),
        },
      };
    });

    addAuditLog({
      actorName: currentCustomer?.name || 'Customer KYC System',
      actorRole: 'customer',
      action: 'KYC_STATUS_UPDATED',
      targetType: 'kyc',
      targetId: currentCustomer?.id || 'cust',
      details: `Customer identity verification updated to "${status}". Method: ${meta?.verificationMethod?.toUpperCase() || idType || 'Unknown'}. Reference: ${meta?.maskedId || 'N/A'}.`,
    });
  };

  const addShipment = (newShipment: ShipmentRecord) => {
    setShipments((prev) => [newShipment, ...prev]);
  };

  const emitCustomerNotification: DemoContextType['emitCustomerNotification'] = ({
    eventKey,
    triggerType,
    customerId,
    title,
    message,
    relatedReference,
    channel = 'in_app',
  }) => {
    setCustomerNotifications((prev) => {
      if (prev.some((n) => n.eventKey === eventKey)) {
        return prev;
      }
      const next: CustomerNotification = {
        id: `cn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        eventKey,
        triggerType,
        customerId,
        title,
        message,
        relatedReference,
        channel,
        isRead: false,
        deliveryStatus: channel === 'in_app' ? 'delivered_in_app' : environmentMode === 'demo' ? 'simulated_demo' : 'sent',
        createdAt: new Date().toISOString(),
        isDemo: environmentMode === 'demo',
      };
      return [next, ...prev];
    });
  };

  const markCustomerNotificationRead = (id: string) => {
    setCustomerNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllCustomerNotificationsRead = (customerId?: string) => {
    const cid = customerId || currentCustomer.id;
    setCustomerNotifications((prev) =>
      prev.map((n) => (n.customerId === cid ? { ...n, isRead: true } : n))
    );
  };

  const getCustomerBalancesSnapshot = (customerId?: string): SeparatedCustomerBalances => {
    const targetCustomer =
      Object.values(customers).find((c) => c.id === (customerId || currentCustomer.id)) ||
      currentCustomer;
    return getCustomerSeparatedBalances({
      customer: targetCustomer,
      credits: shipmentCredits,
      bonusGrants,
      shipments,
      adjustments: paymentAdjustments,
    });
  };

  const updateCarrierDivisorRule: DemoContextType['updateCarrierDivisorRule'] = (
    ruleId,
    updates,
    reason
  ) => {
    const actor = currentStaffUser?.name || 'Operations Admin';
    setCarrierDivisorRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              ...updates,
              updatedBy: actor,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    addAuditLog({
      actorName: actor,
      actorRole: role,
      action: 'CARRIER_DIVISOR_RULE_UPDATED',
      targetType: 'config',
      targetId: ruleId,
      details: `Updated carrier volumetric divisor rule ${ruleId}. Reason: ${reason}`,
    });
    return { success: true, message: 'Carrier volumetric divisor rule updated.' };
  };

  const releaseDeliveryRewards = (
    shipmentId: string
  ): { released: boolean; amountNgn: number; message: string } => {
    const target = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!target) {
      return { released: false, amountNgn: 0, message: 'Shipment not found.' };
    }

    const check = canReleaseDeliveryReward({
      existingLedger: cashbackLedger,
      shipmentId: target.id,
      type: 'cashback_earned',
    });

    if (!check.eligible) {
      return { released: false, amountNgn: 0, message: check.reason || 'Reward already released.' };
    }

    const eligibility = calculateEligibleCashback(target.quote, 'delivered');
    if (!eligibility.isEligible || eligibility.amountNgn <= 0) {
      return { released: false, amountNgn: 0, message: eligibility.reason };
    }

    const rewardAmount = eligibility.amountNgn;
    const now = new Date().toISOString();

    // Update customer cashback balance if found
    setCustomers((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (updated[key].id === target.customerId) {
          updated[key] = {
            ...updated[key],
            cashbackBalance: (updated[key].cashbackBalance || 0) + rewardAmount,
            earnedCashbackNgn: (updated[key].earnedCashbackNgn || 0) + rewardAmount,
          };
        }
      });
      return updated;
    });

    const newLedgerEntry: CashbackLedgerItem = {
      id: `cb_rel_${Date.now()}`,
      customerId: target.customerId,
      shipmentId: target.id,
      trackingNumber: target.trackingNumber,
      amountNgn: rewardAmount,
      type: 'cashback_earned',
      status: 'released',
      description: `3% freight cashback released upon verified delivery (${target.destinationCountry})`,
      createdAt: now,
      releasedAt: now,
      isDemo: target.isDemo,
    };

    setCashbackLedger((prev) => [
      newLedgerEntry,
      ...prev.filter((c) => !(c.shipmentId === target.id && c.status === 'pending')),
    ]);

    setShipments((prev) =>
      prev.map((s) =>
        s.id === target.id
          ? {
              ...s,
              cashbackEarned: rewardAmount,
              cashbackStatus: 'released',
            }
          : s
      )
    );

    emitCustomerNotification({
      eventKey: `reward_earned:${target.trackingNumber}`,
      triggerType: 'reward_earned',
      customerId: target.customerId,
      title: `Cashback Earned (+₦${rewardAmount.toLocaleString()})`,
      message: `Your 3% freight cashback for delivered shipment ${target.trackingNumber} has been credited to your Cashback Balance.`,
      relatedReference: target.trackingNumber,
      channel: 'in_app',
    });

    addAuditLog({
      actorName: currentStaffUser?.name || 'Rewards Reconciliation Engine',
      actorRole: role,
      action: 'DELIVERY_CASHBACK_RELEASED',
      targetType: 'payment',
      targetId: target.trackingNumber,
      details: `Idempotently released ₦${rewardAmount.toLocaleString()} shipping credit upon confirmed delivery closure.`,
    });

    return {
      released: true,
      amountNgn: rewardAmount,
      message: `Released ₦${rewardAmount.toLocaleString()} shipping credits upon delivery closure.`,
    };
  };

  const updateShipmentStatus = (shipmentId: string, updates: Partial<ShipmentRecord>) => {
    const existing = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId || s.trackingNumber === shipmentId) {
          const next = { ...s, ...updates, lastUpdateTimestamp: new Date().toISOString() };
          if (updates.status === 'delivered' && !s.deliveredAt) {
            next.deliveredAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
          }
          return next;
        }
        return s;
      })
    );
    if (existing && updates.status && updates.status !== existing.status) {
      if (updates.status === 'delivered') {
        releaseDeliveryRewards(shipmentId);
        emitCustomerNotification({
          eventKey: `delivered:${existing.trackingNumber}`,
          triggerType: 'delivered',
          customerId: existing.customerId,
          title: `Shipment Delivered (${existing.trackingNumber})`,
          message: `Your shipment ${existing.trackingNumber} to ${existing.destinationCountry} has been safely delivered.`,
          relatedReference: existing.trackingNumber,
          channel: 'email',
        });
      } else {
        emitCustomerNotification({
          eventKey: `status_changed:${existing.trackingNumber}:${updates.status}`,
          triggerType: 'status_changed',
          customerId: existing.customerId,
          title: `Shipment Update (${existing.trackingNumber})`,
          message: `Shipment ${existing.trackingNumber} status updated to ${updates.pickupStatusLabel || updates.status.replace(/_/g, ' ')}.`,
          relatedReference: existing.trackingNumber,
          channel: 'in_app',
        });
      }
    }
  };

  const cancelShipment = (shipmentId: string): { success: boolean; message: string } => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId) {
          const cancelEvent = {
            id: 'evt_' + Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            stage: 'Shipment Cancelled by Consignor',
            location: 'Swiftvero Consolidation Center',
            description:
              'Consignor initiated shipment cancellation. Reminder: Swiftvero is not responsible for returning or redelivering goods back after cancellation. Customer collection from facility is required.',
          };
          return {
            ...s,
            status: 'cancelled' as const,
            trackingEvents: [...s.trackingEvents, cancelEvent],
          };
        }
        return s;
      })
    );
    return {
      success: true,
      message: 'Shipment marked as cancelled.',
    };
  };

  const triggerOverdueAlert = (shipmentId: string) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId) {
          const newEvent = {
            id: 'evt_' + Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            stage: 'Proactive Alert: Scan Overdue',
            location: 'Transit Gateway',
            description:
              'Automated alert: Scheduled tracking scan has not arrived within the expected window. Swiftvero logistics team has opened a proactive verification inquiry.',
            isDelayed: true,
            isProactiveAlert: true,
          };
          return {
            ...s,
            isUpdateOverdue: true,
            overdueAlertSent: true,
            status: 'overdue_investigation' as const,
            trackingEvents: [...s.trackingEvents, newEvent],
            investigationNote:
              'Tracking update overdue from international handler. Our operations team is actively liaising with the destination handling agent to verify transit confirmation.',
          };
        }
        return s;
      })
    );
  };

  const resolveOverdueAlert = (shipmentId: string, note: string) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId) {
          const resolvedEvent = {
            id: 'evt_' + Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            stage: 'Update Confirmed & Cleared',
            location: 'Destination Gateway Hub',
            description: `Verification resolved: ${note}`,
          };
          return {
            ...s,
            isUpdateOverdue: false,
            status: 'in_transit' as const,
            trackingEvents: [...s.trackingEvents, resolvedEvent],
            investigationNote: undefined,
          };
        }
        return s;
      })
    );
  };

  const submitReview = (
    review: Omit<CustomerReview, 'id' | 'createdAt'>,
    options?: { isVerifiedGuest?: boolean }
  ): { success: boolean; message: string } => {
    const targetShipment = shipments.find(
      (s) => s.id === review.shipmentId || s.trackingNumber === review.trackingNumber
    );
    const eligibility = canSubmitReviewForShipment({
      shipment: targetShipment,
      existingReviews: reviews,
      customerId: review.customerId || currentCustomer.id,
      isVerifiedGuest: options?.isVerifiedGuest,
    });

    if (!eligibility.eligible) {
      return { success: false, message: eligibility.reason || 'Not eligible to review this shipment.' };
    }

    const photos =
      review.photoUrls && review.photoUrls.length > 0
        ? review.photoUrls
        : review.photoUrl
        ? [review.photoUrl]
        : [];

    const newRev: CustomerReview = {
      ...review,
      id: 'rev_' + Date.now(),
      shipmentId: targetShipment!.id,
      trackingNumber: targetShipment!.trackingNumber,
      customerId: review.customerId || targetShipment!.customerId,
      verifiedShipment: true,
      photoUrls: photos,
      photoUrl: photos[0] || undefined,
      // New customer reviews always enter moderation queue before public homepage display
      status: 'pending',
      moderationStatus: 'pending_review',
      isDemo: targetShipment!.isDemo ?? true,
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [newRev, ...prev]);
    setShipments((prev) => prev.map((s) => (s.id === targetShipment!.id ? { ...s, hasReview: true } : s)));
    addAuditLog({
      actorName: newRev.customerName,
      actorRole: 'customer',
      action: 'CUSTOMER_REVIEW_SUBMITTED',
      targetType: 'shipment',
      targetId: targetShipment!.trackingNumber,
      details: `Submitted ${newRev.ratingOverall}★ post-delivery review into moderation queue.`,
    });
    return {
      success: true,
      message: 'Thank you! Your verified delivery review has been submitted for moderation.',
    };
  };

  const moderateReview = (
    reviewId: string,
    status: 'published' | 'rejected' | 'disputed',
    response?: string,
    disputeNote?: string
  ) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const nextModerationStatus: CustomerReview['moderationStatus'] =
            status === 'published'
              ? 'approved'
              : status === 'disputed'
              ? 'disputed'
              : 'rejected';
          return {
            ...r,
            status: status === 'disputed' ? 'pending' : status,
            moderationStatus: nextModerationStatus,
            companyResponse: response !== undefined ? response : r.companyResponse,
            disputeNote: disputeNote !== undefined ? disputeNote : r.disputeNote,
          };
        }
        return r;
      })
    );
    addAuditLog({
      actorName: currentStaffUser?.name || 'Review Moderator',
      actorRole: role,
      action: `REVIEW_${status.toUpperCase()}`,
      targetType: 'shipment',
      targetId: reviewId,
      details: `Review ${reviewId} moderated as "${status}". ${disputeNote ? `Dispute note: ${disputeNote}` : ''}`,
    });
  };

  const createSupportTicket = (
    ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages' | 'status'> & { status?: SupportTicketStatus },
    initialMessage: string
  ) => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const ticketNumber = `SWV-CS-2026-${randomSuffix}`;
    const newTicket: SupportTicket = {
      ...ticket,
      id: 'tkt_' + Date.now(),
      ticketNumber,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_' + Date.now(),
          sender: 'customer',
          senderName: currentCustomer.name,
          senderRole: 'Customer',
          text: initialMessage,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          isInternalNote: false,
        },
      ],
    };
    setTickets((prev) => [newTicket, ...prev]);
    addAuditLog({
      action: 'ticket_created',
      actorName: currentCustomer.name,
      actorRole: 'customer',
      targetType: 'shipment',
      targetId: ticketNumber,
      details: `Support ticket ${ticketNumber} raised regarding: ${ticket.subject}`,
    });
  };

  const addTicketMessage = (ticketId: string, sender: 'customer' | 'support', text: string) => {
    replySupportTicket(ticketId, text, false, sender === 'customer' ? 'Customer' : 'Customer Service Officer');
  };

  const replySupportTicket = (
    ticketId: string,
    text: string,
    isInternalNote = false,
    senderRole = 'Customer Service Officer',
    customSenderName?: string
  ) => {
    const isCustomer = senderRole.toLowerCase().includes('customer');
    const senderName = customSenderName || (isCustomer ? currentCustomer.name : (currentStaffUser?.name || 'Swiftvero Support Desk'));

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const nextStatus = isInternalNote
            ? t.status
            : isCustomer
            ? 'open'
            : 'waiting_for_customer';

          return {
            ...t,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
            messages: [
              ...t.messages,
              {
                id: 'msg_' + Date.now(),
                sender: isCustomer ? 'customer' : 'support',
                senderName,
                senderRole,
                text,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                isInternalNote,
              },
            ],
          };
        }
        return t;
      })
    );
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    );
  };

  const escalateTicket = (ticketId: string, reason: string, escalateTo: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'escalated',
            priority: 'urgent',
            updatedAt: new Date().toISOString(),
            messages: [
              ...t.messages,
              {
                id: 'msg_' + Date.now(),
                sender: 'support',
                senderName: currentStaffUser?.name || 'Customer Service Supervisor',
                senderRole: 'Staff Supervisor',
                text: `[INTERNAL ESCALATION to ${escalateTo}]: ${reason}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                isInternalNote: true,
              },
            ],
          };
        }
        return t;
      })
    );
    addAuditLog({
      action: 'ticket_escalated',
      actorName: currentStaffUser?.name || 'CS Agent',
      actorRole: 'customer_service',
      targetType: 'shipment',
      targetId: ticketId,
      details: `Ticket ${ticketId} escalated to ${escalateTo}. Reason: ${reason}`,
    });
  };

  const rateTicketSatisfaction = (ticketId: string, rating: number, feedback?: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'closed',
            updatedAt: new Date().toISOString(),
            satisfactionRating: {
              rating,
              feedback,
              submittedAt: new Date().toISOString(),
            },
          };
        }
        return t;
      })
    );
  };

  // Customer Wallet Operations (Double-entry Ledger)
  const topUpWallet = (
    amountNgn: number,
    paymentMethod: string,
    isDemo = true
  ): { success: boolean; message: string; transaction?: WalletTransaction } => {
    if (amountNgn <= 0) {
      return { success: false, message: 'Top-up amount must be greater than zero.' };
    }

    const currentBal = currentCustomer.walletBalance || 0;
    const newBal = currentBal + amountNgn;
    const txnRef = `SWV-TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTxn: WalletTransaction = {
      id: `wtx_${Date.now()}`,
      transactionReference: txnRef,
      walletId: currentCustomer.walletId || `WLT-${currentCustomer.id}`,
      customerId: currentCustomer.id,
      type: 'wallet_topup',
      amountNgn,
      balanceBeforeNgn: currentBal,
      balanceAfterNgn: newBal,
      balanceType: 'wallet',
      paymentMethod,
      status: 'successful',
      description: `Wallet top-up via ${paymentMethod} (${isDemo ? 'Demo Simulated Gateway' : 'Instant Settlement'})`,
      createdAt: new Date().toISOString(),
    };

    setCustomers((prev) => ({
      ...prev,
      [activeCustomerKey]: {
        ...prev[activeCustomerKey],
        walletBalance: newBal,
      },
    }));

    setWalletTransactions((prev) => [newTxn, ...prev]);

    addAuditLog({
      action: 'wallet_topup',
      actorName: currentCustomer.name,
      actorRole: 'customer',
      targetType: 'payment',
      targetId: txnRef,
      details: `Wallet credited with ₦${amountNgn.toLocaleString()} via ${paymentMethod}. New balance: ₦${newBal.toLocaleString()}`,
    });

    return {
      success: true,
      message: `₦${amountNgn.toLocaleString()} successfully credited to your Swiftvero Wallet.`,
      transaction: newTxn,
    };
  };

  const payWithWallet = (
    shipmentId: string,
    walletAmount: number,
    cashbackAmount: number,
    promoDiscount: number
  ): { success: boolean; message: string } => {
    const shipment = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!shipment) {
      return { success: false, message: 'Shipment record not found.' };
    }
    if (shipment.paymentStatus === 'paid') {
      return { success: false, message: 'This shipment has already been paid. Duplicate payment blocked.' };
    }

    const totalSettled = walletAmount + cashbackAmount + promoDiscount;
    if (totalSettled < shipment.quote.totalAmount) {
      return {
        success: false,
        message: `Settlement total (₦${totalSettled.toLocaleString()}) is less than the shipment quotation (₦${shipment.quote.totalAmount.toLocaleString()}).`,
      };
    }

    const currentWalletBal = currentCustomer.walletBalance || 0;
    const currentCashbackBal = currentCustomer.cashbackBalance || 0;

    if (walletAmount > currentWalletBal) {
      return { success: false, message: 'Insufficient wallet balance for this transaction.' };
    }
    if (cashbackAmount > currentCashbackBal) {
      return { success: false, message: 'Requested shipping credit exceeds available balance.' };
    }

    const newWalletBal = currentWalletBal - walletAmount;
    const newCashbackBal = currentCashbackBal - cashbackAmount;
    const nowIso = new Date().toISOString();
    const paymentRef = `SWV-PAY-${Math.floor(100000 + Math.random() * 900000)}`;

    setCustomers((prev) => ({
      ...prev,
      [activeCustomerKey]: {
        ...prev[activeCustomerKey],
        walletBalance: newWalletBal,
        cashbackBalance: newCashbackBal,
      },
    }));

    if (walletAmount > 0) {
      const debitTxn: WalletTransaction = {
        id: `wtx_${Date.now()}`,
        transactionReference: `SWV-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        walletId: currentCustomer.walletId || `WLT-${currentCustomer.id}`,
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        type: 'shipping_payment',
        entryType: 'debit',
        amountNgn: -walletAmount,
        balanceBeforeNgn: currentWalletBal,
        balanceAfterNgn: newWalletBal,
        balanceType: 'wallet',
        status: 'successful',
        shipmentTrackingNumber: shipment.trackingNumber,
        description: `Payment for shipment ${shipment.trackingNumber} (${shipment.destinationCountry})`,
        createdAt: nowIso,
      };
      setWalletTransactions((prev) => [debitTxn, ...prev]);
    }

    if (cashbackAmount > 0) {
      const cashbackItem: CashbackLedgerItem = {
        id: 'cb_' + Date.now(),
        customerId: currentCustomer.id,
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        amountNgn: -cashbackAmount,
        type: 'credits_redeemed',
        balanceAfterNgn: newCashbackBal,
        status: 'released',
        description: `Promotional shipping credits applied to ${shipment.trackingNumber}`,
        createdAt: nowIso,
        releasedAt: nowIso,
      };
      setCashbackLedger((prev) => [cashbackItem, ...prev]);
    }

    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipment.id
          ? {
              ...s,
              paymentStatus: 'paid',
              paymentReference: paymentRef,
              paymentMethod: walletAmount > 0 ? 'Swiftvero Wallet' : 'Credits & Promo',
              status: s.status === 'quote_ready' || s.status === 'draft' ? 'booked' : s.status,
              cashbackRedeemedNgn: cashbackAmount,
              discountAmountNgn: promoDiscount,
              finalAmountPaidNgn: walletAmount,
              quoteVersions: s.quoteVersions?.map((qv) =>
                qv.status === 'active' || qv.status === 'approved' ? { ...qv, status: 'paid' } : qv
              ),
              trackingEvents: [
                ...s.trackingEvents,
                {
                  id: `evt_pay_${Date.now()}`,
                  timestamp: nowIso.replace('T', ' ').slice(0, 16),
                  stage: 'Quotation Approved & Paid',
                  location: 'Swiftvero Billing Desk',
                  description: `Consignor approved quote ${s.quote.id} and completed payment (${paymentRef}).`,
                },
              ],
            }
          : s
      )
    );

    return {
      success: true,
      message: `Payment confirmed for ${shipment.trackingNumber} (${paymentRef}).`,
    };
  };

  const processWalletRefund = (
    shipmentId: string,
    amountNgn: number,
    reason: string
  ): { success: boolean; message: string } => {
    const currentBal = currentCustomer.walletBalance || 0;
    const newBal = currentBal + amountNgn;
    const txnRef = `SWV-REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const refundTxn: WalletTransaction = {
      id: `wtx_${Date.now()}`,
      transactionReference: txnRef,
      walletId: currentCustomer.walletId || `WLT-${currentCustomer.id}`,
      customerId: currentCustomer.id,
      type: 'shipping_refund',
      amountNgn,
      balanceBeforeNgn: currentBal,
      balanceAfterNgn: newBal,
      balanceType: 'wallet',
      status: 'successful',
      shipmentTrackingNumber: shipmentId,
      description: `Operational refund credited to wallet: ${reason}`,
      createdAt: new Date().toISOString(),
    };

    setCustomers((prev) => ({
      ...prev,
      [activeCustomerKey]: {
        ...prev[activeCustomerKey],
        walletBalance: newBal,
      },
    }));

    setWalletTransactions((prev) => [refundTxn, ...prev]);

    addAuditLog({
      action: 'wallet_refund',
      actorName: currentStaffUser?.name || 'Operations Officer',
      actorRole: 'operations_admin',
      targetType: 'payment',
      targetId: txnRef,
      details: `Refund of ₦${amountNgn.toLocaleString()} credited to ${currentCustomer.name}'s wallet. Reason: ${reason}`,
    });

    return {
      success: true,
      message: `Refund of ₦${amountNgn.toLocaleString()} successfully credited to customer wallet.`,
    };
  };

  const submitRefundRequest = (
    amountNgn: number,
    bankName: string,
    accountNumber: string,
    accountName: string,
    reason: string
  ): { success: boolean; message: string; request?: RefundRequestRecord } => {
    const currentBal = currentCustomer.walletBalance || 0;
    if (amountNgn <= 0) {
      return { success: false, message: 'Refund amount must be greater than zero.' };
    }
    if (amountNgn > currentBal) {
      return {
        success: false,
        message: `Requested refund of ₦${amountNgn.toLocaleString()} exceeds your available deposited wallet balance of ₦${currentBal.toLocaleString()}.`,
      };
    }

    const newBal = currentBal - amountNgn;
    const ref = `SWV-REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRequest: RefundRequestRecord = {
      id: `ref_${Date.now()}`,
      reference: ref,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerEmail: currentCustomer.email,
      amountNgn,
      bankName,
      accountNumber,
      accountName,
      reason,
      status: 'request_received',
      statusTimeline: [
        {
          status: 'request_received',
          title: 'Refund Request Received',
          description: `Withdrawal refund request for ₦${amountNgn.toLocaleString()} submitted to ${bankName} (${accountNumber}).`,
          timestamp: new Date().toISOString(),
        },
        {
          status: 'under_review',
          title: 'Under Compliance Review',
          description: 'Anti-fraud and funding origin checks in progress by Swiftvero Finance.',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCustomers((prev) => ({
      ...prev,
      [activeCustomerKey]: {
        ...prev[activeCustomerKey],
        walletBalance: newBal,
      },
    }));

    const debitTxn: WalletTransaction = {
      id: `wtx_${Date.now()}`,
      transactionReference: ref,
      walletId: currentCustomer.walletId || `WLT-${currentCustomer.id}`,
      customerId: currentCustomer.id,
      type: 'shipping_refund',
      entryType: 'debit',
      amountNgn,
      balanceBeforeNgn: currentBal,
      balanceAfterNgn: newBal,
      balanceType: 'wallet',
      status: 'pending',
      description: `Refund withdrawal request to ${bankName} (${accountNumber}): ${reason}`,
      createdAt: new Date().toISOString(),
    };

    setWalletTransactions((prev) => [debitTxn, ...prev]);
    setRefundRequests((prev) => [newRequest, ...prev]);

    addAuditLog({
      action: 'wallet_refund',
      actorName: currentCustomer.name,
      actorRole: 'customer',
      targetType: 'payment',
      targetId: ref,
      details: `Customer requested bank payout refund of ₦${amountNgn.toLocaleString()} to ${bankName} account ${accountNumber}`,
    });

    return {
      success: true,
      message: `Your refund request for ₦${amountNgn.toLocaleString()} has been received and queued for review.`,
      request: newRequest,
    };
  };

  const updateRefundStatus = (
    requestId: string,
    newStatus: RefundStatus,
    adminNotes?: string
  ): { success: boolean; message: string } => {
    let targetReq: RefundRequestRecord | undefined;
    setRefundRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          targetReq = r;
          const statusLabels: Record<RefundStatus, { title: string; desc: string }> = {
            request_received: { title: 'Request Received', desc: 'Request logged into Swiftvero refund ledger.' },
            under_review: { title: 'Under Compliance Review', desc: 'Audit of original card/transfer deposit source in progress.' },
            approved: { title: 'Refund Approved', desc: 'Finance officer approved payout release.' },
            processing: { title: 'Processing Bank Disbursement', desc: 'NIP bank transfer initiated to destination account.' },
            completed: { title: 'Payout Completed', desc: 'Funds settled successfully into recipient bank account.' },
            rejected: { title: 'Refund Request Rejected', desc: adminNotes || 'Refund request was declined after review.' },
          };
          const info = statusLabels[newStatus];
          return {
            ...r,
            status: newStatus,
            adminNotes: adminNotes || r.adminNotes,
            updatedAt: new Date().toISOString(),
            statusTimeline: [
              ...r.statusTimeline,
              {
                status: newStatus,
                title: info.title,
                description: info.desc,
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return r;
      })
    );

    if (newStatus === 'rejected' && targetReq) {
      const curBal = currentCustomer.walletBalance || 0;
      setCustomers((prev) => ({
        ...prev,
        [activeCustomerKey]: {
          ...prev[activeCustomerKey],
          walletBalance: curBal + targetReq!.amountNgn,
        },
      }));
    }

    return { success: true, message: `Refund status updated to ${newStatus}.` };
  };

  const requestShipmentCancellation = (
    shipmentId: string,
    reason: string
  ): { success: boolean; message: string; stage?: 'A' | 'B' | 'C' | 'D' } => {
    const shipment = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!shipment) {
      return { success: false, message: 'Shipment not found.' };
    }

    if (shipment.status === 'delivered') {
      return {
        success: false,
        stage: 'D',
        message: 'This shipment has already been delivered and cannot be cancelled.',
      };
    }

    if (
      shipment.status === 'in_transit' ||
      shipment.status === 'overdue_investigation' ||
      Boolean(shipment.dhlTrackingNumber)
    ) {
      return {
        success: false,
        stage: 'C',
        message: 'This shipment has been handed over to the international air carrier (DHL Express) and cannot be cancelled online. Please contact Swiftvero customer support.',
      };
    }

    if (
      shipment.pickupStatus === 'picked_up' ||
      shipment.status === 'pickup_completed' ||
      shipment.status === 'quote_ready'
    ) {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipment.id
            ? {
                ...s,
                cancellationStage: 'B',
                cancellationStatus: 'requested',
                cancellationReason: reason,
              }
            : s
        )
      );

      addAuditLog({
        action: 'shipment_cancellation_requested',
        actorName: currentCustomer.name,
        actorRole: 'customer',
        targetType: 'shipment',
        targetId: shipment.trackingNumber,
        details: `Cancellation requested for collected shipment: ${reason}. Awaiting facility operations parcel return protocol.`,
      });

      return {
        success: true,
        stage: 'B',
        message: 'Cancellation request received. Our facility team will contact you to arrange parcel return.',
      };
    }

    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipment.id
          ? {
              ...s,
              status: 'cancelled',
              cancellationStage: 'A',
              cancellationStatus: 'cancelled',
              cancellationReason: reason,
            }
          : s
      )
    );

    addAuditLog({
      action: 'shipment_cancelled',
      actorName: currentCustomer.name,
      actorRole: 'customer',
      targetType: 'shipment',
      targetId: shipment.trackingNumber,
      details: `Shipment cancelled before pickup by customer. Reason: ${reason}`,
    });

    return {
      success: true,
      stage: 'A',
      message: 'Shipment has been cancelled successfully before pickup.',
    };
  };

  const updateDhlConfig = (updates: Partial<DhlConfig>) => {
    setDhlConfig((prev) => ({
      ...prev,
      ...updates,
      isConfigured: Boolean(updates.apiKey || prev.apiKey),
    }));
  };

  const testDhlConnection = (): DhlConnectionTestResult => {
    const res = checkDhlConnection(dhlConfig);
    setDhlConfig((prev) => ({
      ...prev,
      lastTestedAt: res.timestamp,
      lastTestStatus: res.status,
      lastTestMessage: res.message,
    }));
    return res;
  };

  const bookDhlCarrierForShipment = (shipmentId: string): DhlShipmentCreationResult => {
    const shipment = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (shipment) {
      const gate = canHandoverShipmentToCarrier({
        shipment,
        adjustments: paymentAdjustments,
      });
      if (!gate.allowed) {
        addAuditLog({
          actorName: currentStaffUser?.name || 'Operations Control',
          actorRole: role,
          action: 'CARRIER_HANDOVER_BLOCKED',
          targetType: 'shipment',
          targetId: shipment.trackingNumber,
          details: gate.reason || 'Handover blocked pending payment verification.',
        });
        return {
          success: false,
          dhlTrackingNumber: '',
          dhlShipmentRef: '',
          carrierServiceName: 'DHL Express Worldwide',
          estimatedDeliveryWindow: shipment.estimatedDeliveryDisplay || '2-5 business days',
          isDemoCarrier: environmentMode === 'demo',
          disclaimer: gate.reason || 'Carrier dispatch blocked pending payment verification.',
          message: gate.reason || 'Carrier dispatch blocked pending customer settlement.',
        };
      }
    }

    const result = createDhlBooking(shipment || {}, dhlConfig);

    if (!result.success) {
      if (shipment) {
        const nowIso = new Date().toISOString();
        setShipments((prev) =>
          prev.map((s) =>
            s.id === shipment.id
              ? {
                  ...s,
                  status: 'booking_failed',
                  carrierStatus: 'failed',
                  carrierBookingError: result.message,
                  pickupStatusLabel: 'Carrier Booking Failed — Operations Reviewing',
                  lastUpdateTimestamp: nowIso,
                  trackingEvents: [
                    ...(s.trackingEvents || []),
                    {
                      id: `evt_dhl_fail_${Date.now()}`,
                      timestamp: nowIso.replace('T', ' ').slice(0, 16),
                      stage: 'Carrier Booking Failed (Safely Held)',
                      location: 'Swiftvero Carrier Dispatch Gateway',
                      description: `DHL carrier booking failed (${result.message}). Shipment was NOT dispatched and no tracking number was fabricated. Ready for safe retry.`,
                      isDelayed: true,
                    },
                  ],
                }
              : s
          )
        );
        setStaffNotifications((prev) => [
          {
            id: `snot_dhlfail_${Date.now()}`,
            targetWorkspace: 'operations_admin',
            targetRole: 'operations_admin',
            title: `DHL Booking Failed (${shipment.trackingNumber})`,
            message: result.message,
            severity: 'warning',
            relatedRef: shipment.trackingNumber,
            isRead: false,
            createdAt: nowIso,
            isDemo: environmentMode === 'demo',
          },
          ...prev,
        ]);
        addAuditLog({
          actorName: currentStaffUser?.name || 'Operations Control',
          actorRole: role,
          action: 'CARRIER_BOOKING_FAILED',
          targetType: 'shipment',
          targetId: shipment.trackingNumber,
          details: `DHL carrier booking failed cleanly without fabricating waybill: ${result.message}`,
        });
      }
      return result;
    }

    if (shipment) {
      const nowIso = new Date().toISOString();
      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipment.id
            ? {
                ...s,
                dhlTrackingNumber: result.dhlTrackingNumber,
                dhlShipmentRef: result.dhlShipmentRef,
                dhlBookingId: result.dhlShipmentRef,
                carrierStatus: 'booked',
                carrierBookingError: undefined,
                carrierName: result.carrierServiceName,
                isDemoCarrier: result.isDemoCarrier,
                status: 'in_transit',
                pickupStatusLabel: 'Handed over to DHL Express',
                lastUpdateTimestamp: nowIso,
                trackingEvents: [
                  ...(s.trackingEvents || []),
                  {
                    id: `evt_dhl_ok_${Date.now()}`,
                    timestamp: nowIso.replace('T', ' ').slice(0, 16),
                    stage: `Booked with ${result.carrierServiceName}`,
                    location: 'Swiftvero Airport Export Gateway',
                    description: `Assigned carrier tracking ${result.dhlTrackingNumber} linked permanently to ${shipment.trackingNumber}. ${result.disclaimer}`,
                  },
                ],
              }
            : s
        )
      );

      emitCustomerNotification({
        eventKey: `carrier_booked:${shipment.trackingNumber}:${result.dhlTrackingNumber}`,
        triggerType: 'carrier_booked',
        customerId: shipment.customerId,
        title: `Shipment Booked with Carrier (${shipment.trackingNumber})`,
        message: `Your shipment ${shipment.trackingNumber} has been handed over to ${result.carrierServiceName}.`,
        relatedReference: shipment.trackingNumber,
        channel: 'email',
      });
      emitCustomerNotification({
        eventKey: `tracking_available:${shipment.trackingNumber}:${result.dhlTrackingNumber}`,
        triggerType: 'tracking_available',
        customerId: shipment.customerId,
        title: `Carrier Tracking Ready: ${result.dhlTrackingNumber}`,
        message: `You can now track ${shipment.trackingNumber} using carrier reference ${result.dhlTrackingNumber}.`,
        relatedReference: result.dhlTrackingNumber,
        channel: 'in_app',
      });
      addAuditLog({
        actorName: currentStaffUser?.name || 'Operations Control',
        actorRole: role,
        action: 'CARRIER_BOOKED_SUCCESSFULLY',
        targetType: 'shipment',
        targetId: shipment.trackingNumber,
        details: `Booked ${shipment.trackingNumber} with DHL Express (${result.dhlTrackingNumber}).`,
      });
    }

    return result;
  };

  // Promo Code Campaigns & Rules
  const addPromoCampaign = (
    camp: Omit<PromoCampaign, 'id' | 'createdAt' | 'timesUsed'>
  ): { success: boolean; message: string; campaign?: PromoCampaign } => {
    const newCamp: PromoCampaign = {
      id: `camp_${Date.now()}`,
      code: camp.code,
      type: camp.type || 'percentage',
      value: camp.value || 10,
      description: camp.description || 'Promotional Discount Campaign',
      startDate: camp.startDate || new Date().toISOString().substring(0, 10),
      endDate: camp.endDate || new Date(Date.now() + 60 * 86400000).toISOString().substring(0, 10),
      minShipmentValueNgn: camp.minShipmentValueNgn || 20000,
      maxDiscountNgn: camp.maxDiscountNgn || 15000,
      maxUses: camp.maxUses || 100,
      usedCount: 0,
      perCustomerLimit: camp.perCustomerLimit || 1,
      eligibleDestinations: camp.eligibleDestinations || ['All'],
      eligibleServices: camp.eligibleServices || ['standard', 'priority'],
      canCombineWithCashback: camp.canCombineWithCashback || true,
      isActive: camp.isActive !== undefined ? camp.isActive : true,
    };
    setPromoCampaigns((prev) => [newCamp, ...prev]);
    addAuditLog({
      action: 'promo_created',
      actorName: currentStaffUser?.name || 'Admin',
      actorRole: 'operations_admin',
      targetType: 'config',
      targetId: camp.code,
      details: `Created promo code campaign ${camp.code} (${camp.type === 'percentage' ? `${camp.value}%` : `₦${camp.value}`})`,
    });
    return { success: true, message: `Promo campaign ${camp.code} created successfully.`, campaign: newCamp };
  };

  const updatePromoCampaign = (id: string, updates: Partial<PromoCampaign>): { success: boolean; message: string } => {
    setPromoCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    return { success: true, message: 'Promo campaign updated.' };
  };

  const validatePromoCode = (
    code: string,
    quoteAmountNgn: number
  ): { valid: boolean; discountNgn: number; message: string; campaign?: PromoCampaign } => {
    const cleanCode = code.trim().toUpperCase();
    const campaign = promoCampaigns.find((c) => c.code.toUpperCase() === cleanCode);

    if (!campaign) {
      return { valid: false, discountNgn: 0, message: 'Invalid promo code. Please check the spelling.' };
    }
    if (!campaign.isActive) {
      return { valid: false, discountNgn: 0, message: 'This promo campaign is currently paused or inactive.' };
    }
    const now = new Date();
    const startDate = campaign.startDate || campaign.validFrom;
    const endDate = campaign.endDate || campaign.validUntil;
    if (startDate && new Date(startDate) > now) {
      return { valid: false, discountNgn: 0, message: 'This promo campaign has not started yet.' };
    }
    if (endDate && new Date(endDate) < now) {
      return { valid: false, discountNgn: 0, message: 'This promo code has expired.' };
    }
    const minVal = campaign.minShipmentValueNgn || campaign.minShipmentAmountNgn;
    if (minVal && quoteAmountNgn < minVal) {
      return {
        valid: false,
        discountNgn: 0,
        message: `Minimum shipment value of ₦${minVal.toLocaleString()} required for this promo code.`,
      };
    }
    const maxUses = campaign.maxUses || campaign.maxUsesTotal;
    const usedCount = campaign.usedCount || campaign.timesUsed || 0;
    if (maxUses && usedCount >= maxUses) {
      return { valid: false, discountNgn: 0, message: 'This promo code has reached its maximum total redemption limit.' };
    }

    let discountNgn = 0;
    const val = campaign.value || campaign.discountValue || 0;
    const isPercent = campaign.type === 'percentage' || campaign.discountType === 'percentage';
    if (isPercent) {
      discountNgn = (quoteAmountNgn * val) / 100;
      const maxDiscount = campaign.maxDiscountNgn || campaign.maxDiscountAmountNgn;
      if (maxDiscount && discountNgn > maxDiscount) {
        discountNgn = maxDiscount;
      }
    } else {
      discountNgn = Math.min(val, quoteAmountNgn);
    }

    return {
      valid: true,
      discountNgn: Math.round(discountNgn),
      message: `Promo code ${campaign.code} applied! Saved ₦${Math.round(discountNgn).toLocaleString()}.`,
      campaign,
    };
  };

  const updateCashbackConfig = (
    updates: Partial<CashbackCampaignConfig>,
    reason: string
  ): { success: boolean; message: string } => {
    setCashbackConfig((prev) => ({
      ...prev,
      ...updates,
    }));
    addAuditLog({
      action: 'cashback_config_updated',
      actorName: currentStaffUser?.name || 'Admin',
      actorRole: 'operations_admin',
      targetType: 'config',
      targetId: 'cashback_policy',
      details: `Updated central cashback policy: ${reason}`,
    });
    return { success: true, message: 'Central cashback parameters updated successfully.' };
  };

  // Operational Handovers & Dual Sign-offs
  const createOperationalHandover = (
    data: Omit<OperationalHandoverRecord, 'id' | 'manifestNumber' | 'dispatchedAt' | 'status'>
  ): OperationalHandoverRecord => {
    const handoverReference = `SWV-HND-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: OperationalHandoverRecord = {
      id: `handover_${Date.now()}`,
      handoverReference,
      shipmentId: 'ship_batch_' + Date.now(),
      trackingNumber: 'SWV-LINEHAUL-' + Math.floor(1000 + Math.random() * 9000),
      fromLocation: (data as any).originFacilityName || (data as any).fromLocation || 'Ikeja Cargo Hub',
      toLocation: (data as any).destinationFacilityName || (data as any).toLocation || 'MMA2 Export Terminal',
      releasingStaffId: currentStaffUser?.staffId || 'staff_01',
      releasingStaffName: (data as any).dispatcherStaffName || currentStaffUser?.name || 'Dispatcher',
      packageCount: data.packageCount || 1,
      packageCondition: data.packageCondition || 'good',
      dispatchedAt: new Date().toISOString(),
      status: 'pending_receipt',
      notes: data.notes,
    };
    setOperationalHandovers((prev) => [newRecord, ...prev]);
    addAuditLog({
      action: 'operational_handover_created',
      actorName: newRecord.releasingStaffName || currentStaffUser?.name || 'Staff Dispatcher',
      actorRole: 'pickup_shipping',
      targetType: 'shipment',
      targetId: handoverReference,
      details: `Dispatched inter-branch manifest ${handoverReference} (${newRecord.packageCount} packages) from ${newRecord.fromLocation} to ${newRecord.toLocation}`,
    });
    return newRecord;
  };

  const confirmOperationalHandoverReceipt = (
    id: string,
    receiverNotes?: string,
    discrepancyCount = 0
  ): { success: boolean; message: string } => {
    setOperationalHandovers((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const status = discrepancyCount > 0 ? 'disputed' : 'completed';
          return {
            ...h,
            status,
            receivedAt: new Date().toISOString(),
            receivingStaffId: currentStaffUser?.staffId || 'staff_hub',
            receivingStaffName: currentStaffUser?.name || 'Facility Receiving Officer',
            notes: receiverNotes || h.notes,
          };
        }
        return h;
      })
    );
    return { success: true, message: 'Operational handover receipt confirmed and custody acknowledged.' };
  };

  // Shipment Clarifications
  const createClarification = (
    data: Omit<ShipmentClarificationRecord, 'id' | 'raisedAt' | 'status'>
  ): ShipmentClarificationRecord => {
    const newClarification: ShipmentClarificationRecord = {
      id: `clr_${Date.now()}`,
      clarificationReference: `CLF-2026-${Math.floor(100 + Math.random() * 900)}`,
      shipmentId: data.shipmentId,
      trackingNumber: data.trackingNumber,
      customerId: data.customerId,
      customerName: data.customerName,
      issueType: data.issueType || 'incomplete_address',
      description: data.description,
      status: 'open',
      raisedAt: new Date().toISOString(),
      assignedToStaffName: data.assignedToStaffName,
    };
    setShipmentClarifications((prev) => [newClarification, ...prev]);
    return newClarification;
  };

  const resolveClarification = (id: string, resolutionNotes: string): { success: boolean; message: string } => {
    setShipmentClarifications((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolutionNotes,
            }
          : c
      )
    );
    return { success: true, message: 'Clarification marked resolved.' };
  };

  const applyShippingCredits = (amountNgn: number, shipmentTracking?: string): { success: boolean; message: string } => {
    if (amountNgn <= 0) return { success: false, message: 'Invalid shipping credit amount.' };
    if (amountNgn > currentCustomer.cashbackBalance) {
      return { success: false, message: 'Requested amount exceeds available unlocked shipping credits balance.' };
    }

    const newBalance = currentCustomer.cashbackBalance - amountNgn;
    setCustomers((prev) => ({
      ...prev,
      [activeCustomerKey]: {
        ...prev[activeCustomerKey],
        cashbackBalance: newBalance,
      },
    }));

    const ledgerEntry: CashbackLedgerItem = {
      id: 'cb_' + Date.now(),
      customerId: currentCustomer.id,
      shipmentId: shipmentTracking || 'checkout_credit_applied',
      trackingNumber: shipmentTracking || ('CREDIT-APPLIED-' + Math.floor(1000 + Math.random() * 9000)),
      amountNgn: -amountNgn,
      type: 'credits_redeemed',
      balanceAfterNgn: newBalance,
      status: 'released',
      description: `Promotional shipping credit applied at checkout for ${shipmentTracking || 'consignment'}`,
      createdAt: new Date().toISOString(),
      releasedAt: new Date().toISOString(),
    };
    setCashbackLedger((prev) => [ledgerEntry, ...prev]);

    return {
      success: true,
      message: `₦${amountNgn.toLocaleString()} shipping credit successfully deducted from promotional balance.`,
    };
  };

  const reverseShippingCredits = (amountNgn: number, shipmentTracking?: string) => {
    if (amountNgn <= 0) return;
    const newBalance = currentCustomer.cashbackBalance + amountNgn;
    setCustomers((prev) => ({
      ...prev,
      [activeCustomerKey]: {
        ...prev[activeCustomerKey],
        cashbackBalance: newBalance,
      },
    }));

    const ledgerEntry: CashbackLedgerItem = {
      id: 'cb_' + Date.now(),
      customerId: currentCustomer.id,
      shipmentId: shipmentTracking || 'payment_failed_reversal',
      trackingNumber: shipmentTracking || ('REVERSAL-' + Math.floor(1000 + Math.random() * 9000)),
      amountNgn: amountNgn,
      type: 'credit_reversal',
      balanceAfterNgn: newBalance,
      status: 'released',
      description: `Credit Reversal: Payment Failed / Declined on ${shipmentTracking || 'consignment checkout'}`,
      createdAt: new Date().toISOString(),
      releasedAt: new Date().toISOString(),
    };
    setCashbackLedger((prev) => [ledgerEntry, ...prev]);
  };

  const redeemCashback = (amountNgn: number): { success: boolean; message: string } => {
    return applyShippingCredits(amountNgn, 'manual_shipping_credit_redemption');
  };

  // TravelCarry Action Handlers
  const addTravelCarryRequest = (req: Omit<TravelCarryRequest, 'id' | 'createdAt'>): string => {
    const newId = `tc_req_${Date.now()}`;
    const newRecord: TravelCarryRequest = {
      ...req,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setTravelCarryRequests((prev) => [newRecord, ...prev]);
    return req.requestReference;
  };

  const updateTravelCarryStatus = (id: string, status: TravelCarryStatus, updates?: Partial<TravelCarryRequest>) => {
    setTravelCarryRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, ...updates } : r))
    );
  };

  const flagTravelCarrySafetyHold = (id: string, reason: string) => {
    setTravelCarryRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'on_hold_safety_review',
              isSafetyHold: true,
              safetyHoldReason: reason,
            }
          : r
      )
    );
  };

  const confirmTravelCarryDeliveryAndReleasePayout = (id: string) => {
    setTravelCarryRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'delivered',
              deliveryConfirmedByRecipient: true,
              payoutStatus: 'released',
            }
          : r
      )
    );
  };

  const registerTravellerInterest = (interest: Omit<TravellerInterest, 'id' | 'createdAt'>) => {
    const newId = `tint_${Date.now()}`;
    const newRecord: TravellerInterest = {
      ...interest,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setTravellerInterests((prev) => [newRecord, ...prev]);
  };

  // Address book handlers
  const addAddressBookEntry = (entry: Omit<AddressBookEntry, 'id' | 'createdAt'>) => {
    const newEntry: AddressBookEntry = {
      ...entry,
      id: `addr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAddressBook((prev) => [newEntry, ...prev]);
  };

  const deleteAddressBookEntry = (id: string) => {
    setAddressBook((prev) => prev.filter((a) => a.id !== id));
  };

  // Shipment template handlers
  const addShipmentTemplate = (tmpl: Omit<ShipmentTemplate, 'id' | 'createdAt'>) => {
    const newTmpl: ShipmentTemplate = {
      ...tmpl,
      id: `tmpl_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setShipmentTemplates((prev) => [newTmpl, ...prev]);
  };

  const deleteShipmentTemplate = (id: string) => {
    setShipmentTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  // Cargo enquiry handler
  const addCargoEnquiry = (enquiry: Omit<CargoEnquiry, 'id' | 'enquiryReference' | 'status' | 'createdAt'>): string => {
    const refNum = Math.floor(1000 + Math.random() * 9000);
    const enquiryRef = `CRG-2026-NG${refNum}`;
    const newEnquiry: CargoEnquiry = {
      ...enquiry,
      id: `crg_${Date.now()}`,
      enquiryReference: enquiryRef,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    setCargoEnquiries((prev) => [newEnquiry, ...prev]);
    return enquiryRef;
  };

  // Business team handlers
  const addBusinessTeamMember = (member: Omit<BusinessTeamMember, 'id' | 'joinedAt'>) => {
    const newMember: BusinessTeamMember = {
      ...member,
      id: `btm_${Date.now()}`,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setBusinessTeam((prev) => [...prev, newMember]);
  };

  const updateBusinessTeamRole = (id: string, newRole: BusinessTeamMember['role']) => {
    setBusinessTeam((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
  };

  const deleteBusinessTeamMember = (id: string) => {
    setBusinessTeam((prev) => prev.filter((m) => m.id !== id));
  };

  // Support claim handlers
  const addSupportClaim = (claim: Omit<SupportClaim, 'id' | 'claimNumber' | 'status' | 'createdAt' | 'updatedAt'>): string => {
    const num = Math.floor(100 + Math.random() * 900);
    const claimNum = `CLM-2026-NG${num}`;
    const newClaim: SupportClaim = {
      ...claim,
      id: `claim_${Date.now()}`,
      claimNumber: claimNum,
      status: 'submitted',
      history: [
        {
          status: 'submitted',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentCustomer.name || 'Consignor Customer',
          note: 'Formal claim submitted through online customer portal.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSupportClaims((prev) => [newClaim, ...prev]);

    addAuditLog({
      actorName: currentCustomer.name || 'Customer User',
      actorRole: 'customer',
      action: 'CLAIM_FILED',
      targetType: 'shipment',
      targetId: claimNum,
      details: `New claim lodged against tracking ${claim.shipmentTracking}. Type: ${claim.type}. Declared: ₦${claim.declaredValueNgn.toLocaleString()}.`,
    });

    return claimNum;
  };

  const updateSupportClaimStatus = (
    claimId: string,
    newStatus: ClaimStatus,
    note: string,
    approvedAmountNgn?: number
  ) => {
    setSupportClaims((prev) =>
      prev.map((c) => {
        if (c.id === claimId || c.claimNumber === claimId) {
          const historyEntry = {
            status: newStatus,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            actor: currentStaffUser?.name || 'Claims Operations Officer',
            note: note,
          };
          return {
            ...c,
            status: newStatus,
            decisionNotes: note || c.decisionNotes,
            approvedAmountNgn: approvedAmountNgn !== undefined ? approvedAmountNgn : c.approvedAmountNgn,
            updatedAt: new Date().toISOString(),
            history: [...(c.history || []), historyEntry],
          };
        }
        return c;
      })
    );

    addAuditLog({
      actorName: currentStaffUser?.name || 'Claims Operations Officer',
      actorRole: 'operations',
      action: 'CLAIM_STATUS_TRANSITION',
      targetType: 'shipment',
      targetId: claimId,
      details: `Claim status changed to ${newStatus}. Note: ${note}${approvedAmountNgn !== undefined ? ` (Approved Amount: ₦${approvedAmountNgn.toLocaleString()})` : ''}`,
    });
  };

  // Protection configuration handlers
  const updateProtectionConfig = (updated: ProtectionConfig, reason: string) => {
    setProtectionConfig(updated);
    addAuditLog({
      actorName: currentStaffUser?.name || 'Chief Underwriting Officer',
      actorRole: 'platform_admin',
      action: 'PROTECTION_CONFIG_UPDATED',
      targetType: 'config',
      targetId: 'protection_underwriting_policy',
      details: `Underwriting policy adjusted. Reason: ${reason}. Premium rate: ${updated.premiumRatePercentage}%, Basic liability cap: ₦${updated.basicLiabilityLimitNgn.toLocaleString()}.`,
    });
  };

  const addProtectionCertificate = (cert: ProtectionCertificateRecord) => {
    setProtectionCertificates((prev) => [cert, ...prev]);
    addAuditLog({
      actorName: 'Swiftvero Underwriting Automation',
      actorRole: 'operations',
      action: 'PROTECTION_CERTIFICATE_ISSUED',
      targetType: 'shipment',
      targetId: cert.certificateNumber,
      details: `Protection certificate issued for ${cert.shipmentTrackingNumber}. Plan: ${cert.protectionPlan}. Coverage: ₦${cert.coverageAmountNgn.toLocaleString()}. Premium: ₦${cert.premiumPaidNgn.toLocaleString()}.`,
    });
  };

  // Branch Desk Operations & Walk-in Customers
  const searchCustomers = (query: string): CustomerProfile[] => {
    const q = query.trim().toLowerCase();
    const list = Object.values(customers);
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  };

  const registerWalkInCustomer = (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
    country?: string;
    kycStatus?: KycStatus;
  }) => {
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;
    const cleanPhone = data.phone.trim();
    const cleanEmail = data.email?.trim().toLowerCase() || '';

    // Check duplicate by phone or email
    const existing = Object.values(customers).find(
      (c) =>
        c.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '') ||
        (cleanEmail && c.email.toLowerCase() === cleanEmail)
    );

    if (existing) {
      return {
        success: true,
        customer: existing,
        isDuplicate: true,
        message: `Existing customer record located for ${existing.name} (${existing.phone}).`,
        inviteLink: `https://swiftvero.express/account/activate?ref=${existing.id}&token=tok_${existing.id.slice(-6)}`,
      };
    }

    const newId = `cust_walkin_${Date.now().toString().slice(-6)}`;
    const newCustomer: CustomerProfile = {
      id: newId,
      name: fullName,
      email: cleanEmail || `${data.firstName.toLowerCase()}.${Date.now().toString().slice(-4)}@customer.swiftvero.ng`,
      phone: cleanPhone,
      customerType: 'individual',
      address: data.address || 'Walk-in Counter, Lagos Branch',
      country: data.country || 'Nigeria',
      kycStatus: data.kycStatus || 'not_started',
      cashbackBalance: 0,
      referralCode: `SWV-WALK${Date.now().toString().slice(-4)}`,
      referralsCount: 0,
      termsAcceptedAt: new Date().toISOString(),
      isWalkIn: true,
      createdByStaffId: currentStaffUser?.staffId || 'SWV-STAFF-002',
      assignedBranchId: activeBranchId,
    };

    setCustomers((prev) => ({
      ...prev,
      [newId]: newCustomer,
    }));

    addAuditLog({
      actorName: currentStaffUser?.name || 'Chioma Eze',
      actorRole: 'front_desk',
      action: 'CUSTOMER_CREATED',
      targetType: 'staff',
      targetId: newId,
      details: `Desk Admin registered walk-in counter customer ${fullName} (${cleanPhone}).`,
    });

    return {
      success: true,
      customer: newCustomer,
      isDuplicate: false,
      message: `Walk-in customer account ${newCustomer.name} created successfully.`,
      inviteLink: `https://swiftvero.express/account/activate?ref=${newId}&token=tok_${newId.slice(-6)}`,
    };
  };

  const createHandoverManifest = (
    data: Omit<HandoverManifestRecord, 'id' | 'manifestNumber' | 'handedOverAt'>
  ): HandoverManifestRecord => {
    const newManifest: HandoverManifestRecord = {
      ...data,
      id: `mnf_${Date.now()}`,
      manifestNumber: `MNF-2026-${data.branchId.replace('branch_', '').toUpperCase()}-${Date.now().toString().slice(-4)}`,
      handedOverAt: new Date().toISOString(),
    };

    setHandoverManifests((prev) => [newManifest, ...prev]);

    addAuditLog({
      actorName: currentStaffUser?.name || 'Chioma Eze',
      actorRole: 'front_desk',
      action: 'HANDOVER_MANIFEST_DISPATCHED',
      targetType: 'branch',
      targetId: newManifest.manifestNumber,
      details: `Dispatched ${newManifest.totalPackages} packages (${newManifest.totalWeightKg}kg) via driver ${newManifest.driverName} to ${newManifest.destinationHub}.`,
    });

    return newManifest;
  };

  // Customer Consents & Auditable Acknowledgements
  const recordCustomerConsent = (record: Omit<CustomerConsentRecord, 'id' | 'timestamp'>) => {
    const newRecord: CustomerConsentRecord = {
      ...record,
      id: `cst_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setCustomerConsents((prev) => [newRecord, ...prev]);
  };

  const recordBulkConsents = (records: Array<Omit<CustomerConsentRecord, 'id' | 'timestamp'>>) => {
    const now = new Date().toISOString();
    const newRecords: CustomerConsentRecord[] = records.map((r, i) => ({
      ...r,
      id: `cst_${Date.now()}_${i}`,
      timestamp: now,
    }));
    setCustomerConsents((prev) => [...newRecords, ...prev]);
  };

  // Centralized Operations Pickup Management
  const bookPickupRequest: DemoContextType['bookPickupRequest'] = (data) => {
    const eligibility = validatePickupEligibility({
      state: data.state || 'Lagos',
      city: data.city,
      pickupType: data.pickupType === 'priority' ? 'priority' : 'standard',
      branches,
    });

    if (!eligibility.serviceable) {
      return {
        success: false,
        message: `${eligibility.reason || 'Pickup service is unavailable in this location.'} ${
          eligibility.fallbackSuggestion || ''
        }`.trim(),
      };
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const isPriority = data.pickupType === 'priority';
    const deadline = new Date(now.getTime() + (isPriority ? 6 : 24) * 3600 * 1000);
    const existingSwv = new Set(shipments.map((s) => s.trackingNumber));
    const existingPkp = new Set(pickupJobs.map((p) => p.pickupReference));

    const existingLinkedShipment = data.linkedShipmentTracking
      ? shipments.find(
          (s) =>
            s.trackingNumber.toUpperCase() === data.linkedShipmentTracking!.trim().toUpperCase() ||
            s.id === data.linkedShipmentTracking
        )
      : undefined;

    const existingLinkedQuote = data.linkedQuoteRef
      ? quotes.find((q) => q.quoteRef.toUpperCase() === data.linkedQuoteRef!.trim().toUpperCase())
      : undefined;

    // Prevent duplicate shipment creation if pickup is already attached
    if (existingLinkedShipment) {
      const existingJob = pickupJobs.find(
        (j) =>
          (j.shipmentId === existingLinkedShipment.id ||
            j.trackingNumber.includes(existingLinkedShipment.trackingNumber)) &&
          j.status !== 'cancelled' &&
          j.status !== 'failed'
      );
      if (existingJob) {
        return {
          success: false,
          message: `Pickup ${existingJob.pickupReference} is already active for shipment ${existingLinkedShipment.trackingNumber}.`,
          pickup: existingJob,
          trackingNumber: existingLinkedShipment.trackingNumber,
        };
      }
    }

    const trackingNumber = existingLinkedShipment
      ? existingLinkedShipment.trackingNumber
      : generateUniqueReference({ prefix: 'SWV', existingCodes: existingSwv });
    const pickupReference = generateUniqueReference({ prefix: 'PKP', existingCodes: existingPkp });
    const shipmentId = existingLinkedShipment ? existingLinkedShipment.id : `ship_${now.getTime()}`;

    const pickupFeeNgn = isPriority ? (data.pickupFeeNgn ?? eligibility.priorityFeeNgn) : 0;
    const estimatedWindow =
      data.estimatedWindow ||
      (isPriority
        ? '1 – 6 hours (subject to location & agent availability)'
        : 'Within 24 hours of confirmation');
    const destCountry =
      existingLinkedShipment?.destinationCountry ||
      existingLinkedQuote?.destinationCountry ||
      data.destinationCountry ||
      'United Kingdom';
    const destCity =
      existingLinkedShipment?.destinationCity ||
      existingLinkedQuote?.destinationCity ||
      data.destinationCity ||
      'London';

    const newJob: PickupJob = {
      id: `job_${now.getTime()}`,
      shipmentId,
      trackingNumber,
      pickupReference,
      senderName: data.customerName,
      senderPhone: data.customerPhone,
      senderEmail: data.customerEmail,
      alternateContactName: data.alternateContactName,
      alternateContactPhone: data.alternateContactPhone,
      senderAddress: data.pickupAddress,
      state: data.state || 'Lagos',
      city: data.city || 'Ikeja',
      country: data.country || 'Nigeria',
      landmark: data.landmark,
      branchId: 'branch_ikeja',
      branchName: 'Ikeja Cargo Hub (Lagos Mainland)',
      scheduledSlot: data.preferredTimeSlot || (isPriority ? 'Priority Window (1 – 6 hrs)' : '10:00 AM - 1:00 PM'),
      scheduledDate: data.preferredDate || nowIso.slice(0, 10),
      bookingConfirmedAt: nowIso,
      collectionDeadline: deadline.toISOString(),
      pickupType: isPriority ? 'priority' : 'standard',
      pickupFeeNgn,
      estimatedWindow,
      isPriorityFlag: isPriority,
      isFragile: Boolean(data.isFragile),
      fragileHandlingNotes: data.fragileNotes,
      packagePhotoUrl: data.packagePhotoUrl,
      estimatedSizeCategory: data.estimatedSizeCategory,
      packageCount: data.packageCount || 1,
      packageDescription: data.packageDescription,
      declaredWeightKg: data.estimatedWeightKg || 2.5,
      declaredDimensions: { length: 30, width: 25, height: 20 },
      status: 'booking_received',
      notes: `${isPriority ? 'Priority' : 'Standard'} pickup booking confirmed (${estimatedWindow}). Special notes: ${data.specialInstructions || 'None'}`,
      isDemo: environmentMode === 'demo',
    };

    setPickupJobs((prev) => [newJob, ...prev]);

    if (existingLinkedShipment) {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === existingLinkedShipment.id
            ? {
                ...s,
                collectionMethod: isPriority ? 'priority_pickup' : 'standard_pickup',
                collectionFeeNgn: pickupFeeNgn,
                priorityCollectionWindow: isPriority ? estimatedWindow : undefined,
                pickupType: 'doorstep',
                pickupScheduledDate: data.preferredDate,
                pickupScheduledSlot: newJob.scheduledSlot,
                pickupAddress: data.pickupAddress,
                pickupStatus: 'requested',
                pickupStatusLabel: isPriority
                  ? 'Priority Pickup Requested (1 – 6 hour window)'
                  : 'Standard Pickup Confirmed (24h target)',
                lastUpdateTimestamp: nowIso,
                trackingEvents: [
                  ...(s.trackingEvents || []),
                  {
                    id: `evt_pkp_${now.getTime()}`,
                    timestamp: nowIso.replace('T', ' ').slice(0, 16),
                    stage: isPriority ? 'Priority Pickup Attached' : 'Standard Pickup Attached',
                    location: `${data.city || 'Lagos'}, ${data.state || 'Nigeria'}`,
                    description: `Pickup ${pickupReference} linked to existing shipment ${trackingNumber}. No duplicate shipment created.`,
                  },
                ],
              }
            : s
        )
      );
    } else {
      const generatedQuote =
        existingLinkedQuote?.quoteBreakdown ||
        generateQuoteBreakdown({
          destinationCountry: destCountry,
          actualWeightKg: data.estimatedWeightKg || 2.5,
          lengthCm: 30,
          widthCm: 25,
          heightCm: 20,
          tier: existingLinkedQuote?.serviceTier || 'standard',
        });

      const newShipment: ShipmentRecord = {
        id: shipmentId,
        trackingNumber,
        swiftveroCode: trackingNumber,
        sourceQuoteRef: existingLinkedQuote?.quoteRef,
        isFragile: Boolean(data.isFragile),
        fragileHandlingNotes: data.fragileNotes,
        direction: 'export',
        customerId: currentCustomer.id || 'cust_01_verified',
        customerName: data.customerName,
        customerEmail: data.customerEmail || currentCustomer.email,
        customerPhone: data.customerPhone,
        senderName: data.customerName,
        senderPhone: data.customerPhone,
        senderAddress: data.pickupAddress,
        originCountry: data.country || 'Nigeria',
        originCity: data.city || 'Lagos',
        recipientName: 'Recipient (To Be Confirmed before Dispatch)',
        recipientPhone: '+44 7700 900077',
        recipientAddress: `${destCity}, ${destCountry}`,
        destinationCountry: destCountry,
        destinationCity: destCity,
        category: 'goods',
        contentsDescription: data.packageDescription,
        items: [
          {
            id: 'item_1',
            description: data.packageDescription,
            quantity: data.packageCount || 1,
            declaredValue: 80000,
            isFragile: Boolean(data.isFragile),
            fragileHandlingNotes: data.fragileNotes,
          },
        ],
        packageCount: data.packageCount || 1,
        declaredWeightKg: data.estimatedWeightKg || 2.5,
        declaredDimensions: { length: 30, width: 25, height: 20 },
        collectionMethod: isPriority ? 'priority_pickup' : 'standard_pickup',
        collectionFeeNgn: pickupFeeNgn,
        priorityCollectionWindow: isPriority ? estimatedWindow : undefined,
        pickupType: 'doorstep',
        pickupAddress: data.pickupAddress,
        pickupScheduledDate: data.preferredDate,
        pickupScheduledSlot: newJob.scheduledSlot,
        pickupStatus: 'requested',
        pickupStatusLabel: isPriority
          ? 'Priority Pickup Requested (1 – 6 hour window)'
          : 'Standard Pickup Confirmed (24h target)',
        status: 'pickup_requested',
        quote: generatedQuote,
        quoteVersions: [
          {
            version: 1,
            quote: generatedQuote,
            measuredWeightKg: data.estimatedWeightKg || 2.5,
            measuredDimensions: { length: 30, width: 25, height: 20 },
            changedBy: 'Customer Pickup Estimate',
            reason: 'Initial pickup estimate prior to facility digital scale weighing',
            status: 'active',
            createdAt: nowIso,
          },
        ],
        selectedTier: existingLinkedQuote?.serviceTier || 'standard',
        estimatedDeliveryDisplay: generatedQuote.estimatedDeliveryDisplay || '3 – 5 Business Days from Dispatch',
        paymentStatus: 'unpaid',
        trackingEvents: [
          {
            id: 'evt_init',
            timestamp: nowIso.replace('T', ' ').slice(0, 16),
            stage: isPriority ? 'Priority Pickup Booking Confirmed' : 'Standard Pickup Booking Confirmed',
            location: 'Swiftvero Operations Control Tower',
            description: `Consignor submitted ${isPriority ? 'Priority' : 'Standard'} collection booking (${estimatedWindow}). Estimated weight ${data.estimatedWeightKg || 2.5}kg is preliminary until facility scale weighing.`,
          },
        ],
        createdAt: nowIso,
        lastUpdateTimestamp: nowIso,
        customerAcknowledgedTerms: true,
        customerAcknowledgedDeclaration: true,
        kycRequiredAtBooking: true,
        cashbackEarned: Math.round(generatedQuote.freightCharge * 0.03),
        cashbackStatus: 'pending',
        hasReview: false,
        isDemo: environmentMode === 'demo',
      };
      setShipments((prev) => [newShipment, ...prev]);

      if (existingLinkedQuote) {
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === existingLinkedQuote.id
              ? {
                  ...q,
                  status: 'converted',
                  convertedShipmentId: shipmentId,
                  convertedTrackingNumber: trackingNumber,
                  convertedShipmentCodes: [trackingNumber],
                  updatedAt: nowIso,
                }
              : q
          )
        );
      }
    }

    const consentEntries: Array<Omit<CustomerConsentRecord, 'id' | 'timestamp'>> = data.consents.map((c) => ({
      customerId: currentCustomer.id || 'cust_01_verified',
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      bookingId: newJob.id,
      shipmentTrackingNumber: trackingNumber,
      category: c.category,
      policyVersion: c.policyVersion,
      statement: c.statement,
      policyKey: (c as any).policyKey || 'pickup',
      status: 'accepted',
      auditDetails: `Recorded during ${isPriority ? 'priority' : 'standard'} pickup booking ${pickupReference}.`,
    }));

    if (data.marketingOptIn) {
      consentEntries.push({
        customerId: currentCustomer.id || 'cust_01_verified',
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        bookingId: newJob.id,
        shipmentTrackingNumber: trackingNumber,
        category: 'marketing',
        policyVersion: 'v2.0',
        statement: 'I would like to receive Swiftvero promotional offers, shipping updates, discounts and marketing communications.',
        policyKey: 'privacy',
        status: 'accepted',
        auditDetails: 'Consignor explicitly opted-in to marketing updates.',
      });
    }

    recordBulkConsents(consentEntries);

    setStaffNotifications((prev) => [
      {
        id: `snot_pkp_${now.getTime()}`,
        targetWorkspace: 'pickup_shipping',
        targetRole: 'pickup_shipping',
        title: `${isPriority ? 'PRIORITY PICKUP' : 'NEW PICKUP'} (${pickupReference})`,
        message: `${trackingNumber}: Collect ${data.packageCount} pkg(s) from ${data.city || 'Lagos'}, ${data.state || 'Nigeria'} (${estimatedWindow}).`,
        severity: isPriority ? 'priority' : 'info',
        relatedRef: trackingNumber,
        isRead: false,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      },
      ...prev,
    ]);

    emitCustomerNotification({
      eventKey: `pickup_booked:${pickupReference}`,
      triggerType: 'pickup_booked',
      customerId: currentCustomer.id,
      title: `Pickup Booked (${pickupReference})`,
      message: `Your ${isPriority ? 'Priority' : 'Standard'} pickup is confirmed for ${data.pickupAddress}. Permanent Shipment Ref: ${trackingNumber}.`,
      relatedReference: trackingNumber,
      channel: 'email',
    });

    addAuditLog({
      actorName: data.customerName,
      actorRole: 'customer',
      action: isPriority ? 'PRIORITY_PICKUP_BOOKING_CREATED' : 'PICKUP_BOOKING_CREATED_24H_GUARANTEE',
      targetType: 'pickup',
      targetId: pickupReference,
      details: `Customer booked ${isPriority ? 'priority' : 'standard'} pickup (${estimatedWindow}) for ${data.packageCount} package(s) -> Shipment ${trackingNumber}. Address: ${data.pickupAddress}`,
    });

    return {
      success: true,
      message: `Pickup confirmed! Ref: ${pickupReference} · Shipment ID: ${trackingNumber}. ${
        isPriority
          ? `Priority pickup flagged (${estimatedWindow}).`
          : `Our collection handler targets collection within 24 hours.`
      }`,
      pickup: newJob,
      trackingNumber,
    };
  };

  const assignPickupHandler = (
    jobId: string,
    handlerType: 'staff' | 'external_partner' | 'manual',
    handlerName: string,
    handlerPhone: string,
    scheduledTime: string,
    notes?: string
  ) => {
    const job = pickupJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, message: 'Pickup job not found.' };
    const nowIso = new Date().toISOString();

    setPickupJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              collectionHandlerType: handlerType,
              collectionHandlerName: handlerName,
              collectionHandlerPhone: handlerPhone,
              collectionHandlerNotes: notes,
              scheduledSlot: scheduledTime,
              status: 'scheduled',
              assignedAt: nowIso,
            }
          : j
      )
    );

    const linkedShipment = shipments.find(
      (s) => s.id === job.shipmentId || job.trackingNumber.includes(s.trackingNumber)
    );
    if (linkedShipment) {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === linkedShipment.id
            ? {
                ...s,
                status: 'pickup_scheduled',
                pickupStatus: 'scheduled',
                pickupStatusLabel: `Scheduled (${scheduledTime})`,
                lastUpdateTimestamp: nowIso,
              }
            : s
        )
      );
      emitCustomerNotification({
        eventKey: `pickup_scheduled:${job.id}:${scheduledTime}`,
        triggerType: 'pickup_scheduled',
        customerId: linkedShipment.customerId,
        title: `Pickup Scheduled (${job.pickupReference})`,
        message: `Handler ${handlerName} (${handlerPhone}) is scheduled to collect ${linkedShipment.trackingNumber} during ${scheduledTime}.`,
        relatedReference: linkedShipment.trackingNumber,
        channel: 'in_app',
      });
    }

    addAuditLog({
      actorName: currentStaffUser?.name || 'Operations Controller',
      actorRole: role,
      action: 'COLLECTION_HANDLER_ASSIGNED',
      targetType: 'pickup',
      targetId: job.pickupReference || job.trackingNumber,
      details: `Assigned ${handlerType} handler "${handlerName}" (${handlerPhone}) for collection window ${scheduledTime}.`,
    });

    return { success: true, message: `Handler ${handlerName} successfully assigned.` };
  };

  const markPickupFailed: DemoContextType['markPickupFailed'] = (jobId, reason) => {
    const job = pickupJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, message: 'Pickup job not found.' };
    if (!reason.trim()) return { success: false, message: 'A failure reason is required before marking a pickup failed.' };

    const nowIso = new Date().toISOString();
    setPickupJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'failed',
              failureReason: reason.trim(),
              notes: `Pickup failed: ${reason.trim()}`,
            }
          : j
      )
    );

    const linkedShipment = shipments.find(
      (s) => s.id === job.shipmentId || job.trackingNumber.includes(s.trackingNumber)
    );
    if (linkedShipment) {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === linkedShipment.id
            ? {
                ...s,
                pickupStatus: 'failed_attempt',
                pickupStatusLabel: `Collection Attempt Failed (${reason.trim()})`,
                lastUpdateTimestamp: nowIso,
                trackingEvents: [
                  ...(s.trackingEvents || []),
                  {
                    id: `evt_pkpfail_${Date.now()}`,
                    timestamp: nowIso.replace('T', ' ').slice(0, 16),
                    stage: 'Pickup Attempt Unsuccessful',
                    location: job.senderAddress,
                    description: `Collection attempt marked failed by Operations: ${reason.trim()}. Ready to reschedule.`,
                    isDelayed: true,
                  },
                ],
              }
            : s
        )
      );
      emitCustomerNotification({
        eventKey: `pickup_failed:${job.id}:${nowIso.slice(0, 16)}`,
        triggerType: 'pickup_failed',
        customerId: linkedShipment.customerId,
        title: `Pickup Attempt Unsuccessful (${job.pickupReference})`,
        message: `Our team could not complete pickup ${job.pickupReference} (${reason.trim()}). Operations will reschedule with you.`,
        relatedReference: linkedShipment.trackingNumber,
        channel: 'in_app',
      });
    }

    addAuditLog({
      actorName: currentStaffUser?.name || 'Operations Controller',
      actorRole: role,
      action: 'PICKUP_MARKED_FAILED',
      targetType: 'pickup',
      targetId: job.pickupReference || job.trackingNumber,
      details: `Pickup ${job.pickupReference} marked failed. Reason: ${reason.trim()}`,
    });

    return { success: true, message: `Pickup ${job.pickupReference} marked failed.` };
  };

  const confirmDoorstepCollection = (
    jobId: string,
    packageCount: number,
    visibleCondition: 'good' | 'minor_outer_scuff' | 'carton_damaged' | 'unsealed',
    customerSignatureName: string,
    notes?: string,
    photos?: string[]
  ) => {
    const job = pickupJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, message: 'Pickup job not found.' };

    const now = new Date();
    const nowIso = now.toISOString();
    setPickupJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'picked_up',
              collectionConfirmedAt: nowIso,
              collectionPackageCount: packageCount,
              collectionVisibleCondition: visibleCondition,
              collectionCustomerSigned: true,
              collectionCustomerName: customerSignatureName,
              collectionPhotos: photos || [],
              notes: notes || 'Collected at consignor address. Transporting to facility for inspection and certified weighing.',
            }
          : j
      )
    );

    const linkedShipment = shipments.find(
      (s) => s.id === job.shipmentId || job.trackingNumber.includes(s.trackingNumber)
    );
    setShipments((prev) =>
      prev.map((s) =>
        s.id === job.shipmentId || job.trackingNumber.includes(s.trackingNumber)
          ? {
              ...s,
              status: 'picked_up',
              pickupStatus: 'picked_up',
              pickupStatusLabel: 'Collected - In Transit to Facility',
              lastUpdateTimestamp: nowIso,
              trackingEvents: [
                ...(s.trackingEvents || []),
                {
                  id: `evt_${Date.now()}`,
                  timestamp: nowIso.replace('T', ' ').slice(0, 16),
                  stage: 'Collected at Consignor Address',
                  location: job.senderAddress,
                  description: `Package count (${packageCount}) verified in visible condition "${visibleCondition}" by collection handler ${job.collectionHandlerName || 'Swiftvero Handler'}. Signed by ${customerSignatureName}. En route to Swiftvero facility for scale intake.`,
                },
              ],
            }
          : s
      )
    );

    if (linkedShipment) {
      emitCustomerNotification({
        eventKey: `package_collected:${job.id}`,
        triggerType: 'package_collected',
        customerId: linkedShipment.customerId,
        title: `Package Collected (${linkedShipment.trackingNumber})`,
        message: `${packageCount} package(s) collected from ${job.senderAddress} and en route to our facility for certified weighing.`,
        relatedReference: linkedShipment.trackingNumber,
        channel: 'in_app',
      });
    }

    addAuditLog({
      actorName: job.collectionHandlerName || currentStaffUser?.name || 'Collection Handler',
      actorRole: 'operations',
      action: 'DOORSTEP_COLLECTION_COMPLETED',
      targetType: 'pickup',
      targetId: job.pickupReference || job.trackingNumber,
      details: `Doorstep collection completed: ${packageCount} packages in condition "${visibleCondition}". Signed by ${customerSignatureName}. No scale weighing at customer address.`,
    });

    return { success: true, message: `Doorstep collection confirmed for ${packageCount} package(s).` };
  };

  const confirmFacilityReceipt: DemoContextType['confirmFacilityReceipt'] = ({
    jobId,
    packageCountReceived,
    visibleCondition,
    packageDescription,
    discrepancies,
    photoUrls,
  }) => {
    const job = pickupJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, message: 'Pickup job not found.' };
    if (!packageCountReceived || packageCountReceived < 1) {
      return { success: false, message: 'Received package count is required.' };
    }
    if (!packageDescription.trim()) {
      return { success: false, message: 'Package description confirmation is required.' };
    }

    const nowIso = new Date().toISOString();
    const staffName = currentStaffUser?.name || 'Chioma Eze';
    const receipt: FacilityReceiptRecord = {
      confirmedAt: nowIso,
      confirmedByStaffId: currentStaffUser?.staffId || 'SWV-STAFF-002',
      confirmedByStaffName: staffName,
      packageCountReceived,
      visibleCondition,
      packageDescription: packageDescription.trim(),
      discrepancies: discrepancies?.trim() || undefined,
      photoUrls: photoUrls || [],
    };

    setPickupJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'facility_received',
              facilityReceivedAt: nowIso,
              facilityStaffId: receipt.confirmedByStaffId,
              facilityStaffName: staffName,
              facilityPackageCountConfirmed: packageCountReceived,
              facilityReceipt: receipt,
              facilityConditionNotes: discrepancies?.trim() || `Physical receipt verified (${visibleCondition}).`,
            }
          : j
      )
    );

    const linkedShipment = shipments.find(
      (s) => s.id === job.shipmentId || job.trackingNumber.includes(s.trackingNumber)
    );

    setShipments((prev) =>
      prev.map((s) =>
        s.id === job.shipmentId || job.trackingNumber.includes(s.trackingNumber)
          ? {
              ...s,
              status: 'arrived_at_facility',
              pickupStatusLabel: 'Arrived at Swiftvero Facility — Awaiting Measurement',
              facilityReceipt: receipt,
              lastUpdateTimestamp: nowIso,
              trackingEvents: [
                ...(s.trackingEvents || []),
                {
                  id: `evt_fac_${Date.now()}`,
                  timestamp: nowIso.replace('T', ' ').slice(0, 16),
                  stage: 'Arrived at Swiftvero Facility',
                  location: job.branchName || 'Ikeja Cargo Hub',
                  description: `Received ${packageCountReceived} package(s) in "${visibleCondition}" condition by ${staffName}. ${discrepancies?.trim() ? `Note: ${discrepancies.trim()}. ` : ''}Queued for scale weighing & measurement.`,
                },
              ],
            }
          : s
      )
    );

    if (linkedShipment) {
      emitCustomerNotification({
        eventKey: `arrived_at_facility:${linkedShipment.trackingNumber}`,
        triggerType: 'arrived_at_facility',
        customerId: linkedShipment.customerId,
        title: `Arrived at Swiftvero Facility (${linkedShipment.trackingNumber})`,
        message: `Your package (${packageCountReceived} box/parcel) has physically arrived at ${job.branchName || 'our Lagos facility'} and is queued for certified weighing and measurement.`,
        relatedReference: linkedShipment.trackingNumber,
        channel: 'email',
      });
    }

    addAuditLog({
      actorName: staffName,
      actorRole: role,
      action: 'FACILITY_PHYSICAL_RECEIPT_CONFIRMED',
      targetType: 'pickup',
      targetId: job.trackingNumber,
      details: `Confirmed physical arrival of ${packageCountReceived} pkg(s) (${visibleCondition}). Description: ${packageDescription.trim()}.`,
    });

    return {
      success: true,
      message: `Physical arrival confirmed at facility for ${job.trackingNumber}. Ready for scale weighing.`,
    };
  };

  const confirmFacilityArrivalAndWeigh = (
    jobId: string,
    actualWeightKg: number,
    dimensions: { length: number; width: number; height: number },
    repackagingApplied: boolean,
    conditionNotes?: string,
    options?: {
      packages?: RawPackageInput[];
      divisorRuleId?: string;
      selectedServiceTier?: ServiceTier;
    }
  ) => {
    const job = pickupJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, message: 'Pickup job not found.', chargeableWeightKg: 0 };

    const linkedShipment = shipments.find(
      (s) => s.id === job.shipmentId || job.trackingNumber.includes(s.trackingNumber)
    );
    const destinationCountry = linkedShipment?.destinationCountry || 'United Kingdom';
    const serviceTier =
      options?.selectedServiceTier ||
      linkedShipment?.selectedTier ||
      linkedShipment?.quote?.serviceTier ||
      'standard';
    const staffName = currentStaffUser?.name || 'Chioma Eze';

    const chosenRule =
      carrierDivisorRules.find((r) => r.id === options?.divisorRuleId && r.isActive) ||
      carrierDivisorRules.find((r) => r.serviceTier === serviceTier && r.isActive) ||
      carrierDivisorRules[0];

    const packagesInput: RawPackageInput[] =
      options?.packages && options.packages.length > 0
        ? options.packages
        : [
            {
              description: job.packageDescription || 'Primary Package',
              actualWeightKg,
              lengthCm: dimensions.length,
              widthCm: dimensions.width,
              heightCm: dimensions.height,
            },
          ];

    const baseQuote: ShipmentRecord['quote'] =
      linkedShipment?.quote ||
      generateQuoteBreakdown({
        destinationCountry,
        actualWeightKg: job.declaredWeightKg || actualWeightKg,
        lengthCm: dimensions.length,
        widthCm: dimensions.width,
        heightCm: dimensions.height,
        tier: serviceTier,
      });

    const { measurementSummary, revisedQuote, availableOptions } = recalculateVerifiedQuoteFromPackages({
      originalQuote: baseQuote,
      destinationCountry,
      packages: packagesInput,
      divisorRule: chosenRule,
      measuredBy: staffName,
      tierOverride: serviceTier,
    });

    const now = new Date();
    const nowIso = now.toISOString();
    const volWeight = measurementSummary.totalVolumetricWeightKg;
    const chargeableWeight = measurementSummary.totalBillableWeightKg;
    const totalActualWeight = measurementSummary.totalActualWeightKg;

    setPickupJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'quotation_ready',
              facilityReceivedAt: j.facilityReceivedAt || nowIso,
              facilityStaffId: currentStaffUser?.staffId || 'SWV-STAFF-002',
              facilityStaffName: staffName,
              facilityPackageCountConfirmed: measurementSummary.packages.length,
              facilityActualWeightKg: totalActualWeight,
              facilityDimensions: dimensions,
              facilityVolumetricWeightKg: volWeight,
              facilityChargeableWeightKg: chargeableWeight,
              facilityRepackagingApplied: repackagingApplied,
              facilityConditionNotes: conditionNotes || j.facilityConditionNotes,
              finalQuoteGenerated: true,
              verifiedWeightKg: totalActualWeight,
              verifiedDimensions: dimensions,
              packageMeasurements: measurementSummary.packages,
              appliedDivisor: measurementSummary.divisorUsed,
            }
          : j
      )
    );

    const verifiedPaidNgn =
      linkedShipment && linkedShipment.paymentStatus === 'paid'
        ? linkedShipment.originalPaidAmountNgn ||
          linkedShipment.finalAmountPaidNgn ||
          linkedShipment.quote.totalAmount
        : 0;

    const settlement = evaluateShipmentFinancialSettlement({
      finalShippingPriceNgn: revisedQuote.totalAmount,
      verifiedPaymentsAllocatedNgn: verifiedPaidNgn,
    });

    const existingAdjustmentRefs = new Set(paymentAdjustments.map((a) => a.adjustmentRef));
    const maybeAdjustment =
      linkedShipment && linkedShipment.paymentStatus === 'paid'
        ? buildWeightPaymentAdjustment({
            shipment: linkedShipment,
            newQuote: revisedQuote,
            quoteVersionNumber: (linkedShipment.quoteVersions?.length || 1) + 1,
            verifiedBillableWeightKg: chargeableWeight,
            createdByStaffName: staffName,
            reason: `Facility scale verification (${measurementSummary.packages.length} box(es), ${totalActualWeight}kg actual / ${chargeableWeight}kg billable via /${measurementSummary.divisorUsed})`,
            inspectionNotes: conditionNotes,
            existingAdjustmentRefs,
            isDemo: environmentMode === 'demo',
            now,
          })
        : null;

    if (maybeAdjustment) {
      setPaymentAdjustments((prev) => [maybeAdjustment, ...prev]);

      // Scenario B (Overpaid): Create idempotent ShipmentCreditRecord strictly as Available Account Credit (NOT cashback or wallet deposit)
      if (settlement.scenario === 'overpaid' && settlement.overpaymentCreditNgn > 0 && linkedShipment) {
        const creditRes = issueShipmentOverpaymentCreditIdempotently({
          existingCredits: shipmentCredits,
          shipment: linkedShipment,
          overpaidAmountNgn: settlement.overpaymentCreditNgn,
          adjustmentRef: maybeAdjustment.adjustmentRef,
          isDemo: environmentMode === 'demo',
          now,
        });

        if (creditRes.created && creditRes.creditRecord) {
          const newCredit = creditRes.creditRecord;
          setShipmentCredits((prev) => [newCredit, ...prev]);

          const ownerKey =
            Object.keys(customers).find((k) => customers[k].id === linkedShipment.customerId) ||
            activeCustomerKey;
          const owner = customers[ownerKey];
          if (owner) {
            const beforeCred = owner.accountCreditNgn || 0;
            const afterCred = beforeCred + newCredit.originalCreditNgn;
            setCustomers((prev) => ({
              ...prev,
              [ownerKey]: {
                ...prev[ownerKey],
                accountCreditNgn: afterCred,
              },
            }));
            setWalletTransactions((prev) => [
              {
                id: `wtx_ovr_${now.getTime()}`,
                transactionReference: `SWV-TXN-${Math.floor(100000 + Math.random() * 899999)}`,
                walletId: owner.walletId || `WLT-${owner.id}`,
                customerId: owner.id,
                customerName: owner.name,
                type: 'overpayment_credit',
                entryType: 'credit',
                amountNgn: newCredit.originalCreditNgn,
                balanceBeforeNgn: beforeCred,
                balanceAfterNgn: afterCred,
                balanceType: 'account_credit',
                status: 'successful',
                shipmentTrackingNumber: linkedShipment.trackingNumber,
                description: `Overpayment Shipment Credit (${newCredit.creditRef}) from ${linkedShipment.trackingNumber} scale reweigh`,
                createdAt: nowIso,
                isDemo: environmentMode === 'demo',
              },
              ...prev,
            ]);
          }

          emitCustomerNotification({
            eventKey: `overpayment_credit_created:${newCredit.creditRef}`,
            triggerType: 'overpayment_credit_created',
            customerId: linkedShipment.customerId,
            title: `Available Account Credit Added (+₦${newCredit.originalCreditNgn.toLocaleString()})`,
            message: `Verified weight for ${linkedShipment.trackingNumber} lowered your final shipping price to ₦${revisedQuote.totalAmount.toLocaleString()}. ₦${newCredit.originalCreditNgn.toLocaleString()} has been recorded as Available Account Credit (${newCredit.creditRef}).`,
            relatedReference: linkedShipment.trackingNumber,
            channel: 'email',
          });
        }
      }

      if (settlement.scenario === 'underpaid' && linkedShipment) {
        emitCustomerNotification({
          eventKey: `payment_required:${maybeAdjustment.adjustmentRef}`,
          triggerType: 'payment_required',
          customerId: linkedShipment.customerId,
          title: `Additional Payment Required: ₦${settlement.remainingAmountNgn.toLocaleString()}`,
          message: `${linkedShipment.trackingNumber} weighed ${chargeableWeight}kg billable. Please approve the revised quotation and pay the remaining ₦${settlement.remainingAmountNgn.toLocaleString()}.`,
          relatedReference: linkedShipment.trackingNumber,
          channel: 'email',
        });
      }

      setStaffNotifications((prev) => [
        {
          id: `snot_${now.getTime()}`,
          targetWorkspace: 'operations_admin' as StaffWorkspace,
          targetRole: 'operations_admin',
          title: `Weight Adjustment Logged (${maybeAdjustment.adjustmentRef})`,
          message: `${linkedShipment?.trackingNumber}: ${
            maybeAdjustment.differenceNgn > 0
              ? `+₦${maybeAdjustment.differenceNgn.toLocaleString()} due (customer approval required before handover)`
              : `₦${Math.abs(maybeAdjustment.differenceNgn).toLocaleString()} recorded as Available Account Credit`
          }.`,
          severity: maybeAdjustment.differenceNgn > 0 ? 'warning' : 'info',
          relatedRef: maybeAdjustment.adjustmentRef,
          isRead: false,
          createdAt: nowIso,
          isDemo: environmentMode === 'demo',
        },
        ...prev,
      ]);
    }

    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === job.shipmentId || job.trackingNumber.includes(s.trackingNumber)) {
          const baseVersions: QuoteVersion[] =
            s.quoteVersions && s.quoteVersions.length > 0
              ? s.quoteVersions
              : [
                  {
                    version: 1,
                    quote: s.quote,
                    measuredWeightKg: s.declaredWeightKg,
                    measuredDimensions: s.declaredDimensions,
                    changedBy: 'Booking Estimate',
                    reason: 'Initial pre-weighing customer estimate',
                    status: s.paymentStatus === 'paid' ? 'paid' : 'active',
                    createdAt: s.createdAt,
                  },
                ];
          const revResult = applyPostApprovalQuoteChange({
            currentVersions: baseVersions,
            newQuote: revisedQuote,
            measuredWeightKg: totalActualWeight,
            measuredDimensions: dimensions,
            changedBy: `${staffName} (Facility Intake)`,
            reason: `Facility scale intake (${measurementSummary.packages.length} box(es), ${totalActualWeight}kg actual / ${chargeableWeight}kg billable via /${measurementSummary.divisorUsed})`,
            now,
          });
          const needsApproval = s.paymentStatus !== 'paid' || settlement.scenario === 'underpaid' || revResult.reapprovalRequired;

          return {
            ...s,
            status:
              s.paymentStatus === 'paid' && settlement.scenario === 'exact'
                ? 'payment_confirmed'
                : 'quote_ready',
            verifiedWeightKg: totalActualWeight,
            verifiedDimensions: dimensions,
            packageMeasurements: measurementSummary.packages,
            appliedDivisor: measurementSummary.divisorUsed,
            originalPaidAmountNgn: verifiedPaidNgn || s.originalPaidAmountNgn,
            adjustmentBalanceDueNgn: settlement.remainingAmountNgn,
            adjustmentRefundNgn: settlement.overpaymentCreditNgn,
            reapprovalRequired: s.paymentStatus === 'paid' && settlement.scenario === 'underpaid' ? true : false,
            availableServiceQuotes: availableOptions,
            quote: revisedQuote,
            quoteVersions: revResult.versions,
            pickupStatusLabel:
              settlement.scenario === 'underpaid'
                ? `Revised Quote Ready (+₦${settlement.remainingAmountNgn.toLocaleString()} Due)`
                : settlement.scenario === 'overpaid'
                ? `Revised Quote Ready (₦${settlement.overpaymentCreditNgn.toLocaleString()} Account Credit)`
                : needsApproval
                ? 'Final Quotation Ready — Awaiting Customer Approval'
                : 'Verified & Fully Settled — Ready for Carrier',
            lastUpdateTimestamp: nowIso,
            trackingEvents: [
              ...(s.trackingEvents || []),
              {
                id: `evt_${Date.now()}`,
                timestamp: nowIso.replace('T', ' ').slice(0, 16),
                stage: 'Facility Scale Intake & Certified Weighing',
                location: job.branchName || 'Swiftvero Hub Facility',
                description: `Measured ${measurementSummary.packages.length} box(es) using ÷${measurementSummary.divisorUsed}. Actual: ${totalActualWeight}kg, Vol: ${volWeight}kg, Billable: ${chargeableWeight}kg. ${
                  maybeAdjustment
                    ? maybeAdjustment.differenceNgn > 0
                      ? `Additional balance +₦${maybeAdjustment.differenceNgn.toLocaleString()} (${maybeAdjustment.adjustmentRef}) awaits customer approval & payment.`
                      : `Overpayment ₦${Math.abs(maybeAdjustment.differenceNgn).toLocaleString()} added to Available Account Credit.`
                    : `Final quotation ₦${revisedQuote.totalAmount.toLocaleString()} ready for customer approval.`
                }`,
              },
            ],
          };
        }
        return s;
      })
    );

    if (linkedShipment) {
      emitCustomerNotification({
        eventKey: `measurement_completed:${linkedShipment.trackingNumber}:${chargeableWeight}`,
        triggerType: 'measurement_completed',
        customerId: linkedShipment.customerId,
        title: `Measurement Completed (${linkedShipment.trackingNumber})`,
        message: `Verified measurements recorded: ${totalActualWeight}kg actual, ${chargeableWeight}kg billable across ${measurementSummary.packages.length} box(es).`,
        relatedReference: linkedShipment.trackingNumber,
        channel: 'in_app',
      });
      emitCustomerNotification({
        eventKey: `revised_quote_ready:${linkedShipment.trackingNumber}:v${(linkedShipment.quoteVersions?.length || 1) + 1}`,
        triggerType: 'revised_quote_ready',
        customerId: linkedShipment.customerId,
        title: `Final Quotation Ready (${linkedShipment.trackingNumber})`,
        message: `Your package has been weighed and measured. Final shipping quote: ₦${revisedQuote.totalAmount.toLocaleString()}.`,
        relatedReference: linkedShipment.trackingNumber,
        channel: 'email',
      });
      if (linkedShipment.paymentStatus !== 'paid' || settlement.scenario === 'underpaid') {
        emitCustomerNotification({
          eventKey: `approval_required:${linkedShipment.trackingNumber}:v${(linkedShipment.quoteVersions?.length || 1) + 1}`,
          triggerType: 'approval_required',
          customerId: linkedShipment.customerId,
          title: `Action Needed: Approve Quotation (${linkedShipment.trackingNumber})`,
          message: `Please review available shipping options and approve your revised quotation for ${linkedShipment.trackingNumber}.`,
          relatedReference: linkedShipment.trackingNumber,
          channel: 'in_app',
        });
      }
    }

    addAuditLog({
      actorName: staffName,
      actorRole: 'front_desk',
      action: 'FACILITY_SCALE_WEIGHING_COMPLETED',
      targetType: 'shipment',
      targetId: job.trackingNumber,
      details: `Facility intake (${destinationCountry}) across ${measurementSummary.packages.length} box(es) with ÷${measurementSummary.divisorUsed}. Actual: ${totalActualWeight}kg, Billable: ${chargeableWeight}kg. Quote: ₦${revisedQuote.totalAmount.toLocaleString()}. Scenario: ${settlement.scenario}.`,
    });

    return {
      success: true,
      message: maybeAdjustment
        ? `Facility measurement complete (${chargeableWeight}kg billable). Adjustment ${maybeAdjustment.adjustmentRef} (${maybeAdjustment.differenceNgn > 0 ? `+₦${maybeAdjustment.differenceNgn.toLocaleString()} due` : `₦${Math.abs(maybeAdjustment.differenceNgn).toLocaleString()} Account Credit`}) logged while keeping ${job.trackingNumber} unchanged.`
        : `Facility measurement complete (${chargeableWeight}kg billable via ÷${measurementSummary.divisorUsed}). Final quotation of ₦${revisedQuote.totalAmount.toLocaleString()} ready for customer approval.`,
      chargeableWeightKg: chargeableWeight,
      newQuote: revisedQuote,
    };
  };

  const reschedulePickup = (jobId: string, newDate: string, newTimeSlot: string, reason: string) => {
    const job = pickupJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, message: 'Pickup job not found.' };
    const nowIso = new Date().toISOString();

    setPickupJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'rescheduled',
              rescheduledFromDate: j.scheduledDate,
              scheduledDate: newDate,
              scheduledSlot: newTimeSlot,
              rescheduledReason: reason,
              rescheduledAt: nowIso,
              notes: `Rescheduled from ${j.scheduledDate} to ${newDate} (${newTimeSlot}). Reason: ${reason}`,
            }
          : j
      )
    );

    const linkedShipment = shipments.find(
      (s) => s.id === job.shipmentId || job.trackingNumber.includes(s.trackingNumber)
    );
    if (linkedShipment) {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === linkedShipment.id
            ? {
                ...s,
                pickupScheduledDate: newDate,
                pickupScheduledSlot: newTimeSlot,
                pickupStatus: 'rescheduled',
                pickupStatusLabel: `Rescheduled to ${newDate} (${newTimeSlot})`,
                lastUpdateTimestamp: nowIso,
              }
            : s
        )
      );
      emitCustomerNotification({
        eventKey: `pickup_rescheduled:${job.id}:${newDate}:${newTimeSlot}`,
        triggerType: 'pickup_rescheduled',
        customerId: linkedShipment.customerId,
        title: `Pickup Rescheduled (${job.pickupReference})`,
        message: `Pickup for ${linkedShipment.trackingNumber} moved to ${newDate} (${newTimeSlot}). Reason: ${reason}`,
        relatedReference: linkedShipment.trackingNumber,
        channel: 'in_app',
      });
    }

    addAuditLog({
      actorName: currentStaffUser?.name || 'Operations Admin',
      actorRole: role,
      action: 'PICKUP_RESCHEDULED',
      targetType: 'pickup',
      targetId: job.pickupReference || job.trackingNumber,
      details: `Pickup rescheduled to ${newDate} (${newTimeSlot}). Reason: ${reason}`,
    });

    return { success: true, message: `Pickup rescheduled to ${newDate}.` };
  };

  const cancelPickup = (jobId: string, reason: string) => {
    const job = pickupJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, message: 'Pickup job not found.' };

    setPickupJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'cancelled',
              notes: `Cancelled by Operations Admin. Reason: ${reason}`,
            }
          : j
      )
    );

    addAuditLog({
      actorName: currentStaffUser?.name || 'Operations Admin',
      actorRole: role,
      action: 'PICKUP_CANCELLED',
      targetType: 'pickup',
      targetId: job.pickupReference || job.trackingNumber,
      details: `Pickup cancelled. Reason: ${reason}`,
    });

    return { success: true, message: 'Pickup booking cancelled.' };
  };

  // --- Booking Groups, Measurement Review Requests, Revised Quote Versions, & Drop-off Intake ---
  const createBookingGroup: DemoContextType['createBookingGroup'] = (params) => {
    // Idempotency check if caller supplies an idempotencyKey
    if (params.idempotencyKey) {
      const existingGroup = bookingGroups.find((g) => g.id === `bg_${params.idempotencyKey}`);
      if (existingGroup) {
        const existingShipments = shipments.filter((s) => existingGroup.shipmentIds.includes(s.id));
        return { group: existingGroup, shipments: existingShipments };
      }
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const existingGroupCodes = new Set(bookingGroups.map((g) => g.groupCode));
    const existingSwvCodes = new Set(shipments.map((s) => s.trackingNumber));
    const existingPkpCodes = new Set(pickupJobs.map((p) => p.pickupReference));

    const groupId = params.idempotencyKey ? `bg_${params.idempotencyKey}` : `bg_${Date.now()}`;
    const groupCode = generateUniqueReference({
      prefix: 'BKG',
      existingCodes: existingGroupCodes,
    });

    const hasSplitAddresses = params.items.some(
      (it) =>
        it.collectionAddressOverride &&
        it.collectionAddressOverride.trim().toLowerCase() !==
          params.sharedCollectionAddress.trim().toLowerCase()
    );
    const branchObj = branches.find((b) => b.id === params.collectionBranchId);
    const isDemoMode = environmentMode === 'demo';

    const createdShipments: ShipmentRecord[] = params.items.map((item, idx) => {
      const trackingNumber = generateUniqueReference({
        prefix: 'SWV',
        existingCodes: existingSwvCodes,
      });
      const shipId = `ship_${Date.now()}_${idx}`;
      const initialVersion: QuoteVersion = {
        version: 1,
        quote: item.quote,
        measuredWeightKg: item.declaredWeightKg,
        measuredDimensions: item.declaredDimensions,
        changedBy: 'Booking Estimate (Customer Declared)',
        reason: `Initial estimate created in ${params.items.length > 1 ? `Booking Group ${groupCode}` : 'booking'}`,
        status: 'active',
        createdAt: nowIso,
      };
      return {
        id: shipId,
        trackingNumber,
        swiftveroCode: trackingNumber,
        bookingGroupId: groupId,
        sourceQuoteRef: params.sourceQuoteRef,
        isFragile: Boolean(item.isFragile),
        fragileHandlingNotes: item.fragileHandlingNotes,
        direction: 'export',
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        customerEmail: currentCustomer.email,
        customerPhone: currentCustomer.phone,
        senderName: params.senderName,
        senderPhone: params.senderPhone,
        senderAddress: item.collectionAddressOverride || params.sharedCollectionAddress,
        originCountry: item.originCountry,
        originCity: item.originCity,
        recipientName: item.recipientName,
        recipientPhone: item.recipientPhone,
        recipientAddress: item.recipientAddress,
        destinationCountry: item.destinationCountry,
        destinationCity: item.destinationCity,
        contentsDescription: item.contentsDescription,
        items: [
          {
            id: `item_${shipId}`,
            description: item.contentsDescription,
            quantity: item.packageCount,
            declaredValue: item.declaredValueNgn,
            isFragile: Boolean(item.isFragile),
            fragileHandlingNotes: item.fragileHandlingNotes,
          },
        ],
        packageCount: item.packageCount,
        declaredWeightKg: item.declaredWeightKg,
        declaredDimensions: item.declaredDimensions,
        declaredValueNgn: item.declaredValueNgn,
        pickupScheduledDate: params.scheduledDate,
        pickupScheduledSlot: params.scheduledSlot,
        pickupAddress: item.collectionAddressOverride || params.sharedCollectionAddress,
        pickupType: params.collectionMethod === 'dropoff' ? 'hub' : 'doorstep',
        collectionMethod: params.collectionMethod,
        priorityCollectionWindow:
          params.collectionMethod === 'priority_pickup'
            ? params.priorityWindow || '1 – 6 hours (subject to location & agent availability)'
            : undefined,
        collectionFeeNgn: idx === 0 ? params.pickupFeeNgn : 0,
        collectionBranchId: params.collectionBranchId,
        branchId: branchObj?.id,
        branchName: branchObj?.name,
        pickupStatus: 'requested',
        pickupStatusLabel:
          params.collectionMethod === 'dropoff'
            ? `Awaiting Drop-off (${branchObj?.name || 'Hub'})`
            : params.collectionMethod === 'priority_pickup'
            ? 'Priority Pickup Requested (1–6h Window)'
            : 'Standard Pickup Requested (Within 24h)',
        status: 'booked',
        quote: item.quote,
        quoteVersions: [initialVersion],
        selectedTier: item.serviceTier,
        estimatedDeliveryDisplay: item.quote.estimatedDeliveryDisplay,
        paymentStatus: 'unpaid',
        trackingEvents: [
          {
            id: `evt_init_${shipId}`,
            timestamp: nowIso.replace('T', ' ').slice(0, 16),
            stage:
              params.collectionMethod === 'dropoff'
                ? 'Booking Confirmed — Hub Drop-off'
                : params.collectionMethod === 'priority_pickup'
                ? 'Booking Confirmed — Priority Pickup Requested'
                : 'Booking Confirmed — Standard Pickup',
            location: branchObj ? branchObj.name : item.originCity,
            description:
              params.collectionMethod === 'dropoff'
                ? `Drop-off registered for ${branchObj?.name}. Present code ${trackingNumber} at counter for digital scale intake.`
                : params.collectionMethod === 'priority_pickup'
                ? `Priority pickup scheduled (${params.priorityWindow || '1 – 6 hours'}). Group ref: ${groupCode}.`
                : `Free doorstep collection requested (24h target window). Final quote confirmed after facility weighing.`,
          },
        ],
        lastUpdateTimestamp: nowIso,
        customerAcknowledgedTerms: true,
        customerAcknowledgedDeclaration: true,
        kycRequiredAtBooking: true,
        cashbackEarned: Math.round(item.quote.freightCharge * 0.03),
        cashbackStatus: 'pending',
        hasReview: false,
        isDemo: isDemoMode,
        createdAt: nowIso,
      };
    });

    const newGroup: BookingGroup = {
      id: groupId,
      groupCode,
      customerId: currentCustomer.id,
      senderName: params.senderName,
      senderPhone: params.senderPhone,
      senderEmail: params.senderEmail || currentCustomer.email,
      sharedCollectionAddress: params.sharedCollectionAddress,
      collectionArrangement: hasSplitAddresses ? 'split' : 'shared',
      collectionMethod: params.collectionMethod,
      collectionBranchId: params.collectionBranchId,
      scheduledDate: params.scheduledDate,
      scheduledSlot: params.scheduledSlot,
      pickupFeeNgn: params.pickupFeeNgn,
      shipmentIds: createdShipments.map((s) => s.id),
      status: 'booked',
      sourceQuoteRef: params.sourceQuoteRef,
      createdAt: nowIso,
      isDemo: isDemoMode,
    };

    // Create 1 shared pickup job if shared address, or separate jobs if split addresses (when pickup — NEVER on drop-off!)
    const createdJobs: PickupJob[] = [];
    if (params.collectionMethod !== 'dropoff') {
      const addressBuckets: Record<string, ShipmentRecord[]> = {};
      createdShipments.forEach((s) => {
        const key = (s.senderAddress || params.sharedCollectionAddress).trim().toLowerCase();
        if (!addressBuckets[key]) addressBuckets[key] = [];
        addressBuckets[key].push(s);
      });

      Object.values(addressBuckets).forEach((bucket, bIdx) => {
        const primary = bucket[0];
        const totalPackages = bucket.reduce((sum, s) => sum + (s.packageCount || 1), 0);
        const totalWeight = bucket.reduce((sum, s) => sum + s.declaredWeightKg, 0);
        const hasFragileInBucket = bucket.some((s) => s.isFragile);
        const fragileNotesCombined = bucket
          .filter((s) => s.isFragile)
          .map((s) => `${s.trackingNumber}: ${s.fragileHandlingNotes || 'Fragile handling requested'}`)
          .join(' | ');
        const pickupReference = generateUniqueReference({
          prefix: 'PKP',
          existingCodes: existingPkpCodes,
        });

        createdJobs.push({
          id: `job_${Date.now()}_${bIdx}`,
          shipmentId: primary.id,
          bookingGroupId: groupId,
          shipmentIds: bucket.map((s) => s.id),
          trackingNumber: bucket.map((s) => s.trackingNumber).join(', '),
          pickupReference,
          senderName: params.senderName,
          senderPhone: params.senderPhone,
          senderEmail: params.senderEmail || currentCustomer.email,
          senderAddress: primary.senderAddress,
          city: primary.originCity,
          state: 'Lagos',
          branchId: 'branch_ikeja',
          branchName: 'Ikeja Cargo Hub (Lagos Mainland)',
          scheduledSlot:
            params.collectionMethod === 'priority_pickup'
              ? 'Priority 1 – 6 hour window'
              : params.scheduledSlot || '10:00 AM - 1:00 PM',
          scheduledDate: params.scheduledDate || nowIso.slice(0, 10),
          bookingConfirmedAt: nowIso,
          collectionDeadline: new Date(
            now.getTime() + (params.collectionMethod === 'priority_pickup' ? 6 : 24) * 3600 * 1000
          ).toISOString(),
          packageCount: totalPackages,
          packageDescription: bucket.map((s) => `${s.destinationCountry}: ${s.contentsDescription}`).join(' | '),
          declaredWeightKg: totalWeight,
          declaredDimensions: primary.declaredDimensions || { length: 30, width: 25, height: 20 },
          pickupType: params.collectionMethod === 'priority_pickup' ? 'priority' : 'standard',
          pickupFeeNgn: bIdx === 0 ? params.pickupFeeNgn : 0,
          estimatedWindow:
            params.collectionMethod === 'priority_pickup'
              ? '1 – 6 hours (subject to location & agent availability)'
              : 'Within 24 hours after confirmation',
          isPriorityFlag: params.collectionMethod === 'priority_pickup',
          isFragile: hasFragileInBucket,
          fragileHandlingNotes: fragileNotesCombined || undefined,
          isDemo: isDemoMode,
          status: 'booking_received',
          notes:
            params.collectionMethod === 'priority_pickup'
              ? `PRIORITY PICKUP (${groupCode}): Target 1–6 hour dispatch.`
              : `Standard free collection (${groupCode}).`,
        });
      });
    }

    setBookingGroups((prev) => [newGroup, ...prev]);
    setShipments((prev) => [...createdShipments, ...prev]);
    if (createdJobs.length > 0) {
      setPickupJobs((prev) => [...createdJobs, ...prev]);
    }

    // If booking converted an existing QTE quote, update the QuoteRecord to converted
    if (params.sourceQuoteRef) {
      setQuotes((prev) =>
        prev.map((q) =>
          q.quoteRef.toUpperCase() === params.sourceQuoteRef?.toUpperCase()
            ? {
                ...q,
                status: 'converted',
                customerId: currentCustomer.id,
                convertedGroupCode: groupCode,
                convertedShipmentCodes: createdShipments.map((s) => s.trackingNumber),
                updatedAt: nowIso,
              }
            : q
        )
      );
    }

    // Emit role-targeted notification to Workspace A (never hardcoded single email)
    setStaffNotifications((prev) => [
      {
        id: `snot_${Date.now()}`,
        targetWorkspace: 'pickup_shipping',
        targetRole: 'pickup_shipping',
        title:
          params.collectionMethod === 'priority_pickup'
            ? `PRIORITY PICKUP BOOKED (${groupCode})`
            : params.collectionMethod === 'dropoff'
            ? `New Drop-off Expectation (${groupCode})`
            : `New Standard Pickup Booking (${groupCode})`,
        message: `${createdShipments.length} shipment(s): ${createdShipments.map((s) => s.trackingNumber).join(', ')} · ${
          params.collectionMethod === 'dropoff'
            ? `Expected at ${branchObj?.name || 'Swiftvero Hub'}`
            : `Collect at ${params.sharedCollectionAddress}`
        }.`,
        severity: params.collectionMethod === 'priority_pickup' ? 'priority' : 'info',
        relatedRef: groupCode,
        isRead: false,
        createdAt: nowIso,
        isDemo: isDemoMode,
      },
      ...prev,
    ]);

    addAuditLog({
      actorName: currentCustomer.name,
      actorRole: 'customer',
      action: 'BOOKING_GROUP_CREATED',
      targetType: 'shipment',
      targetId: groupCode,
      details: `Created booking group ${groupCode} with ${createdShipments.length} shipment(s) (${createdShipments.map((s) => s.trackingNumber).join(', ')}) via ${params.collectionMethod}.`,
    });

    return { group: newGroup, shipments: createdShipments };
  };

  const requestMeasurementReview = (
    shipmentId: string,
    reason: string
  ): { success: boolean; message: string } => {
    const shipment = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!shipment) return { success: false, message: 'Shipment not found.' };
    if (!reason.trim()) return { success: false, message: 'Please provide a reason for the measurement review request.' };

    const newRequest: MeasurementReviewRequest = {
      id: `mrev_${Date.now()}`,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      customerId: shipment.customerId,
      customerName: shipment.customerName,
      reason: reason.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    setMeasurementReviews((prev) => [newRequest, ...prev]);
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipment.id
          ? {
              ...s,
              measurementReviews: [newRequest, ...(s.measurementReviews || [])],
            }
          : s
      )
    );

    addAuditLog({
      actorName: shipment.customerName,
      actorRole: 'customer',
      action: 'MEASUREMENT_REVIEW_REQUESTED',
      targetType: 'shipment',
      targetId: shipment.trackingNumber,
      details: `Customer requested facility scale re-check: ${reason.trim()}`,
    });

    return {
      success: true,
      message: 'Measurement review request logged. Facility operations will inspect and confirm.',
    };
  };

  const issueRevisedQuoteVersion: DemoContextType['issueRevisedQuoteVersion'] = ({
    shipmentId,
    measuredWeightKg,
    measuredDimensions,
    reason,
    changedBy,
    packages,
    divisorRuleId,
    selectedServiceTier,
  }) => {
    const shipment = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!shipment) return { success: false, message: 'Shipment not found.' };

    const actor = changedBy || currentStaffUser?.name || 'Operations Weight Officer';
    const chosenRule =
      carrierDivisorRules.find((r) => r.id === divisorRuleId && r.isActive) ||
      carrierDivisorRules.find((r) => r.serviceTier === (selectedServiceTier || shipment.selectedTier) && r.isActive) ||
      carrierDivisorRules[0];

    const packagesInput: RawPackageInput[] =
      packages && packages.length > 0
        ? packages
        : [
            {
              description: shipment.contentsDescription || 'Verified Parcel',
              actualWeightKg: measuredWeightKg,
              lengthCm: measuredDimensions.length,
              widthCm: measuredDimensions.width,
              heightCm: measuredDimensions.height,
            },
          ];

    const { measurementSummary, revisedQuote, availableOptions } = recalculateVerifiedQuoteFromPackages({
      originalQuote: shipment.quote,
      destinationCountry: shipment.destinationCountry,
      packages: packagesInput,
      divisorRule: chosenRule,
      measuredBy: actor,
      tierOverride: selectedServiceTier,
    });

    const newQuote = revisedQuote;

    const existingVersions: QuoteVersion[] =
      shipment.quoteVersions && shipment.quoteVersions.length > 0
        ? shipment.quoteVersions
        : [
            {
              version: 1,
              quote: shipment.quote,
              measuredWeightKg: shipment.verifiedWeightKg || shipment.declaredWeightKg,
              measuredDimensions: shipment.verifiedDimensions || shipment.declaredDimensions,
              changedBy: 'Previous Intake Record',
              reason: 'Prior quotation baseline',
              status: shipment.paymentStatus === 'paid' ? 'paid' : 'active',
              createdAt: shipment.quote.generatedAt,
            },
          ];

    const nowDate = new Date();
    const nowIso = nowDate.toISOString();
    const revResult = applyPostApprovalQuoteChange({
      currentVersions: existingVersions,
      newQuote,
      measuredWeightKg: measurementSummary.totalActualWeightKg,
      measuredDimensions,
      changedBy: actor,
      reason,
      now: nowDate,
    });

    const updatedVersions = revResult.versions;
    const latestVersion = updatedVersions[updatedVersions.length - 1];

    const existingAdjustmentRefs = new Set(paymentAdjustments.map((a) => a.adjustmentRef));
    const maybeAdjustment =
      shipment.paymentStatus === 'paid'
        ? buildWeightPaymentAdjustment({
            shipment,
            newQuote,
            quoteVersionNumber: latestVersion.version,
            verifiedBillableWeightKg: newQuote.chargeableWeightKg,
            createdByStaffName: actor,
            reason,
            existingAdjustmentRefs,
            isDemo: environmentMode === 'demo',
            now: nowDate,
          })
        : null;

    if (maybeAdjustment) {
      setPaymentAdjustments((prev) => [maybeAdjustment, ...prev]);

      if (maybeAdjustment.differenceNgn < 0) {
        const creditRes = issueShipmentOverpaymentCreditIdempotently({
          existingCredits: shipmentCredits,
          shipment,
          overpaidAmountNgn: Math.abs(maybeAdjustment.differenceNgn),
          adjustmentRef: maybeAdjustment.adjustmentRef,
          isDemo: environmentMode === 'demo',
          now: nowDate,
        });
        if (creditRes.created && creditRes.creditRecord) {
          const newCredit = creditRes.creditRecord;
          setShipmentCredits((prev) => [newCredit, ...prev]);
          const ownerKey =
            Object.keys(customers).find((k) => customers[k].id === shipment.customerId) || activeCustomerKey;
          const owner = customers[ownerKey];
          if (owner) {
            const beforeCred = owner.accountCreditNgn || 0;
            const afterCred = beforeCred + newCredit.originalCreditNgn;
            setCustomers((prev) => ({
              ...prev,
              [ownerKey]: {
                ...prev[ownerKey],
                accountCreditNgn: afterCred,
              },
            }));
            setWalletTransactions((prev) => [
              {
                id: `wtx_ovr_rev_${nowDate.getTime()}`,
                transactionReference: `SWV-TXN-${Math.floor(100000 + Math.random() * 899999)}`,
                walletId: owner.walletId || `WLT-${owner.id}`,
                customerId: owner.id,
                customerName: owner.name,
                type: 'overpayment_credit',
                entryType: 'credit',
                amountNgn: newCredit.originalCreditNgn,
                balanceBeforeNgn: beforeCred,
                balanceAfterNgn: afterCred,
                balanceType: 'account_credit',
                status: 'successful',
                shipmentTrackingNumber: shipment.trackingNumber,
                description: `Overpayment Shipment Credit (${newCredit.creditRef}) from Quote v${latestVersion.version}`,
                createdAt: nowIso,
                isDemo: environmentMode === 'demo',
              },
              ...prev,
            ]);
          }
          emitCustomerNotification({
            eventKey: `overpayment_credit_created:${newCredit.creditRef}`,
            triggerType: 'overpayment_credit_created',
            customerId: shipment.customerId,
            title: `Available Account Credit Added (+₦${newCredit.originalCreditNgn.toLocaleString()})`,
            message: `Revised quote v${latestVersion.version} for ${shipment.trackingNumber} lowered the total to ₦${newQuote.totalAmount.toLocaleString()}. ₦${newCredit.originalCreditNgn.toLocaleString()} is available as Account Credit (${newCredit.creditRef}).`,
            relatedReference: shipment.trackingNumber,
            channel: 'email',
          });
        }
      }

      setStaffNotifications((prev) => [
        {
          id: `snot_rev_${nowDate.getTime()}`,
          targetWorkspace: 'operations_admin',
          targetRole: 'operations_admin',
          title: `Weight Revision Adjustment (${maybeAdjustment.adjustmentRef})`,
          message: `${shipment.trackingNumber} reweighed to ${newQuote.chargeableWeightKg}kg. ${
            maybeAdjustment.differenceNgn > 0
              ? `Difference +₦${maybeAdjustment.differenceNgn.toLocaleString()} requires customer approval & checkout.`
              : `Account Credit ₦${Math.abs(maybeAdjustment.differenceNgn).toLocaleString()} issued.`
          }`,
          severity: maybeAdjustment.differenceNgn > 0 ? 'warning' : 'info',
          relatedRef: maybeAdjustment.adjustmentRef,
          isRead: false,
          createdAt: nowIso,
          isDemo: environmentMode === 'demo',
        },
        ...prev,
      ]);
    }

    setMeasurementReviews((prev) =>
      prev.map((mr) =>
        mr.shipmentId === shipment.id && (mr.status === 'open' || mr.status === 'in_review')
          ? {
              ...mr,
              status: 'adjusted',
              staffResolutionNote: `Revised to ${measurementSummary.totalActualWeightKg}kg (Quote v${latestVersion.version}: ₦${newQuote.totalAmount.toLocaleString()}). ${reason}`,
              reviewedBy: actor,
              resolvedAt: nowIso,
            }
          : mr
      )
    );

    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipment.id
          ? {
              ...s,
              status: s.paymentStatus === 'paid' && !revResult.reapprovalRequired ? s.status : 'quote_ready',
              verifiedWeightKg: measurementSummary.totalActualWeightKg,
              verifiedDimensions: measuredDimensions,
              packageMeasurements: measurementSummary.packages,
              appliedDivisor: measurementSummary.divisorUsed,
              availableServiceQuotes: availableOptions,
              reapprovalRequired: revResult.reapprovalRequired,
              quoteRejectedAt: undefined,
              quoteRejectedReason: undefined,
              adjustmentBalanceDueNgn:
                maybeAdjustment && maybeAdjustment.differenceNgn > 0 ? maybeAdjustment.differenceNgn : 0,
              adjustmentRefundNgn:
                maybeAdjustment && maybeAdjustment.differenceNgn < 0 ? Math.abs(maybeAdjustment.differenceNgn) : 0,
              quote: newQuote,
              quoteVersions: updatedVersions,
              lastUpdateTimestamp: nowIso,
              trackingEvents: [
                ...s.trackingEvents,
                {
                  id: `evt_reweigh_${Date.now()}`,
                  timestamp: nowIso.replace('T', ' ').slice(0, 16),
                  stage: `Revised Quote v${latestVersion.version} Issued`,
                  location: 'Swiftvero Scale Verification Desk',
                  description: `Measured by ${actor} (${measurementSummary.packages.length} box(es), ÷${measurementSummary.divisorUsed}): ${measurementSummary.totalActualWeightKg}kg actual (${newQuote.chargeableWeightKg}kg chargeable). Reason: ${reason}${revResult.reapprovalRequired ? ' · Renewed customer approval required.' : ''}`,
                },
              ],
            }
          : s
      )
    );

    emitCustomerNotification({
      eventKey: `revised_quote_ready:${shipment.trackingNumber}:v${latestVersion.version}`,
      triggerType: 'revised_quote_ready',
      customerId: shipment.customerId,
      title: `Revised Quotation Ready (v${latestVersion.version} · ${shipment.trackingNumber})`,
      message: `${revResult.reapprovalRequired ? 'Your shipment quote changed after approval and requires renewed approval. ' : ''}Final quote: ₦${newQuote.totalAmount.toLocaleString()} (${newQuote.chargeableWeightKg}kg billable).`,
      relatedReference: shipment.trackingNumber,
      channel: 'email',
    });

    addAuditLog({
      actorName: actor,
      actorRole: role,
      action: 'QUOTE_VERSION_REVISED',
      targetType: 'shipment',
      targetId: shipment.trackingNumber,
      details: `Issued quote v${latestVersion.version} (₦${newQuote.totalAmount.toLocaleString()}). Reapproval required: ${revResult.reapprovalRequired}. Reason: ${reason}`,
    });

    return {
      success: true,
      message: maybeAdjustment
        ? `Revised quote v${latestVersion.version} issued. Adjustment ${maybeAdjustment.adjustmentRef} logged; ${shipment.trackingNumber} stays unchanged.`
        : `Revised quote v${latestVersion.version} issued (₦${newQuote.totalAmount.toLocaleString()}).`,
      newVersion: latestVersion,
    };
  };

  const rejectRevisedQuote: DemoContextType['rejectRevisedQuote'] = (shipmentId, reason) => {
    const shipment = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!shipment) return { success: false, message: 'Shipment not found.' };
    if (!reason.trim()) return { success: false, message: 'Please provide a reason or question for Customer Service.' };

    const nowIso = new Date().toISOString();
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipment.id
          ? {
              ...s,
              quoteRejectedAt: nowIso,
              quoteRejectedReason: reason.trim(),
              reapprovalRequired: true,
              pickupStatusLabel: 'Quotation Declined — Operations Reviewing',
              lastUpdateTimestamp: nowIso,
              trackingEvents: [
                ...s.trackingEvents,
                {
                  id: `evt_qrej_${Date.now()}`,
                  timestamp: nowIso.replace('T', ' ').slice(0, 16),
                  stage: 'Customer Declined Revised Quotation',
                  location: 'Customer Portal',
                  description: `Customer rejected quotation and requested clarification: "${reason.trim()}". Carrier booking paused without charging revised amount.`,
                },
              ],
            }
          : s
      )
    );

    setStaffNotifications((prev) => [
      {
        id: `snot_qrej_${Date.now()}`,
        targetWorkspace: 'customer_service',
        targetRole: 'customer_service',
        title: `Revised Quote Declined (${shipment.trackingNumber})`,
        message: `${shipment.customerName} declined revised quotation. Reason: ${reason.trim()}`,
        severity: 'action_required',
        relatedRef: shipment.trackingNumber,
        isRead: false,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      },
      ...prev,
    ]);

    addAuditLog({
      actorName: shipment.customerName,
      actorRole: 'customer',
      action: 'REVISED_QUOTE_REJECTED',
      targetType: 'shipment',
      targetId: shipment.trackingNumber,
      details: `Customer rejected revised quote without booking/charge. Reason: ${reason.trim()}`,
    });

    return {
      success: true,
      message: `Quotation declined for ${shipment.trackingNumber}. No revised charges applied; Operations and Customer Service notified to assist you.`,
    };
  };

  const resolveMeasurementReviewUphold = (
    reviewId: string,
    staffResolutionNote: string
  ): { success: boolean; message: string } => {
    const actor = currentStaffUser?.name || 'Operations Weight Officer';
    setMeasurementReviews((prev) =>
      prev.map((mr) =>
        mr.id === reviewId
          ? {
              ...mr,
              status: 'upheld',
              staffResolutionNote,
              reviewedBy: actor,
              resolvedAt: new Date().toISOString(),
            }
          : mr
      )
    );
    return { success: true, message: 'Original verified measurement upheld with staff audit note.' };
  };

  const approveAndPayShipmentQuote: DemoContextType['approveAndPayShipmentQuote'] = ({
    shipmentId,
    useWalletNgn,
    useCreditsNgn,
    promoCode,
    paymentMethod,
    useAccountCreditNgn = 0,
    useCashbackNgn,
    useBonusNgn = 0,
    selectedServiceTier,
    paystackOutcome = 'success',
  }) => {
    const shipment = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!shipment) return { success: false, message: 'Shipment not found.' };

    const activeVersion: QuoteVersion | undefined =
      shipment.quoteVersions?.find((v) => v.status === 'active') ||
      ({
        version: 1,
        quote: shipment.quote,
        measuredWeightKg: shipment.verifiedWeightKg || shipment.declaredWeightKg,
        changedBy: 'System',
        reason: 'Active quote',
        status: 'active',
        createdAt: shipment.quote.generatedAt,
      } as QuoteVersion);

    const check = canApproveAndPayQuote(activeVersion, shipment.paymentStatus);
    if (!check.allowed) {
      return { success: false, message: check.reason || 'Quotation cannot be paid.' };
    }

    const chosenQuote =
      (selectedServiceTier &&
        shipment.availableServiceQuotes?.find((q) => q.serviceTier === selectedServiceTier)) ||
      shipment.quote;

    let promoDiscount = 0;
    if (promoCode && promoCode.trim()) {
      const promoRes = validatePromoCode(promoCode.trim(), chosenQuote.totalAmount);
      if (promoRes.valid) promoDiscount = promoRes.discountNgn;
    }

    const totalDueAfterPromo = Math.max(0, chosenQuote.totalAmount - promoDiscount);

    const ownerKey =
      Object.keys(customers).find((k) => customers[k].id === shipment.customerId) || activeCustomerKey;
    const ownerProfile = customers[ownerKey] || currentCustomer;
    const balances = getCustomerSeparatedBalances({
      customer: ownerProfile,
      credits: shipmentCredits,
      bonusGrants,
      shipments,
      adjustments: paymentAdjustments,
    });

    const requestedCashback = useCashbackNgn !== undefined ? useCashbackNgn : useCreditsNgn;
    const allocation = allocateCheckoutDeductions({
      payableNgn: totalDueAfterPromo,
      availableAccountCreditNgn: balances.availableAccountCreditNgn,
      cashbackBalanceNgn: balances.cashbackBalanceNgn,
      bonusGrants: balances.activeBonusGrants,
      serviceTier: chosenQuote.serviceTier,
      destinationCountry: shipment.destinationCountry,
      requestedAccountCreditNgn: useAccountCreditNgn,
      requestedCashbackNgn: requestedCashback,
      requestedBonusNgn: useBonusNgn,
    });

    if (!allocation.valid) {
      return { success: false, message: allocation.error || 'Invalid reward/credit allocation.' };
    }

    const walletApplied = Math.min(useWalletNgn || 0, allocation.remainingPaystackNgn);
    if (walletApplied > (ownerProfile?.walletBalance || 0)) {
      return { success: false, message: 'Wallet balance is insufficient for the requested wallet split.' };
    }

    const gatewayPaid = Math.max(0, allocation.remainingPaystackNgn - walletApplied);
    const nowIso = new Date().toISOString();
    const paymentRef = `SWV-PAY-${Math.floor(100000 + Math.random() * 899999)}`;
    const existingReceipts = new Set(paymentReceipts.map((r) => r.receiptNumber));
    const receiptNo = generateUniqueReference({ prefix: 'RCT', existingCodes: existingReceipts });

    // If Paystack external charge is needed and fails or remains pending, rollback 100% of reserved deductions
    if (gatewayPaid > 0 && paystackOutcome !== 'success') {
      resolveCheckoutReservationOutcome({
        outcome: paystackOutcome,
        reservedCreditNgn: allocation.accountCreditAppliedNgn,
        reservedCashbackNgn: allocation.cashbackAppliedNgn,
        reservedBonusNgn: allocation.bonusAppliedNgn,
      });

      setPaymentReceipts((prev) => [
        {
          id: `rct_fail_${Date.now()}`,
          receiptNumber: receiptNo,
          customerId: ownerProfile.id,
          shipmentTrackingNumber: shipment.trackingNumber,
          kind: 'failed_attempt',
          amountNgn: gatewayPaid,
          accountCreditUsedNgn: 0,
          cashbackUsedNgn: 0,
          bonusUsedNgn: 0,
          gatewayAmountChargedNgn: gatewayPaid,
          paymentMethod: `Paystack (${paystackOutcome})`,
          gatewayReference: paymentRef,
          status: paystackOutcome === 'pending' ? 'pending' : 'failed',
          description: `Paystack ${paystackOutcome} on ${shipment.trackingNumber}. All reserved credits/rewards released untouched.`,
          createdAt: nowIso,
          isDemo: environmentMode === 'demo',
        },
        ...prev,
      ]);

      addAuditLog({
        actorName: ownerProfile.name,
        actorRole: 'customer',
        action: `PAYMENT_${paystackOutcome.toUpperCase()}_REWARDS_RESTORED`,
        targetType: 'payment',
        targetId: shipment.trackingNumber,
        details: `Paystack ${paystackOutcome} for ₦${gatewayPaid.toLocaleString()}. Shipment remains unpaid; ₦${allocation.totalDeductionsNgn.toLocaleString()} reserved rewards restored untouched.`,
      });

      return {
        success: false,
        message:
          paystackOutcome === 'pending'
            ? `Payment is still pending confirmation with Paystack (${paymentRef}). Shipment was NOT marked paid and any reserved Account Credit/Cashback/Bonus remains intact.`
            : `Paystack payment failed (${paymentRef}). Shipment remains unpaid and 100% of reserved Account Credit, Cashback, and Bonus balances remain untouched.`,
      };
    }

    // Commit deductions atomically
    let remCreditToConsume = allocation.accountCreditAppliedNgn;
    if (remCreditToConsume > 0) {
      setShipmentCredits((prev) =>
        prev.map((c) => {
          if (
            c.customerId !== ownerProfile.id ||
            remCreditToConsume <= 0 ||
            c.remainingCreditNgn <= 0 ||
            c.status === 'exhausted' ||
            c.status === 'refunded'
          ) {
            return c;
          }
          const take = Math.min(remCreditToConsume, c.remainingCreditNgn);
          remCreditToConsume -= take;
          const left = c.remainingCreditNgn - take;
          return {
            ...c,
            remainingCreditNgn: left,
            status: left === 0 ? 'exhausted' : 'partially_used',
          };
        })
      );
    }

    if (allocation.appliedBonusGrantAllocations.length > 0) {
      const grantMap = new Map(
        allocation.appliedBonusGrantAllocations.map((a) => [a.grantId, a.amountNgn])
      );
      setBonusGrants((prev) =>
        prev.map((g) => {
          const take = grantMap.get(g.id);
          if (!take) return g;
          const left = Math.max(0, g.remainingAmountNgn - take);
          return {
            ...g,
            remainingAmountNgn: left,
            status: left === 0 ? 'exhausted' : 'active',
          };
        })
      );
    }

    setCustomers((prev) => ({
      ...prev,
      [ownerKey]: {
        ...prev[ownerKey],
        walletBalance: Math.max(0, (prev[ownerKey].walletBalance || 0) - walletApplied),
        accountCreditNgn: Math.max(
          0,
          (prev[ownerKey].accountCreditNgn || balances.availableAccountCreditNgn) -
            allocation.accountCreditAppliedNgn
        ),
        cashbackBalance: Math.max(
          0,
          (prev[ownerKey].cashbackBalance || 0) - allocation.cashbackAppliedNgn
        ),
        bonusBalanceNgn: Math.max(
          0,
          (prev[ownerKey].bonusBalanceNgn || balances.activeBonusBalanceNgn) -
            allocation.bonusAppliedNgn
        ),
      },
    }));

    const newLedgerEntries: WalletTransaction[] = [];
    if (walletApplied > 0) {
      newLedgerEntries.push({
        id: `wtx_wal_${Date.now()}`,
        transactionReference: `SWV-TXN-${Math.floor(100000 + Math.random() * 899999)}`,
        walletId: ownerProfile.walletId || `WLT-${ownerProfile.id}`,
        customerId: ownerProfile.id,
        customerName: ownerProfile.name,
        type: 'shipping_payment',
        entryType: 'debit',
        amountNgn: -walletApplied,
        balanceBeforeNgn: ownerProfile.walletBalance || 0,
        balanceAfterNgn: (ownerProfile.walletBalance || 0) - walletApplied,
        balanceType: 'wallet',
        status: 'successful',
        shipmentTrackingNumber: shipment.trackingNumber,
        description: `Wallet balance payment for ${shipment.trackingNumber}`,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      });
    }
    if (allocation.accountCreditAppliedNgn > 0) {
      newLedgerEntries.push({
        id: `wtx_crd_${Date.now() + 1}`,
        transactionReference: `SWV-TXN-${Math.floor(100000 + Math.random() * 899999)}`,
        walletId: ownerProfile.walletId || `WLT-${ownerProfile.id}`,
        customerId: ownerProfile.id,
        customerName: ownerProfile.name,
        type: 'account_credit_redemption',
        entryType: 'debit',
        amountNgn: -allocation.accountCreditAppliedNgn,
        balanceBeforeNgn: balances.availableAccountCreditNgn,
        balanceAfterNgn: balances.availableAccountCreditNgn - allocation.accountCreditAppliedNgn,
        balanceType: 'account_credit',
        status: 'successful',
        shipmentTrackingNumber: shipment.trackingNumber,
        description: `Account Credit redeemed toward ${shipment.trackingNumber}`,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      });
    }
    if (allocation.bonusAppliedNgn > 0) {
      newLedgerEntries.push({
        id: `wtx_bon_${Date.now() + 2}`,
        transactionReference: `SWV-TXN-${Math.floor(100000 + Math.random() * 899999)}`,
        walletId: ownerProfile.walletId || `WLT-${ownerProfile.id}`,
        customerId: ownerProfile.id,
        customerName: ownerProfile.name,
        type: 'bonus_redemption',
        entryType: 'debit',
        amountNgn: -allocation.bonusAppliedNgn,
        balanceBeforeNgn: balances.activeBonusBalanceNgn,
        balanceAfterNgn: balances.activeBonusBalanceNgn - allocation.bonusAppliedNgn,
        balanceType: 'bonus',
        status: 'successful',
        shipmentTrackingNumber: shipment.trackingNumber,
        description: `Promotional Bonus applied at checkout for ${shipment.trackingNumber}`,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      });
    }
    if (newLedgerEntries.length > 0) {
      setWalletTransactions((prev) => [...newLedgerEntries, ...prev]);
    }

    if (allocation.cashbackAppliedNgn > 0) {
      setCashbackLedger((prev) => [
        {
          id: `cb_use_${Date.now()}`,
          customerId: ownerProfile.id,
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          amountNgn: -allocation.cashbackAppliedNgn,
          type: 'credits_redeemed',
          balanceAfterNgn: (ownerProfile.cashbackBalance || 0) - allocation.cashbackAppliedNgn,
          status: 'released',
          description: `Cashback Balance applied to ${shipment.trackingNumber}`,
          createdAt: nowIso,
          releasedAt: nowIso,
          isDemo: environmentMode === 'demo',
        },
        ...prev,
      ]);
    }

    const totalCashAndGatewaySettled = totalDueAfterPromo;
    const methodLabel =
      gatewayPaid > 0
        ? `${paymentMethod}${allocation.totalDeductionsNgn > 0 ? ' + Credits/Rewards' : ''}`
        : 'Account Credit / Cashback / Bonus Settlement';

    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipment.id
          ? {
              ...s,
              paymentStatus: 'paid',
              paymentReference: paymentRef,
              paymentMethod: methodLabel,
              status: 'payment_confirmed',
              selectedTier: chosenQuote.serviceTier,
              quote: chosenQuote,
              reapprovalRequired: false,
              quoteRejectedAt: undefined,
              quoteRejectedReason: undefined,
              discountCode: promoDiscount > 0 ? promoCode?.toUpperCase() : undefined,
              discountAmountNgn: promoDiscount,
              cashbackRedeemedNgn: allocation.cashbackAppliedNgn,
              originalPaidAmountNgn: totalCashAndGatewaySettled,
              finalAmountPaidNgn: totalCashAndGatewaySettled,
              pickupStatusLabel: 'Payment Confirmed — Ready for Carrier Booking',
              quoteVersions: (s.quoteVersions || [activeVersion]).map((qv) =>
                qv.version === activeVersion.version ? { ...qv, quote: chosenQuote, status: 'paid' } : qv
              ),
              trackingEvents: [
                ...s.trackingEvents,
                {
                  id: `evt_paid_${Date.now()}`,
                  timestamp: nowIso.replace('T', ' ').slice(0, 16),
                  stage: 'Quote Approved & Payment Confirmed',
                  location: 'Swiftvero Settlement Gateway',
                  description: `Approved Quote v${activeVersion.version} (₦${chosenQuote.totalAmount.toLocaleString()}). Applied Credit ₦${allocation.accountCreditAppliedNgn.toLocaleString()}, Cashback ₦${allocation.cashbackAppliedNgn.toLocaleString()}, Bonus ₦${allocation.bonusAppliedNgn.toLocaleString()}, Gateway ₦${gatewayPaid.toLocaleString()}. Ready for DHL booking.`,
                },
              ],
            }
          : s
      )
    );

    if (shipment.bookingGroupId) {
      setBookingGroups((prev) =>
        prev.map((bg) => {
          if (bg.id !== shipment.bookingGroupId) return bg;
          const siblings = shipments.filter((s) => s.bookingGroupId === bg.id);
          const allPaid = siblings.every((s) => s.id === shipment.id || s.paymentStatus === 'paid');
          return { ...bg, status: allPaid ? 'paid' : 'partially_paid' };
        })
      );
    }

    setPaymentReceipts((prev) => [
      {
        id: `rct_${Date.now()}`,
        receiptNumber: receiptNo,
        customerId: ownerProfile.id,
        shipmentTrackingNumber: shipment.trackingNumber,
        kind: 'initial_payment',
        amountNgn: totalCashAndGatewaySettled,
        accountCreditUsedNgn: allocation.accountCreditAppliedNgn,
        cashbackUsedNgn: allocation.cashbackAppliedNgn,
        bonusUsedNgn: allocation.bonusAppliedNgn,
        gatewayAmountChargedNgn: gatewayPaid,
        paymentMethod: methodLabel,
        gatewayReference: paymentRef,
        status: 'successful',
        description: `Approved quote v${activeVersion.version} settlement for ${shipment.trackingNumber} (${shipment.destinationCountry})`,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      },
      ...prev,
    ]);

    emitCustomerNotification({
      eventKey: `additional_payment_confirmed:${receiptNo}`,
      triggerType: 'additional_payment_confirmed',
      customerId: shipment.customerId,
      title: `Payment Confirmed (${shipment.trackingNumber})`,
      message: `Quotation approved and payment settled (${receiptNo}). Your shipment is ready for carrier booking.`,
      relatedReference: shipment.trackingNumber,
      channel: 'email',
    });

    addAuditLog({
      actorName: ownerProfile.name || shipment.customerName,
      actorRole: 'customer',
      action: 'QUOTE_APPROVED_AND_PAID',
      targetType: 'payment',
      targetId: shipment.trackingNumber,
      details: `Approved quote ${chosenQuote.id} (Receipt: ${receiptNo}). Account Credit: ₦${allocation.accountCreditAppliedNgn.toLocaleString()}, Cashback: ₦${allocation.cashbackAppliedNgn.toLocaleString()}, Bonus: ₦${allocation.bonusAppliedNgn.toLocaleString()}, Wallet: ₦${walletApplied.toLocaleString()}, Paystack: ₦${gatewayPaid.toLocaleString()}.`,
    });

    return {
      success: true,
      message: `Quote approved and settled for ${shipment.trackingNumber} (Receipt: ${receiptNo}).`,
    };
  };

  const approveAndPayGroupQuote: DemoContextType['approveAndPayGroupQuote'] = ({
    bookingGroupId,
    selectedShipmentIds,
    useWalletNgn,
    useCreditsNgn,
    paymentMethod,
  }) => {
    const groupShipments = shipments.filter((s) => s.bookingGroupId === bookingGroupId);
    const totalTarget = groupShipments
      .filter((s) => selectedShipmentIds.includes(s.id) && s.paymentStatus !== 'paid')
      .reduce((sum, s) => sum + s.quote.totalAmount, 0);

    const allocation = allocateGroupPayment({
      shipments: groupShipments,
      selectedShipmentIds,
      availableSettlementNgn: totalTarget,
    });

    if (!allocation.success) {
      return { success: false, message: allocation.reason || 'Group payment allocation failed.' };
    }

    let remainingWallet = useWalletNgn;
    let remainingCredits = useCreditsNgn;

    for (const sId of allocation.paidShipmentIds) {
      const target = groupShipments.find((s) => s.id === sId)!;
      const creditSlice = Math.min(remainingCredits, target.quote.totalAmount);
      remainingCredits -= creditSlice;
      const walletSlice = Math.min(remainingWallet, Math.max(0, target.quote.totalAmount - creditSlice));
      remainingWallet -= walletSlice;

      const res = approveAndPayShipmentQuote({
        shipmentId: sId,
        useWalletNgn: walletSlice,
        useCreditsNgn: creditSlice,
        paymentMethod,
      });
      if (!res.success) return res;
    }

    return {
      success: true,
      message: `Completed payment for ${allocation.paidShipmentIds.length} shipment(s). ${
        allocation.unpaidShipmentIds.length > 0
          ? `${allocation.unpaidShipmentIds.length} sibling shipment(s) remain unpaid.`
          : 'All shipments in group are paid.'
      }`,
    };
  };

  const markDropoffReceivedAtBranch = (
    shipmentId: string,
    branchId: string,
    notes?: string
  ): { success: boolean; message: string } => {
    const branch = branches.find((b) => b.id === branchId);
    const target = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!target || !branch) {
      return { success: false, message: 'Shipment or active drop-off hub not found.' };
    }

    const nowIso = new Date().toISOString();
    const staffName = currentStaffUser?.name || 'Branch Counter Intake Officer';

    setShipments((prev) =>
      prev.map((s) =>
        s.id === target.id
          ? {
              ...s,
              pickupStatus: 'picked_up',
              pickupStatusLabel: `Dropped Off at ${branch.name}`,
              branchId: branch.id,
              branchName: branch.name,
              intakeStaffName: staffName,
              lastUpdateTimestamp: nowIso,
              trackingEvents: [
                ...s.trackingEvents,
                {
                  id: `evt_drop_${Date.now()}`,
                  timestamp: nowIso.replace('T', ' ').slice(0, 16),
                  stage: `Drop-off Received at ${branch.code}`,
                  location: branch.name,
                  description: `Consignor handed over parcel at ${branch.name}. Checked in by ${staffName}. ${notes || ''}`.trim(),
                },
              ],
            }
          : s
      )
    );

    addAuditLog({
      actorName: staffName,
      actorRole: role,
      branchId: branch.id,
      branchName: branch.name,
      action: 'DROPOFF_INTAKE_CONFIRMED',
      targetType: 'shipment',
      targetId: target.trackingNumber,
      details: `Confirmed customer drop-off at ${branch.name}. ${notes || ''}`,
    });

    return { success: true, message: `Drop-off intake logged at ${branch.name}.` };
  };

  // --- Phase 1-4: Separated Guest Quotes (QTE), OTP Verification & Recovery, Payment Adjustments, Feature Flags & Archive ---
  const saveGuestQuote: DemoContextType['saveGuestQuote'] = (params) => {
    if (params.idempotencyKey) {
      const existing = quotes.find((q) => q.id === `qte_${params.idempotencyKey}`);
      if (existing) return existing;
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const existingRefs = new Set(quotes.map((q) => q.quoteRef));
    const quoteRef = generateUniqueReference({
      prefix: 'QTE',
      existingCodes: existingRefs,
    });
    const firstItem = params.items[0];
    const isManual = params.type === 'manual_enquiry';
    const isDemoMode = environmentMode === 'demo';

    const newQuote: QuoteRecord = {
      id: params.idempotencyKey ? `qte_${params.idempotencyKey}` : `qte_${now.getTime()}`,
      quoteRef,
      type: params.type,
      status: isManual ? 'manual_enquiry' : 'estimate',
      customerId: role === 'customer' || role === 'business' ? currentCustomer.id : undefined,
      contactName: params.contactName.trim() || 'Guest Consignor',
      contactEmail: params.contactEmail?.trim() || undefined,
      contactPhone: params.contactPhone?.trim() || undefined,
      senderState: params.senderState,
      senderCity: params.senderCity,
      sharedCollectionAddress: params.sharedCollectionAddress,
      collectionMethod: params.collectionMethod,
      originCountry: firstItem?.originCountry || 'Nigeria',
      originCity: firstItem?.originCity || 'Lagos',
      destinationCountry: firstItem?.destinationCountry || 'United Kingdom',
      destinationCity: firstItem?.destinationCity || 'London',
      serviceTier: firstItem?.serviceTier || 'standard',
      items: params.items,
      quoteBreakdown: params.quoteBreakdown,
      totalEstimatedNgn: params.totalEstimatedNgn,
      enquiryNotes: params.enquiryNotes,
      expiresAt: new Date(now.getTime() + 7 * 86400 * 1000).toISOString(),
      isDemo: isDemoMode,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setQuotes((prev) => [newQuote, ...prev]);

    if (isManual) {
      setStaffNotifications((prev) => [
        {
          id: `snot_qte_${now.getTime()}`,
          targetWorkspace: 'customer_service',
          targetRole: 'customer_service',
          title: `Manual Quote Enquiry (${quoteRef})`,
          message: `${newQuote.contactName} requested manual pricing for ${newQuote.originCountry} → ${newQuote.destinationCountry}.`,
          severity: 'action_required',
          relatedRef: quoteRef,
          isRead: false,
          createdAt: nowIso,
          isDemo: isDemoMode,
        },
        ...prev,
      ]);
    }

    addAuditLog({
      actorName: newQuote.contactName,
      actorRole: role,
      action: isManual ? 'MANUAL_QUOTE_ENQUIRY_SUBMITTED' : 'GUEST_QUOTE_SAVED',
      targetType: 'shipment',
      targetId: quoteRef,
      details: `${isManual ? 'Manual quote enquiry' : 'Saved estimate'} ${quoteRef} (${newQuote.originCountry} → ${newQuote.destinationCountry}, Est: ₦${newQuote.totalEstimatedNgn.toLocaleString()}). No shipment or pickup created yet.`,
    });

    return newQuote;
  };

  const respondToManualQuoteEnquiry: DemoContextType['respondToManualQuoteEnquiry'] = ({
    quoteId,
    quotedTotalNgn,
    staffQuoteNotes,
  }) => {
    const target = quotes.find((q) => q.id === quoteId || q.quoteRef === quoteId);
    if (!target) return { success: false, message: 'Quote enquiry not found.' };
    if (quotedTotalNgn <= 0) return { success: false, message: 'Quoted amount must be greater than ₦0.' };

    const nowIso = new Date().toISOString();
    const staffActor = currentStaffUser?.name || 'Customer Service Quote Desk';

    setQuotes((prev) =>
      prev.map((q) =>
        q.id === target.id
          ? {
              ...q,
              status: 'quoted',
              totalEstimatedNgn: quotedTotalNgn,
              staffQuoteNotes: staffQuoteNotes.trim(),
              quotedBy: staffActor,
              quotedAt: nowIso,
              updatedAt: nowIso,
            }
          : q
      )
    );

    const canSendEmail = environmentMode === 'demo' || adminFeatureFlags.emailProviderConfigured;
    const deliveryStatus: OtpDeliveryLog['status'] = canSendEmail ? 'sent' : 'provider_unconfigured';

    setOtpDeliveryLogs((prev) => [
      {
        id: `otplog_q_${Date.now()}`,
        channel: 'email',
        recipientMasked: target.contactEmail || target.contactPhone || target.contactName,
        purpose: 'manual_quote_reply',
        status: deliveryStatus,
        providerName: environmentMode === 'demo' ? 'Swiftvero Demo Email Simulator' : 'External Email Gateway',
        errorDetail: canSendEmail ? undefined : 'Email provider not configured in Admin settings.',
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      },
      ...prev,
    ]);

    addAuditLog({
      actorName: staffActor,
      actorRole: 'customer_service',
      action: 'MANUAL_QUOTE_RESPONDED',
      targetType: 'shipment',
      targetId: target.quoteRef,
      details: `Issued formal quote ₦${quotedTotalNgn.toLocaleString()} for ${target.quoteRef}. Delivery status: ${deliveryStatus}.`,
    });

    return {
      success: true,
      message: `Formal quote ₦${quotedTotalNgn.toLocaleString()} issued for ${target.quoteRef} (Delivery log: ${deliveryStatus}).`,
    };
  };

  const requestOtpForContact: DemoContextType['requestOtpForContact'] = ({
    contactValue,
    channel,
    targetRef,
    purpose,
  }) => {
    const isDemoMode = environmentMode === 'demo';
    const isProviderConfigured =
      channel === 'email'
        ? adminFeatureFlags.emailProviderConfigured
        : channel === 'sms'
        ? adminFeatureFlags.smsProviderConfigured
        : adminFeatureFlags.whatsappProviderConfigured;

    const res = createOtpChallenge({
      contactValue,
      channel,
      targetRef,
      purpose,
      existingChallenges: otpChallenges,
      isProviderConfigured,
      isDemo: isDemoMode,
    });

    setOtpDeliveryLogs((prev) => [res.deliveryLog, ...prev]);
    if (res.challenge) {
      setOtpChallenges((prev) => [res.challenge!, ...prev]);
    }

    return {
      allowed: res.allowed,
      cooldownRemainingSeconds: res.cooldownRemainingSeconds,
      challengeId: res.challenge?.id,
      simulatedOtp: isDemoMode ? res.challenge?.code : undefined,
      userMessage: res.userMessage,
      deliveryStatus: res.deliveryLog.status,
    };
  };

  const verifyOtpForChallenge: DemoContextType['verifyOtpForChallenge'] = ({ challengeId, code }) => {
    const target = otpChallenges.find((c) => c.id === challengeId);
    if (!target) {
      return {
        verified: false,
        locked: false,
        expired: false,
        remainingAttempts: 0,
        message: 'Verification session not found. Please request a new code.',
      };
    }

    const res = verifyOtpChallenge({ challenge: target, inputCode: code });
    setOtpChallenges((prev) => prev.map((c) => (c.id === challengeId ? res.updatedChallenge : c)));

    return {
      verified: res.verified,
      locked: res.locked,
      expired: res.expired,
      remainingAttempts: res.remainingAttempts,
      message: res.message,
    };
  };

  const recoverQuotesWithContact: DemoContextType['recoverQuotesWithContact'] = (contactValue) => {
    const channel: 'email' | 'sms' = contactValue.includes('@') ? 'email' : 'sms';
    const otpRes = requestOtpForContact({
      contactValue,
      channel,
      purpose: 'quote_recovery',
    });

    return {
      genericNotice: buildGenericRecoveryNotice(contactValue),
      challengeId: otpRes.challengeId,
      simulatedOtp: otpRes.simulatedOtp,
      allowed: otpRes.allowed,
      cooldownRemainingSeconds: otpRes.cooldownRemainingSeconds,
    };
  };

  const getRecoveredItemsAfterOtp: DemoContextType['getRecoveredItemsAfterOtp'] = (contactValue) => {
    return findQuotesAndUnpaidShipmentsByContact({
      contactValue,
      quotes,
      shipments,
    });
  };

  const settlePaymentAdjustment: DemoContextType['settlePaymentAdjustment'] = ({
    adjustmentId,
    paymentMethod,
    useWalletNgn = 0,
    useCreditsNgn = 0,
    useAccountCreditNgn = 0,
    useCashbackNgn,
    useBonusNgn = 0,
    paystackOutcome = 'success',
  }) => {
    const adj = paymentAdjustments.find((a) => a.id === adjustmentId || a.adjustmentRef === adjustmentId);
    if (!adj) return { success: false, message: 'Payment adjustment record not found.' };
    if (adj.status === 'approved_and_paid' || adj.status === 'paid' || adj.status === 'settled') {
      return { success: false, message: 'This weight adjustment balance has already been paid.' };
    }
    if (adj.differenceNgn <= 0) {
      return { success: false, message: 'No additional payment is required for this adjustment.' };
    }

    const shipment = shipments.find((s) => s.id === adj.shipmentId || s.trackingNumber === adj.trackingNumber);
    const ownerKey =
      Object.keys(customers).find((k) => customers[k].id === adj.customerId) || activeCustomerKey;
    const ownerProfile = customers[ownerKey] || currentCustomer;
    const balances = getCustomerSeparatedBalances({
      customer: ownerProfile,
      credits: shipmentCredits,
      bonusGrants,
      shipments,
      adjustments: paymentAdjustments,
    });

    const requestedCashback = useCashbackNgn !== undefined ? useCashbackNgn : useCreditsNgn;
    const allocation = allocateCheckoutDeductions({
      payableNgn: adj.differenceNgn,
      availableAccountCreditNgn: balances.availableAccountCreditNgn,
      cashbackBalanceNgn: balances.cashbackBalanceNgn,
      bonusGrants: balances.activeBonusGrants,
      serviceTier: shipment?.selectedTier || 'standard',
      destinationCountry: shipment?.destinationCountry || 'United Kingdom',
      requestedAccountCreditNgn: useAccountCreditNgn,
      requestedCashbackNgn: requestedCashback,
      requestedBonusNgn: useBonusNgn,
    });

    if (!allocation.valid) {
      return { success: false, message: allocation.error || 'Invalid reward/credit allocation.' };
    }

    const walletApplied = Math.min(useWalletNgn, allocation.remainingPaystackNgn);
    if (walletApplied > (ownerProfile?.walletBalance || 0)) {
      return { success: false, message: 'Insufficient wallet balance for adjustment split.' };
    }

    const gatewayPaid = Math.max(0, allocation.remainingPaystackNgn - walletApplied);
    const nowIso = new Date().toISOString();
    const payRef = `SWV-ADJ-${Math.floor(100000 + Math.random() * 899999)}`;
    const existingReceipts = new Set(paymentReceipts.map((r) => r.receiptNumber));
    const receiptNo = generateUniqueReference({ prefix: 'RCT', existingCodes: existingReceipts });

    if (gatewayPaid > 0 && paystackOutcome !== 'success') {
      resolveCheckoutReservationOutcome({
        outcome: paystackOutcome,
        reservedCreditNgn: allocation.accountCreditAppliedNgn,
        reservedCashbackNgn: allocation.cashbackAppliedNgn,
        reservedBonusNgn: allocation.bonusAppliedNgn,
      });

      const failReceipt: PaymentReceiptRecord = {
        id: `rct_adjfail_${Date.now()}`,
        receiptNumber: receiptNo,
        customerId: adj.customerId,
        shipmentTrackingNumber: adj.trackingNumber,
        adjustmentRef: adj.adjustmentRef,
        kind: 'failed_attempt',
        amountNgn: gatewayPaid,
        accountCreditUsedNgn: 0,
        cashbackUsedNgn: 0,
        bonusUsedNgn: 0,
        gatewayAmountChargedNgn: gatewayPaid,
        paymentMethod: `Paystack (${paystackOutcome})`,
        gatewayReference: payRef,
        status: paystackOutcome === 'pending' ? 'pending' : 'failed',
        description: `Paystack ${paystackOutcome} on ${adj.adjustmentRef}. Reserved balances restored.`,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      };
      setPaymentReceipts((prev) => [failReceipt, ...prev]);
      return {
        success: false,
        message:
          paystackOutcome === 'pending'
            ? `Paystack payment is pending confirmation (${payRef}). Outstanding balance NOT marked paid; reserved credits/rewards remain intact.`
            : `Paystack payment failed (${payRef}). Outstanding balance remains unpaid and reserved Account Credit, Cashback, and Bonus balances remain untouched.`,
        receipt: failReceipt,
      };
    }

    let remCreditToConsume = allocation.accountCreditAppliedNgn;
    if (remCreditToConsume > 0) {
      setShipmentCredits((prev) =>
        prev.map((c) => {
          if (
            c.customerId !== ownerProfile.id ||
            remCreditToConsume <= 0 ||
            c.remainingCreditNgn <= 0 ||
            c.status === 'exhausted' ||
            c.status === 'refunded'
          ) {
            return c;
          }
          const take = Math.min(remCreditToConsume, c.remainingCreditNgn);
          remCreditToConsume -= take;
          const left = c.remainingCreditNgn - take;
          return {
            ...c,
            remainingCreditNgn: left,
            status: left === 0 ? 'exhausted' : 'partially_used',
          };
        })
      );
    }

    if (allocation.appliedBonusGrantAllocations.length > 0) {
      const grantMap = new Map(
        allocation.appliedBonusGrantAllocations.map((a) => [a.grantId, a.amountNgn])
      );
      setBonusGrants((prev) =>
        prev.map((g) => {
          const take = grantMap.get(g.id);
          if (!take) return g;
          const left = Math.max(0, g.remainingAmountNgn - take);
          return {
            ...g,
            remainingAmountNgn: left,
            status: left === 0 ? 'exhausted' : 'active',
          };
        })
      );
    }

    setCustomers((prev) => ({
      ...prev,
      [ownerKey]: {
        ...prev[ownerKey],
        walletBalance: Math.max(0, (prev[ownerKey].walletBalance || 0) - walletApplied),
        accountCreditNgn: Math.max(
          0,
          (prev[ownerKey].accountCreditNgn || balances.availableAccountCreditNgn) -
            allocation.accountCreditAppliedNgn
        ),
        cashbackBalance: Math.max(
          0,
          (prev[ownerKey].cashbackBalance || 0) - allocation.cashbackAppliedNgn
        ),
        bonusBalanceNgn: Math.max(
          0,
          (prev[ownerKey].bonusBalanceNgn || balances.activeBonusBalanceNgn) -
            allocation.bonusAppliedNgn
        ),
      },
    }));

    const ledgerBatch: WalletTransaction[] = [];
    if (walletApplied > 0) {
      ledgerBatch.push({
        id: `wtx_adj_${Date.now()}`,
        transactionReference: `SWV-TXN-${Math.floor(100000 + Math.random() * 899999)}`,
        walletId: ownerProfile.walletId || `WLT-${ownerProfile.id}`,
        customerId: ownerProfile.id,
        customerName: ownerProfile.name,
        type: 'shipping_payment',
        entryType: 'debit',
        amountNgn: -walletApplied,
        balanceBeforeNgn: ownerProfile.walletBalance || 0,
        balanceAfterNgn: (ownerProfile.walletBalance || 0) - walletApplied,
        balanceType: 'wallet',
        status: 'successful',
        shipmentTrackingNumber: adj.trackingNumber,
        description: `Weight adjustment ${adj.adjustmentRef} wallet payment`,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      });
    }
    if (allocation.accountCreditAppliedNgn > 0) {
      ledgerBatch.push({
        id: `wtx_adj_crd_${Date.now() + 1}`,
        transactionReference: `SWV-TXN-${Math.floor(100000 + Math.random() * 899999)}`,
        walletId: ownerProfile.walletId || `WLT-${ownerProfile.id}`,
        customerId: ownerProfile.id,
        customerName: ownerProfile.name,
        type: 'account_credit_redemption',
        entryType: 'debit',
        amountNgn: -allocation.accountCreditAppliedNgn,
        balanceBeforeNgn: balances.availableAccountCreditNgn,
        balanceAfterNgn: balances.availableAccountCreditNgn - allocation.accountCreditAppliedNgn,
        balanceType: 'account_credit',
        status: 'successful',
        shipmentTrackingNumber: adj.trackingNumber,
        description: `Account Credit applied to adjustment ${adj.adjustmentRef}`,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      });
    }
    if (allocation.bonusAppliedNgn > 0) {
      ledgerBatch.push({
        id: `wtx_adj_bon_${Date.now() + 2}`,
        transactionReference: `SWV-TXN-${Math.floor(100000 + Math.random() * 899999)}`,
        walletId: ownerProfile.walletId || `WLT-${ownerProfile.id}`,
        customerId: ownerProfile.id,
        customerName: ownerProfile.name,
        type: 'bonus_redemption',
        entryType: 'debit',
        amountNgn: -allocation.bonusAppliedNgn,
        balanceBeforeNgn: balances.activeBonusBalanceNgn,
        balanceAfterNgn: balances.activeBonusBalanceNgn - allocation.bonusAppliedNgn,
        balanceType: 'bonus',
        status: 'successful',
        shipmentTrackingNumber: adj.trackingNumber,
        description: `Promotional Bonus applied to adjustment ${adj.adjustmentRef}`,
        createdAt: nowIso,
        isDemo: environmentMode === 'demo',
      });
    }
    if (ledgerBatch.length > 0) {
      setWalletTransactions((prev) => [...ledgerBatch, ...prev]);
    }
    if (allocation.cashbackAppliedNgn > 0) {
      setCashbackLedger((prev) => [
        {
          id: `cb_adj_${Date.now()}`,
          customerId: ownerProfile.id,
          shipmentId: adj.shipmentId,
          trackingNumber: adj.trackingNumber,
          amountNgn: -allocation.cashbackAppliedNgn,
          type: 'credits_redeemed',
          balanceAfterNgn: (ownerProfile.cashbackBalance || 0) - allocation.cashbackAppliedNgn,
          status: 'released',
          description: `Cashback Balance applied to adjustment ${adj.adjustmentRef}`,
          createdAt: nowIso,
          releasedAt: nowIso,
          isDemo: environmentMode === 'demo',
        },
        ...prev,
      ]);
    }

    const receiptMethodLabel =
      gatewayPaid > 0
        ? `${paymentMethod}${allocation.totalDeductionsNgn > 0 ? ' + Credits/Rewards' : ''}`
        : 'Account Credit / Cashback / Bonus Settlement';

    const receipt: PaymentReceiptRecord = {
      id: `rct_adj_${Date.now()}`,
      receiptNumber: receiptNo,
      customerId: adj.customerId,
      shipmentTrackingNumber: adj.trackingNumber,
      adjustmentRef: adj.adjustmentRef,
      kind: 'weight_adjustment',
      amountNgn: adj.differenceNgn,
      accountCreditUsedNgn: allocation.accountCreditAppliedNgn,
      cashbackUsedNgn: allocation.cashbackAppliedNgn,
      bonusUsedNgn: allocation.bonusAppliedNgn,
      gatewayAmountChargedNgn: gatewayPaid,
      paymentMethod: receiptMethodLabel,
      gatewayReference: payRef,
      status: 'successful',
      description: `Weight verification balance settlement (${adj.adjustmentRef}) for ${adj.trackingNumber}`,
      createdAt: nowIso,
      isDemo: environmentMode === 'demo',
    };

    setPaymentReceipts((prev) => [receipt, ...prev]);

    setPaymentAdjustments((prev) =>
      prev.map((a) =>
        a.id === adj.id
          ? {
              ...a,
              status: 'approved_and_paid',
              approvedAt: nowIso,
              paidAt: nowIso,
              resolvedAt: nowIso,
              paymentReference: payRef,
              paymentMethod: receiptMethodLabel,
            }
          : a
      )
    );

    setShipments((prev) =>
      prev.map((s) =>
        s.id === adj.shipmentId || s.trackingNumber === adj.trackingNumber
          ? {
              ...s,
              status: 'ready_for_carrier_booking',
              reapprovalRequired: false,
              adjustmentBalanceDueNgn: 0,
              finalAmountPaidNgn: adj.revisedAmountNgn,
              pickupStatusLabel: 'Additional Payment Confirmed — Ready for Carrier Booking',
              quoteVersions: (s.quoteVersions || []).map((qv) =>
                qv.version === adj.quoteVersionNumber ? { ...qv, status: 'paid' } : qv
              ),
              trackingEvents: [
                ...s.trackingEvents,
                {
                  id: `evt_adjpaid_${Date.now()}`,
                  timestamp: nowIso.replace('T', ' ').slice(0, 16),
                  stage: `Weight Adjustment Settled (${adj.adjustmentRef})`,
                  location: 'Swiftvero Settlement Gateway',
                  description: `Customer approved & paid remaining ₦${adj.differenceNgn.toLocaleString()} (Credit: ₦${allocation.accountCreditAppliedNgn.toLocaleString()}, Cashback: ₦${allocation.cashbackAppliedNgn.toLocaleString()}, Bonus: ₦${allocation.bonusAppliedNgn.toLocaleString()}, Gateway: ₦${gatewayPaid.toLocaleString()}). Carrier dispatch unlocked.`,
                },
              ],
            }
          : s
      )
    );

    emitCustomerNotification({
      eventKey: `additional_payment_confirmed:${adj.adjustmentRef}`,
      triggerType: 'additional_payment_confirmed',
      customerId: adj.customerId,
      title: `Additional Payment Confirmed (${adj.trackingNumber})`,
      message: `Weight adjustment ${adj.adjustmentRef} settled (Receipt ${receiptNo}). ${adj.trackingNumber} is cleared for DHL Express dispatch.`,
      relatedReference: adj.trackingNumber,
      channel: 'email',
    });

    addAuditLog({
      actorName: ownerProfile?.name || 'Customer',
      actorRole: 'customer',
      action: 'PAYMENT_ADJUSTMENT_SETTLED',
      targetType: 'payment',
      targetId: adj.adjustmentRef,
      details: `Approved and settled weight adjustment ${adj.adjustmentRef} (+₦${adj.differenceNgn.toLocaleString()}) for ${adj.trackingNumber}. Receipt: ${receiptNo}.`,
    });

    return {
      success: true,
      message: `Weight adjustment ${adj.adjustmentRef} paid (Receipt: ${receiptNo}). ${adj.trackingNumber} is cleared for carrier dispatch.`,
      receipt,
    };
  };

  const markStaffNotificationRead = (id: string) => {
    setStaffNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const updateAdminFeatureFlags: DemoContextType['updateAdminFeatureFlags'] = (updates, reason) => {
    const actor = currentStaffUser?.name || 'Operations Admin';
    const nowIso = new Date().toISOString();
    setAdminFeatureFlags((prev) => ({
      ...prev,
      ...updates,
      updatedBy: actor,
      updatedAt: nowIso,
    }));
    addAuditLog({
      actorName: actor,
      actorRole: role,
      action: 'ADMIN_FEATURE_FLAGS_UPDATED',
      targetType: 'config',
      targetId: 'admin_feature_flags',
      details: `Feature flags updated (${reason}). Insurance enabled: ${updates.insuranceEnabled ?? adminFeatureFlags.insuranceEnabled}, Insurer configured: ${updates.insurerConfigured ?? adminFeatureFlags.insurerConfigured}.`,
    });
  };

  const archiveShipment = (shipmentId: string): { success: boolean; message: string } => {
    const target = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!target) return { success: false, message: 'Shipment not found.' };
    if (target.status !== 'delivered' && target.status !== 'cancelled') {
      return {
        success: false,
        message: 'Only delivered or cancelled shipments can be archived.',
      };
    }

    const nowIso = new Date().toISOString();
    setShipments((prev) =>
      prev.map((s) =>
        s.id === target.id ? { ...s, isArchived: true, archivedAt: nowIso } : s
      )
    );

    return {
      success: true,
      message: `${target.trackingNumber} moved to Archived Shipments.`,
    };
  };

  return (
    <DemoContext.Provider
      value={{
        environmentMode,
        setEnvironmentMode,
        role,
        setRole,
        activeCustomerKey,
        setActiveCustomerKey,
        currentCustomer,
        updateCurrentCustomer,
        customers,
        shipments,
        reviews,
        tickets,
        cashbackLedger,
        referrals,
        pickupJobs,
        updatePickupJob,
        staffMembers,
        currentStaffUser,
        setCurrentStaffUser,
        auditLogs,
        addAuditLog,
        createStaffAccount,
        updateStaffStatus,
        resetStaffPassword,
        hasPermission,
        activeAdminTab,
        setActiveAdminTab,
        branches,
        activeBranchFilter,
        setActiveBranchFilter,
        switchDemoStaff,
        reassignStaffBranch,
        reassignPickupJob,
        reassignShipmentBranch,
        updatePickupJobStatus,
        approvalRequests,
        securityAlerts,
        payoutSettings,
        submitApprovalRequest,
        reviewApprovalRequest,
        resolveSecurityAlert,
        updatePayoutSettings,
        revokeStaffSession,
        recordUnauthorizedAttempt,
        exportCustomerData,
        isLoading,
        loadingMessage,
        triggerLoading,
        resetDemoData,
        updateCustomerKyc,
        addShipment,
        updateShipmentStatus,
        cancelShipment,
        triggerOverdueAlert,
        resolveOverdueAlert,
        submitReview,
        moderateReview,
        createSupportTicket,
        addTicketMessage,
        redeemCashback,
        applyShippingCredits,
        reverseShippingCredits,
        selectedShipmentForTracking,
        setSelectedShipmentForTracking,
        activePublicNav,
        setActivePublicNav,
        activeCustomerTab,
        setActiveCustomerTab,
        bookingGroups,
        measurementReviews,
        createBookingGroup,
        requestMeasurementReview,
        issueRevisedQuoteVersion,
        resolveMeasurementReviewUphold,
        approveAndPayShipmentQuote,
        approveAndPayGroupQuote,
        markDropoffReceivedAtBranch,
        releaseDeliveryRewards,
        swiftShareRequests: travelCarryRequests,
        travelCarryRequests,
        addSwiftShareRequest: addTravelCarryRequest,
        addTravelCarryRequest,
        updateSwiftShareStatus: updateTravelCarryStatus,
        updateTravelCarryStatus,
        flagSwiftShareSafetyHold: flagTravelCarrySafetyHold,
        flagTravelCarrySafetyHold,
        confirmSwiftShareDeliveryAndReleasePayout: confirmTravelCarryDeliveryAndReleasePayout,
        confirmTravelCarryDeliveryAndReleasePayout,
        travellerInterests,
        registerTravellerInterest,
        addressBook,
        addAddressBookEntry,
        deleteAddressBookEntry,
        shipmentTemplates,
        addShipmentTemplate,
        deleteShipmentTemplate,
        repeatShipmentData,
        setRepeatShipmentData,
        cargoEnquiries,
        addCargoEnquiry,
        businessTeam,
        addBusinessTeamMember,
        updateBusinessTeamRole,
        deleteBusinessTeamMember,
        supportClaims,
        addSupportClaim,
        updateSupportClaimStatus,
        protectionConfig,
        updateProtectionConfig,
        protectionCertificates,
        addProtectionCertificate,
        activeBranchId,
        setActiveBranchId,
        searchCustomers,
        registerWalkInCustomer,
        handoverManifests,
        createHandoverManifest,
        customerConsents,
        recordCustomerConsent,
        recordBulkConsents,
        bookPickupRequest,
        assignPickupHandler,
        confirmDoorstepCollection,
        confirmFacilityArrivalAndWeigh,
        reschedulePickup,
        cancelPickup,
        walletTransactions,
        topUpWallet,
        payWithWallet,
        processWalletRefund,
        promoCampaigns,
        addPromoCampaign,
        updatePromoCampaign,
        validatePromoCode,
        cashbackConfig,
        updateCashbackConfig,
        operationalHandovers,
        createOperationalHandover,
        confirmOperationalHandoverReceipt,
        shipmentClarifications,
        createClarification,
        resolveClarification,
        replySupportTicket,
        updateTicketStatus,
        escalateTicket,
        rateTicketSatisfaction,
        refundRequests,
        submitRefundRequest,
        updateRefundStatus,
        requestShipmentCancellation,
        dhlConfig,
        updateDhlConfig,
        testDhlConnection,
        bookDhlCarrierForShipment,
        quotes,
        saveGuestQuote,
        respondToManualQuoteEnquiry,
        otpChallenges,
        otpDeliveryLogs,
        requestOtpForContact,
        verifyOtpForChallenge,
        recoverQuotesWithContact,
        getRecoveredItemsAfterOtp,
        paymentAdjustments,
        settlePaymentAdjustment,
        paymentReceipts,
        staffNotifications,
        markStaffNotificationRead,
        adminFeatureFlags,
        updateAdminFeatureFlags,
        carrierDivisorRules,
        updateCarrierDivisorRule,
        shipmentCredits,
        bonusGrants,
        customerNotifications,
        emitCustomerNotification,
        markCustomerNotificationRead,
        markAllCustomerNotificationsRead,
        getCustomerBalancesSnapshot,
        confirmFacilityReceipt,
        markPickupFailed,
        rejectRevisedQuote,
        archiveShipment,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
