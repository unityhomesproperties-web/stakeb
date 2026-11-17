import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  checkDhlConnection, 
  generateDhlWaybillNumber, 
  createDhlBooking, 
  translateDhlStatusCodeToPlainEnglish, 
  sanitizeForPublicTracking, 
  DEFAULT_DHL_CONFIG,
  DhlConfig
} from './dhl-api.ts';
import { ShipmentRecord } from '../types';

test('checkDhlConnection returns unconfigured when API key or account is missing', () => {
  const result = checkDhlConnection(DEFAULT_DHL_CONFIG);
  assert.equal(result.connected, false);
  assert.equal(result.status, 'unconfigured');
  assert.match(result.message, /DHL integration is not configured yet/i);
});

test('checkDhlConnection returns connected when sandbox credentials are provided', () => {
  const config: DhlConfig = {
    apiKey: 'dhl_sandbox_key_123',
    apiSecret: 'secret_456',
    accountNumber: '123456789',
    environment: 'sandbox',
    isConfigured: true,
  };
  const result = checkDhlConnection(config);
  assert.equal(result.connected, true);
  assert.equal(result.status, 'connected');
  assert.match(result.message, /DHL Express Sandbox API connected/i);
  assert.match(result.message, /••••6789/);
});

test('generateDhlWaybillNumber generates DHL- prefixed 10-digit format', () => {
  const waybill = generateDhlWaybillNumber();
  assert.match(waybill, /^DHL-\d{10}$/);
});

test('createDhlBooking includes demo disclaimer in demo mode', () => {
  const mockShipment: Partial<ShipmentRecord> = {
    trackingNumber: 'SWV-NG-849201',
    selectedTier: 'priority',
  };
  const booking = createDhlBooking(mockShipment);
  assert.equal(booking.isDemoCarrier, true);
  assert.match(booking.disclaimer, /DEMO MODE/i);
  assert.match(booking.carrierServiceName, /DHL Express Worldwide Priority/);
  assert.match(booking.dhlTrackingNumber, /^DHL-\d{10}$/);
});

test('translateDhlStatusCodeToPlainEnglish translates status codes without technical jargon', () => {
  const pu = translateDhlStatusCodeToPlainEnglish('PU');
  assert.equal(pu.title, 'Collected by Courier');
  assert.doesNotMatch(pu.description, /consignment|consignor|consignee/i);

  const af = translateDhlStatusCodeToPlainEnglish('AF');
  assert.equal(af.title, 'Facility Received');

  const ok = translateDhlStatusCodeToPlainEnglish('OK');
  assert.equal(ok.title, 'Delivered Safely');
});

test('sanitizeForPublicTracking strips private contact, address, and financial details', () => {
  const sensitiveShipment: ShipmentRecord = {
    id: 's_001',
    trackingNumber: 'SWV-NG-849201',
    dhlTrackingNumber: 'DHL-9876543210',
    direction: 'export',
    customerId: 'cust_01',
    customerName: 'Chinedu Okeke',
    customerEmail: 'chinedu@example.com',
    customerPhone: '+2348012345678',
    senderName: 'Chinedu Okeke',
    senderPhone: '+2348012345678',
    senderAddress: '15 Admiralty Way, Lekki Phase 1, Lagos',
    originCountry: 'Nigeria',
    originCity: 'Lagos',
    recipientName: 'Sarah Jenkins',
    recipientPhone: '+447911123456',
    recipientAddress: '24 Oxford Street, London W1D 1BS',
    destinationCountry: 'United Kingdom',
    destinationCity: 'London',
    contentsDescription: 'Traditional Fabric and Fashion Samples',
    items: [],
    declaredWeightKg: 5,
    pickupType: 'doorstep',
    pickupStatus: 'picked_up',
    pickupStatusLabel: 'On the way to London',
    status: 'in_transit',
    quote: {
      id: 'q_001',
      chargeableWeightKg: 5,
      actualWeightKg: 5,
      volumetricWeightKg: 4,
      serviceTier: 'priority',
      serviceName: 'Priority Air Express',
      laneDescription: 'Fastest available international lane',
      freightCharge: 50000,
      jetFuelSurcharge: 5000,
      handlingCharge: 2000,
      pickupCharge: 0,
      protectionCharge: 0,
      subtotal: 57000,
      vatAmount: 4275,
      totalAmount: 61275,
      estimatedDeliveryDate: '2026-11-12',
      estimatedDeliveryDisplay: 'Thursday, 3:00 PM',
      transitWindow: '2-4 business days',
      generatedAt: '2026-11-09T09:00:00Z',
      expiresAt: '2026-11-16T09:00:00Z',
    },
    selectedTier: 'priority',
    estimatedDeliveryDisplay: 'Thursday, 3:00 PM',
    paymentStatus: 'paid',
    trackingEvents: [
      {
        id: 'ev_1',
        stage: 'Collected by Courier',
        description: 'Package picked up from Lekki dispatch',
        timestamp: '2026-11-09T10:00:00Z',
        location: 'Lagos, Nigeria',
      },
    ],
    lastUpdateTimestamp: '2026-11-09T10:00:00Z',
    customerAcknowledgedTerms: true,
    customerAcknowledgedDeclaration: true,
    kycRequiredAtBooking: false,
    cashbackEarned: 1500,
    cashbackStatus: 'pending',
    hasReview: false,
    createdAt: '2026-11-09T09:00:00Z',
  };

  const publicView = sanitizeForPublicTracking(sensitiveShipment);
  
  // Public view preserves routing and IDs
  assert.equal(publicView.swiftveroCode, 'SWV-NG-849201');
  assert.equal(publicView.dhlTrackingNumber, 'DHL-9876543210');
  assert.equal(publicView.originCity, 'Lagos');
  assert.equal(publicView.destinationCity, 'London');
  assert.equal(publicView.destinationCountry, 'United Kingdom');

  // Verify that sensitive fields are NOT in the public object
  const keys = Object.keys(publicView);
  assert.equal(keys.includes('senderPhone'), false);
  assert.equal(keys.includes('senderAddress'), false);
  assert.equal(keys.includes('recipientPhone'), false);
  assert.equal(keys.includes('recipientAddress'), false);
  assert.equal(keys.includes('customerEmail'), false);
  assert.equal(keys.includes('paymentStatus'), false);
  assert.equal(keys.includes('quote'), false);
});
