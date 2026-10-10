import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Lock, Eye, Database, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
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

          {/* Dialog Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.22, bounce: 0 }}
            className="relative z-10 w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6 text-slate-800 transform-gpu will-change-transform"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Close Privacy modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
                <ShieldCheck className="h-3 w-3" />
                <span>Privacy &amp; Data Transparency</span>
              </div>
              <h3 className="mt-1.5 font-heading text-xl font-bold tracking-tight text-slate-900">
                Bidzo Privacy Policy
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Last updated: October 2026 &bull; Official contact: contact.bidzo@gmail.com
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                <h4 className="font-heading text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Database className="h-3.5 w-3.5 text-blue-600" />
                  1. Public Information Displayed
                </h4>
                <p>
                  When you submit a bid on Bidzo, your submitted website link (profile URL), product name, public handle, tagline, category, and bid amount become publicly visible on the live leaderboard. Do not submit sensitive private personal data in bid messages.
                </p>
              </section>

              <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                <h4 className="font-heading text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Lock className="h-3.5 w-3.5 text-blue-600" />
                  2. Payment Data Security
                </h4>
                <p>
                  Bidzo does not store credit card details or crypto private keys. All payment processing is securely managed by <strong>AtexPay</strong> and standard blockchain payment rails under industry encryption standards.
                </p>
              </section>

              <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                <h4 className="font-heading text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                  3. Analytics &amp; Clicks Tracking
                </h4>
                <p>
                  We record anonymous outgoing click counts on ranked website links to display engagement metrics to makers and visitors. No third-party behavioral tracking or advertising cookies are utilized.
                </p>
              </section>

              <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                <h4 className="font-heading text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  4. Contact &amp; Takedown Requests
                </h4>
                <p>
                  If you need to update a destination URL or request domain verification or removal, email us directly at{' '}
                  <a href="mailto:contact.bidzo@gmail.com" className="font-semibold text-blue-600 hover:underline">
                    contact.bidzo@gmail.com
                  </a>
                  .
                </p>
              </section>
            </div>

            {/* Footer Action */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                Understood &amp; Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PrivacyModal;
