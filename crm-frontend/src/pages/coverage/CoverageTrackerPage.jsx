import React, { useEffect, useMemo, useState } from 'react';
import { Search, MapPinned, CheckCircle2 } from 'lucide-react';
import { metaApi, coverageApi } from '../../lib/api/endpoints.js';
import CategoryChecklistModal from '../../components/coverage/CategoryChecklistModal.jsx';

/**
 * Founder-only page: pick a state, see every city in it as a card grid,
 * click a city to tick off which categories have already been pitched
 * there. Fully manual, independent of Leads - see chat spec.
 */
export default function CoverageTrackerPage() {
  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [stateCode, setStateCode] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const [coverageByCity, setCoverageByCity] = useState({}); // cityName -> {done, total}
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [activeCity, setActiveCity] = useState(null); // city currently open in modal

  useEffect(() => {
    metaApi
      .statesCities()
      .then((res) => setStates(res.data.data || []))
      .finally(() => setLoadingStates(false));
  }, []);

  const selectedState = states.find((s) => s.stateCode === stateCode);
  const cities = selectedState?.cities || [];

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities;
    const q = citySearch.trim().toLowerCase();
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, citySearch]);

  // Load done/total counts per city whenever the state changes, so cards
  // can show a "3/8 done" badge without opening each one.
  useEffect(() => {
    if (!stateCode) {
      setCoverageByCity({});
      return;
    }
    let active = true;
    setLoadingCoverage(true);
    coverageApi
      .byState(stateCode)
      .then((res) => {
        if (!active) return;
        const { categories, recordMap } = res.data.data;
        const totalCategories = categories.length;
        const tally = {};
        (recordMap || []).forEach((r) => {
          if (!r.done) return;
          tally[r.cityName] = (tally[r.cityName] || 0) + 1;
        });
        const next = {};
        cities.forEach((c) => {
          next[c] = { done: tally[c] || 0, total: totalCategories };
        });
        setCoverageByCity(next);
      })
      .finally(() => active && setLoadingCoverage(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateCode]);

  const handleCloseModal = () => {
    const closedCity = activeCity;
    setActiveCity(null);
    // refresh that city's badge count after the modal closes
    if (closedCity && stateCode) {
      coverageApi.byCity(stateCode, closedCity).then((res) => {
        const checklist = res.data.data.checklist || [];
        setCoverageByCity((prev) => ({
          ...prev,
          [closedCity]: { done: checklist.filter((c) => c.done).length, total: checklist.length },
        }));
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
          <MapPinned size={18} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Coverage Tracker</h1>
          <p className="text-sm text-gray-400">
            Track which category has already been pitched in which city, so nobody repeats a visit.
          </p>
        </div>
      </div>

      {/* State picker */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex flex-col gap-1 sm:w-64">
            <label className="text-sm font-medium text-gray-700">State</label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={stateCode}
              onChange={(e) => {
                setStateCode(e.target.value);
                setCitySearch('');
              }}
              disabled={loadingStates}
            >
              <option value="">{loadingStates ? 'Loading states...' : 'Select state'}</option>
              {states.map((s) => (
                <option key={s.stateCode} value={s.stateCode}>
                  {s.stateName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium text-gray-700">Search city</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={stateCode ? 'Type a city name...' : 'Select a state first'}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm disabled:bg-gray-50"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                disabled={!stateCode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* City grid */}
      <div className="mt-6">
        {!stateCode ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Select a state above to see its cities.
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No cities match your search.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCities.map((city) => {
              const stat = coverageByCity[city];
              const hasProgress = stat && stat.done > 0;
              return (
                <button
                  key={city}
                  onClick={() => setActiveCity(city)}
                  className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">
                    {city}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {hasProgress ? (
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-[13px] h-[13px] rounded-full border-2 border-gray-200 shrink-0" />
                    )}
                    <span className="text-xs text-gray-400">
                      {loadingCoverage || !stat ? '...' : `${stat.done}/${stat.total} done`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeCity && (
        <CategoryChecklistModal stateCode={stateCode} cityName={activeCity} onClose={handleCloseModal} />
      )}
    </div>
  );
}
