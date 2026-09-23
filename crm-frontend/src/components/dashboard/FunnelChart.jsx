import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { TrendingDown } from 'lucide-react';
import Card from '../ui/Card.jsx';

const STAGE_ORDER = [
  'New',
  'Attempted Contact',
  'Contacted',
  'Interested',
  'Demo/Visit Scheduled',
  'Visited',
  'Negotiation',
  'Converted',
];

const BAR_COLORS = [
  '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#f59e0b', '#f97316', '#22c55e',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800">{d.stage}</p>
      <p className="text-gray-500">Leads at this stage: {d.count}</p>
      {d.dropoffPct > 0 && (
        <p className="text-red-500 mt-0.5">Drop-off from previous: {d.dropoffPct}%</p>
      )}
    </div>
  );
}

/**
 * Accepts either the legacy shape (a plain { stage: count } map) or the
 * richer shape from aggregation.service.js (an array of
 * { stage, count, reached, dropoffPct }). This keeps older callers working
 * while the new dashboards get drop-off insight for free.
 */
export default function FunnelChart({ funnel = {}, title = 'Lead Funnel' }) {
  const rows = Array.isArray(funnel)
    ? funnel
    : STAGE_ORDER.map((stage) => ({ stage, count: funnel[stage] || 0, dropoffPct: 0 }));

  const biggestDrop = rows.reduce(
    (max, r) => (r.dropoffPct > (max?.dropoffPct || 0) ? r : max),
    null
  );

  return (
    <Card title={title}>
      {biggestDrop && biggestDrop.dropoffPct > 0 && (
        <div className="flex items-center gap-2 mb-3 text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg">
          <TrendingDown size={14} />
          <span>
            Biggest drop-off is at <strong>{biggestDrop.stage}</strong> ({biggestDrop.dropoffPct}%
            of leads lost here)
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="stage" width={140} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {rows.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
