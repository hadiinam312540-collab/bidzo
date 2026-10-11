import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  Compass,
  ArrowUpRight,
  Sparkles,
  Crown,
  Heart,
} from 'lucide-react';
import { BidEntry, Category, TimeFilter, Platform } from './types';
import {
  fetchLeaderboardBids,
  submitLeaderboardBid,
  recordBidClick,
  subscribeToLeaderboard,
  getSupabaseCredentials,
  saveLocalBids,
} from './lib/supabase';
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { HeroSection } from './components/HeroSection';
import { Leaderboard } from './components/Leaderboard';
import { BidModal } from './components/BidModal';
import { SupabaseModal } from './components/SupabaseModal';
import { RulesModal } from './components/RulesModal';
import { AboutModal } from './components/AboutModal';
import { TermsModal } from './components/TermsModal';
import { PrivacyModal } from './components/PrivacyModal';
import { Footer } from './components/Footer';
import { AtexPayCheckoutPage } from './components/AtexPayCheckoutPage';
import { useDesktopNotifications } from './hooks/useDesktopNotifications';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';

export default function App() {
  const [mainRef, isMainVisible] = useIntersectionObserver();
  const { hasPermission, requestPermission, sendNotification } = useDesktopNotifications();
  // Route check for direct /checkout/atexpay URL navigation
  const [isCheckoutRoute, setIsCheckoutRoute] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/checkout/atexpay');
  });

  // State
  const [bids, setBids] = useState<BidEntry[]>([]);
  const lastDeposalTime = useRef<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<'daily' | 'categories'>('daily');

  // Live status indicators
  const [onlineCount, setOnlineCount] = useState<number>(14);
  const [visitorCount, setVisitorCount] = useState<number>(3482);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Light mode high-contrast aesthetic
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Modals
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [claimPrefill, setClaimPrefill] = useState<{
    amount?: number;
    target?: string;
    category?: Category;
  }>({});
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  // Toast notification for incoming outbids
  const [liveToast, setLiveToast] = useState<{ id: string; message: string; sub?: string } | null>(null);

  // Ensure clean white high-contrast aesthetic
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('outbid_dark_mode');
    document.body.style.backgroundColor = '#FAF9F6';
  }, []);

  // Check Supabase connection state & initial load
  const loadData = async () => {
    setIsLoading(true);
    const creds = getSupabaseCredentials();
    setSupabaseConnected(creds.isConfigured);

    try {
      const bidsRes = await fetchLeaderboardBids();
      setBids(bidsRes.data);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime bids
    const unsubscribeBids = subscribeToLeaderboard((updatedBids) => {
      setBids((prev) => {
        const now = Date.now();
        const leaderChanged = updatedBids.length > 0 && prev.length > 0 && updatedBids[0].id !== prev[0].id;

        const newBids = updatedBids.map((bid, index) => {
          let isFastest = false;
          if (index === 0 && leaderChanged && lastDeposalTime.current > 0 && (now - lastDeposalTime.current < 60000)) {
            isFastest = true;
          }
          return { ...bid, is_fastest: isFastest };
        });

        // Update deposal time if leader changed
        if (leaderChanged) {
          lastDeposalTime.current = now;

          const newTop = updatedBids[0];
          triggerToast(`👑 NEW #1 RANK! ${newTop.user_name} bid $${newTop.amount}!`);
          sendNotification('👑 New #1 Bid!', {
            body: `${newTop.user_name} just took the #1 spot with a bid of $${newTop.amount}!`,
            icon: '/favicon.ico',
          });
        }
        
        return newBids;
      });
    });

    return () => {
      unsubscribeBids();
    };
  }, []);

  // Handle AtexPay payment return callbacks (?payment_success=true or ?payment_cancelled=true)
  useEffect(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      const isSuccess = search.get('payment_success') === 'true';
      const isCancelled = search.get('payment_cancelled') === 'true';
      const sessionId = search.get('session_id');

      if (isSuccess) {
        if (sessionId) {
          fetch(`/api/verify-checkout?session_id=${encodeURIComponent(sessionId)}`)
            .then((r) => r.json())
            .then(async (res) => {
              if (res?.session) {
                const s = res.session;
                await submitLeaderboardBid({
                  user_name: s.user_name,
                  handle: s.handle,
                  platform: (s.platform as Platform) || 'website',
                  message: s.message || '',
                  amount: Number(s.amount),
                  category: s.category,
                  product_url: s.profile_url,
                });
              }
              const bidsRes = await fetchLeaderboardBids();
              setBids(bidsRes.data);
            })
            .catch(() => {
              loadData();
            });
        } else {
          loadData();
        }

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#3B82F6', '#60A5FA', '#10B981', '#0F172A'],
        });
        triggerToast('👑 AtexPay Payment Confirmed! Your rank is now live on the leaderboard.');

        // Clean query parameters from URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      } else if (isCancelled) {
        triggerToast('AtexPay checkout was cancelled. No charges were made.');
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {
      // ignore
    }
  }, []);

  // Deep-link detection to smoothly scroll & highlight shared bidder
  useEffect(() => {
    if (isLoading || bids.length === 0) return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const bidParam = searchParams.get('bid');
      const hashParam = window.location.hash.startsWith('#bid-')
        ? window.location.hash.replace('#bid-', '')
        : null;
      const targetId = bidParam || hashParam;

      if (targetId) {
        const targetEntry = bids.find((b) => b.id === targetId);
        if (targetEntry) {
          if (selectedCategory !== 'All' && selectedCategory !== targetEntry.category) {
            setSelectedCategory('All');
          }
          if (searchQuery.trim()) {
            setSearchQuery('');
          }

          setTimeout(() => {
            const cardEl = document.getElementById(`bid-${targetId}`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              cardEl.classList.add('ring-2', 'ring-blue-600', 'ring-offset-2');
              setTimeout(() => {
                cardEl.classList.remove('ring-2', 'ring-blue-600', 'ring-offset-2');
              }, 3000);
            }
          }, 350);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [isLoading, bids]);

  // Organic fluctuations for live online & visitor counters
  useEffect(() => {
    const onlineInterval = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(8, Math.min(32, prev + delta));
      });
    }, 4500);

    const visitorInterval = setInterval(() => {
      setVisitorCount((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 8000);

    return () => {
      clearInterval(onlineInterval);
      clearInterval(visitorInterval);
    };
  }, []);

  const triggerToast = (message: string, sub?: string) => {
    const id = Math.random().toString();
    setLiveToast({ id, message, sub });
    setTimeout(() => {
      setLiveToast((current) => (current?.id === id ? null : current));
    }, 4500);
  };

  // Active category bids and highest bid in database for active category
  const activeCategoryBids = useMemo(() => {
    if (selectedCategory !== 'All' && selectedCategory !== 'Explore') {
      return bids.filter(
        (b) => b.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    return bids;
  }, [bids, selectedCategory]);

  const activeCategoryHighestBid = useMemo(() => {
    if (activeCategoryBids.length === 0) return 0;
    return Math.max(...activeCategoryBids.map((b) => b.amount));
  }, [activeCategoryBids]);

  const activeCategoryTopBidder = useMemo(() => {
    if (activeCategoryBids.length === 0) return undefined;
    return activeCategoryBids.reduce(
      (prev, curr) => (curr.amount > prev.amount ? curr : prev),
      activeCategoryBids[0]
    );
  }, [activeCategoryBids]);

  // Overall top bid amount across entire leaderboard
  const highestBidAmount = bids.length > 0 ? bids[0].amount : 0;
  const topBidderName = bids.length > 0 ? bids[0].user_name : undefined;

  // Filtered Bids calculation
  const filteredBids = useMemo(() => {
    let list = [...bids];

    // Time filter: 'today' only includes bids created in last 24h
    if (timeFilter === 'today') {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      list = list.filter((b) => new Date(b.created_at).getTime() >= oneDayAgo);
    }

    // Category filter
    if (selectedCategory !== 'All' && selectedCategory !== 'Explore') {
      list = list.filter(
        (b) => b.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.user_name.toLowerCase().includes(q) ||
          b.handle.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.message.toLowerCase().includes(q) ||
          b.product_url.toLowerCase().includes(q)
      );
    }

    // Sort strictly by amount descending
    return list.sort((a, b) => b.amount - a.amount);
  }, [bids, timeFilter, selectedCategory, searchQuery]);

  // Today bids for the side widget
  const todayBids = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return bids.filter((b) => new Date(b.created_at).getTime() >= oneDayAgo);
  }, [bids]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bids.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return counts;
  }, [bids]);

  // Handlers
  const handleOpenClaimModal = (prefillData?: {
    amount?: number;
    target?: string;
    category?: Category;
  }) => {
    const targetCat =
      prefillData?.category ||
      (selectedCategory !== 'All' && selectedCategory !== 'Explore'
        ? (selectedCategory as Category)
        : 'Marketing');

    const catBids = bids.filter(
      (b) => b.category.toLowerCase() === targetCat.toLowerCase()
    );
    const catHighest = catBids.length > 0 ? Math.max(...catBids.map((b) => b.amount)) : 0;

    // Dynamic Base Bid Logic:
    // IF no bids exist: default $1. IF bids exist (highest = X): default $(X + 1).
    const dynamicAmount =
      prefillData?.amount !== undefined
        ? prefillData.amount
        : (catHighest > 0 ? catHighest + 1 : 1);

    setClaimPrefill({
      ...prefillData,
      amount: dynamicAmount,
      category: targetCat,
    });
    setIsClaimModalOpen(true);
  };

  const handleOutbidEntry = (entry: BidEntry) => {
    handleOpenClaimModal({
      amount: entry.amount + 1,
      category: entry.category as Category,
    });
  };

  const handleRecordClick = async (bidId: string, url: string) => {
    // Record click count asynchronously
    await recordBidClick(bidId);
    // Locally increment clicks state for immediate responsiveness
    setBids((prev) =>
      prev.map((b) => (b.id === bidId ? { ...b, clicks: (b.clicks || 0) + 1 } : b))
    );
  };

  const handleClaimSubmit = async (bidData: {
    user_name: string;
    handle: string;
    platform: Platform;
    message: string;
    amount: number;
    category: string;
    product_url: string;
  }) => {
    await submitLeaderboardBid(bidData);
    const { data } = await fetchLeaderboardBids();
    setBids(data);
    triggerToast(`🎉 ${bidData.user_name} placed on leaderboard for $${bidData.amount}!`);
  };

  const handleSelectNav = (nav: 'daily' | 'categories') => {
    setActiveNav(nav);
    if (nav === 'daily') {
      setTimeFilter('today');
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } else if (nav === 'categories') {
      const el = document.getElementById('category-filter-dropdown');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          el.click();
        }, 350);
      } else {
        window.scrollTo({ top: 460, behavior: 'smooth' });
      }
    }
  };

  if (isCheckoutRoute) {
    return (
      <AtexPayCheckoutPage
        onBackToApp={() => {
          window.history.pushState({}, '', '/');
          setIsCheckoutRoute(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Toast Notification with GPU acceleration */}
      <AnimatePresence>
        {liveToast && (
          <motion.div
            key={liveToast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/10 transform-gpu will-change-transform"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading text-xs font-bold text-slate-900">
                {liveToast.message}
              </p>
              {liveToast.sub && (
                <p className="text-[11px] text-slate-500">{liveToast.sub}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header
        onlineCount={onlineCount}
        visitorCount={visitorCount}
        onOpenClaimModal={() => handleOpenClaimModal()}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        onSelectNav={handleSelectNav}
        activeNav={activeNav}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
      />

      <main ref={mainRef} className={`pb-10 scroll-fade-in ${isMainVisible ? 'is-visible' : ''}`}>
        {/* Hero Section & Inline Form */}
        <HeroSection
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          topBidAmount={activeCategoryHighestBid}
          topBidderName={activeCategoryTopBidder?.user_name}
          activeCategory={selectedCategory}
          onClaimRank={(initialData) =>
            handleOpenClaimModal({
              amount: initialData.amount,
              target: initialData.target,
              category: initialData.category,
            })
          }
          bids={bids}
        />

        {/* Category Filter Bar */}
        <div className="mt-2 sm:mt-3">
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Active search filter reset banner if searching */}
        {searchQuery.trim() && (
          <div className="mx-auto mt-3 flex max-w-5xl items-center justify-between px-4 sm:px-6 font-sans">
            <span className="text-xs text-slate-500">
              Showing search results for &ldquo;<strong className="text-slate-900">{searchQuery}</strong>&rdquo; ({filteredBids.length} matches)
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Leaderboard Section */}
        <Leaderboard
          bids={filteredBids}
          todayBids={todayBids}
          onOutbidEntry={handleOutbidEntry}
          onRecordClick={handleRecordClick}
          onShareEntry={(entry, rank) => {
            triggerToast(
              `🔗 Deep link copied!`,
              `Direct link to #${rank} ${entry.user_name} copied to clipboard.`
            );
          }}
          onSeeAllToday={() => {
            setTimeFilter('today');
            setSelectedCategory('All');
            window.scrollTo({ top: 380, behavior: 'smooth' });
          }}
          isLoading={isLoading}
        />
      </main>

      {/* Professional Production Footer */}
      <Footer
        onOpenTerms={() => setIsTermsModalOpen(true)}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenClaim={() => handleOpenClaimModal()}
      />

      {/* Claim / Outbid Modal */}
      <BidModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSubmitBid={handleClaimSubmit}
        initialAmount={claimPrefill.amount}
        initialTarget={claimPrefill.target}
        initialCategory={claimPrefill.category}
        highestBid={activeCategoryHighestBid}
        bids={bids}
        onOpenTerms={() => setIsTermsModalOpen(true)}
      />

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* Terms & Conditions & Refund Policy Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
