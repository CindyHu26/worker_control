-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'manager', 'staff');

-- CreateEnum
CREATE TYPE "gender_type" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "deployment_status" AS ENUM ('active', 'ended', 'pending', 'terminated');

-- CreateEnum
CREATE TYPE "incident_severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "incident_status" AS ENUM ('open', 'in_progress', 'closed');

-- CreateEnum
CREATE TYPE "permit_type" AS ENUM ('initial', 'extension', 'reissue');

-- CreateEnum
CREATE TYPE "health_check_type" AS ENUM ('entry', '6mo', '18mo', '30mo', 'supplementary');

-- CreateEnum
CREATE TYPE "health_check_result" AS ENUM ('pass', 'fail', 'pending');

-- CreateEnum
CREATE TYPE "worker_category" AS ENUM ('general', 'intermediate_skilled', 'professional');

-- CreateEnum
CREATE TYPE "management_source_type" AS ENUM ('direct_hiring', 're_hiring', 'transfer_in', 'replacement');

-- CreateEnum
CREATE TYPE "service_status" AS ENUM ('active_service', 'contract_terminated', 'runaway', 'transferred_out', 'commission_ended');

-- CreateEnum
CREATE TYPE "staff_role_type" AS ENUM ('sales_agent', 'admin_staff', 'bilingual_staff', 'customer_service', 'accountant');

-- CreateEnum
CREATE TYPE "insurance_type" AS ENUM ('labor', 'health', 'accident');

-- CreateEnum
CREATE TYPE "address_type" AS ENUM ('approval_letter', 'medical_pickup', 'actual_residence', 'arc', 'work');

-- CreateEnum
CREATE TYPE "job_order_status" AS ENUM ('open', 'processing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "candidate_result" AS ENUM ('selected', 'rejected', 'failed_medical', 'pending');

-- CreateEnum
CREATE TYPE "worker_event_type" AS ENUM ('RUNAWAY', 'TRANSFER_OUT', 'DEPARTURE', 'DOMESTIC_HIRE', 'CONTRACT_RENEWAL', 'DEATH', 'OTHER');

-- CreateTable
CREATE TABLE "employer_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name_zh" VARCHAR(50) NOT NULL,
    "name_en" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "title_zh" VARCHAR(100) NOT NULL,
    "title_en" VARCHAR(100) NOT NULL,
    "title_th" VARCHAR(100),
    "title_id" VARCHAR(100),
    "title_vn" VARCHAR(100),
    "employment_security_fee" INTEGER NOT NULL DEFAULT 0,
    "reentry_security_fee" INTEGER NOT NULL DEFAULT 0,
    "agency_accident_insurance" BOOLEAN NOT NULL DEFAULT false,
    "agency_accident_insurance_amount" INTEGER NOT NULL DEFAULT 0,
    "agency_labor_health_insurance" BOOLEAN NOT NULL DEFAULT false,
    "collect_bank_loan" BOOLEAN NOT NULL DEFAULT false,
    "pay_day" INTEGER,
    "requires_medical_checkup" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "category" VARCHAR(5),
    "name_zh" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "name_th" VARCHAR(100),
    "name_vn" VARCHAR(100),
    "name_id" VARCHAR(100),
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_salary_configs" (
    "id" UUID NOT NULL,
    "industry_id" UUID NOT NULL,
    "effective_date" DATE NOT NULL,
    "technical_salary" INTEGER NOT NULL,
    "non_technical_salary" INTEGER NOT NULL,
    "special_tech_salary" INTEGER,
    "special_non_tech_salary" INTEGER,
    "mid_level_salary" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "industry_salary_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_job_titles" (
    "id" UUID NOT NULL,
    "industry_id" UUID NOT NULL,
    "title_zh" VARCHAR(100) NOT NULL,
    "title_en" VARCHAR(100),
    "title_th" VARCHAR(100),
    "title_vn" VARCHAR(100),
    "title_id" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "industry_job_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domestic_agencies" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "agency_name_zh" VARCHAR(100) NOT NULL,
    "agency_name_en" VARCHAR(100),
    "agency_name_short" VARCHAR(50),
    "phone" VARCHAR(20),
    "fax" VARCHAR(20),
    "email" VARCHAR(100),
    "emergency_email" VARCHAR(255),
    "website" VARCHAR(100),
    "customer_service_phone" VARCHAR(20),
    "emergency_phone" VARCHAR(20),
    "zip_code" VARCHAR(5),
    "city_code" VARCHAR(3),
    "address_zh" VARCHAR(200),
    "address_en" VARCHAR(200),
    "representative_name" VARCHAR(50),
    "representative_name_en" VARCHAR(100),
    "representative_id_no" VARCHAR(20),
    "representative_passport" VARCHAR(20),
    "check_payable_to" VARCHAR(50),
    "tax_id" VARCHAR(10),
    "tax_registration_no" VARCHAR(20),
    "permit_number" VARCHAR(20),
    "permit_valid_from" DATE,
    "permit_valid_to" DATE,
    "business_registration_no" VARCHAR(50),
    "postal_account_no" VARCHAR(20),
    "postal_account_name" VARCHAR(100),
    "bank_name" VARCHAR(100),
    "bank_code" VARCHAR(3),
    "bank_branch_code" VARCHAR(4),
    "bank_account_no" VARCHAR(20),
    "bank_account_name" VARCHAR(100),
    "accountant" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "domestic_agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" UUID NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "bank_name_en" VARCHAR(100),
    "contact_person" VARCHAR(50),
    "phone" VARCHAR(30),
    "fax" VARCHAR(30),
    "address" VARCHAR(200),
    "notes" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domestic_agency_bank_accounts" (
    "id" UUID NOT NULL,
    "domestic_agency_id" UUID NOT NULL,
    "bank_id" UUID NOT NULL,
    "agency_unit_code" VARCHAR(12) NOT NULL,
    "agency_account_no" VARCHAR(20) NOT NULL,
    "account_purpose" VARCHAR(100),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "domestic_agency_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_bilateral_trade_licenses" (
    "id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "country" VARCHAR(2) NOT NULL,
    "license_number" VARCHAR(50),
    "valid_from" DATE NOT NULL,
    "valid_to" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agency_bilateral_trade_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_agencies" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "agency_name_zh" VARCHAR(200) NOT NULL,
    "agency_name_zh_short" VARCHAR(100),
    "agency_name_en" VARCHAR(200),
    "agency_name_en_short" VARCHAR(100),
    "phone" VARCHAR(20),
    "fax" VARCHAR(20),
    "email" VARCHAR(100),
    "country" VARCHAR(2),
    "country_name_zh" VARCHAR(20),
    "address_zh" VARCHAR(200),
    "address_en" VARCHAR(200),
    "address_short" VARCHAR(200),
    "contact_person" VARCHAR(50),
    "contact_phone" VARCHAR(20),
    "mailing_address_zh" VARCHAR(200),
    "mailing_address_en" VARCHAR(200),
    "representative_name" VARCHAR(50),
    "representative_name_en" VARCHAR(100),
    "representative_id_no" VARCHAR(20),
    "representative_passport" VARCHAR(20),
    "tax_id" VARCHAR(10),
    "business_registration_no" VARCHAR(50),
    "permit_number" VARCHAR(50),
    "foreign_license_no" VARCHAR(50),
    "foreign_license_expiry" DATE,
    "mol_permit_no" VARCHAR(20),
    "mol_valid_from" DATE,
    "mol_valid_to" DATE,
    "payee_name" VARCHAR(100),
    "bank_name" VARCHAR(100),
    "bank_account_no" VARCHAR(50),
    "bank_address" VARCHAR(200),
    "loan_bank_code" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "partner_agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_agency_bilateral_licenses" (
    "id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "license_number" VARCHAR(50),
    "valid_from" DATE NOT NULL,
    "valid_to" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "partner_agency_bilateral_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_agency_contracts" (
    "id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "contract_no" VARCHAR(50) NOT NULL,
    "contract_type" VARCHAR(50),
    "signed_date" DATE,
    "valid_from" DATE,
    "valid_to" DATE,
    "summary" TEXT,
    "document_path" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "partner_agency_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_banks" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name_zh" VARCHAR(50) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "code" VARCHAR(18) NOT NULL,
    "full_name" VARCHAR(50) NOT NULL,
    "full_name_en" VARCHAR(100),
    "gender" VARCHAR(10),
    "nationality" VARCHAR(20),
    "date_of_birth" DATE,
    "id_number" VARCHAR(20),
    "department_code" VARCHAR(10),
    "employee_number" VARCHAR(10),
    "job_title" VARCHAR(50),
    "domestic_agency_id" UUID,
    "phone" VARCHAR(30),
    "mobile_phone" VARCHAR(30),
    "extension" VARCHAR(12),
    "email" VARCHAR(100),
    "receive_sms" BOOLEAN NOT NULL DEFAULT false,
    "contact_person" VARCHAR(50),
    "contact_phone" VARCHAR(30),
    "mailing_address_zh" VARCHAR(200),
    "mailing_address_en" VARCHAR(200),
    "residential_address_zh" VARCHAR(200),
    "residential_address_en" VARCHAR(200),
    "emergency_contact" VARCHAR(50),
    "emergency_phone" VARCHAR(30),
    "is_sales" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_customer_service" BOOLEAN NOT NULL DEFAULT false,
    "is_accounting" BOOLEAN NOT NULL DEFAULT false,
    "is_bilingual" BOOLEAN NOT NULL DEFAULT false,
    "employer_auto_code" VARCHAR(10),
    "contract_code" VARCHAR(4),
    "contract_seq_used" INTEGER DEFAULT 0,
    "sales_group_code" VARCHAR(10),
    "expertise" VARCHAR(200),
    "postal_account_no" VARCHAR(12),
    "postal_account_name" VARCHAR(100),
    "bank_name" VARCHAR(100),
    "bank_account_name" VARCHAR(100),
    "bank_account_no" VARCHAR(20),
    "hire_date" DATE,
    "insurance_start_date" DATE,
    "resignation_date" DATE,
    "insurance_end_date" DATE,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name_zh" VARCHAR(50) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'staff',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employers" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20),
    "short_name" VARCHAR(50),
    "tax_id" VARCHAR(20),
    "company_name" VARCHAR(100) NOT NULL,
    "company_name_en" VARCHAR(100),
    "responsible_person" VARCHAR(50),
    "address" TEXT,
    "address_en" TEXT,
    "invoice_address" TEXT,
    "tax_address" TEXT,
    "health_bill_address" TEXT,
    "health_bill_zip" VARCHAR(10),
    "phone_number" VARCHAR(20),
    "mobile_phone" VARCHAR(20),
    "email" VARCHAR(100),
    "contact_person" VARCHAR(50),
    "contact_phone" VARCHAR(20),
    "referrer" VARCHAR(50),
    "terminate_date" DATE,
    "created_by" UUID,
    "updated_by" UUID,
    "origin_lead_id" UUID,
    "allocation_rate" DECIMAL(5,4),
    "compliance_standard" VARCHAR(50),
    "zero_fee_effective_date" DATE,
    "industry_attributes" JSONB,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "total_quota" INTEGER NOT NULL DEFAULT 0,
    "agency_id" UUID,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_name" VARCHAR(100) NOT NULL,
    "tax_id" VARCHAR(20),
    "contact_person" VARCHAR(50),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT,
    "industry" VARCHAR(50),
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "estimated_worker_count" INTEGER,
    "assigned_to" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_factories" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "factory_reg_no" VARCHAR(50),
    "address" TEXT,
    "address_en" TEXT,
    "zip_code" VARCHAR(10),
    "city_code" VARCHAR(10),
    "laborCount" INTEGER DEFAULT 0,
    "foreignCount" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_factories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_labor_counts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_labor_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_info" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "factory_registration_no" VARCHAR(50),
    "factory_registration_id" VARCHAR(50),
    "factory_address" TEXT,
    "factory_address_en" TEXT,
    "industry_type" VARCHAR(50),
    "industry_code" VARCHAR(20),
    "capital" DECIMAL(15,2),
    "labor_insurance_no" VARCHAR(50),
    "labor_insurance_id" VARCHAR(50),
    "health_insurance_unit_no" VARCHAR(50),
    "health_insurance_id" VARCHAR(50),
    "security_fee_account" VARCHAR(50),
    "fax_number" VARCHAR(20),
    "institution_code" VARCHAR(50),
    "bed_count" INTEGER,

    CONSTRAINT "corporate_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_info" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "responsible_person_dob" DATE,
    "responsible_person_id_no" VARCHAR(20),
    "responsible_person_father_name" VARCHAR(50),
    "responsible_person_mother_name" VARCHAR(50),
    "responsible_person_spouse" VARCHAR(50),
    "mobile_phone" VARCHAR(20),
    "english_name" VARCHAR(100),
    "birth_place" VARCHAR(50),
    "birth_place_en" VARCHAR(100),
    "residence_address" TEXT,
    "residence_zip" VARCHAR(10),
    "residence_city_code" VARCHAR(10),
    "id_issue_date" DATE,
    "id_issue_place" VARCHAR(50),
    "military_status" VARCHAR(20),
    "military_status_en" VARCHAR(50),
    "patient_name" VARCHAR(50),
    "patient_id_no" VARCHAR(20),
    "care_address" TEXT,
    "relationship" VARCHAR(50),

    CONSTRAINT "individual_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "english_name" VARCHAR(100) NOT NULL,
    "chinese_name" VARCHAR(50),
    "dob" DATE NOT NULL,
    "nationality_id" UUID,
    "category" "worker_category" NOT NULL DEFAULT 'general',
    "gender" "gender_type",
    "mobile_phone" VARCHAR(50),
    "foreign_address" TEXT,
    "marital_status" VARCHAR(20),
    "marriage_date" DATE,
    "divorce_date" DATE,
    "height" DECIMAL(5,2),
    "weight" DECIMAL(5,2),
    "birth_place" VARCHAR(100),
    "education_level" VARCHAR(50),
    "spouse_name" VARCHAR(100),
    "overseas_contact_phone" VARCHAR(50),
    "overseas_family_contact" VARCHAR(100),
    "line_id" VARCHAR(50),
    "religion" VARCHAR(50),
    "emergency_contact_name" VARCHAR(50),
    "emergency_contact_phone" VARCHAR(50),
    "bank_account_no" VARCHAR(50),
    "bank_code" VARCHAR(20),
    "loan_bank" VARCHAR(50),
    "loan_amount" DECIMAL(10,2),
    "flight_arrival_info" VARCHAR(100),
    "one_stop_service_serial" VARCHAR(50),
    "flight_departure" VARCHAR(20),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "foreign_agency_id" UUID,
    "residence_permit_expiry" DATE,
    "passport_expiry" DATE,
    "med_check_6mo_deadline" DATE,
    "med_check_18mo_deadline" DATE,
    "med_check_30mo_deadline" DATE,
    "bed_id" UUID,
    "employerFactoryId" UUID,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_accommodation_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "address" TEXT,
    "dormitory_bed_id" UUID,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_accommodation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relocation_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "old_address" TEXT,
    "new_address" TEXT,
    "notification_type" TEXT NOT NULL DEFAULT 'CHANGE_OF_RESIDENCE',
    "mailing_date" DATE,
    "filing_date" DATE,
    "receipt_date" DATE,
    "receipt_number" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relocation_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_recruitment_letters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "letter_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "valid_until" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "industry_recognition_id" UUID,
    "recruitment_proof_id" UUID,
    "industrial_bureau_ref" VARCHAR(50),
    "industrial_bureau_date" DATE,
    "industry_tier" VARCHAR(10),
    "domestic_recruitment_ref" VARCHAR(50),
    "domestic_recruitment_date" DATE,
    "review_fee_receipt_no" VARCHAR(50),
    "review_fee_pay_date" DATE,
    "review_fee_amount" INTEGER NOT NULL DEFAULT 200,
    "approved_quota" INTEGER NOT NULL DEFAULT 0,
    "used_quota" INTEGER NOT NULL DEFAULT 0,
    "submission_date" DATE,
    "labor_ministry_receipt_date" DATE,
    "issue_unit" VARCHAR(50) DEFAULT '勞動部',
    "issue_word" VARCHAR(50) DEFAULT '勞動發事字',
    "case_number" VARCHAR(50),
    "parent_letter_id" UUID,
    "work_address" TEXT,
    "job_type" VARCHAR(50),
    "job_title" VARCHAR(100),
    "industry_code" VARCHAR(50),
    "project_code" VARCHAR(50),
    "quota_male" INTEGER NOT NULL DEFAULT 0,
    "quota_female" INTEGER NOT NULL DEFAULT 0,
    "recruitment_project_type" VARCHAR(100),
    "apply_for_rehiring_bonus" BOOLEAN NOT NULL DEFAULT false,
    "industry_id" UUID,
    "work_address_type" VARCHAR(50),
    "work_address_factory_id" UUID,
    "recruitment_type" VARCHAR(20),
    "nationality_id" UUID,
    "can_circulate" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employer_recruitment_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_passports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "passport_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "issue_place" VARCHAR(100),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_arcs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "arc_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_arcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "recruitment_letter_id" UUID,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "deployment_status" NOT NULL DEFAULT 'active',
    "service_status" "service_status" NOT NULL DEFAULT 'active_service',
    "source_type" "management_source_type" NOT NULL DEFAULT 'direct_hiring',
    "job_description" TEXT,
    "entry_date" DATE,
    "handover_date" DATE,
    "entry_report_serial" VARCHAR(50),
    "flight_number" VARCHAR(20),
    "flight_arrival_date" DATE,
    "visa_letter_no" VARCHAR(50),
    "job_type" VARCHAR(50),
    "shift" VARCHAR(50),
    "overseas_check_status" VARCHAR(20),
    "overseas_check_date" DATE,
    "contract_type_id" UUID,
    "contract_end_reason_id" UUID,
    "doc_verification_status" VARCHAR(20),
    "doc_submission_date" DATE,
    "doc_verified_date" DATE,
    "visa_status" VARCHAR(20),
    "visa_application_date" DATE,
    "visa_number" VARCHAR(50),
    "termination_reason" VARCHAR(50),
    "termination_notes" TEXT,
    "basic_salary" DECIMAL(10,2),
    "food_amount" DECIMAL(10,2),
    "food_status" VARCHAR(50),
    "factory_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_recognitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "factory_id" UUID,
    "bureau_ref_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "tier" VARCHAR(10) NOT NULL,
    "expiry_date" DATE,
    "allocation_rate" DECIMAL(5,2),
    "extra_rate" DECIMAL(5,2) DEFAULT 0,
    "file_url" TEXT,
    "approved_quota" INTEGER NOT NULL DEFAULT 0,
    "used_quota" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "industry_recognitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_proofs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "receipt_number" VARCHAR(50) NOT NULL,
    "register_date" DATE NOT NULL,
    "issue_date" DATE NOT NULL,
    "job_center" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'VALID',
    "review_fee_receipt_no" VARCHAR(50),
    "review_fee_pay_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruitment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permit_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "permit_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "issuing_authority" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permit_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_permit_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "permit_document_id" UUID NOT NULL,
    "deployment_id" UUID NOT NULL,
    "permit_type" "permit_type" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_permit_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_checks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "deployment_id" UUID NOT NULL,
    "check_type" "health_check_type" NOT NULL,
    "check_date" DATE NOT NULL,
    "hospital_name" VARCHAR(100),
    "result" "health_check_result" NOT NULL DEFAULT 'pending',
    "report_date" DATE,
    "fail_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID,
    "employer_id" UUID,
    "description" TEXT NOT NULL,
    "severity_level" "incident_severity" NOT NULL,
    "status" "incident_status" NOT NULL DEFAULT 'open',
    "incident_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "source_ref_id" UUID,
    "category" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID,
    "worker_id" UUID,
    "internal_user_id" UUID NOT NULL,
    "role" "staff_role_type" NOT NULL,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_insurances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "deployment_id" UUID,
    "type" "insurance_type" NOT NULL,
    "provider_name" VARCHAR(50),
    "policy_number" VARCHAR(50),
    "insured_amount" DECIMAL(10,2),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_address_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "address_type" "address_type" NOT NULL,
    "address_detail" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_address_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "order_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "required_workers" INTEGER NOT NULL,
    "expected_arrival_date" DATE,
    "local_recruitment_deadline" DATE,
    "status" "job_order_status" NOT NULL DEFAULT 'open',
    "job_center" VARCHAR(100),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "event_type" "worker_event_type" NOT NULL,
    "event_date" DATE,
    "report_date" DATE,
    "bureau_ref_number" VARCHAR(50),
    "bureau_ref_date" DATE,
    "notes" TEXT,
    "file_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_order_id" UUID NOT NULL,
    "interview_date" TIMESTAMPTZ NOT NULL,
    "location" TEXT,
    "interviewer" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "interview_id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "result" "candidate_result" NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "record_id" UUID NOT NULL,
    "record_table_name" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_mentions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "comment_id" UUID NOT NULL,
    "mentioned_user_id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ref_id" UUID NOT NULL,
    "ref_table" VARCHAR(50) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(100),
    "uploader_id" UUID,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50),
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(50),
    "address" TEXT,
    "city" VARCHAR(50),
    "country" VARCHAR(50),
    "valid_until" DATE,
    "phone" VARCHAR(50),
    "fax" VARCHAR(50),
    "contact_person" VARCHAR(50),
    "assessment_code" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "is_general" BOOLEAN NOT NULL DEFAULT false,
    "is_xray" BOOLEAN NOT NULL DEFAULT false,
    "is_overseas" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "year" INTEGER NOT NULL,
    "min_wage" INTEGER NOT NULL,
    "min_wage_threshold_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "standard_deduction" INTEGER NOT NULL,
    "salary_deduction" INTEGER NOT NULL,
    "personal_exemption" INTEGER NOT NULL,
    "tax_rate_resident" DOUBLE PRECISION NOT NULL,
    "non_resident_low_rate" DOUBLE PRECISION NOT NULL,
    "non_resident_high_rate" DOUBLE PRECISION NOT NULL,
    "effective_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_tax_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "tax_rate_non_resident" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "income_tax_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable_items" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name_zh" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,
    "name_th" VARCHAR(100),
    "name_id" VARCHAR(100),
    "name_vn" VARCHAR(100),
    "debit_account_code" VARCHAR(50),
    "credit_account_code" VARCHAR(50),
    "item_category" VARCHAR(50),
    "is_daily_calculation" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivable_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable_pricing_rules" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "nationality_id" UUID,
    "gender" "gender_type",
    "employer_id" UUID,
    "min_tenure_months" INTEGER,
    "max_tenure_months" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivable_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_tiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade" INTEGER NOT NULL,
    "min_salary" INTEGER NOT NULL,
    "max_salary" INTEGER NOT NULL,
    "labor_fee" INTEGER NOT NULL,
    "health_fee" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nationalities" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_zh" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "country_code" VARCHAR(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requirements" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50),
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "document_requirement_id" UUID,
    "nationality_id" UUID,
    "language" VARCHAR(20),
    "version" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "category" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "license_no" VARCHAR(50),
    "tax_id" VARCHAR(20),
    "address" TEXT,
    "phone" VARCHAR(20),
    "fax" VARCHAR(20),
    "email" VARCHAR(100),
    "responsible_person" VARCHAR(50),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agency_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foreign_agencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50),
    "address" TEXT,
    "country" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foreign_agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "pay_date" DATE NOT NULL,
    "salary_amount" DECIMAL(10,2) NOT NULL,
    "bonus_amount" DECIMAL(10,2) NOT NULL,
    "tax_withheld" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dormitories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "landlord_name" VARCHAR(50),
    "accommodation_type" VARCHAR(50),
    "total_area" DECIMAL(10,2),
    "capacity" INTEGER DEFAULT 0,
    "bathroom_count" INTEGER DEFAULT 0,
    "water_heater_count" INTEGER DEFAULT 0,
    "has_fire_extinguisher" BOOLEAN NOT NULL DEFAULT false,
    "has_fire_alarm" BOOLEAN NOT NULL DEFAULT false,
    "fire_safety_expiry" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dormitories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dormitory_rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dormitory_id" UUID NOT NULL,
    "room_number" VARCHAR(20) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "area" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dormitory_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dormitory_beds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "bed_code" VARCHAR(20) NOT NULL,
    "is_occupied" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dormitory_beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "effective_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_agencies" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "address" TEXT,
    "phone" VARCHAR(50),
    "website" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "official_agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_agency_personnel" (
    "id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "name_en" VARCHAR(100),
    "title" VARCHAR(100),
    "title_en" VARCHAR(100),
    "start_date" DATE,
    "end_date" DATE,
    "is_acting" BOOLEAN NOT NULL DEFAULT false,
    "acting_notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "official_agency_personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_end_reasons" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "description" TEXT,
    "is_abnormal" BOOLEAN NOT NULL DEFAULT false,
    "category" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contract_end_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_documents" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "worker_id" UUID,
    "document_type" VARCHAR(50) NOT NULL,
    "doc_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE,
    "issuing_agency" VARCHAR(100),
    "title" VARCHAR(200),
    "description" TEXT,
    "file_path" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "official_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employer_categories_code_key" ON "employer_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "job_types_code_key" ON "job_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "industries_code_key" ON "industries"("code");

-- CreateIndex
CREATE INDEX "industry_salary_configs_industry_id_idx" ON "industry_salary_configs"("industry_id");

-- CreateIndex
CREATE INDEX "industry_salary_configs_effective_date_idx" ON "industry_salary_configs"("effective_date");

-- CreateIndex
CREATE INDEX "industry_job_titles_industry_id_idx" ON "industry_job_titles"("industry_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_types_code_key" ON "contract_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "domestic_agencies_code_key" ON "domestic_agencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "banks_code_key" ON "banks"("code");

-- CreateIndex
CREATE INDEX "domestic_agency_bank_accounts_domestic_agency_id_idx" ON "domestic_agency_bank_accounts"("domestic_agency_id");

-- CreateIndex
CREATE INDEX "domestic_agency_bank_accounts_bank_id_idx" ON "domestic_agency_bank_accounts"("bank_id");

-- CreateIndex
CREATE UNIQUE INDEX "domestic_agency_bank_accounts_domestic_agency_id_bank_id_ag_key" ON "domestic_agency_bank_accounts"("domestic_agency_id", "bank_id", "agency_account_no");

-- CreateIndex
CREATE INDEX "agency_bilateral_trade_licenses_agency_id_idx" ON "agency_bilateral_trade_licenses"("agency_id");

-- CreateIndex
CREATE INDEX "agency_bilateral_trade_licenses_valid_to_idx" ON "agency_bilateral_trade_licenses"("valid_to");

-- CreateIndex
CREATE UNIQUE INDEX "partner_agencies_code_key" ON "partner_agencies"("code");

-- CreateIndex
CREATE INDEX "partner_agency_bilateral_licenses_agency_id_idx" ON "partner_agency_bilateral_licenses"("agency_id");

-- CreateIndex
CREATE INDEX "partner_agency_bilateral_licenses_valid_to_idx" ON "partner_agency_bilateral_licenses"("valid_to");

-- CreateIndex
CREATE INDEX "partner_agency_bilateral_licenses_status_idx" ON "partner_agency_bilateral_licenses"("status");

-- CreateIndex
CREATE INDEX "partner_agency_contracts_agency_id_idx" ON "partner_agency_contracts"("agency_id");

-- CreateIndex
CREATE INDEX "partner_agency_contracts_contract_no_idx" ON "partner_agency_contracts"("contract_no");

-- CreateIndex
CREATE INDEX "partner_agency_contracts_valid_to_idx" ON "partner_agency_contracts"("valid_to");

-- CreateIndex
CREATE UNIQUE INDEX "loan_banks_code_key" ON "loan_banks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_code_key" ON "employees"("code");

-- CreateIndex
CREATE INDEX "employees_code_idx" ON "employees"("code");

-- CreateIndex
CREATE INDEX "employees_full_name_idx" ON "employees"("full_name");

-- CreateIndex
CREATE INDEX "employees_department_code_idx" ON "employees"("department_code");

-- CreateIndex
CREATE INDEX "employees_domestic_agency_id_idx" ON "employees"("domestic_agency_id");

-- CreateIndex
CREATE INDEX "employees_is_active_idx" ON "employees"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_username_key" ON "internal_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_email_key" ON "internal_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employers_code_key" ON "employers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employers_tax_id_key" ON "employers"("tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "employers_origin_lead_id_key" ON "employers"("origin_lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "employer_labor_counts_employer_id_year_month_key" ON "employer_labor_counts"("employer_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_info_employer_id_key" ON "corporate_info"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "individual_info_employer_id_key" ON "individual_info"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "workers_bed_id_key" ON "workers"("bed_id");

-- CreateIndex
CREATE UNIQUE INDEX "employer_recruitment_letters_letter_number_key" ON "employer_recruitment_letters"("letter_number");

-- CreateIndex
CREATE UNIQUE INDEX "industry_recognitions_bureau_ref_number_key" ON "industry_recognitions"("bureau_ref_number");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_proofs_receipt_number_key" ON "recruitment_proofs"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "permit_documents_permit_number_key" ON "permit_documents"("permit_number");

-- CreateIndex
CREATE UNIQUE INDEX "interview_candidates_interview_id_worker_id_key" ON "interview_candidates"("interview_id", "worker_id");

-- CreateIndex
CREATE INDEX "system_comments_record_table_name_record_id_idx" ON "system_comments"("record_table_name", "record_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_mentions_comment_id_mentioned_user_id_key" ON "comment_mentions"("comment_id", "mentioned_user_id");

-- CreateIndex
CREATE INDEX "attachments_ref_table_ref_id_idx" ON "attachments"("ref_table", "ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_code_key" ON "hospitals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_configs_year_key" ON "tax_configs"("year");

-- CreateIndex
CREATE UNIQUE INDEX "income_tax_categories_code_key" ON "income_tax_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "receivable_items_code_key" ON "receivable_items"("code");

-- CreateIndex
CREATE INDEX "receivable_pricing_rules_item_id_idx" ON "receivable_pricing_rules"("item_id");

-- CreateIndex
CREATE INDEX "receivable_pricing_rules_employer_id_idx" ON "receivable_pricing_rules"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_tiers_grade_key" ON "insurance_tiers"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_code_key" ON "nationalities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "document_requirements_code_key" ON "document_requirements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_rules_code_key" ON "compliance_rules"("code");

-- CreateIndex
CREATE UNIQUE INDEX "official_agencies_code_key" ON "official_agencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "contract_end_reasons_code_key" ON "contract_end_reasons"("code");

-- CreateIndex
CREATE INDEX "official_documents_employer_id_idx" ON "official_documents"("employer_id");

-- CreateIndex
CREATE INDEX "official_documents_worker_id_idx" ON "official_documents"("worker_id");

-- CreateIndex
CREATE INDEX "official_documents_doc_number_idx" ON "official_documents"("doc_number");

-- AddForeignKey
ALTER TABLE "industry_salary_configs" ADD CONSTRAINT "industry_salary_configs_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_job_titles" ADD CONSTRAINT "industry_job_titles_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domestic_agency_bank_accounts" ADD CONSTRAINT "domestic_agency_bank_accounts_domestic_agency_id_fkey" FOREIGN KEY ("domestic_agency_id") REFERENCES "domestic_agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domestic_agency_bank_accounts" ADD CONSTRAINT "domestic_agency_bank_accounts_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_bilateral_trade_licenses" ADD CONSTRAINT "agency_bilateral_trade_licenses_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "domestic_agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_agency_bilateral_licenses" ADD CONSTRAINT "partner_agency_bilateral_licenses_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "partner_agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_agency_contracts" ADD CONSTRAINT "partner_agency_contracts_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "partner_agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_domestic_agency_id_fkey" FOREIGN KEY ("domestic_agency_id") REFERENCES "domestic_agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_origin_lead_id_fkey" FOREIGN KEY ("origin_lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_factories" ADD CONSTRAINT "employer_factories_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_labor_counts" ADD CONSTRAINT "employer_labor_counts_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_info" ADD CONSTRAINT "corporate_info_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_info" ADD CONSTRAINT "individual_info_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_nationality_id_fkey" FOREIGN KEY ("nationality_id") REFERENCES "nationalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_foreign_agency_id_fkey" FOREIGN KEY ("foreign_agency_id") REFERENCES "foreign_agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "dormitory_beds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_employerFactoryId_fkey" FOREIGN KEY ("employerFactoryId") REFERENCES "employer_factories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_accommodation_history" ADD CONSTRAINT "worker_accommodation_history_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_accommodation_history" ADD CONSTRAINT "worker_accommodation_history_dormitory_bed_id_fkey" FOREIGN KEY ("dormitory_bed_id") REFERENCES "dormitory_beds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relocation_notifications" ADD CONSTRAINT "relocation_notifications_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_industry_recognition_id_fkey" FOREIGN KEY ("industry_recognition_id") REFERENCES "industry_recognitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_recruitment_proof_id_fkey" FOREIGN KEY ("recruitment_proof_id") REFERENCES "recruitment_proofs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_parent_letter_id_fkey" FOREIGN KEY ("parent_letter_id") REFERENCES "employer_recruitment_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_work_address_factory_id_fkey" FOREIGN KEY ("work_address_factory_id") REFERENCES "employer_factories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_nationality_id_fkey" FOREIGN KEY ("nationality_id") REFERENCES "nationalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_passports" ADD CONSTRAINT "worker_passports_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_arcs" ADD CONSTRAINT "worker_arcs_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_contract_type_id_fkey" FOREIGN KEY ("contract_type_id") REFERENCES "contract_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_contract_end_reason_id_fkey" FOREIGN KEY ("contract_end_reason_id") REFERENCES "contract_end_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "employer_factories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_recruitment_letter_id_fkey" FOREIGN KEY ("recruitment_letter_id") REFERENCES "employer_recruitment_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_recognitions" ADD CONSTRAINT "industry_recognitions_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_recognitions" ADD CONSTRAINT "industry_recognitions_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "employer_factories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_proofs" ADD CONSTRAINT "recruitment_proofs_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permit_documents" ADD CONSTRAINT "permit_documents_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_permit_details" ADD CONSTRAINT "worker_permit_details_permit_document_id_fkey" FOREIGN KEY ("permit_document_id") REFERENCES "permit_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_permit_details" ADD CONSTRAINT "worker_permit_details_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_internal_user_id_fkey" FOREIGN KEY ("internal_user_id") REFERENCES "internal_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_insurances" ADD CONSTRAINT "worker_insurances_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_insurances" ADD CONSTRAINT "worker_insurances_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_address_history" ADD CONSTRAINT "worker_address_history_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_events" ADD CONSTRAINT "worker_events_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_candidates" ADD CONSTRAINT "interview_candidates_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_candidates" ADD CONSTRAINT "interview_candidates_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_comments" ADD CONSTRAINT "system_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "system_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "internal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_pricing_rules" ADD CONSTRAINT "receivable_pricing_rules_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "receivable_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_pricing_rules" ADD CONSTRAINT "receivable_pricing_rules_nationality_id_fkey" FOREIGN KEY ("nationality_id") REFERENCES "nationalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_document_requirement_id_fkey" FOREIGN KEY ("document_requirement_id") REFERENCES "document_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_nationality_id_fkey" FOREIGN KEY ("nationality_id") REFERENCES "nationalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dormitory_rooms" ADD CONSTRAINT "dormitory_rooms_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "dormitories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dormitory_beds" ADD CONSTRAINT "dormitory_beds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "dormitory_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_agency_personnel" ADD CONSTRAINT "official_agency_personnel_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "official_agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_documents" ADD CONSTRAINT "official_documents_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_documents" ADD CONSTRAINT "official_documents_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
