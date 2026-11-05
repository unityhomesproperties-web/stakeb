import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  // Official uploaded Swiftvero Express logo with globe emblem and cyan arrow
  const heightClasses = {
    sm: 'h-8 md:h-9',
    md: 'h-10 md:h-12',
    lg: 'h-13 md:h-16',
    xl: 'h-16 md:h-20',
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/assets/aistudio/IMG_1946_38f6a078.jpeg"
        alt="Swiftvero Express"
        className={`${heightClasses[size]} w-auto object-contain shrink-0`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
