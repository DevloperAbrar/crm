import React from 'react';

const colorMap = {
  New: 'bg-gray-100 text-gray-700',
  'Attempted Contact': 'bg-yellow-100 text-yellow-700',
  Contacted: 'bg-blue-100 text-blue-700',
  Interested: 'bg-indigo-100 text-indigo-700',
  'Demo/Visit Scheduled': 'bg-purple-100 text-purple-700',
  Visited: 'bg-cyan-100 text-cyan-700',
  Negotiation: 'bg-orange-100 text-orange-700',
  Converted: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-700',
};

export default function Badge({ label, className = '' }) {
  const color = colorMap[label] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}
