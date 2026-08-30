import { CheckCircle2, FileBarChart2, HandCoins, PackageCheck, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Badge, { prettifyStatus, statusTone } from '../components/Badge';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import { useFetch } from '../hooks/useFetch';
import { inr } from '../utils/format';

export default function AdminDashboard() {
  const s = useFetch(() => api.adminSummary(), []);
  const grievances = useFetch(() => api.listGrievances(), []);

  if (s.loading) return <PageLoader />;
  if (!s.data) return <div className="card text-sm text-red-600">Failed to load admin summary.</div>;
  const d = s.data;

  const openGrievances = (grievances.data?.grievances ?? []).filter((g) => g.status !== 'resolved');
  const statusOrder = ['available', 'negotiation', 'sold', 'aggregated'];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-ink-900 to-ink-800 text-white">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-leaf-400 to-irrig-500 text-xl font-extrabold text-ink-900">KS</span>
          <div>
            <h1 className="text-xl font-extrabold">KrishiSetu operations console</h1>
            <p className="text-sm text-white/60">Sandbox of the SIH PS — all numbers simulated for the demo.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="green" dot>API live</Badge>
          <Link to="/app/flow" className="btn-primary px-3 py-1.5 text-xs bg-leaf-500 text-ink-900">Walk transaction</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileBarChart2} label="Digital lots" value={d.counts.lots ?? 0} sub={`${d.counts.lots_available ?? 0} still available`} accent="leaf" />
        <StatCard icon={PackageCheck} label="Orders completed" value={d.recent_orders.length} sub={`value ${inr(d.order_value_inr)}`} accent="irrig" />
        <StatCard icon={HandCoins} label="Settled value" value={inr(d.settled_inr)} sub={`${d.counts.settled_payments ?? 0} payments`} accent="amber" />
        <StatCard icon={Users2} label="Traded volume" value={`${(d.traded_volume_kg / 1000).toFixed(1)}t`} sub={`avg margin ${d.avg_margin_pct}%`} accent="violet" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card">
          <SectionHeader title="Lot status distribution" sub="Where lots currently sit" />
          {statusOrder.map((st) => {
            const v = d.lot_status_distribution[st] ?? 0;
            const total = Object.values(d.lot_status_distribution).reduce((a, b) => a + b, 0) || 1;
            return (
              <div key={st} className="flex items-center gap-3 py-1.5">
                <p className="w-28 text-sm capitalize text-slate-600">{st}</p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-leaf-500 to-irrig-500" style={{ width: `${(v / total) * 100}%` }} />
                </div>
                <p className="w-8 text-right text-sm font-bold text-ink-900">{v}</p>
              </div>
            );
          })}
        </div>

        <div className="card lg:col-span-2">
          <SectionHeader title="Recent orders" sub={`${d.counts.orders ?? 0} total orders`} />
          {d.recent_orders.length === 0 ? <EmptyState title="No orders yet" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <th className="px-2 py-2 font-semibold">Order</th>
                    <th className="px-2 py-2 font-semibold">Lot</th>
                    <th className="px-2 py-2 font-semibold">Buyer</th>
                    <th className="px-2 py-2 font-semibold">Amount</th>
                    <th className="px-2 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent_orders.map((o) => (
                    <tr key={o.id as string} className="border-b border-slate-50">
                      <td className="px-2 py-2.5 font-bold text-ink-900">{(o as any).id}</td>
                      <td className="px-2 py-2.5 text-slate-600">{(o as any).lot_id}</td>
                      <td className="px-2 py-2.5 text-slate-600">{(o as any).buyer}</td>
                      <td className="px-2 py-2.5 font-semibold">{inr((o as any).amount)}</td>
                      <td className="px-2 py-2.5"><Badge tone={statusTone((o as any).status)}>{prettifyStatus((o as any).status)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <SectionHeader title="Open grievances" sub={`${d.grievance_open} open · auto-conciliation eligible`} action={<Link to="/app/flow" className="text-sm font-bold text-irrig-700">Resolve →</Link>} />
          {openGrievances.length === 0 ? <EmptyState title="No open disputes" sub="All grievances resolved." /> : (
            <div className="space-y-2">
              {openGrievances.map((g) => {
                const gg = g as any;
                return (
                  <div key={gg.id as string} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-ink-900">{gg.id} · {gg.category.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500">{gg.detailed_description ?? gg.description}</p>
                    </div>
                    <Badge tone="amber">{prettifyStatus(gg.status ?? 'open')}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card">
          <SectionHeader title="Trust signals" sub="What makes KrishiSetu defensible at a pitch" />
          <ul className="space-y-2.5 text-sm">
            {[
              ['Net-realisation first', 'Gross vs net comparison is the farmer-facing USP, not just "price".'],
              ['Idempotent digital artifacts', 'Every offer → order → payment is a reference-able record.'],
              ['FPO aggregation engine', 'Small farmers become one bankable lot; buyers gain scale.'],
              ['1-click settlement & disputes', '50% advance + conciliation path reduce payment delays.'],
            ].map(([t, desc]) => (
              <li key={t} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" />
                <div><p className="font-extrabold text-ink-900">{t}</p><p className="text-slate-600">{desc}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}