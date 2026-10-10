import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Database,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  testConnection,
  getSupabaseSQLSchema,
  saveLocalBids,
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Testing Supabase connection...' });

    if (!url.trim() || !anonKey.trim()) {
      localStorage.removeItem('outbid_supabase_url');
      localStorage.removeItem('outbid_supabase_key');
      setStatusMessage({ type: 'info', text: 'Switched to Local Realtime (Test Mode).' });
      setIsTesting(false);
      onCredentialsUpdated();
      return;
    }

    const res = await testConnection(url.trim(), anonKey.trim());
    if (res.success) {
      localStorage.setItem('outbid_supabase_url', url.trim());
      localStorage.setItem('outbid_supabase_key', anonKey.trim());
      setStatusMessage({ type: 'success', text: res.message });
      onCredentialsUpdated();
    } else {
      setStatusMessage({
        type: 'error',
        text: `Connection failed: ${res.message}. Make sure your URL and anon key are correct, and CORS allows this domain.`,
      });
    }
    setIsTesting(false);
  };

  const handleClearLocalBids = () => {
    saveLocalBids([]);
    setStatusMessage({ type: 'success', text: 'Cleared local leaderboard bids (0 items).' });
    onCredentialsUpdated();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(getSupabaseSQLSchema());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const isConfigured = Boolean(url && anonKey);

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
            className="relative z-10 w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6 text-slate-900 transform-gpu will-change-transform"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900">
                  Supabase Real-Time Backend
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage database connection and real-time syncing for leaderboard bids.
                </p>
              </div>
            </div>

            {/* Current Status banner */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-2 w-2 rounded-full ${
                    isConfigured ? 'bg-emerald-600 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <div>
                  <span className="font-semibold text-slate-900">
                    {isConfigured ? 'Supabase Connected' : 'Local Realtime Store (Test Mode)'}
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {isConfigured
                      ? 'All bids synchronize instantly via Supabase Realtime Channels.'
                      : 'Operating locally with reactive tab sync and instant bidding simulation.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearLocalBids}
                title="Clear local bids (reset to 0 items)"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs transform-gpu active:scale-95"
              >
                <RefreshCw className="h-3 w-3 text-slate-500" />
                <span>Clear Bids</span>
              </button>
            </div>

            {statusMessage && (
              <div
                className={`mt-3 rounded-xl p-2.5 text-xs font-semibold border ${
                  statusMessage.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : statusMessage.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleTestAndSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Supabase Anon / Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={isTesting}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 disabled:opacity-70 transition-all transform-gpu"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isTesting ? 'Verifying...' : 'Save & Connect Supabase'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrl('');
                    setAnonKey('');
                    localStorage.removeItem('outbid_supabase_url');
                    localStorage.removeItem('outbid_supabase_key');
                    setStatusMessage({ type: 'info', text: 'Switched to Local Realtime Test Mode.' });
                    onCredentialsUpdated();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Use Test Mode
                </button>
              </div>
            </form>

            {/* Copyable SQL Schema */}
            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Terminal className="h-3.5 w-3.5 text-blue-600" />
                  <span>SQL Setup Script (leaderboard_bids table)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {copiedSql ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-500" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mb-1.5">
                Paste snippet directly in Supabase SQL Editor to enable real-time publications.
              </p>
              <pre className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-[10px] text-slate-800">
                {getSupabaseSQLSchema()}
              </pre>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SupabaseModal;

