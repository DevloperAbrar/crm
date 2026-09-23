import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IndianRupee, CalendarClock, Pencil, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { leadApi, interactionApi, dealApi, categoryApi } from '../../lib/api/endpoints.js';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Timeline from '../../components/interactions/Timeline.jsx';
import CallLogForm from '../../components/interactions/CallLogForm.jsx';
import DealForm from '../../components/leads/DealForm.jsx';
import LeadForm from '../../components/leads/LeadForm.jsx';
import { useSocket, useSocketEvent } from '../../hooks/useSocket.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useRole } from '../../hooks/useRole.js';
import { formatDate } from '../../lib/utils/dateHelpers.js';

export default function LeadProfilePage() {
  const { id } = useParams();
  const { isBde } = useRole();
  const { user } = useAuth();
  const socket = useSocket();
  const [lead, setLead] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [deal, setDeal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [followUp, setFollowUp] = useState(null);

  const [otherViewers, setOtherViewers] = useState({});

  const fetchProfile = () => {
    leadApi
      .get(id, { skipErrorToast: true })
      .then((res) => {
        setLead(res.data.data.lead);
        setInteractions(res.data.data.interactions);
        setDeal(res.data.data.deal);
        setFollowUp(res.data.data.followUp);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load this lead.'));
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    categoryApi.list({ skipErrorToast: true }).then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket || !id) return undefined;

    const announce = () => socket.emit('lead:viewing', { leadId: id });
    announce();
    socket.on('connect', announce);

    return () => {
      socket.emit('lead:stopViewing', { leadId: id });
      socket.off('connect', announce);
      setOtherViewers({});
    };
  }, [socket, id]);

  useSocketEvent('lead:viewing', (payload) => {
    if (payload.leadId !== id) return;
    if (String(payload.viewedBy?.id) === String(user?._id)) return;
    setOtherViewers((prev) => ({ ...prev, [payload.viewedBy.id]: payload.viewedBy.name }));
  });

  useSocketEvent('lead:stopViewing', (payload) => {
    if (payload.leadId !== id) return;
    setOtherViewers((prev) => {
      const next = { ...prev };
      delete next[payload.userId];
      return next;
    });
  });

  useSocketEvent('lead:statusChanged', (payload) => {
    if (payload.leadId === id) fetchProfile();
  });

  useSocketEvent('interaction:created', (payload) => {
    if (payload.lead?._id === id || payload.interaction?.leadId === id) fetchProfile();
  });

  const handleLogCall = async (payload, files = []) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') formData.append(key, value);
    });
    files.forEach((file) => formData.append('files', file));

    try {
      await interactionApi.create(formData, { skipErrorToast: true });
      toast.success(files.length ? 'Call logged with attachments.' : 'Call logged.');
      fetchProfile();
    } catch (err) {
      toast.error(
        (err.response?.data?.message || 'Could not log the call.') +
        ' Nothing was saved, so please fix this and try again.'
      );
      throw err; // tells CallLogForm not to clear the form
    }
  };

  // DealForm has no toast of its own - all deal save messaging lives here,
  // since this is the component that knows whether it's a create or update.
  const handleSaveDeal = async (payload) => {
    try {
      if (deal) {
        await dealApi.update(deal._id, payload, { skipErrorToast: true });
        toast.success('Deal updated successfully.');
      } else {
        await dealApi.create(payload, { skipErrorToast: true });
        toast.success('Deal saved successfully.');
      }
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save deal.');
      throw err; // let DealForm know the save failed, if it wants to react
    }
  };

  // Throws on failure so LeadForm can show the server's error message inline
  const handleUpdateLead = async (payload) => {
    try {
      await leadApi.update(id, payload, { skipErrorToast: true });
      toast.success('Lead updated successfully.');
      setEditOpen(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update lead.');
      throw err;
    }
  };

  if (!lead) return <p className="text-sm text-gray-400">Loading lead...</p>;

  const customFieldEntries = Object.entries(lead.customFieldValues || {}).filter(([, v]) => v !== '' && v != null);
  const isConverted = lead.status === 'Converted';
  const viewerNames = Object.values(otherViewers);

  const editInitialValues = {
    businessName: lead.businessName || '',
    categoryId: lead.categoryId?._id || lead.categoryId || '',
    stateCode: lead.stateCode || '',
    cityName: lead.cityName || '',
    address: lead.address || '',
    email: lead.email || '',
    website: lead.website || '',
    phones: (lead.phones || []).join(', '),
    customFieldValues: lead.customFieldValues || {},
  };

  const stepsDone = followUp?.stepsDone || 0;
  const isClosed = ['Converted', 'Lost'].includes(lead.status);
  let followUpText;
  if (isClosed) followUpText = 'Closed';
  else if (stepsDone === 0) followUpText = 'Starts after the first call';
  else if (!lead.nextFollowUpDate) followUpText = 'Not scheduled';
  else {
    const tag =
      lead.followUpMode === 'manual'
        ? ' (set manually)'
        : lead.followUpMode === 'auto'
          ? ` (Follow-up ${lead.followUpStep} of ${followUp.totalFollowUps})`
          : '';
    followUpText = `${formatDate(lead.nextFollowUpDate)}${tag}`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {viewerNames.length > 0 && (
        <div className="lg:col-span-3 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-lg">
          <Eye size={16} className="flex-shrink-0" />
          <span>
            {viewerNames.length === 1
              ? `${viewerNames[0]} is also viewing this lead right now.`
              : `${viewerNames.slice(0, -1).join(', ')} and ${viewerNames[viewerNames.length - 1]} are also viewing this lead right now.`}
            {' '}Coordinate before making changes to avoid overlapping work.
          </span>
        </div>
      )}

      <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold break-words">{lead.businessName}</h1>
          <div className="flex items-center gap-2">
            <Badge label={lead.status} />
            <Button
              variant="secondary"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Pencil size={14} /> Edit
            </Button>
          </div>
        </div>

        <Card title="Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <p><span className="text-gray-400">City:</span> {lead.cityName || '-'}</p>
            <p><span className="text-gray-400">State:</span> {lead.stateCode || '-'}</p>
            <p><span className="text-gray-400">Phone:</span> {lead.phones?.join(', ') || '-'}</p>
            <p className="break-words"><span className="text-gray-400">Email:</span> {lead.email || '-'}</p>
            <p className="break-words"><span className="text-gray-400">Website:</span> {lead.website || '-'}</p>
            <p><span className="text-gray-400">Source:</span> {lead.source}</p>
            <p><span className="text-gray-400">Category:</span> {lead.categoryId?.name || '-'}</p>
            <p><span className="text-gray-400">Assigned to:</span> {lead.assignedTo?.name || 'Unassigned'}</p>
            <p><span className="text-gray-400">Last contacted:</span> {formatDate(lead.lastContactedAt) || 'Never'}</p>
            {lead.address && (
              <p className="sm:col-span-2"><span className="text-gray-400">Address:</span> {lead.address}</p>
            )}
            <p className="flex items-center gap-1 flex-wrap">
              <CalendarClock size={14} className="text-gray-400" />
              <span className="text-gray-400">Next follow-up:</span> {followUpText}
            </p>
          </div>

          {customFieldEntries.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                {lead.categoryId?.name} details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {customFieldEntries.map(([key, value]) => (
                  <p key={key}>
                    <span className="text-gray-400">{key}:</span> {String(value)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title="Interaction Timeline">
          <Timeline interactions={interactions} />
        </Card>
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        {!isBde && (
          <Card title="Deal" actions={deal && <IndianRupee size={16} className="text-accent-500" />}>
            {isConverted ? (
              <>
                <p className="text-xs text-gray-400 mb-2">
                  Record what this customer actually signed up for - used for revenue tracking
                  once a lead becomes a paying client.
                </p>
                {deal && (
                  <p className="text-sm text-gray-500 mb-2">
                    Current: ₹{deal.value.toLocaleString('en-IN')} · {deal.paymentStatus}
                  </p>
                )}
                <DealForm leadId={lead._id} existingDeal={deal} onSubmit={handleSaveDeal} />
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Deal details become available once this lead's status is <strong>Converted</strong>.
                Log a call with outcome "Converted" below, or update the status manually first.
              </p>
            )}
          </Card>
        )}

        <Card title="Log a Call">
          <CallLogForm leadId={lead._id} onSubmit={handleLogCall} followUp={followUp} />
        </Card>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Lead">
        <LeadForm
          initialValues={editInitialValues}
          categories={categories}
          onSubmit={handleUpdateLead}
          onCancel={() => setEditOpen(false)}
          submitLabel="Save Changes"
        />
      </Modal>
    </div>
  );
}