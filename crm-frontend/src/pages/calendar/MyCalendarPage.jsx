import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { calendarApi, leadApi } from '../../lib/api/endpoints.js';
import TaskCalendar from '../../components/calendar/TaskCalendar.jsx';

export default function MyCalendarPage() {
  const [overdue, setOverdue] = useState([]);
  const [dueToday, setDueToday] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [totalAssigned, setTotalAssigned] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      calendarApi.me(undefined, { skipErrorToast: true }),
      leadApi.list({ limit: 1 }, { skipErrorToast: true }),
    ])
      .then(([calRes, leadRes]) => {
        setOverdue(calRes.data.data.overdue || []);
        setDueToday(calRes.data.data.dueToday);
        setUpcoming(calRes.data.data.upcoming);
        setTotalAssigned(leadRes.data.data.total);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load your calendar.'))
      .finally(() => setLoading(false));
  }, []);

  const nothingAtAll = overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">My Calendar</h1>

      {!loading && nothingAtAll && totalAssigned === 0 && (
        <div className="bg-amber-50 text-amber-700 text-sm rounded-lg px-4 py-3 mb-4">
          You have <strong>0 leads assigned to you</strong>. Ask your Team Lead to assign some from
          the Leads page.
        </div>
      )}
      {!loading && nothingAtAll && totalAssigned > 0 && (
        <div className="bg-blue-50 text-blue-700 text-sm rounded-lg px-4 py-3 mb-4">
          You have {totalAssigned} lead(s) assigned, but none have a follow-up scheduled yet.
          Follow-up dates are created automatically after you make the first call, so start from
          the Leads page (look for leads marked <strong>New</strong>).
        </div>
      )}

      <TaskCalendar
        overdue={overdue}
        dueToday={dueToday}
        upcoming={upcoming}
        onLeadClick={(l) => navigate(`/leads/${l._id}`)}
      />
    </div>
  );
}