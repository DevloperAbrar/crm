import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function TrustBadge({ score = 100 }) {
  const low = score < 50;
  const color =
    score >= 80
      ? 'bg-green-100 text-green-700'
      : score >= 50
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700';

  return (
    <span
      title={
        low
          ? 'Warning: several activities were confirmed as fraudulent. This is only an indicator and does not restrict the account.'
          : undefined
      }
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}
    >
      {low && <AlertTriangle size={12} />}
      Trust: {score}%
    </span>
  );
}