import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import axiosInstance from '../../lib/api/axiosInstance.js';
import { useDebounce } from '../../hooks/useDebounce.js';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'founder', label: 'Founder' },
  { key: 'team_lead', label: 'Team Leads' },
  { key: 'bde', label: 'BDEs' },
];

const PAGE_SIZE = 25;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actionLabel(action) {
  // 'lead.statusChanged' -> 'Lead · Status Changed'
  if (!action) return '—';
  const [collection, ...rest] = action.split('.');
  const verb = rest.join(' ').replace(/([A-Z])/g, ' $1').trim();
  return `${collection} · ${verb.charAt(0).toUpperCase() + verb.slice(1)}`;
}

function ValuePreview({ value }) {
  const [open, setOpen] = useState(false);
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">—</span>;
  }
  const str = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  const isLong = str.length > 60;

  return (
    <div className="max-w-xs">
      <button
        type="button"
        onClick={() => isLong && setOpen((o) => !o)}
        className={`text-left text-xs font-mono text-gray-600 ${isLong ? 'cursor-pointer hover:text-brand-500' : ''}`}
      >
        {isLong && !open ? str.slice(0, 60) + '…' : str}
      </button>
    </div>
  );
}

export default function AuditLogPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [summary, setSummary] = useState({ all: 0, founder: 0, team_lead: 0, bde: 0 });

  const debouncedSearch = useDebounce(search, 400);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const params = {
        tab: activeTab,
        page,
        limit: PAGE_SIZE,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await axiosInstance.get('/audit-logs', { params });
      setLogs(res.data.data.logs);
      setTotal(res.data.data.total);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch, dateFrom, dateTo]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/audit-logs/summary');
      setSummary(res.data.data);
    } catch {
      // non-critical, ignore
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="text-brand-500" size={22} />
        <h1 className="text-xl font-bold text-gray-800">Audit Logs</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Every status change, reassignment, edit and deletion across the system — visible to Founder only.
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-accent-500 text-accent-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-accent-100 text-accent-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {summary[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user or collection…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 tracking-wide">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Previous</th>
                <th className="px-4 py-3 font-medium">New</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && err && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                    {err}
                  </td>
                </tr>
              )}
              {!loading && !err && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No audit logs found for this view.
                  </td>
                </tr>
              )}
              {!loading &&
                !err &&
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{log.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {log.userId?.role?.replace('_', ' ') || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">{actionLabel(log.action)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p className="font-mono">{log.targetCollection}</p>
                      <p className="font-mono text-gray-400">{String(log.targetId).slice(-8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ValuePreview value={log.previousValue} />
                    </td>
                    <td className="px-4 py-3">
                      <ValuePreview value={log.newValue} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>
            {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
