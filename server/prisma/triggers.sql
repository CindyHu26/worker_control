-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SECTION --

-- 1. Automatic Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SECTION --

-- Apply to all tables that have updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_updated_at_timestamp ON %I', t);
        EXECUTE format('CREATE TRIGGER update_updated_at_timestamp BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
    END LOOP;
END;
$$;

-- SECTION --

-- 2. Timeline Calculation Logic (Updated for TMS Deadlines)
CREATE OR REPLACE FUNCTION calculate_timelines()
RETURNS TRIGGER AS $$
DECLARE
    v_entry DATE;
    v_end DATE;
BEGIN
    -- Determine base date: first try flight_arrival_date, then entry_date, then start_date
    v_entry := COALESCE(NEW.flight_arrival_date, NEW.entry_date, NEW.start_date);
    v_end := NEW.end_date;
    
    IF v_entry IS NOT NULL THEN
        INSERT INTO worker_timelines (
            id,
            deployment_id,
            entry_med_check_deadline,
            emp_permit_deadline,
            arc_deadline,
            med_check_6mo_deadline,
            med_check_18mo_deadline,
            med_check_30mo_deadline,
            renewal_window_start,
            renewal_window_end
        ) VALUES (
            uuid_generate_v4(),
            NEW.id,
            v_entry + INTERVAL '3 days',    -- Entry Med Check: 3 days
            v_entry + INTERVAL '3 days',    -- Employment Permit: 3 days (Family)
            v_entry + INTERVAL '15 days',   -- ARC: 15 days
            v_entry + INTERVAL '6 months',
            v_entry + INTERVAL '18 months',
            v_entry + INTERVAL '30 months',
            CASE WHEN v_end IS NOT NULL THEN v_end - INTERVAL '4 months' ELSE NULL END, -- Renewal Start: -4 months
            CASE WHEN v_end IS NOT NULL THEN v_end - INTERVAL '2 months' ELSE NULL END  -- Renewal End: -2 months
        )
        ON CONFLICT (deployment_id) DO UPDATE SET
            entry_med_check_deadline = EXCLUDED.entry_med_check_deadline,
            emp_permit_deadline = EXCLUDED.emp_permit_deadline,
            arc_deadline = EXCLUDED.arc_deadline,
            med_check_6mo_deadline = EXCLUDED.med_check_6mo_deadline,
            med_check_18mo_deadline = EXCLUDED.med_check_18mo_deadline,
            med_check_30mo_deadline = EXCLUDED.med_check_30mo_deadline,
            renewal_window_start = EXCLUDED.renewal_window_start,
            renewal_window_end = EXCLUDED.renewal_window_end;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SECTION --

DROP TRIGGER IF EXISTS trigger_calculate_timelines ON deployments;

-- SECTION --

CREATE TRIGGER trigger_calculate_timelines
AFTER INSERT OR UPDATE OF entry_date, flight_arrival_date, start_date, end_date ON deployments
FOR EACH ROW
EXECUTE FUNCTION calculate_timelines();

-- SECTION --

-- 3. Job Order Timeline Logic (New)
CREATE OR REPLACE FUNCTION calculate_job_order_timelines()
RETURNS TRIGGER AS $$
BEGIN
    -- Local Recruitment Deadline: order_date + 21 days
    NEW.local_recruitment_deadline := NEW.order_date + INTERVAL '21 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SECTION --

DROP TRIGGER IF EXISTS trigger_calculate_job_order_timelines ON job_orders;

-- SECTION --

CREATE TRIGGER trigger_calculate_job_order_timelines
BEFORE INSERT OR UPDATE OF order_date ON job_orders
FOR EACH ROW
EXECUTE FUNCTION calculate_job_order_timelines();

-- SECTION --

-- 4. Auto Incident from Health Check
CREATE OR REPLACE FUNCTION auto_incident_health_detail()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.result = 'fail' THEN
        INSERT INTO incidents (
            id,
            worker_id,
            employer_id,
            description,
            severity_level,
            status,
            is_auto_generated,
            source_ref_id,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            NEW.worker_id,
            (SELECT employer_id FROM deployments WHERE id = NEW.deployment_id LIMIT 1),
            'Health Check Failed: ' || COALESCE(NEW.fail_reason, 'No reason provided'),
            'high',
            'open',
            TRUE,
            NEW.id,
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SECTION --

DROP TRIGGER IF EXISTS trigger_auto_incident_health_detail ON health_checks;

-- SECTION --

CREATE TRIGGER trigger_auto_incident_health_detail
AFTER INSERT OR UPDATE OF result ON health_checks
FOR EACH ROW
EXECUTE FUNCTION auto_incident_health_detail();


-- 5. Data Integrity: Single Current Passport
CREATE OR REPLACE FUNCTION ensure_single_current_passport()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = TRUE THEN
        UPDATE worker_passports
        SET is_current = FALSE
        WHERE worker_id = NEW.worker_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_current_passport ON worker_passports;

CREATE TRIGGER trigger_single_current_passport
BEFORE INSERT OR UPDATE ON worker_passports
FOR EACH ROW EXECUTE FUNCTION ensure_single_current_passport();

-- 6. Data Integrity: Single Current ARC
CREATE OR REPLACE FUNCTION ensure_single_current_arc()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = TRUE THEN
        UPDATE worker_arcs
        SET is_current = FALSE
        WHERE worker_id = NEW.worker_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_current_arc ON worker_arcs;

CREATE TRIGGER trigger_single_current_arc
BEFORE INSERT OR UPDATE ON worker_arcs
FOR EACH ROW EXECUTE FUNCTION ensure_single_current_arc();

-- 7. Job Order Completion Logic
CREATE OR REPLACE FUNCTION check_job_order_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_job_order_id UUID;
    v_required INTEGER;
    v_selected INTEGER;
BEGIN
    SELECT i.job_order_id INTO v_job_order_id
    FROM interviews i
    WHERE i.id = NEW.interview_id;

    IF v_job_order_id IS NOT NULL THEN
        SELECT required_workers INTO v_required
        FROM job_orders
        WHERE id = v_job_order_id;
        
        SELECT COUNT(DISTINCT ic.worker_id) INTO v_selected
        FROM interview_candidates ic
        JOIN interviews i ON ic.interview_id = i.id
        WHERE i.job_order_id = v_job_order_id
          AND ic.result = 'selected';
          
        IF v_selected >= v_required THEN
            UPDATE job_orders
            SET status = 'completed'
            WHERE id = v_job_order_id AND status != 'completed';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_job_order_completion ON interview_candidates;

CREATE TRIGGER trigger_check_job_order_completion
AFTER INSERT OR UPDATE ON interview_candidates
FOR EACH ROW
WHEN (NEW.result = 'selected')
EXECUTE FUNCTION check_job_order_completion();

-- 8. Views
-- Note: Prisma will not manage these, but they are safe to exist in DB.
CREATE OR REPLACE VIEW view_current_worker_staff AS
SELECT 
    w.id AS worker_id,
    w.english_name,
    d.employer_id,
    e.company_name,
    
    COALESCE(u_sales_w.username, u_sales_e.username) as sales_agent_name,
    COALESCE(sa_sales_w.internal_user_id, sa_sales_e.internal_user_id) as sales_agent_id,
    
    COALESCE(u_admin_w.username, u_admin_e.username) as admin_staff_name,
    COALESCE(sa_admin_w.internal_user_id, sa_admin_e.internal_user_id) as admin_staff_id,

    COALESCE(u_bilingual_w.username, u_bilingual_e.username) as bilingual_staff_name,
    COALESCE(sa_bilingual_w.internal_user_id, sa_bilingual_e.internal_user_id) as bilingual_staff_id,

    COALESCE(u_cs_w.username, u_cs_e.username) as customer_service_name,
    COALESCE(sa_cs_w.internal_user_id, sa_cs_e.internal_user_id) as customer_service_id

FROM workers w
JOIN deployments d ON w.id = d.worker_id AND d.status = 'active'
JOIN employers e ON d.employer_id = e.id
LEFT JOIN service_assignments sa_sales_w ON sa_sales_w.worker_id = w.id AND sa_sales_w.role = 'sales_agent' AND sa_sales_w.end_date IS NULL
LEFT JOIN internal_users u_sales_w ON sa_sales_w.internal_user_id = u_sales_w.id
LEFT JOIN service_assignments sa_sales_e ON sa_sales_e.employer_id = e.id AND sa_sales_e.role = 'sales_agent' AND sa_sales_e.worker_id IS NULL AND sa_sales_e.end_date IS NULL
LEFT JOIN internal_users u_sales_e ON sa_sales_e.internal_user_id = u_sales_e.id
LEFT JOIN service_assignments sa_admin_w ON sa_admin_w.worker_id = w.id AND sa_admin_w.role = 'admin_staff' AND sa_admin_w.end_date IS NULL
LEFT JOIN internal_users u_admin_w ON sa_admin_w.internal_user_id = u_admin_w.id
LEFT JOIN service_assignments sa_admin_e ON sa_admin_e.employer_id = e.id AND sa_admin_e.role = 'admin_staff' AND sa_admin_e.worker_id IS NULL AND sa_admin_e.end_date IS NULL
LEFT JOIN internal_users u_admin_e ON sa_admin_e.internal_user_id = u_admin_e.id
LEFT JOIN service_assignments sa_bilingual_w ON sa_bilingual_w.worker_id = w.id AND sa_bilingual_w.role = 'bilingual_staff' AND sa_bilingual_w.end_date IS NULL
LEFT JOIN internal_users u_bilingual_w ON sa_bilingual_w.internal_user_id = u_bilingual_w.id
LEFT JOIN service_assignments sa_bilingual_e ON sa_bilingual_e.employer_id = e.id AND sa_bilingual_e.role = 'bilingual_staff' AND sa_bilingual_e.worker_id IS NULL AND sa_bilingual_e.end_date IS NULL
LEFT JOIN internal_users u_bilingual_e ON sa_bilingual_e.internal_user_id = u_bilingual_e.id
LEFT JOIN service_assignments sa_cs_w ON sa_cs_w.worker_id = w.id AND sa_cs_w.role = 'customer_service' AND sa_cs_w.end_date IS NULL
LEFT JOIN internal_users u_cs_w ON sa_cs_w.internal_user_id = u_cs_w.id
LEFT JOIN service_assignments sa_cs_e ON sa_cs_e.employer_id = e.id AND sa_cs_e.role = 'customer_service' AND sa_cs_e.worker_id IS NULL AND sa_cs_e.end_date IS NULL
LEFT JOIN internal_users u_cs_e ON sa_cs_e.internal_user_id = u_cs_e.id;

-- 9. Custom Indexes (Conditional)
CREATE INDEX IF NOT EXISTS idx_assign_employer_active 
ON service_assignments(employer_id, role) 
WHERE end_date IS NULL AND worker_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_assign_worker_active 
ON service_assignments(worker_id, role) 
WHERE end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_address_active 
ON worker_address_history(worker_id, address_type) 
WHERE end_date IS NULL;
