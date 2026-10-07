-- =======================================================================
-- GYM MANAGEMENT SYSTEM (DA-2 DBMS IMPLEMENTATION)
-- SAMPLE POPULATION DATA DML (Exactly from DA-1 Submissions)
-- =======================================================================

-- 1. POPULATE EQUIPMENT
INSERT INTO Equipment (Equipment_ID, Equipment_Name, Category, Brand, Purchase_Date, Condition, Status) VALUES
('E101', 'Treadmill', 'Cardio', 'Alpha', '2024-01-15', 'Good', 'Available'),
('E102', 'Bench Press', 'Strength', 'Rogue', '2023-11-10', 'Good', 'Available'),
('E103', 'Dumbbell Set', 'Free Weight', 'Power', '2024-03-20', 'Fair', 'Available'),
('E104', 'Exercise Bike', 'Cardio', 'Matrix', '2022-09-18', 'Fair', 'Available'),
('E105', 'Lat Pulldown', 'Strength', 'Alpha', '2023-07-05', 'Good', 'Maintenance');

-- 2. POPULATE MEMBER
INSERT INTO Member (Member_ID, Member_Name, Age, Gender, Phone, Membership_Type) VALUES
('M001', 'Priya Sharma', 18, 'Female', '9876543210', 'Premium'),
('M002', 'Rahul Kumar', 22, 'Male', '9876543211', 'Basic'),
('M003', 'Sneha Patel', 21, 'Female', '9876521200', 'Premium'),
('M004', 'Arjun Singh', 19, 'Male', '9876543213', 'Standard'),
('M005', 'Rakesh', 23, 'Male', '9901567822', 'Premium');

-- 3. POPULATE TRAINER
INSERT INTO Trainer (Trainer_ID, Trainer_Name, Phone, Specialization, Experience) VALUES
('T001', 'Karan', '9998270111', 'Strength', '6 years'),
('T002', 'Rakish', '9998370112', 'Cardio', '4 years'),
('T003', 'Allen', '9998470114', 'Weight Loss', '5 years');

-- 4. POPULATE MAINTENANCE
INSERT INTO Maintenance (Maintenance_ID, Equipment_ID, Maintenance_Date, Technician_Name, Cost, Remarks) VALUES
('MT001', 'E104', '2026-10-07', 'Rajesh', 2500.00, 'Belt Replacement'),
('MT002', 'E102', '2026-05-25', 'Suresh', 1200.00, 'Lubrication'),
('MT003', 'E101', '2026-05-18', 'Amit', 1800.00, 'Motor Check');

-- 5. POPULATE EQUIPMENT_USAGE
INSERT INTO Equipment_Usage (Usage_ID, Member_ID, Equipment_ID, Trainer_ID, Usage_Date, Duration) VALUES
('U001', 'M001', 'E101', 'T002', '2026-07-20', '30 mins'),
('U002', 'M002', 'E103', 'T001', '2026-07-20', '1 hour'),
('U003', 'M003', 'E102', 'T001', '2026-07-21', '30 mins'),
('U004', 'M004', 'E105', 'T003', '2026-06-22', '45 mins'),
('U005', 'M005', 'E101', 'T002', '2026-05-23', '1 hour');

-- 6. POPULATE PAYMENT
INSERT INTO Payment (Payment_ID, Member_ID, Amount, Payment_Date, Payment_Mode, Payment_Status) VALUES
('P001', 'M001', 12000.00, '2026-05-01', 'UPI', 'Paid'),
('P002', 'M002', 8000.00, '2026-06-03', 'Card', 'Paid'),
('P003', 'M003', 12000.00, '2026-07-04', 'Cash', 'Pending');
