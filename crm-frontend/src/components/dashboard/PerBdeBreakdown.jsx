import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

export default function PerBdeBreakdown({ perBdeFunnel = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <Card title="Per-BDE Breakdown">
      {perBdeFunnel.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No BDEs assigned to this pod yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {perBdeFunnel.map((b) => {
            const isOpen = expandedId === b.id;
            return (
              <div key={b.id}>
                <button
                  onClick={() => setExpandedId(isOpen ? null : b.id)}
                  className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 px-2 -mx-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="font-medium text-gray-800">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{b.totalLeads} leads</span>
                    <span className="font-semibold text-green-600">
                      {b.converted} converted ({b.conversionRate}%)
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <div className="pb-4 pl-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STAGE_ORDER.map((stage) => (
                      <div
                        key={stage}
                        className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex flex-col gap-0.5"
                      >
                        <span className="text-gray-400">{stage}</span>
                        <span className="font-semibold text-gray-700 text-sm">
                          {b.funnel[stage] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
