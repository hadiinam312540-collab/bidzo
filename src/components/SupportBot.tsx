import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  HelpCircle,
  ExternalLink,
  Mail,
  Zap,
  CreditCard,
  RotateCcw,
  Activity,
  AlertTriangle,
  Bug,
  Copy,
  Check,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import {
  runSystemHealthCheck,
  recordDiagnosticLog,
  captureDiagnosticSnapshot,
  formatDiagnosticReport,
  SystemHealthReport,
  DiagnosticSnapshot,
} from '../lib/supportDiagnostics';

interface QuickQA {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
  actionText?: string;
  actionType?: 'claim' | 'rules' | 'email' | 'health_check' | 'bug_report';
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  isError?: boolean;
  errorCode?: string;
  diagnosticId?: string;
  diagnosticSnapshot?: DiagnosticSnapshot;
  actionType?: 'claim' | 'rules' | 'email' | 'health_check' | 'bug_report' | 'copy_diagnostic';
  actionText?: string;
}

interface SupportBotProps {
  onOpenClaim?: () => void;
  onOpenRules?: () => void;
}

const SUPPORT_EMAIL = 'contact.bidzo@gmail.com';

const QUICK_QUESTIONS: QuickQA[] = [
  {
    id: 'how_it_works',
    question: 'How does claiming a rank work?',
    answer:
      'Bidzo is a real-time pay-to-rank discovery game. Your rank (#1, #2, #3, etc.) is determined strictly by your active bid amount. You can place a new bid starting from $1 or outbid any current spot with a +$1 increment to immediately claim higher visibility!',
    icon: <Zap className="h-3.5 w-3.5 text-blue-600" />,
    actionText: 'Claim a Rank Now',
    actionType: 'claim',
  },
  {
    id: 'how_to_pay',
    question: 'How can I pay for my bid?',
    answer:
      'Paying for your bid is simple and fast via our secure AtexPay checkout. Once you enter your bid details and click Claim Spot, you are routed through AtexPay with encrypted payment options including credit/debit cards, Apple Pay, Google Pay, and instant cryptocurrency.',
    icon: <CreditCard className="h-3.5 w-3.5 text-emerald-600" />,
    actionText: 'Place a Bid',
    actionType: 'claim',
  },
  {
    id: 'system_health',
    question: 'System Status & Diagnostics',
    answer: 'Checking system health and real-time API latency...',
    icon: <Activity className="h-3.5 w-3.5 text-teal-600" />,
    actionText: 'Run Live Diagnostic',
    actionType: 'health_check',
  },
  {
    id: 'report_bug',
    question: 'Report a Bug / Issue',
    answer: 'Capturing diagnostic environment context and generating report...',
    icon: <Bug className="h-3.5 w-3.5 text-rose-600" />,
    actionText: 'Generate Bug Report',
    actionType: 'bug_report',
  },
  {
    id: 'payments',
    question: 'What payment methods are supported?',
    answer:
      'We support seamless global checkout powered by AtexPay. You can pay via credit & debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and instant crypto checkout.',
    icon: <CreditCard className="h-3.5 w-3.5 text-blue-600" />,
  },
  {
    id: 'speed',
    question: 'How fast does my product URL go live?',
    answer:
      'Instantly! Once your checkout completes, our webhooks broadcast your product name, handle, tagline, category, and direct backlink to the live leaderboard in real-time with 60fps animations.',
    icon: <Sparkles className="h-3.5 w-3.5 text-amber-600" />,
  },
  {
    id: 'contact',
    question: 'Contact Support',
    answer:
      `Our dedicated support team is available 24/7. Reach us directly at ${SUPPORT_EMAIL} for custom inquiries, domain ownership verification, or transaction assistance.`,
    icon: <Mail className="h-3.5 w-3.5 text-indigo-600" />,
    actionText: `Email ${SUPPORT_EMAIL}`,
    actionType: 'email',
  },
];

export const SupportBot: React.FC<SupportBotProps> = ({ onOpenClaim, onOpenRules }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "👋 Hi there! Welcome to Bidzo. How can I help you claim top spots today?",
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [showHealthPanel, setShowHealthPanel] = useState(false);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Initial and on-open health check
  const checkHealth = useCallback(async (isUserInitiated: boolean = false) => {
    setIsCheckingHealth(true);
    try {
      const report = await runSystemHealthCheck(5000);
      setHealthReport(report);
      return report;
    } catch (err: any) {
      const fallbackReport: SystemHealthReport = {
        status: 'offline',
        latencyMs: 5000,
        checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        services: {
          serverApi: 'offline',
          checkoutGateway: 'offline',
          realtimeSync: 'degraded',
        },
        error: err?.message || 'Connection timeout',
      };
      setHealthReport(fallbackReport);
      return fallbackReport;
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !healthReport) {
      checkHealth(false);
    }
  }, [isOpen, healthReport, checkHealth]);

  const handleCopyDiagnostics = (snapshot?: DiagnosticSnapshot) => {
    if (!snapshot) return;
    const text = formatDiagnosticReport(snapshot);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTicketId(snapshot.ticketId);
      recordDiagnosticLog({
        action: 'DIAGNOSTIC_COPIED_TO_CLIPBOARD',
        status: 'info',
        details: { ticketId: snapshot.ticketId },
      });
      setTimeout(() => setCopiedTicketId(null), 3000);
    });
  };

  const handleEmailBugReport = (snapshot?: DiagnosticSnapshot) => {
    if (!snapshot) return;
    const subject = encodeURIComponent(`[Bidzo Bug Report #${snapshot.ticketId}] Issue on ${snapshot.failedAction}`);
    const body = encodeURIComponent(
      `Hi Bidzo Support,\n\nI would like to report an issue with the platform.\n\nDescription of issue:\n[Please enter what happened]\n\nDiagnostic details:\n${formatDiagnosticReport(snapshot)}`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const executeHealthCheckInChat = async () => {
    setIsTyping(true);
    const report = await checkHealth(true);
    setIsTyping(false);

    const isHealthy = report.status === 'healthy';
    const isDegraded = report.status === 'degraded';

    const text = isHealthy
      ? `✅ All Bidzo systems are operating normally!\n\n• Server API: Online\n• AtexPay Checkout: Operational\n• Real-time Leaderboard: Synchronized\n• Roundtrip Latency: ${report.latencyMs}ms\n\nNo active disruptions detected.`
      : isDegraded
      ? `⚠️ Bidzo systems are operational with higher than normal latency (${report.latencyMs}ms). All checkouts and live bids remain functional.`
      : `❌ Service Disruption Detected\n\nCould not reach server API (${report.error || 'Network Timeout'}). The diagnostic system has captured this incident.`;

    const botMsg: Message = {
      id: `bot-health-${Date.now()}`,
      sender: 'bot',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isError: !isHealthy && !isDegraded,
      errorCode: report.error ? 'ERR_API_UNREACHABLE' : undefined,
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  const executeBugReportInChat = (customContext?: Record<string, any>) => {
    setIsTyping(true);
    setTimeout(() => {
      const snapshot = captureDiagnosticSnapshot({
        failedAction: 'USER_REPORTED_BUG',
        errorCode: 'DIAG_USER_SUBMISSION',
        customContext,
      });

      const reply = `🛠️ Diagnostic Report Generated (#${snapshot.ticketId})\n\nOur system has captured your active session state, network connectivity, and browser environment to help diagnose the issue.`;

      const botMsg: Message = {
        id: `bot-bug-${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        diagnosticId: snapshot.ticketId,
        diagnosticSnapshot: snapshot,
        actionType: 'copy_diagnostic',
        actionText: 'Copy Diagnostic Context',
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleSelectQuickQuestion = (qa: QuickQA) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: qa.question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    recordDiagnosticLog({
      action: 'USER_SELECTED_QUICK_QUESTION',
      status: 'info',
      details: { questionId: qa.id },
    });

    if (qa.id === 'system_health') {
      executeHealthCheckInChat();
      return;
    }

    if (qa.id === 'report_bug') {
      executeBugReportInChat();
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: qa.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: qa.actionType,
        actionText: qa.actionText,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    recordDiagnosticLog({
      action: 'USER_SUBMITTED_MESSAGE',
      status: 'info',
      details: { queryLength: query.length },
    });

    const lower = query.toLowerCase();

    // Check if query is about health, status, uptime
    if (lower.includes('status') || lower.includes('health') || lower.includes('ping') || lower.includes('uptime') || lower.includes('is server down') || lower.includes('is site down')) {
      await executeHealthCheckInChat();
      return;
    }

    // Check if query is about reporting bugs, errors, failures, crashes
    if (
      lower.includes('bug') ||
      lower.includes('error') ||
      lower.includes('broken') ||
      lower.includes('crash') ||
      lower.includes('failed') ||
      lower.includes('not working') ||
      lower.includes('timeout') ||
      lower.includes('stuck')
    ) {
      const failedActionGuess = lower.includes('pay') || lower.includes('checkout')
        ? 'ATEXPAY_CHECKOUT_FLOW'
        : lower.includes('bid') || lower.includes('claim')
        ? 'BID_SUBMISSION'
        : 'GENERAL_PLATFORM_INTERACTION';

      const snapshot = captureDiagnosticSnapshot({
        failedAction: failedActionGuess,
        errorCode: 'DIAG_USER_EXCEPTION',
        errorMessage: query,
      });

      setIsTyping(true);
      setTimeout(() => {
        const reply = `⚠️ Bug & Diagnostic Log Recorded (#${snapshot.ticketId})\n\nI detected an issue report regarding "${failedActionGuess.replace(/_/g, ' ').toLowerCase()}". Our diagnostic system has recorded your environment state, failed action context, and network metrics.`;

        const botMsg: Message = {
          id: `bot-diag-${Date.now()}`,
          sender: 'bot',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
          errorCode: snapshot.errorCode,
          diagnosticId: snapshot.ticketId,
          diagnosticSnapshot: snapshot,
          actionType: 'copy_diagnostic',
          actionText: 'Copy Diagnostic Context',
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 500);
      return;
    }

    setIsTyping(true);

    setTimeout(() => {
      try {
        let reply = "Thanks for asking! For specific queries about your product listing or payment receipts, reach out to our team at contact.bidzo@gmail.com.";
        let actType: 'claim' | 'rules' | 'email' | undefined = 'email';
        let actText: string | undefined = 'Email Support';

        if (lower.includes('how to pay') || lower.includes('how can i pay') || lower.includes('how do i pay')) {
          reply = "You can pay for your bid via our secure AtexPay checkout. Enter your product details, confirm your bid amount, and complete checkout securely with cards, Apple Pay, Google Pay, or crypto.";
          actType = 'claim';
          actText = 'Place a Bid';
        } else if (lower.includes('rank') || lower.includes('claim') || lower.includes('outbid') || lower.includes('how to bid') || lower.includes('bid')) {
          reply = "You can claim any rank by placing a bid starting at $1, or outbid the current #1 spot with +$1. As soon as your payment confirms, your spot updates immediately.";
          actType = 'claim';
          actText = 'Claim a Rank';
        } else if (lower.includes('pay') || lower.includes('card') || lower.includes('crypto') || lower.includes('apple pay') || lower.includes('google pay')) {
          reply = "We accept credit & debit cards, Apple Pay, Google Pay, and instant crypto through our secure AtexPay checkout gateway.";
          actType = 'claim';
          actText = 'Place a Bid';
        } else if (lower.includes('rule') || lower.includes('fair') || lower.includes('terms') || lower.includes('policy')) {
          reply = "Bidzo follows a transparent, highest-bid ranking protocol. All links must be safe for work and adhere to our platform guidelines.";
          actType = 'rules';
          actText = 'View Platform Rules';
        } else if (lower.includes('contact') || lower.includes('email') || lower.includes('help') || lower.includes('support')) {
          reply = `You can email our official team at ${SUPPORT_EMAIL}. We respond quickly to help with listing issues, link revisions, and checkout help.`;
          actType = 'email';
          actText = `Send Email`;
        } else if (lower.includes('time') || lower.includes('fast') || lower.includes('instant') || lower.includes('live')) {
          reply = "Your bid goes live within seconds! Our real-time Supabase database and WebSocket sync updates all visitors without needing a page refresh.";
          actType = 'claim';
          actText = 'Place a Bid';
        }

        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: actType,
          actionText: actText,
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (err: any) {
        // Graceful error catcher
        const snapshot = captureDiagnosticSnapshot({
          failedAction: 'CHATBOT_DISPATCH_EXCEPTION',
          errorCode: 'CLIENT_INTERNAL_ERROR',
          errorMessage: err?.message,
        });

        const errorMsg: Message = {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `⚠️ An internal error occurred while processing your request. Diagnostic ticket #${snapshot.ticketId} has been logged.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
          errorCode: 'CLIENT_INTERNAL_ERROR',
          diagnosticId: snapshot.ticketId,
          diagnosticSnapshot: snapshot,
          actionType: 'copy_diagnostic',
          actionText: 'Copy Diagnostic Context',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    }, 450);
  };

  const handleActionClick = (msg: Message) => {
    const type = msg.actionType;
    if (!type) return;

    if (type === 'copy_diagnostic' && msg.diagnosticSnapshot) {
      handleCopyDiagnostics(msg.diagnosticSnapshot);
      return;
    }

    if (type === 'health_check') {
      executeHealthCheckInChat();
      return;
    }

    if (type === 'bug_report') {
      executeBugReportInChat();
      return;
    }

    if (type === 'claim' && onOpenClaim) {
      onOpenClaim();
      setIsOpen(false);
    } else if (type === 'rules' && onOpenRules) {
      onOpenRules();
      setIsOpen(false);
    } else if (type === 'email') {
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Bidzo Support Inquiry`;
    }
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: "👋 Hi there! Welcome to Bidzo. How can I help you claim top spots today?",
        timestamp: 'Just now',
      },
    ]);
  };

  // Status indicator styling
  const isHealthy = healthReport?.status === 'healthy';
  const isDegraded = healthReport?.status === 'degraded';

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans pointer-events-auto">
      {/* Sleek, Compact Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-trigger"
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 10 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            aria-label="Need Help? Open AI Support Bot"
            title="Need Help? Click to chat with Support"
            className="group flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 p-2 sm:px-3 sm:py-2 shadow-md shadow-slate-900/10 backdrop-blur-md transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-600/10 text-slate-800"
          >
            <div className="relative flex h-5.5 w-5.5 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xs">
              <Sparkles className="h-3 w-3 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                    isHealthy ? 'bg-emerald-400' : isDegraded ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
              </span>
            </div>
            <span className="hidden sm:inline text-xs font-semibold tracking-tight text-slate-800 group-hover:text-blue-600 transition-colors">
              Help?
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative flex flex-col w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] h-[540px] max-h-[82vh] rounded-3xl border border-slate-200 bg-white/98 shadow-2xl shadow-slate-900/15 backdrop-blur-xl overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                    <Sparkles className="h-4 w-4" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                      <span
                        className={`relative inline-flex h-2 w-2 rounded-full border border-white ${
                          isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading text-xs font-bold text-slate-900">
                        Bidzo Support Assistant
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowHealthPanel(!showHealthPanel)}
                        title="Click to toggle system health diagnostics"
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold border transition-all ${
                          isHealthy
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100'
                            : isDegraded
                            ? 'bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-100'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        />
                        {isCheckingHealth ? 'Checking...' : isHealthy ? 'Healthy' : isDegraded ? 'Degraded' : 'Offline'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Instant answers & live diagnostics
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => checkHealth(true)}
                    disabled={isCheckingHealth}
                    title="Refresh health check"
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isCheckingHealth ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetConversation}
                    title="Reset conversation"
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    title="Close support window"
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Health Diagnostic Dashboard */}
              <AnimatePresence>
                {showHealthPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2.5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2.5 text-slate-700 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
                        <Activity className="h-3 w-3 text-blue-600" />
                        System Health & Latency Monitor
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">
                        {healthReport?.checkedAt || 'Checking'}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                      <div className="rounded-xl bg-slate-50 p-1.5 text-center border border-slate-100">
                        <span className="text-[9px] text-slate-400 block font-medium">Server API</span>
                        <span className="font-semibold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {healthReport?.services.serverApi === 'operational' ? 'Active' : 'Offline'}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-1.5 text-center border border-slate-100">
                        <span className="text-[9px] text-slate-400 block font-medium">Checkout</span>
                        <span className="font-semibold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          AtexPay
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-1.5 text-center border border-slate-100">
                        <span className="text-[9px] text-slate-400 block font-medium">Latency</span>
                        <span className="font-mono font-semibold text-slate-800 block mt-0.5">
                          {healthReport ? `${healthReport.latencyMs}ms` : '--'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-slate-500 text-[10px]">
                        Status: <strong className="font-semibold text-slate-800">{healthReport?.status || 'Active'}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => executeBugReportInChat()}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <Bug className="h-2.5 w-2.5" />
                        Capture Diagnostic Context
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-white to-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                        : msg.isError
                        ? 'bg-rose-50/90 border border-rose-200 text-rose-950 shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    {/* Message text with paragraph preservation */}
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Diagnostic Snapshot Details Card */}
                    {msg.diagnosticSnapshot && (
                      <div className="mt-2.5 rounded-xl border border-slate-200/90 bg-white/90 p-2.5 text-[11px] text-slate-700 shadow-2xs">
                        <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 pb-1.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-700">Ticket #{msg.diagnosticSnapshot.ticketId}</span>
                          <span>{msg.diagnosticSnapshot.viewport}</span>
                        </div>
                        <div className="mt-1.5 space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Action:</span>
                            <span className="font-medium text-slate-700">{msg.diagnosticSnapshot.failedAction}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Code:</span>
                            <span className="font-mono text-rose-600 font-semibold">{msg.diagnosticSnapshot.errorCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Network:</span>
                            <span className="text-emerald-600 font-medium">{msg.diagnosticSnapshot.isOnline ? 'Online' : 'Offline'}</span>
                          </div>
                        </div>

                        {/* Diagnostic Actions */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyDiagnostics(msg.diagnosticSnapshot)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200 transition-all active:scale-95"
                          >
                            {copiedTicketId === msg.diagnosticSnapshot.ticketId ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Context</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEmailBugReport(msg.diagnosticSnapshot)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 transition-all active:scale-95 border border-blue-200/80"
                          >
                            <Mail className="h-3 w-3" />
                            <span>Email Support</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Generic action button in bot reply if not diagnostic snapshot */}
                    {!msg.diagnosticSnapshot && msg.actionText && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleActionClick(msg)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200/80 hover:bg-blue-100 hover:text-blue-800 transition-all active:scale-95"
                        >
                          <span>{msg.actionText}</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="mt-1 px-1 font-mono text-[9px] text-slate-400">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Bot typing state */}
              {isTyping && (
                <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 w-16 text-slate-400 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Answer Suggestion Buttons */}
            <div className="border-t border-slate-100 bg-white px-3 py-2">
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  Quick Actions & Diagnostics
                </span>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-[10px] font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <Mail className="h-2.5 w-2.5" />
                  {SUPPORT_EMAIL}
                </a>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_QUESTIONS.map((qa) => (
                  <button
                    key={qa.id}
                    type="button"
                    onClick={() => handleSelectQuickQuestion(qa)}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 active:scale-95"
                  >
                    {qa.icon}
                    <span>{qa.question}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 p-2.5"
            >
              <input
                type="text"
                placeholder="Ask a question or report an issue..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 active:scale-95 shadow-sm shadow-blue-600/20"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportBot;
