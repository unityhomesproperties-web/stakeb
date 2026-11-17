import {
  CashbackLedgerItem,
  CustomerReview,
  ShipmentRecord,
  SupportClaim,
  WalletTransaction,
} from '../types';

export interface ReviewEligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function canSubmitReviewForShipment(params: {
  shipment?: ShipmentRecord;
  existingReviews: CustomerReview[];
  customerId?: string;
  isVerifiedGuest?: boolean;
}): ReviewEligibilityResult {
  const { shipment, existingReviews, customerId, isVerifiedGuest } = params;

  if (!shipment) {
    return { eligible: false, reason: 'Shipment record not found.' };
  }

  if (shipment.status !== 'delivered') {
    return {
      eligible: false,
      reason: 'Only completed shipments with confirmed delivery status can be reviewed.',
    };
  }

  if (!isVerifiedGuest && shipment.customerId !== customerId) {
    return {
      eligible: false,
      reason: 'Only the verified consignor account or OTP-verified sender can submit a review.',
    };
  }

  const duplicateExists = existingReviews.some(
    (r) =>
      r.shipmentId === shipment.id ||
      r.trackingNumber.toUpperCase() === shipment.trackingNumber.toUpperCase()
  );

  if (duplicateExists || shipment.hasReview) {
    return {
      eligible: false,
      reason: 'A review has already been submitted for this delivered shipment.',
    };
  }

  return { eligible: true };
}

export function getPublicApprovedReviews(reviews: CustomerReview[]): CustomerReview[] {
  return reviews.filter(
    (r) => r.status === 'published' && r.moderationStatus === 'approved'
  );
}

export interface CustomerActivityItem {
  id: string;
  category: 'shipment' | 'wallet' | 'reward' | 'claim';
  title: string;
  subtitle: string;
  timestamp: string;
  referenceCode?: string;
}

export function buildCustomerRecentActivity(params: {
  customerId: string;
  shipments: ShipmentRecord[];
  walletTransactions: WalletTransaction[];
  cashbackLedger: CashbackLedgerItem[];
  supportClaims: SupportClaim[];
  limit?: number;
}): CustomerActivityItem[] {
  const { customerId, shipments, walletTransactions, cashbackLedger, supportClaims, limit = 6 } = params;

  const items: CustomerActivityItem[] = [];

  shipments
    .filter((s) => s.customerId === customerId)
    .forEach((s) => {
      const latestEvent = s.trackingEvents[s.trackingEvents.length - 1];
      items.push({
        id: `act_ship_${s.id}`,
        category: 'shipment',
        title: `${s.trackingNumber} · ${latestEvent?.stage || s.status.replace('_', ' ')}`,
        subtitle: `${s.destinationCity}, ${s.destinationCountry}`,
        timestamp: s.lastUpdateTimestamp || s.createdAt,
        referenceCode: s.trackingNumber,
      });
    });

  walletTransactions
    .filter((w) => w.customerId === customerId)
    .forEach((w) => {
      items.push({
        id: `act_wal_${w.id}`,
        category: 'wallet',
        title: w.type === 'wallet_topup' ? 'Wallet Funded' : 'Shipment Settlement',
        subtitle: `${w.description} (₦${Math.abs(w.amountNgn).toLocaleString()})`,
        timestamp: w.createdAt,
        referenceCode: w.shipmentTrackingNumber || w.transactionReference,
      });
    });

  cashbackLedger
    .filter((c) => c.customerId === customerId && c.status !== 'pending')
    .forEach((c) => {
      items.push({
        id: `act_rew_${c.id}`,
        category: 'reward',
        title: c.amountNgn >= 0 ? 'Shipping Credit Released' : 'Shipping Credit Redeemed',
        subtitle: `${c.description} (₦${Math.abs(c.amountNgn).toLocaleString()})`,
        timestamp: c.releasedAt || c.createdAt,
        referenceCode: c.trackingNumber,
      });
    });

  supportClaims
    .filter((cl) => cl.customerId === customerId)
    .forEach((cl) => {
      items.push({
        id: `act_clm_${cl.id}`,
        category: 'claim',
        title: `Claim ${cl.claimNumber} (${cl.status.replace(/_/g, ' ')})`,
        subtitle: cl.description.slice(0, 75),
        timestamp: cl.updatedAt,
        referenceCode: cl.shipmentTracking,
      });
    });

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
