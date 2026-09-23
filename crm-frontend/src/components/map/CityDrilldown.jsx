import React from 'react';
import Card from '../ui/Card.jsx';
import LeadTable from '../leads/LeadTable.jsx';
import { formatDate } from '../../lib/utils/dateHelpers.js';

export default function CityDrilldown({ cityName, summary, leads = [], onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 max-w-full bg-white shadow-xl p-4 overflow-y-auto z-50">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">{cityName}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">
            ✕
          </button>
        </div>

        {summary && (
          <Card className="mb-4">
            <div className="grid grid-cols-2 gap-3 text-center mb-3">
              <div>
                <p className="text-lg font-bold text-brand-500">{summary.totalLeads}</p>
                <p className="text-xs text-gray-400">Total Leads</p>
              </div>
              <div>
                <p className="text-lg font-bold text-accent-500">{summary.conversionRate}%</p>
                <p className="text-xs text-gray-400">Conversion Rate</p>
              </div>
              <div>
                <p className="text-lg font-bold text-brand-500">{summary.totalCalled}</p>
                <p className="text-xs text-gray-400">Calls Made</p>
              </div>
              <div>
                <p className="text-lg font-bold text-brand-500">{summary.totalVisited}</p>
                <p className="text-xs text-gray-400">Visits Made</p>
              </div>
            </div>

            <div className="text-xs text-gray-500 flex justify-between border-t border-gray-100 pt-2">
              <span>{summary.activeAgents} agent(s) active</span>
              <span>Last activity: {summary.lastActivityDate ? formatDate(summary.lastActivityDate) : 'None yet'}</span>
            </div>

            {Object.keys(summary.responseBreakdown || {}).length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Response Breakdown</p>
                <div className="flex flex-col gap-1">
                  {Object.entries(summary.responseBreakdown).map(([outcome, count]) => (
                    <div key={outcome} className="flex justify-between text-xs">
                      <span className="text-gray-500">{outcome}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        <LeadTable leads={leads} />
      </div>
    </>
  );
}
