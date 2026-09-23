import React, { useEffect, useState, useCallback } from 'react';
import { Users, Target, TrendingUp, IndianRupee, Loader2, Radio } from 'lucide-react';
import { toast } from 'react-toastify';
import { dashboardApi } from '../../lib/api/endpoints.js';
import StatCard from '../../components/dashboard/StatCard.jsx';
import FunnelChart from '../../components/dashboard/FunnelChart.jsx';
import Leaderboard from '../../components/dashboard/Leaderboard.jsx';
import ExportReportsPanel from '../../components/dashboard/ExportReportsPanel.jsx';
import Card from '../../components/ui/Card.jsx';
import { useLiveDashboardRefresh } from '../../hooks/useLiveDashboardRefresh.js';

export default function FounderDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [justUpdated, setJustUpdated] = useState(false);

  const fetchDashboard = useCallback((silent = false) => {
    dashboardApi
      .founder({ skipErrorToast: true }) // there's already an inline error banner below, so no need for a duplicate toast
      .then((res) => {
        setData(res.data.data);
        setErr('');
        if (silent) {
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 2000);
        }
      })
      .catch((e) => {
        const msg = e?.response?.data?.message || 'Failed to load dashboard';
        setErr(msg);
        // A silent (live-refresh-triggered) failure gets a toast since there's
        // no obvious visual change otherwise; the initial load failure just
        // shows the inline banner below instead.
        if (silent) toast.error(msg);
      });
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useLiveDashboardRefresh(() => fetchDashboard(true));

  if (err) return <p className="text-sm text-red-500">{err}</p>;

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Founder Dashboard</h1>
          <p className="text-sm text-gray-500">Organisation-wide performance across every team</p>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
            justUpdated ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Radio size={12} className={justUpdated ? 'animate-pulse' : ''} />
          {justUpdated ? 'Updated just now' : 'Live'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={data.totalLeads} icon={Target} color="indigo" />
        <StatCard label="Active Users" value={data.totalUsers} icon={Users} color="accent" />
        <StatCard label="Converted" value={data.totalConverted} icon={TrendingUp} color="green" />
        <StatCard
          label="Conversion Rate"
          value={`${data.conversionRate}%`}
          sublabel={`₹${(data.totalRevenue || 0).toLocaleString('en-IN')} revenue`}
          icon={IndianRupee}
          color="amber"
        />
      </div>

      <FunnelChart funnel={data.funnel} title="Organisation Funnel" />

      <Card title="Team Performance">
        {data.teamBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No teams set up yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2">Team Lead</th>
                  <th className="py-2">BDEs</th>
                  <th className="py-2">Total Leads</th>
                  <th className="py-2">Converted</th>
                  <th className="py-2">Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.teamBreakdown.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-800">{t.name}</td>
                    <td className="py-2.5">{t.bdeCount}</td>
                    <td className="py-2.5">{t.totalLeads}</td>
                    <td className="py-2.5 text-green-600 font-semibold">{t.converted}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 text-xs font-semibold">
                        {t.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Leaderboard entries={data.leaderboard} title="Organisation Leaderboard" showTeamLead />

      <ExportReportsPanel agents={data.leaderboard.map((l) => ({ id: l.id, name: l.name }))} />
    </div>
  );
}