import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { leadApi } from '../../lib/api/endpoints.js';
import KanbanBoard from '../../components/kanban/KanbanBoard.jsx';

export default function KanbanPage() {
  const [leadsByStage, setLeadsByStage] = useState({});
  const [loading, setLoading] = useState(true);

  const groupByStage = (leads) => {
    const grouped = {};
    leads.forEach((lead) => {
      grouped[lead.status] = grouped[lead.status] || [];
      grouped[lead.status].push(lead);
    });
    return grouped;
  };

  const fetchLeads = () => {
    setLoading(true);
    leadApi
      .list({ limit: 500 })
      .then((res) => {
        setLeadsByStage(groupByStage(res.data.data.leads));
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || 'Could not load the pipeline.')
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const totalLeads = Object.values(leadsByStage).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  // Optimistic move: update the board instantly so the card doesn't
  // flicker/disappear while the request is in flight, then sync with the
  // server in the background. Only re-fetches (and rolls back) on failure.
  const handleDrop = async (leadId, newStage, businessName) => {
    let previousSnapshot;

    setLeadsByStage((prev) => {
      previousSnapshot = prev;
      const next = {};
      let movedLead = null;

      for (const [stage, leads] of Object.entries(prev)) {
        if (stage === newStage) continue;
        const remaining = leads.filter((l) => {
          if (l._id === leadId) {
            movedLead = l;
            return false;
          }
          return true;
        });
        next[stage] = remaining;
      }

      if (!movedLead) return prev; // lead not found locally, don't touch state

      next[newStage] = [
        { ...movedLead, status: newStage },
        ...(prev[newStage] || []),
      ];
      return next;
    });

    try {
      await leadApi.update(leadId, { status: newStage }, { skipErrorToast: true });
      toast.success(
        businessName ? `"${businessName}" moved to ${newStage}.` : 'Lead moved.'
      );
    } catch (err) {
      // Roll back to the last known-good state and let the user know.
      if (previousSnapshot) setLeadsByStage(previousSnapshot);
      toast.error(err.response?.data?.message || 'Could not move the lead. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-500">Lead Pipeline</h1>
        {!loading && (
          <span className="text-sm text-gray-400">{totalLeads} leads</span>
        )}
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-72 flex-shrink-0 h-64 rounded-xl bg-gray-50 border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <KanbanBoard leadsByStage={leadsByStage} onDropLead={handleDrop} />
      )}
    </div>
  );
}
