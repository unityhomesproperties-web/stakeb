import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  // Official uploaded Swiftvero Express logo with globe emblem and cyan arrow
  const heightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-7 sm:h-8',
    lg: 'h-8 sm:h-9',
    xl: 'h-10 sm:h-11',
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/assets/aistudio/swiftvero_logo_transparent.png"
        alt="Swiftvero Express"
        className={`${heightClasses[size]} w-auto object-contain shrink-0`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
