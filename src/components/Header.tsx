'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100); // percentage: 90, 100, 110

  // Font size adjustment functions
  const decreaseFontSize = () => setFontSize(prev => Math.max(85, prev - 10));
  const resetFontSize = () => setFontSize(100);
  const increaseFontSize = () => setFontSize(prev => Math.min(120, prev + 10));

  // Apply font size to document
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  // Skip to main content handler
  const handleSkipToContent = (e: React.MouseEvent) => {
    e.preventDefault();
    const main = document.querySelector('main');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/mapping', label: 'Mapping', icon: 'map' },
    { href: '/trafficdata', label: 'Traffic', icon: 'traffic' },
    { href: '/timestamp', label: 'Data', icon: 'analytics' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync menu state with navigation
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Government of India Header Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-2 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {/* National Emblem */}
            <Image
              src="/images/national-emblem.png"
              alt="National Emblem of India"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 object-contain"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-medium">भारत सरकार | Government of India</p>
              <p className="text-[10px] opacity-80">Ministry of Environment, Forest and Climate Change</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={handleSkipToContent}
              className="hover:underline hidden md:inline focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-1"
            >
              Skip to Main Content
            </button>
            <span className="hidden md:inline">|</span>
            <a
              href="https://screen.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hidden md:inline"
            >
              Screen Reader Access
            </a>
            <div className="flex items-center gap-1">
              <button
                onClick={decreaseFontSize}
                className="hover:bg-white/20 px-2 py-1 rounded text-[10px] transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={resetFontSize}
                className="hover:bg-white/20 px-2 py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Reset font size"
              >
                A
              </button>
              <button
                onClick={increaseFontSize}
                className="hover:bg-white/20 px-2 py-1 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="flex items-center justify-between whitespace-nowrap px-4 sm:px-6 md:px-8 lg:px-12 py-3 sticky top-0 bg-surface-light/80 dark:bg-background-dark/80 backdrop-blur-sm z-50 border-b border-border-light dark:border-border-dark/50">
        <div className="flex items-center gap-4 md:gap-6">
          <Link className="flex items-center gap-2 sm:gap-3" href="/">
            {/* CPCB Logo */}
            <Image
              src="/cpcb-logo.png"
              alt="CPCB Logo"
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white p-0.5"
            />
            <div className="flex flex-col">
              <span className="text-primary-light-theme dark:text-primary text-sm sm:text-lg font-bold leading-tight">Central Control Room</span>
              <span className="text-text-muted-light dark:text-text-muted text-[10px] sm:text-xs">Air Quality Management - Delhi NCR</span>
            </div>
          </Link>
          <div className="relative hidden lg:flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-text-muted-light dark:text-text-muted">search</span>
            <input className="bg-background-light dark:bg-surface-dark/80 border border-border-light dark:border-border-dark rounded-lg py-2 pl-10 pr-4 text-text-dark dark:text-text-light placeholder-text-muted-light dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light-theme/50 dark:focus:ring-primary/50 w-64 lg:w-80" placeholder="Search any location..." type="text" />
            <span className="material-symbols-outlined absolute right-3 text-text-muted-light dark:text-text-muted cursor-pointer hover:text-primary-light-theme dark:hover:text-primary">my_location</span>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium leading-normal rounded-lg transition-all ${isActive(link.href)
                  ? 'text-primary-light-theme dark:text-primary bg-primary-light-theme/10 dark:bg-primary/10'
                  : 'text-text-muted-light dark:text-text-muted hover:text-primary-light-theme dark:hover:text-primary hover:bg-primary-light-theme/5 dark:hover:bg-primary/5'
                  }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary-light-theme dark:bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="hidden sm:flex items-center justify-center p-2 rounded-full bg-background-light dark:bg-surface-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors"
              aria-label="View notifications"
            >
              <span className="material-symbols-outlined text-text-dark dark:text-text-light">notifications</span>
            </button>
            <button
              className="flex items-center justify-center p-2 rounded-full bg-background-light dark:bg-surface-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <span className="material-symbols-outlined text-text-dark dark:text-text-light">light_mode</span>
              ) : (
                <span className="material-symbols-outlined text-text-dark dark:text-text-light">dark_mode</span>
              )}
            </button>
            <button
              className="md:hidden flex items-center justify-center p-2 rounded-full bg-background-light dark:bg-surface-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined text-text-dark dark:text-text-light">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-surface-light dark:bg-surface-dark z-50 shadow-2xl transform transition-transform duration-300 ease-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <span className="text-lg font-bold text-text-dark dark:text-white">Menu</span>
          <button
            className="flex items-center justify-center p-2 rounded-full hover:bg-border-light dark:hover:bg-border-dark transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <span className="material-symbols-outlined text-text-dark dark:text-text-light">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col p-4 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive(link.href)
                ? 'text-primary-light-theme dark:text-primary bg-primary-light-theme/10 dark:bg-primary/10'
                : 'text-text-dark dark:text-white hover:bg-border-light/50 dark:hover:bg-border-dark/50'
                }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Additional Actions */}
        <div className="p-4 border-t border-border-light dark:border-border-dark mt-auto">
          <div className="flex flex-col gap-2">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-text-dark dark:text-white hover:bg-border-light/50 dark:hover:bg-border-dark/50 transition-all">
              <span className="material-symbols-outlined">notifications</span>
              Notifications
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-text-dark dark:text-white hover:bg-border-light/50 dark:hover:bg-border-dark/50 transition-all"
            >
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
