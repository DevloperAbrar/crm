import React from 'react';
import LeadCard from '../leads/LeadCard.jsx';

export default function TaskCalendar({ overdue = [], dueToday = [], upcoming = [], onLeadClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {overdue.length > 0 && (
        <div className="md:col-span-2">
          <h3 className="font-semibold mb-2 text-red-600">Overdue ({overdue.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {overdue.map((lead) => (
              <LeadCard key={lead._id} lead={lead} onClick={onLeadClick} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">Due Today ({dueToday.length})</h3>
        <div className="flex flex-col gap-2">
          {dueToday.length === 0 && (
            <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4">
              <p>Nothing due today 🎉</p>
              <p className="text-xs mt-1">
                Leads appear here on their scheduled follow-up dates, which start after your first
                call on each lead.
              </p>
            </div>
          )}
          {dueToday.map((lead) => (
            <LeadCard key={lead._id} lead={lead} onClick={onLeadClick} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Upcoming</h3>
        <div className="flex flex-col gap-2">
          {upcoming.length === 0 && <p className="text-sm text-gray-400">No upcoming follow-ups scheduled.</p>}
          {upcoming.map((lead) => (
            <LeadCard key={lead._id} lead={lead} onClick={onLeadClick} />
          ))}
        </div>
      </div>
    </div>
  );
}