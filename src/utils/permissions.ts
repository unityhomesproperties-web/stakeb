import { DemoRole } from '../types';

export type Permission =
  | 'view_public_site'
  | 'track_shipment_public'
  | 'manage_own_shipments'
  | 'manage_business_shipments'
  | 'batch_consignments'
  | 'front_desk_intake'
  | 'front_desk_print_receipt'
  | 'pickup_agent_schedule'
  | 'pickup_agent_scale_verify'
  | 'operations_queue'
  | 'operations_assign_courier'
  | 'operations_exception_handling'
  | 'finance_view_totals'
  | 'finance_reconcile_payments'
  | 'finance_approve_refunds'
  | 'platform_admin_view_directory'
  | 'platform_admin_support_cases'
  | 'platform_admin_operational_settings'
  | 'request_privileged_approval'
  | 'owner_security_dashboard'
  | 'owner_manage_payout_settings'
  | 'owner_review_approval_queue'
  | 'owner_manage_privileged_roles'
  | 'owner_emergency_session_revoke'
  | 'owner_view_security_alerts'
  | 'export_customer_data'
  | 'export_own_business_data'
  | 'super_admin_manage_staff'
  | 'super_admin_audit_logs'
  | 'super_admin_system_config';

export const ROLE_PERMISSIONS: Record<DemoRole, Permission[]> = {
  visitor: ['view_public_site', 'track_shipment_public'],
  customer: ['view_public_site', 'track_shipment_public', 'manage_own_shipments'],
  business: [
    'view_public_site',
    'track_shipment_public',
    'manage_own_shipments',
    'manage_business_shipments',
    'batch_consignments',
    'export_own_business_data',
  ],
  front_desk: [
    'view_public_site',
    'track_shipment_public',
    'front_desk_intake',
    'front_desk_print_receipt',
  ],
  pickup_agent: [
    'view_public_site',
    'track_shipment_public',
    'pickup_agent_schedule',
    'pickup_agent_scale_verify',
  ],
  operations: [
    'view_public_site',
    'track_shipment_public',
    'operations_queue',
    'operations_assign_courier',
    'operations_exception_handling',
  ],
  finance: [
    'view_public_site',
    'track_shipment_public',
    'finance_view_totals',
    'finance_reconcile_payments',
    'finance_approve_refunds',
    'request_privileged_approval',
  ],
  platform_admin: [
    'view_public_site',
    'track_shipment_public',
    'operations_queue',
    'operations_exception_handling',
    'platform_admin_view_directory',
    'platform_admin_support_cases',
    'platform_admin_operational_settings',
    'request_privileged_approval',
    'super_admin_audit_logs',
  ],
  super_admin: [
    'view_public_site',
    'track_shipment_public',
    'operations_queue',
    'operations_exception_handling',
    'platform_admin_view_directory',
    'platform_admin_support_cases',
    'platform_admin_operational_settings',
    'request_privileged_approval',
    'super_admin_audit_logs',
  ],
  owner: [
    'view_public_site',
    'track_shipment_public',
    'manage_own_shipments',
    'manage_business_shipments',
    'batch_consignments',
    'front_desk_intake',
    'front_desk_print_receipt',
    'pickup_agent_schedule',
    'pickup_agent_scale_verify',
    'operations_queue',
    'operations_assign_courier',
    'operations_exception_handling',
    'finance_view_totals',
    'finance_reconcile_payments',
    'finance_approve_refunds',
    'platform_admin_view_directory',
    'platform_admin_support_cases',
    'platform_admin_operational_settings',
    'request_privileged_approval',
    'owner_security_dashboard',
    'owner_manage_payout_settings',
    'owner_review_approval_queue',
    'owner_manage_privileged_roles',
    'owner_emergency_session_revoke',
    'owner_view_security_alerts',
    'export_customer_data',
    'super_admin_manage_staff',
    'super_admin_audit_logs',
    'super_admin_system_config',
  ],
};

export const ROLE_LABELS: Record<
  DemoRole,
  { title: string; category: string; description: string; badge: string }
> = {
  visitor: {
    title: 'Public Visitor',
    category: 'Public Access',
    description: 'Browse shipping rates, services, policies, and track public waybills without an account.',
    badge: 'Guest',
  },
  customer: {
    title: 'Individual Customer',
    category: 'Customer Accounts',
    description: 'Personal consignor portal: book shipments, doorstep pickups, KYC verification, and cashback rewards.',
    badge: 'Consignor',
  },
  business: {
    title: 'Business Customer',
    category: 'Customer Accounts',
    description: 'Enterprise export desk: multi-recipient batch shipments, commercial declarations, and volume invoicing.',
    badge: 'Enterprise',
  },
  front_desk: {
    title: 'Front Desk Admin',
    category: 'Operations Staff',
    description: 'Physical walk-in counter intake, calibrated digital scale weighing, draft quotes, and instant receipts.',
    badge: 'Intake Staff',
  },
  pickup_agent: {
    title: 'Pickup Agent',
    category: 'Field Logistics',
    description: 'Field collection dispatch: scheduled pickups, portable scale dimension checks, and hub handover.',
    badge: 'Field Courier',
  },
  operations: {
    title: 'Operations Admin',
    category: 'Operations Staff',
    description: 'Operational dispatch queue, agent assignments, tracking hold alerts, and customer support escalation.',
    badge: 'Control Tower',
  },
  finance: {
    title: 'Finance Lead',
    category: 'Corporate Finance',
    description: 'Revenue auditing, FIRS 7.5% VAT compliance, transaction reconciliation, and refund preparation.',
    badge: 'Finance Desk',
  },
  platform_admin: {
    title: 'Platform Administrator',
    category: 'Employee Administration',
    description: 'Routine administration: operational queue, support cases, and directory view. High-risk actions require Owner approval.',
    badge: 'Platform Admin',
  },
  super_admin: {
    title: 'Platform Administrator',
    category: 'Employee Administration',
    description: 'Routine administration: operational queue, support cases, and directory view. High-risk actions require Owner approval.',
    badge: 'Platform Admin',
  },
  owner: {
    title: 'Owner / Root Admin',
    category: 'Executive Ownership',
    description: 'Sole executive authority: payout accounts, privileged staff provisioning, high-risk approval queue, and security alerts.',
    badge: 'Company Owner',
  },
};

export function hasPermission(role: DemoRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Security Rule: Cannot promote anyone to Owner / Root Admin unless current actor is verified Owner.
 */
export function canPromoteToOwner(actorRole: DemoRole): boolean {
  return actorRole === 'owner';
}

/**
 * Security Rule: Cannot modify payout settings or company bank account unless actor is Owner.
 */
export function canModifyPayoutSettings(actorRole: DemoRole): boolean {
  return actorRole === 'owner';
}

/**
 * Dual-Control Financial Rule:
 * 1. The initiator of a refund or financial adjustment CANNOT be its sole approver (two-person control).
 * 2. Refunds exceeding the configurable threshold (e.g. ₦50,000) require Owner approval.
 */
export function evaluateRefundApproval(
  actorRole: DemoRole,
  actorId: string,
  requesterId: string,
  amountNgn: number,
  thresholdNgn: number = 50000
): { allowed: boolean; reason: string } {
  // Self-approval prohibition
  if (actorId === requesterId) {
    return {
      allowed: false,
      reason: 'Dual-Control Violation: The initiator of a financial refund request cannot approve their own transaction.',
    };
  }

  // Non-privileged staff cannot approve refunds
  if (actorRole !== 'owner' && actorRole !== 'finance' && actorRole !== 'platform_admin' && actorRole !== 'super_admin') {
    return {
      allowed: false,
      reason: 'Unauthorized: Your role does not possess financial approval privileges.',
    };
  }

  // High-risk threshold enforcement
  if (amountNgn > thresholdNgn) {
    if (actorRole !== 'owner') {
      return {
        allowed: false,
        reason: `Threshold Exceeded: Refunds above NGN ${thresholdNgn.toLocaleString()} require explicit Owner / Root Admin approval.`,
      };
    }
  }

  return {
    allowed: true,
    reason: 'Approved in accordance with financial policy and dual-control rules.',
  };
}

/**
 * Data Protection Rule:
 * Pickup agents only have access to customer & address details for their assigned job.
 * Bulk customer database export is strictly restricted to Owner, or Platform Admin with Owner authorization.
 */
export function canExportCustomerDatabase(actorRole: DemoRole): { allowed: boolean; reason: string } {
  if (actorRole === 'owner') {
    return { allowed: true, reason: 'Owner export authorized with mandatory audit logging.' };
  }
  return {
    allowed: false,
    reason: 'Security Policy: Bulk customer data export is restricted. Submit a Privileged Approval Request to the Company Owner.',
  };
}

/**
 * Tamper-Proof Audit Rule:
 * Audit logs are immutable. NO role, including Owner, can edit or delete audit logs.
 */
export function canDeleteAuditLog(): boolean {
  return false;
}

/**
 * Payment Verification Rule:
 * No employee or frontend button can arbitrarily mark an unverified online payment as "paid".
 * Online payments must be confirmed by the payment gateway (Monnify / Paystack webhook or bank settlement).
 */
export function canManuallyOverridePayment(actorRole: DemoRole): boolean {
  return false;
}

/**
 * Data Isolation Rule:
 * Customers can only view shipments where they are the verified consignor.
 */
export function canAccessCustomerShipment(
  actorRole: DemoRole,
  actorCustomerId: string,
  shipmentCustomerId: string
): boolean {
  if (actorRole === 'visitor') return false;
  if (actorRole === 'customer') {
    return actorCustomerId === shipmentCustomerId;
  }
  if (actorRole === 'business') {
    return actorCustomerId === shipmentCustomerId;
  }
  // Authorized internal staff
  return true;
}

/**
 * Branch Scope Rule:
 * Supervisors (Owner, Platform Admin, Operations, Finance) can view and switch across all branches.
 * Branch-restricted staff (Front Desk, Pickup Agent) are restricted to their assigned branch.
 */
export function canAccessCrossBranch(actorRole: DemoRole): boolean {
  return ['owner', 'platform_admin', 'super_admin', 'operations', 'finance'].includes(actorRole);
}

/**
 * Supervisor Reassignment Rule:
 * Only Owner, Platform Admin, and Operations staff can reassign staff, pickups, or shipments across branches.
 */
export function canReassignBranchResources(actorRole: DemoRole): boolean {
  return ['owner', 'platform_admin', 'super_admin', 'operations'].includes(actorRole);
}
