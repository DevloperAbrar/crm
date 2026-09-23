import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard.jsx';

export default function KanbanColumn({ stage, color, leads }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  return (
    <div className="w-72 flex-shrink-0 flex flex-col">
      <div className="flex items-center gap-2 px-1 mb-3">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <h4 className="text-sm font-semibold text-brand-500 truncate">
          {stage}
        </h4>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[140px] rounded-xl p-2 flex flex-col gap-2 transition-colors border ${
          isOver
            ? 'bg-accent-50 border-accent-300 border-dashed'
            : 'bg-gray-50 border-gray-100'
        }`}
      >
        {leads.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-300 py-8 select-none">
            No leads
          </div>
        )}
        {leads.map((lead) => (
          <KanbanCard key={lead._id} lead={lead} stage={stage} />
        ))}
      </div>
    </div>
  );
}
