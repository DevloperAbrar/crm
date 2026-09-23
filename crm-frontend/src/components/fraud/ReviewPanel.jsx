import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../ui/Button.jsx';
import FraudFlagCard from './FraudFlagCard.jsx';
import { groupImpact } from '../../lib/utils/fraudHelpers.js';

// mode 'open': pending queue with both verdict buttons.
// mode 'history': already reviewed, with one button to change the verdict.
export default function ReviewPanel({ groups = [], mode = 'open', onReview }) {
  const [notes, setNotes] = useState({});
  const [busyKey, setBusyKey] = useState(null);

  const submit = async (group, decision) => {
    if (decision === 'fraudulent') {
      const ok = window.confirm(
        `Mark ${group.flags.length} flag(s) as fraudulent? This lowers ${group.user?.name}'s trust score by ${groupImpact(group)} point(s).`
      );
      if (!ok) {
        toast.info('Review cancelled.');
        return;
      }
    }

    setBusyKey(group.key);
    try {
      await onReview(group.flags.map((f) => f._id), decision, notes[group.key]);
      setNotes((prev) => {
        const next = { ...prev };
        delete next[group.key];
        return next;
      });
    } finally {
      setBusyKey(null);
    }
  };

  if (groups.length === 0) {
    return (
      <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl p-6 text-center">
        {mode === 'open' ? 'No pending flags. All clear.' : 'Nothing here yet.'}
      </p>
    );
  }

  return (
    <div>
      {groups.map((group) => {
        const busy = busyKey === group.key;
        const currentlyFraud = group.flags[0].status === 'reviewed_fraudulent';

        return (
          <FraudFlagCard key={group.key} group={group}>
            <textarea
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-full mt-3"
              rows={2}
              placeholder={mode === 'open' ? 'Review notes (optional)' : 'Add a note about the change (optional)'}
              value={notes[group.key] || ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [group.key]: e.target.value }))}
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {mode === 'open' ? (
                <>
                  <Button variant="secondary" disabled={busy} onClick={() => submit(group, 'genuine')}>
                    Mark Genuine
                  </Button>
                  <Button variant="danger" disabled={busy} onClick={() => submit(group, 'fraudulent')}>
                    Mark Fraudulent
                  </Button>
                </>
              ) : currentlyFraud ? (
                <Button variant="secondary" disabled={busy} onClick={() => submit(group, 'genuine')}>
                  Change to Genuine
                </Button>
              ) : (
                <Button variant="danger" disabled={busy} onClick={() => submit(group, 'fraudulent')}>
                  Change to Fraudulent
                </Button>
              )}
            </div>
          </FraudFlagCard>
        );
      })}
    </div>
  );
}