import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Crown,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Check,
  ArrowRight,
  Plus,
  Minus,
  Coins,
  Zap,
  Loader2,
} from 'lucide-react';
import { Category, Platform, BidEntry } from '../types';
import { CATEGORIES } from './CategoryBar';
import { PlatformIcon } from './Leaderboard';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitBid: (bid: {
    user_name: string;
    handle: string;
    platform: Platform;
    message: string;
    amount: number;
    category: string;
    product_url: string;
  }) => Promise<void>;
  initialAmount?: number;
  initialTarget?: string;
  initialCategory?: Category;
  highestBid: number;
  bids: BidEntry[];
  onOpenTerms?: () => void;
}

export const BidModal: React.FC<BidModalProps> = ({
  isOpen,
  onClose,
  onSubmitBid,
  initialAmount,
  initialTarget = '',
  initialCategory = 'Marketing',
  highestBid,
  bids,
  onOpenTerms,
}) => {
  const [amount, setAmount] = useState<number>(
    initialAmount || (highestBid > 0 ? highestBid + 1 : 1)
  );
  const [userName, setUserName] = useState<string>('');
  const [productUrl, setProductUrl] = useState<string>(initialTarget);
  const [handle, setHandle] = useState<string>('');
  const [platform, setPlatform] = useState<Platform>('website');
  const [category, setCategory] = useState<Category>(initialCategory);
  const [message, setMessage] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'instant'>('card');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setCategory(initialCategory);
      }
      if (initialAmount) {
        setAmount(initialAmount);
      } else {
        setAmount(highestBid > 0 ? highestBid + 1 : 1);
      }
      if (initialTarget) {
        setProductUrl(initialTarget);
        if (initialTarget.startsWith('@')) {
          setHandle(initialTarget);
          setUserName(initialTarget.replace('@', ''));
          setPlatform('x');
        } else if (initialTarget.includes('http')) {
          try {
            const host = new URL(initialTarget).hostname.replace('www.', '');
            setUserName(host.charAt(0).toUpperCase() + host.slice(1).split('.')[0]);
          } catch {
            // ignore
          }
        }
      }
      setStep('details');
      setErrorMsg('');
      setAgreedToTerms(false);
    }
  }, [isOpen, initialAmount, initialTarget, initialCategory, highestBid]);

  if (!isOpen) return null;

  const calculateRank = (amt: number) => {
    const higherCount = bids.filter((b) => b.amount >= amt).length;
    return higherCount + 1;
  };

  const predictedRank = calculateRank(amount);

  const handleAdjust = (delta: number) => {
    setAmount((prev) => Math.max(prev + delta, 1));
  };

  const handleProceedToPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg('Please enter your product or brand name.');
      return;
    }
    if (!productUrl.trim()) {
      setErrorMsg('Please enter your destination product URL.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('Bid amount must be at least $1.');
      return;
    }

    setErrorMsg('');
    setStep('payment');
  };

  const handleFinalClaim = async () => {
    if (!agreedToTerms) {
      setErrorMsg('Please agree to the Terms & Conditions and acknowledge that bids are non-refundable.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      let finalUrl = productUrl.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }

      let finalHandle = handle.trim() || `@${userName.toLowerCase().replace(/\s+/g, '')}`;
      if (!finalHandle.startsWith('@') && platform !== 'website') {
        finalHandle = `@${finalHandle}`;
      }

      // Dynamically provide window.location.origin so AtexPay redirects back to current domain
      const clientOrigin = typeof window !== 'undefined' ? window.location.origin : '';

      // Determine candidate API endpoints: support Netlify serverless functions and backend routes
      const isNetlify =
        typeof window !== 'undefined' &&
        (window.location.hostname.includes('netlify.app') ||
          window.location.pathname.startsWith('/.netlify'));

      const candidateEndpoints = [
        isNetlify ? '/.netlify/functions/create-checkout' : '/api/create-checkout',
        '/.netlify/functions/create-checkout',
        '/api/atexpay',
        '/api/create-checkout',
      ].filter((val, idx, self) => self.indexOf(val) === idx);

      const payload = {
        amount,
        profile_url: finalUrl,
        message: message.trim() || 'Claimed position on Bidzo',
        category,
        payment_method: paymentMethod,
        user_name: userName.trim(),
        handle: finalHandle,
        platform,
        origin: clientOrigin,
      };

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      let response: Response | null = null;
      let contentType: string | null = null;
      let lastEndpoint = candidateEndpoints[0];

      // Check endpoints in order until a valid JSON response is received
      for (const endpoint of candidateEndpoints) {
        lastEndpoint = endpoint;
        try {
          const res = await fetch(endpoint, options);
          const ct = res.headers.get('content-type');
          if (ct && ct.includes('application/json')) {
            response = res;
            contentType = ct;
            break;
          }
          // Save the response in case all endpoints return non-JSON
          response = res;
          contentType = ct;
        } catch {
          // If network fetch fails on this endpoint, try next candidate
          continue;
        }
      }

      if (!response) {
        throw new Error('Server returned HTML/non-JSON error. Check API endpoint & Netlify env keys.');
      }

      // Safe response parsing: Ensure server did not return HTML (e.g. 404/500/SPA rewrite) instead of JSON
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn(`[Checkout] Server returned HTML/non-JSON error from ${lastEndpoint}:`, text.slice(0, 150));
        throw new Error('Server returned HTML/non-JSON error. Check API endpoint & Netlify env keys.');
      }

      const checkoutData = await response.json();

      if (!checkoutData.success) {
        throw new Error(checkoutData.error || 'Failed to initiate AtexPay checkout session.');
      }

      const checkoutUrl = checkoutData.checkout_url || checkoutData.payment_url;
      if (checkoutUrl) {
        // Automatically redirect user to the returned AtexPay payment URL
        window.location.href = checkoutUrl;
        return;
      }

      // Fallback submission if no checkout URL returned
      await onSubmitBid({
        user_name: userName.trim(),
        handle: finalHandle,
        platform,
        message: message.trim() || 'Claimed position on Bidzo',
        amount,
        category,
        product_url: finalUrl,
      });

      // Celebration confetti with Electric Blue theme colors
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#3B82F6', '#60A5FA', '#10B981', '#0F172A'],
      });

      setStep('success');
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to initialize AtexPay checkout.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transform-gpu"
          />

          {/* Compact Dialog Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.22, bounce: 0 }}
            className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6 text-slate-900 transform-gpu will-change-transform"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {step === 'details' && (
              <div>
                {/* Header */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
                    <Crown className="h-3 w-3" />
                    <span>Instant Pay-to-Rank Placement</span>
                  </div>
                  <h3 className="mt-1.5 font-heading text-xl font-bold tracking-tight text-slate-900">
                    Claim Your Rank
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Set your bid and place your product link in front of 45,000+ daily visitors on Bidzo.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-600">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleProceedToPay} className="space-y-3">
                  {/* Product Name */}
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Product / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SuperAgent OS"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Product URL */}
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Destination URL *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://yourproduct.com"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Category & Platform row */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        {CATEGORIES.filter((c) => c !== 'All' && c !== 'Explore').map((cat) => (
                          <option key={cat} value={cat} className="bg-white text-slate-900">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        Platform
                      </label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value as Platform)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="website" className="bg-white text-slate-900">Website</option>
                        <option value="x" className="bg-white text-slate-900">Twitter / X</option>
                        <option value="youtube" className="bg-white text-slate-900">YouTube</option>
                        <option value="tiktok" className="bg-white text-slate-900">TikTok</option>
                        <option value="instagram" className="bg-white text-slate-900">Instagram</option>
                        <option value="github" className="bg-white text-slate-900">GitHub</option>
                      </select>
                    </div>
                  </div>

                  {/* Handle */}
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Handle or Creator Link
                    </label>
                    <input
                      type="text"
                      placeholder="@yourhandle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Pitch snippet */}
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        Short Pitch / Snippet
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {message.length}/120
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={120}
                      placeholder="One sentence pitch (e.g. AI-powered code generator)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Bid Stepper & Predicted Rank Box */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-900">
                          Your Bid Amount ($USD)
                        </span>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          {predictedRank === 1 ? (
                            <span className="font-semibold text-emerald-600">
                              👑 Secures Rank #1 Spot
                            </span>
                          ) : (
                            <span>Secures Rank #{predictedRank}</span>
                          )}
                        </div>
                      </div>

                      {/* Stepper buttons & input */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdjust(amount <= 5 ? -1 : -5)}
                          disabled={amount <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transform-gpu"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2 py-0.5 shadow-2xs">
                          <span className="text-xs font-bold text-blue-600">$</span>
                          <input
                            type="number"
                            min={1}
                            value={amount}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setAmount(isNaN(val) ? 1 : Math.max(1, val));
                            }}
                            className="w-14 text-center font-heading text-lg font-bold text-blue-600 tabular-nums focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdjust(amount < 5 ? 1 : 5)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transform-gpu"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick adjust chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-400 text-[10px]">Quick:</span>
                      <button
                        type="button"
                        onClick={() => setAmount(highestBid > 0 ? highestBid + 1 : 1)}
                        className="rounded-md border border-blue-200 bg-blue-50/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
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
                          onClick={() => handleAdjust(chip.delta)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all transform-gpu cursor-pointer"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div>
                {/* Payment Summary */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#16A34A]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>AtexPay Secure Checkout</span>
                  </div>
                  <h3 className="mt-1.5 font-heading text-xl font-bold tracking-tight text-[#24211F]">
                    Confirm &amp; Claim Spot
                  </h3>
                  <p className="mt-0.5 text-xs text-[#78716C]">
                    Review placement details before completing AtexPay checkout.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-600">
                    <p className="font-semibold">{errorMsg}</p>
                    {errorMsg.includes('Server returned HTML') && (
                      <div className="mt-1.5 pt-1.5 border-t border-rose-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            const clientOrigin = typeof window !== 'undefined' ? window.location.origin : '';
                            const searchParams = new URLSearchParams({
                              session_id: `atex_sess_${Date.now()}`,
                              bid_id: `bid-${Date.now()}`,
                              amount: String(amount),
                              profile_url: productUrl,
                              category,
                              name: userName,
                              handle,
                              msg: message,
                              method: paymentMethod,
                            });
                            window.location.href = `${clientOrigin}/checkout/atexpay?${searchParams.toString()}`;
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <span>Proceed via Direct Sandbox Checkout &rarr;</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 rounded-xl border border-[#EAE4DD] bg-[#F7F3EE] p-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#78716C]">Target Product:</span>
                    <span className="font-semibold text-[#24211F]">{userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716C]">Destination:</span>
                    <span className="truncate max-w-[200px] font-mono text-[#24211F]">
                      {productUrl}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716C]">Category:</span>
                    <span className="font-medium text-[#24211F]">{category}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#EAE4DD] pt-2">
                    <span className="font-semibold text-[#24211F]">
                      Target Rank:
                    </span>
                    <span className="font-bold text-[#7C3AED]">
                      Rank #{predictedRank} {predictedRank === 1 && '👑'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#24211F]">
                      Total Charge:
                    </span>
                    <span className="font-heading text-lg font-bold text-[#24211F] tabular-nums">
                      ${amount}.00
                    </span>
                  </div>
                </div>

                {/* AtexPay Payment Method Selector */}
                <div className="mt-3">
                  <label className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block mb-1.5">
                    Payment Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5 mb-1" />
                      <span className="text-[11px]">Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('crypto')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer ${
                        paymentMethod === 'crypto'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Coins className="h-3.5 w-3.5 mb-1" />
                      <span className="text-[11px]">Crypto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('instant')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer ${
                        paymentMethod === 'instant'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5 mb-1" />
                      <span className="text-[11px]">Instant</span>
                    </button>
                  </div>
                </div>

                {/* Mandatory Terms & Conditions Checkbox */}
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer text-left select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-[11.5px] leading-tight text-slate-800">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onOpenTerms) onOpenTerms();
                        }}
                        className="font-semibold text-blue-600 hover:underline underline-offset-2"
                      >
                        Terms &amp; Conditions
                      </button>{' '}
                      and understand bids are non-refundable.
                    </span>
                  </label>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setStep('details');
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalClaim}
                    disabled={isSubmitting || !agreedToTerms}
                    className="flex-[2] flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform-gpu cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Connecting to AtexPay...</span>
                      </div>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Proceed to Payment (${amount}.00)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  <Check className="h-7 w-7 stroke-[3]" />
                </div>
                <h3 className="mt-3 font-heading text-xl font-bold text-slate-900">
                  Rank #{predictedRank} Claimed!
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {userName} is now live on Bidzo with real-time click tracking enabled.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BidModal;
