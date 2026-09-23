import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { categoryApi } from '../../lib/api/endpoints.js';
import CategoryBuilder from '../../components/categories/CategoryBuilder.jsx';
import Card from '../../components/ui/Card.jsx';

export default function CategoryBuilderPage() {
  const [categories, setCategories] = useState([]);

  const fetchCategories = () => {
    categoryApi
      .list({ skipErrorToast: true })
      .then((res) => setCategories(res.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load categories.'));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (payload) => {
    try {
      await categoryApi.create(payload, { skipErrorToast: true });
      toast.success(`Category "${payload.name}" created.`);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      <Card title="New Category">
        <CategoryBuilder onSave={handleSave} />
      </Card>
      <Card title="Existing Categories">
        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <li key={c._id} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.colour }} />
              {c.name} <span className="text-gray-400">({c.customFields.length} custom fields)</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}