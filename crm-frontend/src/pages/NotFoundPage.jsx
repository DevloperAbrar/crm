import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <h1 className="text-4xl font-bold text-gray-300">404</h1>
      <p className="text-gray-500">Page not found</p>
      <Link to="/" className="text-accent-500 text-sm font-medium">
        Go back home
      </Link>
    </div>
  );
}
