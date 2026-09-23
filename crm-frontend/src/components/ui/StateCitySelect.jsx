import React, { useEffect, useState } from 'react';
import { metaApi } from '../../lib/api/endpoints.js';

/**
 * Cascading State -> City dropdown backed by the states_cities collection
 * (seeded from india.json via `npm run seed:states`, per Section 6 of the
 * blueprint: "State-City Data Service"). Replaces free-text city/state
 * inputs everywhere so data stays clean and de-duplicatable.
 *
 * Controlled component: pass stateCode/cityName + onChange({ stateCode, cityName }).
 */
export default function StateCitySelect({ stateCode, cityName, onChange, required = false }) {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metaApi
      .statesCities()
      .then((res) => setStates(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const selectedState = states.find((s) => s.stateCode === stateCode);
  const cities = selectedState?.cities || [];

  const handleStateChange = (e) => {
    onChange({ stateCode: e.target.value, cityName: '' });
  };

  const handleCityChange = (e) => {
    onChange({ stateCode, cityName: e.target.value });
  };

  if (loading) {
    return <p className="text-xs text-gray-400">Loading states...</p>;
  }

  if (states.length === 0) {
    return (
      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
        No state/city data loaded yet. Run <code>npm run seed:states</code> in crm-backend, then refresh.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">State</label>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={stateCode || ''}
          onChange={handleStateChange}
          required={required}
        >
          <option value="">Select state</option>
          {states.map((s) => (
            <option key={s.stateCode} value={s.stateCode}>
              {s.stateName}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">City</label>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
          value={cityName || ''}
          onChange={handleCityChange}
          required={required}
          disabled={!stateCode}
        >
          <option value="">{stateCode ? 'Select city' : 'Select a state first'}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
