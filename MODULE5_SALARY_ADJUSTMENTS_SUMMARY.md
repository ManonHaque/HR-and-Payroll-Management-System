# Module 5 — Salary Adjustments (Increment + Deduction + Salary Structure/Components)

Implemented by: Avi (Member 5)

## What was built

### 1. Increment Module — `/api/increments`
Tables used: `IncrementPolicy`, `Increment` (from `database/schema.sql`, unchanged).

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/policies` | List increment policies (Fixed/Percentage) |
| POST | `/policies` | Create a policy |
| GET | `/preview?employee_id&policy_id` | Preview revised salary before submitting |
| POST | `/` | Submit an individual increment (Pending) |
| POST | `/bulk` | Generate increments for a department/grade in one go |
| GET | `/` | List increments (filter by employee_id/status) |
| GET | `/:id` | Get one increment |
| PATCH | `/:id/status` | Approve/Reject — **Approving writes the new figure to `Employee.basic_salary` inside a transaction** |
| GET | `/employee/:employeeId/history` | Full increment history for one employee |

### 2. Deduction Module — `/api/deductions`
Tables used: `DeductionType`, `EmployeeDeduction`. Mirrors the existing Allowance module's shape exactly, so anyone touching both modules recognizes the pattern immediately.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/types` | List deduction types |
| POST | `/types` | Create a type (Fixed/Percentage, statutory flag) |
| POST | `/assign` | Assign to one employee (`employee_id`) or a whole grade (`grade_id`) |
| GET | `/employee/:employeeId` | List an employee's deductions |
| GET | `/employee/:employeeId/total?basicSalary=` | Total deduction amount — this is the function the Payroll/Reporting module (Member 6) should call when generating a payslip |
| PATCH | `/:id` | Override the value for one assignment |
| DELETE | `/:id` | Remove an assignment |

### 3. Salary Structure / Components — `/api/salary-structure` (new module)
Table used: `SalaryStructureTemplate` (already in schema, was unused). Defines a grade-level Basic %/HRA % split, which Increment and Deduction (and eventually Salary Generation) read from.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/templates` | List all grade templates |
| POST | `/templates` | Create a template for a grade (validates `basic% + hra% <= 100`) |
| GET / PUT / DELETE | `/templates/:id` | Read/update/remove one template |
| GET | `/employee/:employeeId/calculate` | Resolve an employee's grade template and break their current `basic_salary` into Basic/HRA/Other amounts |

## Design decisions worth flagging
- **No new tables or columns.** Everything maps 1:1 to the existing `schema.sql` (verified column names directly against the file, the same way the Loan/Bonus/Allowance task doc did).
- Increment approval is the one place this module writes outside its own tables — it updates `Employee.basic_salary`, and it's wrapped in a DB transaction so a failed write can't leave the increment "Approved" with the old salary still in place.
- Deduction module intentionally copies the Allowance module's method names/shape (`assignToEmployee`, `assignByGrade`, `calculateTotalXForEmployee`) so the Salary Generation module can treat allowances and deductions symmetrically.
- Salary Structure got its own module folder (`backend/src/modules/salary-structure/`) instead of piggy-backing on the existing `salary` module, since that module already belongs to Payroll & Reporting (Member 6) and does payroll-run/payslip logic, not structure configuration.

## Wiring
`backend/src/app.js` now mounts:
```js
app.use('/api/increments', incrementRoutes);
app.use('/api/deductions', deductionRoutes);
app.use('/api/salary-structure', salaryStructureRoutes);
```

## Frontend
- `frontend/src/features/increment/` — policy CRUD, preview, submit, approve/reject list.
- `frontend/src/features/deduction/` — type CRUD, employee/grade assignment, removal.
- `frontend/src/features/salary-structure/` — new feature folder; grade template CRUD + employee breakdown viewer.
- `App.jsx` — increment/deduction routes now point at the real pages instead of `<Placeholder />`; added a `salary-structure` route.
- `Layout.jsx` — added a "Salary Structure" sidebar item under **PAY**, above Increment.

## How to verify locally
```bash
cd backend && npm install && npm run dev
```
Then:
```
GET  /api/increments/policies        -> 200, {"status":"success","data":[]}
GET  /api/deductions/types           -> 200, {"status":"success","data":[]}
GET  /api/salary-structure/templates -> 200, {"status":"success","data":[]}
```
Empty arrays are expected until you create records — the tables have no seed rows.

```bash
cd frontend && npm install && npm run dev
```
Visit `/increment`, `/deduction`, and `/salary-structure` in the sidebar under **PAY**.

## Not touched
No files outside `backend/src/modules/increment/`, `backend/src/modules/deduction/`, `backend/src/modules/salary-structure/`, the route-mounting section of `backend/src/app.js`, `frontend/src/features/increment/`, `frontend/src/features/deduction/`, `frontend/src/features/salary-structure/`, and the increment/deduction/salary-structure entries in `App.jsx` / `Layout.jsx`.
