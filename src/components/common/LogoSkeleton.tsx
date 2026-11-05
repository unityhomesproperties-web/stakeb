import React from 'react';

interface LogoSkeletonProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  showBars?: boolean;
  className?: string;
}

export const LogoSkeleton: React.FC<LogoSkeletonProps> = ({
  message = 'Loading Swiftvero Express...',
  submessage,
  size = 'md',
  showBars = true,
  className = '',
}) => {
  const logoDimensions = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-13',
    lg: 'h-15 sm:h-18',
    fullscreen: 'h-16 sm:h-20',
  };

  const containerPadding = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
    fullscreen: 'min-h-[50vh] flex flex-col items-center justify-center p-8',
  };

  return (
    <div
      role="status"
      aria-label={message}
      className={`w-full flex flex-col items-center justify-center text-center ${containerPadding[size]} ${className}`}
    >
      {/* Animated Logo Container */}
      <div className="relative inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-white border border-[#DCEFF3] shadow-sm overflow-hidden select-none">
        {/* Ambient Soft Cyan Glow Behind Logo */}
        <div className="absolute inset-0 bg-radial from-[#CAF0F8] via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Shimmer Light Sweep Layer */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-logo-sweep" />
        </div>

        {/* The Animated Logo Image */}
        <img
          src="/assets/aistudio/IMG_1946_38f6a078.jpeg"
          alt="Swiftvero Express Loading"
          className={`${logoDimensions[size]} w-auto object-contain shrink-0 animate-logo-pulse relative z-10`}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Loading Message & Pulse Indicator */}
      {message && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-ping" />
          <span className="text-xs sm:text-sm font-medium text-[#354B55]">
            {message}
          </span>
        </div>
      )}

      {submessage && (
        <p className="mt-1 text-xs text-[#354B55]/70 max-w-xs">{submessage}</p>
      )}

      {/* Shimmer Placeholder Content Bars */}
      {showBars && (
        <div className="mt-6 w-full max-w-sm space-y-2.5">
          <div className="h-3 w-4/5 mx-auto bg-gradient-to-r from-[#F5FBFD] via-[#CAF0F8]/50 to-[#F5FBFD] rounded-full animate-pulse" />
          <div className="h-2.5 w-3/5 mx-auto bg-gradient-to-r from-[#F5FBFD] via-[#CAF0F8]/40 to-[#F5FBFD] rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};
