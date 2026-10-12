import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BidEntry, DealEntry } from '../types';
import { INITIAL_BIDS } from './mockData';

// Local storage keys
const STORAGE_KEY_BIDS = 'outbid_bids_v1';
const STORAGE_KEY_DEALS = 'outbid_deals_v1';
const STORAGE_KEY_CUSTOM_URL = 'outbid_supabase_url';
const STORAGE_KEY_CUSTOM_KEY = 'outbid_supabase_key';

// Check if environment or custom localStorage keys are present
export function getSupabaseCredentials() {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CUSTOM_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CUSTOM_KEY) : null;

  const url = customUrl || (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
  const anonKey = customKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('http') &&
    anonKey.length > 20 &&
    !url.includes('your-supabase-id')
  );

  return { url, anonKey, isConfigured };
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Local Reactive Store with cross-tab BroadcastChannel
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('outbid_realtime_channel')
  : null;

type BidsChangeListener = (data: BidEntry[], isFallback?: boolean) => void;
type DealsChangeListener = (data: DealEntry[]) => void;
const bidsListeners = new Set<BidsChangeListener>();
const dealsListeners = new Set<DealsChangeListener>();

// Load or initialize local bids (strictly empty default, strips any stale mock IDs)
export function getLocalBids(): BidEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BIDS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out legacy mock data IDs (bid-1 through bid-8) from older test versions
    const mockIds = new Set(['bid-1', 'bid-2', 'bid-3', 'bid-4', 'bid-5', 'bid-6', 'bid-7', 'bid-8']);
    const realBids = parsed.filter(
      (b) => b && typeof b === 'object' && b.id && !mockIds.has(b.id)
    );

    return realBids;
  } catch {
    return [];
  }
}

export function saveLocalBids(bids: BidEntry[]) {
  if (typeof window === 'undefined') return;
  // Sort descending by amount
  const sorted = [...bids].sort((a, b) => b.amount - a.amount);
  try {
    localStorage.setItem(STORAGE_KEY_BIDS, JSON.stringify(sorted));
    bidsListeners.forEach(listener => listener(sorted, false));
    broadcastChannel?.postMessage({ type: 'BIDS_UPDATED', payload: sorted, isFallback: false });
  } catch (e) {
    console.error('Failed to save local bids:', e);
  }
}

export function clearAllLocalBids() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_BIDS);
    bidsListeners.forEach(listener => listener(INITIAL_BIDS, true));
    broadcastChannel?.postMessage({ type: 'BIDS_UPDATED', payload: INITIAL_BIDS, isFallback: true });
  } catch (e) {
    console.error('Failed to clear local bids:', e);
  }
}

// Load or initialize local deals
export function getLocalDeals(): DealEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEALS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalDeals(deals: DealEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
    dealsListeners.forEach(listener => listener(deals));
    broadcastChannel?.postMessage({ type: 'DEALS_UPDATED', payload: deals });
  } catch (e) {
    console.error('Failed to save local deals:', e);
  }
}

// Listen for cross-tab messages
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'BIDS_UPDATED') {
      bidsListeners.forEach(l => l(event.data.payload, event.data.isFallback));
    } else if (event.data?.type === 'DEALS_UPDATED') {
      dealsListeners.forEach(l => l(event.data.payload));
    }
  };
}

// --- DATA ACCESS LAYER ---

export interface FetchLeaderboardBidsResult {
  data: BidEntry[];
  source: 'supabase' | 'local';
  isFallback: boolean;
}

/**
 * Fetch leaderboard bids
 * Queries database table 'leaderboard_bids'.
 * When database table is empty (0 records), returns showcase seed bids ({ isFallback: true }).
 * When real user bids exist, returns real database entries ({ isFallback: false }) with 100% priority.
 */
export async function fetchLeaderboardBids(): Promise<FetchLeaderboardBidsResult> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('leaderboard_bids')
        .select('*')
        .order('amount', { ascending: false });

      if (error) {
        console.warn('Database fetch failed for leaderboard_bids:', error.message);
        const local = getLocalBids();
        if (local.length > 0) {
          return { data: local, source: 'local', isFallback: false };
        }
        return { data: INITIAL_BIDS, source: 'supabase', isFallback: true };
      }

      if (Array.isArray(data) && data.length > 0) {
        // Map database columns to BidEntry
        const mapped: BidEntry[] = data.map(item => ({
          id: String(item.id || `bid-${Math.random().toString(36).slice(2, 9)}`),
          user_name: item.user_name || 'Anonymous Maker',
          handle: item.handle || '@builder',
          platform: item.platform || 'website',
          message: item.message || '',
          amount: Number(item.amount) || 0,
          category: item.category || 'Other',
          product_url: item.product_url || item.profile_url || '#',
          created_at: item.created_at || new Date().toISOString(),
          clicks: Number(item.clicks) || 0,
          avatar_url: item.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.handle || item.user_name}`,
          is_verified: Boolean(item.is_verified),
        }));
        return { data: mapped, source: 'supabase', isFallback: false };
      }

      // Live query returned empty/zero results: check if local store has real bids
      const local = getLocalBids();
      if (local.length > 0) {
        return { data: local, source: 'local', isFallback: false };
      }

      // No active bids recorded yet: populate showcase seed bids
      return { data: INITIAL_BIDS, source: 'supabase', isFallback: true };
    } catch (err) {
      console.warn('Database fetch exception:', err);
      const local = getLocalBids();
      if (local.length > 0) {
        return { data: local, source: 'local', isFallback: false };
      }
      return { data: INITIAL_BIDS, source: 'supabase', isFallback: true };
    }
  }

  // Database not configured: return local bids if any, otherwise fallback to seed bids
  const local = getLocalBids();
  if (local.length > 0) {
    return { data: local, source: 'local', isFallback: false };
  }
  return { data: INITIAL_BIDS, source: 'local', isFallback: true };
}

/**
 * Submit a new bid to leaderboard
 */
export async function submitLeaderboardBid(entry: Omit<BidEntry, 'id' | 'created_at' | 'clicks'>): Promise<{ success: boolean; data?: BidEntry; error?: string }> {
  const client = getSupabaseClient();
  const newId = `bid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const newBid: BidEntry = {
    ...entry,
    id: newId,
    created_at: now,
    clicks: 0,
    avatar_url: entry.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(entry.handle || entry.user_name)}&backgroundColor=ff7e5f`,
    is_verified: entry.amount >= 200,
  };

  if (client) {
    try {
      const { error } = await client
        .from('leaderboard_bids')
        .insert([{
          id: newBid.id,
          user_name: newBid.user_name,
          handle: newBid.handle,
          platform: newBid.platform,
          message: newBid.message,
          amount: newBid.amount,
          category: newBid.category,
          product_url: newBid.product_url,
          created_at: newBid.created_at,
          clicks: 0,
        }]);

      if (error) {
        console.warn('Supabase insert failed, saving to local store:', error);
      } else {
        // Also sync local cache
        const current = getLocalBids();
        saveLocalBids([newBid, ...current]);
        return { success: true, data: newBid };
      }
    } catch (err: unknown) {
      console.warn('Supabase error on insert:', err);
    }
  }

  // Fallback to local
  const current = getLocalBids();
  // Filter out any duplicate if same URL/handle is re-bidding, or keep history
  const updated = [newBid, ...current.filter(b => b.product_url !== newBid.product_url || b.id !== newBid.id)];
  saveLocalBids(updated);
  return { success: true, data: newBid };
}

/**
 * Record a click on a bid entry
 */
export async function recordBidClick(bidId: string): Promise<void> {
  const client = getSupabaseClient();

  if (client) {
    try {
      await client.rpc('increment_bid_clicks', { bid_id: bidId });
    } catch {
      // If RPC doesn't exist, we can fallback to update or local
    }
  }

  // Always update locally
  const current = getLocalBids();
  const updated = current.map(bid => {
    if (bid.id === bidId) {
      return { ...bid, clicks: (bid.clicks || 0) + 1 };
    }
    return bid;
  });
  saveLocalBids(updated);
}

/**
 * Fetch deals
 */
export async function fetchDealsList(): Promise<{ data: DealEntry[]; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('deals')
        .select('*')
        .order('is_active', { ascending: false });

      if (error) {
        console.warn('Deals fetch failed from Supabase:', error);
        return { data: [], source: 'supabase' };
      }

      if (Array.isArray(data)) {
        const mapped: DealEntry[] = data.map(item => ({
          id: item.id || `deal-${Math.random()}`,
          title: item.title,
          description: item.description || '',
          starting_price: Number(item.starting_price) || 0,
          current_price: Number(item.current_price) || 0,
          end_time: item.end_time || new Date(Date.now() + 3600000).toISOString(),
          is_active: Boolean(item.is_active),
          highest_bidder: item.highest_bidder || '@anonymous',
          bids_count: Number(item.bids_count) || 1,
          tag: item.tag || 'POP Deal',
        }));
        return { data: mapped, source: 'supabase' };
      }
      return { data: [], source: 'supabase' };
    } catch (err) {
      console.warn('Deals fetch failed from Supabase:', err);
      return { data: [], source: 'supabase' };
    }
  }

  return { data: getLocalDeals(), source: 'local' };
}

/**
 * Place a POP Deal bid
 */
export async function placeDealBid(
  dealId: string,
  newPrice: number,
  bidder: string
): Promise<{ success: boolean; deal?: DealEntry }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('deals')
        .update({
          current_price: newPrice,
          highest_bidder: bidder,
        })
        .eq('id', dealId)
        .select();

      if (!error && data && data[0]) {
        return { success: true, deal: data[0] as DealEntry };
      }
    } catch (err) {
      console.warn('Supabase deal update failed:', err);
    }
  }

  // Local fallback
  const deals = getLocalDeals();
  let updatedDeal: DealEntry | undefined;
  const updated = deals.map(deal => {
    if (deal.id === dealId) {
      updatedDeal = {
        ...deal,
        current_price: newPrice,
        highest_bidder: bidder,
        bids_count: (deal.bids_count || 0) + 1,
        // Add 60 seconds if less than 2 mins left (POP auction anti-snipe logic)
        end_time: new Date(Math.max(new Date(deal.end_time).getTime(), Date.now() + 1000 * 90)).toISOString(),
      };
      return updatedDeal;
    }
    return deal;
  });

  saveLocalDeals(updated);
  return { success: true, deal: updatedDeal };
}

/**
 * Realtime subscriptions for Leaderboard
 */
export function subscribeToLeaderboard(callback: (bids: BidEntry[], isFallback?: boolean) => void): () => void {
  bidsListeners.add(callback);
  const client = getSupabaseClient();

  let subscription: any = null;
  if (client) {
    try {
      subscription = client
        .channel('public:leaderboard_bids')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leaderboard_bids' },
          async () => {
            const { data, isFallback } = await fetchLeaderboardBids();
            callback(data, isFallback);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }

  return () => {
    bidsListeners.delete(callback);
    if (subscription && client) {
      client.removeChannel(subscription);
    }
  };
}

/**
 * Realtime subscriptions for POP Deals
 */
export function subscribeToDeals(callback: (deals: DealEntry[]) => void): () => void {
  dealsListeners.add(callback);
  const client = getSupabaseClient();

  let subscription: any = null;
  if (client) {
    try {
      subscription = client
        .channel('public:deals')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'deals' },
          async () => {
            const { data } = await fetchDealsList();
            callback(data);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime deals subscription error:', err);
    }
  }

  return () => {
    dealsListeners.delete(callback);
    if (subscription && client) {
      client.removeChannel(subscription);
    }
  };
}

/**
 * Test Supabase connection
 */
export async function testConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, key);
    const { error } = await testClient.from('leaderboard_bids').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, connection is valid but tables are needed
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Notice: Tables need to be created using the SQL snippet below).',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected and verified tables in Supabase!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed' };
  }
}

/**
 * SQL Schema generator for users wanting to run setup in Supabase SQL editor
 */
export function getSupabaseSQLSchema(): string {
  return `-- 1. Create leaderboard_bids table
CREATE TABLE IF NOT EXISTS public.leaderboard_bids (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  handle TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'website',
  message TEXT,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  product_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  starting_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  highest_bidder TEXT DEFAULT '@maker',
  bids_count INTEGER DEFAULT 0,
  tag TEXT DEFAULT 'POP Deal'
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.leaderboard_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- 4. Public access policies for leaderboard & deals
CREATE POLICY "Public read leaderboard_bids" ON public.leaderboard_bids FOR SELECT USING (true);
CREATE POLICY "Public insert leaderboard_bids" ON public.leaderboard_bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update leaderboard_bids" ON public.leaderboard_bids FOR UPDATE USING (true);

CREATE POLICY "Public read deals" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Public insert deals" ON public.deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update deals" ON public.deals FOR UPDATE USING (true);

-- 5. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
`;
}
