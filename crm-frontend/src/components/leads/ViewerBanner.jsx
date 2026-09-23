import React from 'react';
import { Eye } from 'lucide-react';

/**
 * Section 5.4: "'Currently viewing' indicator on a lead profile, so two
 * people never accidentally work the same lead at the same time." The
 * Socket.io events for this existed since early on but nothing in the UI
 * ever emitted or listened for them - this is what actually shows it.
 */
export default function ViewerBanner({ viewers }) {
  if (!viewers.length) return null;

  const names = viewers.map((v) => v.name).join(', ');

  return (
    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm rounded-lg px-3 py-2 mb-3">
      <Eye size={16} className="flex-shrink-0" />
      <span>
        <strong>{names}</strong> {viewers.length === 1 ? 'is' : 'are'} also viewing this lead right now.
      </span>
    </div>
  );
}
