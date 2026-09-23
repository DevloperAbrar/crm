import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, Users2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { userApi } from '../../lib/api/endpoints.js';
import TeamTree from '../../components/team/TeamTree.jsx';
import AddMemberModal from '../../components/team/AddMemberModal.jsx';
import Button from '../../components/ui/Button.jsx';
import { useRole } from '../../hooks/useRole.js';

export default function TeamManagementPage() {
  const { isFounder } = useRole();
  const [teamLeads, setTeamLeads] = useState([]);
  const [unassignedBdes, setUnassignedBdes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultRole, setModalDefaultRole] = useState('bde');
  const [editingMember, setEditingMember] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.list({ skipErrorToast: true });
      const users = res.data.data;

      const leads = users.filter((u) => u.role === 'team_lead');
      const bdes = users.filter((u) => u.role === 'bde');

      const structured = leads.map((tl) => ({
        ...tl,
        bdes: bdes.filter((b) => b.reportsTo === tl._id || b.reportsTo?._id === tl._id),
      }));

      const unassigned = bdes.filter((b) => !b.reportsTo);

      setTeamLeads(structured);
      setUnassignedBdes(unassigned);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAddModal = (role) => {
    setEditingMember(null);
    setModalDefaultRole(role);
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMember(null);
  };

  const handleCreate = async (form) => {
    try {
      await userApi.create(form, { skipErrorToast: true });
      toast.success(`${form.role === 'team_lead' ? 'Team Lead' : 'BDE'} created successfully.`);
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user.');
      throw err;
    }
  };

  const handleUpdate = async (userId, payload) => {
    try {
      await userApi.update(userId, payload, { skipErrorToast: true });
      toast.success('Details updated.');
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user.');
      throw err;
    }
  };

  const handleReassign = async (bdeId, newTeamLeadId) => {
    try {
      await userApi.reassignTeam(bdeId, newTeamLeadId, { skipErrorToast: true });
      toast.success('BDE reassigned successfully.');
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reassign BDE.');
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await userApi.deactivate(userId, { skipErrorToast: true });
      toast.success('User deactivated.');
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not deactivate user.');
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await userApi.reactivate(userId, { skipErrorToast: true });
      toast.success('User reactivated.');
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reactivate user.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users2 size={22} className="text-brand-500" />
            Team Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isFounder
              ? 'Create Team Leads and BDEs, and assign BDEs to a Team Lead.'
              : 'Manage the BDEs assigned to you.'}
          </p>
        </div>
        <div className="flex gap-2">
          {isFounder && (
            <Button variant="secondary" onClick={() => openAddModal('team_lead')} className="flex items-center gap-1.5">
              <UserPlus size={16} /> Add Team Lead
            </Button>
          )}
          <Button onClick={() => openAddModal('bde')} className="flex items-center gap-1.5">
            <UserPlus size={16} /> Add BDE
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading team...</p>
      ) : (
        <TeamTree
          teamLeads={teamLeads}
          unassignedBdes={unassignedBdes}
          onReassign={handleReassign}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
          onEdit={openEditModal}
        />
      )}

      <AddMemberModal
        open={modalOpen}
        onClose={closeModal}
        teamLeads={teamLeads}
        defaultRole={modalDefaultRole}
        existingMember={editingMember}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
