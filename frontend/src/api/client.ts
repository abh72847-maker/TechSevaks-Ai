import { fallback } from './fallback';
import type {
  AdminSummary, BuyerMatchResponse, FpoAggregateResponse, FpoDashboardResponse,
  ForecastResponse, Lot, LotDetailResponse, MarketPricesResponse, MarketTrendsResponse,
  NetRealisationResponse, Offer, PaymentItem, RecommendationResponse,
} from '../types';

export const connectivity = (() => {
  let value = true;
  let checked = false;
  const subs = new Set<(v: boolean) => void>();
  return {
    get isOnline() {
      return value;
    },
    get isChecked() {
      return checked;
    },
    set(v: boolean) {
      const changed = v !== value;
      value = v;
      checked = true;
      if (changed) subs.forEach((s) => s(v));
    },
    subscribe(fn: (v: boolean) => void) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
})();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(path, { ...init, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    connectivity.set(true);
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timer);
    connectivity.set(false);
    console.warn('[KrishiSetu] Backend unreachable — serving bundled demo engine.', err);
    return fallback.handle(path, init);
  }
}

const qs = (params: Record<string, string | number | undefined> | undefined) => {
  if (!params) return '';
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : '';
};

const post = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  check: () => fetch('/api/market-prices').then((r) => r.ok).catch(() => false),

  marketPrices: (crop?: string) => request<MarketPricesResponse>('/api/market-prices' + qs({ crop })),
  marketTrends: (crop = 'tomato', days = 30) =>
    request<MarketTrendsResponse>(`/api/market-trends${qs({ crop, days })}`),
  forecast: (payload: { crop: string; market: string; days: number }) =>
    request<ForecastResponse>('/api/price-forecast', post(payload)),
  netRealisation: (payload: Record<string, unknown>) =>
    request<NetRealisationResponse>('/api/net-realisation', post(payload)),
  recommendation: (payload: Record<string, unknown>) =>
    request<RecommendationResponse>('/api/recommendation', post(payload)),
  buyerMatch: (payload: Record<string, unknown>) =>
    request<BuyerMatchResponse>('/api/buyer-match', post(payload)),
  fpoAggregate: (payload: Record<string, unknown>) =>
    request<FpoAggregateResponse>('/api/fpo/aggregate', post(payload)),
  fpoDashboard: (fpoId = 'fpo1') => request<FpoDashboardResponse>(`/api/fpo/dashboard?fpo_id=${fpoId}`),
  buyerRequirements: (crop?: string) => request<Record<string, unknown>>(`/api/buyer-requirements${qs({ crop })}`),

  listLots: (params?: { crop?: string; status?: string }) =>
    request<{ lots: Lot[] }>('/api/lots' + qs(params)),
  lotDetail: (lotId: string) => request<LotDetailResponse>(`/api/lots/${lotId}`),
  createLot: (payload: Record<string, unknown>) =>
    request<{ lot: Lot }>('/api/lots', post(payload)),
  createOffer: (payload: Record<string, unknown>) =>
    request<{ offer: Offer }>('/api/offers', post(payload)),
  listOffers: (lotId?: string) => request<{ offers: Offer[] }>('/api/offers' + qs({ lot_id: lotId })),
  negotiate: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/negotiations', post(payload)),
  acceptOffer: (offerId: string) =>
    request<Record<string, unknown>>(`/api/offers/${offerId}/accept`, post({})),
  createOrder: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/orders', post(payload)),
  listOrders: () => request<{ orders: Record<string, unknown>[] }>('/api/orders'),
  listPayments: () => request<{ payments: PaymentItem[] }>('/api/payments'),
  settlePayment: (orderId: string) => request<Record<string, unknown>>('/api/payments/settle', post({ order_id: orderId })),
  listLogistics: (orderId?: string) =>
    request<Record<string, unknown>>('/api/logistics' + qs({ order_id: orderId })),
  advanceLogistics: (id: string) =>
    request<Record<string, unknown>>(`/api/logistics/${id}/advance`, post({})),
  createGrievance: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/grievances', post(payload)),
  listGrievances: () => request<{ grievances: Record<string, unknown>[] }>('/api/grievances'),
  resolveGrievance: (id: string) =>
    request<Record<string, unknown>>(`/api/grievances/${id}/resolve`, post({})),
  adminSummary: () => request<AdminSummary>('/api/admin/summary'),
  listBuyers: () => request<{ buyers: Record<string, unknown>[] }>('/api/buyers'),
  listFarmers: () => request<{ farmers: Record<string, unknown>[] }>('/api/farmers'),
  listCrops: () => request<{ crops: Record<string, unknown>[] }>('/api/crops'),
  listMarkets: () => request<{ markets: Record<string, unknown>[] }>('/api/markets'),
};

export type Api = typeof api;