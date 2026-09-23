import React from 'react';

export default function Card({ title, actions, className = '', children, ...rest }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}
      {...rest}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
