export type Platform = 'website' | 'x' | 'youtube' | 'tiktok' | 'instagram' | 'github';

export type Category =
  | 'All'
  | 'Leaderboards'
  | 'Marketing'
  | 'SEO'
  | 'Productivity'
  | 'Agents'
  | 'Developer'
  | 'Crypto'
  | 'Other'
  | 'Explore';

export interface BidEntry {
  id: string;
  user_name: string;
  handle: string;
  platform: Platform;
  message: string;
  amount: number;
  category: string;
  product_url: string;
  created_at: string;
  clicks?: number;
  avatar_url?: string;
  is_verified?: boolean;
}

export interface DealEntry {
  id: string;
  title: string;
  description?: string;
  starting_price: number;
  current_price: number;
  end_time: string; // ISO date string
  is_active: boolean;
  highest_bidder?: string;
  bids_count?: number;
  tag?: string;
}

export type TimeFilter = 'all-time' | 'today';
