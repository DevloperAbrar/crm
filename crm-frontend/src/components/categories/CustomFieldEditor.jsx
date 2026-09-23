import React from 'react';
import Button from '../ui/Button.jsx';

const FIELD_TYPES = ['text', 'number', 'date', 'dropdown'];

export default function CustomFieldEditor({ fields, onChange }) {
  const addField = () => {
    onChange([...fields, { fieldName: '', fieldType: 'text', required: false, options: [] }]);
  };

  const updateField = (idx, patch) => {
    const next = [...fields];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeField = (idx) => {
    onChange(fields.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">Custom Fields</label>
      <div className="flex flex-col gap-2 mt-2">
        {fields.map((field, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm flex-1"
              placeholder="Field name (e.g. Capacity)"
              value={field.fieldName}
              onChange={(e) => updateField(idx, { fieldName: e.target.value })}
            />
            <select
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
              value={field.fieldType}
              onChange={(e) => updateField(idx, { fieldType: e.target.value })}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(idx, { required: e.target.checked })}
              />
              Required
            </label>
            <button type="button" onClick={() => removeField(idx)} className="text-red-500 text-xs">
              Remove
            </button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" className="mt-2" onClick={addField}>
        + Add Field
      </Button>
    </div>
  );
}
