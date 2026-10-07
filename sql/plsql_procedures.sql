-- =======================================================================
-- GYM MANAGEMENT SYSTEM (DA-2 DBMS IMPLEMENTATION)
-- PL/SQL IMPLEMENTATIONS (STORED PROCEDURES, FUNCTIONS, TRIGGERS, CURSORS)
-- Suitable for Oracle SQL*Plus / Oracle APEX / LiveSQL environments
-- =======================================================================

SET SERVEROUTPUT ON;

-- =======================================================================
-- 1. PL/SQL TRIGGER: Automatic Equipment Status Update
-- Description: When a maintenance record is added, the corresponding
--              equipment's status is automatically set to 'Maintenance'.
-- =======================================================================
CREATE OR REPLACE TRIGGER trg_equipment_status_sync
AFTER INSERT ON Maintenance
FOR EACH ROW
BEGIN
    UPDATE Equipment
    SET Status = 'Maintenance'
    WHERE Equipment_ID = :NEW.Equipment_ID;
    
    DBMS_OUTPUT.PUT_LINE('Trigger Executed: Equipment ' || :NEW.Equipment_ID || ' status set to Maintenance.');
END;
/

-- =======================================================================
-- 2. PL/SQL TRIGGER: Validate Payment Amount
-- Description: Prevents insertion of payments with zero or negative amounts.
-- =======================================================================
CREATE OR REPLACE TRIGGER trg_validate_payment
BEFORE INSERT OR UPDATE ON Payment
FOR EACH ROW
BEGIN
    IF :NEW.Amount <= 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Payment amount must be greater than zero.');
    END IF;
END;
/

-- =======================================================================
-- 3. PL/SQL STORED PROCEDURE: Record New Maintenance Operation
-- Description: Safely logs maintenance details and handles status transitions.
-- =======================================================================
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
    -- Verify equipment exists
    SELECT COUNT(*) INTO v_count FROM Equipment WHERE Equipment_ID = p_equip_id;
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'Equipment ID does not exist.');
    END IF;

    -- Insert maintenance record
    INSERT INTO Maintenance (Maintenance_ID, Equipment_ID, Maintenance_Date, Technician_Name, Cost, Remarks)
    VALUES (p_maint_id, p_equip_id, p_maint_date, p_tech_name, p_cost, p_remarks);

    -- Update Equipment status
    UPDATE Equipment
    SET Status = 'Maintenance'
    WHERE Equipment_ID = p_equip_id;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Maintenance record ' || p_maint_id || ' inserted successfully.');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error in sp_RecordMaintenance: ' || SQLERRM);
END;
/

-- =======================================================================
-- 4. PL/SQL STORED FUNCTION: Calculate Total Paid Fees for a Member
-- Description: Computes cumulative paid revenue for any specific member ID.
-- =======================================================================
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

-- =======================================================================
-- 5. PL/SQL EXPLICIT CURSOR: Pending Payment Notification Generator
-- Description: Scans all pending fee balances and prints administrative
--              billing alerts using an explicit cursor and loop.
-- =======================================================================
DECLARE
    CURSOR cur_pending_payments IS
        SELECT p.Payment_ID, m.Member_Name, m.Phone, p.Amount, p.Payment_Date
        FROM Payment p
        JOIN Member m ON p.Member_ID = m.Member_ID
        WHERE p.Payment_Status = 'Pending';
        
    v_rec cur_pending_payments%ROWTYPE;
    v_counter NUMBER := 0;
BEGIN
    DBMS_OUTPUT.PUT_LINE('====================================================');
    DBMS_OUTPUT.PUT_LINE('       GYM MANAGEMENT - PENDING DUES ALERT          ');
    DBMS_OUTPUT.PUT_LINE('====================================================');
    
    OPEN cur_pending_payments;
    LOOP
        FETCH cur_pending_payments INTO v_rec;
        EXIT WHEN cur_pending_payments%NOTFOUND;
        
        v_counter := v_counter + 1;
        DBMS_OUTPUT.PUT_LINE(
            '[' || v_counter || '] ' || v_rec.Member_Name ||
            ' | Phone: ' || v_rec.Phone ||
            ' | Due: INR ' || v_rec.Amount ||
            ' | Due Date: ' || v_rec.Payment_Date
        );
    END LOOP;
    CLOSE cur_pending_payments;
    
    IF v_counter = 0 THEN
        DBMS_OUTPUT.PUT_LINE('All payments are cleared. No pending dues found.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Total Pending Records: ' || v_counter);
    END IF;
    DBMS_OUTPUT.PUT_LINE('====================================================');
END;
/
