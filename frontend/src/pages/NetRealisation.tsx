import { ArrowRight, Coins, Leaf, Minus, Scale, Waves } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { CROPS, MARKETS } from '../constants';
import { NetCompareBar } from '../components/charts';
import Loader from '../components/Loader';
import SectionHeader from '../components/SectionHeader';
import { inr, inr2 } from '../utils/format';

export default function NetRealisation() {
  const [form, setForm] = useState({
    crop: 'tomato', quantity_kg: 1000, quality: 'A', market: 'Pimpalgaon APMC',
    transport_cost: 0, storage_cost_per_kg: 0, handling_cost_per_kg: 0.4, expected_loss_pct: 4,
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const compute = async () => {
    setLoading(true);
    try {
      const res = await api.netRealisation(form as any);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    compute();
  }, []);

  const costRows = result
    ? [
        { label: 'Selling revenue', value: result.revenue, tone: 'text-leaf-700 bg-leaf-50' },
        { label: '− Transport', value: result.costs.transport, tone: 'text-red-600 bg-red-50' },
        { label: '− Storage', value: result.costs.storage, tone: 'text-red-600 bg-red-50' },
        { label: '− Handling', value: result.costs.handling, tone: 'text-red-600 bg-red-50' },
        { label: '− Expected loss', value: result.costs.expected_loss, tone: 'text-red-600 bg-red-50' },
        { label: '= Expected Net Realisation', value: result.net_realisation, tone: 'text-ink-900 bg-ink-900 text-white' },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="card">
        <SectionHeader title="Net Realisation Engine" sub="Gross price is an illusion. This is what actually reaches your account." />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <label className="label">Crop</label>
            <select className="input" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}>
              {CROPS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity (kg)</label>
            <input type="number" className="input" value={form.quantity_kg} onChange={(e) => setForm({ ...form, quantity_kg: +e.target.value })} />
          </div>
          <div>
            <label className="label">Quality grade</label>
            <select className="input" value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}>
              {['A', 'B', 'C'].map((q) => <option key={q}>Grade {q}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Market</label>
            <select className="input" value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })}>
              {MARKETS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Storage (₹/kg)</label>
            <input type="number" step="0.1" className="input" value={form.storage_cost_per_kg} onChange={(e) => setForm({ ...form, storage_cost_per_kg: +e.target.value })} />
          </div>
          <div>
            <label className="label">Handling (₹/kg)</label>
            <input type="number" step="0.1" className="input" value={form.handling_cost_per_kg} onChange={(e) => setForm({ ...form, handling_cost_per_kg: +e.target.value })} />
          </div>
          <div>
            <label className="label">Expected loss %</label>
            <input type="number" step="0.5" className="input" value={form.expected_loss_pct} onChange={(e) => setForm({ ...form, expected_loss_pct: +e.target.value })} />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={compute} disabled={loading}>
              {loading ? 'Computing…' : 'Compute'}
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="card"><Loader label="Computing net realisation across markets…" /></div>}

      {result && !loading && (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {/* waterfall */}
            <div className="card">
              <SectionHeader title={`Cost waterfall · ${result.quantity_kg.toLocaleString('en-IN')} kg ${result.crop}`} sub={`Best market: ${result.recommended_market}`} />
              <div className="space-y-2">
                {costRows.map((r) => (
                  <div key={r.label} className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${r.tone}`}>
                    <span className="flex items-center gap-2">
                      {r.label.startsWith('=') ? <Coins className="h-4 w-4" /> : r.label.startsWith('−') ? <Minus className="h-4 w-4" /> : <span />}
                      {r.label}
                    </span>
                    <span className="text-base font-extrabold">{inr2(r.value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="chip bg-leaf-100 text-leaf-700">{inr2(result.net_per_kg)}/kg</span>
                <span className="chip bg-irrig-100 text-irrig-700">margin {result.margin_pct}%</span>
                <span className="chip bg-amber-100 text-amber-700">margin band: 0–50% of revenue</span>
              </div>
            </div>

            {/* net comparison */}
            <div className="card">
              <SectionHeader title="Compare markets" sub="Net realisation per kg after all costs" />
              <NetCompareBar data={result.options} />
            </div>
          </div>

          {/* options table */}
          <div className="card overflow-x-auto p-0">
            <div className="p-5 pb-3">
              <SectionHeader title="Market options ranked by net realisation" sub="Green = highest net for you" action={<ArrowRight className="h-4 w-4 text-slate-300" />} />
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="px-5 py-3 font-semibold">Rank</th>
                  <th className="px-5 py-3 font-semibold">Market</th>
                  <th className="px-5 py-3 font-semibold">Price ₹/kg</th>
                  <th className="px-5 py-3 font-semibold">Transport ₹</th>
                  <th className="px-5 py-3 font-semibold">Demand</th>
                  <th className="px-5 py-3 font-semibold">Net ₹/kg</th>
                  <th className="px-5 py-3 font-semibold">Net total</th>
                </tr>
              </thead>
              <tbody>
                {result.options.map((o: any) => (
                  <tr key={o.market} className={`border-b border-slate-50 ${o.rank === 1 ? 'bg-leaf-50/70' : ''}`}>
                    <td className="px-5 py-3">
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold ${o.rank === 1 ? 'bg-leaf-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{o.rank}</span>
                    </td>
                    <td className="px-5 py-3 font-bold capitalize text-ink-900">
                      {o.market}
                      {o.rank === 1 && <Leaf className="ml-1.5 inline h-3.5 w-3.5 text-leaf-600" />}
                    </td>
                    <td className="px-5 py-3 font-semibold">{inr2(o.price_per_kg)}</td>
                    <td className="px-5 py-3 text-slate-600">{inr(o.transport_total)}</td>
                    <td className="px-5 py-3 text-slate-600">{o.demand_index}/100</td>
                    <td className="px-5 py-3 font-extrabold text-leaf-700">{inr2(o.net_per_kg)}</td>
                    <td className="px-5 py-3 font-bold text-ink-900">{inr(o.net_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-ink-900 to-ink-800 text-white">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-leaf-500/20 text-leaf-300"><Scale className="h-6 w-6" /></span>
              <div>
                <p className="text-lg font-extrabold">Best option: {result.recommended_market}</p>
                <p className="text-sm text-white/70">
                  Highest Net Realisation {inr2(result.best_option.net_per_kg)}/kg — {inr(result.best_option.net_total)} for {result.quantity_kg.toLocaleString('en-IN')} kg.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn bg-white/10 text-white hover:bg-white/20" onClick={compute}><Waves className="h-4 w-4" /> Recompute</button>
              <a href="/app/ai" className="btn bg-leaf-500 text-white hover:bg-leaf-600">Get WHEN/WHERE/WHO <ArrowRight className="h-4 w-4" /></a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}