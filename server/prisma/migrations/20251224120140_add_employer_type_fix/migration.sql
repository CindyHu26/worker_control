-- CreateEnum
CREATE TYPE "EmployerType" AS ENUM ('BUSINESS', 'INDIVIDUAL', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "billing_plan_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "billing_item_category" AS ENUM ('SERVICE_FEE', 'ARC_FEE', 'HEALTH_CHECK_FEE', 'DORMITORY_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "billing_item_status" AS ENUM ('PENDING', 'GENERATED', 'BILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "billing_review_status" AS ENUM ('NORMAL', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "candidate_status" AS ENUM ('NEW', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "dormitories" ADD COLUMN     "management_fee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rent_fee" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "employer_categories" ADD COLUMN     "color" VARCHAR(20),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon_name" VARCHAR(50),
ADD COLUMN     "type" "EmployerType" NOT NULL DEFAULT 'BUSINESS';

-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "employer_category_id" UUID,
ADD COLUMN     "monthly_service_fee" INTEGER NOT NULL DEFAULT 1500;

-- AlterTable
ALTER TABLE "interview_candidates" ADD COLUMN     "candidate_id" UUID,
ALTER COLUMN "worker_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "job_orders" ADD COLUMN     "description" TEXT,
ADD COLUMN     "job_type" VARCHAR(100),
ADD COLUMN     "required_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "skill_requirements" TEXT,
ADD COLUMN     "title" VARCHAR(200) NOT NULL DEFAULT 'General Worker',
ADD COLUMN     "work_location" VARCHAR(200),
ALTER COLUMN "required_workers" SET DEFAULT 1;

-- CreateTable
CREATE TABLE "countries" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name_zh" VARCHAR(50) NOT NULL,
    "name_en" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_filings" (
    "id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "entry_date" DATE NOT NULL,
    "flight_no" VARCHAR(20),
    "visa_no" VARCHAR(50),
    "entry_report_date" DATE,
    "entry_report_ref_no" VARCHAR(50),
    "entry_report_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "initial_exam_date" DATE,
    "initial_exam_hospital" VARCHAR(100),
    "initial_exam_result" VARCHAR(20),
    "arc_apply_date" DATE,
    "arc_receipt_no" VARCHAR(50),
    "arc_no" VARCHAR(20),
    "arc_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "permit_apply_date" DATE,
    "permit_receipt_no" VARCHAR(50),
    "permit_no" VARCHAR(50),
    "permit_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "overall_compliance" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "entry_filings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_exceptions" (
    "id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "health_check_id" UUID,
    "diagnosis_date" DATE NOT NULL,
    "disease_type" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "health_dept_notified" BOOLEAN NOT NULL DEFAULT false,
    "health_dept_notify_date" DATE,
    "employer_notified" BOOLEAN NOT NULL DEFAULT false,
    "employer_notify_date" DATE,
    "treatment_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "resolution_date" DATE,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "medical_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_plans" (
    "id" UUID NOT NULL,
    "deployment_id" UUID NOT NULL,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "status" "billing_plan_status" NOT NULL DEFAULT 'PENDING',
    "review_status" "billing_review_status" NOT NULL DEFAULT 'NORMAL',
    "review_reason" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "billing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_plan_items" (
    "id" UUID NOT NULL,
    "billing_plan_id" UUID NOT NULL,
    "billing_date" DATE NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "item_category" "billing_item_category" NOT NULL,
    "status" "billing_item_status" NOT NULL DEFAULT 'GENERATED',
    "is_prorated" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(200),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "billing_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_modification_logs" (
    "id" UUID NOT NULL,
    "plan_item_id" UUID NOT NULL,
    "old_amount" INTEGER NOT NULL,
    "new_amount" INTEGER NOT NULL,
    "reason" VARCHAR(255),
    "modified_by" VARCHAR(100),
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_modification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" UUID NOT NULL,
    "name_zh" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "gender" "gender_type" NOT NULL,
    "birth_date" DATE NOT NULL,
    "nationality" VARCHAR(3) NOT NULL,
    "passport_no" VARCHAR(50) NOT NULL,
    "passport_expiry" DATE,
    "height" INTEGER,
    "weight" INTEGER,
    "blood_type" VARCHAR(5),
    "marital_status" VARCHAR(20),
    "education" VARCHAR(100),
    "skills" TEXT,
    "work_experience" TEXT,
    "status" "candidate_status" NOT NULL DEFAULT 'NEW',
    "remarks" TEXT,
    "source_agency_id" UUID,
    "import_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overseas_progress" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "medical_exam_date" DATE,
    "medical_exam_result" VARCHAR(50),
    "medical_exam_remarks" TEXT,
    "police_clr_date" DATE,
    "police_clr_status" VARCHAR(50),
    "police_clr_remarks" TEXT,
    "passport_checked" BOOLEAN NOT NULL DEFAULT false,
    "passport_expiry_ok" BOOLEAN NOT NULL DEFAULT false,
    "passport_remarks" TEXT,
    "arc_checked" BOOLEAN NOT NULL DEFAULT false,
    "arc_has_issues" BOOLEAN NOT NULL DEFAULT false,
    "arc_remarks" TEXT,
    "overall_status" VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "overseas_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "entry_filings_worker_id_key" ON "entry_filings"("worker_id");

-- CreateIndex
CREATE INDEX "entry_filings_overall_compliance_idx" ON "entry_filings"("overall_compliance");

-- CreateIndex
CREATE INDEX "entry_filings_entry_date_idx" ON "entry_filings"("entry_date");

-- CreateIndex
CREATE INDEX "medical_exceptions_treatment_status_idx" ON "medical_exceptions"("treatment_status");

-- CreateIndex
CREATE INDEX "medical_exceptions_disease_type_idx" ON "medical_exceptions"("disease_type");

-- CreateIndex
CREATE UNIQUE INDEX "billing_plans_deployment_id_key" ON "billing_plans"("deployment_id");

-- CreateIndex
CREATE INDEX "billing_plan_items_billing_plan_id_idx" ON "billing_plan_items"("billing_plan_id");

-- CreateIndex
CREATE INDEX "billing_plan_items_billing_date_idx" ON "billing_plan_items"("billing_date");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_passport_no_key" ON "candidates"("passport_no");

-- CreateIndex
CREATE INDEX "candidates_passport_no_idx" ON "candidates"("passport_no");

-- CreateIndex
CREATE INDEX "candidates_status_idx" ON "candidates"("status");

-- CreateIndex
CREATE INDEX "candidates_nationality_idx" ON "candidates"("nationality");

-- CreateIndex
CREATE UNIQUE INDEX "overseas_progress_candidate_id_key" ON "overseas_progress"("candidate_id");

-- CreateIndex
CREATE INDEX "overseas_progress_overall_status_idx" ON "overseas_progress"("overall_status");

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_employer_category_id_fkey" FOREIGN KEY ("employer_category_id") REFERENCES "employer_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_filings" ADD CONSTRAINT "entry_filings_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_exceptions" ADD CONSTRAINT "medical_exceptions_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_exceptions" ADD CONSTRAINT "medical_exceptions_health_check_id_fkey" FOREIGN KEY ("health_check_id") REFERENCES "health_checks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_candidates" ADD CONSTRAINT "interview_candidates_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_plans" ADD CONSTRAINT "billing_plans_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_plan_items" ADD CONSTRAINT "billing_plan_items_billing_plan_id_fkey" FOREIGN KEY ("billing_plan_id") REFERENCES "billing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_modification_logs" ADD CONSTRAINT "billing_modification_logs_plan_item_id_fkey" FOREIGN KEY ("plan_item_id") REFERENCES "billing_plan_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overseas_progress" ADD CONSTRAINT "overseas_progress_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
