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
    <div className="min-h-screen relative flex flex-col justify-between overflow-hidden bg-[#F5FBFD]">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#F5FBFD] via-[#CAF0F8]/40 to-[#90E0EF]/20" />

      {/* Top Bar with Home Link and Logo */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="text-xs font-semibold text-[#354B55] hover:text-[#00B4D8] flex items-center gap-1.5 transition-colors bg-white/80 px-3 py-1.5 rounded-lg border border-[#DCEFF3] shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <Logo size="md" />

        <div className="w-20" /> {/* Spacer for visual balance */}
      </div>

      {/* Centered Glass Panel */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 my-auto py-8">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#DCEFF3] shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CAF0F8]/60 text-[#008EA8] text-[11px] font-bold uppercase tracking-wider border border-[#90E0EF]">
              <Plane className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>International Consignor Portal</span>
            </div>
            <h1 className="text-2xl font-serif-display font-bold text-[#354B55]">
              {mode === 'signin' ? 'Welcome Back' : 'Create Shipper Account'}
            </h1>
            <p className="text-xs text-[#6A808C]">
              Direct access to live flight tracking, transparent quotes &amp; doorstep pickups.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Interactive Quick-Fill */}
          <div className="p-3 bg-[#CAF0F8]/40 rounded-xl border border-[#90E0EF]/60 text-xs space-y-2">
            <span className="text-[11px] font-bold text-[#008EA8] block">
              Quick-Fill Demo Credentials:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSignInIdentifier('chidinma@example.com');
                  setSignInPassword('password123');
                }}
                className="px-2.5 py-1 bg-white hover:bg-[#F5FBFD] text-[#354B55] text-[11px] rounded-lg border border-[#DCEFF3] font-medium"
              >
                Chidinma (Verified)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignInIdentifier('babatunde@heritage.ng');
                  setSignInPassword('password123');
                }}
                className="px-2.5 py-1 bg-white hover:bg-[#F5FBFD] text-[#354B55] text-[11px] rounded-lg border border-[#DCEFF3] font-medium"
              >
                Babatunde (Business)
              </button>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#354B55] mb-1.5">
                Email Address or Phone Number
              </label>
              <input
                type="text"
                value={signInIdentifier}
                onChange={(e) => setSignInIdentifier(e.target.value)}
                placeholder="e.g. name@company.ng"
                className="w-full px-3.5 py-2.5 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#354B55]">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6A808C] hover:text-[#354B55]"
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

          <div className="text-center text-xs text-[#6A808C] pt-2">
            <span>By signing in, you agree to Swiftvero's </span>
            <button
              onClick={() => onOpenPolicy('terms')}
              className="text-[#00B4D8] hover:underline font-medium"
            >
              Terms of Use
            </button>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="relative z-10 text-center py-4 text-xs text-[#6A808C]">
        © {new Date().getFullYear()} Swiftvero Express Ltd. Global air cargo &amp; courier technology.
      </div>
    </div>
  );
};
