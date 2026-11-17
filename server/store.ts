import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  BookingGroup,
  Branch,
  CashbackCampaignConfig,
  CustomerProfile,
  NotificationDeliveryRecord,
  NotificationPreferences,
  PaymentAdjustmentRecord,
  PaymentRecord,
  PickupJob,
  PromoCampaign,
  QuoteEnquiry,
  QuoteRecord,
  ShipmentRecord,
  StaffAccount,
} from '../src/types';
import {
  INITIAL_BOOKING_GROUPS,
  INITIAL_BRANCHES,
  INITIAL_CASHBACK_CONFIG,
  INITIAL_CUSTOMERS,
  INITIAL_PROMO_CAMPAIGNS,
  INITIAL_SHIPMENTS,
  INITIAL_STAFF_ACCOUNTS,
} from '../src/data/mockData';
import { DEFAULT_PROTECTION_CONFIG, ProtectionConfig } from '../src/utils/protection-calculator';
import { OtpChallengeRecord } from '../src/utils/quote-lifecycle';

export interface CustomerAuthCredential {
  customerId: string;
  email: string;
  phone: string;
  passwordHash: string; // scrypt:salt:hash
  verifiedEmail: boolean;
  verifiedPhone: boolean;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  customerId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
}

export interface DraftBookingGroup {
  id: string;
  customerId: string;
  name: string;
  collectionMethod: 'standard_pickup' | 'priority_pickup' | 'dropoff';
  sharedCollectionAddress: string;
  childParcels: Array<{
    id: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    destinationCountry: string;
    destinationCity: string;
    contentsDescription: string;
    estimatedWeightKg: number;
    declaredValueNgn: number;
    serviceTier: 'standard' | 'priority';
    isFragile: boolean;
    fragileNotes?: string;
    insuranceSelected: boolean;
  }>;
  updatedAt: string;
}

export interface DemoMessagingItem {
  id: string;
  recipient: string;
  channel: 'email' | 'sms' | 'whatsapp';
  subject: string;
  body: string;
  otpCode?: string; // Available ONLY inside isolated Demo Simulator Inbox when DEMO_MODE is active
  purpose: string;
  status: 'simulated_demo' | 'provider_unconfigured' | 'sent';
  createdAt: string;
}

export interface ServerDatabaseState {
  isDemoMode: boolean;
  branches: Branch[];
  customers: Record<string, CustomerProfile>;
  credentials: CustomerAuthCredential[];
  sessions: Record<string, SessionRecord>;
  shipments: ShipmentRecord[];
  bookingGroups: BookingGroup[];
  pickupJobs: PickupJob[];
  staffMembers: StaffAccount[];
  quotes: QuoteRecord[];
  quoteEnquiries: QuoteEnquiry[];
  paymentAdjustments: PaymentAdjustmentRecord[];
  payments: PaymentRecord[];
  notificationDeliveries: NotificationDeliveryRecord[];
  notificationPreferences: Record<string, NotificationPreferences>;
  promoCampaigns: PromoCampaign[];
  cashbackConfig: CashbackCampaignConfig;
  protectionConfig: ProtectionConfig;
  draftGroups: DraftBookingGroup[];
  otpChallenges: Record<string, OtpChallengeRecord>;
  demoInbox: DemoMessagingItem[];
  idempotencyKeys: Record<string, { createdAt: string; statusCode: number; response: unknown }>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'swiftvero-store.json');

export function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

function buildInitialPickupJobs(): PickupJob[] {
  return [
    {
      id: 'job_01',
      pickupReference: 'PKP-26-IKJ849',
      pickupCode: 'PKP-26-IKJ849',
      shipmentId: 'ship_01',
      trackingNumber: 'SWV-2026-NG8491',
      senderName: 'Amara Okafor',
      senderPhone: '+234 803 555 0192',
      senderAddress: 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos',
      customerName: 'Amara Okafor',
      customerPhone: '+234 803 555 0192',
      address: 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos',
      scheduledDate: '2026-10-21',
      scheduledSlot: '10:00 AM - 1:00 PM',
      declaredWeightKg: 4.5,
      declaredDimensions: { length: 35, width: 25, height: 20 },
      verifiedWeightKg: 4.5,
      collectionMethod: 'standard_pickup',
      isFragile: true,
      fragileNotes: 'Bronze decorative figurines wrapped in double honeycomb sleeve',
      status: 'delivered_to_hub',
      assignedAgentId: 'staff_03',
      assignedAgentName: 'Emeka Nwosu',
      branchId: 'branch_ikeja',
      notes: 'Collected on schedule and checked into Ikeja hub.',
    },
    {
      id: 'job_02',
      pickupReference: 'PKP-26-VI9044',
      pickupCode: 'PKP-26-VI9044',
      shipmentId: 'ship_04_group_ny',
      trackingNumber: 'SWV-2026-NG9044',
      senderName: 'Babatunde Adeleke',
      senderPhone: '+234 802 888 7766',
      senderAddress: 'Plot 8, Commercial Ave, Lekki Free Trade Zone, Lagos',
      customerName: 'Babatunde Adeleke',
      customerPhone: '+234 802 888 7766',
      address: 'Plot 8, Commercial Ave, Lekki Free Trade Zone, Lagos',
      scheduledDate: '2026-11-10',
      scheduledSlot: 'Priority 1 – 6 hour window',
      declaredWeightKg: 8.0,
      declaredDimensions: { length: 45, width: 35, height: 25 },
      verifiedWeightKg: 8.0,
      collectionMethod: 'priority_pickup',
      status: 'delivered_to_hub',
      assignedAgentId: 'staff_08',
      assignedAgentName: 'Babatunde Lawal',
      branchId: 'branch_vi',
      notes: 'Priority booking group collection BG-2026-8801.',
    },
  ];
}

function buildInitialQuotes(): QuoteRecord[] {
  const ship3Quote = INITIAL_SHIPMENTS.find((s) => s.id === 'ship_03')?.quote;
  return [
    {
      id: 'qrec_01',
      quoteRef: 'QTE-26-8491UK',
      quoteReference: 'QTE-26-8491UK',
      type: 'instant_estimate',
      customerId: 'cust_01_verified',
      contactName: 'Amara Okafor',
      contactEmail: 'amara.okafor@crafts.ng',
      contactPhone: '+234 803 555 0192',
      customerName: 'Amara Okafor',
      customerEmail: 'amara.okafor@crafts.ng',
      customerPhone: '+234 803 555 0192',
      direction: 'export',
      originCountry: 'Nigeria',
      originCity: 'Lagos',
      destinationCountry: 'United Kingdom',
      destinationCity: 'London',
      packageCategory: 'Artisan Crafts & Apparel',
      contentsSummary: 'Handcrafted bronze figurines and traditional dyed adire textiles',
      estimatedWeightKg: 4.5,
      dimensionsCm: { length: 35, width: 25, height: 20 },
      serviceTier: 'priority',
      isFragile: true,
      fragileNotes: 'Bronze figurines need rigid corner protection',
      items: [],
      totalEstimatedNgn: INITIAL_SHIPMENTS[0].quote.totalAmount,
      quote: INITIAL_SHIPMENTS[0].quote,
      status: 'converted_to_booking',
      convertedShipmentId: 'ship_01',
      convertedTrackingNumber: 'SWV-2026-NG8491',
      createdAt: '2026-10-20T10:30:00Z',
      expiresAt: '2026-12-30T23:59:59Z',
      isDemo: true,
    },
    ...(ship3Quote
      ? [
          {
            id: 'qrec_02',
            quoteRef: 'QTE-26-5519DE',
            quoteReference: 'QTE-26-5519DE',
            type: 'instant_estimate' as const,
            customerId: 'cust_02_pending',
            contactName: 'Fatima Bello',
            contactEmail: 'fatima@kanotextiles.com',
            contactPhone: '+234 802 444 8821',
            customerName: 'Fatima Bello',
            customerEmail: 'fatima@kanotextiles.com',
            customerPhone: '+234 802 444 8821',
            direction: 'export' as const,
            originCountry: 'Nigeria',
            originCity: 'Kano',
            destinationCountry: 'Germany',
            destinationCity: 'Berlin',
            packageCategory: 'Textiles & Indigo Fabrics',
            contentsSummary: 'Hand-woven indigo fabric rolls for fashion showcase',
            estimatedWeightKg: 5.2,
            dimensionsCm: { length: 38, width: 25, height: 20 },
            serviceTier: 'standard' as const,
            isFragile: false,
            items: [],
            totalEstimatedNgn: ship3Quote.totalAmount,
            quote: ship3Quote,
            status: 'converted_to_booking' as const,
            convertedShipmentId: 'ship_03',
            convertedTrackingNumber: 'SWV-2026-NG5519',
            createdAt: '2026-10-22T09:00:00Z',
            expiresAt: '2026-12-30T23:59:59Z',
            isDemo: true,
          },
        ]
      : []),
    {
      id: 'qrec_03',
      quoteRef: 'QTE-26-CA7720',
      quoteReference: 'QTE-26-CA7720',
      type: 'instant_estimate',
      customerId: 'cust_01_verified',
      contactName: 'Amara Okafor',
      contactEmail: 'amara.okafor@crafts.ng',
      contactPhone: '+234 803 555 0192',
      customerName: 'Amara Okafor',
      customerEmail: 'amara.okafor@crafts.ng',
      customerPhone: '+234 803 555 0192',
      direction: 'export',
      originCountry: 'Nigeria',
      originCity: 'Lagos',
      destinationCountry: 'Canada',
      destinationCity: 'Toronto',
      packageCategory: 'Artisan Textiles',
      contentsSummary: 'Adire sample lookbook & woven scarves (saved quote ready to book)',
      estimatedWeightKg: 2.5,
      dimensionsCm: { length: 30, width: 22, height: 12 },
      serviceTier: 'standard',
      isFragile: false,
      items: [],
      totalEstimatedNgn: 71353,
      quote: {
        id: 'QUO-CA7720',
        chargeableWeightKg: 2.5,
        actualWeightKg: 2.5,
        volumetricWeightKg: 1.6,
        serviceTier: 'standard',
        serviceName: 'Standard Air Courier',
        laneDescription: 'Cost-optimized international lane, consolidated for efficiency',
        freightCharge: 56250,
        jetFuelSurcharge: 5625,
        handlingCharge: 4500,
        pickupCharge: 0,
        protectionCharge: 0,
        subtotal: 66375,
        vatAmount: 4978,
        totalAmount: 71353,
        transitWindow: '5 - 8 business days',
        estimatedDeliveryDate: '2026-11-28',
        estimatedDeliveryDisplay: 'Saturday, 28 November 2026',
        generatedAt: '2026-11-10T10:00:00Z',
        expiresAt: '2026-12-30T23:59:59Z',
      },
      status: 'saved',
      createdAt: '2026-11-10T10:00:00Z',
      expiresAt: '2026-12-30T23:59:59Z',
      isDemo: true,
    },
  ];
}

function buildInitialQuoteEnquiries(): QuoteEnquiry[] {
  return [
    {
      id: 'qenq_01',
      quoteReference: 'QTE-26-BRZ310',
      customerName: 'Chinedu Okafor',
      customerEmail: 'chinedu@lagoscoffee.ng',
      customerPhone: '+234 809 331 2201',
      originCountry: 'Nigeria',
      originCity: 'Lagos',
      destinationCountry: 'Brazil',
      destinationCity: 'São Paulo',
      packageDescription: 'Roasted specialty Nigerian coffee sample tins (customs phytosanitary check requested)',
      estimatedWeightKg: 14,
      dimensionsCm: { length: 50, width: 40, height: 35 },
      isFragile: false,
      notes: 'Need airline commercial invoice & export tariff classification before booking.',
      status: 'pending_review',
      createdAt: '2026-11-12T08:45:00Z',
      updatedAt: '2026-11-12T08:45:00Z',
    },
  ];
}

function buildInitialNotifications(): NotificationDeliveryRecord[] {
  return [
    {
      id: 'notif_01',
      customerId: 'cust_01_verified',
      title: 'Action Required: Heathrow Transfer Scan Review',
      message: 'Your parcel SWV-2026-NG8491 has an overdue scan at Heathrow Gateway. Operations is coordinating directly with ground handling.',
      channel: 'in_app',
      deliveryStatus: 'delivered_in_app',
      relatedReference: 'SWV-2026-NG8491',
      category: 'tracking',
      read: false,
      createdAt: '2026-11-12T09:15:00Z',
    },
    {
      id: 'notif_02',
      customerId: 'cust_01_verified',
      title: 'Cashback Credit Released (+₦3,960)',
      message: 'Your 3% freight cashback for delivered shipment SWV-2026-NG3102 (Atlanta) has been added to your shipping credits balance.',
      channel: 'email',
      recipientAddress: 'amara.okafor@crafts.ng',
      deliveryStatus: 'simulated_demo',
      relatedReference: 'SWV-2026-NG3102',
      category: 'payment',
      read: false,
      createdAt: '2026-11-10T15:20:00Z',
    },
    {
      id: 'notif_03',
      customerId: 'cust_02_pending',
      title: 'Verified Scale Weight Updated — Approval Needed',
      message: 'Hub weighing recorded 5.2kg (vs 3.5kg estimate) for SWV-2026-NG5519. Please review and approve revised quote QTE / Version 2 before dispatch.',
      channel: 'in_app',
      deliveryStatus: 'delivered_in_app',
      relatedReference: 'SWV-2026-NG5519',
      category: 'quote',
      read: false,
      createdAt: '2026-11-11T16:05:00Z',
    },
  ];
}

export function createSeedState(): ServerDatabaseState {
  const defaultDemoPassHash = hashPassword('SwiftveroDemo2026!');
  const credentials: CustomerAuthCredential[] = Object.values(INITIAL_CUSTOMERS).map((c) => ({
    customerId: c.id,
    email: c.email.toLowerCase(),
    phone: c.phone,
    passwordHash: defaultDemoPassHash,
    verifiedEmail: true,
    verifiedPhone: true,
    createdAt: '2026-10-01T00:00:00Z',
  }));

  const prefs: Record<string, NotificationPreferences> = {};
  Object.values(INITIAL_CUSTOMERS).forEach((c) => {
    prefs[c.id] = {
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: false,
      inAppEnabled: true,
    };
  });

  const payments: PaymentRecord[] = INITIAL_SHIPMENTS.filter((s) => s.paymentStatus === 'paid').map(
    (s, i) => ({
      id: `pay_seed_${i + 1}`,
      paymentReference: s.paymentReference || `PAY-26-SEED0${i + 1}`,
      customerId: s.customerId,
      shipmentId: s.id,
      trackingNumber: s.trackingNumber,
      bookingGroupId: s.bookingGroupId,
      amountNgn: s.quote.totalAmount,
      method: s.paymentMethod || 'Paystack / Bank Transfer',
      kind: 'initial_booking',
      status: 'succeeded',
      gatewayMode: 'demo_simulated',
      createdAt: s.createdAt,
    })
  );

  return {
    isDemoMode: true,
    branches: JSON.parse(JSON.stringify(INITIAL_BRANCHES)),
    customers: JSON.parse(JSON.stringify(INITIAL_CUSTOMERS)),
    credentials,
    sessions: {},
    shipments: JSON.parse(JSON.stringify(INITIAL_SHIPMENTS)),
    bookingGroups: JSON.parse(JSON.stringify(INITIAL_BOOKING_GROUPS)),
    pickupJobs: buildInitialPickupJobs(),
    staffMembers: JSON.parse(JSON.stringify(INITIAL_STAFF_ACCOUNTS)),
    quotes: buildInitialQuotes(),
    quoteEnquiries: buildInitialQuoteEnquiries(),
    paymentAdjustments: [],
    payments,
    notificationDeliveries: buildInitialNotifications(),
    notificationPreferences: prefs,
    promoCampaigns: JSON.parse(JSON.stringify(INITIAL_PROMO_CAMPAIGNS)),
    cashbackConfig: JSON.parse(JSON.stringify(INITIAL_CASHBACK_CONFIG)),
    protectionConfig: JSON.parse(JSON.stringify(DEFAULT_PROTECTION_CONFIG)),
    draftGroups: [],
    otpChallenges: {},
    demoInbox: [],
    idempotencyKeys: {},
  };
}

let cachedState: ServerDatabaseState | null = null;

export function getStore(): ServerDatabaseState {
  if (cachedState) return cachedState;
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as ServerDatabaseState;
      if (parsed && parsed.shipments && parsed.customers) {
        cachedState = parsed;
        return cachedState;
      }
    }
  } catch {
    // Fallback cleanly to fresh seed state on corrupted file
  }
  cachedState = createSeedState();
  saveStore(cachedState);
  return cachedState;
}

export function saveStore(state: ServerDatabaseState): void {
  cachedState = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Ignore disk write failure in read-only sandbox if any
  }
}

export function resetStore(): ServerDatabaseState {
  const fresh = createSeedState();
  saveStore(fresh);
  return fresh;
}
