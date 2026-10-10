import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Flame, Rocket } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
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

            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Rocket className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900">
                  About Bidzo
                </h3>
                <p className="text-[11px] text-slate-500">The clean, real-time pay-to-rank discovery game.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                <strong className="text-slate-900">Bidzo</strong> is a modern platform in high-velocity, organic distribution for tech products, AI applications, and high-growth makers.
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Flame className="h-3.5 w-3.5 text-blue-600" />
                  <span>Real-Time Visibility</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  When you outbid #1, your product sits at the peak of the front page instantly across all active users in real-time.
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                Engineered with high-contrast light mode design, instant payment rails, and live leaderboard re-ranking.
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-all shadow-xs transform-gpu active:scale-95"
            >
              Start Exploring
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AboutModal;

