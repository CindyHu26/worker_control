-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Automatic Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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


-- 2. Timeline Calculation Logic
CREATE OR REPLACE FUNCTION calculate_timelines()
RETURNS TRIGGER AS $$
DECLARE
    v_entry DATE;
BEGIN
    -- Determine base date: first try flight_arrival_date, then entry_date, then start_date
    v_entry := COALESCE(NEW.flight_arrival_date, NEW.entry_date, NEW.start_date);
    
    IF v_entry IS NOT NULL THEN
        INSERT INTO worker_timelines (
            id,
            deployment_id,
            entry_report_deadline,
            med_check_6mo_deadline,
            med_check_18mo_deadline,
            med_check_30mo_deadline
        ) VALUES (
            uuid_generate_v4(),
            NEW.id,
            v_entry + INTERVAL '3 days',
            v_entry + INTERVAL '6 months',
            v_entry + INTERVAL '18 months',
            v_entry + INTERVAL '30 months'
        )
        ON CONFLICT (deployment_id) DO UPDATE SET
            entry_report_deadline = EXCLUDED.entry_report_deadline,
            med_check_6mo_deadline = EXCLUDED.med_check_6mo_deadline,
            med_check_18mo_deadline = EXCLUDED.med_check_18mo_deadline,
            med_check_30mo_deadline = EXCLUDED.med_check_30mo_deadline;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_timelines ON deployments;
CREATE TRIGGER trigger_calculate_timelines
AFTER INSERT OR UPDATE OF entry_date, flight_arrival_date, start_date ON deployments
FOR EACH ROW
EXECUTE FUNCTION calculate_timelines();


-- 3. Auto Incident from Health Check
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

DROP TRIGGER IF EXISTS trigger_auto_incident_health_detail ON health_checks;
CREATE TRIGGER trigger_auto_incident_health_detail
AFTER INSERT OR UPDATE OF result ON health_checks
FOR EACH ROW
EXECUTE FUNCTION auto_incident_health_detail();
