import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Scale,
  Ban,
  CheckCircle2,
} from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
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
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6 text-slate-800 transform-gpu will-change-transform"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Close Terms modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
                <Scale className="h-3 w-3" />
                <span>Legal &amp; Protocol Guidelines</span>
              </div>
              <h3 className="mt-1.5 font-heading text-xl font-bold tracking-tight text-slate-900">
                Terms of Service &amp; Refund Policy
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Governing rules for dynamic ranking, AtexPay transactions, and content moderation on Bidzo.
              </p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              {/* Rule 1: Dynamic Ranking Policy */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
                    <Flame className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="font-heading font-bold text-slate-900 text-xs">
                    1. Dynamic Ranking Policy
                  </h4>
                </div>
                <div className="space-y-1.5 pl-8 text-[11.5px] text-slate-600">
                  <p>
                    <strong className="text-slate-900">Bid-Driven Placement:</strong> Rank positions on the Bidzo leaderboard are strictly determined by bid amounts ($USD / crypto equivalent).
                  </p>
                  <p>
                    <strong className="text-slate-900">Real-Time Reordering:</strong> Higher bids dynamically outrank lower bids in real-time. Leaderboard positions re-sort immediately upon confirmation.
                  </p>
                  <p>
                    <strong className="text-slate-900">No Permanent Rank Guarantee:</strong> Submitting a bid guarantees your placement at that precise time, but does <em>not</em> guarantee a permanent position. Other bidders may outbid your amount at any time, which automatically shifts your entry to the next applicable rank.
                  </p>
                </div>
              </div>

              {/* Rule 2: Refund & Finality Rules */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="font-heading font-bold text-slate-900 text-xs">
                    2. Refund &amp; Transaction Finality Rules
                  </h4>
                </div>
                <div className="space-y-1.5 pl-8 text-[11.5px] text-slate-600">
                  <p>
                    <strong className="text-slate-900">Strictly Non-Refundable:</strong> All completed bid transactions via AtexPay (fiat cards, web3 crypto) are final, irreversible, and non-refundable once processed on the blockchain or payment gateway.
                  </p>
                  <p>
                    <strong className="text-slate-900">Immediate Fulfillment:</strong> Digital rank publication, domain link indexing, and real-time click tracking are provisioned instantly upon payment execution.
                  </p>
                  <p className="text-amber-800 bg-amber-50 rounded-lg p-2 border border-amber-200/60">
                    <strong className="text-amber-900">Fraud &amp; Chargeback Penalties:</strong> Unauthorized chargebacks, payment disputes, or fraudulent activity will result in immediate and permanent removal of the bidder from the leaderboard and domain blacklisting.
                  </p>
                </div>
              </div>

              {/* Rule 3: Content Guidelines */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
                    <Ban className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="font-heading font-bold text-slate-900 text-xs">
                    3. Content Guidelines &amp; Moderation
                  </h4>
                </div>
                <div className="space-y-1.5 pl-8 text-[11.5px] text-slate-600">
                  <p>
                    <strong className="text-slate-900">Prohibited Material:</strong> Submitted destination URLs, brand names, logos, handles, and pitch messages must not contain illegal activities, hate speech, adult/NSFW content, malicious code, phishing, scam tokens, or harassment.
                  </p>
                  <p>
                    <strong className="text-slate-900">Platform Discretion:</strong> Bidzo explicitly reserves the right to moderate, hide, or redact non-compliant entries or deceptive domains without prior notice and without a refund.
                  </p>
                </div>
              </div>

              {/* Summary note */}
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  For assistance, support, or billing queries, contact the team directly at{' '}
                  <a href="mailto:contact.bidzo@gmail.com" className="font-semibold text-blue-600 hover:underline">
                    contact.bidzo@gmail.com
                  </a>
                  .
                </span>
              </div>
            </div>

            {/* Bottom Action */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                I Understand &amp; Agree
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;
