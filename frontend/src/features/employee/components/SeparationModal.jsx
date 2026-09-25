import React, { useState } from 'react';
import Modal from './Modal';

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10';

export default function SeparationModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ separation_date: '', separation_reason: '', clearance_completed: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.separation_date) {
      setError('Separation date is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Initiate separation"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            form="separation-form"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Confirm separation'}
          </button>
        </>
      }
    >
      <form id="separation-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Separation date</label>
          <input
            type="date"
            required
            value={form.separation_date}
            onChange={(e) => setForm({ ...form, separation_date: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
          <textarea
            value={form.separation_reason}
            onChange={(e) => setForm({ ...form, separation_reason: e.target.value })}
            rows={3}
            className={inputClass}
            placeholder="Resignation, termination, etc."
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.clearance_completed}
            onChange={(e) => setForm({ ...form, clearance_completed: e.target.checked })}
            className="rounded border-gray-300"
          />
          Clearance checklist completed
        </label>
        <p className="text-xs text-gray-400">The employee&apos;s login access will be blocked from this date onward.</p>
      </form>
    </Modal>
  );
}
