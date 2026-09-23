import React from 'react';
import { STATE_COLORS } from '../../lib/utils/streakHelpers.js';

export default function DayCell({ day, count, state }) {
  const label = day
    ? `${new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${count} interaction(s)`
    : '';

  return (
    <div
      title={label}
      className="w-3.5 h-3.5 rounded-sm"
      style={{ backgroundColor: day ? STATE_COLORS[state] || STATE_COLORS.none : 'transparent' }}
    />
  );
}
