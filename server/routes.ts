import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import {
  getStore,
  hashPassword,
  resetStore,
  saveStore,
  ServerDatabaseState,
  verifyPassword,
} from './store';
import {
  generateAdjustmentReference,
  generateBookingGroupReference,
  generatePaymentReference,
  generatePickupReference,
  generateQuoteReference,
  generateShipmentReference,
} from '../src/utils/references';
import {
  calculatePaymentAdjustment,
  canHandoverToCarrier,
  canResendOtp,
  createOtpChallenge,
  createQuoteRevision,
  maskContactInfo,
  verifyOtpChallenge,
} from '../src/utils/quote-lifecycle';
import { calculatePriorityPickupFee } from '../src/utils/collection-options';
import { generateQuoteBreakdown, recalculateVerifiedQuote } from '../src/utils/shipping-calculator';
import { evaluateInsuranceAvailability } from '../src/utils/protection-calculator';
import {
  BookingGroup,
  CustomerProfile,
  NotificationDeliveryRecord,
  PaymentAdjustmentRecord,
  PaymentRecord,
  PickupJob,
  QuoteEnquiry,
  QuoteRecord,
  ShipmentRecord,
} from '../src/types';

function getAllExistingCodes(store: ServerDatabaseState): Set<string> {
  const codes = new Set<string>();
  store.shipments.forEach((s) => codes.add(s.trackingNumber));
  store.bookingGroups.forEach((g) => codes.add(g.groupCode));
  store.pickupJobs.forEach((p) => {
    if (p.pickupCode) codes.add(p.pickupCode);
  });
  store.quotes.forEach((q) => codes.add(q.quoteReference || q.quoteRef));
  store.quoteEnquiries.forEach((qe) => codes.add(qe.quoteReference));
  store.paymentAdjustments.forEach((a) => codes.add(a.adjustmentCode || a.adjustmentRef));
  store.payments.forEach((p) => codes.add(p.paymentReference));
  return codes;
}

function sanitizeCustomer(profile: CustomerProfile): CustomerProfile {
  return { ...profile };
}

function getAuthenticatedCustomer(req: Request, store: ServerDatabaseState): CustomerProfile | null {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;
  const session = store.sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    delete store.sessions[token];
    saveStore(store);
    return null;
  }
  return Object.values(store.customers).find((c) => c.id === session.customerId) || null;
}

function recordNotification(
  store: ServerDatabaseState,
  params: {
    customerId: string;
    title: string;
    message: string;
    channel: NotificationDeliveryRecord['channel'];
    recipientAddress?: string;
    relatedReference?: string;
    category: NotificationDeliveryRecord['category'];
    otpCodeForDemoInbox?: string;
  }
): NotificationDeliveryRecord {
  const hasRealEmailProvider = Boolean(process.env.SENDGRID_API_KEY || process.env.SMTP_HOST);
  const hasRealSmsProvider = Boolean(process.env.TERMII_API_KEY || process.env.TWILIO_ACCOUNT_SID);

  let deliveryStatus: NotificationDeliveryRecord['deliveryStatus'] = 'delivered_in_app';
  if (params.channel === 'email') {
    deliveryStatus = store.isDemoMode
      ? 'simulated_demo'
      : hasRealEmailProvider
        ? 'sent'
        : 'provider_unconfigured';
  } else if (params.channel === 'sms' || params.channel === 'whatsapp') {
    deliveryStatus = store.isDemoMode
      ? 'simulated_demo'
      : hasRealSmsProvider
        ? 'sent'
        : 'provider_unconfigured';
  }

  const record: NotificationDeliveryRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    customerId: params.customerId,
    title: params.title,
    message: params.message,
    channel: params.channel,
    recipientAddress: params.recipientAddress,
    deliveryStatus,
    relatedReference: params.relatedReference,
    category: params.category,
    read: false,
    createdAt: new Date().toISOString(),
  };
  store.notificationDeliveries.unshift(record);

  if (params.channel !== 'in_app') {
    store.demoInbox.unshift({
      id: `inbox_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      recipient: params.recipientAddress || params.customerId,
      channel: params.channel,
      subject: params.title,
      body: params.message,
      otpCode: store.isDemoMode ? params.otpCodeForDemoInbox : undefined,
      purpose: params.category,
      status: deliveryStatus === 'sent' ? 'sent' : store.isDemoMode ? 'simulated_demo' : 'provider_unconfigured',
      createdAt: new Date().toISOString(),
    });
    if (store.demoInbox.length > 60) {
      store.demoInbox = store.demoInbox.slice(0, 60);
    }
  }

  return record;
}

export function createApiRouter(): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    const store = getStore();
    res.json({
      ok: true,
      service: 'Swiftvero Express API',
      isDemoMode: store.isDemoMode,
      providerIntegration: {
        email: Boolean(process.env.SENDGRID_API_KEY || process.env.SMTP_HOST) ? 'configured' : 'demo_simulated',
        sms: Boolean(process.env.TERMII_API_KEY || process.env.TWILIO_ACCOUNT_SID) ? 'configured' : 'demo_simulated',
        paystack: Boolean(process.env.PAYSTACK_SECRET_KEY) ? 'configured' : 'demo_simulated',
        dhl: Boolean(process.env.DHL_API_KEY) ? 'configured' : 'demo_simulated',
      },
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/bootstrap', (_req: Request, res: Response) => {
    const store = getStore();
    res.json({
      isDemoMode: store.isDemoMode,
      branches: store.branches,
      shipments: store.shipments,
      bookingGroups: store.bookingGroups,
      pickupJobs: store.pickupJobs,
      quotes: store.quotes,
      quoteEnquiries: store.quoteEnquiries,
      paymentAdjustments: store.paymentAdjustments,
      payments: store.payments,
      notificationDeliveries: store.notificationDeliveries,
      notificationPreferences: store.notificationPreferences,
      protectionConfig: store.protectionConfig,
      cashbackConfig: store.cashbackConfig,
      promoCampaigns: store.promoCampaigns,
      draftGroups: store.draftGroups,
      customers: Object.fromEntries(
        Object.entries(store.customers).map(([k, v]) => [k, sanitizeCustomer(v)])
      ),
    });
  });

  router.post('/demo/reset', (_req: Request, res: Response) => {
    const fresh = resetStore();
    res.json({ ok: true, message: 'Demo environment reset to baseline fixtures.', timestamp: new Date().toISOString(), counts: { shipments: fresh.shipments.length, quotes: fresh.quotes.length } });
  });

  router.get('/demo/messaging-inbox', (req: Request, res: Response) => {
    const store = getStore();
    if (!store.isDemoMode) {
      res.status(403).json({ error: 'Simulator inbox is only available in Demo Mode.' });
      return;
    }
    const target = typeof req.query.target === 'string' ? req.query.target.trim().toLowerCase() : '';
    const items = target
      ? store.demoInbox.filter((m) => m.recipient.toLowerCase().includes(target))
      : store.demoInbox;
    res.json({ items: items.slice(0, 25) });
  });

  // ------------------------------------------------------------------
  // CUSTOMER AUTHENTICATION & REGISTRATION
  // ------------------------------------------------------------------
  router.post('/auth/register', (req: Request, res: Response) => {
    const store = getStore();
    const { name, email, phone, password, customerType = 'individual', companyName } = req.body || {};

    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: 'Full name, email, phone number, and password are required.' });
      return;
    }
    if (String(password).length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();
    const existingCred = store.credentials.find(
      (c) => c.email.toLowerCase() === normalizedEmail || c.phone.replace(/\s+/g, '') === normalizedPhone.replace(/\s+/g, '')
    );
    if (existingCred) {
      res.status(409).json({
        error: 'An account with this email or phone number already exists. Please sign in to access your quotes and shipments.',
        code: 'ACCOUNT_EXISTS',
      });
      return;
    }

    const customerId = `cust_${Date.now().toString(36)}`;
    const walletCode = Math.floor(1000 + Math.random() * 9000);
    const firstWord = String(name).trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'USER';
    const profile: CustomerProfile = {
      id: customerId,
      name: String(name).trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      customerType: customerType === 'business' ? 'business' : 'individual',
      companyName: companyName ? String(companyName).trim() : undefined,
      kycStatus: 'not_started',
      walletId: `SWV-WAL-${walletCode}`,
      walletBalance: 0,
      walletStatus: 'active',
      cashbackBalance: 0,
      earnedCashbackNgn: 0,
      earnedReferralBonusNgn: 0,
      promotionalRewardsNgn: 0,
      referralCode: `SWV-${firstWord}${new Date().getUTCFullYear().toString().slice(-2)}`,
      referralsCount: 0,
      termsAcceptedAt: new Date().toISOString(),
      isDemo: store.isDemoMode,
    };

    store.customers[customerId] = profile;
    store.credentials.push({
      customerId,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: hashPassword(String(password)),
      verifiedEmail: true,
      verifiedPhone: false,
      createdAt: new Date().toISOString(),
    });
    store.notificationPreferences[customerId] = {
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: false,
      inAppEnabled: true,
    };

    const token = crypto.randomBytes(24).toString('hex');
    store.sessions[token] = {
      token,
      customerId,
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    recordNotification(store, {
      customerId,
      title: 'Welcome to Swiftvero Express',
      message: `Your customer account (${profile.walletId}) is active. Any saved quotes or shipments can now be managed directly from your portal.`,
      channel: 'email',
      recipientAddress: normalizedEmail,
      category: 'account',
    });

    saveStore(store);
    res.status(201).json({ token, customer: sanitizeCustomer(profile) });
  });

  router.post('/auth/login', (req: Request, res: Response) => {
    const store = getStore();
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cred = store.credentials.find((c) => c.email.toLowerCase() === normalizedEmail);
    if (!cred || !verifyPassword(String(password), cred.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const customer = Object.values(store.customers).find((c) => c.id === cred.customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer profile could not be found.' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    store.sessions[token] = {
      token,
      customerId: customer.id,
      email: customer.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    saveStore(store);

    res.json({ token, customer: sanitizeCustomer(customer) });
  });

  router.post('/auth/logout', (req: Request, res: Response) => {
    const store = getStore();
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token && store.sessions[token]) {
      delete store.sessions[token];
      saveStore(store);
    }
    res.json({ ok: true });
  });

  router.get('/auth/me', (req: Request, res: Response) => {
    const store = getStore();
    const customer = getAuthenticatedCustomer(req, store);
    if (!customer) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    res.json({ customer: sanitizeCustomer(customer) });
  });

  // ------------------------------------------------------------------
  // PUBLIC QUOTATIONS, MANUAL ENQUIRIES & RETRIEVAL / RECOVERY
  // ------------------------------------------------------------------
  router.post('/quotes', (req: Request, res: Response) => {
    const store = getStore();
    const body = req.body || {};
    const authCustomer = getAuthenticatedCustomer(req, store);
    const existing = getAllExistingCodes(store);
    const quoteReference = generateQuoteReference(existing);

    const originCountry = body.originCountry || 'Nigeria';
    const originCity = body.originCity || 'Lagos';
    const destinationCountry = body.destinationCountry || 'United Kingdom';
    const destinationCity = body.destinationCity || 'London';
    const weightKg = Math.max(0.5, Number(body.estimatedWeightKg || body.weightKg) || 1);
    const dimensions = body.dimensionsCm || body.dimensions || { length: 30, width: 20, height: 15 };
    const serviceTier = body.serviceTier === 'priority' ? 'priority' : 'standard';

    const quote = body.quote && typeof body.quote.totalAmount === 'number'
      ? body.quote
      : generateQuoteBreakdown({
          destinationCountry,
          actualWeightKg: weightKg,
          lengthCm: Number(dimensions.length) || 30,
          widthCm: Number(dimensions.width) || 20,
          heightCm: Number(dimensions.height) || 15,
          tier: serviceTier,
          direction: body.direction === 'import' ? 'import' : 'export',
        });

    const record: QuoteRecord = {
      id: `qrec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      quoteRef: quoteReference,
      quoteReference,
      type: 'instant_estimate',
      customerId: authCustomer?.id || body.customerId || undefined,
      contactName: body.customerName || authCustomer?.name || 'Guest Customer',
      contactEmail: body.customerEmail || authCustomer?.email || undefined,
      contactPhone: body.customerPhone || authCustomer?.phone || undefined,
      customerName: body.customerName || authCustomer?.name || undefined,
      customerEmail: body.customerEmail || authCustomer?.email || undefined,
      customerPhone: body.customerPhone || authCustomer?.phone || undefined,
      direction: body.direction === 'import' ? 'import' : 'export',
      originCountry,
      originCity,
      destinationCountry,
      destinationCity,
      packageCategory: body.packageCategory || 'General Cargo',
      contentsSummary: body.contentsSummary || body.packageDescription || 'International parcel estimate',
      estimatedWeightKg: weightKg,
      dimensionsCm: dimensions,
      serviceTier,
      isFragile: Boolean(body.isFragile),
      fragileNotes: body.fragileNotes ? String(body.fragileNotes) : undefined,
      items: [],
      totalEstimatedNgn: quote.totalAmount,
      quote,
      status: 'saved',
      createdAt: new Date().toISOString(),
      expiresAt: quote.expiresAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      isDemo: store.isDemoMode,
    };

    store.quotes.unshift(record);

    if (record.customerEmail) {
      recordNotification(store, {
        customerId: record.customerId || 'guest',
        title: `Saved Quote Reference: ${quoteReference}`,
        message: `Your Swiftvero estimate from ${originCity}, ${originCountry} to ${destinationCity}, ${destinationCountry} (${weightKg}kg) is ₦${Number(quote.totalAmount).toLocaleString()}. Use ${quoteReference} on Retrieve a Quote anytime before ${new Date(record.expiresAt).toLocaleDateString()}.`,
        channel: 'email',
        recipientAddress: record.customerEmail,
        relatedReference: quoteReference,
        category: 'quote',
      });
    }

    saveStore(store);
    res.status(201).json({ quote: record });
  });

  router.post('/quotes/enquiry', (req: Request, res: Response) => {
    const store = getStore();
    const body = req.body || {};
    if (!body.customerName || (!body.customerEmail && !body.customerPhone) || !body.destinationCountry) {
      res.status(400).json({ error: 'Customer name, contact email or phone, and destination are required.' });
      return;
    }

    const existing = getAllExistingCodes(store);
    const quoteReference = generateQuoteReference(existing);

    const enquiry: QuoteEnquiry = {
      id: `qenq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      quoteReference,
      customerId: body.customerId || undefined,
      customerName: String(body.customerName).trim(),
      customerEmail: String(body.customerEmail || '').trim(),
      customerPhone: String(body.customerPhone || '').trim(),
      originCountry: String(body.originCountry || 'Nigeria'),
      originCity: String(body.originCity || 'Lagos'),
      destinationCountry: String(body.destinationCountry),
      destinationCity: String(body.destinationCity || ''),
      packageDescription: String(body.packageDescription || 'Custom consignment'),
      estimatedWeightKg: Number(body.estimatedWeightKg) || 1,
      dimensionsCm: body.dimensionsCm || undefined,
      isFragile: Boolean(body.isFragile),
      notes: body.notes ? String(body.notes) : undefined,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.quoteEnquiries.unshift(enquiry);

    if (enquiry.customerEmail) {
      recordNotification(store, {
        customerId: enquiry.customerId || 'guest',
        title: `Manual Quote Request Received (${quoteReference})`,
        message: `Our Customer Service & Quote Desk received your request for ${enquiry.originCity} to ${enquiry.destinationCountry}. Reference: ${quoteReference}. No booking or payment has been charged.`,
        channel: 'email',
        recipientAddress: enquiry.customerEmail,
        relatedReference: quoteReference,
        category: 'quote',
      });
    }

    saveStore(store);
    res.status(201).json({ enquiry });
  });

  router.post('/quotes/:ref/price', (req: Request, res: Response) => {
    const store = getStore();
    const ref = String(req.params.ref || '').trim().toUpperCase();
    const { staffName = 'Customer Service Desk', quotedTotalNgn, notes, serviceTier = 'standard' } = req.body || {};

    const enquiry = store.quoteEnquiries.find((e) => e.quoteReference.toUpperCase() === ref);
    if (!enquiry) {
      res.status(404).json({ error: 'Quote enquiry not found.' });
      return;
    }

    const total = Number(quotedTotalNgn);
    if (!total || total <= 0) {
      res.status(400).json({ error: 'Valid quoted amount in NGN is required.' });
      return;
    }

    const freight = Math.round(total * 0.84);
    const fuel = Math.round(total * 0.08);
    const handling = 4500;
    const subtotal = freight + fuel + handling;
    const vat = Math.max(0, total - subtotal);
    const now = new Date();
    const exp = new Date(now.getTime() + 14 * 86400000);

    const officialQuote = {
      id: `QUO-${ref.slice(-6)}`,
      chargeableWeightKg: enquiry.estimatedWeightKg,
      actualWeightKg: enquiry.estimatedWeightKg,
      volumetricWeightKg: enquiry.estimatedWeightKg,
      serviceTier: serviceTier === 'priority' ? ('priority' as const) : ('standard' as const),
      serviceName: serviceTier === 'priority' ? 'Priority Air Express (Quoted)' : 'Standard Air Courier (Quoted)',
      laneDescription: `Staff-issued custom tariff: ${enquiry.originCountry} → ${enquiry.destinationCountry}`,
      freightCharge: freight,
      jetFuelSurcharge: fuel,
      handlingCharge: handling,
      pickupCharge: 0,
      protectionCharge: 0,
      subtotal,
      vatAmount: vat,
      totalAmount: total,
      transitWindow: serviceTier === 'priority' ? '3 - 5 business days' : '5 - 9 business days',
      estimatedDeliveryDate: exp.toISOString().slice(0, 10),
      estimatedDeliveryDisplay: exp.toDateString(),
      generatedAt: now.toISOString(),
      expiresAt: exp.toISOString(),
    };

    enquiry.status = 'quoted';
    enquiry.quotedTotalNgn = total;
    enquiry.quotedByStaff = String(staffName);
    enquiry.quotedAt = now.toISOString();
    enquiry.updatedAt = now.toISOString();
    if (notes) enquiry.notes = `${enquiry.notes ? `${enquiry.notes} | ` : ''}Staff quote: ${notes}`;

    // Mirror into QuoteRecord so customer can retrieve by QTE code and convert to booking
    const existingRec = store.quotes.find((q) => (q.quoteReference || q.quoteRef).toUpperCase() === ref);
    if (existingRec) {
      existingRec.quote = officialQuote;
      existingRec.totalEstimatedNgn = total;
      existingRec.status = 'manual_quoted';
      existingRec.staffIssuedBy = String(staffName);
      existingRec.staffNotes = notes ? String(notes) : undefined;
      existingRec.expiresAt = exp.toISOString();
    } else {
      store.quotes.unshift({
        id: `qrec_${Date.now()}`,
        quoteRef: enquiry.quoteReference,
        quoteReference: enquiry.quoteReference,
        type: 'manual_enquiry',
        customerId: enquiry.customerId,
        contactName: enquiry.customerName,
        contactEmail: enquiry.customerEmail,
        contactPhone: enquiry.customerPhone,
        customerName: enquiry.customerName,
        customerEmail: enquiry.customerEmail,
        customerPhone: enquiry.customerPhone,
        direction: 'export',
        originCountry: enquiry.originCountry,
        originCity: enquiry.originCity,
        destinationCountry: enquiry.destinationCountry,
        destinationCity: enquiry.destinationCity,
        packageCategory: 'Custom Quote Desk',
        contentsSummary: enquiry.packageDescription,
        estimatedWeightKg: enquiry.estimatedWeightKg,
        dimensionsCm: enquiry.dimensionsCm,
        serviceTier: officialQuote.serviceTier,
        isFragile: enquiry.isFragile,
        items: [],
        totalEstimatedNgn: total,
        quote: officialQuote,
        status: 'manual_quoted',
        staffIssuedBy: String(staffName),
        staffNotes: notes ? String(notes) : undefined,
        createdAt: enquiry.createdAt,
        expiresAt: exp.toISOString(),
        isDemo: store.isDemoMode,
      });
    }

    if (enquiry.customerEmail) {
      recordNotification(store, {
        customerId: enquiry.customerId || 'guest',
        title: `Official Quote Issued: ${ref}`,
        message: `Swiftvero Quote Desk issued a formal price of ₦${total.toLocaleString()} for ${enquiry.originCity} → ${enquiry.destinationCountry}. Open Retrieve a Quote with ${ref} to review and book.`,
        channel: 'email',
        recipientAddress: enquiry.customerEmail,
        relatedReference: ref,
        category: 'quote',
      });
    }

    saveStore(store);
    res.json({ enquiry, quote: officialQuote });
  });

  router.post('/quotes/attach', (req: Request, res: Response) => {
    const store = getStore();
    const customer = getAuthenticatedCustomer(req, store);
    const { quoteReference, customerId: bodyCustomerId } = req.body || {};
    const resolvedCustomer = customer || (bodyCustomerId ? Object.values(store.customers).find((c) => c.id === bodyCustomerId) : null);

    if (!resolvedCustomer) {
      res.status(401).json({ error: 'Authentication required to attach quotation.' });
      return;
    }

    const ref = String(quoteReference || '').trim().toUpperCase();
    const rec = store.quotes.find((q) => (q.quoteReference || q.quoteRef).toUpperCase() === ref);
    if (!rec) {
      res.status(404).json({ error: 'Quote reference not found.' });
      return;
    }

    rec.customerId = resolvedCustomer.id;
    rec.customerName = resolvedCustomer.name;
    rec.customerEmail = resolvedCustomer.email;
    rec.customerPhone = resolvedCustomer.phone;
    saveStore(store);

    res.json({ quote: rec });
  });

  // Lookup QTE- or SWV- without leaking private address details before OTP verification
  router.get('/quotes/:ref', (req: Request, res: Response) => {
    const store = getStore();
    const ref = String(req.params.ref || '').trim().toUpperCase();

    const quoteRec = store.quotes.find((q) => (q.quoteReference || q.quoteRef).toUpperCase() === ref);
    if (quoteRec) {
      const masked = maskContactInfo({ email: quoteRec.customerEmail || quoteRec.contactEmail, phone: quoteRec.customerPhone || quoteRec.contactPhone });
      res.json({
        found: true,
        kind: 'quote',
        reference: quoteRec.quoteReference || quoteRec.quoteRef,
        routeSummary: `${quoteRec.originCity}, ${quoteRec.originCountry} → ${quoteRec.destinationCity}, ${quoteRec.destinationCountry}`,
        status: quoteRec.status,
        maskedEmail: masked.maskedEmail,
        maskedPhone: masked.maskedPhone,
        quoteSummary: quoteRec,
      });
      return;
    }

    const enquiry = store.quoteEnquiries.find((e) => e.quoteReference.toUpperCase() === ref);
    if (enquiry) {
      const masked = maskContactInfo({ email: enquiry.customerEmail, phone: enquiry.customerPhone });
      res.json({
        found: true,
        kind: 'enquiry',
        reference: enquiry.quoteReference,
        routeSummary: `${enquiry.originCity}, ${enquiry.originCountry} → ${enquiry.destinationCity || enquiry.destinationCountry}`,
        status: enquiry.status,
        maskedEmail: masked.maskedEmail,
        maskedPhone: masked.maskedPhone,
        enquirySummary: enquiry,
      });
      return;
    }

    const shipment = store.shipments.find((s) => s.trackingNumber.toUpperCase() === ref);
    if (shipment) {
      const masked = maskContactInfo({ email: shipment.customerEmail, phone: shipment.customerPhone });
      res.json({
        found: true,
        kind: 'shipment',
        reference: shipment.trackingNumber,
        routeSummary: `${shipment.originCity}, ${shipment.originCountry} → ${shipment.destinationCity}, ${shipment.destinationCountry}`,
        status: shipment.status,
        maskedEmail: masked.maskedEmail,
        maskedPhone: masked.maskedPhone,
      });
      return;
    }

    res.status(404).json({ found: false, error: `No quote or shipment matched reference ${ref}.` });
  });

  // Request OTP for Quote/Shipment Lookup (NEVER returns OTP code in API response)
  router.post('/quotes/lookup/request-otp', (req: Request, res: Response) => {
    const store = getStore();
    const { reference } = req.body || {};
    const ref = String(reference || '').trim().toUpperCase();
    if (!ref) {
      res.status(400).json({ error: 'Reference code is required.' });
      return;
    }

    const key = `lookup:${ref}`;
    const existing = store.otpChallenges[key];
    const cooldown = canResendOtp(existing);
    if (!cooldown.allowed) {
      res.status(429).json({
        error: `Please wait ${cooldown.waitSeconds}s before requesting a new verification code.`,
        waitSeconds: cooldown.waitSeconds,
      });
      return;
    }

    const qRec = store.quotes.find((q) => (q.quoteReference || q.quoteRef).toUpperCase() === ref);
    const shp = store.shipments.find((s) => s.trackingNumber.toUpperCase() === ref);
    const enq = store.quoteEnquiries.find((e) => e.quoteReference.toUpperCase() === ref);
    const contactEmail = qRec?.customerEmail || shp?.customerEmail || enq?.customerEmail || 'customer@swiftvero-demo.ng';
    const customerId = qRec?.customerId || shp?.customerId || enq?.customerId || 'guest';

    const challenge = createOtpChallenge({
      id: `otp_${Date.now()}`,
      target: ref,
      purpose: 'quote_lookup',
    });
    store.otpChallenges[key] = challenge;

    const notif = recordNotification(store, {
      customerId,
      title: `Verification Code for ${ref}`,
      message: `Your Swiftvero verification code for ${ref} is ${challenge.code}. Valid for 10 minutes.`,
      channel: 'email',
      recipientAddress: contactEmail,
      relatedReference: ref,
      category: 'security',
      otpCodeForDemoInbox: challenge.code,
    });

    saveStore(store);
    res.json({
      sent: true,
      deliveryStatus: notif.deliveryStatus,
      cooldownSeconds: 30,
      expiresInMinutes: 10,
      message: 'A 6-digit verification code has been dispatched to the registered contact.',
    });
  });

  router.post('/quotes/lookup/verify-otp', (req: Request, res: Response) => {
    const store = getStore();
    const { reference, code } = req.body || {};
    const ref = String(reference || '').trim().toUpperCase();
    const key = `lookup:${ref}`;
    const challenge = store.otpChallenges[key];

    const verification = verifyOtpChallenge({ challenge, inputCode: String(code || '') });
    if (verification.updatedChallenge) {
      store.otpChallenges[key] = verification.updatedChallenge;
      saveStore(store);
    }

    if (!verification.success) {
      res.status(400).json({ verified: false, error: verification.error });
      return;
    }

    const quoteRecord = store.quotes.find((q) => (q.quoteReference || q.quoteRef).toUpperCase() === ref) || null;
    const shipment = store.shipments.find((s) => s.trackingNumber.toUpperCase() === ref) || null;
    const enquiry = store.quoteEnquiries.find((e) => e.quoteReference.toUpperCase() === ref) || null;
    const adjustments = shipment
      ? store.paymentAdjustments.filter((a) => a.shipmentId === shipment.id || a.trackingNumber === shipment.trackingNumber)
      : [];

    res.json({
      verified: true,
      quoteRecord,
      shipment,
      enquiry,
      adjustments,
    });
  });

  // Non-enumerating "Didn't receive your reference?" Recovery OTP request
  router.post('/quotes/recover/request-otp', (req: Request, res: Response) => {
    const store = getStore();
    const { contact } = req.body || {};
    const normalizedContact = String(contact || '').trim().toLowerCase();
    if (!normalizedContact || normalizedContact.length < 4) {
      res.status(400).json({ error: 'Please enter a valid email address or phone number.' });
      return;
    }

    const key = `recover:${normalizedContact}`;
    const existing = store.otpChallenges[key];
    const cooldown = canResendOtp(existing);
    if (!cooldown.allowed) {
      res.status(429).json({
        error: `Please wait ${cooldown.waitSeconds}s before requesting another recovery code.`,
        waitSeconds: cooldown.waitSeconds,
      });
      return;
    }

    const cleanPhone = normalizedContact.replace(/\s+/g, '');
    const matchingQuoteExists =
      store.quotes.some(
        (q) =>
          q.customerEmail?.toLowerCase() === normalizedContact ||
          q.customerPhone?.replace(/\s+/g, '').toLowerCase() === cleanPhone
      ) ||
      store.quoteEnquiries.some(
        (e) =>
          e.customerEmail?.toLowerCase() === normalizedContact ||
          e.customerPhone?.replace(/\s+/g, '').toLowerCase() === cleanPhone
      ) ||
      store.shipments.some(
        (s) =>
          s.customerEmail.toLowerCase() === normalizedContact ||
          s.customerPhone.replace(/\s+/g, '').toLowerCase() === cleanPhone
      );

    if (matchingQuoteExists) {
      const challenge = createOtpChallenge({
        id: `otp_rec_${Date.now()}`,
        target: normalizedContact,
        purpose: 'reference_recovery',
      });
      store.otpChallenges[key] = challenge;

      recordNotification(store, {
        customerId: 'recovery',
        title: 'Swiftvero Reference Recovery Code',
        message: `Your one-time recovery code is ${challenge.code}. Enter this code on Retrieve a Quote to view your saved quotation and shipment references. Valid for 10 minutes.`,
        channel: normalizedContact.includes('@') ? 'email' : 'sms',
        recipientAddress: normalizedContact,
        category: 'security',
        otpCodeForDemoInbox: challenge.code,
      });
      saveStore(store);
    }

    // Strict non-enumeration response regardless of whether contact matched!
    res.json({
      accepted: true,
      cooldownSeconds: 30,
      message: 'If matching quotations or bookings exist for that contact, a verification code has been sent.',
    });
  });

  router.post('/quotes/recover/verify-otp', (req: Request, res: Response) => {
    const store = getStore();
    const { contact, code } = req.body || {};
    const normalizedContact = String(contact || '').trim().toLowerCase();
    const cleanPhone = normalizedContact.replace(/\s+/g, '');
    const key = `recover:${normalizedContact}`;
    const challenge = store.otpChallenges[key];

    const verification = verifyOtpChallenge({ challenge, inputCode: String(code || '') });
    if (verification.updatedChallenge) {
      store.otpChallenges[key] = verification.updatedChallenge;
      saveStore(store);
    }

    if (!verification.success) {
      res.status(400).json({ verified: false, error: verification.error });
      return;
    }

    const quotes = store.quotes.filter(
      (q) =>
        q.customerEmail?.toLowerCase() === normalizedContact ||
        q.customerPhone?.replace(/\s+/g, '').toLowerCase() === cleanPhone
    );
    const enquiries = store.quoteEnquiries.filter(
      (e) =>
        e.customerEmail?.toLowerCase() === normalizedContact ||
        e.customerPhone?.replace(/\s+/g, '').toLowerCase() === cleanPhone
    );
    const shipments = store.shipments.filter(
      (s) =>
        s.customerEmail.toLowerCase() === normalizedContact ||
        s.customerPhone.replace(/\s+/g, '').toLowerCase() === cleanPhone
    );

    res.json({
      verified: true,
      references: [
        ...quotes.map((q) => ({
          kind: 'quote',
          reference: q.quoteReference || q.quoteRef,
          route: `${q.originCity}, ${q.originCountry} → ${q.destinationCity}, ${q.destinationCountry}`,
          status: q.status,
          totalAmount: q.quote?.totalAmount || q.totalEstimatedNgn,
          createdAt: q.createdAt,
        })),
        ...enquiries.map((e) => ({
          kind: 'enquiry',
          reference: e.quoteReference,
          route: `${e.originCity}, ${e.originCountry} → ${e.destinationCity || e.destinationCountry}`,
          status: e.status,
          totalAmount: e.quotedTotalNgn || 0,
          createdAt: e.createdAt,
        })),
        ...shipments.map((s) => ({
          kind: 'shipment',
          reference: s.trackingNumber,
          route: `${s.originCity}, ${s.originCountry} → ${s.destinationCity}, ${s.destinationCountry}`,
          status: s.status,
          totalAmount: s.quote.totalAmount,
          createdAt: s.createdAt,
        })),
      ],
    });
  });

  // ------------------------------------------------------------------
  // DRAFT BOOKING GROUPS (SAVE & EXPLICIT DELETE / DISCARD)
  // ------------------------------------------------------------------
  router.get('/drafts', (req: Request, res: Response) => {
    const store = getStore();
    const customerId = String(req.query.customerId || '');
    const list = customerId ? store.draftGroups.filter((d) => d.customerId === customerId) : store.draftGroups;
    res.json({ drafts: list });
  });

  router.post('/drafts', (req: Request, res: Response) => {
    const store = getStore();
    const body = req.body || {};
    if (!body.customerId) {
      res.status(400).json({ error: 'customerId is required to save draft group.' });
      return;
    }
    const id = body.id || `draft_${Date.now()}`;
    const existingIdx = store.draftGroups.findIndex((d) => d.id === id);
    const record = {
      id,
      customerId: String(body.customerId),
      name: String(body.name || 'Untitled Shipment Group'),
      collectionMethod: body.collectionMethod || 'standard_pickup',
      sharedCollectionAddress: String(body.sharedCollectionAddress || ''),
      childParcels: Array.isArray(body.childParcels) ? body.childParcels : [],
      updatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) store.draftGroups[existingIdx] = record;
    else store.draftGroups.unshift(record);
    saveStore(store);
    res.json({ draft: record });
  });

  router.delete('/drafts/:id', (req: Request, res: Response) => {
    const store = getStore();
    const id = String(req.params.id);
    const before = store.draftGroups.length;
    store.draftGroups = store.draftGroups.filter((d) => d.id !== id);
    saveStore(store);
    res.json({ deleted: store.draftGroups.length < before, id });
  });

  // ------------------------------------------------------------------
  // CONFIRMED BOOKING GROUP & SHIPMENT CREATION (AUTH + IDEMPOTENCY + COLLECTION RULES)
  // ------------------------------------------------------------------
  router.post('/bookings', (req: Request, res: Response) => {
    const store = getStore();
    const idemKey = String(req.headers['idempotency-key'] || req.body?.idempotencyKey || '').trim();
    if (idemKey && store.idempotencyKeys[idemKey]) {
      const cached = store.idempotencyKeys[idemKey];
      res.status(cached.statusCode).json(cached.response);
      return;
    }

    const authCustomer = getAuthenticatedCustomer(req, store);
    const body = req.body || {};
    const customer =
      authCustomer ||
      (store.isDemoMode && body.customerId
        ? Object.values(store.customers).find((c) => c.id === body.customerId) || null
        : null);

    if (!customer) {
      res.status(401).json({
        error: 'Authentication required before confirming a shipment booking. Your quotation details remain preserved.',
      });
      return;
    }

    const parcels: Array<Record<string, any>> = Array.isArray(body.shipments) ? body.shipments : [];
    if (parcels.length === 0) {
      res.status(400).json({ error: 'At least one destination shipment parcel is required.' });
      return;
    }

    const collectionMethod: 'standard_pickup' | 'priority_pickup' | 'dropoff' =
      body.collectionMethod === 'priority_pickup'
        ? 'priority_pickup'
        : body.collectionMethod === 'dropoff'
          ? 'dropoff'
          : 'standard_pickup';

    const existing = getAllExistingCodes(store);
    const groupCode = generateBookingGroupReference(existing);
    existing.add(groupCode);
    const groupId = `bg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

    const pickupFeeNgn =
      collectionMethod === 'priority_pickup'
        ? calculatePriorityPickupFee({
            state: body.originState || 'Lagos',
            city: body.originCity || 'Lagos',
            shipmentCount: parcels.length,
            totalEstimatedWeightKg: parcels.reduce((s, p) => s + (Number(p.declaredWeightKg) || 1), 0),
          })
        : 0;

    const dropoffBranch =
      collectionMethod === 'dropoff'
        ? store.branches.find((b) => b.id === body.dropoffBranchId) || store.branches[0]
        : undefined;

    const createdShipments: ShipmentRecord[] = [];
    const createdPickups: PickupJob[] = [];

    parcels.forEach((p, idx) => {
      const trackingNumber = generateShipmentReference(existing);
      existing.add(trackingNumber);
      const shipmentId = `ship_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`;
      const tier: 'standard' | 'priority' = p.selectedTier === 'priority' ? 'priority' : 'standard';

      const protectionCheck = p.insuranceSelected
        ? evaluateInsuranceAvailability({
            config: store.protectionConfig,
            destinationCountry: p.destinationCountry,
            serviceTier: tier,
            declaredValueNgn: Number(p.declaredValueNgn) || 0,
            items: p.items,
          })
        : null;

      if (p.insuranceSelected && protectionCheck && !protectionCheck.available) {
        // Ignore invalid insurance request safely rather than silently mispricing
      }

      const protectionCharge = p.insuranceSelected && protectionCheck?.available
        ? protectionCheck.calculation.calculatedPremiumNgn
        : 0;

      const baseQuote = p.quote && typeof p.quote.totalAmount === 'number'
        ? p.quote
        : generateQuoteBreakdown({
            destinationCountry: p.destinationCountry || 'United Kingdom',
            actualWeightKg: Number(p.declaredWeightKg) || 1,
            lengthCm: Number(p.declaredDimensions?.length) || 30,
            widthCm: Number(p.declaredDimensions?.width) || 20,
            heightCm: Number(p.declaredDimensions?.height) || 15,
            tier,
            direction: p.direction === 'import' ? 'import' : 'export',
            protectionCharge,
            protectionPlan: protectionCharge > 0 ? 'premium' : 'basic',
            protectionCoverageNgn: protectionCheck?.available ? protectionCheck.calculation.coverageLimitNgn : store.protectionConfig.basicLiabilityLimitNgn,
          });

      const isPickup = collectionMethod === 'standard_pickup' || collectionMethod === 'priority_pickup';

      const shipment: ShipmentRecord = {
        id: shipmentId,
        trackingNumber,
        bookingGroupId: groupId,
        bookingGroupCode: groupCode,
        quoteReference: p.quoteReference || body.quoteReference || undefined,
        direction: p.direction === 'import' ? 'import' : 'export',
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        senderName: String(body.senderName || customer.name),
        senderPhone: String(body.senderPhone || customer.phone),
        senderAddress: String(body.sharedCollectionAddress || body.senderAddress || 'Lagos, Nigeria'),
        originCountry: String(p.originCountry || 'Nigeria'),
        originCity: String(p.originCity || 'Lagos'),
        recipientName: String(p.recipientName || 'Recipient'),
        recipientPhone: String(p.recipientPhone || ''),
        recipientAddress: String(p.recipientAddress || ''),
        destinationCountry: String(p.destinationCountry || 'United Kingdom'),
        destinationCity: String(p.destinationCity || 'London'),
        contentsDescription: String(p.contentsDescription || 'International consignment'),
        items: Array.isArray(p.items) ? p.items : [],
        isFragile: Boolean(p.isFragile),
        fragileNotes: p.fragileNotes ? String(p.fragileNotes) : undefined,
        declaredWeightKg: Number(p.declaredWeightKg) || 1,
        declaredDimensions: p.declaredDimensions || { length: 30, width: 20, height: 15 },
        pickupScheduledDate: body.scheduledDate || new Date().toISOString().slice(0, 10),
        pickupScheduledSlot:
          collectionMethod === 'priority_pickup'
            ? 'Priority 1 – 6 hour window'
            : collectionMethod === 'standard_pickup'
              ? String(body.scheduledSlot || 'Within 24h standard window')
              : 'Branch Drop-Off Counter Intake',
        pickupAddress:
          collectionMethod === 'dropoff'
            ? dropoffBranch?.address || 'Swiftvero Branch Hub'
            : String(body.sharedCollectionAddress || body.senderAddress || 'Lagos, Nigeria'),
        pickupType: collectionMethod === 'dropoff' ? 'branch_dropoff' : 'doorstep',
        collectionMethod,
        priorityCollectionWindow: collectionMethod === 'priority_pickup' ? '1 – 6 hours (subject to location & agent availability)' : undefined,
        collectionFeeNgn: idx === 0 ? pickupFeeNgn : 0,
        dropoffBranchId: dropoffBranch?.id,
        dropoffBranchName: dropoffBranch?.name,
        pickupStatus: collectionMethod === 'dropoff' ? 'awaiting_dropoff' : 'pickup_scheduled',
        pickupStatusLabel:
          collectionMethod === 'dropoff'
            ? `Awaiting Drop-off at ${dropoffBranch?.name || 'Swiftvero Hub'}`
            : collectionMethod === 'priority_pickup'
              ? 'Priority Pickup Requested'
              : 'Standard Pickup Scheduled',
        status: collectionMethod === 'dropoff' ? 'awaiting_dropoff' : 'pickup_scheduled',
        selectedTier: tier,
        estimatedDeliveryDisplay: baseQuote.estimatedDeliveryDisplay,
        quote: baseQuote,
        quoteVersions: [
          {
            version: 1,
            quote: baseQuote,
            measuredWeightKg: Number(p.declaredWeightKg) || 1,
            measuredDimensions: p.declaredDimensions || { length: 30, width: 20, height: 15 },
            changedBy: 'Booking Estimate (Customer Declared)',
            reason: 'Initial pre-weighing booking estimate',
            status: 'active',
            createdAt: new Date().toISOString(),
          },
        ],
        paymentStatus: 'unpaid',
        protectionSelected: Boolean(p.insuranceSelected && protectionCheck?.available),
        protectionPlan: p.insuranceSelected && protectionCheck?.available ? 'premium' : 'basic',
        protectionPremiumNgn: protectionCharge,
        protectionCoverageLimitNgn:
          p.insuranceSelected && protectionCheck?.available
            ? protectionCheck.calculation.coverageLimitNgn
            : store.protectionConfig.basicLiabilityLimitNgn,
        trackingEvents: [
          {
            id: `evt_${Date.now()}_${idx}`,
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            stage: collectionMethod === 'dropoff' ? 'Booking Confirmed — Awaiting Branch Drop-Off' : 'Booking Confirmed — Collection Scheduled',
            location: `${p.originCity || 'Lagos'}, Nigeria`,
            description:
              collectionMethod === 'dropoff'
                ? `Booking ${groupCode} / ${trackingNumber} registered for branch counter intake at ${dropoffBranch?.name || 'Swiftvero Hub'}.`
                : `Booking ${groupCode} / ${trackingNumber} registered (${collectionMethod === 'priority_pickup' ? 'Priority 1-6h' : 'Standard 24h'} pickup).`,
          },
        ],
        lastUpdateTimestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        customerAcknowledgedTerms: true,
        customerAcknowledgedDeclaration: true,
        kycRequiredAtBooking: (Number(p.declaredValueNgn) || 0) >= 250000,
        kycRequired: (Number(p.declaredValueNgn) || 0) >= 250000,
        cashbackEarned: 0,
        cashbackStatus: 'none',
        hasReview: false,
        isDemo: store.isDemoMode,
        createdAt: new Date().toISOString(),
      };

      createdShipments.push(shipment);
      store.shipments.unshift(shipment);

      // Update quote record if converted
      if (shipment.quoteReference) {
        const qRec = store.quotes.find((q) => (q.quoteReference || q.quoteRef).toUpperCase() === shipment.quoteReference!.toUpperCase());
        if (qRec) {
          qRec.status = 'converted_to_booking';
          qRec.customerId = customer.id;
          qRec.convertedShipmentId = shipment.id;
          qRec.convertedTrackingNumber = shipment.trackingNumber;
        }
      }

      // CRITICAL RULE: Only create PickupJob for standard_pickup or priority_pickup — NEVER for dropoff!
      if (isPickup) {
        const pickupCode = generatePickupReference(existing);
        existing.add(pickupCode);
        const job: PickupJob = {
          id: `job_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
          pickupReference: pickupCode,
          pickupCode,
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          senderName: shipment.senderName,
          senderPhone: shipment.senderPhone,
          senderAddress: shipment.pickupAddress || shipment.senderAddress,
          customerName: shipment.senderName,
          customerPhone: shipment.senderPhone,
          address: shipment.pickupAddress,
          scheduledDate: shipment.pickupScheduledDate || new Date().toISOString().slice(0, 10),
          scheduledSlot: shipment.pickupScheduledSlot || 'Standard 24h',
          declaredWeightKg: shipment.declaredWeightKg,
          declaredDimensions: shipment.declaredDimensions || { length: 30, width: 20, height: 15 },
          collectionMethod,
          isFragile: shipment.isFragile,
          fragileNotes: shipment.fragileNotes,
          status: 'scheduled',
          branchId: 'branch_ikeja',
          notes: `Booking Group ${groupCode}${shipment.isFragile ? ' · FRAGILE HANDLING REQUIRED' : ''}`,
        };
        createdPickups.push(job);
        store.pickupJobs.unshift(job);
      }
    });

    const bookingGroup: BookingGroup = {
      id: groupId,
      groupCode,
      customerId: customer.id,
      senderName: String(body.senderName || customer.name),
      senderPhone: String(body.senderPhone || customer.phone),
      senderEmail: String(body.senderEmail || customer.email),
      sharedCollectionAddress: String(body.sharedCollectionAddress || dropoffBranch?.address || 'Lagos, Nigeria'),
      collectionArrangement: body.collectionArrangement || 'shared',
      collectionMethod,
      scheduledDate: body.scheduledDate || new Date().toISOString().slice(0, 10),
      scheduledSlot:
        collectionMethod === 'priority_pickup'
          ? 'Priority 1 – 6 hour window'
          : collectionMethod === 'dropoff'
            ? 'Branch Counter Drop-Off'
            : String(body.scheduledSlot || 'Standard 24h'),
      dropoffBranchId: dropoffBranch?.id,
      pickupFeeNgn,
      shipmentIds: createdShipments.map((s) => s.id),
      status: 'unpaid',
      createdAt: new Date().toISOString(),
      isDemo: store.isDemoMode,
    };

    store.bookingGroups.unshift(bookingGroup);

    if (body.draftGroupId) {
      store.draftGroups = store.draftGroups.filter((d) => d.id !== body.draftGroupId);
    }

    recordNotification(store, {
      customerId: customer.id,
      title: `Booking Confirmed: ${groupCode}`,
      message: `Created ${createdShipments.length} shipment(s) (${createdShipments.map((s) => s.trackingNumber).join(', ')}). Collection mode: ${collectionMethod.replace('_', ' ')}.`,
      channel: 'email',
      recipientAddress: customer.email,
      relatedReference: groupCode,
      category: 'booking',
    });

    saveStore(store);

    const payload = {
      bookingGroup,
      shipments: createdShipments,
      pickupJobs: createdPickups,
    };

    if (idemKey) {
      store.idempotencyKeys[idemKey] = {
        createdAt: new Date().toISOString(),
        statusCode: 201,
        response: payload,
      };
      saveStore(store);
    }

    res.status(201).json(payload);
  });

  // ------------------------------------------------------------------
  // ARCHIVE DELIVERED & CANCEL UNDISPATCHED SHIPMENT
  // ------------------------------------------------------------------
  router.post('/shipments/:id/archive', (req: Request, res: Response) => {
    const store = getStore();
    const shipment = store.shipments.find((s) => s.id === req.params.id || s.trackingNumber === req.params.id);
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found.' });
      return;
    }
    if (shipment.status !== 'delivered' && shipment.status !== 'cancelled') {
      res.status(400).json({ error: 'Only delivered or cancelled shipments can be archived.' });
      return;
    }
    shipment.archivedByCustomer = true;
    saveStore(store);
    res.json({ shipment });
  });

  router.post('/shipments/:id/cancel', (req: Request, res: Response) => {
    const store = getStore();
    const shipment = store.shipments.find((s) => s.id === req.params.id || s.trackingNumber === req.params.id);
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found.' });
      return;
    }
    if (['dispatched', 'in_transit', 'delivered', 'dhl_handed_over'].includes(shipment.status)) {
      res.status(400).json({ error: 'Shipments already dispatched to international transit cannot be cancelled directly.' });
      return;
    }
    shipment.status = 'cancelled';
    shipment.pickupStatus = 'cancelled';
    shipment.pickupStatusLabel = 'Cancelled by Customer';
    store.pickupJobs = store.pickupJobs.map((j) =>
      j.shipmentId === shipment.id ? { ...j, status: 'failed_attempt', notes: 'Booking cancelled by customer before collection.' } : j
    );
    saveStore(store);
    res.json({ shipment });
  });

  // ------------------------------------------------------------------
  // PICKUP DISPATCH & STAFF AVAILABILITY VALIDATION
  // ------------------------------------------------------------------
  router.post('/pickups/:id/assign', (req: Request, res: Response) => {
    const store = getStore();
    const job = store.pickupJobs.find((j) => j.id === req.params.id || j.pickupCode === req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Pickup job not found.' });
      return;
    }

    const { agentId } = req.body || {};
    const agent = store.staffMembers.find((s) => s.id === agentId || s.staffId === agentId);
    if (!agent) {
      res.status(404).json({ error: 'Selected courier agent account not found.' });
      return;
    }
    if (agent.status !== 'active') {
      res.status(400).json({
        error: `Cannot assign pickup job to ${agent.name} because their staff account is ${agent.status}. Please select an active available courier.`,
      });
      return;
    }
    if (agent.role !== 'pickup_agent' && agent.role !== 'operations') {
      res.status(400).json({
        error: `${agent.name} (${agent.role}) is not authorized for field courier pickup dispatch.`,
      });
      return;
    }

    job.assignedAgentId = agent.id;
    job.assignedAgentName = agent.name;
    job.status = 'assigned';

    const shp = store.shipments.find((s) => s.id === job.shipmentId);
    if (shp) {
      shp.assignedAgentName = agent.name;
      shp.pickupStatus = 'driver_assigned';
      shp.pickupStatusLabel = `Driver Assigned (${agent.name})`;
      recordNotification(store, {
        customerId: shp.customerId,
        title: `Pickup Agent Assigned (${shp.trackingNumber})`,
        message: `${agent.name} has been assigned to collect your shipment at ${shp.pickupAddress}.`,
        channel: 'sms',
        recipientAddress: shp.senderPhone,
        relatedReference: shp.trackingNumber,
        category: 'pickup',
      });
    }

    saveStore(store);
    res.json({ job });
  });

  // ------------------------------------------------------------------
  // FACILITY SCALE WEIGHING + HIGHER/LOWER WEIGHT PAYMENT ADJUSTMENTS
  // ------------------------------------------------------------------
  router.post('/pickups/:id/weigh', (req: Request, res: Response) => {
    const store = getStore();
    const {
      measuredWeightKg,
      measuredDimensions = { length: 35, width: 25, height: 20 },
      staffName = 'Hub Scale Inspector',
      reason = 'Physical facility scale & dimensional intake verification',
    } = req.body || {};

    const weight = Number(measuredWeightKg);
    if (!weight || weight <= 0) {
      res.status(400).json({ error: 'Measured scale weight in kg must be greater than zero.' });
      return;
    }

    const shipment = store.shipments.find(
      (s) => s.id === req.params.id || s.trackingNumber === req.params.id
    );
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found.' });
      return;
    }

    const revisedQuote = recalculateVerifiedQuote(
      shipment.quote,
      shipment.destinationCountry,
      weight,
      Number(measuredDimensions.length) || 35,
      Number(measuredDimensions.width) || 25,
      Number(measuredDimensions.height) || 20
    );

    const nextVersions = createQuoteRevision({
      currentVersions: shipment.quoteVersions || [
        {
          version: 1,
          quote: shipment.quote,
          measuredWeightKg: shipment.declaredWeightKg,
          measuredDimensions: shipment.declaredDimensions,
          changedBy: 'Booking Estimate',
          reason: 'Initial declared quote',
          status: 'active',
          createdAt: shipment.createdAt,
        },
      ],
      newQuote: revisedQuote,
      measuredWeightKg: weight,
      measuredDimensions,
      changedBy: String(staffName),
      reason: String(reason),
    });

    shipment.verifiedWeightKg = weight;
    shipment.verifiedDimensions = measuredDimensions;
    shipment.quoteVersions = nextVersions;
    shipment.quote = revisedQuote;

    let adjustment: PaymentAdjustmentRecord | null = null;
    const paidAlready = shipment.paymentStatus === 'paid'
      ? (shipment.originalPaidAmountNgn ?? revisedQuote.previousTotal ?? shipment.quote.totalAmount)
      : 0;

    if (shipment.paymentStatus === 'paid') {
      const originalPaid = shipment.originalPaidAmountNgn || nextVersions[0]?.quote.totalAmount || 0;
      shipment.originalPaidAmountNgn = originalPaid;
      const calc = calculatePaymentAdjustment({
        alreadyPaidNgn: originalPaid,
        revisedTotalNgn: revisedQuote.totalAmount,
      });

      if (calc.adjustmentType !== 'no_change') {
        const existingCodes = getAllExistingCodes(store);
        const adjustmentCode = generateAdjustmentReference(existingCodes);
        const newAdjustment: PaymentAdjustmentRecord = {
          id: `adj_${Date.now()}`,
          adjustmentRef: adjustmentCode,
          adjustmentReference: adjustmentCode,
          adjustmentCode,
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          customerId: shipment.customerId,
          originalAmountPaidNgn: originalPaid,
          previousAmountNgn: originalPaid,
          revisedAmountNgn: revisedQuote.totalAmount,
          differenceNgn: calc.deltaNgn,
          deltaNgn: calc.deltaNgn,
          adjustmentType: calc.adjustmentType,
          reason: `${reason} (Verified ${weight}kg vs declared ${shipment.declaredWeightKg}kg)`,
          status: calc.deltaNgn > 0 ? 'pending_customer_approval' : 'refund_pending',
          requiresExplicitCheckout: calc.deltaNgn > 0,
          createdByStaffName: String(staffName),
          createdAt: new Date().toISOString(),
          isDemo: store.isDemoMode,
        };
        adjustment = newAdjustment;
        store.paymentAdjustments.unshift(newAdjustment);
        shipment.adjustmentBalanceDueNgn = calc.additionalBalanceDueNgn;
        shipment.adjustmentRefundNgn = calc.refundDueNgn;
        shipment.status = calc.deltaNgn > 0 ? 'pending_reweigh_approval' : 'at_facility';
      } else {
        shipment.adjustmentBalanceDueNgn = 0;
        shipment.adjustmentRefundNgn = 0;
        shipment.status = 'at_facility';
      }
    } else {
      shipment.status = 'quote_ready';
    }

    const latestVersionNumber = nextVersions[nextVersions.length - 1]?.version || 2;
    const adjDelta = adjustment ? (adjustment.deltaNgn ?? adjustment.differenceNgn) : 0;
    const adjCode = adjustment ? (adjustment.adjustmentCode || adjustment.adjustmentRef) : '';
    recordNotification(store, {
      customerId: shipment.customerId,
      title: `Facility Scale Weight Confirmed (${shipment.trackingNumber})`,
      message: adjustment
        ? adjDelta > 0
          ? `Measured weight ${weight}kg adjusted final total to ₦${revisedQuote.totalAmount.toLocaleString()}. Additional balance due: ₦${adjDelta.toLocaleString()} (${adjCode}).`
          : `Measured weight ${weight}kg reduced your shipping total to ₦${revisedQuote.totalAmount.toLocaleString()}. Refund/credit of ₦${Math.abs(adjDelta).toLocaleString()} logged (${adjCode}).`
        : `Scale verification confirmed ${weight}kg (Quote v${latestVersionNumber}: ₦${revisedQuote.totalAmount.toLocaleString()}).`,
      channel: 'email',
      recipientAddress: shipment.customerEmail,
      relatedReference: shipment.trackingNumber,
      category: 'quote',
    });

    void paidAlready;
    saveStore(store);
    res.json({ shipment, adjustment });
  });

  // ------------------------------------------------------------------
  // PAYMENT & ADJUSTMENT SETTLEMENT + WALLET REFUND
  // ------------------------------------------------------------------
  router.post('/payments/settle', (req: Request, res: Response) => {
    const store = getStore();
    const idemKey = String(req.headers['idempotency-key'] || req.body?.idempotencyKey || '').trim();
    if (idemKey && store.idempotencyKeys[idemKey]) {
      const cached = store.idempotencyKeys[idemKey];
      res.status(cached.statusCode).json(cached.response);
      return;
    }

    const { shipmentId, method = 'Paystack Card (Simulated)', outcome = 'success' } = req.body || {};
    const shipment = store.shipments.find(
      (s) => s.id === shipmentId || s.trackingNumber === shipmentId
    );
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found.' });
      return;
    }
    if (shipment.paymentStatus === 'paid') {
      res.status(409).json({ error: 'This shipment is already paid.' });
      return;
    }

    const existing = getAllExistingCodes(store);
    const paymentReference = generatePaymentReference(existing);
    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}`,
      paymentReference,
      customerId: shipment.customerId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      bookingGroupId: shipment.bookingGroupId,
      amountNgn: shipment.quote.totalAmount,
      method: String(method),
      kind: 'initial_booking',
      status: outcome === 'failed' ? 'failed' : outcome === 'pending' ? 'pending' : 'succeeded',
      gatewayMode: process.env.PAYSTACK_SECRET_KEY ? 'live' : 'demo_simulated',
      createdAt: new Date().toISOString(),
    };

    store.payments.unshift(paymentRecord);

    if (paymentRecord.status === 'succeeded') {
      shipment.paymentStatus = 'paid';
      shipment.paymentReference = paymentReference;
      shipment.paymentMethod = String(method);
      shipment.originalPaidAmountNgn = shipment.quote.totalAmount;
      if (shipment.quoteVersions) {
        shipment.quoteVersions = shipment.quoteVersions.map((v) =>
          v.status === 'active' || v.status === 'approved' ? { ...v, status: 'paid' } : v
        );
      }
      recordNotification(store, {
        customerId: shipment.customerId,
        title: `Payment Receipt ${paymentReference}`,
        message: `Received ₦${shipment.quote.totalAmount.toLocaleString()} for ${shipment.trackingNumber}.`,
        channel: 'email',
        recipientAddress: shipment.customerEmail,
        relatedReference: shipment.trackingNumber,
        category: 'payment',
      });
    } else if (paymentRecord.status === 'pending') {
      shipment.paymentStatus = 'pending';
    } else {
      shipment.paymentStatus = 'failed';
    }

    saveStore(store);
    const resp = { payment: paymentRecord, shipment };
    if (idemKey) {
      store.idempotencyKeys[idemKey] = {
        createdAt: new Date().toISOString(),
        statusCode: 200,
        response: resp,
      };
      saveStore(store);
    }
    res.json(resp);
  });

  router.post('/payments/adjustments/:id/settle', (req: Request, res: Response) => {
    const store = getStore();
    const adj = store.paymentAdjustments.find(
      (a) => a.id === req.params.id || a.adjustmentCode === req.params.id
    );
    if (!adj) {
      res.status(404).json({ error: 'Payment adjustment record not found.' });
      return;
    }

    const { action = 'pay_balance', method = 'Paystack Card (Simulated)', resolutionMode = 'wallet_credit' } = req.body || {};
    const shipment = store.shipments.find((s) => s.id === adj.shipmentId);

    const adjDelta = adj.deltaNgn ?? adj.differenceNgn;
    if (adj.adjustmentType === 'additional_charge' && action === 'pay_balance') {
      if (adj.status === 'paid') {
        res.status(409).json({ error: 'This adjustment balance has already been paid.' });
        return;
      }
      const payRef = generatePaymentReference(getAllExistingCodes(store));
      adj.status = 'paid';
      adj.paymentReference = payRef;
      adj.resolvedAt = new Date().toISOString();

      const payRec: PaymentRecord = {
        id: `pay_${Date.now()}`,
        paymentReference: payRef,
        customerId: adj.customerId,
        shipmentId: adj.shipmentId,
        trackingNumber: adj.trackingNumber,
        amountNgn: adjDelta,
        method: String(method),
        kind: 'adjustment_balance',
        status: 'succeeded',
        gatewayMode: process.env.PAYSTACK_SECRET_KEY ? 'live' : 'demo_simulated',
        createdAt: new Date().toISOString(),
      };
      store.payments.unshift(payRec);

      if (shipment) {
        shipment.adjustmentBalanceDueNgn = 0;
        shipment.status = 'at_facility';
        if (shipment.quoteVersions) {
          shipment.quoteVersions = shipment.quoteVersions.map((v) =>
            v.status === 'active' || v.status === 'approved' ? { ...v, status: 'paid' } : v
          );
        }
      }
      saveStore(store);
      res.json({ adjustment: adj, payment: payRec, shipment });
      return;
    }

    if (adj.adjustmentType === 'refund_credit') {
      const refundAmount = Math.abs(adjDelta);
      const refundRef = generatePaymentReference(getAllExistingCodes(store));
      adj.status = resolutionMode === 'gateway_refund' ? 'refunded' : 'credited_to_wallet';
      adj.paymentReference = refundRef;
      adj.resolvedAt = new Date().toISOString();

      const customer = Object.values(store.customers).find((c) => c.id === adj.customerId);
      if (customer && resolutionMode !== 'gateway_refund') {
        customer.walletBalance = (customer.walletBalance || 0) + refundAmount;
      }
      if (shipment) {
        shipment.adjustmentRefundNgn = 0;
      }

      const refundRec: PaymentRecord = {
        id: `pay_${Date.now()}`,
        paymentReference: refundRef,
        customerId: adj.customerId,
        shipmentId: adj.shipmentId,
        trackingNumber: adj.trackingNumber,
        amountNgn: -refundAmount,
        method: resolutionMode === 'gateway_refund' ? 'Gateway Refund (Simulated)' : 'Swiftvero Wallet Credit',
        kind: 'refund_credit',
        status: 'refunded',
        gatewayMode: process.env.PAYSTACK_SECRET_KEY ? 'live' : 'demo_simulated',
        createdAt: new Date().toISOString(),
      };
      store.payments.unshift(refundRec);
      saveStore(store);
      res.json({ adjustment: adj, payment: refundRec, shipment });
      return;
    }

    res.status(400).json({ error: 'Unsupported adjustment settlement action.' });
  });

  // ------------------------------------------------------------------
  // STRICT CARRIER HANDOVER GATE
  // ------------------------------------------------------------------
  router.post('/shipments/:id/carrier-book', (req: Request, res: Response) => {
    const store = getStore();
    const shipment = store.shipments.find(
      (s) => s.id === req.params.id || s.trackingNumber === req.params.id
    );
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found.' });
      return;
    }

    const customer = Object.values(store.customers).find((c) => c.id === shipment.customerId);
    const gate = canHandoverToCarrier({
      shipment,
      adjustments: store.paymentAdjustments,
      kycApproved: customer ? customer.kycStatus === 'verified' : false,
    });

    if (!gate.allowed) {
      res.status(409).json({
        allowed: false,
        blockers: gate.blockers,
        error: gate.reason,
      });
      return;
    }

    const dhlWaybill = `DHL-${Math.floor(1000000000 + Math.random() * 8999999999)}`;
    shipment.dhlBookingId = `dhl_bk_${Date.now()}`;
    shipment.dhlWaybillNumber = dhlWaybill;
    shipment.carrierStatus = 'handed_over_to_dhl';
    shipment.status = 'in_transit';

    saveStore(store);
    res.json({ allowed: true, dhlWaybill, shipment });
  });

  // ------------------------------------------------------------------
  // ADMIN OPTIONAL INSURANCE POLICY & NOTIFICATIONS
  // ------------------------------------------------------------------
  router.post('/admin/protection-config', (req: Request, res: Response) => {
    const store = getStore();
    const updates = req.body || {};
    store.protectionConfig = {
      ...store.protectionConfig,
      ...updates,
      lastUpdatedAt: new Date().toISOString(),
    };
    saveStore(store);
    res.json({ protectionConfig: store.protectionConfig });
  });

  router.post('/notifications/read', (req: Request, res: Response) => {
    const store = getStore();
    const { customerId, notificationId } = req.body || {};
    store.notificationDeliveries = store.notificationDeliveries.map((n) => {
      if (notificationId && n.id === notificationId) return { ...n, read: true };
      if (!notificationId && customerId && n.customerId === customerId) return { ...n, read: true };
      return n;
    });
    saveStore(store);
    res.json({ ok: true });
  });

  return router;
}
