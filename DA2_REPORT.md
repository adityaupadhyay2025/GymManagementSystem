# DIGITAL ASSIGNMENT 2 (DA-2) REPORT
## COURSE: DATABASE MANAGEMENT SYSTEMS (DBMS)
### TOPIC: GYM MANAGEMENT SYSTEM (EQUIPMENT & FACILITY DATABASE)

---

**Academic Evaluation Context:**
- **Assignment:** Digital Assignment 2 (DA-2)
- **Component Weightage:** 10 Marks
- **Submission Date:** October 11, 2026
- **Deliverables:** Database Implementation, Interactive Frontend Interface (Full CRUD), 10 System-Specific Queries (SQL), and PL/SQL Implementation.

---

## 1. PROJECT OBJECTIVES & PROBLEM STATEMENT

Modern fitness facilities require streamlined management to ensure equipment availability, user safety, timely preventative maintenance, personal trainer assignment, and accurate membership billing.

The **Gym Management System** addresses these needs by establishing an integrated relational database to:
1. Maintain an up-to-date registry of all gym equipment, categorizing assets by workout type (Cardio, Strength, Free Weight) and physical condition.
2. Track maintenance interventions, technician visits, and repair costs to prevent equipment breakdown and minimize gym downtime.
3. Manage member enrollment profiles, contact information, and membership tiers (Premium, Standard, Basic).
4. Supervise daily equipment usage sessions, linking members with designated fitness trainers.
5. Process membership fee payments, monitor payment methods, and flag pending dues.

---

## 2. RELATIONAL MODEL & NORMALIZATION (REFERENCING DA-1)

The database schema directly incorporates the entities and relationships designed in **DA-1**. Every relation has been normalized to **Boyce-Codd Normal Form (BCNF)** to eliminate redundancy and update/deletion anomalies.

### 2.1 Relational Schema

1. **Equipment** (`Equipment_ID` [PK], `Equipment_Name`, `Category`, `Brand`, `Purchase_Date`, `Condition`, `Status`)
2. **Member** (`Member_ID` [PK], `Member_Name`, `Age`, `Gender`, `Phone`, `Membership_Type`)
3. **Trainer** (`Trainer_ID` [PK], `Trainer_Name`, `Phone`, `Specialization`, `Experience`)
4. **Maintenance** (`Maintenance_ID` [PK], `Equipment_ID` [FK], `Maintenance_Date`, `Technician_Name`, `Cost`, `Remarks`)
5. **Equipment_Usage** (`Usage_ID` [PK], `Member_ID` [FK], `Equipment_ID` [FK], `Trainer_ID` [FK], `Usage_Date`, `Duration`)
6. **Payment** (`Payment_ID` [PK], `Member_ID` [FK], `Amount`, `Payment_Date`, `Payment_Mode`, `Payment_Status`)

### 2.2 Cardinality & Relationships
- **Equipment → Maintenance**: $1 : M$ (One piece of equipment can undergo multiple maintenance operations).
- **Member → Equipment_Usage**: $1 : M$ (One member can log multiple equipment usage sessions).
- **Equipment → Equipment_Usage**: $1 : M$ (One machine can be used across multiple sessions).
- **Trainer → Equipment_Usage**: $1 : M$ (One trainer can supervise multiple workout sessions).
- **Member → Payment**: $1 : N$ (One member can make multiple subscription payments).

---

## 3. DATA DEFINITION LANGUAGE (DDL)

```sql
-- 1. EQUIPMENT TABLE
CREATE TABLE Equipment (
    Equipment_ID VARCHAR(20) PRIMARY KEY,
    Equipment_Name VARCHAR(100) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    Brand VARCHAR(50) NOT NULL,
    Purchase_Date VARCHAR(20) NOT NULL,
    Condition VARCHAR(30) NOT NULL,
    Status VARCHAR(30) NOT NULL
);

-- 2. MEMBER TABLE
CREATE TABLE Member (
    Member_ID VARCHAR(20) PRIMARY KEY,
    Member_Name VARCHAR(100) NOT NULL,
    Age INT NOT NULL,
    Gender VARCHAR(20) NOT NULL,
    Phone VARCHAR(25) NOT NULL,
    Membership_Type VARCHAR(50) NOT NULL
);

-- 3. TRAINER TABLE
CREATE TABLE Trainer (
    Trainer_ID VARCHAR(20) PRIMARY KEY,
    Trainer_Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(25) NOT NULL,
    Specialization VARCHAR(50) NOT NULL,
    Experience VARCHAR(50) NOT NULL
);

-- 4. MAINTENANCE TABLE
CREATE TABLE Maintenance (
    Maintenance_ID VARCHAR(20) PRIMARY KEY,
    Equipment_ID VARCHAR(20) NOT NULL,
    Maintenance_Date VARCHAR(20) NOT NULL,
    Technician_Name VARCHAR(100) NOT NULL,
    Cost DECIMAL(10, 2) NOT NULL,
    Remarks VARCHAR(255),
    FOREIGN KEY (Equipment_ID) REFERENCES Equipment(Equipment_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. EQUIPMENT USAGE TABLE
CREATE TABLE Equipment_Usage (
    Usage_ID VARCHAR(20) PRIMARY KEY,
    Member_ID VARCHAR(20) NOT NULL,
    Equipment_ID VARCHAR(20) NOT NULL,
    Trainer_ID VARCHAR(20) NOT NULL,
    Usage_Date VARCHAR(20) NOT NULL,
    Duration VARCHAR(30) NOT NULL,
    FOREIGN KEY (Member_ID) REFERENCES Member(Member_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Equipment_ID) REFERENCES Equipment(Equipment_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Trainer_ID) REFERENCES Trainer(Trainer_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. PAYMENT TABLE
CREATE TABLE Payment (
    Payment_ID VARCHAR(20) PRIMARY KEY,
    Member_ID VARCHAR(20) NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Payment_Date VARCHAR(20) NOT NULL,
    Payment_Mode VARCHAR(50) NOT NULL,
    Payment_Status VARCHAR(30) NOT NULL,
    FOREIGN KEY (Member_ID) REFERENCES Member(Member_ID) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. ABSTRACTED SUMMARY VIEW
CREATE VIEW View_Member_Summary AS
SELECT 
    m.Member_ID,
    m.Member_Name,
    m.Membership_Type,
    m.Phone,
    COUNT(DISTINCT u.Usage_ID) AS Total_Workouts,
    COALESCE(SUM(CASE WHEN p.Payment_Status = 'Paid' THEN p.Amount ELSE 0 END), 0) AS Total_Paid_Amount,
    COALESCE(MAX(p.Payment_Status), 'None') AS Latest_Payment_Status
FROM Member m
LEFT JOIN Equipment_Usage u ON m.Member_ID = u.Member_ID
LEFT JOIN Payment p ON m.Member_ID = p.Member_ID
GROUP BY m.Member_ID, m.Member_Name, m.Membership_Type, m.Phone;
```

---

## 4. SAMPLE POPULATION DATA (FROM DA-1)

```sql
-- Equipment
INSERT INTO Equipment VALUES
('E101', 'Treadmill', 'Cardio', 'Alpha', '2024-01-15', 'Good', 'Available'),
('E102', 'Bench Press', 'Strength', 'Rogue', '2023-11-10', 'Good', 'Available'),
('E103', 'Dumbbell Set', 'Free Weight', 'Power', '2024-03-20', 'Fair', 'Available'),
('E104', 'Exercise Bike', 'Cardio', 'Matrix', '2022-09-18', 'Fair', 'Available'),
('E105', 'Lat Pulldown', 'Strength', 'Alpha', '2023-07-05', 'Good', 'Maintenance');

-- Member
INSERT INTO Member VALUES
('M001', 'Priya Sharma', 18, 'Female', '9876543210', 'Premium'),
('M002', 'Rahul Kumar', 22, 'Male', '9876543211', 'Basic'),
('M003', 'Sneha Patel', 21, 'Female', '9876521200', 'Premium'),
('M004', 'Arjun Singh', 19, 'Male', '9876543213', 'Standard'),
('M005', 'Rakesh', 23, 'Male', '9901567822', 'Premium');

-- Trainer
INSERT INTO Trainer VALUES
('T001', 'Karan', '9998270111', 'Strength', '6 years'),
('T002', 'Rakish', '9998370112', 'Cardio', '4 years'),
('T003', 'Allen', '9998470114', 'Weight Loss', '5 years');

-- Maintenance
INSERT INTO Maintenance VALUES
('MT001', 'E104', '2026-10-07', 'Rajesh', 2500.00, 'Belt Replacement'),
('MT002', 'E102', '2026-05-25', 'Suresh', 1200.00, 'Lubrication'),
('MT003', 'E101', '2026-05-18', 'Amit', 1800.00, 'Motor Check');

-- Equipment_Usage
INSERT INTO Equipment_Usage VALUES
('U001', 'M001', 'E101', 'T002', '2026-07-20', '30 mins'),
('U002', 'M002', 'E103', 'T001', '2026-07-20', '1 hour'),
('U003', 'M003', 'E102', 'T001', '2026-07-21', '30 mins'),
('U004', 'M004', 'E105', 'T003', '2026-06-22', '45 mins'),
('U005', 'M005', 'E101', 'T002', '2026-05-23', '1 hour');

-- Payment
INSERT INTO Payment VALUES
('P001', 'M001', 12000.00, '2026-05-01', 'UPI', 'Paid'),
('P002', 'M002', 8000.00, '2026-06-03', 'Card', 'Paid'),
('P003', 'M003', 12000.00, '2026-07-04', 'Cash', 'Pending');
```

---

## 5. 10 SYSTEM-SPECIFIC SQL QUERIES

Below are the 10 queries developed for the Gym Management System. They implement a diverse set of SQL operations including **INNER JOIN**, **MULTI-TABLE JOIN**, **GROUP BY with AGGREGATES**, **HAVING**, **SUBQUERIES**, **SQL VIEWS**, and **CASE CONDITIONAL LOGIC**.

### Query 1: Equipment Maintenance History & Service Log
- **Objective:** Retrieve all maintenance records with equipment name, category, brand, and technician details, sorted chronologically.
- **Concepts:** `INNER JOIN`, `ORDER BY DESC`
```sql
SELECT m.Maintenance_ID, e.Equipment_Name, e.Category, e.Brand, 
       m.Maintenance_Date, m.Technician_Name, m.Cost, m.Remarks
FROM Maintenance m
JOIN Equipment e ON m.Equipment_ID = e.Equipment_ID
ORDER BY m.Maintenance_Date DESC;
```
*Output:*
| Maintenance_ID | Equipment_Name | Category | Brand | Maintenance_Date | Technician_Name | Cost | Remarks |
|---|---|---|---|---|---|---|---|
| MT001 | Exercise Bike | Cardio | Matrix | 2026-10-07 | Rajesh | 2500.00 | Belt Replacement |
| MT002 | Bench Press | Strength | Rogue | 2026-05-25 | Suresh | 1200.00 | Lubrication |
| MT003 | Treadmill | Cardio | Alpha | 2026-05-18 | Amit | 1800.00 | Motor Check |

---

### Query 2: Total Maintenance Expenditure by Equipment Category
- **Objective:** Calculate total maintenance expenditure, total repairs, and average cost per repair grouped by category.
- **Concepts:** `GROUP BY`, `COUNT()`, `SUM()`, `ROUND(AVG(), 2)`
```sql
SELECT e.Category, 
       COUNT(m.Maintenance_ID) AS Total_Services, 
       SUM(m.Cost) AS Total_Cost, 
       ROUND(AVG(m.Cost), 2) AS Avg_Cost_Per_Service
FROM Equipment e
JOIN Maintenance m ON e.Equipment_ID = m.Equipment_ID
GROUP BY e.Category;
```
*Output:*
| Category | Total_Services | Total_Cost | Avg_Cost_Per_Service |
|---|---|---|---|
| Cardio | 2 | 4300.00 | 2150.00 |
| Strength | 1 | 1200.00 | 1200.00 |

---

### Query 3: Multi-Table 4-Way Workout Activity Log
- **Objective:** Join 4 tables to produce a human-readable workout sheet displaying member name, machine used, and supervising coach.
- **Concepts:** Multi-Table `INNER JOIN` (Usage + Member + Equipment + Trainer)
```sql
SELECT u.Usage_ID, 
       m.Member_Name, m.Membership_Type, 
       e.Equipment_Name, e.Category, 
       t.Trainer_Name, t.Specialization, 
       u.Usage_Date, u.Duration
FROM Equipment_Usage u
JOIN Member m ON u.Member_ID = m.Member_ID
JOIN Equipment e ON u.Equipment_ID = e.Equipment_ID
JOIN Trainer t ON u.Trainer_ID = t.Trainer_ID
ORDER BY u.Usage_Date DESC;
```
*Output:*
| Usage_ID | Member_Name | Membership_Type | Equipment_Name | Category | Trainer_Name | Specialization | Usage_Date | Duration |
|---|---|---|---|---|---|---|---|---|
| U001 | Priya Sharma | Premium | Treadmill | Cardio | Rakish | Cardio | 2026-07-20 | 30 mins |
| U002 | Rahul Kumar | Basic | Dumbbell Set | Free Weight | Karan | Strength | 2026-07-20 | 1 hour |
| U003 | Sneha Patel | Premium | Bench Press | Strength | Karan | Strength | 2026-07-21 | 30 mins |
| U004 | Arjun Singh | Standard | Lat Pulldown | Strength | Allen | Weight Loss | 2026-06-22 | 45 mins |
| U005 | Rakesh | Premium | Treadmill | Cardio | Rakish | Cardio | 2026-05-23 | 1 hour |

---

### Query 4: Members with Overdue / Pending Membership Fees
- **Objective:** Filter for members with outstanding balances for front-desk follow-up.
- **Concepts:** `INNER JOIN`, `WHERE` filtering
```sql
SELECT p.Payment_ID, m.Member_ID, m.Member_Name, m.Phone, 
       p.Amount, p.Payment_Date, p.Payment_Mode, p.Payment_Status
FROM Payment p
JOIN Member m ON p.Member_ID = m.Member_ID
WHERE p.Payment_Status = 'Pending';
```
*Output:*
| Payment_ID | Member_ID | Member_Name | Phone | Amount | Payment_Date | Payment_Mode | Payment_Status |
|---|---|---|---|---|---|---|---|
| P003 | M003 | Sneha Patel | 9876521200 | 12000.00 | 2026-07-04 | Cash | Pending |

---

### Query 5: Trainer Supervision Workload & Client Reach
- **Objective:** Evaluate instructor activity by counting total supervised sessions and distinct gym members assisted.
- **Concepts:** `LEFT JOIN`, `GROUP BY`, `COUNT(DISTINCT)`
```sql
SELECT t.Trainer_ID, t.Trainer_Name, t.Specialization, t.Experience,
       COUNT(u.Usage_ID) AS Sessions_Supervised,
       COUNT(DISTINCT u.Member_ID) AS Distinct_Members_Trained
FROM Trainer t
LEFT JOIN Equipment_Usage u ON t.Trainer_ID = u.Trainer_ID
GROUP BY t.Trainer_ID, t.Trainer_Name, t.Specialization, t.Experience;
```
*Output:*
| Trainer_ID | Trainer_Name | Specialization | Experience | Sessions_Supervised | Distinct_Members_Trained |
|---|---|---|---|---|---|
| T001 | Karan | Strength | 6 years | 2 | 2 |
| T002 | Rakish | Cardio | 4 years | 2 | 2 |
| T003 | Allen | Weight Loss | 5 years | 1 | 1 |

---

### Query 6: Equipment Popularity & Utilization Ranking
- **Objective:** Identify the most frequently used gym machines to plan layout and future equipment purchases.
- **Concepts:** `LEFT JOIN`, `GROUP BY`, `COUNT()`, `ORDER BY DESC`
```sql
SELECT e.Equipment_ID, e.Equipment_Name, e.Category, e.Status,
       COUNT(u.Usage_ID) AS Total_Usage_Count
FROM Equipment e
LEFT JOIN Equipment_Usage u ON e.Equipment_ID = u.Equipment_ID
GROUP BY e.Equipment_ID, e.Equipment_Name, e.Category, e.Status
ORDER BY Total_Usage_Count DESC;
```
*Output:*
| Equipment_ID | Equipment_Name | Category | Status | Total_Usage_Count |
|---|---|---|---|---|
| E101 | Treadmill | Cardio | Available | 2 |
| E102 | Bench Press | Strength | Available | 1 |
| E103 | Dumbbell Set | Free Weight | Available | 1 |
| E105 | Lat Pulldown | Strength | Maintenance | 1 |
| E104 | Exercise Bike | Cardio | Available | 0 |

---

### Query 7: Revenue Collected by Payment Mode with Minimum Threshold
- **Objective:** Aggregate paid transactions by payment channel and display only modes that brought in ₹5,000 or more.
- **Concepts:** `GROUP BY`, `HAVING SUM() >= threshold`, `WHERE`
```sql
SELECT Payment_Mode, 
       COUNT(Payment_ID) AS Transaction_Count, 
       SUM(Amount) AS Total_Revenue
FROM Payment
WHERE Payment_Status = 'Paid'
GROUP BY Payment_Mode
HAVING SUM(Amount) >= 5000;
```
*Output:*
| Payment_Mode | Transaction_Count | Total_Revenue |
|---|---|---|
| Card | 1 | 8000.00 |
| UPI | 1 | 12000.00 |

---

### Query 8: High Maintenance Cost Operations Above Average
- **Objective:** Retrieve all maintenance actions whose cost was strictly above the gym's mean maintenance expense.
- **Concepts:** Nested Subquery with `AVG()` in `WHERE` clause
```sql
SELECT m.Maintenance_ID, e.Equipment_Name, m.Technician_Name, m.Cost, m.Remarks
FROM Maintenance m
JOIN Equipment e ON m.Equipment_ID = e.Equipment_ID
WHERE m.Cost > (SELECT AVG(Cost) FROM Maintenance);
```
*Output:*
| Maintenance_ID | Equipment_Name | Technician_Name | Cost | Remarks |
|---|---|---|---|---|
| MT001 | Exercise Bike | Rajesh | 2500.00 | Belt Replacement |

*(Note: Mean cost is $(2500 + 1200 + 1800)/3 = 1833.33$. MT001 at 2500 is above average).*

---

### Query 9: Consolidated Member Profile & Activity Summary via VIEW
- **Objective:** Query the predefined relational database VIEW combining member details, workout frequency, and billing totals.
- **Concepts:** `SELECT FROM SQL VIEW`
```sql
SELECT Member_ID, Member_Name, Membership_Type, Phone, 
       Total_Workouts, Total_Paid_Amount, Latest_Payment_Status
FROM View_Member_Summary;
```
*Output:*
| Member_ID | Member_Name | Membership_Type | Phone | Total_Workouts | Total_Paid_Amount | Latest_Payment_Status |
|---|---|---|---|---|---|---|
| M001 | Priya Sharma | Premium | 9876543210 | 1 | 12000.00 | Paid |
| M002 | Rahul Kumar | Basic | 9876543211 | 1 | 8000.00 | Paid |
| M003 | Sneha Patel | Premium | 9876521200 | 1 | 0.00 | Pending |
| M004 | Arjun Singh | Standard | 9876543213 | 1 | 0.00 | None |
| M005 | Rakesh | Premium | 9901567822 | 1 | 0.00 | None |

---

### Query 10: Equipment Operational Health Diagnostic & Maintenance Advisory
- **Objective:** Automatically assess machines and issue an operational health diagnosis based on condition and maintenance status.
- **Concepts:** `CASE WHEN` conditional expression, `LEFT JOIN`, `GROUP BY`
```sql
SELECT e.Equipment_ID, e.Equipment_Name, e.Condition, e.Status,
       COUNT(m.Maintenance_ID) AS Past_Repairs_Count,
       CASE 
         WHEN e.Status = 'Maintenance' THEN 'Urgent Service Required'
         WHEN e.Condition = 'Fair' THEN 'Inspection Recommended'
         ELSE 'Operational & Fit'
       END AS Health_Advisory
FROM Equipment e
LEFT JOIN Maintenance m ON e.Equipment_ID = m.Equipment_ID
GROUP BY e.Equipment_ID, e.Equipment_Name, e.Condition, e.Status;
```
*Output:*
| Equipment_ID | Equipment_Name | Condition | Status | Past_Repairs_Count | Health_Advisory |
|---|---|---|---|---|---|
| E101 | Treadmill | Good | Available | 1 | Operational & Fit |
| E102 | Bench Press | Good | Available | 1 | Operational & Fit |
| E103 | Dumbbell Set | Fair | Available | 0 | Inspection Recommended |
| E104 | Exercise Bike | Fair | Available | 1 | Inspection Recommended |
| E105 | Lat Pulldown | Good | Maintenance | 0 | Urgent Service Required |

---

## 6. PL/SQL IMPLEMENTATION

### 6.1 Database Trigger: Synchronize Equipment Status on Maintenance
```sql
CREATE OR REPLACE TRIGGER trg_equipment_status_sync
AFTER INSERT ON Maintenance
FOR EACH ROW
BEGIN
    UPDATE Equipment
    SET Status = 'Maintenance'
    WHERE Equipment_ID = :NEW.Equipment_ID;
END;
/
```

### 6.2 Database Trigger: Payment Amount Integrity Check
```sql
CREATE OR REPLACE TRIGGER trg_validate_payment
BEFORE INSERT OR UPDATE ON Payment
FOR EACH ROW
BEGIN
    IF :NEW.Amount <= 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Payment amount must be greater than zero.');
    END IF;
END;
/
```

### 6.3 Stored Procedure: Safe Maintenance Logging
```sql
CREATE OR REPLACE PROCEDURE sp_RecordMaintenance (
    p_maint_id    IN Maintenance.Maintenance_ID%TYPE,
    p_equip_id    IN Maintenance.Equipment_ID%TYPE,
    p_maint_date  IN Maintenance.Maintenance_Date%TYPE,
    p_tech_name   IN Maintenance.Technician_Name%TYPE,
    p_cost        IN Maintenance.Cost%TYPE,
    p_remarks     IN Maintenance.Remarks%TYPE
) AS
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM Equipment WHERE Equipment_ID = p_equip_id;
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'Equipment ID does not exist.');
    END IF;

    INSERT INTO Maintenance (Maintenance_ID, Equipment_ID, Maintenance_Date, Technician_Name, Cost, Remarks)
    VALUES (p_maint_id, p_equip_id, p_maint_date, p_tech_name, p_cost, p_remarks);

    UPDATE Equipment SET Status = 'Maintenance' WHERE Equipment_ID = p_equip_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
END;
/
```

### 6.4 Stored Function: Calculate Cumulative Paid Amount per Member
```sql
CREATE OR REPLACE FUNCTION fn_GetMemberTotalPaid (
    p_member_id IN Member.Member_ID%TYPE
) RETURN NUMBER AS
    v_total NUMBER := 0;
BEGIN
    SELECT NVL(SUM(Amount), 0)
    INTO v_total
    FROM Payment
    WHERE Member_ID = p_member_id AND Payment_Status = 'Paid';
    
    RETURN v_total;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
    WHEN OTHERS THEN
        RETURN -1;
END;
/
```

### 6.5 Explicit Cursor: Pending Dues Reminder
```sql
DECLARE
    CURSOR cur_pending_payments IS
        SELECT p.Payment_ID, m.Member_Name, m.Phone, p.Amount, p.Payment_Date
        FROM Payment p
        JOIN Member m ON p.Member_ID = m.Member_ID
        WHERE p.Payment_Status = 'Pending';
        
    v_rec cur_pending_payments%ROWTYPE;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Pending Dues Notification List:');
    OPEN cur_pending_payments;
    LOOP
        FETCH cur_pending_payments INTO v_rec;
        EXIT WHEN cur_pending_payments%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(
            'Member: ' || v_rec.Member_Name || 
            ' | Phone: ' || v_rec.Phone || 
            ' | Due: INR ' || v_rec.Amount
        );
    END LOOP;
    CLOSE cur_pending_payments;
END;
/
```

---

## 7. FRONTEND USER INTERFACE & CRUD FUNCTIONALITY

The frontend is an interactive Single Page Application (SPA) with a modern dark theme and athletic accents.

### Interface Highlights:
1. **Interactive Dashboard:**
   - Real-time stat counters: Total Members, Equipment Count, Machines Under Maintenance, Active Trainers, and Revenue.
   - Quick table view of latest member enrollments.
2. **Dedicated Table Views with Full CRUD:**
   - **Create (Insert):** Modal with relational dropdowns for Foreign Keys (e.g. choose Member and Equipment by name).
   - **Read:** Formatted tables with color-coded status badges, formatted currency, and live search.
   - **Update:** Pre-populated edit modal preserving primary key integrity.
   - **Delete:** Protected deletion modal with foreign key warning alerts.
3. **Query Lab (10 Queries):**
   - Each query has its own card displaying the business objective, SQL query code, relational concepts, a "Copy SQL" button, and a live "Run Query" button that displays output in a rendered table.
4. **Interactive SQL Console:**
   - Run any valid SQL query directly against the SQLite backend with real-time execution statistics.
5. **Database Reset Function:**
   - One-click restoration of initial DA-1 data to test and verify multiple evaluation runs.

---

## 8. INSTRUCTIONS TO RUN THE SYSTEM

1. Open your terminal in the project directory:
   ```bash
   cd gym-management-system
   ```
2. Start the local server:
   ```bash
   node server.js
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
4. Access the web interface to demonstrate CRUD operations, run the 10 queries, and present the live report.
