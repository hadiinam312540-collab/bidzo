import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Flame,
  Globe,
  Crown,
  MousePointerClick,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Check,
} from 'lucide-react';
import { BidEntry, Platform } from '../types';

interface LeaderboardProps {
  bids: BidEntry[];
  todayBids: BidEntry[];
  onOutbidEntry: (entry: BidEntry) => void;
  onRecordClick: (bidId: string, url: string) => void;
  onSeeAllToday: () => void;
  onShareEntry?: (entry: BidEntry, rank: number) => void;
  isLoading?: boolean;
}

// Utility to reliably extract clean domain/hostname from any URL or handle
export function extractDomain(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host.includes('.') || host === 'localhost') {
      return host;
    }
    return null;
  } catch {
    const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i);
    return match ? match[1].toLowerCase() : null;
  }
}

// High-quality Dynamic Domain Favicon / Logo component for SaaS Directory UI
export const DomainFaviconLogo: React.FC<{
  url?: string;
  name: string;
  fallbackAvatar?: string;
  isVerified?: boolean;
  sizeClass?: string;
  imgSizeClass?: string;
  className?: string;
}> = ({
  url,
  name,
  fallbackAvatar,
  isVerified = false,
  sizeClass = 'w-12 h-12',
  imgSizeClass = 'h-7 w-7',
  className = '',
}) => {
  const domain = extractDomain(url);

  // Fallback stages:
  // 0: Google Favicon service (128px high-res)
  // 1: Icon Horse service
  // 2: Provided avatar_url
  // 3: Clean initial-letter avatar
  const initialStage = domain ? 0 : fallbackAvatar ? 2 : 3;
  const [stage, setStage] = useState<number>(initialStage);

  useEffect(() => {
    setStage(domain ? 0 : fallbackAvatar ? 2 : 3);
  }, [domain, fallbackAvatar]);

  const handleImgError = () => {
    setStage((prev) => {
      if (prev === 0) return 1; // Try icon.horse
      if (prev === 1 && fallbackAvatar) return 2; // Try fallback avatar
      return 3; // Fallback to initials
    });
  };

  const initials = useMemo(() => {
    const clean = name.trim();
    if (!clean) return '•';
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }, [name]);

  let currentSrc: string | null = null;
  if (stage === 0 && domain) {
    currentSrc = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } else if (stage === 1 && domain) {
    currentSrc = `https://icon.horse/icon/${domain}`;
  } else if (stage === 2 && fallbackAvatar) {
    currentSrc = fallbackAvatar;
  }

  return (
    <div
      className={`relative ${sizeClass} rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 p-1.5 shadow-2xs group-hover:border-slate-300 transition-all transform-gpu ${className}`}
    >
      {currentSrc && stage < 3 ? (
        <img
          src={currentSrc}
          alt={`${domain || name} logo`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleImgError}
          className={`${imgSizeClass} object-contain transition-transform duration-200 group-hover:scale-105`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 border border-blue-200/60 shadow-inner select-none">
          {initials}
        </div>
      )}

      {isVerified && (
        <div
          title="Verified Sponsor"
          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xs ring-1.5 ring-white"
        >
          <ShieldCheck className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  );
};

// Platform icon helper
export const PlatformIcon: React.FC<{ platform: Platform; className?: string }> = ({
  platform,
  className = 'w-3.5 h-3.5',
}) => {
  switch (platform) {
    case 'x':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#EF4444">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    case 'github':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case 'website':
    default:
      return <Globe className={className} />;
  }
};

// Relative time helper
function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'recently';
  }
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  bids,
  todayBids,
  onOutbidEntry,
  onRecordClick,
  onSeeAllToday,
  onShareEntry,
  isLoading = false,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [copiedBidId, setCopiedBidId] = useState<string | null>(null);

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const handleCardLinkClick = (e: React.MouseEvent, bid: BidEntry) => {
    onRecordClick(bid.id, bid.product_url);
  };

  const handleShareBid = async (e: React.MouseEvent, bid: BidEntry, rank: number) => {
    e.stopPropagation();
    e.preventDefault();

    // Construct deep-linked URL to this specific bidder
    const url = new URL(window.location.href);
    url.searchParams.set('bid', bid.id);
    url.hash = `bid-${bid.id}`;
    const shareUrl = url.toString();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedBidId(bid.id);
      setTimeout(() => {
        setCopiedBidId((current) => (current === bid.id ? null : current));
      }, 2200);

      if (onShareEntry) {
        onShareEntry(bid, rank);
      }
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Leaderboard Column (8 cols) */}
        <div className="lg:col-span-8">
          <div className="mb-3.5 flex items-center justify-between font-sans">
            <div>
              <h2 className="font-heading text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Live Leaderboard
              </h2>
              <p className="text-xs text-slate-500">
                Sorted strictly by bid value. Outbid anyone in real-time.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime active</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 w-full animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : bids.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white font-sans shadow-2xs">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <Crown className="h-6 w-6" />
              </div>
              <p className="font-heading text-base font-bold text-slate-900">
                Leaderboard is empty
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No active bids recorded in Supabase. Be the very first maker to claim Rank #1!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {bids.map((bid, index) => {
                  const rank = index + 1;
                  const isNumberOne = rank === 1;
                  const isNumberTwo = rank === 2;
                  const isNumberThree = rank === 3;
                  const hasImageError = imageErrors[bid.id];

                  // Smooth clean animation classes for top 3
                  let cardRankClasses = 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs';
                  if (isNumberOne) {
                    cardRankClasses = 'animate-rank1-ambient border-blue-600 bg-gradient-to-r from-blue-50/60 via-white to-white shadow-sm shadow-blue-600/12 hover:border-blue-700';
                  } else if (isNumberTwo) {
                    cardRankClasses = 'animate-rank2-ambient border-slate-300 bg-white shadow-2xs hover:border-slate-400';
                  } else if (isNumberThree) {
                    cardRankClasses = 'animate-rank3-ambient border-amber-300 bg-white shadow-2xs hover:border-amber-400';
                  }

                  return (
                    <motion.article
                      key={bid.id}
                      id={`bid-${bid.id}`}
                      layout="position"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      whileHover={{
                        scale: 1.012,
                        y: -2,
                        zIndex: 10,
                        boxShadow: isNumberOne
                          ? '0 16px 32px -4px rgba(37, 99, 235, 0.22), 0 8px 16px -4px rgba(37, 99, 235, 0.12)'
                          : isNumberTwo
                          ? '0 14px 28px -4px rgba(71, 85, 105, 0.16), 0 8px 14px -4px rgba(71, 85, 105, 0.08)'
                          : isNumberThree
                          ? '0 14px 28px -4px rgba(217, 119, 6, 0.18), 0 8px 14px -4px rgba(217, 119, 6, 0.10)'
                          : '0 14px 28px -4px rgba(15, 23, 42, 0.08), 0 6px 12px -4px rgba(15, 23, 42, 0.04)',
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 26,
                        },
                      }}
                      whileTap={{ scale: 0.996 }}
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 32,
                        mass: 0.8,
                      }}
                      className={`group relative overflow-hidden rounded-2xl border transition-colors duration-200 transform-gpu will-change-transform ${cardRankClasses}`}
                    >
                      {/* Shimmer specular sweep on top 3 */}
                      {isNumberOne && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 -z-0 opacity-20 bg-gradient-to-r from-transparent via-blue-500/25 to-transparent animate-card-shimmer"
                        />
                      )}
                      {isNumberTwo && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 -z-0 opacity-15 bg-gradient-to-r from-transparent via-slate-400/30 to-transparent animate-card-shimmer"
                        />
                      )}
                      {isNumberThree && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 -z-0 opacity-15 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent animate-card-shimmer"
                        />
                      )}

                      <div className="relative z-10 flex flex-col gap-3.5 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                        {/* Left: Clean Rank Number + Domain Logo + Directory Hierarchy */}
                        <div className="flex items-start gap-3 sm:items-center sm:gap-3 min-w-0 flex-1">
                          {/* Clean unboxed rank typography */}
                          <div
                            className={`shrink-0 select-none text-left font-mono font-black tabular-nums transition-transform duration-200 group-hover:scale-105 ${
                              isNumberOne
                                ? 'text-2xl sm:text-3xl font-extrabold text-blue-600 drop-shadow-xs'
                                : isNumberTwo
                                ? 'text-xl sm:text-2xl font-bold text-slate-900'
                                : isNumberThree
                                ? 'text-xl sm:text-2xl font-bold text-amber-600'
                                : 'text-lg sm:text-xl font-bold text-slate-400'
                            }`}
                            aria-label={`Rank ${rank}`}
                          >
                            #{rank}
                          </div>

                          {/* Domain Logo / Favicon Container */}
                          {(() => {
                            const targetUrl = (bid as any).profile_url || bid.product_url || '';
                            const domain = extractDomain(targetUrl);
                            return (
                              <>
                                <DomainFaviconLogo
                                  url={targetUrl}
                                  name={bid.user_name}
                                  fallbackAvatar={bid.avatar_url}
                                  isVerified={bid.is_verified}
                                  sizeClass="w-12 h-12"
                                  imgSizeClass="h-7 w-7"
                                />

                                {/* Title & SaaS Directory Hierarchy */}
                                <div className="min-w-0 flex-1 font-sans">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <a
                                      href={bid.product_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => handleCardLinkClick(e, bid)}
                                      className="group/link flex items-center gap-1 font-heading text-sm sm:text-base font-bold text-slate-900 transition-colors hover:text-blue-600"
                                    >
                                      <span className="truncate">{bid.user_name}</span>
                                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-70 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 group-hover/link:opacity-100 group-hover/link:text-blue-600" />
                                    </a>

                                    {/* Clean domain hostname tag if extracted */}
                                    {domain && (
                                      <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:inline-flex">
                                        <Globe className="h-2.5 w-2.5 text-slate-400" />
                                        <span>{domain}</span>
                                      </span>
                                    )}

                                    {/* Category tag pill */}
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                      {bid.category}
                                    </span>
                                  </div>

                                  {/* Directory description / pitch snippet */}
                                  {bid.message && (
                                    <p className="mt-1 line-clamp-1 sm:line-clamp-2 text-xs leading-relaxed text-slate-600">
                                      {bid.message}
                                    </p>
                                  )}

                                  {/* Directory metadata row: Platform handle · Clicks · Time */}
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    {/* Social Handle Badge */}
                                    <a
                                      href={
                                        bid.handle.startsWith('http')
                                          ? bid.handle
                                          : `https://x.com/${bid.handle.replace('@', '')}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-100"
                                    >
                                      <PlatformIcon platform={bid.platform} className="h-2.5 w-2.5 text-slate-500" />
                                      <span>{bid.handle}</span>
                                    </a>

                                    <span>·</span>

                                    {/* Click stats */}
                                    <span className="flex items-center gap-1 font-mono tabular-nums text-[11px] text-slate-500">
                                      <MousePointerClick className="h-3 w-3 text-blue-600" />
                                      <span>{(bid.clicks || 0).toLocaleString()} clicks</span>
                                    </span>

                                    <span>·</span>

                                    {/* Timestamp */}
                                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatTimeAgo(bid.created_at)}</span>
                                    </span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Right: Bid Amount, Outbid & Share Actions */}
                        <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 sm:flex-col sm:items-end sm:border-0 sm:pt-0 font-sans">
                          <div className="flex flex-col sm:items-end">
                            <span className="text-[10px] font-medium text-slate-500">
                              Current Bid
                            </span>
                            <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                              ${bid.amount}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1.5">
                            {/* Share deep link button */}
                            <button
                              onClick={(e) => handleShareBid(e, bid, rank)}
                              title={`Copy deep link to #${rank} ${bid.user_name}`}
                              aria-label={`Share link to #${rank} ${bid.user_name}`}
                              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all transform-gpu active:scale-90 ${
                                copiedBidId === bid.id
                                  ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-2xs'
                                  : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              {copiedBidId === bid.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="font-semibold text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="h-3 w-3" />
                                  <span>Share</span>
                                </>
                              )}
                            </button>

                            {/* Outbid Action Button */}
                            <button
                              onClick={() => onOutbidEntry(bid)}
                              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all transform-gpu active:scale-95 ${
                                isNumberOne
                                  ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                                  : 'border border-slate-200 bg-white text-slate-800 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              <Sparkles className="h-3 w-3 text-blue-600 group-hover:text-blue-700" />
                              <span>Outbid (${bid.amount + 1})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Side Widget Column (4 cols) */}
        <div className="space-y-4 lg:col-span-4 font-sans">
          {/* Today's Ranking Preview Widget */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-blue-600" />
                <h3 className="font-heading text-sm font-bold text-slate-900">
                  Today's Ranking
                </h3>
              </div>
              <button
                onClick={onSeeAllToday}
                className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                See all →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {todayBids.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No bids recorded today yet.
                </div>
              ) : (
                todayBids.slice(0, 5).map((bid, idx) => {
                const targetUrl = (bid as any).profile_url || bid.product_url || '';
                return (
                  <div key={bid.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                          idx === 0
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <DomainFaviconLogo
                        url={targetUrl}
                        name={bid.user_name}
                        fallbackAvatar={bid.avatar_url}
                        sizeClass="w-7 h-7"
                        imgSizeClass="h-4 w-4"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {bid.user_name}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {bid.category} · {(bid.clicks || 0)} clicks
                        </p>
                      </div>
                    </div>

                    <span className="ml-2 font-heading text-xs font-bold text-blue-600 tabular-nums">
                      ${bid.amount}
                    </span>
                  </div>
                );
              })
              )}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Daily resets in</span>
                <span className="font-mono font-semibold text-slate-800">
                  13h 26m
                </span>
              </div>
            </div>
          </div>

          {/* Value Proposition Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-2xs">
            <h4 className="font-heading text-xs font-bold text-slate-900">
              Why rank on Bidzo?
            </h4>
            <ul className="mt-2.5 space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>
                  <strong className="text-slate-900">High-Intent Eyes:</strong> 45,000+ daily makers & founders scouring tools.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>
                  <strong className="text-slate-900">Direct Clicks:</strong> Every click routes straight to your landing page.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>
                  <strong className="text-slate-900">Instant Edge:</strong> Outbid rivals with live 60fps re-ranking.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
