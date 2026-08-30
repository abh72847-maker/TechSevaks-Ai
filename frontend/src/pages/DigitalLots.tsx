import { Boxes, Filter, MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Badge, { prettifyStatus, statusTone } from '../components/Badge';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import SectionHeader from '../components/SectionHeader';
import { useFetch } from '../hooks/useFetch';
import { daysUntil, fmtDate, inr2 } from '../utils/format';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'negotiation', label: 'In negotiation' },
  { id: 'sold', label: 'Sold' },
  { id: 'aggregated', label: 'Aggregated' },
];

export default function DigitalLots() {
  const [status, setStatus] = useState('available');
  const [crop, setCrop] = useState('');
  const lots = useFetch(() => api.listLots({ status: status === 'all' ? undefined : status, crop: crop || undefined }), [status, crop]);

  if (lots.loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <SectionHeader title="Digital lots marketplace" sub="Standardised digital represent: crop · quantity · grade · location · harvest date" />
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setStatus(f.id)} className={`chip ${status === f.id ? 'bg-ink-900 text-white' : ''}`}>{f.label}</button>
          ))}
          <select className="input ml-auto w-40" value={crop} onChange={(e) => setCrop(e.target.value)}>
            <option value="">All crops</option>
            {['tomato', 'onion', 'potato', 'chilli', 'soybean', 'cotton'].map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        {lots.data?.lots.length === 0 ? <EmptyState title="No lots match this filter" /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lots.data?.lots.map((lot) => (
              <Link key={lot.id} to={`/app/lots/${lot.id}`} className="group rounded-xl border border-slate-100 p-4 hover:border-leaf-300 hover:shadow-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-leaf-500 to-irrig-500 text-white">
                      {lot.seller_type === 'fpo' ? <Users className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="font-extrabold text-ink-900 group-hover:text-irrig-700">{lot.id}</p>
                      <p className="text-[11px] text-slate-500">{lot.seller_type === 'fpo' ? 'FPO bulk lot' : 'Farmer lot'} · {lot.fpo}</p>
                    </div>
                  </div>
                  <Badge tone={statusTone(lot.status)}>{prettifyStatus(lot.status)}</Badge>
                </div>
                <div className="mt-3">
                  <p className="text-lg font-extrabold capitalize text-ink-900">{lot.crop} <span className="text-slate-400">·</span> <span className="text-irrig-700">{lot.quantity_kg.toLocaleString('en-IN')} kg</span></p>
                  <p className="text-xs text-slate-500">Grade {lot.grade} · harvest {fmtDate(lot.harvest_date)}{daysUntil(lot.harvest_date) ? ` · ${daysUntil(lot.harvest_date)}d ago` : ''}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-500"><MapPin className="h-3.5 w-3.5" /> {lot.location} · {lot.market}</span>
                  <span className="font-extrabold text-leaf-700">₹{inr2(lot.expected_price_per_kg)}/kg</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}