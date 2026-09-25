import React, { useState } from 'react';
import Modal from './Modal';

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10';

export default function GradeFormModal({ initialData, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    min_salary: initialData?.min_salary ?? '',
    max_salary: initialData?.max_salary ?? ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={initialData ? 'Edit Grade' : 'Add Grade'}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            form="grade-form"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <form id="grade-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Grade name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            placeholder="e.g. G1 - Entry"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Min salary</label>
            <input
              required
              type="number"
              min="0"
              value={form.min_salary}
              onChange={(e) => setForm({ ...form, min_salary: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Max salary</label>
            <input
              required
              type="number"
              min="0"
              value={form.max_salary}
              onChange={(e) => setForm({ ...form, max_salary: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
