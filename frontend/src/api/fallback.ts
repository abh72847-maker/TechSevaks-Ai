/* Bundled offline engine.
 * Mirrors backend/app responses 1:1 so the frontend stays fully demonstrable
 * even when the FastAPI server is not running. Data is simulated.
 */

interface Ctx {
  online: boolean;
  as_of: string;
  cropBases: Record<string, number>;
  marketDefs: { id: string; name: string; kind: string; city: string; state: string; lat: number; lng: number; mult: number; km: number }[];
  prices: Record<string, Record<string, { q: number; change: number; arrivals: number; demand: number; series: { date: string; price: number }[] }>>;
  buyers: any[];
  lots: any[];
  offers: any[];
  orders: any[];
  logistics: any[];
  payments: any[];
  grievances: any[];
  negotiations: any[];
  seq: Record<string, number>;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CROP_BASES: Record<string, number> = {
  tomato: 1450, onion: 1850, potato: 1350, chilli: 7800, brinjal: 1250,
  cabbage: 1050, cauliflower: 1600, soybean: 4100, cotton: 6850,
};
const CROP_NAMES: Record<string, string> = {
  tomato: 'Tomato', onion: 'Onion', potato: 'Potato', chilli: 'Chilli', brinjal: 'Brinjal',
  cabbage: 'Cabbage', cauliflower: 'Cauliflower', soybean: 'Soybean', cotton: 'Cotton',
};

const MARKET_DEFS = [
  { id: 'pimpalgaon', name: 'Pimpalgaon APMC', kind: 'APMC (Tomato hub)', city: 'Pimpalgaon', state: 'Maharashtra', lat: 20.075, lng: 74.029, mult: 1.38, km: 28 },
  { id: 'nashik_apmc', name: 'Nashik APMC', kind: 'APMC', city: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, mult: 1.12, km: 18 },
  { id: 'lasalgaon', name: 'Lasalgaon APMC', kind: 'APMC (Onion hub)', city: 'Lasalgaon', state: 'Maharashtra', lat: 20.1347, lng: 74.2494, mult: 1.18, km: 82 },
  { id: 'manmad', name: 'Manmad Market Yard', kind: 'Market yard', city: 'Manmad', state: 'Maharashtra', lat: 20.2503, lng: 74.4375, mult: 0.96, km: 60 },
  { id: 'narayangaon', name: 'Narayangaon Mandi', kind: 'Tomato hub', city: 'Narayangaon', state: 'Maharashtra', lat: 19.121, lng: 73.983, mult: 1.05, km: 98 },
  { id: 'vashi', name: 'Vashi APMC (Navi Mumbai)', kind: 'Metro APMC', city: 'Navi Mumbai', state: 'Maharashtra', lat: 19.061, lng: 73.001, mult: 1.42, km: 172 },
  { id: 'hadapsar', name: 'Hadapsar Market Yard (Pune)', kind: 'APMC', city: 'Pune', state: 'Maharashtra', lat: 18.508, lng: 73.925, mult: 1.26, km: 208 },
  { id: 'azadpur', name: 'Azadpur Mandi (Delhi)', kind: 'Metro APMC', city: 'Delhi', state: 'Delhi', lat: 28.703, lng: 77.178, mult: 1.55, km: 1420 },
];

const BUYER_DEFS = [
  { id: 'b1', company: 'AgroFresh Retail Pvt Ltd', city: 'Nashik', industry: 'Modern retail', payment_terms_days: 7, advance_pct: 20, reliability: 0.9, avatar_initial: 'AG', preferred_market: 'Pimpalgaon APMC', max_distance_km: 150, requirements: [{ crop: 'tomato', grades: ['A'], min_qty_kg: 500, max_qty_kg: 4000, price_per_kg: 19.2 }] },
  { id: 'b2', company: 'Star Agri Exports', city: 'Nashik', industry: 'Export', payment_terms_days: 0, advance_pct: 50, reliability: 0.93, avatar_initial: 'SE', preferred_market: 'Nashik APMC', max_distance_km: 120, requirements: [{ crop: 'tomato', grades: ['A'], min_qty_kg: 1000, max_qty_kg: 8000, price_per_kg: 19.4 }] },
  { id: 'b3', company: 'GreenBasket Mart (Pune)', city: 'Pune', industry: 'Supermarket chain', payment_terms_days: 10, advance_pct: 10, reliability: 0.84, avatar_initial: 'GB', preferred_market: 'Hadapsar Market', max_distance_km: 260, requirements: [{ crop: 'tomato', grades: ['A', 'B'], min_qty_kg: 800, max_qty_kg: 3000, price_per_kg: 17.8 }] },
  { id: 'b4', company: 'FreshNation Distribution', city: 'Navi Mumbai', industry: 'Fresh distribution', payment_terms_days: 5, advance_pct: 25, reliability: 0.88, avatar_initial: 'FN', preferred_market: 'Vashi APMC', max_distance_km: 220, requirements: [{ crop: 'tomato', grades: ['A', 'B'], min_qty_kg: 1000, max_qty_kg: 5000, price_per_kg: 18.4 }] },
  { id: 'b5', company: 'Delhi Spice & Veg Traders', city: 'Delhi', industry: 'Wholesale trading', payment_terms_days: 14, advance_pct: 0, reliability: 0.79, avatar_initial: 'DS', preferred_market: 'Azadpur Mandi', max_distance_km: 1600, requirements: [{ crop: 'tomato', grades: ['B', 'C'], min_qty_kg: 2000, max_qty_kg: 10000, price_per_kg: 19.6 }] },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

function buildCtx(): Ctx {
  const rng = mulberry32(7);
  const asOf = new Date();
  const prices: Ctx['prices'] = {};
  for (const crop of Object.keys(CROP_BASES)) {
    prices[crop] = {};
    for (const m of MARKET_DEFS) {
      const base = CROP_BASES[crop] * m.mult;
      const q = base * (1 + (rng() - 0.5) * 0.06);
      const prev = q / (1 + (rng() - 0.5) * 0.06);
      const series: { date: string; price: number }[] = [];
      let p = q * (1 - 0.06 + rng() * 0.04);
      for (let i = 29; i >= 0; i--) {
        const d = new Date(asOf);
        d.setDate(d.getDate() - i);
        p = Math.max(q * 0.8, p * (1 + 0.002 + (rng() - 0.5) * 0.012));
        series.push({ date: iso(d), price: Number(p.toFixed(2)) });
      }
      prices[crop][m.name] = {
        q: Number(q.toFixed(2)), change: Number(((q - prev) / prev * 100).toFixed(2)),
        arrivals: Number((250 + rng() * 1200).toFixed(0)), demand: Number((48 + rng() * 48).toFixed(0)), series,
      };
    }
  }
  const lots = [
    { id: 'KSL-1001', crop: 'tomato', quantity_kg: 1500, quality: 'A', grade: 'Grade A', location: 'Wadivihir, Nashik', market: 'Pimpalgaon APMC', expected_price_per_kg: 18.9, harvest_date: '2026-08-27', fpo: 'Nashik Tomato Growers FPO', seller: 'Ramesh Patil', seller_type: 'farmer', status: 'negotiating' },
    { id: 'KSL-1002', crop: 'tomato', quantity_kg: 3400, quality: 'A', grade: 'Grade A', location: 'Dindori cluster, Nashik', market: 'Pimpalgaon APMC', expected_price_per_kg: 19.1, harvest_date: '2026-08-28', fpo: 'Dindori Arpan FPO', seller: 'Dindori Arpan FPO', seller_type: 'fpo', status: 'available' },
    { id: 'KSL-1003', crop: 'onion', quantity_kg: 5200, quality: 'B', grade: 'Grade B', location: 'Lasalgaon cluster, Nashik', market: 'Lasalgaon APMC', expected_price_per_kg: 24.8, harvest_date: '2026-08-29', fpo: 'Nashik Tomato Growers FPO', seller: 'Nashik Tomato Growers FPO', seller_type: 'fpo', status: 'offered' },
    { id: 'KSL-1004', crop: 'potato', quantity_kg: 4700, quality: 'A', grade: 'Grade A', location: 'Igatpuri, Nashik', market: 'Hadapsar Market', expected_price_per_kg: 14.6, harvest_date: '2026-08-25', fpo: '—', seller: 'Sunita More', seller_type: 'farmer', status: 'delivered' },
    { id: 'KSL-1005', crop: 'tomato', quantity_kg: 900, quality: 'B', grade: 'Grade B', location: 'Wadivihir, Nashik', market: 'Narayangaon Mandi', expected_price_per_kg: 14.2, harvest_date: '2026-08-29', fpo: '—', seller: 'Ramesh Patil', seller_type: 'farmer', status: 'available' },
  ];
  const offers = [
    { id: 'OOF-1005', lot_id: 'KSL-1001', buyer_id: 'b2', buyer: 'Star Agri Exports', price_per_kg: 19.4, quantity_kg: 1500, delivery_days: 2, status: 'countered', message: 'Counter: ₹19.6/kg with 50% advance.' },
  ];
  return {
    online: false, as_of: iso(asOf), cropBases: CROP_BASES, marketDefs: MARKET_DEFS, prices, buyers: BUYER_DEFS, lots, offers,
    orders: [], logistics: [], payments: [], grievances: [], negotiations: [], seq: { lot: 1008, offer: 1006, order: 3004, log: 2006, pay: 4006, grv: 9003, neg: 8003 },
  };
}

const transport = (km: number) => 2 + 1.05 * km;
const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);

function optionsFor(ctx: Ctx, crop: string, qtyKg: number, extra: { storage?: number; handling?: number; loss?: number }) {
  const qtyQ = qtyKg / 100;
  const storage = extra.storage ?? 0;
  const handling = extra.handling ?? 0.4;
  const lossPct = extra.loss ?? 4;
  const opts: any[] = [];
  for (const m of ctx.marketDefs) {
    const px = ctx.prices[crop][m.name];
    const revenue = px.q / 100 * qtyKg;
    const tCost = transport(m.km) * qtyQ;
    const sCost = storage * qtyKg;
    const hCost = handling * qtyKg;
    const ev = revenue * lossPct / 100;
    opts.push({
      market: m.name, kind: m.kind, distance_km: m.km, price_per_kg: Number((px.q / 100).toFixed(2)),
      price_per_q: px.q, arrivals_qty: px.arrivals, demand_index: px.demand,
      net_total: Number((revenue - tCost - sCost - hCost - ev).toFixed(2)),
      transport_total: Number(tCost.toFixed(2)),
    });
  }
  opts.forEach((o) => (o.net_per_kg = Number((o.net_total / qtyKg).toFixed(2))));
  opts.sort((a, b) => b.net_per_kg - a.net_per_kg);
  opts.forEach((o, i) => (o.rank = i + 1));
  return opts;
}

function forecastFor(ctx: Ctx, crop: string, market: string, days: number) {
  const series = ctx.prices[crop][market].series;
  const n = series.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const ys = series.map((s) => s.price);
  const mx = avg(xs), my = avg(ys);
  const denom = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const slope = denom ? xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / denom : 0;
  const intercept = my - slope * mx;
  const vol = (Math.max(...ys) - Math.min(...ys)) / Math.max(1e-6, avg(ys));
  const last = new Date(series[n - 1].date);
  const forecast = Array.from({ length: days }, (_, i) => {
    const p = intercept + slope * (n - 1 + i + 1);
    const band = p * (0.03 + vol);
    const d = new Date(last);
    d.setDate(d.getDate() + i + 1);
    return { date: iso(d), price: Number(p.toFixed(2)), low: Number((p - band).toFixed(2)), high: Number((p + band).toFixed(2)) };
  });
  const current = ys[n - 1];
  const expected = Number(((forecast[days - 1].price - current) / current * 100).toFixed(2));
  return { forecast, expected, current, vol, series, as_of: series[n - 1].date };
}

function matchBuyers(ctx: Ctx, crop: string, qtyKg: number, quality: string) {
  const all = ctx.marketDefs.map((m) => ctx.prices[crop][m.name].q / 100);
  const avgPrice = avg(all);
  const cands = ctx.buyers.flatMap((b) => b.requirements.filter((r: any) => r.crop === crop).map((r: any) => ({ b, r })));
  const maxPrice = Math.max(...cands.map((c: any) => c.r.price_per_kg));
  const matches = cands.map(({ b, r }: any) => {
    const mDef = ctx.marketDefs.find((m) => m.name === b.preferred_market) ?? ctx.marketDefs[0];
    const dist = mDef.km;
    const priceScore = r.price_per_kg / maxPrice;
    const qtyOk = r.min_qty_kg <= qtyKg && qtyKg <= r.max_qty_kg;
    const qtyScore = qtyOk ? 1 : 0.4;
    const qualScore = r.grades.includes(quality) ? 1 : 0.35;
    const payScore = Math.min(1, (b.advance_pct / 50) * 1.4 + Math.max(0, (35 - b.payment_terms_days) / 35));
    const distScore = Math.exp(-dist / 220);
    const rel = b.reliability;
    const score = (0.25 * priceScore + 0.15 * qtyScore + 0.15 * qualScore + 0.15 * payScore + 0.15 * distScore + 0.15 * rel) * 100;
    const reasons = [
      `Quoted ₹${r.price_per_kg}/kg vs market avg ₹${avgPrice.toFixed(2)}/kg`,
      b.advance_pct > 0 ? `${b.advance_pct}% advance, ${b.payment_terms_days}-day settlement` : `${b.payment_terms_days}-day settlement`,
      qtyOk ? 'Quantity fits their demand band' : 'Quantity outside their demand band',
      `${dist}km to their pickup hub`,
    ];
    return {
      buyer: { id: b.id, company: b.company, city: b.city, industry: b.industry, avatar_initial: b.avatar_initial },
      requirement: { min_qty_kg: r.min_qty_kg, max_qty_kg: r.max_qty_kg, grades: r.grades, payment_terms_days: b.payment_terms_days, advance_pct: b.advance_pct, price_per_kg: r.price_per_kg },
      distance_km: dist, match_score: Number(score.toFixed(1)),
      breakdown: { price: Number(priceScore.toFixed(2)), quantity: Number(qtyScore.toFixed(2)), quality: Number(qualScore.toFixed(2)), payment: Number(payScore.toFixed(2)), distance: Number(distScore.toFixed(2)), reliability: rel },
      reasons, rank: 0,
    };
  });
  matches.sort((a, b) => b.match_score - a.match_score);
  matches.forEach((m, i) => (m.rank = i + 1));
  return { avgPrice, matches };
}

function handleRequest(ctx: Ctx, path: string, init?: RequestInit): any {
  const method = init?.method ?? 'GET';
  const url = new URL(path, 'http://local');
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  const q = (k: string) => url.searchParams.get(k) ?? undefined;
  const crop = q('crop') ?? 'tomato';
  const note = 'Bundled offline demo engine — simulated data.';

  if (path === '/api/market-prices') {
    const rows = Object.entries(ctx.prices).flatMap(([c, byMarket]) =>
      Object.entries(byMarket).map(([m, v]) => ({
        crop: c, crop_name: CROP_NAMES[c], market: m, market_id: ctx.marketDefs.find((x) => x.name === m)?.id,
        price_per_q: v.q, price_per_kg: Number((v.q / 100).toFixed(2)), change_pct: v.change,
        arrivals_qty: v.arrivals, demand_index: v.demand, distance_km: ctx.marketDefs.find((x) => x.name === m)?.km,
      })),
    ).filter((r) => !crop || r.crop === crop);
    return { as_of: ctx.as_of, crops: Object.keys(CROP_NAMES), markets: ctx.marketDefs, rows, source: 'simulated', note };
  }
  if (path === '/api/market-trends') {
    const days = Number(q('days') ?? 30);
    const series: Record<string, { date: string; price: number }[]> = {};
    ctx.marketDefs.forEach((m) => {
      series[m.name] = ctx.prices[crop][m.name].series.slice(-days).map((s) => ({ date: s.date, price: Number((s.price / 100).toFixed(2)) }));
    });
    return { crop, days, markets: Object.keys(series), series, source: 'simulated', note };
  }
  if (path === '/api/price-forecast') {
    const { forecast, expected, current, vol } = forecastFor(ctx, body.crop, body.market, body.days);
    const demand = ctx.prices[body.crop][body.market].demand;
    const confidence = Number(Math.min(0.95, Math.max(0.45, 0.58 + 0.25 * demand / 100 - vol * 2.2)).toFixed(2));
    return {
      crop: body.crop, market: body.market, current_price_per_kg: Number((current / 100).toFixed(2)),
      current_price_per_q: Number(current.toFixed(2)), days: body.days, forecast,
      expected_change_pct: expected, confidence, method: 'Bundled linear-trend engine (demo)', source: 'simulated', note,
    };
  }
  if (path === '/api/net-realisation') {
    const opts = optionsFor(ctx, body.crop, body.quantity_kg, body);
    const best = opts[0];
    const revenue = body.quantity_kg * best.price_per_kg;
    const loss = revenue * (body.expected_loss_pct ?? 4) / 100;
    const costs = {
      transport: Number(best.transport_total.toFixed(2)),
      storage: Number(((body.storage_cost_per_kg ?? 0) * body.quantity_kg).toFixed(2)),
      handling: Number(((body.handling_cost_per_kg ?? 0.4) * body.quantity_kg).toFixed(2)),
      expected_loss: Number(loss.toFixed(2)),
      total_costs: 0,
    };
    costs.total_costs = Number((costs.transport + costs.storage + costs.handling + costs.expected_loss).toFixed(2));
    return {
      crop: body.crop, quantity_kg: body.quantity_kg, quality: body.quality, market: best.market,
      price_per_kg: best.price_per_kg, revenue: Number(revenue.toFixed(2)), costs,
      net_realisation: Number((revenue - costs.total_costs).toFixed(2)), net_per_kg: best.net_per_kg,
      margin_pct: Number(((revenue - costs.total_costs) / revenue * 100).toFixed(2)),
      buyer_id: body.buyer_id ?? null, matched_buyer: null, best_option: best, options: opts.slice(0, 5),
      recommended_market: best.market, source: 'simulated', note,
    };
  }
  if (path === '/api/recommendation') {
    const opts = optionsFor(ctx, body.crop, body.quantity_kg, {});
    const where = opts[0];
    const { expected } = forecastFor(ctx, body.crop, body.market, Math.max(body.sell_within_days, 3));
    const flag = expected > 0 ? 'slightly firming' : 'broadly stable';
    const when = expected > 2.2 && body.sell_within_days >= 2
      ? { action: 'wait', label: 'Wait & sell', days_to_sell: Math.min(Math.round(expected / 1.1), body.sell_within_days), reason: `Prices at ${where.market} expected up ~${expected}% within ${body.sell_within_days} days; waiting fits your window.`, score: Number(Math.min(0.95, 0.55 + expected / 12 + body.sell_within_days / 40).toFixed(2)) }
      : { action: 'sell_now', label: 'Sell Now', days_to_sell: 1, reason: `Forecast is ${flag} (${expected >= 0 ? '+' : ''}${expected}%) in your ${body.sell_within_days}-day window; sell now to capture demand.`, score: Number((0.82 + Math.max(expected, 0) / 10).toFixed(2)) };
    const { matches } = matchBuyers(ctx, body.crop, body.quantity_kg, body.quality);
    const top = matches[0];
    const confidence = Number(Math.min(0.95, 0.55 + Number((0.58 + 0.25).toFixed(2)) * 0.35 + (where.demand_index / 100) * 0.15).toFixed(2));
    return {
      farmer_id: body.farmer_id ?? null, crop: body.crop, quantity_kg: body.quantity_kg, quality: body.quality,
      location: body.location, sell_within_days: body.sell_within_days,
      when, where: { ...where, reason: `Best net realisation ₹${where.net_per_kg}/kg after transport, handling and 4.0% loss buffer`, score: Number((0.6 + where.net_per_kg / (opts[0].net_per_kg + 1e-9) * 0.4).toFixed(2)) },
      who: { buyer_id: top.buyer.id, buyer: top.buyer.company, city: top.buyer.city, price_per_kg: top.requirement.price_per_kg, match_score: top.match_score, payment_terms: `${top.requirement.payment_terms_days}-day settlement`, advance_pct: top.requirement.advance_pct, reason: top.reasons[0] + '. ' + top.reasons[2], score: top.match_score / 100 },
      net_per_kg: where.net_per_kg, net_total: where.net_total, confidence,
      factors: ['Current price & 30-day trend', `Forecast (${expected >= 0 ? '+' : ''}${expected}% in ${body.sell_within_days}d)`, 'Transport + storage + handling costs', 'Buyer demand & payment terms', 'Quality grade compatibility', 'Seller urgency'],
      source: 'simulated', note,
    };
  }
  if (path === '/api/buyer-match') {
    const { avgPrice, matches } = matchBuyers(ctx, body.crop, body.quantity_kg, body.quality);
    return { crop: body.crop, quantity_kg: body.quantity_kg, quality: body.quality, location: body.location, market_avg_price_per_kg: Number(avgPrice.toFixed(2)), matches, source: 'simulated', note };
  }
  if (path === '/api/lots' && method === 'POST') {
    const id = `KSL-${++ctx.seq.lot}`;
    const lot = { id, crop: body.crop, quantity_kg: body.quantity_kg, quality: body.quality, grade: `Grade ${body.quality}`, location: body.location, market: body.market, expected_price_per_kg: body.expected_price_per_kg, harvest_date: body.harvest_date, fpo: body.fpo_id ? 'Nashik Tomato Growers FPO' : 'Direct', seller: body.farmer_id === 'f1' ? 'Ramesh Patil' : 'Farmer', seller_type: body.fpo_id ? 'fpo' : 'farmer', status: 'available', created_at: new Date().toISOString() };
    ctx.lots.push(lot);
    return { source: 'simulated', note: 'Digital lot created (bundled offline).', lot };
  }
  if (path === '/api/lots') {
    const rows = ctx.lots.filter((l) => (!crop || l.crop === crop) && (!q('status') || l.status === q('status')));
    return { source: 'simulated', note: 'Digital lots (demo).', lots: rows };
  }
  if (path.startsWith('/api/lots/')) {
    const id = path.split('/').pop()!;
    const lot = ctx.lots.find((l) => l.id === id);
    const offers = ctx.offers.filter((o) => o.lot_id === id);
    const negotiations = ctx.negotiations.filter((n) => offers.some((o) => o.id === n.offer_id));
    return { lot, offers, negotiations, quality: null, source: 'simulated', note: 'Lot record with offers and negotiation history.' };
  }
  if (path === '/api/offers' && method === 'POST') {
    const buyer = ctx.buyers.find((b) => b.id === body.buyer_id);
    const offer = { id: `OOF-${++ctx.seq.offer}`, lot_id: body.lot_id, buyer_id: body.buyer_id, buyer: buyer?.company, price_per_kg: body.price_per_kg, quantity_kg: body.quantity_kg, delivery_days: body.delivery_days, status: 'pending', message: body.message, created_at: new Date().toISOString() };
    ctx.offers.push(offer);
    const lot = ctx.lots.find((l) => l.id === body.lot_id);
    if (lot && lot.status === 'available') lot.status = 'offered';
    return { source: 'simulated', note: 'Offer placed on the digital lot.', offer, lot };
  }
  if (path === '/api/negotiations' && method === 'POST') {
    const neg = { id: `NEG-${++ctx.seq.neg}`, offer_id: body.offer_id, side: body.side, message: body.message, price_per_kg: body.price_per_kg ?? null, created_at: new Date().toISOString() };
    ctx.negotiations.push(neg);
    const offer = ctx.offers.find((o) => o.id === body.offer_id);
    if (offer) offer.status = 'countered';
    return { source: 'simulated', note: 'Negotiation thread updated.', negotiation: neg, offer };
  }
  if (path.startsWith('/api/offers/') && path.endsWith('/accept')) {
    return handleRequest(ctx, '/api/orders', { ...init, method: 'POST', body: JSON.stringify({ offer_id: path.split('/')[3] }) });
  }
  if (path === '/api/orders' && method === 'POST') {
    const offer = ctx.offers.find((o) => o.id === body.offer_id);
    const lot = ctx.lots.find((l) => l.id === offer.lot_id);
    const amount = Number((offer.price_per_kg * lot.quantity_kg).toFixed(2));
    const order = { id: `ORD-${++ctx.seq.order}`, lot_id: lot.id, offer_id: offer.id, buyer_id: offer.buyer_id, buyer: offer.buyer, amount, status: 'confirmed', note: body.note ?? '', created_at: new Date().toISOString() };
    const mDef = ctx.marketDefs.find((m) => m.name === lot.market) ?? ctx.marketDefs[0];
    const cost = Number(Math.max(250, transport(mDef.km) * lot.quantity_kg / 100).toFixed(0));
    const logistics = { id: `LOG-${++ctx.seq.log}`, order_id: order.id, carrier: 'Nashik RoadLink Cargo', from: lot.location, to: lot.market, distance_km: mDef.km, cost, eta: new Date(Date.now() + 2 * 86400000).toISOString(), status: 'scheduled' };
    const payment = { id: `PAY-${++ctx.seq.pay}`, order_id: order.id, amount, status: 'pending', method: 'UPI / NEFT' };
    ctx.orders.push(order); ctx.logistics.push(logistics); ctx.payments.push(payment);
    offer.status = 'accepted'; lot.status = 'order_confirmed';
    return { source: 'simulated', note: 'Order confirmed and pipeline created.', order, logistics, payment, lot };
  }
  if (path === '/api/payments/settle' && method === 'POST') {
    const pay = ctx.payments.find((p) => p.order_id === body.order_id);
    if (pay) { pay.status = 'settled'; }
    const order = ctx.orders.find((o) => o.id === body.order_id);
    if (order) { order.status = 'paid'; const lot = ctx.lots.find((l) => l.id === order.lot_id); if (lot) lot.status = 'paid'; }
    return { source: 'simulated', note: 'Payment settled (demo).', payment: pay };
  }
  if (path === '/api/payments') {
    return { source: 'simulated', note: 'Payment ledger.', payments: ctx.payments };
  }
  if (path === '/api/logistics') {
    const rows = q('order_id') ? ctx.logistics.filter((l) => l.order_id === q('order_id')) : ctx.logistics;
    return { source: 'simulated', note: 'Transport & delivery pipeline.', logistics: rows };
  }
  if (path === '/api/grievances' && method === 'POST') {
    const g = { id: `GRV-${++ctx.seq.grv}`, order_id: body.order_id ?? undefined, lot_id: body.lot_id ?? undefined, category: body.category, description: body.description, status: 'open', raised_by: body.raised_by, resolution: '', created_at: new Date().toISOString() };
    ctx.grievances.push(g);
    return { source: 'simulated', note: 'Grievance logged with audit trail.', grievance: g };
  }
  if (path === '/api/grievances') {
    return { source: 'simulated', note: 'Grievance registry.', grievances: ctx.grievances };
  }
  if (path === '/api/fpo/aggregate' && method === 'POST') {
    const members = Array.from({ length: 12 }, (_, i) => ({
      id: `m${i + 3}`, name: `${['Dattatray', 'Ganesh', 'Kiran', 'Mahesh', 'Pravin', 'Sagar', 'Vilas', 'Ashok', 'Dilip', 'Kailas', 'Bhausaheb', 'Shravan'][i]} Jadhav`,
      location: `Village ${i + 1}, Dindori`, quantity_kg: 400 + ((i * 211) % 2200), quality: i % 3 ? 'A' : 'B', harvest_date: '2026-08-30',
    }));
    const total = members.reduce((a, m) => a + m.quantity_kg, 0);
    const opts = optionsFor(ctx, body.crop, total, {});
    const lot = { id: `KSL-${++ctx.seq.lot}`, crop: body.crop, quantity_kg: total, quality: body.quality, grade: `Grade ${body.quality}`, location: 'Dindori cluster, Nashik', market: body.market, expected_price_per_kg: opts[0].price_per_kg, harvest_date: '2026-08-30', fpo: 'Nashik Tomato Growers FPO', seller: 'Nashik Tomato Growers FPO', seller_type: 'fpo', status: 'available', created_at: new Date().toISOString() };
    ctx.lots.push(lot);
    const { matches } = matchBuyers(ctx, body.crop, total, body.quality);
    return {
      group: { crop: body.crop, quality: body.quality, farmer_count: members.length, total_quantity_kg: total, per_farm_avg_kg: Number((total / members.length).toFixed(1)), recommended_market: body.market, best_price_per_kg: opts[0].price_per_kg, best_net_per_kg: opts[0].net_per_kg, transport_saving_pct: 38 },
      lot_created: lot, buyers_interested: matches.slice(0, 4), member_list: members, source: 'simulated', note,
    };
  }
  if (path === '/api/fpo/dashboard') {
    return {
      fpo: { id: 'fpo1', name: 'Nashik Tomato Growers FPO', district: 'Nashik', state: 'Maharashtra', member_count: 212, reliability: 0.9, location: 'Nashik', founded: 2019 },
      members: Array.from({ length: 12 }, (_, i) => ({ id: `m${i + 3}`, name: `Farmer ${i + 1}`, location: `Village ${i + 1}, Dindori`, quantity_kg: 400 + ((i * 211) % 2200), quality: i % 3 ? 'A' : 'B', harvest_date: '2026-08-30' })),
      total_member_quantity_kg: 16850, grade_a_share_pct: 64, lots: ctx.lots.filter((l) => l.seller_type === 'fpo'), open_offers: ctx.offers.filter((o) => ['pending', 'countered'].includes(o.status)), source: 'simulated', note,
    };
  }
  if (path === '/api/admin/summary') {
    const statuses: Record<string, number> = {};
    ctx.lots.forEach((l) => { statuses[l.status] = (statuses[l.status] ?? 0) + 1; });
    return {
      counts: { farmers: 6, buyers: ctx.buyers.length, fpos: 2, crops: 9, markets: 8, lots: ctx.lots.length, offers: ctx.offers.length, orders: ctx.orders.length, payments: ctx.payments.length, grievances: ctx.grievances.length },
      traded_volume_kg: ctx.lots.reduce((a, l) => a + l.quantity_kg, 0), order_value_inr: ctx.orders.reduce((a, o) => a + o.amount, 0),
      settled_inr: ctx.payments.filter((p) => p.status === 'settled').reduce((a, p) => a + p.amount, 0),
      lot_status_distribution: statuses, grievance_open: ctx.grievances.filter((g) => g.status !== 'resolved').length,
      recent_orders: [...ctx.orders].slice(-5).reverse(), avg_margin_pct: 18.4, source: 'simulated', note,
    };
  }
  if (path === '/api/buyers') return { source: 'simulated', note: 'Demo buyer registry.', buyers: ctx.buyers };
  if (path === '/api/buyer-requirements') {
    const cropFilter = q('crop');
    const out: any[] = [];
    ctx.buyers.forEach((b) => b.requirements.forEach((r: any) => {
      if (!cropFilter || r.crop === cropFilter) out.push({ buyer_id: b.id, buyer: b.company, city: b.city, reliability: b.reliability, ...r });
    }));
    return { source: 'simulated', note: 'Active buyer demand bands.', requirements: out };
  }
  throw new Error(`[KrishiSetu fallback] Unhandled ${method} ${path}`);
}

export const fallback = {
  handle: (path: string, init?: RequestInit) => {
    const ctx = buildCtx();
    return Promise.resolve(handleRequest(ctx, path, init));
  },
};