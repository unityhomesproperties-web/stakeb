import test from 'node:test';
import assert from 'node:assert';
import {
  hasPermission,
  canPromoteToOwner,
  canModifyPayoutSettings,
  evaluateRefundApproval,
  canExportCustomerDatabase,
  canDeleteAuditLog,
  canManuallyOverridePayment,
  canAccessCustomerShipment,
} from './permissions';

test('1. Visitor role: only public permissions, no private dashboards or mutations', () => {
  assert.strictEqual(hasPermission('visitor', 'view_public_site'), true);
  assert.strictEqual(hasPermission('visitor', 'track_shipment_public'), true);
  assert.strictEqual(hasPermission('visitor', 'manage_own_shipments'), false);
  assert.strictEqual(hasPermission('visitor', 'super_admin_manage_staff'), false);
  assert.strictEqual(hasPermission('visitor', 'front_desk_intake'), false);
  assert.strictEqual(hasPermission('visitor', 'finance_view_totals'), false);
  assert.strictEqual(hasPermission('visitor', 'owner_security_dashboard'), false);
  assert.strictEqual(canAccessCustomerShipment('visitor', 'any', 'cust_01'), false);
});

test('2. Customer role: data isolation prevents viewing another customer shipments', () => {
  assert.strictEqual(hasPermission('customer', 'manage_own_shipments'), true);
  assert.strictEqual(hasPermission('customer', 'batch_consignments'), false);
  assert.strictEqual(hasPermission('customer', 'super_admin_manage_staff'), false);
  assert.strictEqual(hasPermission('customer', 'finance_approve_refunds'), false);
  
  // Own shipment vs another customer shipment
  assert.strictEqual(canAccessCustomerShipment('customer', 'cust_100', 'cust_100'), true);
  assert.strictEqual(canAccessCustomerShipment('customer', 'cust_100', 'cust_999'), false);
});

test('3. Business customer: batch consignments enabled, staff admin restricted', () => {
  assert.strictEqual(hasPermission('business', 'manage_own_shipments'), true);
  assert.strictEqual(hasPermission('business', 'manage_business_shipments'), true);
  assert.strictEqual(hasPermission('business', 'batch_consignments'), true);
  assert.strictEqual(hasPermission('business', 'super_admin_manage_staff'), false);
  assert.strictEqual(hasPermission('business', 'finance_reconcile_payments'), false);
  assert.strictEqual(hasPermission('business', 'owner_security_dashboard'), false);
});

test('4. Front Desk admin: intake permitted, financial override and staff management blocked', () => {
  assert.strictEqual(hasPermission('front_desk', 'front_desk_intake'), true);
  assert.strictEqual(hasPermission('front_desk', 'front_desk_print_receipt'), true);
  assert.strictEqual(hasPermission('front_desk', 'super_admin_manage_staff'), false);
  assert.strictEqual(hasPermission('front_desk', 'finance_view_totals'), false);
  assert.strictEqual(canManuallyOverridePayment('front_desk'), false);
});

test('5. Pickup Agent: field tasks permitted, bulk customer data export blocked', () => {
  assert.strictEqual(hasPermission('pickup_agent', 'pickup_agent_schedule'), true);
  assert.strictEqual(hasPermission('pickup_agent', 'pickup_agent_scale_verify'), true);
  assert.strictEqual(hasPermission('pickup_agent', 'export_customer_data'), false);
  
  const exportCheck = canExportCustomerDatabase('pickup_agent');
  assert.strictEqual(exportCheck.allowed, false);
  assert.match(exportCheck.reason, /Bulk customer data export is restricted/);
});

test('6. Platform Administrator: cannot self-promote or provision Owner role', () => {
  assert.strictEqual(canPromoteToOwner('platform_admin'), false);
  assert.strictEqual(canPromoteToOwner('super_admin'), false);
  assert.strictEqual(canPromoteToOwner('finance'), false);
  assert.strictEqual(canPromoteToOwner('owner'), true);
});

test('7. Company payout settings: strictly protected from non-owners', () => {
  assert.strictEqual(canModifyPayoutSettings('platform_admin'), false);
  assert.strictEqual(canModifyPayoutSettings('super_admin'), false);
  assert.strictEqual(canModifyPayoutSettings('finance'), false);
  assert.strictEqual(canModifyPayoutSettings('operations'), false);
  assert.strictEqual(canModifyPayoutSettings('owner'), true);
});

test('8. Dual-Control Rule: initiator cannot approve their own refund (anti-fraud)', () => {
  const selfApproval = evaluateRefundApproval('finance', 'staff_finance_1', 'staff_finance_1', 15000);
  assert.strictEqual(selfApproval.allowed, false);
  assert.match(selfApproval.reason, /Dual-Control Violation/);

  // Different staff member approval below threshold
  const dualApproval = evaluateRefundApproval('finance', 'staff_finance_2', 'staff_finance_1', 15000);
  assert.strictEqual(dualApproval.allowed, true);
});

test('9. High-Value Financial Rule: refunds > ₦50,000 require Owner approval', () => {
  // Finance staff attempting to approve ₦85,000 (exceeds ₦50,000 threshold)
  const financeOverThreshold = evaluateRefundApproval('finance', 'staff_finance_2', 'staff_finance_1', 85000);
  assert.strictEqual(financeOverThreshold.allowed, false);
  assert.match(financeOverThreshold.reason, /Threshold Exceeded/);

  // Owner approving the high-value refund (different requester)
  const ownerOverThreshold = evaluateRefundApproval('owner', 'staff_owner', 'staff_finance_1', 85000);
  assert.strictEqual(ownerOverThreshold.allowed, true);

  // Owner still cannot approve their OWN initiated request (dual-control holds for all)
  const ownerSelfApproval = evaluateRefundApproval('owner', 'staff_owner', 'staff_owner', 85000);
  assert.strictEqual(ownerSelfApproval.allowed, false);
  assert.match(ownerSelfApproval.reason, /Dual-Control Violation/);
});

test('10. Tamper-Proof Audit Rule: audit logs cannot be deleted or modified by ANY role', () => {
  assert.strictEqual(canDeleteAuditLog(), false);
});

test('11. Payment Gatekeeper Rule: manual payment override is prohibited across all roles', () => {
  assert.strictEqual(canManuallyOverridePayment('visitor'), false);
  assert.strictEqual(canManuallyOverridePayment('customer'), false);
  assert.strictEqual(canManuallyOverridePayment('front_desk'), false);
  assert.strictEqual(canManuallyOverridePayment('platform_admin'), false);
  assert.strictEqual(canManuallyOverridePayment('owner'), false);
});

test('12. Owner / Root Admin executive oversight and emergency controls', () => {
  assert.strictEqual(hasPermission('owner', 'owner_security_dashboard'), true);
  assert.strictEqual(hasPermission('owner', 'owner_manage_payout_settings'), true);
  assert.strictEqual(hasPermission('owner', 'owner_review_approval_queue'), true);
  assert.strictEqual(hasPermission('owner', 'owner_manage_privileged_roles'), true);
  assert.strictEqual(hasPermission('owner', 'owner_emergency_session_revoke'), true);
  assert.strictEqual(hasPermission('owner', 'owner_view_security_alerts'), true);
  
  const ownerExport = canExportCustomerDatabase('owner');
  assert.strictEqual(ownerExport.allowed, true);
});
