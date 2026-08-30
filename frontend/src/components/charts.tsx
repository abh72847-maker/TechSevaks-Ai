import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8e0',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(16,42,32,0.12)',
};

const axisTick = { fontSize: 11, fill: '#5f716a' };

export function PriceTrendChart({ data, markets, height = 280 }: { data: { date: string; [k: string]: any }[]; markets: string[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="#eef3ef" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={axisTick} tickFormatter={(d: string) => d.slice(8, 10)} />
        <YAxis tick={axisTick} domain={['auto', 'auto']} tickFormatter={(v: number) => `₹${v}`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${Number(v).toFixed(2)}/kg`, '']} labelStyle={{ fontWeight: 700, color: '#122a21' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {markets.map((m, i) => {
          const colors = ['#36a960', '#2b8abf', '#f59e0b', '#8b5cf6', '#e11d48'];
          return <Line key={m} type="monotone" dataKey={m} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} name={m.split(' ')[0]} />;
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ForecastBandChart({ data, height = 280 }: { data: { date: string; price: number; low: number; high: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="#eef3ef" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={axisTick} tickFormatter={(d: string) => d.slice(8, 10)} />
        <YAxis tick={axisTick} domain={['auto', 'auto']} tickFormatter={(v: number) => `₹${v}`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v).toFixed(2)}/kg`, '']} labelStyle={{ fontWeight: 700, color: '#122a21' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="high" stroke="transparent" fill="#b7dcef" fillOpacity={0.35} name="Confidence band (high)" />
        <Area type="monotone" dataKey="low" stroke="transparent" fill="#b7dcef" fillOpacity={0} name="band low" />
        <ReferenceLine y={data[0]?.price} stroke="#8ba396" strokeDasharray="4 4" label={{ value: 'Today', fontSize: 10, fill: '#5f716a', position: 'insideTopLeft' }} />
        <Line type="monotone" dataKey="price" stroke="#36a960" strokeWidth={2.5} dot={false} name="Forecast price" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function NetCompareBar({ data, height = 240 }: { data: { market: string; net_per_kg: number; price_per_kg: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 8 }}>
        <CartesianGrid stroke="#eef3ef" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={axisTick} tickFormatter={(v: number) => `₹${v}`} />
        <YAxis type="category" dataKey="market" tick={axisTick} width={130} tickFormatter={(v: string) => v.split(' ')[0]} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v).toFixed(2)}/kg`, 'Net']} />
        <Bar dataKey="net_per_kg" name="Net realisation" fill="#36a960" radius={[0, 6, 6, 0]} barSize={16} />
        <Bar dataKey="price_per_kg" name="Gross price" fill="#93dcab" radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}