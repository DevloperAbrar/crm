import React from 'react';

export default function OnlineDot({ online, size = 8 }) {
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${online ? 'bg-green-500' : 'bg-gray-300'}`}
      style={{ width: size, height: size }}
      title={online ? 'Online now' : 'Offline'}
    />
  );
}
