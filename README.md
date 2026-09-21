# HR & Payroll Management System

Welcome to the HR & Payroll Management System repository! This project is a comprehensive, web-based platform designed to manage the complete HR and payroll lifecycle, replacing manual spreadsheets with a modern, automated, and NBR-compliant solution.

---

## 🏗️ Project Architecture

This project is built using a decoupled architecture, splitting the client-side and server-side logic to allow different developers and teams to work independently.

- **Frontend**: React.js with Tailwind CSS v4 (built with Vite)
- **Backend**: Node.js & Express.js
- **Database**: MySQL

---

## 🚀 Initial Setup & Installation

When you first clone this repository, you must install the dependencies for **both** the frontend and the backend separately.

### 1. Install Backend Dependencies
Open a terminal and navigate to the `backend/` directory:
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
Open a new terminal and navigate to the `frontend/` directory:
```bash
cd frontend
npm install
```

---

## 🗄️ Database Setup & Connection

1. **Install MySQL**: Ensure you have a local MySQL server running (e.g., XAMPP, WAMP, MySQL Workbench, or Docker).
2. **Create the Database**: Connect to your MySQL instance and run:
   ```sql
   CREATE DATABASE hr_payroll_db;
   ```
3. **Run the Schema**: Import the `database/schema.sql` file into your newly created database to instantly generate all the necessary tables and relationships.
4. **Configure Environment Variables**: 
   - Navigate to the `backend/` folder.
   - Copy `.env.example` and rename it to `.env`.
   - Update the `.env` file with your actual MySQL credentials.

---

## 🏃 How to Run the Project Locally

You will need to run two separate terminal windows.

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```
*If your database is connected correctly, you will see a success message and the server will start on port 5000.*

### 2. Start the Frontend App
```bash
cd frontend
npm run dev
```
*Vite will start the frontend. Open your browser and navigate to `http://localhost:5173/`.*

---

## 📂 Complete Project Structure

```text
/HR and Payroll System
├── backend/                 # Node.js / Express Server
│   ├── src/
│   │   ├── config/          # DB connections and environment configs
│   │   ├── middlewares/     # 🔒 SHARED: Global middlewares (e.g., auth.js)
│   │   ├── modules/         # ✨ API MODULES (Controllers, Routes, Services)
│   │   ├── utils/           # Shared helper functions
│   │   ├── app.js           # Express App setup (Import your routes here!)
│   │   └── server.js        # Server Entry Point
│   ├── .env.example         
│   └── package.json         
│
├── frontend/                # React.js Frontend
│   ├── src/
│   │   ├── components/      # Global UI components (Layout, Sidebar, Navigation)
│   │   ├── features/        # ✨ FRONTEND MODULES (Pages, Local Components, API)
│   │   ├── lib/             # 🔒 SHARED: Global utilities (e.g., apiClient.js)
│   │   ├── App.jsx          # React Router (Import your pages here!)
│   │   ├── index.css        # Tailwind directives and Brand Colors
│   │   └── main.jsx         
│   ├── vite.config.js       
│   └── package.json         
│
├── database/                # Database Scripts
│   └── schema.sql           
├── design-assets/           # UI Mockups and System Designs
└── README.md                
```

---

## 🛠️ How to Work on Modules (For Developers)

We use a **Feature-Driven / Modular Architecture**. All code relating to a specific feature (like "Leave") lives in one isolated folder. **Do not modify global configuration files unless necessary.**

### Frontend Workflow
If you are assigned a module (e.g., `leave`):
1. Navigate to `frontend/src/features/leave/`.
2. Write your React components inside the `components/` subfolder.
3. **API Calls**: Do NOT write raw `fetch()` requests. Import and use the shared API client from `frontend/src/lib/apiClient.js` inside your `api/` folder.
4. Export your main screen from the `pages/` subfolder.
5. **The ONLY shared file you should touch**: Open `frontend/src/App.jsx` and import your new page into the React Router.

### Backend Workflow
If you are assigned a module (e.g., `leave`):
1. Navigate to `backend/src/modules/leave/`.
2. Write your HTTP request handlers in `leave.controller.js`.
3. Register your API endpoints in `leave.routes.js`. 
4. **Security**: If your route requires user authentication, import and apply the shared middleware from `backend/src/middlewares/auth.js`.
5. Write your business logic and MySQL queries in `leave.service.js`.
6. **The ONLY shared file you should touch**: Open `backend/src/app.js` and mount your module's router.

