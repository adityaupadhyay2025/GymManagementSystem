const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, 'gym_management.db');
const db = new DatabaseSync(DB_PATH);

// Enable foreign key enforcement
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  // 1. Create tables according to DA1 Relational Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS Equipment (
      Equipment_ID TEXT PRIMARY KEY,
      Equipment_Name TEXT NOT NULL,
      Category TEXT NOT NULL,
      Brand TEXT NOT NULL,
      Purchase_Date TEXT NOT NULL,
      Condition TEXT NOT NULL,
      Status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Member (
      Member_ID TEXT PRIMARY KEY,
      Member_Name TEXT NOT NULL,
      Age INTEGER NOT NULL,
      Gender TEXT NOT NULL,
      Phone TEXT NOT NULL,
      Membership_Type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Trainer (
      Trainer_ID TEXT PRIMARY KEY,
      Trainer_Name TEXT NOT NULL,
      Phone TEXT NOT NULL,
      Specialization TEXT NOT NULL,
      Experience TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Maintenance (
      Maintenance_ID TEXT PRIMARY KEY,
      Equipment_ID TEXT NOT NULL,
      Maintenance_Date TEXT NOT NULL,
      Technician_Name TEXT NOT NULL,
      Cost REAL NOT NULL,
      Remarks TEXT,
      FOREIGN KEY (Equipment_ID) REFERENCES Equipment(Equipment_ID) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Equipment_Usage (
      Usage_ID TEXT PRIMARY KEY,
      Member_ID TEXT NOT NULL,
      Equipment_ID TEXT NOT NULL,
      Trainer_ID TEXT NOT NULL,
      Usage_Date TEXT NOT NULL,
      Duration TEXT NOT NULL,
      FOREIGN KEY (Member_ID) REFERENCES Member(Member_ID) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (Equipment_ID) REFERENCES Equipment(Equipment_ID) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (Trainer_ID) REFERENCES Trainer(Trainer_ID) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Payment (
      Payment_ID TEXT PRIMARY KEY,
      Member_ID TEXT NOT NULL,
      Amount REAL NOT NULL,
      Payment_Date TEXT NOT NULL,
      Payment_Mode TEXT NOT NULL,
      Payment_Status TEXT NOT NULL,
      FOREIGN KEY (Member_ID) REFERENCES Member(Member_ID) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  // 2. Create Views
  db.exec(`
    DROP VIEW IF EXISTS View_Member_Summary;
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
  `);

  // 3. Create Triggers
  db.exec(`
    DROP TRIGGER IF EXISTS trg_auto_equipment_maintenance;
    CREATE TRIGGER trg_auto_equipment_maintenance
    AFTER INSERT ON Maintenance
    BEGIN
      UPDATE Equipment SET Status = 'Maintenance' WHERE Equipment_ID = NEW.Equipment_ID;
    END;

    DROP TRIGGER IF EXISTS trg_prevent_negative_payment;
    CREATE TRIGGER trg_prevent_negative_payment
    BEFORE INSERT ON Payment
    BEGIN
      SELECT CASE
        WHEN NEW.Amount <= 0 THEN RAISE(ABORT, 'Payment amount must be strictly greater than zero.')
      END;
    END;
  `);

  // 4. Seed data if empty
  const equipmentCount = db.prepare('SELECT COUNT(*) AS count FROM Equipment').get().count;
  if (equipmentCount === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(`
    DELETE FROM Equipment_Usage;
    DELETE FROM Maintenance;
    DELETE FROM Payment;
    DELETE FROM Equipment;
    DELETE FROM Member;
    DELETE FROM Trainer;
  `);
  db.exec('PRAGMA foreign_keys = ON;');

  // Insert Equipment (Exact from DA1 Sample Records)
  const insertEquipment = db.prepare(`
    INSERT INTO Equipment (Equipment_ID, Equipment_Name, Category, Brand, Purchase_Date, Condition, Status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertEquipment.run('E101', 'Treadmill', 'Cardio', 'Alpha', '2024-01-15', 'Good', 'Available');
  insertEquipment.run('E102', 'Bench Press', 'Strength', 'Rogue', '2023-10-11', 'Good', 'Available');
  insertEquipment.run('E103', 'Dumbbell Set', 'Free Weight', 'Power', '2024-03-20', 'Fair', 'Available');
  insertEquipment.run('E104', 'Exercise Bike', 'Cardio', 'Matrix', '2022-09-18', 'Fair', 'Available');
  insertEquipment.run('E105', 'Lat Pulldown', 'Strength', 'Alpha', '2023-07-05', 'Good', 'Maintenance');

  // Insert Member (Exact from DA1 Sample Records)
  const insertMember = db.prepare(`
    INSERT INTO Member (Member_ID, Member_Name, Age, Gender, Phone, Membership_Type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMember.run('M001', 'Priya Sharma', 18, 'Female', '9876543210', 'Premium');
  insertMember.run('M002', 'Rahul Kumar', 22, 'Male', '9876543211', 'Basic');
  insertMember.run('M003', 'Sneha Patel', 21, 'Female', '9876521200', 'Premium');
  insertMember.run('M004', 'Arjun Singh', 19, 'Male', '9876543213', 'Standard');
  insertMember.run('M005', 'Rakesh', 23, 'Male', '9901567822', 'Premium');

  // Insert Trainer (Exact from DA1 Sample Records)
  const insertTrainer = db.prepare(`
    INSERT INTO Trainer (Trainer_ID, Trainer_Name, Phone, Specialization, Experience)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertTrainer.run('T001', 'Karan', '9998270111', 'Strength', '6 years');
  insertTrainer.run('T002', 'Rakish', '9998370112', 'Cardio', '4 years');
  insertTrainer.run('T003', 'Allen', '9998470114', 'Weight Loss', '5 years');

  // Insert Maintenance (Exact from DA1 Sample Records)
  const insertMaintenance = db.prepare(`
    INSERT INTO Maintenance (Maintenance_ID, Equipment_ID, Maintenance_Date, Technician_Name, Cost, Remarks)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMaintenance.run('MT001', 'E104', '2026-10-07', 'Rajesh', 2500, 'Belt Replacement');
  insertMaintenance.run('MT002', 'E102', '2026-05-25', 'Suresh', 1200, 'Lubrication');
  insertMaintenance.run('MT003', 'E101', '2026-05-18', 'Amit', 1800, 'Motor Check');

  // Insert Equipment_Usage (Exact from DA1 Sample Records)
  const insertUsage = db.prepare(`
    INSERT INTO Equipment_Usage (Usage_ID, Member_ID, Equipment_ID, Trainer_ID, Usage_Date, Duration)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertUsage.run('U001', 'M001', 'E101', 'T002', '2026-07-20', '30 mins');
  insertUsage.run('U002', 'M002', 'E103', 'T001', '2026-07-20', '1 hour');
  insertUsage.run('U003', 'M003', 'E102', 'T001', '2026-07-21', '30 mins');
  insertUsage.run('U004', 'M004', 'E105', 'T003', '2026-06-22', '45 mins');
  insertUsage.run('U005', 'M005', 'E101', 'T002', '2026-05-23', '1 hour');

  // Insert Payment (Exact from DA1 Sample Records)
  const insertPayment = db.prepare(`
    INSERT INTO Payment (Payment_ID, Member_ID, Amount, Payment_Date, Payment_Mode, Payment_Status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertPayment.run('P001', 'M001', 12000, '2026-05-01', 'UPI', 'Paid');
  insertPayment.run('P002', 'M002', 8000, '2026-06-03', 'Card', 'Paid');
  insertPayment.run('P003', 'M003', 12000, '2026-07-04', 'Cash', 'Pending');

  console.log('Database seeded successfully with DA1 sample records.');
}

module.exports = {
  db,
  initDatabase,
  seedDatabase
};
