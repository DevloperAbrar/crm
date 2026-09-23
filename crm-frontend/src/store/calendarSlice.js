import { useState, useCallback } from 'react';
import { calendarApi } from '../lib/api/endpoints.js';

export function useCalendarSlice() {
  const [dueToday, setDueToday] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyCalendar = useCallback(async (date) => {
    setLoading(true);
    try {
      const { data } = await calendarApi.me(date);
      setDueToday(data.data.dueToday);
      setUpcoming(data.data.upcoming);
    } finally {
      setLoading(false);
    }
  }, []);

  return { dueToday, upcoming, loading, fetchMyCalendar };
}
