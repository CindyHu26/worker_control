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
    "tax_id" VARCHAR(20) NOT NULL,
    "company_name" VARCHAR(100) NOT NULL,
    "responsible_person" VARCHAR(50),
    "address" TEXT,
    "phone_number" VARCHAR(20),
    "email" VARCHAR(100),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_info" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "factory_registration_no" VARCHAR(50),
    "factory_registration_id" VARCHAR(50),
    "industry_type" VARCHAR(50),
    "labor_insurance_no" VARCHAR(50),
    "labor_insurance_id" VARCHAR(50),
    "health_insurance_unit_no" VARCHAR(50),
    "health_insurance_id" VARCHAR(50),
    "fax_number" VARCHAR(20),

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
    "id_issue_date" DATE,
    "id_issue_place" VARCHAR(50),
    "military_status" VARCHAR(20),

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
    "approved_quota" INTEGER NOT NULL DEFAULT 0,
    "used_quota" INTEGER NOT NULL DEFAULT 0,
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

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_username_key" ON "internal_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_email_key" ON "internal_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employers_tax_id_key" ON "employers"("tax_id");

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

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_info" ADD CONSTRAINT "corporate_info_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_info" ADD CONSTRAINT "individual_info_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_recruitment_letters" ADD CONSTRAINT "employer_recruitment_letters_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_passports" ADD CONSTRAINT "worker_passports_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_arcs" ADD CONSTRAINT "worker_arcs_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
