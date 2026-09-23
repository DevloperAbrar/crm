import React from 'react';
import Card from '../ui/Card.jsx';

const COLOR_MAP = {
  accent: 'text-accent-500 bg-accent-50',
  indigo: 'text-indigo-600 bg-indigo-50',
  green: 'text-green-600 bg-green-50',
  amber: 'text-amber-600 bg-amber-50',
  rose: 'text-rose-600 bg-rose-50',
};

export default function StatCard({ label, value, sublabel, icon: Icon, color = 'accent' }) {
  const colorClasses = COLOR_MAP[color] || COLOR_MAP.accent;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{label}</p>
          {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colorClasses}`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>
    </Card>
  );
}
