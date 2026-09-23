import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { useRole } from '../../hooks/useRole.js';

const emptyForm = { name: '', email: '', phone: '', role: 'bde', reportsTo: '' };

/**
 * Doubles as both "Add Member" and "Edit Member": when `existingMember` is
 * passed, the form is pre-filled from it, the submit handler calls
 * `onUpdate` instead of `onCreate`, role is locked (role changes go through
 * a dedicated flow per user.controller.js), and email editing is allowed
 * but warns that it changes which Google account can sign in as this
 * person, since Team Leads/BDEs authenticate by matching their Google
 * email exactly.
 */
export default function AddMemberModal({
  open,
  onClose,
  teamLeads = [],
  onCreate,
  onUpdate,
  defaultRole,
  existingMember = null,
}) {
  const { isFounder } = useRole();
  const isEditMode = Boolean(existingMember);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existingMember) {
      setForm({
        name: existingMember.name || '',
        email: existingMember.email || '',
        phone: existingMember.phone || '',
        role: existingMember.role || 'bde',
        reportsTo: existingMember.reportsTo?._id || existingMember.reportsTo || '',
      });
    } else {
      setForm({ ...emptyForm, role: defaultRole || 'bde' });
    }
    setError('');
  }, [open, defaultRole, existingMember]);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.role === 'bde' && isFounder && !form.reportsTo) {
      const msg = 'Please select which Team Lead this BDE reports to.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        // role is intentionally not sent - user.controller.js's updateUser
        // strips it anyway, and role changes should go through a
        // deliberate separate flow, not a quick edit form.
        const { role, ...editableFields } = form;
        await onUpdate(existingMember._id, editableFields);
      } else {
        await onCreate(form);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user`);
    } finally {
      setSubmitting(false);
    }
  };

  const title = isEditMode
    ? `Edit ${existingMember.role === 'team_lead' ? 'Team Lead' : 'BDE'}`
    : form.role === 'team_lead'
    ? 'Add Team Lead'
    : 'Add BDE';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isFounder && !isEditMode && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.role}
              onChange={handleChange('role')}
            >
              <option value="bde">BDE (Caller / Field Agent)</option>
              <option value="team_lead">Team Lead</option>
            </select>
          </div>
        )}

        <Input label="Full Name" value={form.name} onChange={handleChange('name')} required />
        <Input label="Google Email" type="email" value={form.email} onChange={handleChange('email')} required />
        <p className="text-xs text-gray-500 -mt-2">
          {isEditMode
            ? "This person signs in with \"Sign in with Google\" using this exact email. Changing it means they'll need to sign in with the new Google account going forward."
            : 'This person will sign in with "Sign in with Google" using this exact email. It must be a Google account (Gmail or Google Workspace).'}
        </p>
        <Input label="Phone" value={form.phone} onChange={handleChange('phone')} />

        {form.role === 'bde' && isFounder && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Reports To (Team Lead)</label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.reportsTo}
              onChange={handleChange('reportsTo')}
              required
            >
              <option value="">Select a Team Lead</option>
              {teamLeads.map((tl) => (
                <option key={tl._id} value={tl._id}>
                  {tl.name}
                </option>
              ))}
            </select>
            {isEditMode && (
              <p className="text-xs text-gray-400 mt-0.5">
                To move this BDE to a different Team Lead, use "Reassign Team Lead" from the member
                card instead - it's tracked separately for audit purposes.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
