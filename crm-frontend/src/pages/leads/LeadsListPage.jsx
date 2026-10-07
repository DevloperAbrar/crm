import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users, ListChecks, X, Tag, GitMerge, SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { leadApi, categoryApi, userApi } from '../../lib/api/endpoints.js';
import LeadTable from '../../components/leads/LeadTable.jsx';
import LeadForm from '../../components/leads/LeadForm.jsx';
import MergeDuplicatesModal from '../../components/leads/MergeDuplicatesModal.jsx';
import StateCitySelect from '../../components/ui/StateCitySelect.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useRole } from '../../hooks/useRole.js';

const STATUSES = [
  'New', 'Attempted Contact', 'Contacted', 'Interested',
  'Demo/Visit Scheduled', 'Visited', 'Negotiation', 'Converted', 'Lost',
];

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500];

const EMPTY_ADVANCED = {
  phone: '', dateFrom: '', dateTo: '', minRating: '', maxRating: '',
  stateCode: '', cityName: '', categoryId: '', status: '', assignedTo: '', tag: '',
};

export default function LeadsListPage() {
  const { isFounder, isTeamLead, isBde } = useRole();
  const canAssign = isFounder || isTeamLead;
  const canSeeUnassigned = isFounder;

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [bdes, setBdes] = useState([]);
  const [search, setSearch] = useState('');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advanced, setAdvanced] = useState(EMPTY_ADVANCED);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectingAll, setSelectingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkTag, setBulkTag] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const debouncedSearch = useDebounce(search);
  const debouncedAdvanced = useDebounce(advanced, 500);

  // Filter params shared by the paged list and the "select all matching" call,
  // so both always describe exactly the same set of leads.
  const filterParams = useMemo(
    () => ({
      search: debouncedSearch,
      unassigned: showUnassignedOnly && canSeeUnassigned ? 'true' : undefined,
      phone: debouncedAdvanced.phone || undefined,
      dateFrom: debouncedAdvanced.dateFrom || undefined,
      dateTo: debouncedAdvanced.dateTo || undefined,
      minRating: debouncedAdvanced.minRating || undefined,
      maxRating: debouncedAdvanced.maxRating || undefined,
      state: debouncedAdvanced.stateCode || undefined,
      city: debouncedAdvanced.cityName || undefined,
      categoryId: debouncedAdvanced.categoryId || undefined,
      status: debouncedAdvanced.status || undefined,
      assignedTo: debouncedAdvanced.assignedTo || undefined,
      tag: debouncedAdvanced.tag || undefined,
    }),
    [debouncedSearch, showUnassignedOnly, canSeeUnassigned, debouncedAdvanced]
  );

  const fetchLeads = useCallback(() => {
    leadApi
      .list({ ...filterParams, page, limit: pageSize }, { skipErrorToast: true })
      .then((res) => {
        setLeads(res.data.data.leads);
        setTotal(res.data.data.total);
        setUnassignedCount(res.data.data.unassignedCount);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load leads.'));
  }, [filterParams, page, pageSize]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    setPage(1);
    // Filters/search changed: drop the old selection so a bulk action can
    // never hit leads that are no longer visible.
    setSelectedIds([]);
  }, [debouncedSearch, showUnassignedOnly, debouncedAdvanced]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data.data)).catch(() => {});
    if (canAssign) {
      userApi
        .list()
        .then((res) => setBdes(res.data.data.filter((u) => u.role === 'bde')))
        .catch(() => {});
    }
  }, [canAssign]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => setSelectedIds([]);

  // Header "select all" checkbox: ticks / unticks every lead on the CURRENT
  // page. Selections made on other pages are kept.
  const toggleSelectAllOnPage = (shouldSelect) => {
    const pageIds = leads.map((l) => l._id);
    setSelectedIds((prev) =>
      shouldSelect
        ? Array.from(new Set([...prev, ...pageIds]))
        : prev.filter((id) => !pageIds.includes(id))
    );
  };

  // Gmail-style "select all N leads": fetches the ids of EVERY lead matching
  // the current filters (not just this page) and selects them.
  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const res = await leadApi.ids(filterParams, { skipErrorToast: true });
      setSelectedIds(res.data.data.ids);
      toast.success(`${res.data.data.ids.length} lead(s) selected.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not select all leads.');
    } finally {
      setSelectingAll(false);
    }
  };

  const handleCreateLead = async (payload) => {
    try {
      await leadApi.create(payload, { skipErrorToast: true });
      toast.success('Lead added successfully.');
      setModalOpen(false);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add lead.');
    }
  };

  const runBulkAction = async (action, successMessage) => {
    setActionLoading(true);
    try {
      await action();
      toast.success(successMessage);
      clearSelection();
      setBulkAssignee('');
      setBulkStatus('');
      setBulkTag('');
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const advancedActive = Object.values(advanced).some(Boolean);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const pageIds = leads.map((l) => l._id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const everythingSelected = total > 0 && selectedIds.length >= total;
  const showSelectAllBanner =
    canAssign && allOnPageSelected && total > pageIds.length && !everythingSelected;

  return (
    <div>
      <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} total
            {canSeeUnassigned && unassignedCount > 0 && (
              <span className="text-accent-600 font-medium"> · {unassignedCount} unassigned</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap w-full sm:w-auto">
          <input
            placeholder="Search business name..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 sm:flex-none min-w-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              advancedActive || showAdvanced
                ? 'bg-brand-50 text-brand-500 border-brand-100'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
          {canSeeUnassigned && (
            <button
              onClick={() => setShowUnassignedOnly((v) => !v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
                showUnassignedOnly
                  ? 'bg-accent-500 text-white border-accent-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Unassigned only
            </button>
          )}
          {canAssign && (
            <Button variant="secondary" onClick={() => setMergeModalOpen(true)} className="flex items-center gap-1.5 whitespace-nowrap">
              <GitMerge size={16} /> Merge Duplicates
            </Button>
          )}
          <Button onClick={() => setModalOpen(true)} className="whitespace-nowrap">+ Add Lead</Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Location</label>
            <StateCitySelect
              stateCode={advanced.stateCode}
              cityName={advanced.cityName}
              onChange={({ stateCode, cityName }) =>
                setAdvanced((p) => ({ ...p, stateCode, cityName }))
              }
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                value={advanced.categoryId}
                onChange={(e) => setAdvanced((p) => ({ ...p, categoryId: e.target.value }))}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Status</label>
              <select
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                value={advanced.status}
                onChange={(e) => setAdvanced((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {canAssign && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Assigned to</label>
                <select
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                  value={advanced.assignedTo}
                  onChange={(e) => setAdvanced((p) => ({ ...p, assignedTo: e.target.value }))}
                >
                  <option value="">All agents</option>
                  {bdes.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tag</label>
              <input
                placeholder="e.g. VIP"
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                value={advanced.tag}
                onChange={(e) => setAdvanced((p) => ({ ...p, tag: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <input
              placeholder="Phone number"
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm col-span-2 sm:col-span-1"
              value={advanced.phone}
              onChange={(e) => setAdvanced((p) => ({ ...p, phone: e.target.value }))}
            />
            <div>
              <label className="text-xs text-gray-400">Added from</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                value={advanced.dateFrom}
                onChange={(e) => setAdvanced((p) => ({ ...p, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Added to</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                value={advanced.dateTo}
                onChange={(e) => setAdvanced((p) => ({ ...p, dateTo: e.target.value }))}
              />
            </div>
            <input
              placeholder="Min rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              value={advanced.minRating}
              onChange={(e) => setAdvanced((p) => ({ ...p, minRating: e.target.value }))}
            />
            <input
              placeholder="Max rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              value={advanced.maxRating}
              onChange={(e) => setAdvanced((p) => ({ ...p, maxRating: e.target.value }))}
            />
          </div>

          {advancedActive && (
            <button
              onClick={() => setAdvanced(EMPTY_ADVANCED)}
              className="text-xs text-gray-400 hover:text-gray-600 text-left"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {canAssign && selectedIds.length > 0 && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-brand-500 flex items-center gap-1">
            <ListChecks size={16} /> {selectedIds.length} selected
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <Users size={15} className="text-gray-400" />
            <select
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              value={bulkAssignee}
              onChange={(e) => setBulkAssignee(e.target.value)}
            >
              <option value="">Assign to BDE...</option>
              {bdes.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() =>
                runBulkAction(
                  () => leadApi.bulkAssign(selectedIds, bulkAssignee, { skipErrorToast: true }),
                  `${selectedIds.length} lead(s) assigned.`
                )
              }
              disabled={!bulkAssignee || actionLoading}
            >
              Assign
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="">Set status...</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() =>
                runBulkAction(
                  () => leadApi.bulkStatus(selectedIds, bulkStatus, { skipErrorToast: true }),
                  `${selectedIds.length} lead(s) updated to "${bulkStatus}".`
                )
              }
              disabled={!bulkStatus || actionLoading}
            >
              Update
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={15} className="text-gray-400" />
            <input
              placeholder="Add tag..."
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-28"
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={() =>
                runBulkAction(
                  () => leadApi.bulkTag(selectedIds, bulkTag, { skipErrorToast: true }),
                  `Tag "${bulkTag}" added to ${selectedIds.length} lead(s).`
                )
              }
              disabled={!bulkTag || actionLoading}
            >
              Tag
            </Button>
          </div>

          <button onClick={clearSelection} className="text-gray-400 hover:text-gray-600 ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {showSelectAllBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-amber-800 flex items-center gap-2 flex-wrap">
          <span>All {pageIds.length} leads on this page are selected.</span>
          <button
            onClick={selectAllMatching}
            disabled={selectingAll}
            className="font-semibold underline disabled:opacity-50"
          >
            {selectingAll ? 'Selecting...' : `Select all ${total} leads`}
          </button>
        </div>
      )}
      {canAssign && everythingSelected && total > pageIds.length && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-green-800 flex items-center gap-2 flex-wrap">
          <span>All {selectedIds.length} matching leads are selected.</span>
          <button onClick={clearSelection} className="font-semibold underline">
            Clear selection
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {leads.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            {isBde
              ? "No leads assigned to you yet - ask your Team Lead to assign some from the Leads page."
              : isTeamLead
              ? "No leads assigned to your BDEs yet - ask the Founder to assign some to your team."
              : "No leads yet. Import a batch or add one manually with '+ Add Lead'."}
          </p>
        ) : (
          <>
            <LeadTable
              leads={leads}
              selectedIds={selectedIds}
              onToggleSelect={canAssign ? toggleSelect : undefined}
              onToggleSelectAll={canAssign ? toggleSelectAllOnPage : undefined}
            />

            <div className="flex items-center justify-between flex-wrap gap-3 pt-4 mt-2 border-t border-gray-100 text-sm text-gray-500">
              <span>
                Showing {rangeStart}-{rangeEnd} of {total}
              </span>
              <label className="flex items-center gap-2">
                Rows per page
                <select
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Lead">
        <LeadForm categories={categories} onSubmit={handleCreateLead} onCancel={() => setModalOpen(false)} />
      </Modal>

      <MergeDuplicatesModal open={mergeModalOpen} onClose={() => setMergeModalOpen(false)} onMerged={fetchLeads} />
    </div>
  );
}