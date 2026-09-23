import React, { useEffect, useState, useCallback } from 'react';
import { Target, TrendingUp, Loader2, Radio } from 'lucide-react';
import { toast } from 'react-toastify';
import { dashboardApi, userApi } from '../../lib/api/endpoints.js';
import StatCard from '../../components/dashboard/StatCard.jsx';
import FunnelChart from '../../components/dashboard/FunnelChart.jsx';
import Leaderboard from '../../components/dashboard/Leaderboard.jsx';
import PerBdeBreakdown from '../../components/dashboard/PerBdeBreakdown.jsx';
import ExportReportsPanel from '../../components/dashboard/ExportReportsPanel.jsx';
import Card from '../../components/ui/Card.jsx';
import OnlineDot from '../../components/ui/OnlineDot.jsx';
import { useLiveDashboardRefresh } from '../../hooks/useLiveDashboardRefresh.js';
import { usePresence } from '../../hooks/usePresence.js';

export default function TeamLeadDashboard() {
  const [data, setData] = useState(null);
  const [team, setTeam] = useState([]);
  const [err, setErr] = useState('');
  const [justUpdated, setJustUpdated] = useState(false);
  const { isOnline } = usePresence();

  const fetchDashboard = useCallback((silent = false) => {
    dashboardApi
      .team({ skipErrorToast: true }) // inline error banner below already covers this
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
        if (silent) toast.error(msg);
      });
  }, []);

  const fetchTeam = useCallback(() => {
    userApi
      .list({ skipErrorToast: true })
      .then((res) => setTeam(res.data.data.filter((u) => u.role === 'bde')))
      .catch(() => toast.error('Could not load team presence.'));
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchTeam();
  }, [fetchDashboard, fetchTeam]);

  useLiveDashboardRefresh(() => fetchDashboard(true));

  if (err) return <p className="text-sm text-red-500">{err}</p>;

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Loading dashboard...
      </div>
    );
  }

  const onlineCount = team.filter((m) => isOnline(m._id, m.isOnline)).length;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Team Dashboard</h1>
          <p className="text-sm text-gray-500">Your pod's stats, funnel, and per-BDE breakdown</p>
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Leads" value={data.totalLeads} icon={Target} color="indigo" />
        <StatCard label="Converted" value={data.totalConverted} icon={TrendingUp} color="green" />
        <StatCard label="Conversion Rate" value={`${data.conversionRate}%`} color="amber" />
      </div>

      <Card
        title="Team Presence"
        actions={
          <span className="text-xs text-gray-400">
            {onlineCount} of {team.length} online
          </span>
        }
      >
        {team.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No BDEs in your pod yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {team.map((member) => {
              const online = isOnline(member._id, member.isOnline);
              return (
                <div
                  key={member._id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50"
                >
                  <OnlineDot online={online} size={9} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                    <p className={`text-xs ${online ? 'text-green-600' : 'text-gray-400'}`}>
                      {online ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <FunnelChart funnel={data.funnel} title="Pod Funnel" />

      <PerBdeBreakdown perBdeFunnel={data.perBdeFunnel} />

      <Leaderboard entries={data.leaderboard} title="Pod Leaderboard" />

      <ExportReportsPanel agents={data.leaderboard.map((l) => ({ id: l.id, name: l.name }))} />
    </div>
  );
}