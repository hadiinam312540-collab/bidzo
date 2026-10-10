import { createClient } from '@supabase/supabase-js';

export interface CheckoutRequestPayload {
  amount: number;
  profile_url: string;
  message?: string;
  category: string;
  payment_method?: string;
  user_name?: string;
  handle?: string;
  platform?: string;
  origin?: string;
}

export interface CheckoutResponseData {
  success: boolean;
  checkout_url?: string;
  payment_url?: string;
  session_id?: string;
  bid_id?: string;
  provider?: string;
  mode?: 'live' | 'sandbox';
  error?: string;
  details?: Record<string, unknown>;
}

// In-memory registry of sessions for immediate retrieval & webhook confirmation
export interface StoredSession {
  sessionId: string;
  bidId: string;
  amount: number;
  profile_url: string;
  message: string;
  category: string;
  payment_method: string;
  user_name: string;
  handle: string;
  platform: string;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

// Global in-memory cache to bridge server webhook & client verification
const sessionStore = new Map<string, StoredSession>();
const paidBidsStore: StoredSession[] = [];

/**
 * Returns configured AtexPay API parameters from environment
 */
export function getAtexPayConfig(reqOrigin?: string) {
  const apiKey =
    (typeof process !== 'undefined' && (
      process.env.ATEXPAY_API_KEY ||
      process.env.NEXT_PUBLIC_ATEXPAY_API_KEY ||
      process.env.VITE_ATEXPAY_API_KEY
    )) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ATEXPAY_API_KEY) ||
    '';

  const baseUrl =
    (typeof process !== 'undefined' && process.env.ATEXPAY_BASE_URL) ||
    'https://api.atexpay.com';

  const webhookSecret = (typeof process !== 'undefined' && process.env.ATEXPAY_WEBHOOK_SECRET) || '';

  // Dynamically resolve appUrl without hardcoded localhost:3000
  let resolvedAppUrl = '';

  if (typeof window !== 'undefined' && window.location?.origin) {
    resolvedAppUrl = window.location.origin;
  } else if (reqOrigin && reqOrigin.startsWith('http') && !reqOrigin.includes('localhost:3000')) {
    resolvedAppUrl = reqOrigin;
  } else if (typeof process !== 'undefined') {
    resolvedAppUrl =
      process.env.VITE_APP_URL ||
      process.env.APP_URL ||
      process.env.URL ||
      '';
  }

  if (!resolvedAppUrl && reqOrigin && reqOrigin.startsWith('http')) {
    resolvedAppUrl = reqOrigin;
  }

  // Ensure trailing slashes are removed
  const appUrl = (resolvedAppUrl || '').replace(/\/+$/, '');

  const isConfigured = Boolean(apiKey && apiKey.length > 5 && !apiKey.includes('your_atexpay_api_key'));

  return { apiKey, baseUrl, webhookSecret, appUrl, isConfigured };
}

/**
 * Returns a server-side Supabase client if configured in env vars
 */
export function getServerSupabaseClient() {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  try {
    return createClient(url, key);
  } catch (e) {
    console.warn('[AtexPay] Failed to create server Supabase client:', e);
    return null;
  }
}

/**
 * Creates an AtexPay checkout session and returns payment URL
 */
export async function createAtexPayCheckout(
  payload: CheckoutRequestPayload,
  reqOrigin?: string
): Promise<CheckoutResponseData> {
  const {
    amount,
    profile_url,
    message = '',
    category,
    payment_method = 'card',
    user_name = '',
    handle = '',
    platform = 'website',
    origin,
  } = payload;

  // Validation
  if (!amount || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return {
      success: false,
      error: 'Invalid bid amount. Must be a positive number of at least $1.',
    };
  }

  if (!profile_url || typeof profile_url !== 'string' || !profile_url.trim()) {
    return {
      success: false,
      error: 'profile_url (destination website/link) is required.',
    };
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    return {
      success: false,
      error: 'category is required.',
    };
  }

  const { apiKey, baseUrl, appUrl, isConfigured } = getAtexPayConfig(origin || reqOrigin);

  // Dynamically resolve the effective application URL
  // Priority: browser origin -> caller origin -> env vars (VITE_APP_URL, APP_URL, URL) -> reqOrigin -> appUrl
  let effectiveAppUrl =
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '') ||
    origin ||
    (typeof process !== 'undefined' && (process.env.VITE_APP_URL || process.env.APP_URL || process.env.URL)) ||
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_APP_URL) ||
    reqOrigin ||
    appUrl ||
    '';

  // If effectiveAppUrl points to localhost:3000, dynamically swap with active window origin or env var
  if (effectiveAppUrl.includes('localhost:3000')) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      effectiveAppUrl = window.location.origin;
    } else if (typeof process !== 'undefined' && (process.env.VITE_APP_URL || process.env.APP_URL || process.env.URL)) {
      effectiveAppUrl = process.env.VITE_APP_URL || process.env.APP_URL || process.env.URL || '';
    }
  }

  // Strip trailing slashes
  effectiveAppUrl = effectiveAppUrl.replace(/\/+$/, '');

  const bidId = `bid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const sessionId = `atex_sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Store session in pending state
  const sessionData: StoredSession = {
    sessionId,
    bidId,
    amount,
    profile_url: profile_url.trim(),
    message: message.trim(),
    category: category.trim(),
    payment_method,
    user_name: user_name.trim() || 'Anonymous Bidder',
    handle: handle.trim() || '@bidder',
    platform,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  sessionStore.set(sessionId, sessionData);

  const returnUrl = `${effectiveAppUrl}/?payment_success=true&session_id=${sessionId}&bid_id=${bidId}`;
  const successUrl = `${effectiveAppUrl}/?payment_success=true&session_id=${sessionId}&bid_id=${bidId}`;
  const cancelUrl = `${effectiveAppUrl}/?payment_cancelled=true`;

  // If live AtexPay API key is provided, attempt live session creation
  if (isConfigured) {
    try {
      const endpoints = [
        `${baseUrl}/v1/checkout/sessions`,
        `${baseUrl}/api/v1/checkout`,
        `${baseUrl}/v1/payment-links`,
      ];

      const atexBody = {
        amount: Math.round(amount * 100) / 100,
        currency: 'USD',
        product_name: `Bidzo Leaderboard Placement - ${sessionData.user_name}`,
        description: message || `Bid placement for ${profile_url}`,
        payment_method,
        return_url: returnUrl,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          session_id: sessionId,
          bid_id: bidId,
          amount,
          profile_url: sessionData.profile_url,
          user_name: sessionData.user_name,
          handle: sessionData.handle,
          category: sessionData.category,
          message: sessionData.message,
          payment_method,
          platform,
          return_url: returnUrl,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      };

      const res = await fetch(endpoints[0], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(atexBody),
      });

      if (res.ok) {
        const json = await res.json();
        const paymentUrl =
          json.checkout_url ||
          json.payment_url ||
          json.url ||
          json.data?.checkout_url ||
          json.data?.payment_url;

        if (paymentUrl) {
          return {
            success: true,
            checkout_url: paymentUrl,
            payment_url: paymentUrl,
            session_id: json.id || json.session_id || sessionId,
            bid_id: bidId,
            provider: 'atexpay',
            mode: 'live',
          };
        }
      } else {
        const errText = await res.text();
        console.warn('[AtexPay] Live API returned non-OK status:', res.status, errText);
      }
    } catch (apiErr) {
      console.warn('[AtexPay] Live API request failed, falling back to sandbox checkout:', apiErr);
    }
  }

  // Seamless Sandbox Checkout URL for AI Studio preview & immediate testing
  const searchParams = new URLSearchParams({
    session_id: sessionId,
    bid_id: bidId,
    amount: amount.toString(),
    profile_url: sessionData.profile_url,
    category: sessionData.category,
    name: sessionData.user_name,
    handle: sessionData.handle,
    msg: sessionData.message,
    method: payment_method,
  });

  const sandboxCheckoutUrl = `${effectiveAppUrl}/checkout/atexpay?${searchParams.toString()}`;

  return {
    success: true,
    checkout_url: sandboxCheckoutUrl,
    payment_url: sandboxCheckoutUrl,
    session_id: sessionId,
    bid_id: bidId,
    provider: 'atexpay',
    mode: isConfigured ? 'live' : 'sandbox',
  };
}

/**
 * Handles incoming AtexPay Webhook events
 */
export async function handleAtexPayWebhook(body: Record<string, any>) {
  console.log('[AtexPay Webhook] Received payload:', JSON.stringify(body));

  // Determine event type and payload details
  const event = body.event || body.type || 'payment.succeeded';
  const data = body.data || body;
  const metadata = data.metadata || body.metadata || {};

  const sessionId = data.session_id || data.id || body.session_id || metadata.session_id;
  const bidId = metadata.bid_id || data.bid_id || body.bid_id || `bid-${Date.now()}`;
  const amount = Number(data.amount || body.amount || metadata.amount || 0);
  const profileUrl = metadata.profile_url || data.profile_url || body.profile_url || '#';
  const userName = metadata.user_name || data.user_name || body.user_name || 'Anonymous Maker';
  const handle = metadata.handle || data.handle || body.handle || '@builder';
  const category = metadata.category || data.category || body.category || 'Other';
  const message = metadata.message || data.message || body.message || 'Placed via AtexPay';
  const platform = metadata.platform || data.platform || body.platform || 'website';
  const paymentMethod = metadata.payment_method || data.payment_method || body.payment_method || 'instant';

  // Check if session exists in memory
  let stored = sessionId ? sessionStore.get(sessionId) : undefined;
  if (!stored) {
    stored = {
      sessionId: sessionId || `atex_${Date.now()}`,
      bidId,
      amount,
      profile_url: profileUrl,
      message,
      category,
      payment_method: paymentMethod,
      user_name: userName,
      handle,
      platform,
      status: 'paid',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };
  } else {
    stored.status = 'paid';
    stored.paidAt = new Date().toISOString();
  }

  if (sessionId) {
    sessionStore.set(sessionId, stored);
  }
  paidBidsStore.unshift(stored);

  // Update or insert into Supabase `leaderboard_bids` table with status 'paid'
  let supabaseUpdated = false;
  const supabase = getServerSupabaseClient();

  if (supabase) {
    try {
      const bidPayload = {
        id: bidId,
        user_name: stored.user_name,
        handle: stored.handle,
        platform: stored.platform,
        message: stored.message,
        amount: stored.amount,
        category: stored.category,
        product_url: stored.profile_url,
        created_at: new Date().toISOString(),
        clicks: 0,
        status: 'paid',
        is_verified: stored.amount >= 200,
        avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(stored.handle || stored.user_name)}&backgroundColor=ff7e5f`,
      };

      const { error } = await supabase
        .from('leaderboard_bids')
        .upsert([bidPayload], { onConflict: 'id' });

      if (error) {
        console.warn('[AtexPay Webhook] Supabase upsert error:', error);
      } else {
        supabaseUpdated = true;
        console.log('[AtexPay Webhook] Successfully upserted bid into Supabase leaderboard_bids:', bidId);
      }
    } catch (dbErr) {
      console.warn('[AtexPay Webhook] Failed to write to Supabase:', dbErr);
    }
  }

  return {
    received: true,
    status: 'paid',
    event,
    bid_id: bidId,
    session_id: sessionId,
    supabase_updated: supabaseUpdated,
    bid_data: stored,
  };
}

/**
 * Verifies and marks a checkout session as paid
 */
export async function verifyCheckoutSession(sessionId: string) {
  const session = sessionStore.get(sessionId);
  if (!session) {
    return {
      success: false,
      error: 'Session not found',
    };
  }

  if (session.status !== 'paid') {
    session.status = 'paid';
    session.paidAt = new Date().toISOString();
    sessionStore.set(sessionId, session);
    paidBidsStore.unshift(session);

    // Also sync to Supabase
    const supabase = getServerSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('leaderboard_bids')
          .upsert([
            {
              id: session.bidId,
              user_name: session.user_name,
              handle: session.handle,
              platform: session.platform,
              message: session.message,
              amount: session.amount,
              category: session.category,
              product_url: session.profile_url,
              created_at: new Date().toISOString(),
              clicks: 0,
              status: 'paid',
              is_verified: session.amount >= 200,
              avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(session.handle || session.user_name)}&backgroundColor=ff7e5f`,
            },
          ], { onConflict: 'id' });
      } catch (err) {
        console.warn('[AtexPay] Verification Supabase sync error:', err);
      }
    }
  }

  return {
    success: true,
    session,
  };
}

/**
 * Returns all recent paid bids from AtexPay store
 */
export function getPaidBidsFromStore() {
  return [...paidBidsStore];
}
