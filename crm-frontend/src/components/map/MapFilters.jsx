import React, { useEffect, useState } from 'react';
import { metaApi, categoryApi, userApi } from '../../lib/api/endpoints.js';
import { useRole } from '../../hooks/useRole.js';

const STATUSES = ['New', 'Attempted Contact', 'Contacted', 'Interested', 'Demo/Visit Scheduled', 'Visited', 'Negotiation', 'Converted', 'Lost'];

export default function MapFilters({ filters, onChange }) {
  const { isFounder, isTeamLead } = useRole();
  const canFilterByAgent = isFounder || isTeamLead;
  const [statesData, setStatesData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    metaApi.statesCities().then((res) => setStatesData(res.data.data || []));
    categoryApi.list().then((res) => setCategories(res.data.data || []));
    if (canFilterByAgent) {
      userApi.list().then((res) => setAgents(res.data.data.filter((u) => u.role === 'bde')));
    }
  }, [canFilterByAgent]);

  const cities = statesData.find((s) => s.stateCode === filters.state)?.cities || [];

  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.state || ''} onChange={(e) => onChange({ ...filters, state: e.target.value, city: '' })}>
        <option value="">All states</option>
        {statesData.map((s) => (
          <option key={s.stateCode} value={s.stateCode}>{s.stateName}</option>
        ))}
      </select>

      <select
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
        value={filters.city || ''}
        onChange={set('city')}
        disabled={!filters.state}
      >
        <option value="">All cities</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.status || ''} onChange={set('status')}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.category || ''} onChange={set('category')}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>

      {canFilterByAgent && (
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.assignedTo || ''} onChange={set('assignedTo')}>
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
