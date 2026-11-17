import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { Logo } from '../common/Logo';
import { PolicyKey } from '../common/LegalModal';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Shield,
  Plane,
  ArrowLeft,
} from 'lucide-react';

interface LoginPageProps {
  initialMode?: 'signin' | 'register';
  onOpenPolicy: (key: PolicyKey) => void;
  onSuccess: () => void;
  onBackToHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialMode = 'signin',
  onOpenPolicy,
  onSuccess,
  onBackToHome,
}) => {
  const { setRole, setActiveCustomerKey } = useDemo();

  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>(initialMode);
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCustomerType, setRegCustomerType] = useState<'individual' | 'business'>('individual');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regAgreeTerms, setRegAgreeTerms] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!signInIdentifier.trim()) {
      setAuthError('Please enter your email or phone number.');
      return;
    }
    if (!signInPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    const clean = signInIdentifier.trim().toLowerCase();
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

    onSuccess();
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-hidden bg-[#F8FAFC]">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#F8FAFC] via-[#CAF0F8]/35 to-[#90E0EF]/20" />

      {/* Top Bar with Home Link and Logo */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="text-[13px] font-semibold text-[#111827] hover:text-[#00B4D8] flex items-center gap-1.5 transition-colors bg-white px-4 py-2 rounded-full border border-[#CBD5E1] shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <Logo size="md" />

        <div className="w-20" />
      </div>

      {/* Centered Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 my-auto py-8">
        <div className="sv-card p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CAF0F8] text-[#0F172A] text-[12px] font-semibold border border-[#90E0EF]">
              <Plane className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>International Consignor Portal</span>
            </div>
            <h1 className="sv-h1">
              {mode === 'signin' ? 'Welcome Back' : 'Create Shipper Account'}
            </h1>
            <p className="sv-label">
              Direct access to live flight tracking, transparent quotes &amp; doorstep pickups.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-[13px] text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Interactive Quick-Fill */}
          <div className="p-3.5 bg-[#CAF0F8]/70 rounded-[12px] border border-[#90E0EF] space-y-2">
            <span className="text-[12px] font-bold text-[#0F172A] block">
              Quick-Fill Demo Credentials:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSignInIdentifier('chidinma@example.com');
                  setSignInPassword('password123');
                }}
                className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#111827] text-[12px] rounded-full border border-[#CBD5E1] font-semibold cursor-pointer"
              >
                Chidinma (Verified)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignInIdentifier('babatunde@heritage.ng');
                  setSignInPassword('password123');
                }}
                className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#111827] text-[12px] rounded-full border border-[#CBD5E1] font-semibold cursor-pointer"
              >
                Babatunde (Business)
              </button>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="sv-label block text-[#111827] font-semibold mb-1.5">
                Email Address or Phone Number
              </label>
              <input
                type="text"
                value={signInIdentifier}
                onChange={(e) => setSignInIdentifier(e.target.value)}
                placeholder="e.g. name@company.ng"
                className="sv-input w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[14px] text-[#111827]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="sv-label block text-[#111827] font-semibold">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="sv-input w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[14px] text-[#111827] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#111827] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

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
              className="sv-btn-primary w-full py-3 rounded-full flex items-center justify-center gap-2 shadow-sm mt-3 cursor-pointer"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center sv-label pt-2">
            <span>By signing in, you agree to Swiftvero's </span>
            <button
              onClick={() => onOpenPolicy('terms')}
              className="text-[#0F172A] underline underline-offset-4 hover:text-[#00B4D8] font-semibold cursor-pointer"
            >
              Terms of Use
            </button>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="relative z-10 text-center py-4 sv-label">
        © {new Date().getFullYear()} Swiftvero Express Ltd. Global air cargo &amp; courier technology.
      </div>
    </div>
  );
};
