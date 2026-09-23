import React, { useState, useRef } from 'react';
import { AlertTriangle, Paperclip, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../ui/Button.jsx';

const OUTCOMES = ['Interested', 'Not Interested', 'Demo Booked', 'Converted'];
const CLOSING_OUTCOMES = ['Converted', 'Not Interested'];

export default function VisitLogForm({ leadId, type = 'visit', onSubmit }) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const openedAt = useRef(Date.now());
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!outcome) {
      toast.error('Please select an outcome.');
      return;
    }
    const secondsOnScreen = Math.round((Date.now() - openedAt.current) / 1000);
    setSubmitting(true);
    try {
      await onSubmit({ leadId, type, outcome, notes, nextFollowUpDate, secondsOnScreen }, files);
      toast.success(`${type === 'demo' ? 'Demo' : 'Visit'} logged successfully.`);
      setOutcome('');
      setNotes('');
      setNextFollowUpDate('');
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not log the ${type}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const showFollowUpWarning = outcome && !CLOSING_OUTCOMES.includes(outcome) && !nextFollowUpDate;

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
        placeholder="Visit / demo notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div>
        <label className="text-xs text-gray-500">Next follow-up date</label>
        <input
          type="date"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full mt-1"
          value={nextFollowUpDate}
          onChange={(e) => setNextFollowUpDate(e.target.value)}
        />
      </div>

      {showFollowUpWarning && (
        <p className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
          No follow-up date set - this lead stays on its current calendar date until you set one.
        </p>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
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
        {submitting ? 'Saving...' : `Log ${type === 'demo' ? 'Demo' : 'Visit'}`}
      </Button>
    </form>
  );
}