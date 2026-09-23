import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { coverageApi } from '../../lib/api/endpoints.js';
import Modal from '../ui/Modal.jsx';

/**
 * Founder-only: checklist of categories for one city. Ticking a category
 * marks it "already pitched here" with today's date. Independent manual
 * tracker - not linked to Leads.
 */
export default function CategoryChecklistModal({ stateCode, cityName, onClose }) {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    coverageApi
      .byCity(stateCode, cityName)
      .then((res) => {
        if (active) setChecklist(res.data.data.checklist || []);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [stateCode, cityName]);

  const handleToggle = async (item) => {
    const nextDone = !item.done;
    setSavingId(item.categoryId);
    // optimistic update
    setChecklist((prev) =>
      prev.map((c) =>
        c.categoryId === item.categoryId
          ? { ...c, done: nextDone, doneDate: nextDone ? new Date().toISOString() : null }
          : c
      )
    );
    try {
      await coverageApi.toggle(stateCode, cityName, item.categoryId, nextDone);
    } catch (err) {
      // revert on failure
      setChecklist((prev) =>
        prev.map((c) =>
          c.categoryId === item.categoryId ? { ...c, done: item.done, doneDate: item.doneDate } : c
        )
      );
    } finally {
      setSavingId(null);
    }
  };

  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <Modal open={true} onClose={onClose} title={cityName}>
      <p className="text-xs text-gray-400 -mt-3 mb-3">
        {doneCount}/{checklist.length} categories marked done
      </p>

      <div className="max-h-[60vh] overflow-y-auto -mx-1 px-1">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : checklist.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            No categories found. Add some under Settings → Categories.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {checklist.map((item) => (
              <li key={item.categoryId} className="flex items-center justify-between py-2.5">
                <button
                  onClick={() => handleToggle(item)}
                  disabled={savingId === item.categoryId}
                  className="flex items-center gap-3 flex-1 text-left group"
                >
                  <span
                    className={`relative flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0 transition-colors ${
                      item.done
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-300 group-hover:border-gray-400'
                    }`}
                  >
                    {savingId === item.categoryId ? (
                      <Loader2 size={12} className="animate-spin text-gray-400" />
                    ) : (
                      item.done && <Check size={13} strokeWidth={3} className="text-white" />
                    )}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.colour || '#4F46E5' }}
                  />
                  <span className={`text-sm ${item.done ? 'text-gray-900' : 'text-gray-600'}`}>
                    {item.categoryName}
                  </span>
                </button>
                {item.done && item.doneDate && (
                  <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                    {new Date(item.doneDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
