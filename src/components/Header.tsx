import React, { useState } from 'react';
import {
  Flame,
  Database,
  Search,
  Plus,
  HelpCircle,
  Info,
  Menu,
  X as CloseIcon,
} from 'lucide-react';
import { BidzoLogo } from './BidzoLogo';

interface HeaderProps {
  onlineCount: number;
  visitorCount: number;
  onOpenClaimModal: () => void;
  onOpenRulesModal: () => void;
  onOpenAboutModal: () => void;
  onSelectNav: (nav: 'daily' | 'categories') => void;
  activeNav: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onlineCount,
  visitorCount,
  onOpenClaimModal,
  onOpenRulesModal,
  onOpenAboutModal,
  onSelectNav,
  activeNav,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  setIsSearchOpen,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
      {/* Slim 56px single header bar */}
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Logo + Nav items neatly aligned */}
        <div className="flex items-center gap-6 lg:gap-8">
          <a
            href="/"
            className="group flex items-center transition-opacity hover:opacity-95"
            aria-label="Bidzo Homepage"
          >
            <BidzoLogo size="md" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1.5 md:flex font-sans">
            {/* ... navigation buttons ... */}
            <button
              onClick={() => onSelectNav('daily')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeNav === 'daily'
                  ? 'bg-slate-100 text-slate-900 border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => onSelectNav('categories')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeNav === 'categories'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Categories
            </button>
            <button
              onClick={onOpenRulesModal}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Rules
            </button>
            <button
              onClick={onOpenAboutModal}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              About
            </button>
          </nav>
        </div>

        {/* Center / Stats (desktop only, subtle & compact) */}
        <div className="hidden lg:flex items-center gap-3 font-sans text-xs text-slate-500">
          {/* ... existing stats ... */}
           {/* Live Online Users */}
          <div className="flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {onlineCount}
            </span>
            <span className="text-slate-500">online</span>
          </div>

          <span className="text-slate-300">&middot;</span>

          {/* Daily Visitors */}
          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {visitorCount.toLocaleString()}
            </span>
            <span className="text-slate-500">visitors</span>
          </div>

          <span className="text-slate-300">&middot;</span>
        </div>
        
        {/* Right Actions: Search + Claim Rank CTA + Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Toggle */}
          <div className="relative font-sans">
            {isSearchOpen ? (
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search creator, product..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  className="w-40 sm:w-56 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 transition-all focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    onSearchChange('');
                  }}
                  className="ml-1 text-xs text-slate-400 hover:text-slate-700 p-1"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                title="Search bids"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Primary CTA: Claim Rank Button */}
          <button
            onClick={onOpenClaimModal}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-blue-700 active:scale-95 font-sans"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Claim Rank</span>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 md:hidden transition-colors hover:text-slate-900 shadow-2xs"
          >
            {mobileMenuOpen ? <CloseIcon className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden font-sans space-y-2 shadow-sm animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-wrap items-center gap-1 pb-2 border-b border-slate-100">
            <button
              onClick={() => {
                onSelectNav('daily');
                setMobileMenuOpen(false);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                activeNav === 'daily'
                  ? 'bg-slate-100 text-slate-900 border border-slate-200'
                  : 'text-slate-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => {
                onSelectNav('categories');
                setMobileMenuOpen(false);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                activeNav === 'categories'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => {
                onOpenRulesModal();
                setMobileMenuOpen(false);
              }}
              className="rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Rules
            </button>
            <button
              onClick={() => {
                onOpenAboutModal();
                setMobileMenuOpen(false);
              }}
              className="rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              About
            </button>
          </div>

          {/* Mobile quick telemetry bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
              </span>
              <span className="font-mono font-semibold text-slate-900">{onlineCount}</span>
              <span>online</span>
              <span className="text-slate-300">&middot;</span>
              <span className="font-mono font-semibold text-slate-900">{visitorCount.toLocaleString()}</span>
              <span>visitors</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

