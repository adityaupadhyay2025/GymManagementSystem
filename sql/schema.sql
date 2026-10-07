-- =======================================================================
-- GYM MANAGEMENT SYSTEM (DA-2 DBMS IMPLEMENTATION)
-- RELATIONAL SCHEMA DDL (Compatible with Oracle, SQLite, MySQL, PostgreSQL)
-- Ref: Normalized Relations from DA-1 (1NF, 2NF, 3NF, BCNF)
-- =======================================================================

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
    CONSTRAINT fk_maintenance_equipment 
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
    CONSTRAINT fk_usage_member 
        FOREIGN KEY (Member_ID) REFERENCES Member(Member_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_usage_equipment 
        FOREIGN KEY (Equipment_ID) REFERENCES Equipment(Equipment_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_usage_trainer 
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
    CONSTRAINT fk_payment_member 
        FOREIGN KEY (Member_ID) REFERENCES Member(Member_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =======================================================================
-- RELATIONAL VIEWS
-- =======================================================================

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
