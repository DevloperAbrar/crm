import React, { useState } from 'react';
import { FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { dashboardApi } from '../../lib/api/endpoints.js';
import { exportAndDownload } from '../../lib/utils/exportHelpers.js';
import StateCitySelect from '../../components/ui/StateCitySelect.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

const STATUSES = [
  'New', 'Attempted Contact', 'Contacted', 'Interested',
  'Demo/Visit Scheduled', 'Visited', 'Negotiation', 'Converted', 'Lost',
];

export default function ReportsPage() {
  const [filters, setFilters] = useState({ stateCode: '', cityName: '', status: '' });
  const [loadingFormat, setLoadingFormat] = useState(null);
  const [message, setMessage] = useState(null);

  const handleLocationChange = ({ stateCode, cityName }) =>
    setFilters((prev) => ({ ...prev, stateCode, cityName }));

  const handleExport = async (format) => {
    setMessage(null);
    setLoadingFormat(format);

    const result = await exportAndDownload(
      () =>
        dashboardApi.exportReport(
          {
            state: filters.stateCode,
            city: filters.cityName,
            status: filters.status,
            format,
          },
          { skipErrorToast: true } // blob error bodies don't carry a clean .message; exportAndDownload handles its own error text via `message` below
        ),
      `leads-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    );

    setLoadingFormat(null);
    if (result.success) {
      toast.success(`${format === 'pdf' ? 'PDF' : 'Excel'} report downloaded.`);
    } else {
      setMessage(result.message);
      toast.error(result.message || 'Export failed.');
    }
  };

  return (
    <div className="max-w-xl flex flex-col gap-4">
      <h1 className="text-xl font-bold">Reports</h1>
      <Card title="Export Filtered Report">
        <div className="flex flex-col gap-3">
          <StateCitySelect
            stateCode={filters.stateCode}
            cityName={filters.cityName}
            onChange={handleLocationChange}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <div className="flex items-start gap-2 bg-amber-50 text-amber-700 text-sm rounded-lg px-3 py-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('excel')}
              disabled={loadingFormat === 'excel'}
              className="flex items-center gap-1.5"
            >
              <FileSpreadsheet size={16} />
              {loadingFormat === 'excel' ? 'Exporting...' : 'Export Excel'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('pdf')}
              disabled={loadingFormat === 'pdf'}
              className="flex items-center gap-1.5"
            >
              <FileText size={16} />
              {loadingFormat === 'pdf' ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>

          <p className="text-xs text-gray-400">
            Team Leads only export leads belonging to their own BDEs. Leave filters blank to export
            everything within your scope.
          </p>
        </div>
      </Card>
    </div>
  );
}