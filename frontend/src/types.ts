export interface PriceRow {
  crop: string;
  crop_name?: string;
  market: string;
  market_id?: string;
  price_per_q: number;
  price_per_kg: number;
  change_pct: number;
  arrivals_qty: number;
  demand_index: number;
  distance_km: number;
}

export interface MarketInfo {
  id: string;
  name: string;
  kind: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface MarketPricesResponse {
  as_of?: string;
  crops: string[];
  markets: MarketInfo[];
  rows: PriceRow[];
  source: string;
  note: string;
}

export interface MarketTrendsResponse {
  crop: string;
  days: number;
  markets: string[];
  series: Record<string, { date: string; price: number }[]>;
  source: string;
  note: string;
}

export interface ForecastPoint {
  date: string;
  price: number;
  low: number;
  high: number;
}

export interface ForecastResponse {
  crop: string;
  market: string;
  current_price_per_kg: number;
  current_price_per_q: number;
  days: number;
  forecast: ForecastPoint[];
  expected_change_pct: number;
  confidence: number;
  method: string;
  source: string;
  note: string;
}

export interface NetOption {
  market: string;
  kind: string;
  distance_km: number;
  price_per_kg: number;
  price_per_q: number;
  arrivals_qty: number;
  demand_index: number;
  net_per_kg: number;
  net_total: number;
  transport_total: number;
  rank: number;
}

export interface NetRealisationResponse {
  crop: string;
  quantity_kg: number;
  quality: string;
  market: string;
  price_per_kg: number;
  revenue: number;
  costs: { transport: number; storage: number; handling: number; expected_loss: number; total_costs: number };
  net_realisation: number;
  net_per_kg: number;
  margin_pct: number;
  buyer_id?: string | null;
  matched_buyer?: Record<string, unknown> | null;
  best_option: NetOption;
  options: NetOption[];
  recommended_market: string;
  source: string;
  note: string;
}

export interface WhenDecision {
  action: 'sell_now' | 'wait' | 'store' | string;
  label: string;
  reason: string;
  days_to_sell: number;
  score: number;
}

export interface WhereDecision {
  market: string;
  kind: string;
  price_per_kg: number;
  net_per_kg: number;
  net_total: number;
  distance_km: number;
  demand_index: number;
  reason: string;
  score: number;
}

export interface WhoDecision {
  buyer_id: string;
  buyer: string;
  city: string;
  price_per_kg: number;
  match_score: number;
  payment_terms: string;
  advance_pct: number;
  reason: string;
  score: number;
}

export interface RecommendationResponse {
  farmer_id?: string | null;
  crop: string;
  quantity_kg: number;
  quality: string;
  location: string;
  sell_within_days: number;
  when: WhenDecision;
  where: WhereDecision;
  who: WhoDecision;
  net_per_kg: number;
  net_total: number;
  confidence: number;
  factors: string[];
  source: string;
  note: string;
}

export interface BuyerMatch {
  buyer: { id: string; company: string; city: string; industry: string; avatar_initial: string };
  requirement: {
    min_qty_kg: number;
    max_qty_kg: number;
    grades: string[];
    payment_terms_days: number;
    advance_pct: number;
    price_per_kg: number;
  };
  distance_km: number;
  match_score: number;
  breakdown: Record<string, number>;
  reasons: string[];
  rank: number;
}

export interface BuyerMatchResponse {
  crop: string;
  quantity_kg: number;
  quality: string;
  location: string;
  market_avg_price_per_kg: number;
  matches: BuyerMatch[];
  source: string;
  note: string;
}

export interface FpoMember {
  id: string;
  name: string;
  location: string;
  quantity_kg: number;
  quality: string;
  harvest_date: string;
}

export interface Fpo {
  id: string;
  name: string;
  district: string;
  state: string;
  member_count: number;
  reliability: number;
  location: string;
  founded: number;
}

export interface Lot {
  id: string;
  crop: string;
  quantity_kg: number;
  quality: string;
  grade: string;
  location: string;
  market: string;
  expected_price_per_kg: number;
  harvest_date: string;
  fpo: string;
  seller: string;
  seller_type: 'farmer' | 'fpo';
  status: string;
  description?: string;
  created_at?: string;
}

export interface Offer {
  id: string;
  lot_id: string;
  buyer_id: string;
  buyer: string;
  price_per_kg: number;
  quantity_kg: number;
  delivery_days: number;
  status: string;
  message: string;
  created_at?: string;
}

export interface Negotiation {
  id: string;
  offer_id: string;
  side: 'buyer' | 'seller' | string;
  message: string;
  price_per_kg?: number | null;
  created_at?: string;
}

export interface LotDetailResponse {
  lot: Lot;
  offers: Offer[];
  negotiations: Negotiation[];
  quality: unknown;
  source: string;
  note: string;
}

export interface OrderItem {
  id: string;
  lot_id: string;
  offer_id: string;
  buyer_id: string;
  buyer: string;
  amount: number;
  status: string;
  note: string;
  created_at: string;
}

export interface LogisticsItem {
  id: string;
  order_id: string;
  carrier: string;
  from: string;
  to: string;
  distance_km: number;
  cost: number;
  eta: string;
  status: string;
}

export interface PaymentItem {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  method: string;
}

export interface GrievanceItem {
  id: string;
  order_id?: string;
  lot_id?: string;
  category: string;
  description: string;
  status: string;
  raised_by: string;
  resolution?: string;
}

export interface Buyer {
  id: string;
  company: string;
  city: string;
  industry: string;
  payment_terms_days: number;
  advance_pct: number;
  reliability: number;
  avatar_initial: string;
  preferred_market: string;
  max_distance_km: number;
  requirements: {
    crop: string;
    grades: string[];
    min_qty_kg: number;
    max_qty_kg: number;
    price_per_kg: number;
  }[];
}

export interface FpoAggregateResponse {
  group: {
    crop: string;
    quality: string;
    farmer_count: number;
    total_quantity_kg: number;
    per_farm_avg_kg: number;
    recommended_market: string;
    best_price_per_kg: number;
    best_net_per_kg: number;
    transport_saving_pct: number;
  };
  lot_created: Lot;
  buyers_interested: BuyerMatch[];
  member_list: FpoMember[];
  source: string;
  note: string;
}

export interface AdminSummary {
  counts: Record<string, number>;
  traded_volume_kg: number;
  order_value_inr: number;
  settled_inr: number;
  lot_status_distribution: Record<string, number>;
  grievance_open: number;
  recent_orders: OrderItem[];
  avg_margin_pct: number;
  source: string;
  note: string;
}

export interface FpoDashboardResponse {
  fpo: Fpo;
  members: FpoMember[];
  total_member_quantity_kg: number;
  grade_a_share_pct: number;
  lots: Lot[];
  open_offers: Offer[];
  source: string;
  note: string;
}