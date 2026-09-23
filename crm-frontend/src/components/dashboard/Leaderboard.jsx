import React, { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import Card from '../ui/Card.jsx';

const RANK_STYLES = [
  'bg-amber-100 text-amber-700', // 1st
  'bg-gray-200 text-gray-600', // 2nd
  'bg-orange-100 text-orange-700', // 3rd
];

const COLUMNS = [
  { key: 'callsMade', label: 'Calls' },
  { key: 'visitsMade', label: 'Visits' },
  { key: 'conversions', label: 'Conversions' },
];

export default function Leaderboard({ entries = [], title = 'Leaderboard', showTeamLead = false }) {
  const [sortKey, setSortKey] = useState('conversions');

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)),
    [entries, sortKey]
  );

  const maxConversions = Math.max(1, ...entries.map((e) => e.conversions || 0));

  return (
    <Card title={title}>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No BDEs to show yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-2 w-10">#</th>
                <th className="py-2 pr-2">Name</th>
                {showTeamLead && <th className="py-2 pr-2">Team Lead</th>}
                {COLUMNS.map((col) => (
                  <th key={col.key} className="py-2 pr-2">
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
                <th className="py-2 pr-2 min-w-[100px]">Progress</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e, i) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 pr-2">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        RANK_STYLES[i] || 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 font-medium text-gray-800">{e.name}</td>
                  {showTeamLead && <td className="py-2.5 pr-2 text-gray-500">{e.teamLead}</td>}
                  <td className="py-2.5 pr-2">{e.callsMade || 0}</td>
                  <td className="py-2.5 pr-2">{e.visitsMade || 0}</td>
                  <td className="py-2.5 pr-2 font-semibold text-gray-700">{e.conversions || 0}</td>
                  <td className="py-2.5 pr-2">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-accent-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${((e.conversions || 0) / maxConversions) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
