-- =======================================================================
-- GYM MANAGEMENT SYSTEM (DA-2 DBMS IMPLEMENTATION)
-- 10 ESSENTIAL DATABASE QUERIES (JOIN, GROUP BY, HAVING, VIEW, SUBQUERY)
-- =======================================================================

-- -----------------------------------------------------------------------
-- QUERY 1: Equipment Maintenance History & Service Log
-- Concept: Two-Table INNER JOIN with ORDER BY
-- Objective: Retrieve detailed maintenance logs joined with equipment names,
--            category, brand, and cost, ordered by the latest service date.
-- -----------------------------------------------------------------------
SELECT 
    m.Maintenance_ID,
    e.Equipment_Name,
    e.Category,
    e.Brand,
    m.Maintenance_Date,
    m.Technician_Name,
    m.Cost,
    m.Remarks
FROM Maintenance m
JOIN Equipment e ON m.Equipment_ID = e.Equipment_ID
ORDER BY m.Maintenance_Date DESC;


-- -----------------------------------------------------------------------
-- QUERY 2: Total Maintenance Expenditure by Equipment Category
-- Concept: GROUP BY with Aggregate Functions (COUNT, SUM, AVG)
-- Objective: Calculate the cumulative maintenance costs and average repair
--            expense across each equipment category (Cardio, Strength, etc.).
-- -----------------------------------------------------------------------
SELECT 
    e.Category,
    COUNT(m.Maintenance_ID) AS Total_Services,
    SUM(m.Cost) AS Total_Maintenance_Cost,
    ROUND(AVG(m.Cost), 2) AS Avg_Cost_Per_Service
FROM Equipment e
JOIN Maintenance m ON e.Equipment_ID = m.Equipment_ID
GROUP BY e.Category;


-- -----------------------------------------------------------------------
-- QUERY 3: Detailed Workout Activity Log (Multi-Table 4-Way JOIN)
-- Concept: 4-Table INNER JOIN
-- Objective: Replace foreign keys in Equipment_Usage with friendly member,
--            machine, and trainer information to produce readable gym activity records.
-- -----------------------------------------------------------------------
SELECT 
    u.Usage_ID,
    m.Member_Name,
    m.Membership_Type,
    e.Equipment_Name,
    e.Category,
    t.Trainer_Name,
    t.Specialization,
    u.Usage_Date,
    u.Duration
FROM Equipment_Usage u
JOIN Member m ON u.Member_ID = m.Member_ID
JOIN Equipment e ON u.Equipment_ID = e.Equipment_ID
JOIN Trainer t ON u.Trainer_ID = t.Trainer_ID
ORDER BY u.Usage_Date DESC;


-- -----------------------------------------------------------------------
-- QUERY 4: Members with Overdue/Pending Membership Dues
-- Concept: INNER JOIN with WHERE Filtering
-- Objective: Display member details and phone contacts who currently have
--            'Pending' payment records for administrative follow-up.
-- -----------------------------------------------------------------------
SELECT 
    p.Payment_ID,
    m.Member_ID,
    m.Member_Name,
    m.Phone,
    p.Amount,
    p.Payment_Date,
    p.Payment_Mode,
    p.Payment_Status
FROM Payment p
JOIN Member m ON p.Member_ID = m.Member_ID
WHERE p.Payment_Status = 'Pending';


-- -----------------------------------------------------------------------
-- QUERY 5: Trainer Supervision Workload & Client Breadth
-- Concept: LEFT OUTER JOIN, GROUP BY, COUNT(DISTINCT)
-- Objective: Measure each trainer's activity by tallying how many sessions
--            they have supervised and the number of unique members they assisted.
-- -----------------------------------------------------------------------
SELECT 
    t.Trainer_ID,
    t.Trainer_Name,
    t.Specialization,
    t.Experience,
    COUNT(u.Usage_ID) AS Sessions_Supervised,
    COUNT(DISTINCT u.Member_ID) AS Distinct_Members_Trained
FROM Trainer t
LEFT JOIN Equipment_Usage u ON t.Trainer_ID = u.Trainer_ID
GROUP BY t.Trainer_ID, t.Trainer_Name, t.Specialization, t.Experience;


-- -----------------------------------------------------------------------
-- QUERY 6: Equipment Popularity & Utilization Ranking
-- Concept: LEFT JOIN, GROUP BY, ORDER BY DESC
-- Objective: Determine which equipment is most frequently utilized by members
--            to optimize future gym floor allocation and inventory purchases.
-- -----------------------------------------------------------------------
SELECT 
    e.Equipment_ID,
    e.Equipment_Name,
    e.Category,
    e.Status,
    COUNT(u.Usage_ID) AS Total_Usage_Count
FROM Equipment e
LEFT JOIN Equipment_Usage u ON e.Equipment_ID = u.Equipment_ID
GROUP BY e.Equipment_ID, e.Equipment_Name, e.Category, e.Status
ORDER BY Total_Usage_Count DESC;


-- -----------------------------------------------------------------------
-- QUERY 7: Total Revenue Grouped by Payment Mode with Minimum Threshold
-- Concept: GROUP BY with HAVING Clause and WHERE Filter
-- Objective: Find total collections per payment method for completed dues,
--            filtering for channels with collections of 5000 or more.
-- -----------------------------------------------------------------------
SELECT 
    Payment_Mode,
    COUNT(Payment_ID) AS Transaction_Count,
    SUM(Amount) AS Total_Revenue
FROM Payment
WHERE Payment_Status = 'Paid'
GROUP BY Payment_Mode
HAVING SUM(Amount) >= 5000;


-- -----------------------------------------------------------------------
-- QUERY 8: High Maintenance Cost Operations Above System Average
-- Concept: Nested Subquery with Comparison Operator
-- Objective: Identify individual maintenance operations where repair cost
--            exceeded the overall average maintenance expenditure of the facility.
-- -----------------------------------------------------------------------
SELECT 
    m.Maintenance_ID,
    e.Equipment_Name,
    m.Technician_Name,
    m.Cost,
    m.Remarks
FROM Maintenance m
JOIN Equipment e ON m.Equipment_ID = e.Equipment_ID
WHERE m.Cost > (SELECT AVG(Cost) FROM Maintenance);


-- -----------------------------------------------------------------------
-- QUERY 9: Consolidated Member Profile & Activity Summary via VIEW
-- Concept: Database VIEW Query
-- Objective: Access an abstracted, pre-aggregated relational VIEW that
--            combines demographic info, workout frequency, and billing totals.
-- -----------------------------------------------------------------------
SELECT 
    Member_ID,
    Member_Name,
    Membership_Type,
    Phone,
    Total_Workouts,
    Total_Paid_Amount,
    Latest_Payment_Status
FROM View_Member_Summary;


-- -----------------------------------------------------------------------
-- QUERY 10: Equipment Operational Health Diagnostic & Maintenance Advisory
-- Concept: Conditional CASE Statement with Aggregation
-- Objective: Categorize machine health and emit an automated maintenance
--            advisory based on current operational status and past repairs.
-- -----------------------------------------------------------------------
SELECT 
    e.Equipment_ID,
    e.Equipment_Name,
    e.Condition,
    e.Status,
    COUNT(m.Maintenance_ID) AS Past_Repairs_Count,
    CASE 
        WHEN e.Status = 'Maintenance' THEN 'Urgent Service Required'
        WHEN e.Condition = 'Fair' THEN 'Inspection Recommended'
        ELSE 'Operational & Fit'
    END AS Health_Advisory
FROM Equipment e
LEFT JOIN Maintenance m ON e.Equipment_ID = m.Equipment_ID
GROUP BY e.Equipment_ID, e.Equipment_Name, e.Condition, e.Status;
