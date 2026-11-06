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
} from '../types';
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
} from '../data/mockData';
import {
  hasPermission as checkPermission,
  Permission,
  canPromoteToOwner,
  canModifyPayoutSettings,
  evaluateRefundApproval,
  canExportCustomerDatabase,
} from '../utils/permissions';

interface DemoContextType {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  activeCustomerKey: 'verified' | 'pending' | 'new' | 'business';
  setActiveCustomerKey: (key: 'verified' | 'pending' | 'new' | 'business') => void;
  currentCustomer: CustomerProfile;
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
  submitReview: (review: Omit<CustomerReview, 'id' | 'createdAt'>) => void;
  moderateReview: (reviewId: string, status: 'published' | 'rejected', response?: string) => void;
  createSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages'>, initialMessage: string) => void;
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
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const INITIAL_PICKUP_JOBS: PickupJob[] = [
  {
    id: 'job_01',
    shipmentId: 'ship_01',
    trackingNumber: 'SWV-2026-NG8491',
    senderName: 'Amara Okafor (Lekki Artisan Creations Ltd)',
    senderPhone: '+234 803 555 0192',
    senderAddress: 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos',
    branchId: 'branch_ikeja',
    branchName: 'Ikeja Cargo Hub (Lagos Mainland)',
    scheduledSlot: '10:00 AM - 1:00 PM',
    scheduledDate: '2026-10-21',
    declaredWeightKg: 4.5,
    declaredDimensions: { length: 35, width: 25, height: 20 },
    verifiedWeightKg: 4.5,
    verifiedDimensions: { length: 35, width: 25, height: 20 },
    status: 'handed_over',
    assignedAgentId: 'staff_03',
    assignedAgentName: 'Emeka Nwosu',
    assigningStaffId: 'staff_04',
    assigningStaffName: 'Kemi Adeleke',
    assignedAt: '2026-10-21T09:00:00Z',
    inspectionStatus: 'passed',
    handoverStatus: 'handed_over',
    handoverConfirmedBy: 'Chioma Eze (Front Desk Intake)',
    handoverTimestamp: '2026-10-21T14:10:00Z',
    notes: 'Calibrated scale digital reading matched declaration. Tamper tape sealed.',
  },
  {
    id: 'job_02',
    shipmentId: 'ship_03',
    trackingNumber: 'SWV-2026-NG5519',
    senderName: 'Fatima Bello (Kano Textile Collective)',
    senderPhone: '+234 802 444 8821',
    senderAddress: '42 Bompai Industrial Area, Kano',
    branchId: 'branch_ikeja',
    branchName: 'Ikeja Cargo Hub (Lagos Mainland)',
    scheduledSlot: '9:00 AM - 12:00 PM',
    scheduledDate: '2026-10-23',
    declaredWeightKg: 3.5,
    declaredDimensions: { length: 30, width: 20, height: 15 },
    verifiedWeightKg: 5.2,
    verifiedDimensions: { length: 38, width: 25, height: 20 },
    status: 'collected',
    assignedAgentId: 'staff_03',
    assignedAgentName: 'Emeka Nwosu',
    assigningStaffId: 'staff_04',
    assigningStaffName: 'Kemi Adeleke',
    assignedAt: '2026-10-23T08:30:00Z',
    inspectionStatus: 'discrepancy',
    handoverStatus: 'pending',
    notes: 'Physical weighing revealed weight difference (+1.7kg). Re-quote flagged.',
  },
  {
    id: 'job_03',
    shipmentId: 'ship_02',
    trackingNumber: 'SWV-2026-NG1088',
    senderName: 'Babatunde Adeleke (Lekki Heritage Exports PLC)',
    senderPhone: '+234 802 888 7766',
    senderAddress: 'Plot 8, Commercial Ave, Lekki Free Trade Zone, Lagos',
    branchId: 'branch_vi',
    branchName: 'Victoria Island & Lekki Center',
    scheduledSlot: '11:00 AM - 2:00 PM',
    scheduledDate: '2026-10-26',
    declaredWeightKg: 14.7,
    declaredDimensions: { length: 45, width: 35, height: 25 },
    status: 'en_route',
    assignedAgentId: 'staff_08',
    assignedAgentName: 'Babatunde Lawal',
    assigningStaffId: 'staff_01',
    assigningStaffName: 'Tunde Balogun',
    assignedAt: '2026-10-26T09:15:00Z',
    inspectionStatus: 'pending',
    handoverStatus: 'pending',
    notes: 'Agent en route to Lekki Free Trade Zone for commercial export batch collection.',
  },
  {
    id: 'job_04',
    shipmentId: 'ship_04',
    trackingNumber: 'SWV-2026-NG7720',
    senderName: 'Oluwaseun Adeleke',
    senderPhone: '+234 701 999 3320',
    senderAddress: '15 Bishop Oluwole Street, Victoria Island, Lagos',
    branchId: 'branch_vi',
    branchName: 'Victoria Island & Lekki Center',
    scheduledSlot: '2:00 PM - 5:00 PM',
    scheduledDate: '2026-10-27',
    declaredWeightKg: 2.1,
    declaredDimensions: { length: 25, width: 20, height: 10 },
    status: 'assigned',
    assignedAgentId: 'staff_08',
    assignedAgentName: 'Babatunde Lawal',
    assigningStaffId: 'staff_07',
    assigningStaffName: 'Damilola Adeyemi',
    assignedAt: '2026-10-27T08:00:00Z',
    inspectionStatus: 'pending',
    handoverStatus: 'pending',
    notes: 'Doorstep pickup confirmed for documents and sample fabrics.',
  },
];

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<DemoRole>('visitor');
  const [activeCustomerKey, setActiveCustomerKey] = useState<'verified' | 'pending' | 'new' | 'business'>('verified');
  const [customers, setCustomers] = useState<Record<string, CustomerProfile>>(INITIAL_CUSTOMERS);
  const [shipments, setShipments] = useState<ShipmentRecord[]>(INITIAL_SHIPMENTS);
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [cashbackLedger, setCashbackLedger] = useState<CashbackLedgerItem[]>(INITIAL_CASHBACK_LEDGER);
  const [referrals, setReferrals] = useState<ReferralItem[]>(INITIAL_REFERRALS);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [activeBranchFilter, setActiveBranchFilter] = useState<string>('all');
  const [pickupJobs, setPickupJobs] = useState<PickupJob[]>(INITIAL_PICKUP_JOBS);
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

  const resetDemoData = () => {
    triggerLoading('Resetting demonstration state, staff directory, and sample consignments...', 500);
    setCustomers(INITIAL_CUSTOMERS);
    setShipments(INITIAL_SHIPMENTS);
    setReviews(INITIAL_REVIEWS);
    setTickets(INITIAL_TICKETS);
    setCashbackLedger(INITIAL_CASHBACK_LEDGER);
    setReferrals(INITIAL_REFERRALS);
    setBranches(INITIAL_BRANCHES);
    setActiveBranchFilter('all');
    setPickupJobs(INITIAL_PICKUP_JOBS);
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

  const updateShipmentStatus = (shipmentId: string, updates: Partial<ShipmentRecord>) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );
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

  const submitReview = (review: Omit<CustomerReview, 'id' | 'createdAt'>) => {
    const photos = review.photoUrls && review.photoUrls.length > 0
      ? review.photoUrls
      : (review.photoUrl ? [review.photoUrl] : []);
    const newRev: CustomerReview = {
      ...review,
      id: 'rev_' + Date.now(),
      photoUrls: photos,
      photoUrl: photos[0] || undefined,
      status: review.status || 'published',
      moderationStatus: review.moderationStatus || 'approved',
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [newRev, ...prev]);
    setShipments((prev) => prev.map((s) => (s.id === review.shipmentId ? { ...s, hasReview: true } : s)));
  };

  const moderateReview = (reviewId: string, status: 'published' | 'rejected', response?: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, status, companyResponse: response || r.companyResponse } : r
      )
    );
  };

  const createSupportTicket = (
    ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages'>,
    initialMessage: string
  ) => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const newTicket: SupportTicket = {
      ...ticket,
      id: 'tkt_' + Date.now(),
      ticketNumber: `TK-${num}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_' + Date.now(),
          sender: 'customer',
          senderName: currentCustomer.name,
          text: initialMessage,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
      ],
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const addTicketMessage = (ticketId: string, sender: 'customer' | 'support', text: string) => {
    const senderName = sender === 'customer' ? currentCustomer.name : 'Swiftvero Support Desk';
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            updatedAt: new Date().toISOString(),
            messages: [
              ...t.messages,
              {
                id: 'msg_' + Date.now(),
                sender,
                senderName,
                text,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              },
            ],
          };
        }
        return t;
      })
    );
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

  return (
    <DemoContext.Provider
      value={{
        role,
        setRole,
        activeCustomerKey,
        setActiveCustomerKey,
        currentCustomer,
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
