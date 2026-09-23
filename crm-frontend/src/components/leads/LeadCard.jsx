import React from 'react';
import { CalendarClock } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { formatDate } from '../../lib/utils/dateHelpers.js';

export default function LeadCard({ lead, onClick }) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isOverdue = lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) < startOfToday;

  return (
    <div
      onClick={() => onClick?.(lead)}
      className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm text-gray-800">{lead.businessName}</h4>
        <Badge label={lead.status} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{lead.cityName}</p>
      {lead.assignedTo?.name && (
        <p className="text-xs text-gray-400 mt-1">Assigned: {lead.assignedTo.name}</p>
      )}
      {lead.nextFollowUpDate && (
        <p
          className={`text-xs mt-1 flex items-center gap-1 ${
            isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
          }`}
        >
          <CalendarClock size={12} />
          Follow-up: {formatDate(lead.nextFollowUpDate)}
          {lead.followUpMode === 'auto' && lead.followUpStep ? ` · #${lead.followUpStep} of 5` : ''}
        </p>
      )}
    </div>
  );
}