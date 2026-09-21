# HR & Payroll Management System

Welcome to the HR & Payroll Management System repository! This project is a comprehensive, web-based platform designed to manage the complete HR and payroll lifecycle, replacing manual spreadsheets with a modern, automated, and NBR-compliant solution.

---

## 🏗️ Project Architecture

This project is built using a decoupled architecture, splitting the client-side and server-side logic to allow different developers and teams to work independently.

- **Frontend**: React.js with Tailwind CSS v4 (built with Vite)
- **Backend**: Node.js & Express.js
- **Database**: MySQL

---

## 📂 Complete Project Structure

```text
/HR and Payroll System
├── backend/                 # Node.js / Express Server
│   ├── src/
│   │   ├── config/          # DB connections and environment configs
│   │   ├── middlewares/     # Global middlewares (Auth, Error Handling)
│   │   ├── modules/         # ✨ API MODULES (Controllers, Routes, Services)
│   │   ├── utils/           # Shared helper functions
│   │   ├── app.js           # Express App setup
│   │   └── server.js        # Server Entry Point
│   ├── .env.example         # Template for environment variables
│   └── package.json         
│
├── frontend/                # React.js Frontend
│   ├── src/
│   │   ├── components/      # Global UI components (Layout, Sidebar, Navigation)
│   │   ├── features/        # ✨ FRONTEND MODULES (Pages, Local Components, API)
│   │   ├── App.jsx          # React Router Configuration
│   │   ├── index.css        # Tailwind directives and Brand Colors
│   │   └── main.jsx         # React Entry Point
│   ├── vite.config.js       # Vite build configuration
│   └── package.json         
│
├── database/                # Database Scripts
│   └── schema.sql           # Complete relational schema (37+ Tables)
│
├── design-assets/           # UI Mockups and System Designs
│   └── image*.png           
│
└── README.md                # This file
```

---

## 🛠️ How to Work on Modules (For Developers)

We are using a **Feature-Driven / Modular Architecture**. This means whether you are working on the Frontend or the Backend, all code relating to a specific feature (like "Leave" or "Attendance") lives in one isolated folder. 

**This prevents merge conflicts and keeps the codebase clean.**

### Frontend Workflow
If you are assigned a module (e.g., `leave`):
1. Navigate to `frontend/src/features/leave/`.
2. Write your React components inside the `components/` subfolder.
3. Write your API fetch calls in the `api/` subfolder.
4. Export your main screen from the `pages/` subfolder.
5. Make sure your page is imported and routed correctly in `frontend/src/App.jsx`.

### Backend Workflow
If you are assigned a module (e.g., `leave`):
1. Navigate to `backend/src/modules/leave/`.
2. Write your HTTP request handlers in `leave.controller.js`.
3. Register your API endpoints in `leave.routes.js`.
4. Write your business logic and MySQL queries in `leave.service.js`.
5. Mount your routes in `backend/src/app.js`.

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
   - Update the `.env` file with your actual MySQL credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=hr_payroll_db
   ```

---

## 🚀 How to Run the Project Locally

You will need to run two separate terminal windows—one for the backend and one for the frontend.

### 1. Start the Backend Server
Open a terminal and navigate to the `backend/` directory:
```bash
cd backend
npm install
npm run dev
```
*If your database is connected correctly, you will see a success message and the server will start on port 5000.*

### 2. Start the Frontend App
Open a **new** terminal and navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
*Vite will start the frontend. Open your browser and navigate to `http://localhost:5173/` to view the application.*

