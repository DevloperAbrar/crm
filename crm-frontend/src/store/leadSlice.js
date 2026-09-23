import { useState, useCallback } from 'react';
import { leadApi } from '../lib/api/endpoints.js';

// Lightweight state "slice" as a hook, standing in for a Redux slice.
// Swap for @reduxjs/toolkit's createSlice if the team adopts Redux later.
export function useLeadSlice() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(async (params) => {
    setLoading(true);
    try {
      const { data } = await leadApi.list(params);
      setLeads(data.data.leads);
      setTotal(data.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLeadLocal = useCallback((id, patch) => {
    setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, ...patch } : l)));
  }, []);

  return { leads, total, loading, fetchLeads, updateLeadLocal, setLeads };
}
