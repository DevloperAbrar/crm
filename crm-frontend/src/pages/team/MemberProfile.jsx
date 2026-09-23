import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userApi, dashboardApi } from '../../lib/api/endpoints.js';
import Card from '../../components/ui/Card.jsx';
import TrustBadge from '../../components/fraud/TrustBadge.jsx';
import TerritoryAssign from '../../components/team/TerritoryAssign.jsx';
import TargetEditor from '../../components/team/TargetEditor.jsx';
import { useRole } from '../../hooks/useRole.js';

export default function MemberProfile() {
  const { id } = useParams();
  const { isFounder, isTeamLead } = useRole();
  const [member, setMember] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchMember = () => {
    userApi
      .list({ skipErrorToast: true })
      .then((res) => {
        setMember(res.data.data.find((u) => u._id === id));
      })
      .catch(() => toast.error('Could not load this team member.'));
  };

  useEffect(() => {
    fetchMember();
    dashboardApi
      .bde(id, { skipErrorToast: true })
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error('Could not load performance stats.'));
  }, [id]);

  // Saves a patch, shows a toast, and rethrows on failure so the form can react
  const saveMember = async (userId, patch, successMessage, failureMessage) => {
    try {
      await userApi.update(userId, patch, { skipErrorToast: true });
      toast.success(successMessage);
      fetchMember();
    } catch (err) {
      toast.error(err.response?.data?.message || failureMessage);
      throw err;
    }
  };

  const handleSaveTerritory = (userId, patch) =>
    saveMember(userId, patch, 'Territory saved.', 'Could not save territory. Please try again.');

  const handleSaveTarget = (userId, patch) =>
    saveMember(userId, patch, 'Targets saved.', 'Could not save targets. Please try again.');

  if (!member) return <p className="text-sm text-gray-400">Loading member...</p>;

  const canManage = isFounder || isTeamLead;

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">{member.name}</h1>
        <TrustBadge score={member.trustScore} />
      </div>

      <Card title="Contact">
        <p className="text-sm">{member.email}</p>
        <p className="text-sm">{member.phone}</p>
        <p className="text-xs text-gray-400 mt-1 capitalize">{member.role?.replace('_', ' ')}</p>
      </Card>

      {stats && (
        <Card title="Performance">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-brand-500">{stats.user.stats.callsMade}</p>
              <p className="text-xs text-gray-400">Calls</p>
            </div>
            <div>
              <p className="text-lg font-bold text-brand-500">{stats.user.stats.visitsMade}</p>
              <p className="text-xs text-gray-400">Visits</p>
            </div>
            <div>
              <p className="text-lg font-bold text-accent-500">{stats.user.stats.conversions}</p>
              <p className="text-xs text-gray-400">Conversions</p>
            </div>
            <div>
              <p className="text-lg font-bold text-brand-500">🔥 {stats.user.stats.currentStreak}</p>
              <p className="text-xs text-gray-400">Current Streak</p>
            </div>
          </div>
        </Card>
      )}

      {canManage && member.role === 'bde' && (
        <Card title="Daily / Weekly Target">
          <TargetEditor user={member} onSave={handleSaveTarget} />
        </Card>
      )}

      {canManage && (
        <Card title="Territory">
          <TerritoryAssign user={member} onSave={handleSaveTerritory} />
        </Card>
      )}
    </div>
  );
}