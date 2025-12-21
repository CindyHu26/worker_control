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
CREATE TYPE "nationality_type" AS ENUM ('PH', 'ID', 'VN', 'TH', 'OTHER');

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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "nationality" "nationality_type" NOT NULL,
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

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_recruitment_letters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "letter_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "valid_until" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "recruitment_type" VARCHAR(20),
    "nationality" VARCHAR(20),
    "can_circulate" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "entry_report_serial" VARCHAR(50),
    "flight_number" VARCHAR(20),
    "flight_arrival_date" DATE,
    "visa_letter_no" VARCHAR(50),
    "job_type" VARCHAR(50),
    "shift" VARCHAR(50),
    "overseas_check_status" VARCHAR(20),
    "overseas_check_date" DATE,
    "doc_verification_status" VARCHAR(20),
    "doc_submission_date" DATE,
    "doc_verified_date" DATE,
    "visa_status" VARCHAR(20),
    "visa_application_date" DATE,
    "visa_number" VARCHAR(50),
    "termination_reason" VARCHAR(50),
    "termination_notes" TEXT,
    "factory_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "worker_timelines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "deployment_id" UUID NOT NULL,
    "entry_med_check_deadline" DATE,
    "emp_permit_deadline" DATE,
    "arc_deadline" DATE,
    "med_check_6mo_deadline" DATE,
    "med_check_18mo_deadline" DATE,
    "med_check_30mo_deadline" DATE,
    "residence_permit_expiry" DATE,
    "passport_expiry" DATE,
    "renewal_window_start" DATE,
    "renewal_window_end" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_timelines_pkey" PRIMARY KEY ("id")
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
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_orders_pkey" PRIMARY KEY ("id")
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
    "city" VARCHAR(50),
    "country" VARCHAR(50),
    "valid_until" DATE,
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
CREATE TABLE "fee_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "default_amount" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "nationality" VARCHAR(10),
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_items_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "document_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "file_path" TEXT NOT NULL,
    "nationality" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "employer_recruitment_letters_letter_number_key" ON "employer_recruitment_letters"("letter_number");

-- CreateIndex
CREATE UNIQUE INDEX "permit_documents_permit_number_key" ON "permit_documents"("permit_number");

-- CreateIndex
CREATE UNIQUE INDEX "worker_timelines_deployment_id_key" ON "worker_timelines"("deployment_id");

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
CREATE UNIQUE INDEX "insurance_tiers_grade_key" ON "insurance_tiers"("grade");

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_origin_lead_id_fkey" FOREIGN KEY ("origin_lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "workers" ADD CONSTRAINT "workers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_parent_letter_id_fkey" FOREIGN KEY ("parent_letter_id") REFERENCES "employer_recruitment_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_passports" ADD CONSTRAINT "worker_passports_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_arcs" ADD CONSTRAINT "worker_arcs_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "employer_factories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_recruitment_letter_id_fkey" FOREIGN KEY ("recruitment_letter_id") REFERENCES "employer_recruitment_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permit_documents" ADD CONSTRAINT "permit_documents_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_permit_details" ADD CONSTRAINT "worker_permit_details_permit_document_id_fkey" FOREIGN KEY ("permit_document_id") REFERENCES "permit_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_permit_details" ADD CONSTRAINT "worker_permit_details_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_timelines" ADD CONSTRAINT "worker_timelines_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
        -- Set recheck requirement
        NEW.is_recheck_required = TRUE;

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
            'Health Check Failed: ' || COALESCE(NEW.fail_reason, 'No reason provided') || '. Re-check Required.',
            'high',
            'open',
            TRUE,
            NEW.id,
            NOW(),
            NOW()
        );
    ELSIF NEW.result = 'pass' AND NEW.check_type = 'recheck' THEN
        NEW.is_recheck_required = FALSE;
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

