import { ArrowRight, Brain, CheckCircle2, Lightbulb, PackagePlus, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ProgressRing from '../components/ProgressRing';
import SectionHeader from '../components/SectionHeader';
import { CROPS, MARKETS } from '../constants';
import { useFetch } from '../hooks/useFetch';
import type { RecommendationResponse } from '../types';
import { inr, inr2 } from '../utils/format';

export default function AIRecommendation() {
  const [scenario, setScenario] = useState({
    crop: 'tomato', quantity_kg: 1000, quality: 'A', location: 'Nashik',
    market: 'Pimpalgaon APMC', sell_within_days: 3, harvest_date: '2026-08-30',
  });

  const reco = useFetch<RecommendationResponse>(() => api.recommendation(scenario as any), [
    scenario.crop, scenario.quantity_kg, scenario.quality, scenario.location, scenario.market, scenario.sell_within_days,
  ]);
  const matches = useFetch<any>(() => (scenario.quantity_kg > 0 ? api.buyerMatch(scenario as any) : Promise.resolve({ matches: [] })), [
    scenario.crop, scenario.quantity_kg, scenario.quality, scenario.location,
  ]);

  const [mine, setMine] = useState(true);
  const showMatches = mine ? (matches.data as any)?.matches ?? [] : (matches.data as any)?.matches ?? [].slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="card">
        <SectionHeader title="AI Decision Engine" sub="WHEN to sell · WHERE to sell · WHO to sell to — driven by expected Net Realisation" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div><label className="label">Crop</label>
            <select className="input" value={scenario.crop} onChange={(e) => setScenario({ ...scenario, crop: e.target.value })}>
              {CROPS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="label">Quantity (kg)</label><input type="number" className="input" value={scenario.quantity_kg} onChange={(e) => setScenario({ ...scenario, quantity_kg: +e.target.value })} /></div>
          <div><label className="label">Grade</label>
            <select className="input" value={scenario.quality} onChange={(e) => setScenario({ ...scenario, quality: e.target.value })}>
              {['A', 'B', 'C'].map((q) => <option key={q}>Grade {q}</option>)}
            </select></div>
          <div><label className="label">Sell within (days)</label><input type="number" className="input" value={scenario.sell_within_days} onChange={(e) => setScenario({ ...scenario, sell_within_days: +e.target.value })} /></div>
          <div><label className="label">Location</label><input className="input" value={scenario.location} onChange={(e) => setScenario({ ...scenario, location: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Market</label>
            <select className="input" value={scenario.market} onChange={(e) => setScenario({ ...scenario, market: e.target.value })}>
              {MARKETS.map((m) => <option key={m}>{m}</option>)}
            </select></div>
          <div><label className="label">Harvest date</label><input type="date" className="input" value={scenario.harvest_date} onChange={(e) => setScenario({ ...scenario, harvest_date: e.target.value })} /></div>
        </div>
      </div>

      <div>
        <SectionHeader title={`AI Decision · ${scenario.crop} ${scenario.quantity_kg} kg · Grade ${scenario.quality} · ${scenario.location}`} sub="Recomputed live as you type (demo engine)" action={<span className="chip bg-amber-100 text-amber-700">Confidence {(reco.data?.confidence ?? 0) * 100}%</span>} />
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-irrig-200 bg-irrig-50 p-3 text-xs text-irrig-800">
          <Lightbulb className="h-4 w-4 shrink-0" />
          Confidence is a heuristic from data coverage, volatility and factor agreement. This is a prototype — validate before your real decisions.
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { tag: 'WHEN', key: 'when', tone: 'leaf' as const, icon: <Brain className="h-5 w-5" /> },
            { tag: 'WHERE', key: 'where', tone: 'irrig' as const, icon: <MapPinEmoji /> },
            { tag: 'WHO', key: 'who', tone: 'violet' as const, icon: <UserCheck className="h-5 w-5" /> },
          ].map((c) => {
            const d = reco.data ? (reco.data as any)[c.key] : null;
            return (
              <div key={c.tag} className="card relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-leaf-500 to-irrig-500" />
                <div className="flex items-start gap-4">
                  <div className="text-center">
                    <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-leaf-500 to-irrig-500 text-white">{c.icon}</div>
                    <p className="mt-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">{c.tag}</p>
                    <div className="mt-1 flex justify-center"><ProgressRing value={(d?.score ?? 0) * 100} tone={c.tone} /></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-extrabold text-ink-900">{d?.title ?? d?.label ?? d?.buyer ?? '…'}</p>
                    {d && c.key === 'where' && (
                      <p className="mt-0.5 text-sm">
                        <span className="font-extrabold text-leaf-700">{inr2(d.net_per_kg)}/kg net</span>
                        <span className="text-slate-500"> · gross {inr2(d.price_per_kg)}/kg</span>
                      </p>
                    )}
                    {d && c.key === 'who' && (
                      <p className="mt-0.5 text-sm">
                        <span className="font-extrabold text-leaf-700">₹{inr2(d.price_per_kg)}/kg</span>
                        <span className="text-slate-500"> · {d.advance_pct}% advance</span>
                      </p>
                    )}
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{d?.reason}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <SectionHeader title="Expected outcome" sub="Full order economics for this decision" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: 'Net per kg', v: reco.data ? inr2(reco.data.net_per_kg) : '…' },
              { l: 'Total net', v: reco.data ? inr(reco.data.net_total) : '…' },
              { l: 'Best market', v: reco.data?.where.market ?? '…' },
              { l: 'Best buyer', v: reco.data?.who.buyer ?? '…' },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-[11px] font-semibold uppercase text-slate-500">{x.l}</p>
                <p className="mt-0.5 text-base font-extrabold text-ink-900">{x.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="label">Factors used</p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {(reco.data?.factors ?? []).map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-slate-700"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf-600" />{f}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card">
          <SectionHeader title="AI-matched buyers" sub="Score = price 25% · quantity 15% · quality 15% · payment 15% · distance 15% · reliability 15%" action={<button className="btn-ghost p-1.5 text-xs" onClick={() => setMine((v) => !v)}>{mine ? 'Show all' : 'Show top'}</button>} />
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {showMatches.map((m: any) => (
              <div key={m.buyer.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-leaf-500 to-irrig-500 text-xs font-extrabold text-white">{m.buyer.avatar_initial}</span>
                  <div>
                    <p className="text-sm font-bold text-ink-900">{m.buyer.company}</p>
                    <p className="text-xs text-slate-500">{m.buyer.city} · ₹{inr2(m.requirement.price_per_kg)}/kg · {m.distance_km}km · {m.requirement.payment_terms_days}d</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-leaf-700">{m.match_score}</p>
                  <progress value={m.match_score} max={100} className="h-1 w-16 accent-leaf-600" />
                </div>
              </div>
            ))}
            {showMatches.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No matching buyers for this scenario.</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/app/realisation" className="btn-secondary"><Brain className="h-4 w-4" /> Open Net Realisation</Link>
        <Link to="/app/farmer" className="btn-primary"><PackagePlus className="h-4 w-4" /> Create lot with this scenario <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}

function MapPinEmoji() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}