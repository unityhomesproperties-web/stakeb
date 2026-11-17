import React, { useState, useRef } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Bell,
  MapPin,
  Clock,
  Key,
  Copy,
  Check,
  Smartphone,
  MessageSquare,
  Globe,
  Save,
  ArrowRight,
  Camera,
  Trash2,
  Upload,
  Sun,
  Moon,
  Laptop,
  Sliders,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../common/ThemeToggle';

interface CustomerProfileViewProps {
  onOpenKyc: () => void;
  onOpenAddressBook: () => void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  onOpenKyc,
  onOpenAddressBook,
}) => {
  const { currentCustomer, updateCurrentCustomer } = useDemo();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string>('');

  const [activeSection, setActiveSection] = useState<'details' | 'addresses' | 'kyc' | 'security' | 'notifications' | 'settings'>('details');
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Editable Contact Fields
  const [formData, setFormData] = useState({
    name: currentCustomer.name,
    email: currentCustomer.email,
    phone: currentCustomer.phone,
    whatsApp: currentCustomer.phone,
    preferredAddress: currentCustomer.address || 'Block B4, Admiralty Way, Lekki Phase 1, Lagos',
    city: currentCustomer.country || 'Lagos, Nigeria',
  });

  // Password Management Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    smsPickup: true,
    emailReceipts: true,
    whatsappUpdates: true,
    promoOffers: false,
  });

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(currentCustomer.referralCode);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg('Profile details updated successfully.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg('New passwords do not match. Please verify.');
      return;
    }
    setPasswordMsg('Password changed successfully.');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image file must be under 5MB.');
      return;
    }
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        updateCurrentCustomer({ profilePhotoUrl: dataUrl });
        setSaveSuccessMsg('Profile photo updated.');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateCurrentCustomer({ profilePhotoUrl: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSaveSuccessMsg('Profile photo removed.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Profile Header Banner */}
      <div className="sv-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
        <div className="flex flex-row items-center gap-3.5 sm:gap-4">
          {/* Avatar with Photo & Camera button */}
          <div className="relative group shrink-0">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[12px] bg-[#00B4D8] text-white flex items-center justify-center font-bold text-lg sm:text-2xl shadow-sm overflow-hidden border-2 border-white dark:border-slate-700">
              {currentCustomer.profilePhotoUrl ? (
                <img
                  src={currentCustomer.profilePhotoUrl}
                  alt={currentCustomer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {currentCustomer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-slate-800 text-[#0F172A] dark:text-[#90E0EF] border border-[#90E0EF] dark:border-sky-800 shadow-xs hover:bg-[#CAF0F8] dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Change Profile Photo"
              aria-label="Upload profile photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="sv-h2 dark:text-white">{currentCustomer.name}</h2>
              <span className="text-[11px] font-semibold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/80 border border-[#90E0EF]/60 dark:border-sky-800 px-2.5 py-0.5 rounded-full">
                {currentCustomer.customerType === 'business' ? 'Business Account' : 'Individual Account'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentCustomer.email} &bull; {currentCustomer.phone}</p>

            {/* Photo Action Links */}
            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#00B4D8] hover:underline font-semibold flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>{currentCustomer.profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
              {currentCustomer.profilePhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-rose-600 hover:underline font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {photoError && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{photoError}</p>
            )}

            <div className="flex items-center gap-2 mt-2">
              {currentCustomer.kycStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Identity
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenKyc}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Verify Identity (Required)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className="bg-[#CAF0F8] dark:bg-slate-800/90 p-3.5 rounded-[12px] border border-[#90E0EF] dark:border-slate-700 flex flex-col justify-between sm:w-60">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#0F172A] dark:text-slate-300 block">Your Referral Code</span>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <span className="font-bold text-sm text-[#0F172A] dark:text-[#90E0EF] tracking-wide">{currentCustomer.referralCode}</span>
            <button
              onClick={handleCopyReferral}
              className="px-3 py-1 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 text-[#0F172A] dark:text-[#90E0EF] border border-[#CBD5E1] dark:border-slate-700 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              {copiedReferral ? <Check className="w-3 h-3 text-[#247347]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedReferral ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <span className="text-[11px] text-[#0F172A]/80 dark:text-slate-400 mt-1.5">Invite friends and earn shipping discounts</span>
        </div>
      </div>

      {/* Navigation Tabs for Profile */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-3 text-[12px] font-semibold">
        {[
          { id: 'details', label: 'Personal & Contact', icon: User },
          { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
          { id: 'kyc', label: 'Identity & KYC', icon: ShieldCheck },
          { id: 'security', label: 'Security & Password', icon: Lock },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'settings', label: 'Theme & Settings', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all whitespace-nowrap cursor-pointer min-h-[38px] ${
                isActive
                  ? 'bg-[#00B4D8] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800/90 border border-[#E2E8F0] dark:border-slate-700 text-[#4B5563] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: PERSONAL & CONTACT DETAILS */}
      {activeSection === 'details' && (
        <div className="sv-card p-6 space-y-5">
          <div className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
            <h3 className="sv-h3 dark:text-white">Personal Information &amp; Contact Details</h3>
            <p className="sv-label dark:text-slate-400 mt-0.5">
              These details are used for pickup bookings, customs forms, and delivery updates.
            </p>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#247347] dark:text-emerald-300 rounded-[8px] text-[13px] font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block sv-label dark:text-slate-300 mb-1.5">Full Name (as on Government ID)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block sv-label dark:text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block sv-label dark:text-slate-300 mb-1.5">Primary Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block sv-label dark:text-slate-300 mb-1.5">WhatsApp Updates Number</label>
                <input
                  type="text"
                  value={formData.whatsApp}
                  onChange={(e) => setFormData({ ...formData, whatsApp: e.target.value })}
                  className="sv-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block sv-label dark:text-slate-300 mb-1.5">Default Pickup Address</label>
                <input
                  type="text"
                  value={formData.preferredAddress}
                  onChange={(e) => setFormData({ ...formData, preferredAddress: e.target.value })}
                  className="sv-input"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="sv-btn-primary px-6 py-2.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 2: SAVED ADDRESSES & RECEIVERS */}
      {activeSection === 'addresses' && (
        <div className="sv-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
            <div>
              <h3 className="sv-h3 dark:text-white">Saved Addresses &amp; Receivers</h3>
              <p className="sv-label dark:text-slate-400 mt-0.5">
                Quick-select pickup spots and overseas receiver addresses for faster bookings.
              </p>
            </div>
            <button
              onClick={onOpenAddressBook}
              className="sv-btn-primary px-5 py-2 text-[13px] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Open Full Address Book</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-[12px] border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#00B4D8]" />
                  Home Pickup (Default)
                </span>
                <span className="text-[11px] bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] px-2.5 py-0.5 rounded-full font-semibold">
                  Default Pickup
                </span>
              </div>
              <p className="text-[13px] text-[#4B5563] dark:text-slate-300">{formData.preferredAddress}</p>
              <p className="text-[12px] text-[#66736B] dark:text-slate-400">Lagos State, Nigeria &bull; Free Doorstep Collection</p>
            </div>

            <div className="p-4 rounded-[12px] border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#00B4D8]" />
                  London Delivery Desk
                </span>
                <span className="text-[11px] bg-slate-100 dark:bg-slate-700 text-[#4B5563] dark:text-slate-300 px-2.5 py-0.5 rounded-full font-semibold">
                  Frequent Receiver
                </span>
              </div>
              <p className="text-[13px] text-[#4B5563] dark:text-slate-300">14 Kensington High Street, London W8 4PT</p>
              <p className="text-[12px] text-[#66736B] dark:text-slate-400">United Kingdom &bull; Receiver: David Adeleke</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: IDENTITY & KYC VERIFICATION */}
      {activeSection === 'kyc' && (
        <div className="sv-card p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
            <div>
              <h3 className="sv-h3 dark:text-white">Identity Verification (KYC)</h3>
              <p className="sv-label dark:text-slate-400 mt-0.5">
                Required by international aviation and customs regulations for export shipments from Nigeria.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full font-bold text-[12px] capitalize ${
              currentCustomer.kycStatus === 'verified'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#247347] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}>
              {currentCustomer.kycStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[12px] bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700">
            <div>
              <span className="sv-label dark:text-slate-400 block">Verification Method</span>
              <span className="font-semibold text-[#111827] dark:text-white text-[14px]">
                {currentCustomer.kycVerificationMethod
                  ? currentCustomer.kycVerificationMethod.toUpperCase()
                  : currentCustomer.kycIdType || 'National Identification Number (NIN)'}
              </span>
            </div>
            <div>
              <span className="sv-label dark:text-slate-400 block">Masked Identity Number</span>
              <span className="font-bold text-[#0F172A] dark:text-[#90E0EF] text-[14px]">
                {currentCustomer.kycMaskedId || '*******8492'}
              </span>
            </div>
            <div>
              <span className="sv-label dark:text-slate-400 block">Verification Date</span>
              <span className="text-[#1F2937] dark:text-slate-200 text-[14px]">
                {currentCustomer.kycVerifiedAt?.slice(0, 10) || currentCustomer.kycSubmittedAt?.slice(0, 10) || '2026-09-14'}
              </span>
            </div>
            <div>
              <span className="sv-label dark:text-slate-400 block">Compliance Status</span>
              <span className="text-[#247347] dark:text-emerald-400 font-semibold text-[14px]">Valid for International Cargo Handoff</span>
            </div>
          </div>

          <div className="p-4 bg-[#CAF0F8] dark:bg-sky-950/40 rounded-[12px] border border-[#90E0EF] dark:border-sky-800 space-y-1">
            <span className="font-bold text-[14px] text-[#0F172A] dark:text-[#90E0EF] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#00B4D8]" />
              Data Protection &amp; Privacy (NDPA Compliant)
            </span>
            <p className="text-[13px] text-[#0F172A]/85 dark:text-slate-300 leading-relaxed">
              Your identity credentials are cryptographically protected and never exposed publicly. Swiftvero complies strictly with the Nigeria Data Protection Act 2023.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onOpenKyc}
              className="sv-btn-primary px-5 py-2.5 text-[13px] cursor-pointer"
            >
              Update / Re-Verify Identity
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4: SECURITY & PASSWORD */}
      {activeSection === 'security' && (
        <div className="sv-card p-6 space-y-5">
          <div className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
            <h3 className="sv-h3 dark:text-white">Security &amp; Password Settings</h3>
            <p className="sv-label dark:text-slate-400 mt-0.5">
              Protect your Swiftvero wallet balance, saved addresses, and shipping records.
            </p>
          </div>

          {passwordMsg && (
            <div className={`p-3 rounded-[8px] text-[13px] font-medium flex items-center gap-2 ${
              passwordMsg.includes('success')
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#247347] dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block sv-label dark:text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="sv-input"
                required
              />
            </div>

            <div>
              <label className="block sv-label dark:text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="sv-input"
                required
              />
            </div>

            <div>
              <label className="block sv-label dark:text-slate-300 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="sv-input"
                required
              />
            </div>

            <button
              type="submit"
              className="sv-btn-primary px-6 py-2.5 text-[14px] cursor-pointer"
            >
              Update Password
            </button>
          </form>

          {/* Session Info */}
          <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-[13px] text-[#4B5563] dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#00B4D8]" />
              <span>Active Session: Lagos, Nigeria (Current Device)</span>
            </div>
            <span className="text-[#247347] dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full text-[11px]">
              Encrypted SSL
            </span>
          </div>
        </div>
      )}

      {/* SECTION 5: NOTIFICATION PREFERENCES */}
      {activeSection === 'notifications' && (
        <div className="sv-card p-6 space-y-4">
          <div className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
            <h3 className="sv-h3 dark:text-white">Notification Preferences</h3>
            <p className="sv-label dark:text-slate-400 mt-0.5">
              Choose how you want to receive pickup reminders, payment receipts, and tracking alerts.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'whatsappUpdates',
                title: 'WhatsApp Milestone Alerts',
                desc: 'Real-time courier contact, flight departures, and arrival notices on WhatsApp.',
                checked: notifications.whatsappUpdates,
              },
              {
                id: 'smsPickup',
                title: 'SMS Pickup Notifications',
                desc: 'Text message when your authorized field courier is dispatched to your address.',
                checked: notifications.smsPickup,
              },
              {
                id: 'emailReceipts',
                title: 'Email Receipts & Customs Paperwork',
                desc: 'Downloadable PDF invoices, itemized weight slips, and waybills sent to your inbox.',
                checked: notifications.emailReceipts,
              },
              {
                id: 'promoOffers',
                title: 'Discounts & Shipping Rewards',
                desc: 'Exclusive promo code announcements and seasonal volume air cargo rate cards.',
                checked: notifications.promoOffers,
              },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-start justify-between p-4 rounded-[12px] border border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/70 cursor-pointer transition-colors"
              >
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-[14px] text-[#111827] dark:text-white block">{item.title}</span>
                  <span className="sv-label dark:text-slate-400">{item.desc}</span>
                </div>
                <input
                  type="checkbox"
                  checked={(notifications as any)[item.id]}
                  onChange={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      [item.id]: !(prev as any)[item.id],
                    }))
                  }
                  className="mt-1 w-4 h-4 text-[#00B4D8] rounded border-slate-300 dark:border-slate-600 focus:ring-[#00B4D8]"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: THEME & SETTINGS (Prompt 1 Requirement) */}
      {activeSection === 'settings' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 text-slate-800 dark:text-slate-100">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Appearance &amp; Display Theme</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select your preferred appearance for the Swiftvero platform. Your choice is automatically saved and remembered across sessions.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'light'
                    ? 'border-[#00B4D8] bg-[#CAF0F8]/40 dark:bg-sky-950/40 ring-2 ring-[#00B4D8]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-[#008EA8]' : 'text-slate-400'}`} />
                  {theme === 'light' && (
                    <span className="text-[10px] font-bold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-full border border-[#90E0EF]">
                      Active
                    </span>
                  )}
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">Light Mode</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                  Clean white background with refined cyan accents and high contrast text.
                </span>
              </button>

              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'dark'
                    ? 'border-[#00B4D8] bg-[#CAF0F8]/40 dark:bg-sky-950/40 ring-2 ring-[#00B4D8]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-[#008EA8]' : 'text-slate-400'}`} />
                  {theme === 'dark' && (
                    <span className="text-[10px] font-bold text-[#008EA8] bg-[#CAF0F8] dark:bg-sky-950 px-2 py-0.5 rounded-full border border-[#90E0EF] dark:border-sky-800">
                      Active
                    </span>
                  )}
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">Dark Mode</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                  Deep slate background, reduced eye strain, and accessible cyan highlights.
                </span>
              </button>

              {/* System Default Card */}
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'system'
                    ? 'border-[#00B4D8] bg-[#CAF0F8]/40 dark:bg-sky-950/40 ring-2 ring-[#00B4D8]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Laptop className={`w-5 h-5 ${theme === 'system' ? 'text-[#008EA8]' : 'text-slate-400'}`} />
                  {theme === 'system' && (
                    <span className="text-[10px] font-bold text-[#008EA8] bg-[#CAF0F8] dark:bg-sky-950 px-2 py-0.5 rounded-full border border-[#90E0EF] dark:border-sky-800">
                      Active
                    </span>
                  )}
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">System Default</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                  Automatically mirrors your device operating system display mode.
                </span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Preference saved in local browser storage.</span>
              <ThemeToggle variant="segmented" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
