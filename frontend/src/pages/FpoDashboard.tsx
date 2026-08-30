import { Building2, CheckCircle2, Layers } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '../api/client';
import Badge, { prettifyStatus, statusTone } from '../components/Badge';
import Loader from '../components/Loader';
import PageLoader from '../components/PageLoader';
import SectionHeader from '../components/SectionHeader';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import { inr2 } from '../utils/format';

export default function FpoDashboard() {
  const { toast } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [aggLoading, setAggLoading] = useState(false);
  const [aggResult, setAggResult] = useState<any>(null);

  const dash = useFetch(() => api.fpoDashboard('fpo1'), []);

  const members = useMemo(() => dash.data?.members ?? [], [dash.data]);
  const gradeAFarmers = useMemo(() => members.filter((m) => m.quality === 'A'), [members]);
  const defaultSel = useMemo(() => new Set(gradeAFarmers.map((m) => m.id).slice(0, 10)), [gradeAFarmers]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const aggregate = async () => {
    const ids = selected.size ? Array.from(selected) : Array.from(defaultSel);
    setAggLoading(true);
    try {
      const res = await api.fpoAggregate({ farmer_ids: ids, crop: 'tomato', quality: 'A', market: 'Pimpalgaon APMC', fpo_id: 'fpo1' });
      setAggResult(res);
      toast(`Bulk lot ${res.lot_created.id} created (${res.group.total_quantity_kg.toLocaleString('en-IN')} kg)`, 'success');
      dash.reload();
    } finally {
      setAggLoading(false);
    }
  };

  if (dash.loading) return <PageLoader />;
  if (!dash.data) return <div className="card text-sm text-red-600">Failed to load FPO workspace.</div>;

  const effSel = selected.size ? selected : defaultSel;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-violet-50 to-leaf-50">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-irrig-500 text-xl font-extrabold text-white">NG</span>
          <div>
            <h1 className="text-xl font-extrabold text-ink-900">{dash.data.fpo.name}</h1>
            <p className="text-sm text-ink-600">Nashik · {dash.data.fpo.member_count} members · since {dash.data.fpo.founded} · reliability {(dash.data.fpo.reliability * 100).toFixed(0)}%</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone="violet" dot>FPO workspace</Badge>
          <Badge tone="green" dot>Notified under liberalised regime</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-xs font-semibold uppercase text-slate-500">Members</p><p className="mt-1 text-2xl font-extrabold text-ink-900">{dash.data.fpo.member_count}</p></div>
        <div className="card"><p className="text-xs font-semibold uppercase text-slate-500">Member produce (tomato)</p><p className="mt-1 text-2xl font-extrabold text-ink-900">{dash.data.total_member_quantity_kg.toLocaleString('en-IN')} kg</p></div>
        <div className="card"><p className="text-xs font-semibold uppercase text-slate-500">Grade A share</p><p className="mt-1 text-2xl font-extrabold text-ink-900">{dash.data.grade_a_share_pct}%</p></div>
      </div>

      <div className="card">
        <SectionHeader
          title="Identify compatible farmers & aggregate"
          sub="Select Grade A tomato members — the engine groups them into one bulk digital lot"
          action={<button className="btn-primary" onClick={aggregate} disabled={aggLoading}>{aggLoading ? <Loader label="Aggregating…" /> : <><Layers className="h-4 w-4" /> Aggregate {effSel.size} farmers</>}</button>}
        />
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <th className="px-3 py-2.5 font-semibold">✓</th>
                <th className="px-3 py-2.5 font-semibold">Member</th>
                <th className="px-3 py-2.5 font-semibold">Village</th>
                <th className="px-3 py-2.5 font-semibold">Qty (kg)</th>
                <th className="px-3 py-2.5 font-semibold">Grade</th>
                <th className="px-3 py-2.5 font-semibold">Harvest</th>
                <th className="px-3 py-2.5 font-semibold">Compatibility</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isA = m.quality === 'A';
                const checked = effSel.has(m.id);
                return (
                  <tr key={m.id} className={`border-b border-slate-50 hover:bg-leaf-50/40 ${isA && checked ? 'bg-leaf-50/60' : ''}`}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" className="h-4 w-4 accent-leaf-600" checked={checked} onChange={() => toggle(m.id)} disabled={!isA} />
                    </td>
                    <td className="px-3 py-2.5 font-bold text-ink-900">{m.name}</td>
                    <td className="px-3 py-2.5 text-slate-600">{m.location}</td>
                    <td className="px-3 py-2.5 font-semibold">{m.quantity_kg.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5"><Badge tone={isA ? 'green' : 'slate'}>Grade {m.quality}</Badge></td>
                    <td className="px-3 py-2.5 text-slate-600">{m.harvest_date}</td>
                    <td className="px-3 py-2.5">
                      {isA ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-leaf-600"><CheckCircle2 className="h-3.5 w-3.5" /> Grade A · ready</span>
                      ) : (
                        <span className="text-xs text-slate-400">excluded (Grade B)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {aggLoading && <div className="card"><Loader label="Bundling farmers into a bulk digital lot…" /></div>}

      {aggResult && !aggLoading && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card">
            <SectionHeader title={`Bulk lot created · ${aggResult.lot_created.id}`} sub="One unified digital lot from the aggregation" />
            <div className="rounded-xl bg-gradient-to-br from-ink-900 to-ink-800 p-4 text-white">
              <div className="flex items-center justify-between">
                <p className="font-extrabold capitalize">{aggResult.lot_created.crop} · {aggResult.group.farmer_count} farmers</p>
                <Badge tone="green">{prettifyStatus(aggResult.lot_created.status)}</Badge>
              </div>
              <p className="mt-2 text-3xl font-extrabold">{aggResult.group.total_quantity_kg.toLocaleString('en-IN')} kg</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white/5 p-2"><p className="text-[10px] uppercase text-white/60">Avg per farm</p><p className="text-sm font-bold">{Math.round(aggResult.group.per_farm_avg_kg)} kg</p></div>
                <div className="rounded-lg bg-white/5 p-2"><p className="text-[10px] uppercase text-white/60">Market</p><p className="text-sm font-bold">{aggResult.group.recommended_market.split(' ')[0]}</p></div>
                <div className="rounded-lg bg-white/5 p-2"><p className="text-[10px] uppercase text-white/60">Best net</p><p className="text-sm font-bold">₹{inr2(aggResult.group.best_net_per_kg)}/kg</p></div>
              </div>
              <p className="mt-3 text-xs text-white/60">Transport & handling saving vs individual sale: {aggResult.group.transport_saving_pct}% (simulated)</p>
            </div>
          </div>
          <div className="card">
            <SectionHeader title="Buyers interested in this lot" sub="Pre-matched by the AI buyer engine" />
            <div className="space-y-2">
              {aggResult.buyers_interested.map((b: any) => (
                <div key={b.buyer.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-leaf-500 to-irrig-500 text-xs font-extrabold text-white">{b.buyer.avatar_initial}</span>
                    <div>
                      <p className="text-sm font-bold text-ink-900">{b.buyer.company}</p>
                      <p className="text-xs text-slate-500">₹{inr2(b.requirement.price_per_kg)}/kg · {b.requirement.advance_pct}% advance · {b.requirement.payment_terms_days}d</p>
                    </div>
                  </div>
                  <p className="font-extrabold text-leaf-700">{b.match_score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <SectionHeader title="FPO lots & open offers" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dash.data.lots.map((lot) => (
            <div key={lot.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink-900">{lot.id}</p>
                <Badge tone={statusTone(lot.status)}>{prettifyStatus(lot.status)}</Badge>
              </div>
              <p className="mt-1 text-sm font-semibold capitalize text-ink-700">{lot.crop} · {lot.quantity_kg.toLocaleString('en-IN')} kg · {lot.grade}</p>
              <p className="mt-0.5 text-xs text-slate-500">{lot.market} · expected ₹{inr2(lot.expected_price_per_kg)}/kg</p>
            </div>
          ))}
        </div>
        {dash.data.open_offers.length > 0 && (
          <div className="mt-4 space-y-2">
            {dash.data.open_offers.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-sm">
                <p className="font-semibold text-ink-900">{o.buyer} offered ₹{inr2(o.price_per_kg)}/kg on lot {o.lot_id}</p>
                <Badge tone={statusTone(o.status)}>{prettifyStatus(o.status)}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Building2 className="h-4 w-4" /> FPO aggregation converts many small farmers into one bankable digital lot — a core strength for the SIH demo.
      </div>
    </div>
  );
}