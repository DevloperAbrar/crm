import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Merge } from 'lucide-react';
import { leadApi } from '../../lib/api/endpoints.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

export default function MergeDuplicatesModal({ open, onClose, onMerged }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = () => {
    setLoading(true);
    leadApi
      .findDuplicateGroups({ skipErrorToast: true })
      .then((res) => setGroups(res.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not scan for duplicates.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) fetchGroups();
  }, [open]);

  const handleMerge = async (keepId, mergeAwayId, keptName, mergedName) => {
    try {
      await leadApi.mergeDuplicates(keepId, mergeAwayId, { skipErrorToast: true });
      toast.success(`Merged "${mergedName}" into "${keptName}". Its call history was moved over.`);
      onMerged?.();
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to merge leads.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Merge Duplicate Leads">
      <p className="text-xs text-gray-400 mb-3">
        New CSV imports already block duplicates automatically by phone number or Google Place ID. This
        tool is for leftovers: leads imported before that check existed, or leads added manually that
        turned out to be the same business. For each group below, pick which lead to keep — its call
        history, notes and deal stay put — and the other lead's phone numbers, tags and interaction
        history get folded into it, then it's deleted.
      </p>

      {loading && <p className="text-sm text-gray-400">Scanning for duplicates...</p>}

      {!loading && groups.length === 0 && (
        <p className="text-sm text-gray-400">No duplicate phone numbers or Place IDs found. You're clean.</p>
      )}

      <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.key} className="border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">
              These {group.leads.length} leads share the same {String(group.key || '').startsWith('0x') ? 'Google Place ID' : 'phone number'}:
            </p>
            <div className="flex flex-col gap-2">
              {group.leads.map((lead) => (
                <div
                  key={lead._id}
                  className="flex items-center justify-between text-sm gap-2 bg-gray-50 rounded-md px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lead.businessName}</p>
                    <p className="text-xs text-gray-400">
                      {lead.cityName || 'No city'} · {lead.status}
                      {lead.phones?.length ? ` · ${lead.phones.join(', ')}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {group.leads
                      .filter((other) => other._id !== lead._id)
                      .map((other) => (
                        <Button
                          key={other._id}
                          variant="secondary"
                          className="text-xs px-2 py-1 flex items-center gap-1 whitespace-nowrap"
                          onClick={() => handleMerge(lead._id, other._id, lead.businessName, other.businessName)}
                          title={`Keep "${lead.businessName}", merge "${other.businessName}" into it and delete "${other.businessName}"`}
                        >
                          <Merge size={12} /> Keep this one
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
