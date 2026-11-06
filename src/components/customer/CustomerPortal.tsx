import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { StatusPill } from '../common/StatusPill';
import { BookingWizard } from '../booking/BookingWizard';
import { TrackingView } from '../tracking/TrackingView';
import { CustomerReviewsView } from '../reviews/CustomerReviewsView';
import { RewardsView } from '../rewards/RewardsView';
import { SupportView } from '../support/SupportView';
import { BusinessPortal } from '../business/BusinessPortal';
import { AddressBookView } from './AddressBookView';
import { ShipmentTemplatesView } from './ShipmentTemplatesView';
import { SupportClaimsView } from './SupportClaimsView';
import { BusinessTeamView } from './BusinessTeamView';
import { CustomerNotificationsView } from './CustomerNotificationsView';
import { ShipmentProtectionSettingsModal } from '../admin/ShipmentProtectionSettingsModal';
import { ProtectionCertificateModal } from '../booking/ProtectionCertificateModal';
import { ShipmentRecord, ProtectionCertificateRecord } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';
import {
  Package,
  Plus,
  Plane,
  Clock,
  Coins,
  ChevronRight,
  ShieldCheck,
  Shield,
  Truck,
  MapPin,
  Calendar,
  AlertTriangle,
  Star,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  Building2,
  BookUser,
  Layers,
  Bell,
  RotateCcw,
  X,
  ArrowRight,
  ArrowUpRight,
  Search,
} from 'lucide-react';

interface CustomerPortalProps {
  onOpenKyc: () => void;
  onOpenPolicy: (key: any) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onOpenKyc,
  onOpenPolicy,
}) => {
  const {
    currentCustomer,
    shipments,
    activeCustomerTab,
    setActiveCustomerTab,
    setSelectedShipmentForTracking,
    setRole,
    travelCarryRequests,
    setActivePublicNav,
    setRepeatShipmentData,
    protectionConfig,
    updateProtectionConfig,
    protectionCertificates,
  } = useDemo();

  const [initialReviewShipmentId, setInitialReviewShipmentId] = useState<string>('');
  const [initialSupportTracking, setInitialSupportTracking] = useState<string>('');
  const [repeatModalShipment, setRepeatModalShipment] = useState<ShipmentRecord | null>(null);
  const [protectionSettingsOpen, setProtectionSettingsOpen] = useState<boolean>(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState<boolean>(false);
  const [selectedCert, setSelectedCert] = useState<ProtectionCertificateRecord | null>(null);

  // Customer's shipments
  const myShipments = shipments.filter((s) => s.customerId === currentCustomer.id);
  const activeShipments = myShipments.filter((s) => s.status !== 'delivered' && s.status !== 'cancelled');
  const deliveredShipments = myShipments.filter((s) => s.status === 'delivered');
  const upcomingPickups = myShipments.filter((s) => s.pickupScheduledDate && s.status !== 'delivered' && s.status !== 'cancelled');

  const handleTrackShipment = (trackingNumber: string) => {
    setSelectedShipmentForTracking(trackingNumber);
    setActiveCustomerTab('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCertificate = (shipment: ShipmentRecord) => {
    const existing = protectionCertificates.find((c) => c.shipmentTrackingNumber === shipment.trackingNumber);
    if (existing) {
      setSelectedCert(existing);
    } else {
      const cert: ProtectionCertificateRecord = {
        id: 'cert_' + shipment.id,
        certificateNumber: shipment.protectionReference || `PROT-2026-${shipment.trackingNumber.slice(-4)}`,
        shipmentTrackingNumber: shipment.trackingNumber,
        customerName: shipment.customerName || currentCustomer.name,
        customerEmail: shipment.customerEmail || currentCustomer.email,
        customerPhone: shipment.customerPhone || currentCustomer.phone,
        declaredValueNgn: shipment.declaredValueNgn || shipment.items?.[0]?.declaredValue || shipment.quote.totalAmount,
        protectionPlan: shipment.protectionPlan || 'basic',
        coverageAmountNgn: shipment.protectionCoverageNgn || (shipment.protectionPlan === 'premium' ? 200000 : 50000),
        premiumPaidNgn: shipment.protectionFeeNgn || 0,
        ratePercentage: 1.5,
        deductibleText: '5% of loss or ₦10,000 minimum',
        termsVersion: 'v2.1 (2026)',
        providerName: shipment.protectionProvider || 'Leadway Assurance Underwriting Alliance',
        bookingDate: shipment.createdAt.slice(0, 10),
        status: 'active',
        itemsCovered: shipment.items || [],
        excludedItems: [],
      };
      setSelectedCert(cert);
    }
    setCertificateModalOpen(true);
  };

  const handleOpenReview = (shipmentId: string) => {
    setInitialReviewShipmentId(shipmentId);
    setActiveCustomerTab('reviews');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSupport = (trackingNumber: string) => {
    setInitialSupportTracking(trackingNumber);
    setActiveCustomerTab('support');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      {/* Top Greeting & Verification Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-[#DCEFF3] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#354B55]">
              {currentCustomer.name}
            </h1>
            {currentCustomer.customerType === 'business' && (
              <span className="text-[11px] font-bold text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                {currentCustomer.companyName || 'Business Shipper'}
              </span>
            )}
          </div>
          <p className="text-xs text-[#6A808C] mt-1">
            Global consignments, certified scale verifications &amp; international tracking
          </p>
        </div>

        {/* Verification Status Pill & Primary Quick Action */}
        <div className="flex items-center gap-3">
          {currentCustomer.kycStatus === 'verified' ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#008EA8] bg-[#CAF0F8]/60 px-3 py-1.5 rounded-full border border-[#90E0EF] font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>Verified Shipper</span>
            </span>
          ) : currentCustomer.kycStatus === 'submitted' ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Verification Pending</span>
            </span>
          ) : (
            <button
              onClick={onOpenKyc}
              className="inline-flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full border border-rose-200 font-semibold transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Verify Identity (KYC)</span>
            </button>
          )}

          <button
            onClick={() => setProtectionSettingsOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-[#008EA8] bg-[#CAF0F8]/50 hover:bg-[#CAF0F8] border border-[#90E0EF] rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
            title="Configure Underwriting & Protection Rules (Admin / Assessor)"
          >
            <Shield className="w-3.5 h-3.5 text-[#00B4D8]" />
            <span className="hidden sm:inline">Protection Rules</span>
          </button>

          <button
            onClick={() => setActiveCustomerTab('book')}
            className="px-4 py-2 text-xs font-bold text-white bg-[#00B4D8] hover:bg-[#009BB8] rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Shipment</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD OVERVIEW VIEW */}
      {activeCustomerTab === 'overview' && (
        <>
          {/* Welcome Area: Soft ice-blue atmospheric treatment */}
          <div className="bg-gradient-to-r from-[#CAF0F8]/50 via-white to-[#F5FBFD] rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B4D8] block">
                Swiftvero Logistics Operations
              </span>
              <h2 className="text-xl sm:text-2xl font-serif-display font-bold text-[#354B55]">
                {activeShipments.length > 0
                  ? `You have ${activeShipments.length} active international consignment${activeShipments.length > 1 ? 's' : ''} in transit.`
                  : 'Ready to arrange international parcel or cargo carriage?'}
              </h2>
              <p className="text-xs text-[#6A808C] leading-relaxed">
                Free doorstep collection anywhere in Lagos with calibrated scale verification, itemized quotations, and milestone tracking to 180+ global destinations.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveCustomerTab('pickups')}
                className="px-4 py-2.5 rounded-xl border border-[#DCEFF3] bg-white hover:bg-[#F5FBFD] text-xs font-semibold text-[#354B55] flex items-center gap-2 transition-colors shadow-2xs"
              >
                <Truck className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Doorstep Collection ({upcomingPickups.length})</span>
              </button>
              <button
                onClick={() => setActiveCustomerTab('book')}
                className="px-4 py-2.5 rounded-xl bg-[#00B4D8] hover:bg-[#009BB8] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <span>Book Shipment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* KPI Overview Cards: 4 Clean, restrained white cards with subtle borders */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveCustomerTab('my_shipments')}
              className="bg-white rounded-2xl border border-[#DCEFF3] p-5 shadow-xs hover:border-[#00B4D8] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[#6A808C] mb-2">
                <span className="text-xs font-semibold">Active In Transit</span>
                <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plane className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif-display font-bold text-[#354B55]">
                {activeShipments.length}
              </div>
              <span className="text-[11px] text-[#00B4D8] font-medium mt-1 flex items-center gap-1">
                <span>View active air freight</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            <div
              onClick={() => setActiveCustomerTab('pickups')}
              className="bg-white rounded-2xl border border-[#DCEFF3] p-5 shadow-xs hover:border-[#00B4D8] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[#6A808C] mb-2">
                <span className="text-xs font-semibold">Doorstep Pickups</span>
                <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif-display font-bold text-[#354B55]">
                {upcomingPickups.length}
              </div>
              <span className="text-[11px] text-[#6A808C] font-medium mt-1 block">
                Free scale collection
              </span>
            </div>

            <div
              onClick={() => setActiveCustomerTab('cashback')}
              className="bg-white rounded-2xl border border-[#DCEFF3] p-5 shadow-xs hover:border-[#00B4D8] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[#6A808C] mb-2">
                <span className="text-xs font-semibold">Shipping Credits</span>
                <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-serif-display font-bold text-[#008EA8]">
                {formatNaira(currentCustomer.cashbackBalance)}
              </div>
              <span className="text-[11px] text-[#6A808C] font-medium mt-1 block">
                Non-withdrawable shipping credits
              </span>
            </div>

            <div
              onClick={() => setActiveCustomerTab('my_shipments')}
              className="bg-white rounded-2xl border border-[#DCEFF3] p-5 shadow-xs hover:border-[#00B4D8] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[#6A808C] mb-2">
                <span className="text-xs font-semibold">Total Consignments</span>
                <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif-display font-bold text-[#354B55]">
                {myShipments.length}
              </div>
              <span className="text-[11px] text-[#6A808C] font-medium mt-1 block">
                {deliveredShipments.length} delivered closure
              </span>
            </div>
          </div>

          {/* Section: Recent Consignments Activity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-base font-serif-display font-bold text-[#354B55]">
                  Recent Consignments
                </h3>
                <p className="text-xs text-[#6A808C]">
                  Live status, verified measurements, and repeat booking options
                </p>
              </div>
              {myShipments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('my_shipments')}
                  className="text-xs font-bold text-[#00B4D8] hover:underline flex items-center gap-1"
                >
                  <span>View All Shipments ({myShipments.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#DCEFF3] divide-y divide-[#DCEFF3] overflow-hidden shadow-xs">
              {myShipments.map((s) => (
                <div
                  key={s.id}
                  className="p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-[#F5FBFD] transition-colors group"
                >
                  {/* Left: Icon + Reference + Destination */}
                  <div
                    onClick={() => handleTrackShipment(s.trackingNumber)}
                    className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0 border border-[#90E0EF]/60">
                      <Plane className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#354B55] group-hover:text-[#00B4D8] transition-colors">
                          {s.trackingNumber}
                        </span>
                        <span className="text-[11px] text-[#6A808C] hidden sm:inline font-medium">
                          · {s.quote.serviceTier === 'priority' ? 'Priority Express' : 'Standard Air'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6A808C] truncate">
                        {s.originCity || 'Lagos'} → {s.destinationCity}, {s.destinationCountry}
                      </p>
                    </div>
                  </div>

                  {/* Right: Semantic Status Pill + Amount + Repeat + View */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="mb-1">
                        <StatusPill status={s.status} isOverdue={s.isUpdateOverdue} />
                      </div>
                      <div className="text-xs font-mono font-bold text-[#354B55]">
                        {formatNaira(s.quote.totalAmount)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRepeatModalShipment(s);
                      }}
                      className="px-2.5 py-1.5 bg-[#CAF0F8]/50 border border-[#90E0EF] text-[#008EA8] rounded-lg text-xs font-bold hover:bg-[#CAF0F8] flex items-center gap-1 transition-colors"
                      title="Repeat this consignment with current pricing checks"
                    >
                      <RotateCcw className="w-3 h-3 text-[#00B4D8]" />
                      <span className="hidden sm:inline">Repeat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTrackShipment(s.trackingNumber)}
                      className="text-[#6A808C] group-hover:text-[#00B4D8] p-1.5 rounded-lg hover:bg-white"
                      title="View live milestone tracking"
                    >
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>
                </div>
              ))}

              {myShipments.length === 0 && (
                <div className="p-8 text-center text-xs text-[#6A808C] space-y-3">
                  <p>You have no international shipments on record yet.</p>
                  <button
                    onClick={() => setActiveCustomerTab('book')}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#00B4D8] rounded-xl hover:bg-[#009BB8]"
                  >
                    Start a New Shipment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section: Operational Quick Actions (Clean, structured list) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6A808C] px-1">
              Account Operations &amp; Tools
            </h3>

            <div className="bg-white rounded-2xl border border-[#DCEFF3] divide-y divide-[#DCEFF3] overflow-hidden shadow-xs">
              <button
                onClick={() => setActiveCustomerTab('tracking')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Track Consignment</span>
                    <span className="text-[11px] text-[#6A808C]">Live milestone tracking and flight status</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveCustomerTab('pickups')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Doorstep Collections</span>
                    <span className="text-[11px] text-[#6A808C]">Free doorstep digital scale verification schedule</span>
                  </div>
                </div>
                <span className="text-xs text-[#6A808C] flex items-center gap-1.5">
                  <span className="font-semibold text-[#354B55]">{upcomingPickups.length} scheduled</span>
                  <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
                </span>
              </button>

              <button
                onClick={() => setActiveCustomerTab('travel_carry')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">
                      SwiftShare Pilot Consignments
                    </span>
                    <span className="text-[11px] text-[#6A808C]">
                      Traveller-assisted express delivery with tamper seals &amp; delivery escrow
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#CAF0F8] text-[#008EA8] font-bold px-2 py-0.5 rounded-full border border-[#90E0EF]">
                    Pilot
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
                </div>
              </button>

              <button
                onClick={() => setActiveCustomerTab('batch')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">
                      Multi-Recipient Batch Consignments
                    </span>
                    <span className="text-[11px] text-[#6A808C]">
                      Enter sender once and dispatch multiple international consignments
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveCustomerTab('cashback')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">My Rewards &amp; Shipping Credits</span>
                    <span className="text-[11px] text-[#6A808C]">Promotional credits to discount future consignments (non-withdrawable)</span>
                  </div>
                </div>
                <span className="text-xs text-[#008EA8] font-bold flex items-center gap-1.5 font-mono">
                  <span>{formatNaira(currentCustomer.cashbackBalance)}</span>
                  <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
                </span>
              </button>

              <button
                onClick={() => setActiveCustomerTab('reviews')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Verified Customer Reviews</span>
                    <span className="text-[11px] text-[#6A808C]">Rate delivered shipments and read company feedback</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveCustomerTab('address_book')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <BookUser className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Saved Address Book</span>
                    <span className="text-[11px] text-[#6A808C]">Manage repeat recipients in the UK, US, Canada, and Europe</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveCustomerTab('templates')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Package Shipment Templates</span>
                    <span className="text-[11px] text-[#6A808C]">Save standard carton sizes, items, and weights for 1-click rebooking</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveCustomerTab('claims')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Claims &amp; Delivery Disputes</span>
                    <span className="text-[11px] text-[#6A808C]">File structured claims for transit delays or package investigations</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveCustomerTab('team')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Business Team &amp; Permissions</span>
                    <span className="text-[11px] text-[#6A808C]">Manage organization staff roles, booking rights, and finance viewing</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveCustomerTab('notifications')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Notifications &amp; Proactive Alert Center</span>
                    <span className="text-[11px] text-[#6A808C]">View milestone logs and manage communication channels</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveCustomerTab('support')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Customer Support &amp; Enquiries</span>
                    <span className="text-[11px] text-[#6A808C]">Open a ticket or contact official WhatsApp desk</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>

              <button
                onClick={() => setActiveCustomerTab('profile')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5FBFD] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#354B55] block">Account Profile &amp; Identity</span>
                    <span className="text-[11px] text-[#6A808C]">Manage consignor details and verification documents</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A808C] group-hover:text-[#00B4D8] transition-colors" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sub-view Header if not on Overview */}
      {activeCustomerTab !== 'overview' && (
        <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
          <button
            onClick={() => setActiveCustomerTab('overview')}
            className="text-xs font-bold text-[#00B4D8] hover:underline flex items-center gap-1.5"
          >
            ← Back to Dashboard Overview
          </button>
          <span className="text-xs font-semibold text-[#6A808C] capitalize">
            {activeCustomerTab.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* 2. My Shipments (Detailed List) */}
      {activeCustomerTab === 'my_shipments' && (
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
            <div>
              <h2 className="text-base font-serif-display font-bold text-[#354B55]">
                All Shipments ({myShipments.length})
              </h2>
              <p className="text-xs text-[#6A808C] mt-0.5">
                Full history of international consignments booked with Swiftvero.
              </p>
            </div>
            <button
              onClick={() => setActiveCustomerTab('book')}
              className="px-4 py-2 bg-[#00B4D8] text-white rounded-xl text-xs font-bold hover:bg-[#009BB8] transition-all shadow-sm"
            >
              New Shipment
            </button>
          </div>

          <div className="divide-y divide-[#DCEFF3] text-xs">
            {myShipments.map((s) => (
              <div key={s.id} className="py-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#354B55]">{s.trackingNumber}</span>
                    <StatusPill status={s.status} isOverdue={s.isUpdateOverdue} />
                  </div>
                  <span className="text-[11px] text-[#6A808C]">Booked: {s.createdAt.slice(0, 10)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[#6A808C] text-[11px]">Destination:</span>
                    <div className="font-semibold text-[#354B55]">{s.destinationCountry} ({s.destinationCity})</div>
                  </div>
                  <div>
                    <span className="text-[#6A808C] text-[11px]">Chargeable Weight:</span>
                    <div className="font-semibold text-[#354B55] font-mono">{s.quote.chargeableWeightKg} kg</div>
                  </div>
                  <div>
                    <span className="text-[#6A808C] text-[11px]">Freight Total:</span>
                    <div className="font-bold text-[#00B4D8] font-mono">{formatNaira(s.quote.totalAmount)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DCEFF3]/70">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        s.protectionPlan === 'premium'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-[#CAF0F8] text-[#008EA8] border-[#90E0EF]'
                      }`}
                    >
                      {s.protectionPlan === 'premium' ? 'Premium Coverage Active' : 'Basic Protection'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenCertificate(s)}
                      className="px-3 py-1.5 border border-[#90E0EF] bg-[#CAF0F8]/50 rounded-lg text-xs font-semibold text-[#008EA8] hover:bg-[#CAF0F8] flex items-center gap-1 transition-colors"
                      title="View & Download Protection Certificate"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00B4D8]" />
                      <span>Certificate</span>
                    </button>
                    <button
                      onClick={() => handleTrackShipment(s.trackingNumber)}
                      className="px-3 py-1.5 border border-[#DCEFF3] rounded-lg text-xs font-semibold text-[#354B55] hover:bg-[#F5FBFD]"
                    >
                      View Tracking
                    </button>
                    <button
                      onClick={() => handleOpenSupport(s.trackingNumber)}
                      className="px-3 py-1.5 border border-[#DCEFF3] rounded-lg text-xs font-semibold text-[#6A808C] hover:bg-[#F5FBFD]"
                    >
                      Support
                    </button>
                    <button
                      onClick={() => setRepeatModalShipment(s)}
                      className="px-3 py-1.5 bg-[#CAF0F8]/50 border border-[#90E0EF] rounded-lg text-xs font-bold text-[#008EA8] hover:bg-[#CAF0F8] flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 text-[#00B4D8]" />
                      <span>Repeat Shipment</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Pickups Tab */}
      {activeCustomerTab === 'pickups' && (
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
            <div>
              <h2 className="text-base font-serif-display font-bold text-[#354B55]">
                Doorstep Pickups
              </h2>
              <p className="text-xs text-[#6A808C] mt-0.5">
                Always free collection (₦0) with calibrated digital scale weighing at your address.
              </p>
            </div>
            <span className="text-xs font-bold text-[#008EA8] bg-[#CAF0F8] px-3 py-1 rounded-full border border-[#90E0EF]">
              Free Doorstep Collection
            </span>
          </div>

          <div className="space-y-4">
            {upcomingPickups.map((s) => (
              <div key={s.id} className="p-4 border border-[#DCEFF3] rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-[#354B55]">{s.trackingNumber}</span>
                  <span className="text-xs text-[#6A808C] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#00B4D8]" />
                    <span>{s.pickupScheduledDate} ({s.pickupScheduledSlot || 'Morning'})</span>
                  </span>
                </div>

                {/* 4-step visible pickup tracker */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] font-bold text-[#008EA8]">
                    1. Requested
                  </div>
                  <div className="p-2 rounded-lg bg-[#CAF0F8] border border-[#90E0EF] font-bold text-[#008EA8]">
                    2. Assigned
                  </div>
                  <div className="p-2 rounded-lg bg-[#F5FBFD] border border-[#DCEFF3] text-[#6A808C]">
                    3. En Route
                  </div>
                  <div className="p-2 rounded-lg bg-[#F5FBFD] border border-[#DCEFF3] text-[#6A808C]">
                    4. Picked Up
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#6A808C] pt-2 border-t border-[#DCEFF3]">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span className="truncate">{s.pickupAddress || s.senderAddress}</span>
                  </div>
                  <button
                    onClick={() => handleTrackShipment(s.trackingNumber)}
                    className="text-[#00B4D8] font-bold hover:underline shrink-0 ml-2"
                  >
                    Track Progress
                  </button>
                </div>
              </div>
            ))}

            {upcomingPickups.length === 0 && (
              <div className="text-center py-8 text-xs text-[#6A808C]">
                No pending doorstep pickups scheduled.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Book Shipment Wizard */}
      {activeCustomerTab === 'book' && (
        <BookingWizard
          onComplete={(trackingNum) => {
            setSelectedShipmentForTracking(trackingNum);
            setActiveCustomerTab('tracking');
          }}
          onOpenPolicy={onOpenPolicy}
          onOpenKyc={onOpenKyc}
        />
      )}

      {/* 5. Tracking View */}
      {activeCustomerTab === 'tracking' && (
        <TrackingView
          onOpenSupportWithShipment={handleOpenSupport}
          onOpenReviewForShipment={handleOpenReview}
        />
      )}

      {/* 5b. Multi-Recipient Batch Consignments View */}
      {(activeCustomerTab === 'batch' || activeCustomerTab === 'commercial') && (
        <div className="space-y-6">
          <BusinessPortal />
        </div>
      )}

      {/* 6. Reviews View */}
      {activeCustomerTab === 'reviews' && (
        <CustomerReviewsView initialShipmentId={initialReviewShipmentId} />
      )}

      {/* 7. Cashback View */}
      {activeCustomerTab === 'cashback' && <RewardsView onOpenPolicy={onOpenPolicy} />}

      {/* 8. Referrals View */}
      {activeCustomerTab === 'referrals' && <RewardsView onOpenPolicy={onOpenPolicy} />}

      {/* 9. Support View */}
      {activeCustomerTab === 'support' && (
        <SupportView initialShipmentTracking={initialSupportTracking} />
      )}

      {/* SwiftShare Pilot Consignments Tab */}
      {activeCustomerTab === 'travel_carry' && (
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCEFF3]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif-display font-bold text-[#354B55]">
                  SwiftShare Pilot Consignments
                </h2>
                <span className="text-[10px] bg-[#CAF0F8] text-[#008EA8] font-bold px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  Pilot Feature
                </span>
              </div>
              <p className="text-xs text-[#6A808C] mt-0.5">
                Peer traveller-assisted delivery with mandatory tamper seals, physical inspection, and delivery escrow payout.
              </p>
            </div>
            <button
              onClick={() => {
                setRole('visitor');
                setActivePublicNav('swift-share');
              }}
              className="px-4 py-2 bg-[#00B4D8] text-white rounded-xl text-xs font-bold hover:bg-[#009BB8] transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book SwiftShare Request</span>
            </button>
          </div>

          <div className="space-y-4">
            {travelCarryRequests.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Plane className="w-8 h-8 text-[#6A808C] mx-auto opacity-50" />
                <p className="text-xs text-[#6A808C]">No SwiftShare requests booked yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#DCEFF3]">
                {travelCarryRequests.map((req) => (
                  <div key={req.id} className="py-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#354B55]">
                          {req.requestReference}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]">
                          {req.category}
                        </span>
                        <span className="text-[11px] font-medium text-[#6A808C]">
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#00B4D8]">
                        Escrow: {formatNaira(req.travellerPayoutNgn)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-[#F5FBFD] p-3 rounded-xl border border-[#DCEFF3]">
                      <div>
                        <span className="text-[#6A808C] text-[11px] block">Route:</span>
                        <span className="font-semibold text-[#354B55]">{req.originCity} → {req.destinationCity}, {req.destinationCountry}</span>
                      </div>
                      <div>
                        <span className="text-[#6A808C] text-[11px] block">Tamper Seal Ref:</span>
                        <span className="font-mono font-bold text-[#354B55]">{req.sealReferenceNumber || 'Pending counter intake'}</span>
                      </div>
                      <div>
                        <span className="text-[#6A808C] text-[11px] block">Traveller Payout Escrow:</span>
                        <span className="font-semibold text-[#354B55]">{formatNaira(req.travellerPayoutNgn)} (held until recipient confirms)</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          setRole('visitor');
                          setActivePublicNav('swift-share');
                        }}
                        className="px-3 py-1.5 border border-[#DCEFF3] rounded-lg text-xs font-semibold text-[#354B55] hover:bg-[#CAF0F8]/50 transition-colors"
                      >
                        Open Pilot Operations Portal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. Profile & Compliance View */}
      {activeCustomerTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs max-w-xl mx-auto space-y-5 text-xs">
          <div className="border-b border-[#DCEFF3] pb-3">
            <h2 className="text-base font-serif-display font-bold text-[#354B55]">
              Account Profile &amp; Verification
            </h2>
            <p className="text-[#6A808C] mt-0.5">
              Consignor details for international export manifests and documentation.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">Legal Name:</span>
              <span className="font-semibold text-[#354B55]">{currentCustomer.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">Email Address:</span>
              <span className="font-semibold text-[#354B55]">{currentCustomer.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">Phone Number:</span>
              <span className="font-semibold text-[#354B55]">{currentCustomer.phone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">Account Type:</span>
              <span className="font-bold text-[#008EA8] capitalize">{currentCustomer.customerType} Account</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">KYC Verification:</span>
              <span className="font-bold capitalize text-[#008EA8]">{currentCustomer.kycStatus}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#DCEFF3]">
              <span className="text-[#6A808C]">Referral Code:</span>
              <span className="font-mono font-bold text-[#00B4D8]">{currentCustomer.referralCode}</span>
            </div>
          </div>

          {/* Statutory Verification & KYC Section */}
          <div className="mt-4 p-4 rounded-xl border border-[#DCEFF3] bg-[#F5FAF6] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#008EA8] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Statutory Identity Verification (KYC)</span>
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                currentCustomer.kycStatus === 'verified'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : currentCustomer.kycStatus === 'failed'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]'
              }`}>
                {currentCustomer.kycStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
              <div>
                <span className="text-slate-500 block text-[11px]">Verification Method</span>
                <span className="font-semibold text-slate-900">
                  {currentCustomer.kycVerificationMethod
                    ? currentCustomer.kycVerificationMethod.toUpperCase()
                    : currentCustomer.kycIdType || 'Government ID'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Masked Identity Reference</span>
                <span className="font-mono font-bold text-slate-900">
                  {currentCustomer.kycMaskedId || '*******8492'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Verification Date</span>
                <span className="text-slate-900">
                  {currentCustomer.kycVerifiedAt?.slice(0, 10) || currentCustomer.kycSubmittedAt?.slice(0, 10) || '2026-09-14'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Re-Verification Status</span>
                <span className="text-emerald-700 font-semibold">Up-to-Date (Valid for NCAA Cargo)</span>
              </div>
            </div>

            {currentCustomer.kycLastResult && (
              <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                Note: {currentCustomer.kycLastResult}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1 border-t border-[#DDEEF2]">
              <button
                type="button"
                onClick={onOpenKyc}
                className="flex-1 py-2 bg-[#00B4D8] hover:bg-[#009BB8] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Update / Re-verify Identity
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`A secure data correction request ticket has been submitted to Swiftvero Compliance Bureau for account ${currentCustomer.id}. A verification officer will review your request.`);
                }}
                className="px-3 py-2 border border-slate-300 hover:bg-white text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Request Profile Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Address Book Tab */}
      {activeCustomerTab === 'address_book' && (
        <AddressBookView
          onSelectAddressForBooking={() => {
            setActiveCustomerTab('book');
          }}
        />
      )}

      {/* 12. Templates Tab */}
      {activeCustomerTab === 'templates' && (
        <ShipmentTemplatesView
          onUseTemplate={() => {
            setActiveCustomerTab('book');
          }}
        />
      )}

      {/* 13. Claims Tab */}
      {activeCustomerTab === 'claims' && <SupportClaimsView />}

      {/* 14. Business Team & Roles Tab */}
      {activeCustomerTab === 'team' && <BusinessTeamView />}

      {/* 15. Notifications Center Tab */}
      {activeCustomerTab === 'notifications' && <CustomerNotificationsView />}

      {/* Repeat Shipment Confirmation Modal */}
      {repeatModalShipment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#DCEFF3] shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#00B4D8]" />
                <h3 className="text-sm font-bold text-[#354B55]">Confirm Repeat Shipment Details</h3>
              </div>
              <button
                onClick={() => setRepeatModalShipment(null)}
                className="p-1 rounded-md text-[#6A808C] hover:text-[#354B55]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#CAF0F8]/50 border border-[#90E0EF] rounded-xl text-[#354B55] text-[11px] leading-relaxed">
              <strong className="text-[#008EA8]">Repeat Booking Safeguard:</strong> Carrier customs regulations require you to verify that recipient contact details, package contents, and declared value remain current before booking.
            </div>

            <div className="bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                <span className="text-[#6A808C]">Original Consignment:</span>
                <span className="font-mono font-bold text-[#354B55]">{repeatModalShipment.trackingNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                <span className="text-[#6A808C]">Destination:</span>
                <span className="font-semibold text-[#354B55]">
                  {repeatModalShipment.destinationCity}, {repeatModalShipment.destinationCountry}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                <span className="text-[#6A808C]">Recipient Name:</span>
                <span className="font-medium text-[#354B55]">{repeatModalShipment.recipientName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                <span className="text-[#6A808C]">Package Category:</span>
                <span className="font-medium capitalize text-[#354B55]">
                  {repeatModalShipment.category || repeatModalShipment.contentsDescription || 'Export Goods'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                <span className="text-[#6A808C]">Chargeable Weight:</span>
                <span className="font-mono font-bold text-[#354B55]">{repeatModalShipment.quote.chargeableWeightKg} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCEFF3]">
                <span className="text-[#6A808C]">Declared Value:</span>
                <span className="font-mono font-bold text-[#00B4D8]">
                  {formatNaira(
                    repeatModalShipment.declaredValueNgn ||
                    repeatModalShipment.items?.[0]?.declaredValue ||
                    repeatModalShipment.quote.totalAmount
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6A808C]">Service Speed:</span>
                <span className="font-semibold text-[#354B55]">
                  {repeatModalShipment.quote.serviceTier === 'priority' ? 'Priority Air Express (2–3 Days)' : 'Standard Air Courier (4–6 Days)'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCEFF3] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRepeatModalShipment(null)}
                className="px-4 py-2 border border-[#DCEFF3] rounded-xl text-[#6A808C] hover:bg-[#F5FBFD]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setRepeatShipmentData(repeatModalShipment);
                  setRepeatModalShipment(null);
                  setActiveCustomerTab('book');
                }}
                className="px-5 py-2 bg-[#00B4D8] text-white rounded-xl font-bold hover:bg-[#009BB8] shadow-sm flex items-center gap-1.5"
              >
                <span>Confirm &amp; Populate Booking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Shipment Protection Settings Modal (Admin / Assessor) */}
      <ShipmentProtectionSettingsModal
        isOpen={protectionSettingsOpen}
        onClose={() => setProtectionSettingsOpen(false)}
        config={protectionConfig}
        onSaveConfig={(updated, reason) => {
          updateProtectionConfig(updated, reason || 'Adjusted protection underwriting configuration via portal');
        }}
      />

      {/* Shipment Protection Certificate Modal */}
      <ProtectionCertificateModal
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        certificate={selectedCert}
      />
    </div>
  );
};
