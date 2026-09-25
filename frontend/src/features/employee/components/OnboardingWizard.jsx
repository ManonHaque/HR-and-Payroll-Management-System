import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Plus, Trash2, UploadCloud, Check } from 'lucide-react';
import * as api from '../api/employeeApi';

const STEPS = ['Personal info', 'Employment', 'Bank details', 'Documents', 'Emergency contact'];
const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-50 disabled:text-gray-400';

const emptyContact = () => ({ name: '', relationship: '', phone: '' });

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function OnboardingWizard({ formOptions, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [personal, setPersonal] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: ''
  });
  const [employment, setEmployment] = useState({
    joining_date: '',
    department_id: '',
    designation_id: '',
    grade_id: '',
    branch_id: '',
    manager_id: ''
  });
  const [bank, setBank] = useState({ bank_account_no: '', bank_name: '', basic_salary: '' });
  const [documents, setDocuments] = useState({}); // { [document_type_id]: File }
  const [contacts, setContacts] = useState([emptyContact()]);

  const departmentDesignations = formOptions.designations.filter(
    (d) => String(d.department_id) === String(employment.department_id)
  );

  const validateStep = () => {
    if (step === 0) {
      if (!personal.first_name || !personal.last_name) return 'First and last name are required';
      if (personal.email && !/^\S+@\S+\.\S+$/.test(personal.email)) return 'Enter a valid email address';
    }
    if (step === 1) {
      if (!employment.joining_date || !employment.department_id || !employment.designation_id) {
        return 'Joining date, department and designation are required';
      }
    }
    if (step === 2) {
      if (!bank.basic_salary || Number(bank.basic_salary) <= 0) return 'Basic salary must be greater than 0';
    }
    if (step === 3) {
      const missing = formOptions.documentTypes.filter((dt) => dt.is_mandatory && !documents[dt.id]);
      if (missing.length) return `Please upload: ${missing.map((d) => d.name).join(', ')}`;
    }
    return '';
  };

  const goNext = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleFileChange = (docTypeId, file) => {
    setDocuments((prev) => ({ ...prev, [docTypeId]: file }));
  };

  const updateContact = (index, field, value) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addContact = () => setContacts((prev) => [...prev, emptyContact()]);
  const removeContact = (index) => setContacts((prev) => prev.filter((_, i) => i !== index));

  const handleFinish = async () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...personal,
        ...employment,
        ...bank,
        emergency_contacts: contacts.filter((c) => c.name && c.phone)
      };
      const { data: employee } = await api.createEmployee(payload);

      const uploads = Object.entries(documents).filter(([, file]) => file);
      for (const [docTypeId, file] of uploads) {
        // eslint-disable-next-line no-await-in-loop
        await api.uploadDocument(employee.id, docTypeId, file);
      }

      onCreated(employee);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Onboard new employee</h3>
            <p className="text-xs text-gray-500">Multi-step form</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          {STEPS.map((label, index) => (
            <div key={label} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index < step ? 'bg-green-500 text-white' : index === step ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <span className="text-[10px] text-gray-500 text-center max-w-[70px]">{label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${index < step ? 'bg-green-400' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" required>
                <input
                  value={personal.first_name}
                  onChange={(e) => setPersonal({ ...personal, first_name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Last name" required>
                <input
                  value={personal.last_name}
                  onChange={(e) => setPersonal({ ...personal, last_name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={personal.email}
                  onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Phone">
                <input
                  value={personal.phone}
                  onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Date of birth">
                <input
                  type="date"
                  value={personal.date_of_birth}
                  onChange={(e) => setPersonal({ ...personal, date_of_birth: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Gender">
                <select
                  value={personal.gender}
                  onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Joining date" required>
                <input
                  type="date"
                  value={employment.joining_date}
                  onChange={(e) => setEmployment({ ...employment, joining_date: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Branch">
                <select
                  value={employment.branch_id}
                  onChange={(e) => setEmployment({ ...employment, branch_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {formOptions.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Department" required>
                <select
                  value={employment.department_id}
                  onChange={(e) => setEmployment({ ...employment, department_id: e.target.value, designation_id: '' })}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {formOptions.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Designation" required>
                <select
                  value={employment.designation_id}
                  onChange={(e) => setEmployment({ ...employment, designation_id: e.target.value })}
                  className={inputClass}
                  disabled={!employment.department_id}
                >
                  <option value="">Select</option>
                  {departmentDesignations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Grade">
                <select
                  value={employment.grade_id}
                  onChange={(e) => setEmployment({ ...employment, grade_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {formOptions.grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Manager">
                <select
                  value={employment.manager_id}
                  onChange={(e) => setEmployment({ ...employment, manager_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">None</option>
                  {formOptions.managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.emp_id})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bank name">
                <input
                  value={bank.bank_name}
                  onChange={(e) => setBank({ ...bank, bank_name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Account number">
                <input
                  value={bank.bank_account_no}
                  onChange={(e) => setBank({ ...bank, bank_account_no: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Basic salary" required>
                <input
                  type="number"
                  min="0"
                  value={bank.basic_salary}
                  onChange={(e) => setBank({ ...bank, basic_salary: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {formOptions.documentTypes.map((dt) => (
                <div key={dt.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{dt.name}</p>
                    <p className={`text-xs ${dt.is_mandatory ? 'text-green-600' : 'text-gray-400'}`}>
                      {dt.is_mandatory ? 'Mandatory' : 'Optional'}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-orange-600 cursor-pointer hover:text-orange-700">
                    <UploadCloud className="h-4 w-4" />
                    {documents[dt.id] ? documents[dt.id].name.slice(0, 20) : 'Choose file'}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileChange(dt.id, e.target.files[0])}
                    />
                  </label>
                </div>
              ))}
              {!formOptions.documentTypes.length && (
                <p className="text-sm text-gray-400">No document types configured yet.</p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                  <Field label="Name">
                    <input value={contact.name} onChange={(e) => updateContact(index, 'name', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Relationship">
                    <input
                      value={contact.relationship}
                      onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Phone">
                    <input value={contact.phone} onChange={(e) => updateContact(index, 'phone', e.target.value)} className={inputClass} />
                  </Field>
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    disabled={contacts.length === 1}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                <Plus className="h-4 w-4" /> Add another contact
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="px-5 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Finish onboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
