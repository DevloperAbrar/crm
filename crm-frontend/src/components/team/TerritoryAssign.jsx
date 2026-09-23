import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { metaApi } from '../../lib/api/endpoints.js';
import Button from '../ui/Button.jsx';

/**
 * Territory assignment: one state dropdown, and a city dropdown that lists
 * cities only from the states already assigned to this member.
 */
export default function TerritoryAssign({ user, onSave }) {
  const [statesData, setStatesData] = useState([]);
  const [assignedStates, setAssignedStates] = useState(user.assignedStates || []);
  const [assignedCities, setAssignedCities] = useState(user.assignedCities || []);
  const [pendingState, setPendingState] = useState('');
  const [pendingCity, setPendingCity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    metaApi.statesCities().then((res) => setStatesData(res.data.data || []));
  }, []);

  // Assigned states with their city lists, in the order they were added
  const assignedStateDocs = useMemo(
    () =>
      assignedStates
        .map((name) => statesData.find((s) => s.stateName === name))
        .filter(Boolean),
    [assignedStates, statesData]
  );

  const addState = () => {
    const state = statesData.find((s) => s.stateCode === pendingState);
    if (state && !assignedStates.includes(state.stateName)) {
      setAssignedStates([...assignedStates, state.stateName]);
    }
    setPendingState('');
  };

  const addCity = () => {
    if (pendingCity && !assignedCities.includes(pendingCity)) {
      setAssignedCities([...assignedCities, pendingCity]);
    }
    setPendingCity('');
  };

  // Removing a state also removes its cities, unless the same city name
  // still belongs to another assigned state.
  const removeState = (name) => {
    const remainingStates = assignedStates.filter((s) => s !== name);
    const removedDoc = statesData.find((s) => s.stateName === name);
    const stillValid = new Set(
      remainingStates
        .flatMap((sn) => statesData.find((s) => s.stateName === sn)?.cities || [])
    );
    const removedCities = new Set(removedDoc?.cities || []);

    setAssignedStates(remainingStates);
    setAssignedCities(assignedCities.filter((c) => !removedCities.has(c) || stillValid.has(c)));
  };

  const removeCity = (name) => setAssignedCities(assignedCities.filter((c) => c !== name));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user._id, { assignedStates, assignedCities });
    } catch {
      // MemberProfile already showed the error toast; keep the current selection
    } finally {
      setSaving(false);
    }
  };

  const noStatesYet = assignedStates.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-sm font-medium text-gray-700">States</label>
        <div className="flex gap-2 mt-1">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
            value={pendingState}
            onChange={(e) => setPendingState(e.target.value)}
          >
            <option value="">Select a state to add</option>
            {statesData
              .filter((s) => !assignedStates.includes(s.stateName))
              .map((s) => (
                <option key={s.stateCode} value={s.stateCode}>
                  {s.stateName}
                </option>
              ))}
          </select>
          <Button type="button" variant="secondary" onClick={addState} disabled={!pendingState}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {assignedStates.map((s) => (
            <span key={s} className="flex items-center gap-1 bg-brand-50 text-brand-500 text-xs px-2 py-1 rounded-full">
              {s}
              <X size={12} className="cursor-pointer" onClick={() => removeState(s)} />
            </span>
          ))}
          {noStatesYet && <p className="text-xs text-gray-400">No states assigned yet.</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Cities</label>
        <div className="flex gap-2 mt-1">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 disabled:bg-gray-50 disabled:text-gray-400"
            value={pendingCity}
            onChange={(e) => setPendingCity(e.target.value)}
            disabled={noStatesYet}
          >
            <option value="">
              {noStatesYet ? 'Add a state first' : 'Select a city to add'}
            </option>
            {assignedStateDocs.map((s) => (
              <optgroup key={s.stateCode} label={s.stateName}>
                {(s.cities || [])
                  .filter((c) => !assignedCities.includes(c))
                  .map((c) => (
                    <option key={`${s.stateCode}-${c}`} value={c}>
                      {c}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <Button type="button" variant="secondary" onClick={addCity} disabled={!pendingCity}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {assignedCities.map((c) => (
            <span key={c} className="flex items-center gap-1 bg-accent-50 text-accent-600 text-xs px-2 py-1 rounded-full">
              {c}
              <X size={12} className="cursor-pointer" onClick={() => removeCity(c)} />
            </span>
          ))}
          {assignedCities.length === 0 && <p className="text-xs text-gray-400">No cities assigned yet.</p>}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="self-start">
        {saving ? 'Saving...' : 'Save Territory'}
      </Button>
    </div>
  );
}