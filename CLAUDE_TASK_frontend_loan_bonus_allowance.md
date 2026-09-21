# Claude Code Task: Frontend pages for Loan, Bonus, Allowance modules

## Context

This is the HR & Payroll Management System repo (Feature-Driven Modular Architecture).
Frontend: React + Tailwind CSS v4, built with Vite. Backend already implemented and
running on `http://localhost:5000` (see `CLAUDE_TASK_loan_bonus_allowance.md`, already applied).

Folder convention (from README.md):
```
frontend/src/features/<feature>/
  ├── api/          # fetch calls
  ├── components/   # local components
  └── pages/        # main screen, exported and routed in App.jsx
```

The backend exposes these endpoints (already working, confirmed via browser test):
- `GET /api/loans/types`, `POST /api/loans/types`
- `GET /api/loans/preview-emi`
- `POST /api/loans`, `GET /api/loans`, `GET /api/loans/:id`
- `PATCH /api/loans/:id/status`
- `GET /api/loans/:id/ledger`, `POST /api/loans/:id/repayments`
- `GET /api/bonuses/types`, `POST /api/bonuses/types`
- `POST /api/bonuses/runs`, `GET /api/bonuses/runs`, `GET /api/bonuses/runs/:id`
- `PATCH /api/bonuses/runs/:id/status`
- `PATCH /api/bonuses/employee-bonus/:employeeBonusId`
- `GET /api/allowances/types`, `POST /api/allowances/types`
- `POST /api/allowances/assign`
- `GET /api/allowances/employee/:employeeId`
- `DELETE /api/allowances/:id`

All responses follow: `{ "status": "success", "data": ... }` or `{ "status": "error", "message": "..." }`.

The goal RIGHT NOW is a simple, working, presentable UI for a demo today — not final
polish. Each module needs ONE page that: (1) lists existing records in a table,
(2) has a form to add a new record, (3) shows a loading/error state. Keep styling
clean with Tailwind utility classes (cards, table, simple form inputs) — no extra
UI library needed.

## Instructions for Claude Code

1. Check `frontend/vite.config.js` / `frontend/.env` for the backend base URL. If
   there's no existing API base URL constant, create `frontend/src/config.js`:
   ```js
   export const API_BASE_URL = 'http://localhost:5000/api';
   ```
2. Create the 9 files listed below exactly as given (adjust only if an existing
   shared fetch helper already exists in `frontend/src/` — reuse it if so, and note
   what you reused).
3. Add three routes to `frontend/src/App.jsx`: `/loans`, `/bonuses`, `/allowances`,
   each rendering the corresponding page component. Also add three links/nav items
   in the sidebar/nav component if one exists (find it under `frontend/src/components/`).
   Do not restructure existing nav — just add entries in the same style as existing ones.
4. Run `cd frontend && npm install` (only if a new dependency was actually added —
   these pages need nothing beyond React + fetch, so this should be a no-op).
5. Start both servers and verify in the browser (or report exact steps to verify):
   `npm run dev` in `backend/` (port 5000) and `npm run dev` in `frontend/` (port 5173).
   Visit `http://localhost:5173/loans`, `/bonuses`, `/allowances` — each should load
   without a blank page or console error, show "No records yet" or a list, and the
   "Add" form should be visible.
6. Do not touch files outside: `frontend/src/features/loan/`,
   `frontend/src/features/bonus/`, `frontend/src/features/allowance/`,
   `frontend/src/config.js` (if created), and the specific route/nav lines added to
   `App.jsx` and the nav component. Stop and flag if `App.jsx`'s routing setup looks
   very different from a standard `react-router-dom` `<Routes>` block (e.g. if it's
   using a different router) rather than guessing.

---

## FILE 1: frontend/src/features/loan/api/loanApi.js

```js
import { API_BASE_URL } from '../../../config';

async function handle(res) {
  const json = await res.json();
  if (!res.ok || json.status === 'error') {
    throw new Error(json.message || 'Request failed');
  }
  return json.data;
}

export const loanApi = {
  getTypes: () => fetch(`${API_BASE_URL}/loans/types`).then(handle),
  createType: (payload) =>
    fetch(`${API_BASE_URL}/loans/types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE_URL}/loans${qs ? `?${qs}` : ''}`).then(handle);
  },
  apply: (payload) =>
    fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  updateStatus: (id, status) =>
    fetch(`${API_BASE_URL}/loans/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(handle),
};
```

## FILE 2: frontend/src/features/loan/pages/LoanPage.jsx

```jsx
import { useEffect, useState } from 'react';
import { loanApi } from '../api/loanApi';

export default function LoanPage() {
  const [types, setTypes] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    employee_id: '',
    loan_type_id: '',
    amount: '',
    tenure_months: '',
    reason: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [t, l] = await Promise.all([loanApi.getTypes(), loanApi.getAll()]);
      setTypes(t);
      setLoans(l);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loanApi.apply({
        ...form,
        employee_id: Number(form.employee_id),
        loan_type_id: Number(form.loan_type_id),
        amount: Number(form.amount),
        tenure_months: Number(form.tenure_months),
      });
      setForm({ employee_id: '', loan_type_id: '', amount: '', tenure_months: '', reason: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Loan &amp; Advance Management</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium mb-3">Apply for a Loan</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            placeholder="Employee ID"
            required
            className="border rounded px-3 py-2"
          />
          <select
            name="loan_type_id"
            value={form.loan_type_id}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2"
          >
            <option value="">Select Loan Type</option>
            {types.map((t) => (
              <option key={t.loan_type_id ?? t.id} value={t.loan_type_id ?? t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="Amount"
            type="number"
            required
            className="border rounded px-3 py-2"
          />
          <input
            name="tenure_months"
            value={form.tenure_months}
            onChange={handleChange}
            placeholder="Tenure (months)"
            type="number"
            required
            className="border rounded px-3 py-2"
          />
          <input
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="Reason"
            className="border rounded px-3 py-2 col-span-2"
          />
          <button
            type="submit"
            className="col-span-2 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          >
            Submit Application
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-3">Loan Requests</h2>
        {loading ? (
          <p>Loading...</p>
        ) : loans.length === 0 ? (
          <p className="text-gray-500">No loan requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">ID</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Tenure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.loan_request_id ?? l.id} className="border-b last:border-0">
                  <td className="py-2">{l.loan_request_id ?? l.id}</td>
                  <td>{l.employee_id}</td>
                  <td>{l.loan_type_id}</td>
                  <td>{l.amount}</td>
                  <td>{l.tenure_months}</td>
                  <td>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

## FILE 3: frontend/src/features/bonus/api/bonusApi.js

```js
import { API_BASE_URL } from '../../../config';

async function handle(res) {
  const json = await res.json();
  if (!res.ok || json.status === 'error') {
    throw new Error(json.message || 'Request failed');
  }
  return json.data;
}

export const bonusApi = {
  getTypes: () => fetch(`${API_BASE_URL}/bonuses/types`).then(handle),
  createType: (payload) =>
    fetch(`${API_BASE_URL}/bonuses/types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  getRuns: () => fetch(`${API_BASE_URL}/bonuses/runs`).then(handle),
  createRun: (payload) =>
    fetch(`${API_BASE_URL}/bonuses/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
};
```

## FILE 4: frontend/src/features/bonus/pages/BonusPage.jsx

```jsx
import { useEffect, useState } from 'react';
import { bonusApi } from '../api/bonusApi';

export default function BonusPage() {
  const [types, setTypes] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ bonus_type_id: '', run_name: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [t, r] = await Promise.all([bonusApi.getTypes(), bonusApi.getRuns()]);
      setTypes(t);
      setRuns(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await bonusApi.createRun({
        ...form,
        bonus_type_id: Number(form.bonus_type_id),
      });
      setForm({ bonus_type_id: '', run_name: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Bonus Management</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium mb-3">Generate a Bonus Run</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <select
            name="bonus_type_id"
            value={form.bonus_type_id}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2"
          >
            <option value="">Select Bonus Type</option>
            {types.map((t) => (
              <option key={t.bonus_type_id ?? t.id} value={t.bonus_type_id ?? t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            name="run_name"
            value={form.run_name}
            onChange={handleChange}
            placeholder="Run Name (e.g. Eid Bonus 2026)"
            required
            className="border rounded px-3 py-2"
          />
          <button
            type="submit"
            className="col-span-2 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          >
            Generate Bonus Run
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-3">Bonus Runs</h2>
        {loading ? (
          <p>Loading...</p>
        ) : runs.length === 0 ? (
          <p className="text-gray-500">No bonus runs yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.bonus_run_id ?? r.id} className="border-b last:border-0">
                  <td className="py-2">{r.bonus_run_id ?? r.id}</td>
                  <td>{r.run_name}</td>
                  <td>{r.bonus_type_id}</td>
                  <td>{r.total_amount}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

## FILE 5: frontend/src/features/allowance/api/allowanceApi.js

```js
import { API_BASE_URL } from '../../../config';

async function handle(res) {
  const json = await res.json();
  if (!res.ok || json.status === 'error') {
    throw new Error(json.message || 'Request failed');
  }
  return json.data;
}

export const allowanceApi = {
  getTypes: () => fetch(`${API_BASE_URL}/allowances/types`).then(handle),
  createType: (payload) =>
    fetch(`${API_BASE_URL}/allowances/types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  assign: (payload) =>
    fetch(`${API_BASE_URL}/allowances/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  getForEmployee: (employeeId) =>
    fetch(`${API_BASE_URL}/allowances/employee/${employeeId}`).then(handle),
};
```

## FILE 6: frontend/src/features/allowance/pages/AllowancePage.jsx

```jsx
import { useEffect, useState } from 'react';
import { allowanceApi } from '../api/allowanceApi';

export default function AllowancePage() {
  const [types, setTypes] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ employee_id: '', allowance_type_id: '', amount: '' });

  const loadTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const t = await allowanceApi.getTypes();
      setTypes(t);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await allowanceApi.assign({
        ...form,
        employee_id: Number(form.employee_id),
        allowance_type_id: Number(form.allowance_type_id),
        amount: Number(form.amount),
      });
      setForm({ employee_id: '', allowance_type_id: '', amount: '' });
      if (employeeId) handleLookup();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLookup = async () => {
    if (!employeeId) return;
    setError('');
    try {
      const data = await allowanceApi.getForEmployee(employeeId);
      setAssigned(data);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Allowance Management</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium mb-3">Assign Allowance to Employee</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            placeholder="Employee ID"
            required
            className="border rounded px-3 py-2"
          />
          <select
            name="allowance_type_id"
            value={form.allowance_type_id}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2"
          >
            <option value="">Select Allowance Type</option>
            {types.map((t) => (
              <option key={t.allowance_type_id ?? t.id} value={t.allowance_type_id ?? t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="Amount"
            type="number"
            required
            className="border rounded px-3 py-2 col-span-2"
          />
          <button
            type="submit"
            className="col-span-2 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          >
            Assign Allowance
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-3">Look Up Employee Allowances</h2>
        <div className="flex gap-2 mb-4">
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Employee ID"
            className="border rounded px-3 py-2"
          />
          <button
            onClick={handleLookup}
            className="bg-gray-700 text-white rounded px-4 py-2 hover:bg-gray-800"
          >
            Look Up
          </button>
        </div>
        {assigned.length === 0 ? (
          <p className="text-gray-500">No allowances found (or not looked up yet).</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">ID</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((a) => (
                <tr key={a.employee_allowance_id ?? a.id} className="border-b last:border-0">
                  <td className="py-2">{a.employee_allowance_id ?? a.id}</td>
                  <td>{a.allowance_type_id}</td>
                  <td>{a.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {loading && <p>Loading types...</p>}
      </div>
    </div>
  );
}
```

## App.jsx wiring

Add these imports near the other page imports:
```jsx
import LoanPage from './features/loan/pages/LoanPage';
import BonusPage from './features/bonus/pages/BonusPage';
import AllowancePage from './features/allowance/pages/AllowancePage';
```

Add these routes inside the existing `<Routes>` block (matching the style of existing routes):
```jsx
<Route path="/loans" element={<LoanPage />} />
<Route path="/bonuses" element={<BonusPage />} />
<Route path="/allowances" element={<AllowancePage />} />
```

If a sidebar/nav component exists, add three nav links (`/loans`, `/bonuses`,
`/allowances`) in the same style as existing nav items.

## Verification checklist

- [ ] `frontend/src/config.js` exists with `API_BASE_URL`.
- [ ] 6 new files created under `frontend/src/features/{loan,bonus,allowance}/`.
- [ ] `App.jsx` has 3 new routes, importing the 3 new pages.
- [ ] Nav has 3 new links (if a nav component exists).
- [ ] With backend running on :5000 and frontend on :5173, visiting `/loans`,
      `/bonuses`, `/allowances` in the browser shows the page (form + table),
      with no blank screen or red error overlay.
- [ ] Submitting the Loan form, Bonus form, and Allowance form each successfully
      adds a row and it appears in the table below without a page reload issue.
