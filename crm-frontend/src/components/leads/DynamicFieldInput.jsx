import React from 'react';

/**
 * Renders one input for a single Category custom field definition
 * (Section 4.1: "'Venue Owner' category can carry a 'Capacity' number
 * field, while 'Photographer' does not need it"). This is what makes the
 * category-agnostic data model actually usable - previously
 * customFieldValues existed on the schema but the form never rendered
 * inputs for it.
 */
export default function DynamicFieldInput({ field, value, onChange }) {
  const commonProps = {
    className: 'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full',
    required: field.required,
  };

  if (field.fieldType === 'dropdown') {
    return (
      <select {...commonProps} value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select {field.fieldName}</option>
        {(field.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.fieldType === 'number') {
    return (
      <input
        {...commonProps}
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    );
  }

  if (field.fieldType === 'date') {
    return <input {...commonProps} type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  }

  return <input {...commonProps} type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
}
