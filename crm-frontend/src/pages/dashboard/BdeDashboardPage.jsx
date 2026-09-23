import React, { useEffect, useState, useCallback } from 'react';
import { Phone, MapPinned, TrendingUp, Target, Trophy, Loader2, Radio } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth.js';
import { dashboardApi, calendarApi } from '../../lib/api/endpoints.js';
import StatCard from '../../components/dashboard/StatCard.jsx';
import FunnelChart from '../../components/dashboard/FunnelChart.jsx';
import StreakHeatmap from '../../components/calendar/StreakHeatmap.jsx';
import Card from '../../components/ui/Card.jsx';
import { useLiveDashboardRefresh } from '../../hooks/useLiveDashboardRefresh.js';

export default function BdeDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [streak, setStreak] = useState(null);
  const [err, setErr] = useState('');
  const [justUpdated, setJustUpdated] = useState(false);

  const fetchDashboard = useCallback(
    (silent = false) => {
      dashboardApi
        .bde(user._id, { skipErrorToast: true }) // inline error banner below already covers this
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
    },
    [user._id]
  );

  useEffect(() => {
    fetchDashboard();
    calendarApi
      .streak(user._id, { skipErrorToast: true })
      .then((res) => setStreak(res.data.data))
      .catch(() => toast.error('Could not load your streak.'));
  }, [fetchDashboard, user._id]);

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
          <h1 className="text-xl font-bold text-gray-800">My Dashboard</h1>
          <p className="text-sm text-gray-500">Personal stats, target progress, and streak</p>
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
        <StatCard label="Calls Today" value={data.callsToday} icon={Phone} color="indigo" />
        <StatCard label="Visits Today" value={data.visitsToday} icon={MapPinned} color="accent" />
        <StatCard label="Conversions" value={data.totalConverted} icon={TrendingUp} color="green" />
        <StatCard
          label="Daily Target"
          value={data.user.dailyTarget}
          sublabel={`${data.callsToday}/${data.user.dailyTarget} calls made`}
          icon={Target}
          color="amber"
        />
      </div>

      <Card title="Today's Progress">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-gray-500">Calls toward daily target</span>
          <span className="font-semibold text-gray-800">{data.dailyTargetProgress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              data.dailyTargetProgress >= 100 ? 'bg-green-500' : 'bg-accent-500'
            }`}
            style={{ width: `${Math.min(100, data.dailyTargetProgress)}%` }}
          />
        </div>
        {data.rank && (
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
            <Trophy size={16} className="text-amber-500" />
            <span>
              You're ranked <strong>#{data.rank}</strong> of {data.podSize} in your team
            </span>
          </div>
        )}
      </Card>

      <FunnelChart funnel={data.funnel} title="My Funnel" />

      {streak && (
        <StreakHeatmap
          heatmapData={streak.heatmap}
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
        />
      )}
    </div>
  );
}