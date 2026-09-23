import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn.jsx';
import KanbanCard from './KanbanCard.jsx';

const STAGES = [
  { key: 'New', color: '#7E8AB8' },
  { key: 'Attempted Contact', color: '#FB8A2D' },
  { key: 'Contacted', color: '#3F4C82' },
  { key: 'Interested', color: '#0EA5E9' },
  { key: 'Demo/Visit Scheduled', color: '#A855F7' },
  { key: 'Visited', color: '#14B8A6' },
  { key: 'Negotiation', color: '#EAB308' },
  { key: 'Converted', color: '#22C55E' },
  { key: 'Lost', color: '#EF4444' },
];

export default function KanbanBoard({ leadsByStage = {}, onDropLead }) {
  const [activeLead, setActiveLead] = useState(null);

  // Mouse/trackpad drag starts after a small movement so clicks still work.
  // Touch drag starts after a short press-and-hold, so scrolling the page
  // with a finger still works and doesn't accidentally start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  const findLeadById = (id) => {
    for (const stage of Object.keys(leadsByStage)) {
      const found = (leadsByStage[stage] || []).find((l) => l._id === id);
      if (found) return found;
    }
    return null;
  };

  const handleDragStart = (event) => {
    setActiveLead(findLeadById(event.active.id));
  };

  const handleDragCancel = () => setActiveLead(null);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const leadId = active.id;
    const targetStage = over.id;
    const sourceStage = active.data.current?.stage;
    const lead = active.data.current?.lead;

    if (sourceStage === targetStage) return; // dropped back in same column
    onDropLead?.(leadId, targetStage, lead?.businessName);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
        {STAGES.map(({ key, color }) => (
          <KanbanColumn
            key={key}
            stage={key}
            color={color}
            leads={leadsByStage[key] || []}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeLead ? <KanbanCard lead={activeLead} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
