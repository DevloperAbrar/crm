import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Tags } from 'lucide-react';
import Card from '../ui/Card.jsx';

export default function DupeReview({ result }) {
  if (!result) return null;

  const {
    totalRows,
    inserted,
    skipped = [],
    flagged = [],
    failed = [],
    invalidPhones = [],
    byCategory = [],
    unmatchedCategories = [],
    unmatchedRowCount = 0,
    batchId,
  } = result;

  return (
    <div className="flex flex-col gap-4">
      <Card title="Import Summary">
        <div className="flex flex-col gap-1.5 text-sm">
          <p>Total rows in file: {totalRows}</p>
          <p className="flex items-center gap-1.5 text-green-600">
            <CheckCircle2 size={15} /> Imported: {inserted}
          </p>
          {skipped.length > 0 && (
            <p className="flex items-center gap-1.5 text-red-500">
              <XCircle size={15} /> Skipped as duplicates: {skipped.length}
            </p>
          )}
          {unmatchedRowCount > 0 && (
            <p className="flex items-center gap-1.5 text-red-500">
              <XCircle size={15} /> Not imported — category not found: {unmatchedRowCount}
            </p>
          )}
          {failed.length > 0 && (
            <p className="flex items-center gap-1.5 text-red-500">
              <XCircle size={15} /> Failed rows: {failed.length}
            </p>
          )}
          {flagged.length > 0 && (
            <p className="flex items-center gap-1.5 text-amber-600">
              <AlertTriangle size={15} /> Imported but flagged as possible duplicates: {flagged.length}
            </p>
          )}
          {invalidPhones.length > 0 && (
            <p className="flex items-center gap-1.5 text-amber-600">
              <AlertTriangle size={15} /> Invalid phone numbers ignored: {invalidPhones.length}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">Batch ID: {batchId} (use this to undo the import)</p>
      </Card>

      {byCategory.length > 0 && (
        <Card title="Leads imported per category">
          <div className="flex flex-col gap-1.5 text-sm">
            {byCategory.map((c) => (
              <div key={c.categoryId} className="flex items-center justify-between border-b border-gray-50 pb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Tags size={14} className="text-gray-400" /> {c.name}
                </span>
                <span className="text-gray-600">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {unmatchedCategories.length > 0 && (
        <Card title="Categories not found (rows not imported)">
          <p className="text-xs text-gray-400 mb-2">
            These category names in your file don't match any active category. Create them under
            Settings → Category Builder (or fix the spelling in your file), then import the same file
            again — leads that were already imported are skipped automatically.
          </p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto text-sm">
            {unmatchedCategories.map((c) => (
              <div key={c.name} className="border-b border-gray-50 pb-1.5">
                <span className="font-medium">"{c.name}"</span>{' '}
                <span className="text-gray-400">
                  — {c.count} row(s), e.g. row {c.rows.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {failed.length > 0 && (
        <Card title="Failed rows">
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto text-sm">
            {failed.map((f) => (
              <div key={f.row} className="border-b border-gray-50 pb-1.5">
                <span className="font-medium">Row {f.row}: {f.businessName || 'Untitled'}</span>{' '}
                <span className="text-gray-400">— {f.reason}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {invalidPhones.length > 0 && (
        <Card title="Invalid phone numbers (ignored)">
          <p className="text-xs text-gray-400 mb-2">
            These phone values were saved by Excel in scientific notation (like 9.19826E+11), which
            destroys the real digits. The leads were imported without a phone number. To avoid this,
            format the phone column as Text in Excel before saving the CSV.
          </p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto text-sm">
            {invalidPhones.map((p) => (
              <div key={p.row} className="border-b border-gray-50 pb-1.5">
                <span className="font-medium">Row {p.row}: {p.businessName || 'Untitled'}</span>{' '}
                <span className="text-gray-400">— "{p.value}"</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {skipped.length > 0 && (
        <Card title="Skipped rows (already in your CRM)">
          <p className="text-xs text-gray-400 mb-2">
            These rows matched an existing lead by phone number or Google Place ID, so they were not
            imported again.
          </p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto text-sm">
            {skipped.map((s) => (
              <div key={s.row} className="border-b border-gray-50 pb-1.5">
                <span className="font-medium">Row {s.row}: {s.businessName || 'Untitled'}</span>{' '}
                <span className="text-gray-400">
                  — matches existing lead "{s.matchedLeadName}" by {s.matchedOn === 'phone' ? 'phone number' : 'Place ID'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {flagged.length > 0 && (
        <Card title="Possible duplicates (imported anyway)">
          <p className="text-xs text-gray-400 mb-2">
            These rows had no phone number or Place ID to check confidently, but the business name and
            city matched an existing lead. They were imported so you don't lose data, and tagged{' '}
            <span className="font-medium">possible_duplicate</span>. Check the Leads page and use
            "Merge Duplicates" if they turn out to be the same business.
          </p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto text-sm">
            {flagged.map((f) => (
              <div key={f.row} className="border-b border-gray-50 pb-1.5">
                <span className="font-medium">Row {f.row}: {f.businessName || 'Untitled'}</span>{' '}
                <span className="text-gray-400">— looks similar to "{f.possibleMatchName}"</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}