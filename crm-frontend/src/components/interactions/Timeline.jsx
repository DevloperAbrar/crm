import React from 'react';
import { Paperclip } from 'lucide-react';
import { formatDate } from '../../lib/utils/dateHelpers.js';
import { getFileUrl } from '../../lib/utils/fileHelpers.js';

export default function Timeline({ interactions = [] }) {
  if (!interactions.length) {
    return <p className="text-sm text-gray-400">No interactions logged yet.</p>;
  }

  return (
    <ol className="relative border-l border-gray-200 ml-2">
      {interactions.map((it) => (
        <li key={it._id} className="mb-4 ml-4">
          <div className="absolute w-2 h-2 bg-accent-500 rounded-full -left-1 mt-1.5" />
          <time className="text-xs text-gray-400">{formatDate(it.date)}</time>
          <p className="text-sm font-medium">
            {it.type.toUpperCase()} #{it.attemptNumber} — {it.outcome}
          </p>
          {it.notes && <p className="text-sm text-gray-600">{it.notes}</p>}
          <p className="text-xs text-gray-400">by {it.handledBy?.name}</p>

          {it.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1.5">
              {it.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={getFileUrl(att.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-brand-500 hover:underline bg-brand-50 rounded-full px-2 py-1"
                >
                  <Paperclip size={11} />
                  {att.fileName.length > 20 ? `${att.fileName.slice(0, 20)}...` : att.fileName}
                </a>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
