import React, { useRef } from 'react';
import Button from '../ui/Button.jsx';

export default function Uploader({ onFileSelected }) {
  const inputRef = useRef();

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <p className="text-sm text-gray-500 mb-3">Upload the Maps-scraper CSV/Excel output</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => onFileSelected(e.target.files[0])}
      />
      <Button onClick={() => inputRef.current.click()}>Choose File</Button>
    </div>
  );
}
