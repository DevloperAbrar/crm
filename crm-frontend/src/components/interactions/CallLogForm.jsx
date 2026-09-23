import React, { useState, useRef } from 'react';
import { CalendarCheck, Flag, Paperclip, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../ui/Button.jsx';
import { formatDate } from '../../lib/utils/dateHelpers.js';

const OUTCOMES = [
  'Interested',
  'Not Interested',
  'Call Back Later',
  'No Response',
  'Already Using Competitor',
  'Demo Booked',
  'Converted',
];

const CLOSING_OUTCOMES = ['Converted', 'Not Interested'];

// Must match the server's multer config
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

// Local (not UTC) YYYY-MM-DD, so the "today" limit is right in any timezone
function todayLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function CallLogForm({ leadId, onSubmit, followUp }) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual'
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const openedAt = useRef(Date.now());
  const fileInputRef = useRef(null);

  const isClosing = CLOSING_OUTCOMES.includes(outcome);

  const handleFileSelect = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = '';

    const accepted = [];
    for (const f of picked) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" isn't allowed. Only images and PDFs can be attached.`);
      } else if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" is larger than 10 MB.`);
      } else {
        accepted.push(f);
      }
    }

    setFiles((prev) => {
      const combined = [...prev, ...accepted];
      if (combined.length > MAX_FILES) {
        toast.error(`You can attach at most ${MAX_FILES} files.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isClosing && mode === 'manual') {
      if (!nextFollowUpDate) {
        toast.error('Please pick a follow-up date.');
        return;
      }
      if (nextFollowUpDate < todayLocal()) {
        toast.error('Follow-up date cannot be in the past.');
        return;
      }
    }

    const secondsOnScreen = Math.round((Date.now() - openedAt.current) / 1000);
    setSubmitting(true);
    try {
      await onSubmit(
        {
          leadId,
          type: 'call',
          outcome,
          notes,
          nextFollowUpDate: !isClosing && mode === 'manual' ? nextFollowUpDate : undefined,
          secondsOnScreen,
        },
        files
      );
      // Only clear the form after a successful save
      setOutcome('');
      setNotes('');
      setMode('auto');
      setNextFollowUpDate('');
      setFiles([]);
    } catch {
      // The parent already showed the error toast. Keep the typed data and
      // the files so the user can fix the problem and try again.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        required
      >
        <option value="">Select outcome</option>
        {OUTCOMES.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <textarea
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        rows={3}
        placeholder="What was discussed?"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {isClosing ? (
        <p className="flex items-start gap-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
          <Flag size={13} className="mt-0.5 flex-shrink-0" />
          This outcome closes the lead, so no further follow-up will be scheduled.
        </p>
      ) : (
        <div>
          <label className="text-xs text-gray-500">Next follow-up</label>
          <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
            {[
              ['auto', 'Automatic'],
              ['manual', 'Pick a date'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  mode === value ? 'bg-white text-brand-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'auto' ? (
            followUp && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-600 bg-brand-50 rounded-lg px-2 py-1.5">
                <CalendarCheck size={13} className="mt-0.5 flex-shrink-0" />
                {followUp.willClose ? (
                  <span>
                    This is the last step of the follow-up sequence. Logging it will{' '}
                    <strong>close this lead as Lost</strong> unless you pick a date instead.
                  </span>
                ) : (
                  <span>
                    Next follow-up will be set automatically to{' '}
                    <strong>{formatDate(followUp.nextAutoDate)}</strong>.
                  </span>
                )}
              </p>
            )
          ) : (
            <input
              type="date"
              min={todayLocal()}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full mt-2"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              required
            />
          )}
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-500"
        >
          <Paperclip size={13} /> Attach visiting card / pricing PDF
        </button>
        <p className="text-[11px] text-gray-400 mt-1">Images or PDF, up to 5 files, 10 MB each.</p>
        {files.length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs">
                <span className="truncate">{f.name}</span>
                <button type="button" onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 ml-2">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Logging...' : 'Log Call'}
      </Button>
    </form>
  );
}