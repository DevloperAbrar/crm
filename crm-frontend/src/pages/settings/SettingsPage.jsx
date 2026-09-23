import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card.jsx';

export default function SettingsPage() {
  return (
    <div className="max-w-xl flex flex-col gap-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <Card title="Lead Categories & Custom Fields">
        <p className="text-sm text-gray-500 mb-2">
          Create category-specific data models (e.g. Venue Owner vs Photographer) without a rebuild.
        </p>
        <Link to="/settings/categories" className="text-accent-500 text-sm font-medium">
          Open Category Builder →
        </Link>
      </Card>
    </div>
  );
}
