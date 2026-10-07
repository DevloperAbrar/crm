import React, { useState, useMemo } from 'react';
import { CheckCircle2, Tags } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../ui/Button.jsx';

const TARGET_FIELDS = [
  'businessName', 'category', 'stateCode', 'cityName', 'address', 'lat', 'lng',
  'phone', 'email', 'website', 'mapsRating', 'mapsReviewCount', 'placeId',
];

function buildAutoMapping(columns) {
  const lowerToTarget = Object.fromEntries(TARGET_FIELDS.map((f) => [f.toLowerCase(), f]));
  const synonyms = {
    name: 'businessName', business: 'businessName', company: 'businessName',
    city: 'cityName', state: 'stateCode', latitude: 'lat', longitude: 'lng',
    phonenumber: 'phone', mobile: 'phone', contact: 'phone', rating: 'mapsRating',
    reviews: 'mapsReviewCount', reviewcount: 'mapsReviewCount', place_id: 'placeId',
    categoryname: 'category', businesscategory: 'category', businesstype: 'category',
  };

  const initial = {};
  columns.forEach((col) => {
    const exact = TARGET_FIELDS.includes(col) ? col : null;
    const lower = col.toLowerCase().replace(/[\s_-]/g, '');
    const caseInsensitive = lowerToTarget[col.toLowerCase()];
    const synonymMatch = synonyms[lower];
    initial[col] = exact || caseInsensitive || synonymMatch || '';
  });
  return initial;
}

export default function ColumnMapper({
  columns = [],
  onConfirm,
  onCancel,
  hasDefaultCategory = false,
}) {
  const [mapping, setMapping] = useState(() => buildAutoMapping(columns));

  const matchedCount = useMemo(() => Object.values(mapping).filter(Boolean).length, [mapping]);
  const hasCategoryColumn = useMemo(() => Object.values(mapping).includes('category'), [mapping]);

  const handleChange = (column) => (e) => {
    setMapping((prev) => ({ ...prev, [column]: e.target.value }));
  };

  const handleConfirm = () => {
    if (!mapping || !Object.values(mapping).includes('businessName')) {
      toast.error('Please map a column to "businessName" before importing.');
      return;
    }
    if (!hasCategoryColumn && !hasDefaultCategory) {
      toast.error(
        'Map a column to "category", or go back and choose a default category for these leads.'
      );
      return;
    }
    onConfirm(mapping);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">Map each source column to a CRM field:</p>
        {matchedCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 size={14} />
            {matchedCount} auto-matched
          </span>
        )}
      </div>

      {hasCategoryColumn ? (
        <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
          <Tags size={14} className="mt-0.5 shrink-0" />
          <span>
            Each lead will be filed under the category in its own row.
            {hasDefaultCategory ? ' Rows with a blank category use your default category.' : ' Rows with a blank category will be reported, not imported.'}
          </span>
        </div>
      ) : (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          No category column mapped
          {hasDefaultCategory
            ? ' — every lead will be filed under your default category.'
            : ' — map one below, or go back and choose a default category.'}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {columns.map((col) => {
          const isAutoMatched = Boolean(mapping[col]);
          return (
            <div key={col} className="flex items-center gap-3">
              <span className="w-40 text-sm font-medium truncate" title={col}>
                {col}
              </span>
              <select
                className={`border rounded-lg px-2 py-1 text-sm flex-1 ${
                  isAutoMatched ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                value={mapping[col] || ''}
                onChange={handleChange(col)}
              >
                <option value="">Ignore</option>
                {TARGET_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Button onClick={handleConfirm}>Confirm Mapping &amp; Import</Button>
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-gray-500 font-medium">
            Back
          </button>
        )}
      </div>
    </div>
  );
}