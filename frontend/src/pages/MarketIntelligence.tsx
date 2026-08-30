import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { Coins, MapPin, TrendingDown, TrendingUp, Truck, Utensils } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { ForecastBandChart, NetCompareBar, PriceTrendChart } from '../components/charts';
import PageLoader from '../components/PageLoader';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import { useFetch } from '../hooks/useFetch';
import { inr2 } from '../utils/format';
import 'leaflet/dist/leaflet.css';

export default function MarketIntelligence() {
  const [crop, setCrop] = useState('tomato');
  const [market, setMarket] = useState('Pimpalgaon APMC');

  const prices = useFetch(() => api.marketPrices(crop), [crop]);
  const trends = useFetch(() => api.marketTrends(crop), [crop]);
  const forecast = useFetch(() => api.forecast({ crop, market, days: 7 }), [crop, market]);

  const rows = useMemo(() => prices.data?.rows ?? [], [prices.data]);
  const selected = useMemo(() => rows.find((r) => r.market === market) ?? rows[0] ?? null, [rows, market]);
  const trendLines = useMemo(() => {
    if (!trends.data) return [];
    const keys = trends.data.markets.slice(0, 5);
    if (!keys.length || !trends.data.series[keys[0]]) return [];
    const n = trends.data.series[keys[0]].length;
    const out: { date: string; [key: string]: unknown }[] = [];
    for (let i = 0; i < n; i++) {
      const point: { date: string; [key: string]: unknown } = { date: trends.data!.series[keys[0]][i].date };
      keys.forEach((m) => {
        const s = trends.data!.series[m][i];
        point[m] = s ? Number(s.price.toFixed(2)) : NaN;
      });
      out.push(point);
    }
    return out;
  }, [trends.data]);
  const chartMarkets = useMemo(() => (trends.data?.markets ?? []).slice(0, 5), [trends.data]);
  const mapMarkets = useMemo(() => prices.data?.markets ?? [], [prices.data]);

  if (prices.loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Crop</label>
          <select className="input w-40" value={crop} onChange={(e) => setCrop(e.target.value)}>
            {(prices.data?.crops ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Market</label>
          <select className="input w-56" value={selected?.market ?? market} onChange={(e) => setMarket(e.target.value)}>
            {rows.map((r) => <option key={r.market} value={r.market}>{r.market}</option>)}
          </select>
        </div>
        <div className="ml-auto text-xs text-slate-400">
          Source: simulated mandi feed · updated {prices.data?.as_of}
        </div>
      </div>

      {selected && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Coins} label="Modal price" value={`${inr2(selected.price_per_kg)}/kg`} sub={`${inr2(selected.price_per_q)}/quintal`} delta={selected.change_pct} accent="leaf" />
          <StatCard icon={TrendingUp} label="30-day trend" value={`${selected.change_pct >= 0 ? '+' : ''}${selected.change_pct.toFixed(1)}%`} sub="vs previous day" accent="irrig" />
          <StatCard icon={Truck} label="Arrivals" value={`${selected.arrivals_qty.toLocaleString('en-IN')} qtl`} sub="today, in this market" accent="amber" />
          <StatCard icon={Utensils} label="Buyer demand" value={`${selected.demand_index.toFixed(0)}/100`} sub="demand index (simulated)" accent="violet" />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="card">
          <SectionHeader title={`Price trend · ${crop}`} sub="30-day price series, top 5 markets (₹/kg)" />
          {trendLines.length > 0 && chartMarkets.length > 0 ? (
            <PriceTrendChart data={trendLines} markets={chartMarkets} />
          ) : (
            <PageLoader />
          )}
        </div>
        <div className="card">
          <SectionHeader title="Net realisation comparison" sub="Gross price vs net after costs (₹/kg) — why the closest market wins" />
          {rows.length > 0 && (
            <NetCompareBar data={rows.slice(0, 6).map((r) => ({
              market: r.market,
              price_per_kg: r.price_per_kg,
              net_per_kg: Math.max(0, r.price_per_kg - (2.0 + 1.05 * r.distance_km) / 100),
            }))} />
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <SectionHeader title={`Price forecast · ${selected?.market ?? market}`} sub={`${forecast.data?.days ?? 7}-day horizon · ${forecast.data?.method ?? 'linear-trend (demo)'}`} />
          {forecast.loading ? <PageLoader /> : forecast.data && (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="chip bg-irrig-100 text-irrig-700">Expected Δ {forecast.data.expected_change_pct >= 0 ? '+' : ''}{forecast.data.expected_change_pct}%</span>
                <span className="chip bg-amber-100 text-amber-700">Confidence {(forecast.data.confidence * 100).toFixed(0)}%</span>
                <span className="text-xs text-slate-500">Volatility index {(forecast.data as any).volatility_index?.toFixed(3)}</span>
              </div>
              <ForecastBandChart data={forecast.data.forecast} />
            </>
          )}
        </div>
        <div className="card">
          <SectionHeader title="Market network map" sub="Simulated regional map — popup shows today's price per market" />
          <div className="h-[340px] overflow-hidden rounded-xl border border-slate-100">
            <MapContainer center={[19.4, 74.4]} zoom={7} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mapMarkets.map((m) => {
                const row = rows.find((r) => r.market === m.name);
                return (
                  <CircleMarker
                    key={m.id}
                    center={[m.lat, m.lng]}
                    radius={7}
                    pathOptions={{ color: '#fff', weight: 2, fillColor: row ? (row.demand_index > 75 ? '#36a960' : row.demand_index > 60 ? '#2b8abf' : '#f59e0b') : '#94a3b8', fillOpacity: 0.9 }}
                  >
                    <Popup>
                      <p className="mb-0.5 text-sm font-bold">{m.name}</p>
                      <p className="text-xs text-slate-600">{row ? `₹${row.price_per_kg.toFixed(2)}/kg · demand ${row.demand_index}` : 'no data'}</p>
                      <p className="text-[10px] text-slate-400">{m.kind} · {m.city}, {m.state}</p>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {mapMarkets.length} tracked markets</span>
            <span>● high demand (&gt;75)</span>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <div className="border-b border-slate-100 p-5 pb-3">
          <SectionHeader title={`Market comparison · ${crop}`} sub="Today's spot prices with change, arrivals and demand" />
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Market</th>
              <th className="px-5 py-3 font-semibold">Price ₹/kg</th>
              <th className="px-5 py-3 font-semibold">Δ day</th>
              <th className="px-5 py-3 font-semibold">Arrivals (qtl)</th>
              <th className="px-5 py-3 font-semibold">Demand</th>
              <th className="px-5 py-3 font-semibold">Dist.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.market} className={`border-b border-slate-50 hover:bg-leaf-50/40 ${r.market === selected?.market ? 'bg-leaf-50/60' : ''}`}>
                <td className="px-5 py-3 font-bold capitalize text-ink-900">{r.market}</td>
                <td className="px-5 py-3 font-semibold">{inr2(r.price_per_kg)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${r.change_pct >= 0 ? 'text-leaf-600' : 'text-red-600'}`}>
                    {r.change_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {r.change_pct >= 0 ? '+' : ''}{r.change_pct}%
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600">{r.arrivals_qty.toLocaleString('en-IN')}</td>
                <td className="px-5 py-3">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-leaf-400 to-leaf-600" style={{ width: `${r.demand_index}%` }} />
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600">{r.distance_km} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}