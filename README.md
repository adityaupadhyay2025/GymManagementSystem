# Gym Management System (DA-2 DBMS Project)

An interactive, responsive Gym Management System built for the **Database Management Systems (DBMS) DA-2 Assignment**.

## 🌟 Key Features
- **DA-1 Relational Integration**: Implements all 6 normalized BCNF tables (`Equipment`, `Member`, `Trainer`, `Maintenance`, `Equipment_Usage`, `Payment`) and pre-seeded with exact DA-1 sample records.
- **Full CRUD Web Interface**: Add (Insert), View (Read), Edit (Update), and Delete records via an athletic dark-mode dashboard with form validation and relational dropdown selects.
- **10 Essential SQL Queries**: Built-in Query Explorer running multi-table `JOIN`, `GROUP BY`, `HAVING`, `SUBQUERY`, `VIEW`, and conditional `CASE` statements with real-time tabular output.
- **PL/SQL Implementation**: Complete set of Stored Procedures, Triggers, Functions, and Cursors documented for Oracle SQL*Plus / LiveSQL.
- **Interactive SQL Console**: Live custom SQL query executor for viva/demonstration.
- **DA-2 Report In-App**: Complete formatted report ready to view or print directly to PDF.

## 🚀 How to Run

1. Open a terminal inside this directory:
   ```powershell
   cd C:\Users\ACER\.gemini\antigravity\scratch\gym-management-system
   ```

2. Start the server:
   ```powershell
   node server.js
   ```

3. Open your browser and go to:
   ```
   http://localhost:3000
   ```

## 📂 Project Structure
```
gym-management-system/
├── server.js              # Native Node.js HTTP server & REST APIs
├── db.js                  # SQLite database engine, schema & DA-1 seed data
├── queries.js             # 10 preset queries with metadata and SQL
├── public/                # Frontend files
│   ├── index.html         # Web application UI
│   ├── style.css          # Modern dark-mode athletic styling
│   └── app.js             # Client CRUD logic, queries, and dashboard
├── sql/
│   ├── schema.sql         # DDL table creation statements
│   ├── seed.sql           # DA-1 sample records DML
│   ├── 10_queries.sql     # 10 SQL queries with comments and concepts
│   └── plsql_procedures.sql # PL/SQL procedures, triggers, functions, cursors
├── DA2_REPORT.md          # Complete project report for submission
└── package.json           # Project metadata
```
