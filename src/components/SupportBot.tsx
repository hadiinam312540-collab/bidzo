import React, { useState, useRef, useEffect } from 'react';
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
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface QuickQA {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
  actionText?: string;
  actionType?: 'claim' | 'rules' | 'email';
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionType?: 'claim' | 'rules' | 'email';
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
    id: 'payments',
    question: 'What payment methods are supported?',
    answer:
      'We support seamless global checkout powered by AtexPay. You can pay via credit & debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and instant crypto checkout.',
    icon: <CreditCard className="h-3.5 w-3.5 text-emerald-600" />,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSelectQuickQuestion = (qa: QuickQA) => {
    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: qa.question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
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

  const handleSendMessage = (e?: React.FormEvent) => {
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
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let reply = "Thanks for asking! For specific queries about your product listing or payment receipts, reach out to our team at contact.bidzo@gmail.com.";
      let actType: 'claim' | 'rules' | 'email' | undefined = 'email';
      let actText: string | undefined = 'Email Support';

      if (lower.includes('rank') || lower.includes('claim') || lower.includes('outbid') || lower.includes('how to bid') || lower.includes('bid')) {
        reply = "You can claim any rank by placing a bid starting at $1, or outbid the current #1 spot with +$1. As soon as your payment confirms, your spot updates immediately.";
        actType = 'claim';
        actText = 'Claim a Rank';
      } else if (lower.includes('pay') || lower.includes('card') || lower.includes('crypto') || lower.includes('apple pay') || lower.includes('google pay')) {
        reply = "We accept credit & debit cards, Apple Pay, Google Pay, and instant crypto through our secure AtexPay gateway.";
        actType = undefined;
        actText = undefined;
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
      setIsTyping(false);
    }, 550);
  };

  const handleActionClick = (type?: 'claim' | 'rules' | 'email') => {
    if (!type) return;
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
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
            className="relative flex flex-col w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] h-[520px] max-h-[82vh] rounded-3xl border border-slate-200 bg-white/98 shadow-2xl shadow-slate-900/15 backdrop-blur-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <Sparkles className="h-4 w-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 border border-white" />
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Bidzo Support Assistant
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-blue-700 border border-blue-200/60">
                      AI 24/7
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Instant answers & rank guidance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
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
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                        : 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Optional action button in bot reply */}
                    {msg.actionText && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleActionClick(msg.actionType)}
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
                  Quick Questions
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
                placeholder="Ask anything about Bidzo..."
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
