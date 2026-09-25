import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import * as api from '../api/employee-configApi';
import GradeFormModal from '../components/GradeFormModal';
import DocumentTypeFormModal from '../components/DocumentTypeFormModal';

const currency = (value) => `৳${Number(value).toLocaleString()}`;
const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10';

const TEMPLATE_FIELDS = [
  ['basic_percentage', 'Basic'],
  ['hra_percentage', 'House rent'],
  ['medical_percentage', 'Medical'],
  ['transport_percentage', 'Transport']
];

export default function EmployeeConfigPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grades, setGrades] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

  const [selectedGradeId, setSelectedGradeId] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    basic_percentage: '',
    hra_percentage: '',
    medical_percentage: '',
    transport_percentage: ''
  });
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState('');

  const [gradeModal, setGradeModal] = useState(null); // null | 'new' | grade object
  const [docTypeModal, setDocTypeModal] = useState(null);

  const [idForm, setIdForm] = useState({ emp_id_prefix: '', next_emp_id: '' });
  const [idSaving, setIdSaving] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.getOverview();
      setGrades(data.grades);
      setDocumentTypes(data.documentTypes);
      setIdForm({ emp_id_prefix: data.idGeneration.emp_id_prefix, next_emp_id: data.idGeneration.next_emp_id });
      setSelectedGradeId((current) => current ?? (data.grades.length ? data.grades[0].id : null));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedGradeId) return;
    setTemplateError('');
    api
      .getSalaryTemplate(selectedGradeId)
      .then(({ data }) =>
        setTemplateForm({
          basic_percentage: data?.basic_percentage ?? '',
          hra_percentage: data?.hra_percentage ?? '',
          medical_percentage: data?.medical_percentage ?? '',
          transport_percentage: data?.transport_percentage ?? ''
        })
      )
      .catch((err) => setTemplateError(err.message));
  }, [selectedGradeId]);

  const selectedGrade = grades.find((g) => g.id === selectedGradeId);

  const handleSaveGrade = async (form) => {
    if (gradeModal && gradeModal !== 'new') {
      await api.updateGrade(gradeModal.id, form);
    } else {
      await api.createGrade(form);
    }
    await loadOverview();
  };

  const handleDeleteGrade = async (grade) => {
    if (!window.confirm(`Delete grade "${grade.name}"? This also removes its salary template.`)) return;
    try {
      await api.deleteGrade(grade.id);
      if (selectedGradeId === grade.id) setSelectedGradeId(null);
      await loadOverview();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveDocType = async (form) => {
    if (docTypeModal && docTypeModal !== 'new') {
      await api.updateDocumentType(docTypeModal.id, form);
    } else {
      await api.createDocumentType(form);
    }
    await loadOverview();
  };

  const handleDeleteDocType = async (docType) => {
    if (!window.confirm(`Delete document type "${docType.name}"?`)) return;
    try {
      await api.deleteDocumentType(docType.id);
      await loadOverview();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setTemplateSaving(true);
    setTemplateError('');
    try {
      await api.saveSalaryTemplate(selectedGradeId, templateForm);
    } catch (err) {
      setTemplateError(err.message);
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleSaveIdGeneration = async (e) => {
    e.preventDefault();
    setIdSaving(true);
    try {
      const { data } = await api.updateIdGeneration(idForm);
      setIdForm({ emp_id_prefix: data.emp_id_prefix, next_emp_id: data.next_emp_id });
    } catch (err) {
      alert(err.message);
    } finally {
      setIdSaving(false);
    }
  };

  const grossPercentage = TEMPLATE_FIELDS.reduce((sum, [key]) => sum + (Number(templateForm[key]) || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading employee configuration...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Employee Configuration</h2>
        <p className="text-sm text-gray-600 mt-1">Grades, salary structure templates &amp; document rules.</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <div className="space-y-6 overflow-y-auto pb-6">
        <section className="bg-white/60 border border-white/60 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Employee grades</h3>
            <button
              onClick={() => setGradeModal('new')}
              className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              <Plus className="h-4 w-4" /> Add grade
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-2 pr-4">Grade</th>
                  <th className="py-2 pr-4">Min salary</th>
                  <th className="py-2 pr-4">Midpoint</th>
                  <th className="py-2 pr-4">Max salary</th>
                  <th className="py-2 pr-4">Headcount</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr
                    key={grade.id}
                    onClick={() => setSelectedGradeId(grade.id)}
                    className={`border-b border-gray-50 cursor-pointer transition-colors ${
                      selectedGradeId === grade.id ? 'bg-brand-active/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 pr-4 font-medium text-gray-900">{grade.name}</td>
                    <td className="py-3 pr-4 text-gray-600">{currency(grade.min_salary)}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      {currency((Number(grade.min_salary) + Number(grade.max_salary)) / 2)}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{currency(grade.max_salary)}</td>
                    <td className="py-3 pr-4 text-gray-600">{grade.headcount}</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setGradeModal(grade);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGrade(grade);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!grades.length && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      No grades configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white/60 border border-white/60 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
            <h3 className="font-semibold text-gray-900 mb-1">
              Salary structure template{selectedGrade ? ` — ${selectedGrade.name}` : ''}
            </h3>
            <p className="text-xs text-gray-500 mb-4">Reusable component breakdown, applied at onboarding.</p>
            {!selectedGrade ? (
              <p className="text-sm text-gray-400">Select a grade to configure its salary template.</p>
            ) : (
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                {templateError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{templateError}</p>}
                <div className="grid grid-cols-2 gap-4">
                  {TEMPLATE_FIELDS.map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{label} (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        required
                        value={templateForm[key]}
                        onChange={(e) => setTemplateForm({ ...templateForm, [key]: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className={`text-sm font-medium ${grossPercentage === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                    Gross (of basic): {grossPercentage}%
                  </span>
                  <button
                    type="submit"
                    disabled={templateSaving}
                    className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {templateSaving ? 'Saving...' : 'Save template'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="bg-white/60 border border-white/60 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Required document types</h3>
              <button
                onClick={() => setDocTypeModal('new')}
                className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                <Plus className="h-4 w-4" /> Add type
              </button>
            </div>
            <ul className="space-y-2">
              {documentTypes.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-800">{doc.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${doc.is_mandatory ? 'text-green-600' : 'text-gray-400'}`}>
                      {doc.is_mandatory ? 'Mandatory' : 'Optional'}
                    </span>
                    <button
                      onClick={() => setDocTypeModal(doc)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocType(doc)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
              {!documentTypes.length && <p className="text-sm text-gray-400 py-4 text-center">No document types configured.</p>}
            </ul>
          </section>
        </div>

        <section className="bg-white/60 border border-white/60 rounded-2xl p-5 shadow-sm backdrop-blur-sm max-w-xl">
          <h3 className="font-semibold text-gray-900 mb-1">Employee ID auto-generation</h3>
          <p className="text-xs text-gray-500 mb-4">Applied automatically when a new employee is onboarded.</p>
          <form onSubmit={handleSaveIdGeneration} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prefix</label>
              <input
                value={idForm.emp_id_prefix}
                onChange={(e) => setIdForm({ ...idForm, emp_id_prefix: e.target.value })}
                className={`${inputClass} w-28`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Next number</label>
              <input
                type="number"
                min="1"
                value={idForm.next_emp_id}
                onChange={(e) => setIdForm({ ...idForm, next_emp_id: e.target.value })}
                className={`${inputClass} w-32`}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs text-gray-400">Example</p>
              <p className="text-sm font-semibold text-gray-900">
                {idForm.emp_id_prefix}
                {idForm.next_emp_id}
              </p>
            </div>
            <button
              type="submit"
              disabled={idSaving}
              className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {idSaving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </section>
      </div>

      {gradeModal && (
        <GradeFormModal
          initialData={gradeModal === 'new' ? null : gradeModal}
          onClose={() => setGradeModal(null)}
          onSubmit={handleSaveGrade}
        />
      )}
      {docTypeModal && (
        <DocumentTypeFormModal
          initialData={docTypeModal === 'new' ? null : docTypeModal}
          onClose={() => setDocTypeModal(null)}
          onSubmit={handleSaveDocType}
        />
      )}
    </div>
  );
}
