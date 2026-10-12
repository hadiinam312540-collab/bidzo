import React from 'react';
import { Mail, ExternalLink, ShieldCheck, Heart, Sparkles, Scale, BookOpen, ArrowUp } from 'lucide-react';
import { BidzoLogo } from './BidzoLogo';

interface FooterProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenRules: () => void;
  onOpenAbout: () => void;
  onOpenClaim: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTerms,
  onOpenPrivacy,
  onOpenRules,
  onOpenAbout,
  onOpenClaim,
}) => {
  const supportEmail = 'contact.bidzo@gmail.com';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-slate-200 bg-white text-slate-600 font-sans mt-12 sm:mt-16">
      {/* Top Footer Banner */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand Info & Support Contact (5 columns) */}
          <div className="space-y-4 md:col-span-5">
            <BidzoLogo size="md" />
            <p className="text-xs leading-relaxed text-slate-500 max-w-sm">
              The high-contrast, real-time pay-to-rank discovery game for tech products, AI builders, and high-growth makers. Claim rank #1 and outbid opponents in live 60fps auctions.
            </p>

            {/* Official Support Email Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  Official Support & Inquiries
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Questions about bids, domain listings, or checkout transactions?
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  {supportEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Links (2 columns) */}
          <div className="space-y-3 md:col-span-2 md:col-start-7">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenClaim}
                  className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Submit a Bid
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenRules}
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  How Bidding Works
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAbout}
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  About Bidzo
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Policy (3 columns) */}
          <div className="space-y-3 md:col-span-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              Legal & Transparency
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenTerms}
                  className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <Scale className="h-3 w-3 text-slate-400" />
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3 w-3 text-slate-400" />
                  Refund &amp; Finality Policy
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPrivacy}
                  className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="h-3 w-3 text-slate-400" />
                  Privacy Policy
                </button>
              </li>
              <li>
                <span className="text-[11px] text-slate-400 leading-tight block pt-1">
                  All bids via AtexPay are final once settled on chain.
                </span>
              </li>
            </ul>
          </div>

          {/* Back to top button (2 columns) */}
          <div className="flex md:flex-col md:items-end justify-between md:col-span-2 pt-2 md:pt-0">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
            >
              <ArrowUp className="h-3 w-3 text-slate-500" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row">
          <p className="font-sans font-medium text-slate-500">
            &copy; 2026 Bidzo. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              AtexPay Gateway Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
