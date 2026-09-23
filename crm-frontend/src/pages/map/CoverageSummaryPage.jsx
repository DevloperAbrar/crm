import React, { useEffect, useState, useMemo } from 'react';
import {
  MapPin, Phone, Home, TrendingUp, Users, Clock, ArrowUpDown, Loader2,
} from 'lucide-react';
import { mapApi } from '../../lib/api/endpoints.js';
import Card from '../../components/ui/Card.jsx';

const OUTCOME_COLORS = {
  Interested: 'bg-green-50 text-green-700',
  'Not Interested': 'bg-red-50 text-red-600',
  'Call Back Later': 'bg-amber-50 text-amber-700',
  'No Response': 'bg-gray-100 text-gray-500',
  'Already Using Competitor': 'bg-purple-50 text-purple-700',
  'Demo Booked': 'bg-blue-50 text-blue-700',
  Converted: 'bg-emerald-50 text-emerald-700',
};

function timeAgo(dateStr) {
  if (!dateStr) return { text: 'No activity yet', stale: true };
  const diffDays = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diffDays === 0) return { text: 'Today', stale: false };
  if (diffDays === 1) return { text: 'Yesterday', stale: false };
  if (diffDays <= 7) return { text: `${diffDays}d ago`, stale: false };
  if (diffDays <= 30) return { text: `${diffDays}d ago`, stale: true };
  return { text: `${Math.floor(diffDays / 30)}mo ago`, stale: true };
}

const CITY_COLUMNS = [
  { key: 'totalLeads', label: 'Total Leads' },
  { key: 'totalCalled', label: 'Called' },
  { key: 'totalVisited', label: 'Visited' },
  { key: 'conversionRate', label: 'Conv. Rate' },
  { key: 'activeAgents', label: 'Agents' },
];

export default function CoverageSummaryPage() {
  const [view, setView] = useState('city'); // 'city' | 'state'
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [sortKey, setSortKey] = useState('totalLeads');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    mapApi
      .coverageSummary()
      .then((res) => {
        setCities(res.data.data.cities);
        setStates(res.data.data.states);
      })
      .catch((e) => setErr(e?.response?.data?.message || 'Failed to load coverage summary'))
      .finally(() => setLoading(false));
  }, []);

  const rows = view === 'city' ? cities : states;

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)),
    [rows, sortKey]
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          totalLeads: acc.totalLeads + r.totalLeads,
          totalCalled: acc.totalCalled + r.totalCalled,
          totalVisited: acc.totalVisited + r.totalVisited,
          converted: acc.converted + r.converted,
        }),
        { totalLeads: 0, totalCalled: 0, totalVisited: 0, converted: 0 }
      ),
    [rows]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Loading coverage summary...
      </div>
    );
  }

  if (err) return <p className="text-sm text-red-500 p-6">{err}</p>;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MapPin className="text-accent-500" size={22} />
          City/State Coverage Summary
        </h1>
        <p className="text-sm text-gray-500">
          Auto-calculated coverage, response breakdown and conversion rate for every market you're working
        </p>
      </div>

      {/* Top-line totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-800">{totals.totalLeads}</p>
          <p className="text-xs text-gray-500 mt-1">Total Leads</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-800">{totals.totalCalled}</p>
          <p className="text-xs text-gray-500 mt-1">Total Called</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-800">{totals.totalVisited}</p>
          <p className="text-xs text-gray-500 mt-1">Total Visited</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {totals.totalLeads ? Math.round((totals.converted / totals.totalLeads) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Overall Conversion</p>
        </Card>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('city')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === 'city' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
          }`}
        >
          By City
        </button>
        <button
          onClick={() => setView('state')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === 'state' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
          }`}
        >
          By State
        </button>
      </div>

      <Card>
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            No leads in scope yet — coverage data will appear once leads are added.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-3">{view === 'city' ? 'City' : 'State'}</th>
                  {CITY_COLUMNS.map((col) => (
                    <th key={col.key} className="py-2 pr-3">
                      <button
                        onClick={() => setSortKey(col.key)}
                        className={`flex items-center gap-1 hover:text-gray-700 ${
                          sortKey === col.key ? 'text-accent-600 font-semibold' : ''
                        }`}
                      >
                        {col.label}
                        <ArrowUpDown size={12} />
                      </button>
                    </th>
                  ))}
                  {view === 'city' && <th className="py-2 pr-3">Response Breakdown</th>}
                  <th className="py-2 pr-3">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const key = view === 'city' ? r._id : r.stateCode;
                  const activity = timeAgo(r.lastActivityDate);
                  return (
                    <tr key={key} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-3 font-medium text-gray-800">{key || 'Unspecified'}</td>
                      <td className="py-3 pr-3">{r.totalLeads}</td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Phone size={12} /> {r.totalCalled}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Home size={12} /> {r.totalVisited}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.conversionRate >= 20
                              ? 'bg-green-50 text-green-700'
                              : r.conversionRate >= 5
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <TrendingUp size={12} /> {r.conversionRate}%
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Users size={12} /> {r.activeAgents}
                        </span>
                      </td>
                      {view === 'city' && (
                        <td className="py-3 pr-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {Object.entries(r.responseBreakdown || {}).length === 0 ? (
                              <span className="text-xs text-gray-400">No responses logged</span>
                            ) : (
                              Object.entries(r.responseBreakdown).map(([outcome, count]) => (
                                <span
                                  key={outcome}
                                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                                    OUTCOME_COLORS[outcome] || 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {outcome} · {count}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      )}
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${
                            activity.stale ? 'text-red-500' : 'text-gray-500'
                          }`}
                        >
                          <Clock size={12} /> {activity.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
