import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { calendarApi } from '../../lib/api/endpoints.js';
import Badge from '../../components/ui/Badge.jsx';
import { useRole } from '../../hooks/useRole.js';
import { formatDate } from '../../lib/utils/dateHelpers.js';

const ROLE_LABEL = { team_lead: 'Team Lead', bde: 'BDE' };
const UNASSIGNED = 'unassigned';

function Section({ title, tone, leads, onOpen }) {
  if (leads.length === 0) return null;
  const titleColor = tone === 'red' ? 'text-red-600' : 'text-brand-500';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <h3 className={`font-semibold mb-3 ${titleColor}`}>
        {title} ({leads.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
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
                onClick={() => onOpen(lead)}
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
              >
                <td className="py-2 px-2 font-medium">{lead.businessName}</td>
                <td className="py-2 px-2">{lead.cityName || '-'}</td>
                <td className="py-2 px-2">
                  <Badge label={lead.status} />
                </td>
                <td className={`py-2 px-2 ${lead.assignedTo ? '' : 'text-gray-400'}`}>
                  {lead.assignedTo?.name || 'Unassigned'}
                </td>
                <td className="py-2 px-2">{formatDate(lead.lastContactedAt) || '-'}</td>
                <td className={`py-2 px-2 ${tone === 'red' ? 'text-red-600 font-medium' : ''}`}>
                  {formatDate(lead.nextFollowUpDate)}
                  {lead.followUpMode === 'auto' && lead.followUpStep
                    ? ` · #${lead.followUpStep} of 5`
                    : lead.followUpMode === 'manual'
                      ? ' · manual'
                      : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TeamCalendarPage() {
  const { isFounder } = useRole();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    calendarApi
      .team(undefined, { skipErrorToast: true }) // inline error banner below already covers this
      .then((res) => setData(res.data.data))
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to load team calendar';
        setError(msg);
        toast.error(msg);
      });
  }, []);

  const people = data?.people || data?.bdes || [];
  const overdue = data?.overdue || [];
  const dueToday = data?.dueToday || [];
  const upcoming = data?.upcoming || [];

  const ownerKey = (l) => l.assignedTo?._id || UNASSIGNED;

  const counts = useMemo(() => {
    const map = {};
    [...overdue, ...dueToday, ...upcoming].forEach((l) => {
      const key = l.assignedTo?._id || UNASSIGNED;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [overdue, dueToday, upcoming]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data) return <p className="text-sm text-gray-400">Loading team calendar...</p>;

  const filter = (list) => (selected ? list.filter((l) => ownerKey(l) === selected) : list);
  const fOverdue = filter(overdue);
  const fDueToday = filter(dueToday);
  const fUpcoming = filter(upcoming);
  const nothing = fOverdue.length + fDueToday.length + fUpcoming.length === 0;
  const totalCount = overdue.length + dueToday.length + upcoming.length;

  const tabClass = (active) =>
    `px-3 py-1 rounded-full text-sm whitespace-nowrap ${
      active ? 'bg-accent-500 text-white' : 'bg-gray-100 text-brand-500 hover:bg-gray-200'
    }`;

  const open = (l) => navigate(`/leads/${l._id}`);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Team Calendar</h1>
      <p className="text-sm text-gray-500 mb-4">
        {isFounder ? 'Follow-ups across the whole company' : 'Follow-ups for your BDEs'}
        {' '}· overdue, due today and the next 30 days
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setSelected(null)} className={tabClass(!selected)}>
          {isFounder ? 'Everyone' : 'All BDEs'} ({totalCount})
        </button>
        {people.map((p) => (
          <button key={p._id} onClick={() => setSelected(p._id)} className={tabClass(selected === p._id)}>
            {p.name}
            <span className="opacity-70">
              {' '}
              · {ROLE_LABEL[p.role] || p.role} · {counts[p._id] || 0}
            </span>
          </button>
        ))}
        {isFounder && (
          <button onClick={() => setSelected(UNASSIGNED)} className={tabClass(selected === UNASSIGNED)}>
            Unassigned
            <span className="opacity-70"> · {counts[UNASSIGNED] || 0}</span>
          </button>
        )}
      </div>

      {nothing ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-500">No follow-ups scheduled here.</p>
          <p className="text-xs text-gray-400 mt-1">
            Follow-ups are created automatically after the first call on a lead. Leads that
            haven&apos;t been called yet don&apos;t appear on the calendar.
          </p>
        </div>
      ) : (
        <>
          <Section title="Overdue" tone="red" leads={fOverdue} onOpen={open} />
          <Section title="Due Today" leads={fDueToday} onOpen={open} />
          <Section title="Upcoming" leads={fUpcoming} onOpen={open} />
        </>
      )}
    </div>
  );
}