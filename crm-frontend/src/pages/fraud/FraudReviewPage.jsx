import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Info } from 'lucide-react';
import { fraudApi } from '../../lib/api/endpoints.js';
import ReviewPanel from '../../components/fraud/ReviewPanel.jsx';
import TrustBadge from '../../components/fraud/TrustBadge.jsx';
import { useSocketEvent } from '../../hooks/useSocket.js';
import { RULES, groupFlags } from '../../lib/utils/fraudHelpers.js';

const TABS = [
  { status: 'open', label: 'Pending', countKey: 'open' },
  { status: 'reviewed_genuine', label: 'Genuine', countKey: 'genuine' },
  { status: 'reviewed_fraudulent', label: 'Fraudulent', countKey: 'fraudulent' },
];

const selectClass = 'border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white';

export default function FraudReviewPage() {
  const [tab, setTab] = useState('open');
  const [flags, setFlags] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ userId: '', severity: '', rule: '' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fraudApi.listFlags({ status: tab }), fraudApi.summary()])
      .then(([flagRes, summaryRes]) => {
        setFlags(flagRes.data.data);
        setSummary(summaryRes.data.data);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load fraud flags.'))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  // Live: a new flag was raised, so refetch (the server scopes it to this user)
  useSocketEvent('fraud:flagRaised', () => load());

  const handleReview = async (flagIds, decision, reviewNotes) => {
    try {
      await fraudApi.reviewFlags(flagIds, decision, reviewNotes);
      toast.success(
        decision === 'fraudulent'
          ? 'Marked fraudulent. Trust score updated.'
          : 'Marked genuine. Trust score updated.'
      );
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save the review. Please try again.');
    }
  };

  const people = useMemo(() => {
    const map = new Map();
    flags.forEach((f) => f.userId && map.set(f.userId._id, f.userId.name));
    return [...map];
  }, [flags]);

  const groups = useMemo(
    () =>
      groupFlags(
        flags.filter(
          (f) =>
            (!filters.userId || f.userId?._id === filters.userId) &&
            (!filters.severity || f.severity === filters.severity) &&
            (!filters.rule || f.rule === filters.rule)
        )
      ),
    [flags, filters]
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold mb-1">Fraud &amp; Data Quality Review</h1>
      <p className="text-sm text-gray-500 mb-4">
        Suspicious activity is flagged automatically. Check the evidence, then mark it genuine or fraudulent.
      </p>

      <div className="flex items-start gap-2 bg-brand-50 text-brand-500 text-xs rounded-lg px-3 py-2.5 mb-4">
        <Info size={15} className="mt-0.5 flex-shrink-0" />
        <span>
          Each confirmed fraudulent flag lowers a person&apos;s trust score (Low -2, Medium -5, High -10).
          Marking it genuine gives the points back. A low score only shows a warning badge and does not
          restrict anyone.
        </span>
      </div>

      {summary?.lowestTrust?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold mb-2">Trust scores to keep an eye on</p>
          <div className="flex flex-wrap gap-3">
            {summary.lowestTrust.map((p) => (
              <div key={p._id} className="flex items-center gap-2 text-sm">
                <span className="text-gray-700">{p.name}</span>
                <TrustBadge score={p.trustScore} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.status}
            onClick={() => {
              setTab(t.status);
              setFilters({ userId: '', severity: '', rule: '' });
            }}
            className={`px-3 py-1 rounded-full text-sm ${tab === t.status ? 'bg-accent-500 text-white' : 'bg-gray-100 text-brand-500 hover:bg-gray-200'
              }`}
          >
            {t.label} ({summary?.counts?.[t.countKey] ?? 0})
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select className={selectClass} value={filters.userId} onChange={(e) => setFilters((p) => ({ ...p, userId: e.target.value }))}>
          <option value="">All people</option>
          {people.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select className={selectClass} value={filters.severity} onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value }))}>
          <option value="">All severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select className={selectClass} value={filters.rule} onChange={(e) => setFilters((p) => ({ ...p, rule: e.target.value }))}>
          <option value="">All rule types</option>
          {Object.entries(RULES).map(([key, r]) => (
            <option key={key} value={key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading flags...</p>
      ) : (
        <ReviewPanel groups={groups} mode={tab === 'open' ? 'open' : 'history'} onReview={handleReview} />
      )}
    </div>
  );
}