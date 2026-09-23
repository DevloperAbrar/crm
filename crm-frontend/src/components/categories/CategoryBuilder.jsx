import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import CustomFieldEditor from './CustomFieldEditor.jsx';

export default function CategoryBuilder({ onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colour, setColour] = useState('#4F46E5');
  const [customFields, setCustomFields] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required.');
      return;
    }
    try {
      await onSave({ name, description, colour, customFields });
      setName('');
      setDescription('');
      setColour('#4F46E5');
      setCustomFields([]);
    } catch (err) {
      // Parent (CategoryBuilderPage) already toasts the failure; keep the
      // form values so the user doesn't lose their input.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Category Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Colour</label>
        <input type="color" value={colour} onChange={(e) => setColour(e.target.value)} />
      </div>

      <CustomFieldEditor fields={customFields} onChange={setCustomFields} />

      <Button type="submit">Save Category</Button>
    </form>
  );
}