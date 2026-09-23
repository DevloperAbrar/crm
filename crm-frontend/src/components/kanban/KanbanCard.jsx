import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin } from 'lucide-react';

export default function KanbanCard({ lead, stage, overlay = false }) {
  const navigate = useNavigate();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead._id,
      data: { lead, stage },
      disabled: overlay,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-lg border border-gray-100 shadow-sm transition-all
        hover:shadow-md hover:border-accent-200
        ${isDragging ? 'opacity-40' : 'opacity-100'}
        ${overlay ? 'shadow-lg ring-2 ring-accent-300' : ''}
      `}
    >
      <div className="flex items-start gap-1 p-2.5">
        {/* Dedicated drag handle: keeps tapping the card body free for
            navigation, and gives touch users an obvious grab target */}
        <button
          type="button"
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag lead"
          className="mt-0.5 shrink-0 p-1.5 -m-1 rounded text-gray-300 hover:text-brand-400 hover:bg-gray-50
            cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={14} />
        </button>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => !overlay && navigate(`/leads/${lead._id}`)}
        >
          <p className="text-sm font-medium text-brand-500 leading-snug line-clamp-2">
            {lead.businessName}
          </p>
          {lead.cityName && (
            <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{lead.cityName}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
