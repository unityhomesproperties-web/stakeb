import React, { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'compact' | 'dropdown' | 'segmented';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', variant = 'compact' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
            theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-[#00B4D8] shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Light Mode"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
            theme === 'dark'
              ? 'bg-white dark:bg-slate-700 text-[#00B4D8] shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Dark Mode"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-700 text-[#00B4D8] shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="System Default"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-hidden"
        aria-label="Toggle display theme"
        title={`Current: ${theme === 'system' ? 'System Default' : theme === 'dark' ? 'Dark Mode' : 'Light Mode'}`}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-cyan-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-38 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-xs">
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
              theme === 'light'
                ? 'text-[#00B4D8] font-semibold bg-cyan-50 dark:bg-slate-700/50'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light Mode</span>
            </span>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#00B4D8]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
              theme === 'dark'
                ? 'text-[#00B4D8] font-semibold bg-cyan-50 dark:bg-slate-700/50'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dark Mode</span>
            </span>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#00B4D8]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
              theme === 'system'
                ? 'text-[#00B4D8] font-semibold bg-cyan-50 dark:bg-slate-700/50'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            <span className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              <span>System Default</span>
            </span>
            {theme === 'system' && <Check className="w-3.5 h-3.5 text-[#00B4D8]" />}
          </button>
        </div>
      )}
    </div>
  );
};
