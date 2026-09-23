import React from 'react';
import DayCell from './DayCell.jsx';
import { buildStreakWeeks, WEEKDAY_LABELS, STATE_COLORS } from '../../lib/utils/streakHelpers.js';

export default function StreakHeatmap({ heatmapData = [], currentStreak = 0, longestStreak = 0 }) {
  const { weeks, monthLabels } = buildStreakWeeks(heatmapData);

  return (
    <div>
      <div className="flex gap-4 mb-3 text-sm">
        <span className="font-medium">🔥 Current streak: {currentStreak} day(s)</span>
        <span className="text-gray-400">Longest: {longestStreak} day(s)</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-[3px]">
          {/* Weekday labels column */}
          <div className="flex flex-col gap-[3px] mr-1 pt-4">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="h-3.5 text-[10px] text-gray-400 leading-[14px]">
                {label}
              </div>
            ))}
          </div>

          {/* One column per week */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              <div className="h-4 text-[10px] text-gray-400 whitespace-nowrap">
                {monthLabels[wi] || ''}
              </div>
              {week.map((day, di) => (
                <DayCell key={di} day={day?.date} count={day?.count || 0} state={day?.state} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
        <span>Less</span>
        {['none', 'partial', 'complete'].map((s) => (
          <span key={s} className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATE_COLORS[s] }} />
        ))}
        <span>More</span>
        <span className="ml-3 flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATE_COLORS.missed }} /> Missed target
        </span>
      </div>
    </div>
  );
}
