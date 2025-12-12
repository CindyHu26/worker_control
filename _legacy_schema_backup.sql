-- =============================================
-- FULL DATABASE SCHEMA: Core + Recruitment + Collaboration + TMS Logic
-- =============================================

-- 1. Setup & Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up (Drop existing types to allow clean recreation)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS deployment_status CASCADE;
DROP TYPE IF EXISTS incident_severity CASCADE;
DROP TYPE IF EXISTS incident_status CASCADE;
DROP TYPE IF EXISTS permit_type CASCADE;
DROP TYPE IF EXISTS health_check_type CASCADE;
DROP TYPE IF EXISTS health_check_result CASCADE;
DROP TYPE IF EXISTS nationality_type CASCADE;
DROP TYPE IF EXISTS worker_category CASCADE;
DROP TYPE IF EXISTS management_source_type CASCADE;
DROP TYPE IF EXISTS service_status CASCADE;
DROP TYPE IF EXISTS staff_role_type CASCADE;
DROP TYPE IF EXISTS insurance_type CASCADE;
DROP TYPE IF EXISTS address_type CASCADE;
DROP TYPE IF EXISTS job_order_status CASCADE;
DROP TYPE IF EXISTS candidate_result CASCADE;

-- 3. Create ENUM types (Core & Extensions)
-- Core Enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE deployment_status AS ENUM ('active', 'ended', 'pending', 'terminated');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE permit_type AS ENUM ('initial', 'extension', 'reissue');
CREATE TYPE health_check_type AS ENUM ('entry', '6mo', '18mo', '30mo', 'supplementary');
CREATE TYPE health_check_result AS ENUM ('pass', 'fail', 'pending');
CREATE TYPE nationality_type AS ENUM ('PH', 'ID', 'VN', 'TH', 'OTHER');
CREATE TYPE worker_category AS ENUM ('general', 'intermediate_skilled', 'professional');
CREATE TYPE management_source_type AS ENUM ('direct_hiring', 're_hiring', 'transfer_in', 'replacement');
CREATE TYPE service_status AS ENUM ('active_service', 'contract_terminated', 'runaway', 'transferred_out', 'commission_ended');
CREATE TYPE staff_role_type AS ENUM ('sales_agent', 'admin_staff', 'bilingual_staff', 'customer_service', 'accountant');
CREATE TYPE insurance_type AS ENUM ('labor', 'health', 'accident');
CREATE TYPE address_type AS ENUM ('approval_letter', 'medical_pickup', 'actual_residence', 'arc', 'work');

-- Extension Enums
CREATE TYPE job_order_status AS ENUM ('open', 'processing', 'completed', 'cancelled');
CREATE TYPE candidate_result AS ENUM ('selected', 'rejected', 'failed_medical', 'pending');

-- 4. Common Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- BASE MODULE: Users, Employers, Workers
-- =============================================

-- internal_users
CREATE TABLE internal_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_internal_users_modtime
BEFORE UPDATE ON internal_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- employers (Extended with TMS Responsible Person Fields)
CREATE TABLE employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_id VARCHAR(20) NOT NULL UNIQUE, -- 統編
    company_name VARCHAR(100) NOT NULL,
    
    -- Responsible Person (Owner) Details
    responsible_person VARCHAR(50),
    responsible_person_dob DATE,
    responsible_person_id_no VARCHAR(20),
    responsible_person_father_name VARCHAR(50),
    responsible_person_mother_name VARCHAR(50),
    responsible_person_spouse VARCHAR(50),
    id_issue_date DATE,
    id_issue_place VARCHAR(50),
    military_status VARCHAR(20), -- e.g. 'exempt', 'served'

    address TEXT,
    phone_number VARCHAR(20),
    
    -- Legacy Fields
    factory_registration_no VARCHAR(50),
    factory_registration_id VARCHAR(50), -- Alias/Alt ID requested
    industry_type VARCHAR(50),
    labor_insurance_no VARCHAR(50),
    labor_insurance_id VARCHAR(50), -- Alias/Alt ID requested
    health_insurance_unit_no VARCHAR(50),
    health_insurance_id VARCHAR(50), -- Alias/Alt ID requested
    email VARCHAR(100),
    fax_number VARCHAR(20),

    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_employers_modtime
BEFORE UPDATE ON employers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- workers (Extended with TMS Financial/Contact Fields)
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    english_name VARCHAR(100) NOT NULL,
    chinese_name VARCHAR(50),
    dob DATE NOT NULL,
    nationality nationality_type NOT NULL,
    category worker_category NOT NULL DEFAULT 'general',
    gender gender_type,
    
    -- Detailed Fields
    mobile_phone VARCHAR(50),
    foreign_address TEXT,
    marital_status VARCHAR(20),
    marriage_date DATE,
    divorce_date DATE,
    height NUMERIC(5,2), -- cm
    weight NUMERIC(5,2), -- kg
    birth_place VARCHAR(100),
    education_level VARCHAR(50),
    spouse_name VARCHAR(100),
    
    -- Overseas Contact
    overseas_contact_phone VARCHAR(50),
    overseas_family_contact VARCHAR(100), -- Name/Rel
    
    -- Financial / Exit / Services
    bank_account_no VARCHAR(50),
    bank_code VARCHAR(20),
    loan_bank VARCHAR(50),
    loan_amount DECIMAL(10,2),
    
    flight_arrival_info VARCHAR(100), -- Free text or could be structured
    one_stop_service_serial VARCHAR(50), -- Orientation Serial
    
    flight_departure VARCHAR(20),

    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_workers_modtime
BEFORE UPDATE ON workers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RECRUITMENT MODULE (Depends on Emp & Workers)
-- =============================================

-- Job Orders
CREATE TABLE job_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_workers INTEGER NOT NULL CHECK (required_workers > 0),
    expected_arrival_date DATE,
    status job_order_status NOT NULL DEFAULT 'open',
    
    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_job_orders_modtime
BEFORE UPDATE ON job_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Interviews
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_order_id UUID NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    interviewer VARCHAR(100),
    
    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_interviews_modtime
BEFORE UPDATE ON interviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Interview Candidates
CREATE TABLE interview_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    result candidate_result NOT NULL DEFAULT 'pending',
    remarks TEXT,
    
    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_interview_candidate UNIQUE (interview_id, worker_id)
);

CREATE TRIGGER update_interview_candidates_modtime
BEFORE UPDATE ON interview_candidates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- LIFECYCLE & CORE MODULES
-- =============================================

-- employer_recruitment_letters
CREATE TABLE employer_recruitment_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    letter_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    approved_quota INTEGER NOT NULL DEFAULT 0,
    used_quota INTEGER NOT NULL DEFAULT 0,
    
    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT check_quota_validity CHECK (used_quota >= 0 AND used_quota <= approved_quota)
);

CREATE TRIGGER update_employer_recruitment_letters_modtime
BEFORE UPDATE ON employer_recruitment_letters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- worker_passports
CREATE TABLE worker_passports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    passport_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    issue_place VARCHAR(100),
    is_current BOOLEAN DEFAULT FALSE,
    
    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_worker_passports_modtime
BEFORE UPDATE ON worker_passports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- worker_arcs
CREATE TABLE worker_arcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    arc_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,

    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_worker_arcs_modtime
BEFORE UPDATE ON worker_arcs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- deployments
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE RESTRICT,
    
    recruitment_letter_id UUID REFERENCES employer_recruitment_letters(id),

    start_date DATE NOT NULL,
    end_date DATE,
    
    status deployment_status NOT NULL DEFAULT 'active',
    service_status service_status NOT NULL DEFAULT 'active_service',
    source_type management_source_type NOT NULL DEFAULT 'direct_hiring',

    job_description TEXT,
    entry_date DATE,
    entry_report_serial VARCHAR(50),
    flight_number VARCHAR(20),
    flight_arrival_date DATE, -- New TMS Field for calculation trigger
    visa_letter_no VARCHAR(50), 
    job_type VARCHAR(50),
    shift VARCHAR(50),

    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_deployments_modtime
BEFORE UPDATE ON deployments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- permit_documents
CREATE TABLE permit_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    permit_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    issuing_authority VARCHAR(100),

    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_permit_documents_modtime
BEFORE UPDATE ON permit_documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- worker_permit_details
CREATE TABLE worker_permit_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permit_document_id UUID NOT NULL REFERENCES permit_documents(id) ON DELETE CASCADE,
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    
    permit_type permit_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_worker_permit_details_modtime
BEFORE UPDATE ON worker_permit_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- worker_timelines (Expanded for TMS)
CREATE TABLE worker_timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    
    med_check_date DATE,           
    arc_expiry_date DATE,          
    entry_report_deadline DATE,
    
    -- TMS Expanded Timelines
    med_check_6mo_deadline DATE,
    med_check_18mo_deadline DATE,
    med_check_30mo_deadline DATE,
    residence_permit_expiry DATE,
    passport_expiry DATE,
    
    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_deployment_timeline UNIQUE (deployment_id)
);

CREATE TRIGGER update_worker_timelines_modtime
BEFORE UPDATE ON worker_timelines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- health_checks
CREATE TABLE health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    check_type health_check_type NOT NULL,
    check_date DATE NOT NULL,
    hospital_name VARCHAR(100),
    result health_check_result NOT NULL DEFAULT 'pending',
    report_date DATE,
    fail_reason TEXT,

    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_health_checks_modtime
BEFORE UPDATE ON health_checks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- incidents
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    severity_level incident_severity NOT NULL,
    status incident_status NOT NULL DEFAULT 'open',
    incident_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    is_auto_generated BOOLEAN DEFAULT FALSE,
    source_ref_id UUID, 

    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_incidents_modtime
BEFORE UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- service_assignments
CREATE TABLE service_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    
    internal_user_id UUID NOT NULL REFERENCES internal_users(id),
    role staff_role_type NOT NULL,
    
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,

    created_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_target_defined CHECK (employer_id IS NOT NULL OR worker_id IS NOT NULL)
);

CREATE INDEX idx_assign_employer_active 
ON service_assignments(employer_id, role) 
WHERE end_date IS NULL AND worker_id IS NULL;

CREATE INDEX idx_assign_worker_active 
ON service_assignments(worker_id, role) 
WHERE end_date IS NULL;

-- worker_insurances
CREATE TABLE worker_insurances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    deployment_id UUID REFERENCES deployments(id),
    type insurance_type NOT NULL,
    
    provider_name VARCHAR(50),
    policy_number VARCHAR(50),
    insured_amount DECIMAL(10, 2),
    
    start_date DATE NOT NULL,
    end_date DATE,
    
    created_by UUID REFERENCES internal_users(id),
    updated_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_worker_insurances_modtime
BEFORE UPDATE ON worker_insurances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- worker_address_history
CREATE TABLE worker_address_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    address_type address_type NOT NULL,
    address_detail TEXT NOT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE,
    
    created_by UUID REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_address_active ON worker_address_history(worker_id, address_type) WHERE end_date IS NULL;

-- =============================================
-- COLLABORATION MODULE (Polymorphic)
-- =============================================

-- System Comments
CREATE TABLE system_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    record_id UUID NOT NULL,
    record_table_name VARCHAR(50) NOT NULL, -- e.g., 'incidents', 'job_orders', 'workers'
    
    content TEXT NOT NULL,
    
    created_by UUID NOT NULL REFERENCES internal_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_comments_record ON system_comments(record_table_name, record_id);

CREATE TRIGGER update_system_comments_modtime
BEFORE UPDATE ON system_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment Mentions
CREATE TABLE comment_mentions (
    comment_id UUID NOT NULL REFERENCES system_comments(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES internal_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (comment_id, mentioned_user_id)
);

-- =============================================
-- VIEWS & AUTOMATION LOGIC
-- =============================================

-- VIEW: view_current_worker_staff
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

-- Logic: Ensure single current passport
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

CREATE TRIGGER trigger_single_current_passport
BEFORE INSERT OR UPDATE ON worker_passports
FOR EACH ROW EXECUTE FUNCTION ensure_single_current_passport();

-- Logic: Ensure single current ARC
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

CREATE TRIGGER trigger_single_current_arc
BEFORE INSERT OR UPDATE ON worker_arcs
FOR EACH ROW EXECUTE FUNCTION ensure_single_current_arc();

-- Logic: Check Job Order Completion (Recruitment)
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

CREATE TRIGGER trigger_check_job_order_completion
AFTER INSERT OR UPDATE ON interview_candidates
FOR EACH ROW
WHEN (NEW.result = 'selected')
EXECUTE FUNCTION check_job_order_completion();

-- =============================================
-- TMS AUTOMATION (New for Requirement 2)
-- =============================================

-- Logic: Auto-Calculate Timelines upon Deployment Entry
CREATE OR REPLACE FUNCTION calculate_timelines()
RETURNS TRIGGER AS $$
DECLARE
    v_entry DATE;
BEGIN
    -- Determine base date: first try flight_arrival_date, then entry_date, then start_date
    v_entry := COALESCE(NEW.flight_arrival_date, NEW.entry_date, NEW.start_date);
    
    IF v_entry IS NOT NULL THEN
        INSERT INTO worker_timelines (
            deployment_id,
            entry_report_deadline,
            med_check_6mo_deadline,
            med_check_18mo_deadline,
            med_check_30mo_deadline
            -- Arc expiry and Passport expiry are data driven, not purely calculated from Entry Date alone 
            -- without other inputs, but we set the logic frame here.
        ) VALUES (
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

CREATE TRIGGER trigger_calculate_timelines
AFTER INSERT OR UPDATE OF entry_date, flight_arrival_date, start_date ON deployments
FOR EACH ROW
EXECUTE FUNCTION calculate_timelines();

-- Logic: Auto-Incident on Failed Health Check
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
            created_by
        ) VALUES (
            uuid_generate_v4(),
            NEW.worker_id,
            (SELECT employer_id FROM deployments WHERE id = NEW.deployment_id LIMIT 1),
            'Health Check Failed: ' || COALESCE(NEW.fail_reason, 'No reason provided'),
            'high',
            'open',
            TRUE,
            NEW.id,
            NEW.created_by -- Attribute to the user who entered the failed record
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_incident_health_detail
AFTER INSERT OR UPDATE OF result ON health_checks
FOR EACH ROW
EXECUTE FUNCTION auto_incident_health_detail();