import React, { useState } from 'react';
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
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register';
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
  const { setRole, setActiveCustomerKey } = useDemo();

  const [mode, setMode] = useState<'signin' | 'register' | 'forgot' | 'reset_sent'>(initialMode);

  // Customer Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

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
      <div className="fixed inset-0 bg-[#354B55]/40 backdrop-blur-xs transition-opacity" />

      {/* Main Glass-Style Modal Container */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-[#DCEFF3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Subtle Aviation Flight Line Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#CAF0F8] via-[#00B4D8] to-[#90E0EF]" />

        {/* Modal Header with Prominent Logo and Close Button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#DCEFF3] bg-white/70">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <button
            onClick={onClose}
            className="text-[#6A808C] hover:text-[#354B55] p-1.5 rounded-lg hover:bg-[#CAF0F8]/50 transition-colors"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex border-b border-[#DCEFF3] bg-white/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthError('');
              setMode('signin');
            }}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors ${
              mode === 'signin'
                ? 'border-[#00B4D8] text-[#00B4D8] font-bold bg-[#CAF0F8]/30'
                : 'border-transparent text-[#6A808C] hover:text-[#354B55]'
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
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-[#00B4D8] text-[#00B4D8] font-bold bg-[#CAF0F8]/30'
                : 'border-transparent text-[#6A808C] hover:text-[#354B55]'
            }`}
          >
            Create Account
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
                  <span>Consignor Portal Access</span>
                </div>
                <h3 className="text-xl font-serif-display font-bold text-[#354B55]">
                  Welcome back
                </h3>
                <p className="text-xs text-[#6A808C]">
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
              <div className="mb-4 p-3 bg-[#CAF0F8]/40 rounded-xl border border-[#90E0EF]/60 text-xs space-y-2">
                <span className="text-[11px] font-bold text-[#008EA8] block">
                  Interactive Demo Quick-Fill:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInIdentifier('chidinma@example.com');
                      setSignInPassword('password123');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F5FBFD] text-[#354B55] text-[11px] rounded-lg border border-[#DCEFF3] font-medium transition-colors shadow-2xs"
                  >
                    Chidinma (Verified Shipper)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInIdentifier('babatunde@heritage.ng');
                      setSignInPassword('password123');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F5FBFD] text-[#354B55] text-[11px] rounded-lg border border-[#DCEFF3] font-medium transition-colors shadow-2xs"
                  >
                    Babatunde (Business Shipper)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInIdentifier('fatima@example.com');
                      setSignInPassword('password123');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F5FBFD] text-[#354B55] text-[11px] rounded-lg border border-[#DCEFF3] font-medium transition-colors shadow-2xs"
                  >
                    Fatima (Pending KYC)
                  </button>
                </div>
              </div>

              <form onSubmit={handleCustomerSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#354B55] mb-1.5">
                    Email Address or Phone Number
                  </label>
                  <input
                    type="text"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="e.g. name@company.ng or +234 800..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] placeholder:text-[#6A808C]/60 focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#354B55]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-[#00B4D8] hover:underline font-medium"
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
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] placeholder:text-[#6A808C]/60 focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6A808C] hover:text-[#354B55] p-0.5"
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
                      className="w-4 h-4 rounded text-[#00B4D8] focus:ring-[#00B4D8] border-[#DCEFF3]"
                    />
                    <span className="text-xs text-[#6A808C]">Remember this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 text-xs font-bold text-white bg-[#00B4D8] hover:bg-[#009BB8] rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm mt-3"
                >
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-[#6A808C]">
                Don't have an international shipper account?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-[#00B4D8] font-bold hover:underline"
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
                  <span>Verified Consignor Registration</span>
                </div>
                <h3 className="text-xl font-serif-display font-bold text-[#354B55]">
                  Create an account
                </h3>
                <p className="text-xs text-[#6A808C]">
                  Direct access to transparent international courier, document, and cargo logistics.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Account Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#354B55] mb-1.5">
                    Account Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegCustomerType('individual')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        regCustomerType === 'individual'
                          ? 'border-[#00B4D8] bg-[#CAF0F8]/40 text-[#008EA8]'
                          : 'border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                      }`}
                    >
                      Individual / Diaspora
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegCustomerType('business')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        regCustomerType === 'business'
                          ? 'border-[#00B4D8] bg-[#CAF0F8]/40 text-[#008EA8]'
                          : 'border-[#DCEFF3] text-[#6A808C] hover:bg-slate-50'
                      }`}
                    >
                      Business / Merchant
                    </button>
                  </div>
                </div>

                {regCustomerType === 'business' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#354B55] mb-1">
                      Registered Company Name
                    </label>
                    <input
                      type="text"
                      value={regCompanyName}
                      onChange={(e) => setRegCompanyName(e.target.value)}
                      placeholder="e.g. Lekki Heritage Exports PLC"
                      className="w-full px-3.5 py-2 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                    />
                    {regErrors.companyName && (
                      <p className="text-[11px] text-rose-600 mt-1">{regErrors.companyName}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#354B55] mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="First and last name as per government ID"
                    className="w-full px-3.5 py-2 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                  />
                  {regErrors.fullName && (
                    <p className="text-[11px] text-rose-600 mt-1">{regErrors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#354B55] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full px-3.5 py-2 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                    />
                    {regErrors.email && (
                      <p className="text-[11px] text-rose-600 mt-1">{regErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#354B55] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full px-3.5 py-2 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                    />
                    {regErrors.phone && (
                      <p className="text-[11px] text-rose-600 mt-1">{regErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#354B55] mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-3.5 py-2 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                    />
                    {regErrors.password && (
                      <p className="text-[11px] text-rose-600 mt-1">{regErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#354B55] mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3.5 py-2 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                    />
                    {regErrors.confirmPassword && (
                      <p className="text-[11px] text-rose-600 mt-1">{regErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-[11px] text-[#6A808C]">
                    <input
                      type="checkbox"
                      checked={regAgreeTerms}
                      onChange={(e) => setRegAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-[#00B4D8] focus:ring-[#00B4D8] border-[#DCEFF3]"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => onOpenPolicy('terms')}
                        className="text-[#00B4D8] underline hover:text-[#009BB8]"
                      >
                        Terms of Use
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => onOpenPolicy('privacy')}
                        className="text-[#00B4D8] underline hover:text-[#009BB8]"
                      >
                        Privacy Notice
                      </button>
                      .
                    </span>
                  </label>
                  {regErrors.terms && (
                    <p className="text-[11px] text-rose-600 mt-1">{regErrors.terms}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 text-xs font-bold text-white bg-[#00B4D8] hover:bg-[#009BB8] rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm mt-3"
                >
                  <span>Complete Account Registration</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="mt-4 text-center text-xs text-[#6A808C]">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-[#00B4D8] font-bold hover:underline"
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
                <h3 className="text-xl font-serif-display font-bold text-[#354B55]">
                  Reset password
                </h3>
                <p className="text-xs text-[#6A808C]">
                  Enter your verified account email address and we will generate a secure reset link.
                </p>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#354B55] mb-1.5">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. name@company.ng"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 text-xs font-bold text-white bg-[#00B4D8] hover:bg-[#009BB8] rounded-xl transition-all shadow-sm"
                >
                  Send Reset Link
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setMode('signin')}
                  className="text-xs text-[#00B4D8] font-semibold hover:underline"
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
              <h3 className="text-lg font-serif-display font-bold text-[#354B55]">
                Reset instructions sent
              </h3>
              <p className="text-xs text-[#6A808C] max-w-xs mx-auto">
                If an account exists for <span className="font-semibold text-[#354B55]">{forgotEmail}</span>, you will receive password reset instructions shortly.
              </p>
              <div className="pt-3">
                <button
                  onClick={() => setMode('signin')}
                  className="px-5 py-2.5 bg-[#00B4D8] text-white rounded-xl text-xs font-bold hover:bg-[#009BB8] transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
