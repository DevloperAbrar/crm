import React, { useState } from 'react';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';

/**
 * Lets a Team Lead set a BDE's daily/weekly target (Section 9: "Team Lead
 * can set the daily/weekly target per BDE, which is what the
 * green/amber/red completion state is measured against"). The field
 * already existed on the User model and the update endpoint already
 * accepted it - there was just no screen to edit it.
 */
export default function TargetEditor({ user, onSave }) {
  const [dailyTarget, setDailyTarget] = useState(user.dailyTarget ?? 20);
  const [weeklyTarget, setWeeklyTarget] = useState(user.weeklyTarget ?? 100);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave(user._id, { dailyTarget: Number(dailyTarget), weeklyTarget: Number(weeklyTarget) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Daily Target (calls/visits)"
          type="number"
          min={1}
          value={dailyTarget}
          onChange={(e) => setDailyTarget(e.target.value)}
        />
        <Input
          label="Weekly Target"
          type="number"
          min={1}
          value={weeklyTarget}
          onChange={(e) => setWeeklyTarget(e.target.value)}
        />
      </div>
      <p className="text-xs text-gray-400">
        A day counts as "complete" on the streak calendar once this many interactions are logged.
      </p>
      <Button onClick={handleSave} className="self-start">
        {saved ? 'Saved ✓' : 'Save Target'}
      </Button>
    </div>
  );
}
