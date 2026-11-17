import React, { useState, useEffect } from 'react';
import { useDemo } from '../../context/DemoContext';
import { Logo } from '../common/Logo';
import { PolicyKey } from '../common/LegalModal';
import {
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Plane,
  Building2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register' | 'staff';
  onOpenPolicy: (key: PolicyKey) => void;
  onSuccessRedirect: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onOpenPolicy,
  onSuccessRedirect,
}) => {
  const { setRole, setActiveCustomerKey, setCurrentStaffUser, setActiveBranchId, staffMembers, branches } = useDemo();

  const [mode, setMode] = useState<'signin' | 'register' | 'forgot' | 'reset_sent' | 'staff'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setAuthError('');
      setRegErrors({});
    }
  }, [isOpen, initialMode]);

  // Customer Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Desk Admin Staff Login State
  const [staffIdentifier, setStaffIdentifier] = useState('chioma.eze@swiftvero.com');
  const [staffPassword, setStaffPassword] = useState('StaffPass@2026');
  const [selectedStaffBranch, setSelectedStaffBranch] = useState('branch_ikeja');
  const [staffTwoFactor, setStaffTwoFactor] = useState('');

  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCustomerType, setRegCustomerType] = useState<'individual' | 'business'>('individual');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regAgreeTerms, setRegAgreeTerms] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');

  if (!isOpen) return null;

  const handleStaffLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const targetStaff = staffMembers.find(
      (s) =>
        s.email.toLowerCase() === staffIdentifier.trim().toLowerCase() ||
        s.staffId.toLowerCase() === staffIdentifier.trim().toLowerCase()
    ) || staffMembers.find((s) => s.role === 'front_desk') || staffMembers[0];

    setCurrentStaffUser(targetStaff);
    if (selectedStaffBranch) {
      setActiveBranchId(selectedStaffBranch);
    }
    // Set role according to staff account
    setRole(targetStaff.role as any);
    onClose();
    onSuccessRedirect();
  };

  const handleCustomerSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!signInIdentifier.trim()) {
      setAuthError('Please enter your email address or phone number.');
      return;
    }
    if (!signInPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    const clean = signInIdentifier.trim().toLowerCase();
    // Route to appropriate customer account profile
    if (clean.includes('babatunde') || clean.includes('heritage')) {
      setActiveCustomerKey('business');
      setRole('business');
    } else if (clean.includes('fatima')) {
      setActiveCustomerKey('pending');
      setRole('customer');
    } else if (clean.includes('seun')) {
      setActiveCustomerKey('new');
      setRole('customer');
    } else {
      setActiveCustomerKey('verified');
      setRole('customer');
    }

    onClose();
    onSuccessRedirect();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!regFullName.trim()) errors.fullName = 'Full legal name is required.';
    if (!regEmail.trim() || !regEmail.includes('@')) errors.email = 'Valid email address is required.';
    if (!regPhone.trim()) errors.phone = 'Phone number is required.';
    if (!regPassword || regPassword.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (regPassword !== regConfirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (regCustomerType === 'business' && !regCompanyName.trim()) {
      errors.companyName = 'Registered company/business name is required.';
    }
    if (!regAgreeTerms) errors.terms = 'You must agree to the Terms of Use and Privacy Notice.';

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    if (regCustomerType === 'business') {
      setActiveCustomerKey('business');
      setRole('business');
    } else {
      setActiveCustomerKey('verified');
      setRole('customer');
    }

    onClose();
    onSuccessRedirect();
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    setMode('reset_sent');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Atmosphere Backdrop */}
      <div className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-xs transition-opacity" />

      {/* Main Modal Container */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-[12px] border border-[#E2E8F0] dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-[#00B4D8]" />

        {/* Modal Header with Logo and Close Button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <button
            onClick={onClose}
            className="text-[#4B5563] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white p-1.5 rounded-full hover:bg-[#CAF0F8] transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 text-[12px] font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthError('');
              setMode('signin');
            }}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'border-[#00B4D8] text-[#0F172A] dark:text-white font-bold bg-[#CAF0F8] dark:bg-sky-950/60'
                : 'border-transparent text-[#4B5563] dark:text-slate-400 hover:text-[#111827]'
            }`}
          >
            Customer Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setRegErrors({});
              setMode('register');
            }}
            className={`flex-1 py-3 px-2 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'register'
                ? 'border-[#00B4D8] text-[#0F172A] dark:text-white font-bold bg-[#CAF0F8] dark:bg-sky-950/60'
                : 'border-transparent text-[#4B5563] dark:text-slate-400 hover:text-[#111827]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthError('');
              setMode('staff');
            }}
            className={`flex-1 py-3 px-2 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'staff'
                ? 'border-[#00B4D8] text-[#0F172A] dark:text-white font-bold bg-[#CAF0F8] dark:bg-sky-950/60'
                : 'border-transparent text-[#4B5563] dark:text-slate-400 hover:text-[#111827]'
            }`}
          >
            Staff Login
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[82vh] overflow-y-auto">
          {/* Customer Sign In */}
          {mode === 'signin' && (
            <div>
              <div className="mb-4 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00B4D8] uppercase tracking-wider">
                  <Plane className="w-3.5 h-3.5" />
                  <span>Customer Portal Access</span>
                </div>
                <h3 className="sv-h2 dark:text-white">
                  Welcome back
                </h3>
                <p className="sv-label dark:text-slate-400">
                  Sign in to view your shipments, scheduled pickups, and transparent air quotes.
                </p>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Demo Account Quick-Fill Card */}
              <div className="mb-4 p-3 bg-[#CAF0F8] rounded-[12px] border border-[#90E0EF] text-xs space-y-2">
                <span className="text-[11px] font-bold text-[#0F172A] block">
                  Interactive Demo Quick-Fill:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInIdentifier('chidinma@example.com');
                      setSignInPassword('password123');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#111827] text-[11px] rounded-full border border-[#CBD5E1] font-semibold transition-colors cursor-pointer"
                  >
                    Chidinma (Verified Shipper)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInIdentifier('babatunde@heritage.ng');
                      setSignInPassword('password123');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#111827] text-[11px] rounded-full border border-[#CBD5E1] font-semibold transition-colors cursor-pointer"
                  >
                    Babatunde (Business Shipper)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInIdentifier('fatima@example.com');
                      setSignInPassword('password123');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#111827] text-[11px] rounded-full border border-[#CBD5E1] font-semibold transition-colors cursor-pointer"
                  >
                    Fatima (Pending KYC)
                  </button>
                </div>
              </div>

              <form onSubmit={handleCustomerSignInSubmit} className="space-y-4">
                <div>
                  <label className="block sv-label dark:text-slate-300 mb-1.5">
                    Email Address or Phone Number
                  </label>
                  <input
                    type="text"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="e.g. name@company.ng or +234 800..."
                    className="sv-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block sv-label dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[12px] text-[#0096C7] hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="sv-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#111827] p-0.5 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00B4D8] focus:ring-[#00B4D8] border-[#CBD5E1]"
                    />
                    <span className="sv-label">Remember this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="sv-btn-primary w-full py-3 flex items-center justify-center gap-1.5 mt-3 cursor-pointer"
                >
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-5 text-center sv-label">
                Don't have an international shipper account?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-[#0096C7] font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* Customer Registration */}
          {mode === 'register' && (
            <div>
              <div className="mb-4 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00B4D8] uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Verified Customer Registration</span>
                </div>
                <h3 className="sv-h2 dark:text-white">
                  Create an account
                </h3>
                <p className="sv-label dark:text-slate-400">
                  Direct access to transparent international courier, document, and cargo logistics.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Account Type Selector */}
                <div>
                  <label className="block sv-label dark:text-slate-300 mb-1.5">
                    Account Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegCustomerType('individual')}
                      className={`p-2.5 rounded-[8px] border text-[13px] font-semibold text-center transition-all cursor-pointer ${
                        regCustomerType === 'individual'
                          ? 'border-[#00B4D8] bg-[#CAF0F8] text-[#0F172A]'
                          : 'border-[#E2E8F0] text-[#4B5563] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      Individual / Diaspora
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegCustomerType('business')}
                      className={`p-2.5 rounded-[8px] border text-[13px] font-semibold text-center transition-all cursor-pointer ${
                        regCustomerType === 'business'
                          ? 'border-[#00B4D8] bg-[#CAF0F8] text-[#0F172A]'
                          : 'border-[#E2E8F0] text-[#4B5563] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      Business / Merchant
                    </button>
                  </div>
                </div>

                {regCustomerType === 'business' && (
                  <div>
                    <label className="block sv-label dark:text-slate-300 mb-1">
                      Registered Company Name
                    </label>
                    <input
                      type="text"
                      value={regCompanyName}
                      onChange={(e) => setRegCompanyName(e.target.value)}
                      placeholder="e.g. Lekki Heritage Exports PLC"
                      className="sv-input"
                    />
                    {regErrors.companyName && (
                      <p className="text-[12px] text-[#B42318] mt-1">{regErrors.companyName}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block sv-label dark:text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="First and last name as per government ID"
                    className="sv-input"
                  />
                  {regErrors.fullName && (
                    <p className="text-[12px] text-[#B42318] mt-1">{regErrors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block sv-label dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="sv-input"
                    />
                    {regErrors.email && (
                      <p className="text-[12px] text-[#B42318] mt-1">{regErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block sv-label dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="sv-input"
                    />
                    {regErrors.phone && (
                      <p className="text-[12px] text-[#B42318] mt-1">{regErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block sv-label dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="sv-input"
                    />
                    {regErrors.password && (
                      <p className="text-[12px] text-[#B42318] mt-1">{regErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block sv-label dark:text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="sv-input"
                    />
                    {regErrors.confirmPassword && (
                      <p className="text-[12px] text-[#B42318] mt-1">{regErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-[12px] text-[#4B5563]">
                    <input
                      type="checkbox"
                      checked={regAgreeTerms}
                      onChange={(e) => setRegAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8] border-[#CBD5E1]"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => onOpenPolicy('terms')}
                        className="text-[#0096C7] underline font-semibold"
                      >
                        Terms of Use
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => onOpenPolicy('privacy')}
                        className="text-[#0096C7] underline font-semibold"
                      >
                        Privacy Notice
                      </button>
                      .
                    </span>
                  </label>
                  {regErrors.terms && (
                    <p className="text-[12px] text-[#B42318] mt-1">{regErrors.terms}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="sv-btn-primary w-full py-3 flex items-center justify-center gap-1.5 mt-3 cursor-pointer"
                >
                  <span>Complete Account Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 text-center sv-label">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-[#0096C7] font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Screen */}
          {mode === 'forgot' && (
            <div>
              <div className="mb-5 space-y-1">
                <h3 className="sv-h2 dark:text-white">
                  Reset password
                </h3>
                <p className="sv-label dark:text-slate-400">
                  Enter your verified account email address and we will generate a secure reset link.
                </p>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-[13px] text-[#B42318] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block sv-label dark:text-slate-300 mb-1.5">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. name@company.ng"
                    className="sv-input"
                  />
                </div>

                <button
                  type="submit"
                  className="sv-btn-primary w-full py-3 cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setMode('signin')}
                  className="text-[13px] text-[#0096C7] font-semibold hover:underline cursor-pointer"
                >
                  ← Return to Customer Sign In
                </button>
              </div>
            </div>
          )}

          {/* Reset Sent Confirmation */}
          {mode === 'reset_sent' && (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="sv-h2 dark:text-white">
                Reset instructions sent
              </h3>
              <p className="sv-body text-[14px] max-w-xs mx-auto">
                If an account exists for <span className="font-semibold text-[#111827]">{forgotEmail}</span>, you will receive password reset instructions shortly.
              </p>
              <div className="pt-3">
                <button
                  onClick={() => setMode('signin')}
                  className="sv-btn-primary px-6 py-2.5 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Operations Staff Login */}
          {mode === 'staff' && (
            <div className="space-y-4">
              <div className="mb-2 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00B4D8] uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Operations &amp; Counter Staff Portal</span>
                </div>
                <h3 className="sv-h2 dark:text-white">
                  Staff Operations Sign-In
                </h3>
                <p className="sv-label dark:text-slate-400">
                  Authorised personnel login for branch desk intakes, courier pickups, MMIA flight operations, finance, and central administration.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-[13px] text-[#B42318] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Demo 1-Click Role Switcher */}
              <div className="p-3 bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] space-y-2 text-xs">
                <span className="text-[11px] font-bold text-[#0F172A] block">
                  Quick Select Staff Demo Role:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffIdentifier('chioma.eze@swiftvero.com');
                      setStaffPassword('StaffPass@2026');
                      setSelectedStaffBranch('branch_ikeja');
                    }}
                    className="p-2 text-left bg-white hover:bg-[#F8FAFC] text-[#111827] text-[11px] rounded-[8px] border border-[#CBD5E1] font-medium transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#0096C7]">Front Desk Admin</div>
                    <div className="text-[11px] text-[#4B5563]">Chioma Eze (Ikeja Hub)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStaffIdentifier('emeka.nwosu@swiftvero.com');
                      setStaffPassword('StaffPass@2026');
                      setSelectedStaffBranch('branch_ikeja');
                    }}
                    className="p-2 text-left bg-white hover:bg-[#F8FAFC] text-[#111827] text-[11px] rounded-[8px] border border-[#CBD5E1] font-medium transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#0096C7]">Pickup Courier Agent</div>
                    <div className="text-[11px] text-[#4B5563]">Emeka Nwosu (Ikeja Dispatch)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStaffIdentifier('kemi.adeleke@swiftvero.com');
                      setStaffPassword('StaffPass@2026');
                      setSelectedStaffBranch('all');
                    }}
                    className="p-2 text-left bg-white hover:bg-[#F8FAFC] text-[#111827] text-[11px] rounded-[8px] border border-[#CBD5E1] font-medium transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#0096C7]">MMIA Ops Tower</div>
                    <div className="text-[11px] text-[#4B5563]">Kemi Adeleke (Airport Hub)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStaffIdentifier('haruna.aliyu@swiftvero.com');
                      setStaffPassword('StaffPass@2026');
                      setSelectedStaffBranch('all');
                    }}
                    className="p-2 text-left bg-white hover:bg-[#F8FAFC] text-[#111827] text-[11px] rounded-[8px] border border-[#CBD5E1] font-medium transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#0096C7]">Finance Lead</div>
                    <div className="text-[11px] text-[#4B5563]">Haruna Aliyu (VAT &amp; Refunds)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStaffIdentifier('balogunsophieah@gmail.com');
                      setStaffPassword('StaffPass@2026');
                      setSelectedStaffBranch('all');
                    }}
                    className="p-2 text-left bg-white hover:bg-[#F8FAFC] text-[#111827] text-[11px] rounded-[8px] border border-[#CBD5E1] font-medium transition-colors sm:col-span-2 cursor-pointer"
                  >
                    <div className="font-bold text-[#0096C7]">Super Admin / Executive Owner</div>
                    <div className="text-[11px] text-[#4B5563]">Sophie Balogun (Full Enterprise Scope)</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleStaffLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block sv-label dark:text-slate-300 mb-1">
                    Work Email or Staff ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffIdentifier}
                    onChange={(e) => setStaffIdentifier(e.target.value)}
                    placeholder="e.g. chioma.eze@swiftvero.com or SWV-STAFF-002"
                    className="sv-input"
                  />
                </div>

                <div>
                  <label className="block sv-label dark:text-slate-300 mb-1">
                    Workplace Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="sv-input"
                  />
                </div>

                <div>
                  <label className="block sv-label dark:text-slate-300 mb-1">
                    Assigned Hub / Branch *
                  </label>
                  <select
                    value={selectedStaffBranch}
                    onChange={(e) => setSelectedStaffBranch(e.target.value)}
                    className="sv-input"
                  >
                    <option value="all">All Enterprise Hubs (Airport / Head Office)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block sv-label dark:text-slate-300 mb-1">
                    Two-Factor Token (2FA Demo)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={staffTwoFactor}
                    onChange={(e) => setStaffTwoFactor(e.target.value)}
                    placeholder="e.g. 642891 (Optional in Demo)"
                    className="sv-input"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="sv-btn-primary w-full py-3 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Sign In to Staff Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
