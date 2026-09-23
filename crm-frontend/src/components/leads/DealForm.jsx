import React, { useState } from 'react';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';

export default function DealForm({ leadId, existingDeal, onSubmit }) {
  const [serviceType, setServiceType] = useState(existingDeal?.serviceType || '');
  const [value, setValue] = useState(existingDeal?.value || '');
  const [onboardedDate, setOnboardedDate] = useState(
    existingDeal?.onboardedDate ? existingDeal.onboardedDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [paymentStatus, setPaymentStatus] = useState(existingDeal?.paymentStatus || 'pending');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // onSubmit (LeadProfilePage.handleSaveDeal) handles both the success
      // and error toasts, since it knows whether this was a create or update.
      await onSubmit({ leadId, serviceType, value: Number(value), onboardedDate, paymentStatus });
    } catch {
      // Error already toasted by the parent - just stop the spinner and
      // keep the form's values so the user can retry.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input label="Service Type" value={serviceType} onChange={(e) => setServiceType(e.target.value)} required />
      <Input
        label="Deal Value (₹)"
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
      />
      <Input
        label="Onboarded Date"
        type="date"
        value={onboardedDate}
        onChange={(e) => setOnboardedDate(e.target.value)}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Payment Status</label>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : existingDeal ? 'Update Deal' : 'Save Deal'}
      </Button>
    </form>
  );
}