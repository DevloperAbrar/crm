import React, { useState, useMemo } from 'react';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import StateCitySelect from '../ui/StateCitySelect.jsx';
import DynamicFieldInput from './DynamicFieldInput.jsx';

export default function LeadForm({
  initialValues = {},
  categories = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save Lead',
}) {
  const [form, setForm] = useState({
    businessName: '',
    categoryId: '',
    stateCode: '',
    cityName: '',
    address: '',
    email: '',
    website: '',
    phones: '',
    customFieldValues: {},
    ...initialValues,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === form.categoryId),
    [categories, form.categoryId]
  );

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleLocationChange = ({ stateCode, cityName }) =>
    setForm((prev) => ({ ...prev, stateCode, cityName }));

  const handleCustomFieldChange = (fieldName, value) =>
    setForm((prev) => ({
      ...prev,
      customFieldValues: { ...prev.customFieldValues, [fieldName]: value },
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        businessName: form.businessName.trim(),
        categoryId: form.categoryId,
        stateCode: form.stateCode,
        cityName: form.cityName,
        address: form.address,
        email: form.email.trim(),
        website: form.website.trim(),
        phones: form.phones
          ? form.phones.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
        customFieldValues: form.customFieldValues,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input label="Business Name" value={form.businessName} onChange={handleChange('businessName')} required />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Category</label>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={form.categoryId}
          onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value, customFieldValues: {} }))}
          required
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic per-category fields (Section 4.1) */}
      {selectedCategory?.customFields?.length > 0 && (
        <div className="border border-dashed border-gray-200 rounded-lg p-3 flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {selectedCategory.name} details
          </p>
          {selectedCategory.customFields.map((field) => (
            <div key={field.fieldName} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {field.fieldName}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              <DynamicFieldInput
                field={field}
                value={form.customFieldValues[field.fieldName]}
                onChange={(v) => handleCustomFieldChange(field.fieldName, v)}
              />
            </div>
          ))}
        </div>
      )}

      <StateCitySelect stateCode={form.stateCode} cityName={form.cityName} onChange={handleLocationChange} />

      <Input label="Address (optional)" value={form.address} onChange={handleChange('address')} />
      <Input label="Phone(s), comma separated" value={form.phones} onChange={handleChange('phones')} />
      <Input label="Email (optional)" type="email" value={form.email} onChange={handleChange('email')} />
      <Input label="Website (optional)" value={form.website} onChange={handleChange('website')} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}