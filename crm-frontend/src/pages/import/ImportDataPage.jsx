import React, { useState, useEffect } from 'react';
import { ShieldAlert, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { importApi, categoryApi, userApi } from '../../lib/api/endpoints.js';
import Uploader from '../../components/import/Uploader.jsx';
import ColumnMapper from '../../components/import/ColumnMapper.jsx';
import DupeReview from '../../components/import/DupeReview.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { useRole } from '../../hooks/useRole.js';
import { downloadImportTemplate } from '../../lib/utils/csvTemplate.js';

export default function ImportDataPage() {
  const { isFounder } = useRole();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [bdes, setBdes] = useState([]);
  const [defaultAssignee, setDefaultAssignee] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!isFounder) return;
    categoryApi.list().then((res) => setCategories(res.data.data)).catch(() => {});
    userApi
      .list()
      .then((res) => setBdes(res.data.data.filter((u) => u.role === 'bde')))
      .catch(() => {});
  }, [isFounder]);

  if (!isFounder) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <ShieldAlert className="mx-auto mb-3 text-gray-300" size={40} />
        <h2 className="font-semibold text-gray-700">Founder access only</h2>
        <p className="text-sm text-gray-400 mt-1">
          Importing bulk lead data is restricted to Founder accounts. Ask your Founder to import a
          batch and assign leads to your team.
        </p>
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c._id === categoryId) || null;

  const handleDownloadTemplate = () => {
    downloadImportTemplate(selectedCategory);
    toast.info('Template downloaded.');
  };

  // The category is no longer required up front - each row can carry its own
  // category in a "category" column. The default category (if chosen) is only
  // a fallback for blank cells / files without a category column.
  const handleFileSelected = async (selectedFile) => {
    if (!selectedFile) return;
    setError('');
    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await importApi.preview(formData, { skipErrorToast: true });
      setPreview(res.data.data);
      toast.success(`Found ${res.data.data.totalRows} row(s) in the file.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to preview file';
      setFile(null);
      setError(msg);
      toast.error(msg);
    }
  };

  const handleConfirmMapping = async (mapping) => {
    if (importing) return;
    setImporting(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('columnMapping', JSON.stringify(mapping));
    if (categoryId) formData.append('categoryId', categoryId);
    if (defaultAssignee) formData.append('defaultAssignee', defaultAssignee);
    try {
      const res = await importApi.commit(formData, { skipErrorToast: true });
      const data = res.data.data;
      setResult(data);
      const problems = (data.unmatchedRowCount || 0) + (data.failed?.length || 0);
      if (problems > 0) {
        toast.warn(`Imported ${data.inserted} lead(s). ${problems} row(s) need attention - see summary.`);
      } else {
        toast.success(`Imported ${data.inserted} lead(s) successfully.`);
      }
    } catch (err) {
      let msg;
      if (!err.response) {
        msg =
          'Could not get a response from the server (network error or timeout). Part of the file may already be imported - check the Leads page before retrying.';
      } else if ([502, 503, 504].includes(err.response.status)) {
        msg =
          'The server took too long to respond. Part of the file may already be imported - check the Leads page before retrying.';
      } else {
        msg = err.response?.data?.message || 'Import failed';
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const handleBackToUpload = () => {
    setFile(null);
    setPreview(null);
    setError('');
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <h1 className="text-xl font-bold">Import Leads</h1>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!preview && (
        <Card>
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700">
              Default category (optional)
            </label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full mt-1"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No default — use the category column in my file</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              If your file has a <span className="font-medium">category</span> column, every lead is
              filed under its own category automatically. The default is only used for rows with a
              blank category, or for files without that column.
            </p>
            {categories.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                No categories yet — create them under Settings → Category Builder first.
              </p>
            )}
          </div>

          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700">
              Assign every imported lead to (optional)
            </label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full mt-1"
              value={defaultAssignee}
              onChange={(e) => setDefaultAssignee(e.target.value)}
            >
              <option value="">Leave unassigned (assign later from Leads page)</option>
              {bdes.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Don't have a file ready?</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedCategory
                  ? `Download a template with the right headers${selectedCategory.customFields?.length ? ` including ${selectedCategory.name}'s custom fields` : ''}, plus one example row.`
                  : 'Download a starter template with the right headers (including a category column) and one example row.'}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download size={14} /> Download Template
            </Button>
          </div>

          <Uploader onFileSelected={handleFileSelected} />
        </Card>
      )}

      {preview && !result && (
        <Card title={`Preview (${preview.totalRows} rows detected)`}>
          <ColumnMapper
            columns={preview.columns}
            onConfirm={handleConfirmMapping}
            onCancel={handleBackToUpload}
            hasDefaultCategory={Boolean(categoryId)}
          />
          {importing && <p className="text-sm text-gray-500 mt-3">Importing, please wait…</p>}
        </Card>
      )}

      {result && (
        <>
          <DupeReview result={result} />
          <button onClick={handleReset} className="text-sm text-brand-500 font-medium self-start">
            Import another file
          </button>
        </>
      )}
    </div>
  );
}