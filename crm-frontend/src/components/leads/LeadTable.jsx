import React from 'react';
import Badge from '../ui/Badge.jsx';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../lib/utils/dateHelpers.js';

export default function LeadTable({ leads, selectedIds = [], onToggleSelect }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop / tablet: real table */}
      <table className="w-full text-sm hidden md:table">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            {onToggleSelect && <th className="py-2 px-2 w-8"></th>}
            <th className="py-2 px-2">Business</th>
            <th className="py-2 px-2">City</th>
            <th className="py-2 px-2">Status</th>
            <th className="py-2 px-2">Assigned To</th>
            <th className="py-2 px-2">Last Contacted</th>
            <th className="py-2 px-2">Next Follow-up</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead._id}
              className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/leads/${lead._id}`)}
            >
              {onToggleSelect && (
                <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lead._id)}
                    onChange={() => onToggleSelect(lead._id)}
                  />
                </td>
              )}
              <td className="py-2 px-2 font-medium">{lead.businessName}</td>
              <td className="py-2 px-2">{lead.cityName || '-'}</td>
              <td className="py-2 px-2">
                <Badge label={lead.status} />
              </td>
              <td className="py-2 px-2">{lead.assignedTo?.name || '-'}</td>
              <td className="py-2 px-2">{formatDate(lead.lastContactedAt) || '-'}</td>
              <td className="py-2 px-2">{lead.nextFollowUpDate ? formatDate(lead.nextFollowUpDate) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: stacked cards - a table just doesn't fit a phone screen */}
      <div className="flex flex-col gap-2 md:hidden">
        {leads.map((lead) => (
          <div
            key={lead._id}
            onClick={() => navigate(`/leads/${lead._id}`)}
            className="border border-gray-100 rounded-lg p-3 flex items-start gap-3 active:bg-gray-50"
          >
            {onToggleSelect && (
              <input
                type="checkbox"
                className="mt-1 flex-shrink-0"
                checked={selectedIds.includes(lead._id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect(lead._id);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm truncate">{lead.businessName}</p>
                <Badge label={lead.status} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{lead.cityName || 'No city'}</p>
              <p className="text-xs text-gray-400">
                {lead.assignedTo?.name || 'Unassigned'} · {formatDate(lead.lastContactedAt) || 'Never contacted'}
              </p>
              {lead.nextFollowUpDate && (
                <p className="text-xs text-gray-400">Follow-up: {formatDate(lead.nextFollowUpDate)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
