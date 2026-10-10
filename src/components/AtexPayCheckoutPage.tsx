import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe,
  Tag,
  Coins,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AtexPayCheckoutPageProps {
  onBackToApp?: () => void;
}

export const AtexPayCheckoutPage: React.FC<AtexPayCheckoutPageProps> = ({ onBackToApp }) => {
  const [params, setParams] = useState({
    sessionId: '',
    bidId: '',
    amount: 25,
    profileUrl: 'https://bidzo.app',
    category: 'Productivity',
    name: 'Builder',
    handle: '@builder',
    msg: 'Claiming spot on Bidzo',
    method: 'card',
  });

  const [selectedMethod, setSelectedMethod] = useState<'card' | 'crypto' | 'instant'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  useEffect(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      const sessionId = search.get('session_id') || `atex_sess_${Date.now()}`;
      const bidId = search.get('bid_id') || `bid-${Date.now()}`;
      const amount = Number(search.get('amount')) || 25;
      const profileUrl = search.get('profile_url') || 'https://bidzo.app';
      const category = search.get('category') || 'Productivity';
      const name = search.get('name') || 'Maker';
      const handle = search.get('handle') || '@maker';
      const msg = search.get('msg') || '';
      const method = (search.get('method') as any) || 'card';

      setParams({
        sessionId,
        bidId,
        amount,
        profileUrl,
        category,
        name,
        handle,
        msg,
        method,
      });

      if (['card', 'crypto', 'instant'].includes(method)) {
        setSelectedMethod(method);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // Trigger AtexPay Webhook handler to simulate real-time blockchain / gateway confirmation
      const response = await fetch('/api/atexpay-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'payment.succeeded',
          type: 'checkout.session.completed',
          data: {
            id: params.sessionId,
            session_id: params.sessionId,
            bid_id: params.bidId,
            amount: params.amount,
            status: 'paid',
            payment_method: selectedMethod,
            metadata: {
              session_id: params.sessionId,
              bid_id: params.bidId,
              amount: params.amount,
              profile_url: params.profileUrl,
              user_name: params.name,
              handle: params.handle,
              category: params.category,
              message: params.msg,
              payment_method: selectedMethod,
              platform: 'website',
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Payment processing failed on server.');
      }

      setIsSuccess(true);

      // Redirect back to main leaderboard with success parameters after brief celebration
      setTimeout(() => {
        const targetOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        window.location.href = `${targetOrigin}/?payment_success=true&session_id=${encodeURIComponent(
          params.sessionId
        )}&bid_id=${encodeURIComponent(params.bidId)}`;
      }, 1200);
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMsg(err?.message || 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (onBackToApp) {
      onBackToApp();
    } else {
      const targetOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      window.location.href = `${targetOrigin}/?payment_cancelled=true`;
    }
  };

  // Hostname extractor
  let hostname = params.profileUrl;
  try {
    hostname = new URL(params.profileUrl).hostname.replace('www.', '');
  } catch {
    // ignore
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#24211F] font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-[#EAE4DD] bg-[#FFFFFF] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white font-bold text-sm shadow-xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-heading text-sm font-bold tracking-tight text-[#24211F]">
                <span>AtexPay</span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                  SECURE GATEWAY
                </span>
              </div>
              <p className="text-[11px] text-[#78716C]">256-bit SSL Encrypted Transaction</p>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="flex items-center gap-1 text-xs font-medium text-[#78716C] hover:text-[#24211F] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel &amp; Return</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Order Placement Summary (Left column) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Merchant
                  </span>
                  <div className="font-heading text-base font-bold text-slate-900">
                    Bidzo
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total Due
                  </span>
                  <div className="font-heading text-xl font-black text-blue-600 tabular-nums">
                    ${params.amount}.00 USD
                  </div>
                </div>
              </div>

              {/* Placement Details */}
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Target Product / Name</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{params.name}</div>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-slate-500">Destination Link</div>
                  <a
                    href={params.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-mono text-blue-600 hover:underline truncate mt-0.5"
                  >
                    <span className="truncate">{params.profileUrl}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-800">
                    {params.category}
                  </span>
                </div>

                {params.msg && (
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Shoutout / Message</div>
                    <div className="mt-0.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800 italic text-[11.5px]">
                      "{params.msg}"
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Dynamic Leaderboard Rank</span>
                    </div>
                    <span>Active Immediately</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AtexPay Trust Badge */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11.5px]">
                <strong className="font-semibold text-emerald-950">AtexPay Payment Protection:</strong>{' '}
                Direct instant settlement. Once completed, your leaderboard position is updated across all connected devices in real time.
              </div>
            </div>
          </div>

          {/* Payment Form (Right column) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Select Payment Method
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Processed securely via AtexPay checkout gateway
              </p>

              {errorMsg && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {errorMsg}
                </div>
              )}

              {/* Method Tabs */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition-all ${
                    selectedMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="h-4 w-4 mb-1" />
                  <span>Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('crypto')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition-all ${
                    selectedMethod === 'crypto'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Coins className="h-4 w-4 mb-1" />
                  <span>Crypto (USDC)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('instant')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition-all ${
                    selectedMethod === 'instant'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Zap className="h-4 w-4 mb-1" />
                  <span>Instant Pay</span>
                </button>
              </div>

              {/* Method Details */}
              <div className="mt-5">
                {selectedMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-900">
                        Card Number
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                        <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <span>VISA</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-900">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-900">
                          Security Code (CVC)
                        </label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="123"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === 'crypto' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Accepted Stablecoins</span>
                      <span className="text-[11px] text-slate-500">Solana • Ethereum • Polygon</span>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-900 break-all">
                      atexpay_usdc_0x71c...889b
                    </div>
                    <p className="text-[11px] text-slate-500">
                      AtexPay auto-confirms within 1 blockchain block (~2 seconds).
                    </p>
                  </div>
                )}

                {selectedMethod === 'instant' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                    <div className="font-semibold text-slate-900">AtexPay Instant One-Click</div>
                    <p className="text-[11px] text-slate-500">
                      Direct 1-click settlement via your linked AtexPay wallet or Apple Pay.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  disabled={isProcessing || isSuccess}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Payment Verified! Redirecting...</span>
                    </>
                  ) : isProcessing ? (
                    <span>Verifying with AtexPay...</span>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Authorize Payment (${params.amount}.00 USD)</span>
                    </>
                  )}
                </button>

                <p className="mt-2.5 text-center text-[11px] text-slate-500">
                  By clicking Authorize, you agree that bids are final &amp; non-refundable per Bidzo terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <span>Powered by AtexPay Payment Infrastructure</span>
          <span className="font-mono text-[11px]">Session: {params.sessionId.slice(0, 16)}...</span>
        </div>
      </footer>
    </div>
  );
};

export default AtexPayCheckoutPage;
