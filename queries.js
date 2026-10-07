const QUERIES = [
  {
    id: 1,
    title: 'Equipment Maintenance History & Technician Log',
    category: 'INNER JOIN',
    objective: 'Retrieve all maintenance records with equipment name, category, brand, and technician details sorted by date.',
    concept: 'INNER JOIN, ORDER BY',
    sql: `SELECT m.Maintenance_ID, e.Equipment_Name, e.Category, e.Brand, 
       m.Maintenance_Date, m.Technician_Name, m.Cost, m.Remarks
FROM Maintenance m
JOIN Equipment e ON m.Equipment_ID = e.Equipment_ID
ORDER BY m.Maintenance_Date DESC;`
  },
  {
    id: 2,
    title: 'Total Maintenance Cost Grouped by Equipment Category',
    category: 'GROUP BY & AGGREGATE',
    objective: 'Calculate the total repair expenditure and average service cost for each equipment category (Cardio, Strength, etc.).',
    concept: 'GROUP BY, SUM(), COUNT(), ROUND(AVG())',
    sql: `SELECT e.Category, 
       COUNT(m.Maintenance_ID) AS Total_Services, 
       SUM(m.Cost) AS Total_Cost, 
       ROUND(AVG(m.Cost), 2) AS Avg_Cost_Per_Service
FROM Equipment e
JOIN Maintenance m ON e.Equipment_ID = m.Equipment_ID
GROUP BY e.Category;`
  },
  {
    id: 3,
    title: 'Workout Session Log with Member, Machine & Trainer Details',
    category: 'MULTI-TABLE JOIN (4 TABLES)',
    objective: 'Display human-readable workout logs by joining Usage with Member, Equipment, and Trainer tables.',
    concept: '4-Table INNER JOIN',
    sql: `SELECT u.Usage_ID, 
       m.Member_Name, m.Membership_Type, 
       e.Equipment_Name, e.Category, 
       t.Trainer_Name, t.Specialization, 
       u.Usage_Date, u.Duration
FROM Equipment_Usage u
JOIN Member m ON u.Member_ID = m.Member_ID
JOIN Equipment e ON u.Equipment_ID = e.Equipment_ID
JOIN Trainer t ON u.Trainer_ID = t.Trainer_ID
ORDER BY u.Usage_Date DESC;`
  },
  {
    id: 4,
    title: 'Members with Pending Dues & Contact Information',
    category: 'JOIN & WHERE FILTER',
    objective: 'Identify members who have pending payment statuses along with their telephone numbers for front-desk follow up.',
    concept: 'INNER JOIN, WHERE Clause',
    sql: `SELECT p.Payment_ID, m.Member_ID, m.Member_Name, m.Phone, 
       p.Amount, p.Payment_Date, p.Payment_Mode, p.Payment_Status
FROM Payment p
JOIN Member m ON p.Member_ID = m.Member_ID
WHERE p.Payment_Status = 'Pending';`
  },
  {
    id: 5,
    title: 'Trainer Workload & Distinct Members Coached',
    category: 'LEFT JOIN & GROUP BY',
    objective: 'Analyze trainer engagement by counting total supervised sessions and number of distinct members coached.',
    concept: 'LEFT JOIN, GROUP BY, COUNT(DISTINCT)',
    sql: `SELECT t.Trainer_ID, t.Trainer_Name, t.Specialization, t.Experience,
       COUNT(u.Usage_ID) AS Sessions_Supervised,
       COUNT(DISTINCT u.Member_ID) AS Distinct_Members_Trained
FROM Trainer t
LEFT JOIN Equipment_Usage u ON t.Trainer_ID = u.Trainer_ID
GROUP BY t.Trainer_ID, t.Trainer_Name, t.Specialization, t.Experience;`
  },
  {
    id: 6,
    title: 'Most Utilized Gym Equipment Ranked by Usage Count',
    category: 'GROUP BY & ORDER BY',
    objective: 'Identify the most popular machines among gym members to assist in equipment layout and maintenance planning.',
    concept: 'LEFT JOIN, GROUP BY, COUNT(), ORDER BY DESC',
    sql: `SELECT e.Equipment_ID, e.Equipment_Name, e.Category, e.Status,
       COUNT(u.Usage_ID) AS Total_Usage_Count
FROM Equipment e
LEFT JOIN Equipment_Usage u ON e.Equipment_ID = u.Equipment_ID
GROUP BY e.Equipment_ID, e.Equipment_Name, e.Category, e.Status
ORDER BY Total_Usage_Count DESC;`
  },
  {
    id: 7,
    title: 'Revenue Collected by Payment Mode with Minimum Threshold',
    category: 'GROUP BY & HAVING',
    objective: 'Group paid transactions by mode (UPI, Card, Cash) and filter only channels that collected at least 5000.',
    concept: 'GROUP BY, HAVING SUM() >= threshold',
    sql: `SELECT Payment_Mode, 
       COUNT(Payment_ID) AS Transaction_Count, 
       SUM(Amount) AS Total_Revenue
FROM Payment
WHERE Payment_Status = 'Paid'
GROUP BY Payment_Mode
HAVING SUM(Amount) >= 5000;`
  },
  {
    id: 8,
    title: 'Repairs Exceeding the Gym Average Maintenance Cost',
    category: 'NESTED SUBQUERY',
    objective: 'Find all maintenance tasks whose cost exceeded the overall average maintenance expenditure of the gym.',
    concept: 'Subquery with AVG() in WHERE clause',
    sql: `SELECT m.Maintenance_ID, e.Equipment_Name, m.Technician_Name, m.Cost, m.Remarks
FROM Maintenance m
JOIN Equipment e ON m.Equipment_ID = e.Equipment_ID
WHERE m.Cost > (SELECT AVG(Cost) FROM Maintenance);`
  },
  {
    id: 9,
    title: 'Consolidated Member Activity & Financial Summary via View',
    category: 'DATABASE VIEW',
    objective: 'Query the predefined database VIEW that summarizes workout sessions and paid dues for each registered member.',
    concept: 'SELECT FROM SQL VIEW (View_Member_Summary)',
    sql: `SELECT Member_ID, Member_Name, Membership_Type, Phone, 
       Total_Workouts, Total_Paid_Amount, Latest_Payment_Status
FROM View_Member_Summary;`
  },
  {
    id: 10,
    title: 'Equipment Health Diagnostic & Maintenance Advisory Report',
    category: 'CONDITIONAL CASE & GROUP BY',
    objective: 'Classify equipment operational health into automated advisories based on machine status and condition.',
    concept: 'CASE WHEN expression, LEFT JOIN, GROUP BY',
    sql: `SELECT e.Equipment_ID, e.Equipment_Name, e.Condition, e.Status,
       COUNT(m.Maintenance_ID) AS Past_Repairs_Count,
       CASE 
         WHEN e.Status = 'Maintenance' THEN 'Urgent Service Required'
         WHEN e.Condition = 'Fair' THEN 'Inspection Recommended'
         ELSE 'Operational & Fit'
       END AS Health_Advisory
FROM Equipment e
LEFT JOIN Maintenance m ON e.Equipment_ID = m.Equipment_ID
GROUP BY e.Equipment_ID, e.Equipment_Name, e.Condition, e.Status;`
  }
];

module.exports = QUERIES;
