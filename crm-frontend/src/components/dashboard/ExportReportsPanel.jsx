import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../ui/Card.jsx';
import StateCitySelect from '../ui/StateCitySelect.jsx';
import { dashboardApi } from '../../lib/api/endpoints.js';
import { exportAndDownload } from '../../lib/utils/exportHelpers.js';

export default function ExportReportsPanel({ agents = [] }) {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    stateCode: '',
    cityName: '',
    status: '',
    assignedTo: '',
  });
  const [loadingFormat, setLoadingFormat] = useState(null);
  const [message, setMessage] = useState(null);

  const handleChange = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  const handleExport = async (format) => {
    setLoadingFormat(format);
    setMessage(null);

    const { stateCode, cityName, ...rest } = filters;
    const params = Object.fromEntries(
      Object.entries({ ...rest, state: stateCode, city: cityName }).filter(([, v]) => v)
    );
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    const filename = `campussafar-report-${new Date().toISOString().slice(0, 10)}.${ext}`;

    const result = await exportAndDownload(
      () => dashboardApi.exportReport({ ...params, format }, { skipErrorToast: true }),
      filename
    );

    setLoadingFormat(null);
    if (result.success) {
      setMessage({ type: 'success', text: 'Report downloaded' });
      toast.success(`${format === 'pdf' ? 'PDF' : 'Excel'} report downloaded.`);
    } else {
      setMessage({ type: 'error', text: result.message });
      toast.error(result.message || 'Export failed.');
    }
  };

  return (
    <Card title="Export Reports">
      <div className="mb-4">
        <label className="text-xs text-gray-500 mb-1 block">Location</label>
        <StateCitySelect
          stateCode={filters.stateCode}
          cityName={filters.cityName}
          onChange={({ stateCode, cityName }) => setFilters((f) => ({ ...f, stateCode, cityName }))}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">From</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={handleChange('startDate')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">To</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={handleChange('endDate')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select
            value={filters.status}
            onChange={handleChange('status')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
          >
            <option value="">Any</option>
            {['New', 'Attempted Contact', 'Contacted', 'Interested', 'Demo/Visit Scheduled', 'Visited', 'Negotiation', 'Converted', 'Lost'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
        </div>
        {agents.length > 0 && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Agent</label>
            <select
              value={filters.assignedTo}
              onChange={handleChange('assignedTo')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
            >
              <option value="">All agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleExport('excel')}
          disabled={loadingFormat !== null}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loadingFormat === 'excel' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
          Export Excel
        </button>
        <button
          onClick={() => handleExport('pdf')}
          disabled={loadingFormat !== null}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
        >
          {loadingFormat === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          Export PDF
        </button>
        {message && (
          <span className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {message.text}
          </span>
        )}
      </div>
    </Card>
  );
}