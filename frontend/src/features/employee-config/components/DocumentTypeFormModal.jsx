import React, { useState } from 'react';
import Modal from './Modal';

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10';

export default function DocumentTypeFormModal({ initialData, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    is_mandatory: initialData ? !!initialData.is_mandatory : true
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
      title={initialData ? 'Edit Document Type' : 'Add Document Type'}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            form="doc-type-form"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <form id="doc-type-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Document name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            placeholder="e.g. National ID"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.is_mandatory}
            onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
            className="rounded border-gray-300"
          />
          Mandatory for onboarding
        </label>
      </form>
    </Modal>
  );
}
