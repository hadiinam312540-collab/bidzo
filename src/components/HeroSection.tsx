import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { Category, TimeFilter, BidEntry } from '../types';
import { CATEGORIES } from './CategoryBar';

interface HeroSectionProps {
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  topBidAmount: number;
  topBidderName?: string;
  activeCategory?: string;
  onClaimRank: (initialData: {
    amount: number;
    target: string;
    category: Category;
  }) => void;
  bids: BidEntry[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  timeFilter,
  onTimeFilterChange,
  topBidAmount,
  topBidderName,
  activeCategory = 'All',
  onClaimRank,
  bids,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    activeCategory && activeCategory !== 'All' && activeCategory !== 'Explore'
      ? (activeCategory as Category)
      : 'Marketing'
  );

  // Sync selectedCategory when activeCategory changes from outside
  useEffect(() => {
    if (activeCategory && activeCategory !== 'All' && activeCategory !== 'Explore') {
      setSelectedCategory(activeCategory as Category);
    }
  }, [activeCategory]);

  // Determine current active category
  const currentCategory = selectedCategory;

  // 1. Dynamic Base Bid Logic: Check the highest bid in the database for the active category
  const categoryBids = React.useMemo(() => {
    if (currentCategory && currentCategory !== 'All' && currentCategory !== 'Explore') {
      return bids.filter(
        (b) => b.category.toLowerCase() === currentCategory.toLowerCase()
      );
    }
    return bids;
  }, [bids, currentCategory]);

  // Check highest bid in database for active category (0 if no bids exist / empty state)
  const categoryHighestBid = React.useMemo(() => {
    if (categoryBids.length === 0) return 0;
    return Math.max(...categoryBids.map((b) => b.amount));
  }, [categoryBids]);

  const categoryTopBidder = React.useMemo(() => {
    if (categoryBids.length === 0) return undefined;
    return categoryBids.reduce(
      (prev, curr) => (curr.amount > prev.amount ? curr : prev),
      categoryBids[0]
    );
  }, [categoryBids]);

  // IF no bids exist (0 total / empty state): Set default "Claim #1" bid price to $1.
  // IF bids exist (highest bid = $X): Set default "Claim #1" bid price dynamically to $(X + 1).
  const defaultClaimPrice = categoryHighestBid > 0 ? categoryHighestBid + 1 : 1;

  const [bidAmount, setBidAmount] = useState<number>(defaultClaimPrice);
  const [productTarget, setProductTarget] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');

  // Sync default bid price whenever category or highest bid in category changes
  useEffect(() => {
    setBidAmount(categoryHighestBid > 0 ? categoryHighestBid + 1 : 1);
  }, [categoryHighestBid, currentCategory]);

  // Stepper increment / decrement (min $1, removed hardcoded $5 default)
  const handleIncrement = (delta: number) => {
    setBidAmount((prev) => Math.max(prev + delta, 1));
  };

  // "+$1 (Beats #1)" button sets bid to ($X + 1) or $1 if empty
  const handleSetBeatsNumberOne = () => {
    setBidAmount(categoryHighestBid > 0 ? categoryHighestBid + 1 : 1);
  };

  const calculateTargetRank = (amount: number) => {
    const higherCount = categoryBids.filter((b) => b.amount >= amount).length;
    return higherCount + 1;
  };

  const prospectiveRank = calculateTargetRank(bidAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTarget.trim()) {
      setInputError('Please enter your product URL or @handle');
      return;
    }
    setInputError('');
    onClaimRank({
      amount: bidAmount,
      target: productTarget.trim(),
      category: selectedCategory,
    });
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-4 sm:py-6">
      {/* Background soft electric blue highlight glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-72 w-full max-w-2xl -translate-x-1/2 bg-gradient-to-b from-blue-50/80 via-blue-50/30 to-transparent blur-3xl transform-gpu"
      />

      <div className="flex flex-col items-center text-center">
        {/* Toggle pill switch: "All-time" vs "Today" */}
        <div className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white p-1 font-sans shadow-2xs">
          <button
            onClick={() => onTimeFilterChange('all-time')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-150 transform-gpu ${
              timeFilter === 'all-time'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>All-time</span>
          </button>
          <button
            onClick={() => onTimeFilterChange('today')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-150 transform-gpu ${
              timeFilter === 'today'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Today</span>
          </button>
        </div>

        {/* Headline: Claim #1 for $[Amount] with stepper buttons */}
        <div className="relative mb-2.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5">
          <h1 className="font-heading text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-[42px]">
            Claim <span className="text-blue-600">#1</span> for
          </h1>

          {/* Dynamic interactive amount pill with increment/decrement */}
          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-2 py-0.5 shadow-2xs transition-all hover:border-blue-500/60">
            <button
              type="button"
              onClick={() => handleIncrement(bidAmount <= 5 ? -1 : -5)}
              disabled={bidAmount <= 1}
              title="Decrease bid"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transform-gpu"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center px-1">
              <span className="font-heading text-2xl font-black text-blue-600 sm:text-3xl lg:text-4xl tabular-nums tracking-tight">
                ${bidAmount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleIncrement(bidAmount < 5 ? 1 : 5)}
              title="Increase bid"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 active:scale-95 transform-gpu"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick increment chips & rank prediction */}
        <div className="mb-5 flex flex-wrap items-center justify-center gap-1.5 text-xs font-sans">
          <span className="text-slate-500">Quick adjust:</span>
          {/* "+$1 (Beats #1)" button sets bid to (X + 1) or $1 if empty */}
          <button
            type="button"
            onClick={handleSetBeatsNumberOne}
            className="rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-300 active:scale-95 shadow-2xs transform-gpu"
          >
            +$1 (Beats #1)
          </button>
          {[
            { label: '+$5', delta: 5 },
            { label: '+$10', delta: 10 },
            { label: '+$50', delta: 50 },
            { label: '+$100', delta: 100 },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleIncrement(chip.delta)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 active:scale-95 shadow-2xs transform-gpu"
            >
              {chip.label}
            </button>
          ))}

          <span className="mx-1 text-slate-300">|</span>

          {/* Predictive Rank Indicator */}
          <div className="inline-flex items-center gap-1.5 font-medium text-slate-600">
            {prospectiveRank === 1 ? (
              <>
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-semibold text-emerald-600">
                  Guarantees #1 Spot
                </span>
                <span className="text-slate-500">
                  {categoryTopBidder && categoryHighestBid > 0
                    ? `(beats ${categoryTopBidder.user_name} at $${categoryHighestBid})`
                    : '(first maker to claim #1!)'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-slate-900">
                  Secures Rank #{prospectiveRank} on leaderboard
                </span>
              </>
            )}
          </div>
        </div>

        {/* Inline interactive submission form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-2 shadow-sm font-sans transition-all duration-200"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* a) Text Input: "Your product URL or @handle" */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Your product URL or @handle (e.g. https://myproduct.com)"
                value={productTarget}
                onChange={(e) => {
                  setProductTarget(e.target.value);
                  if (inputError) setInputError('');
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* b) Dropdown: "Choose a category" */}
            <div className="relative sm:w-40">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Category)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-xs font-semibold text-slate-900 transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {CATEGORIES.filter((c) => c !== 'All' && c !== 'Explore').map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* c) Primary CTA: Prominent rounded blue "Claim rank" button */}
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all duration-150 hover:bg-blue-700 active:scale-95 transform-gpu sm:w-auto"
            >
              <span>Claim rank</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {inputError && (
            <p className="mt-2 text-left px-3 text-xs font-medium text-rose-500">
              {inputError}
            </p>
          )}
        </form>

        {/* Micro-subtext */}
        <p className="mt-2.5 text-[11px] sm:text-xs text-slate-500 font-sans">
          Instant placement &bull; Real-time click tracking &bull; High-intent discovery &bull; Rank #1 instantly on Bidzo
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
