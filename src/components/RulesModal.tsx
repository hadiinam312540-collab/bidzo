import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, CheckCircle2 } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
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
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6 text-slate-900 transform-gpu will-change-transform"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
                <Award className="h-3 w-3" />
                <span>Fair Play Protocol</span>
              </div>
              <h3 className="mt-1.5 font-heading text-lg font-bold tracking-tight text-slate-900">
                Rules of Bidzo
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Transparent, real-time, pay-to-rank market dynamics.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 font-bold text-xs text-blue-600">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Pure Highest-Bid Ranking</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Positions are determined strictly by bid amount. Higher bids push lower bids down the board in real-time.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 font-bold text-xs text-blue-600">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Permanent Outbid Defense</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    If someone outbids your spot, you never disappear—you simply slide down to the next rank.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 font-bold text-xs text-blue-600">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Direct Clicks & Real Referrals</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Every click routes directly to your product URL with organic click counters.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 font-bold text-xs text-blue-600">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">All-Time & Daily Boards</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Switch between all-time and daily trending bids. Rankings update at 60fps/120fps.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-all shadow-xs transform-gpu active:scale-95"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RulesModal;

