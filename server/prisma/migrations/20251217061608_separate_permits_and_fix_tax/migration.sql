-- CreateTable
CREATE TABLE "internal_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "employers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tax_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'corporate',
    "withholding_tax_id" TEXT,
    "invoice_address" TEXT,
    "responsible_person" TEXT,
    "company_name_en" TEXT,
    "address_en" TEXT,
    "responsible_person_en" TEXT,
    "responsible_person_dob" DATETIME,
    "responsible_person_id_no" TEXT,
    "responsible_person_father_name" TEXT,
    "responsible_person_mother_name" TEXT,
    "responsible_person_spouse" TEXT,
    "id_issue_date" DATETIME,
    "id_issue_place" TEXT,
    "military_status" TEXT,
    "address" TEXT,
    "phone_number" TEXT,
    "factory_registration_no" TEXT,
    "factory_registration_id" TEXT,
    "industry_type" TEXT,
    "labor_insurance_no" TEXT,
    "labor_insurance_id" TEXT,
    "health_insurance_unit_no" TEXT,
    "health_insurance_id" TEXT,
    "email" TEXT,
    "fax_number" TEXT,
    "bill_address" TEXT,
    "industry_code" TEXT,
    "responsible_person_address" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agency_company_id" TEXT,
    "category" TEXT NOT NULL DEFAULT 'MANUFACTURING',
    "allocation_rate" DECIMAL,
    "total_quota" INTEGER,
    "compliance_standard" TEXT,
    "zero_fee_effective_date" DATETIME,
    "house_tax_id" TEXT,
    CONSTRAINT "employers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employers_agency_company_id_fkey" FOREIGN KEY ("agency_company_id") REFERENCES "agency_companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employer_factory_infos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employer_id" TEXT NOT NULL,
    "factory_registration_no" TEXT,
    "industry_type" TEXT,
    "factory_address_en" TEXT,
    "factory_address" TEXT,
    CONSTRAINT "employer_factory_infos_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employer_labor_counts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employer_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employer_labor_counts_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "work_period_start" DATETIME NOT NULL,
    "work_period_end" DATETIME,
    "pay_date" DATETIME NOT NULL,
    "salary_amount" DECIMAL NOT NULL DEFAULT 0,
    "bonus_amount" DECIMAL NOT NULL DEFAULT 0,
    "tax_withheld" DECIMAL NOT NULL DEFAULT 0,
    "tax_rate_used" DECIMAL NOT NULL DEFAULT 0,
    "filing_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payroll_records_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payroll_records_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employer_home_care_infos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employer_id" TEXT NOT NULL,
    CONSTRAINT "employer_home_care_infos_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "home_care_info_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "id_no" TEXT,
    "dob" DATETIME,
    "relationship" TEXT,
    "care_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patients_home_care_info_id_fkey" FOREIGN KEY ("home_care_info_id") REFERENCES "employer_home_care_infos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employer_institution_infos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employer_id" TEXT NOT NULL,
    "institution_code" TEXT,
    "bed_count" INTEGER,
    CONSTRAINT "employer_institution_infos_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "english_name" TEXT NOT NULL,
    "chinese_name" TEXT,
    "dob" DATETIME NOT NULL,
    "nationality" TEXT NOT NULL,
    "father_name_en" TEXT,
    "mother_name_en" TEXT,
    "home_address_en" TEXT,
    "birth_place_en" TEXT,
    "spouse_name_en" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "gender" TEXT,
    "home_country_id" TEXT,
    "tax_id" TEXT,
    "blood_type" TEXT,
    "religion" TEXT,
    "mobile_phone" TEXT,
    "foreign_address" TEXT,
    "marital_status" TEXT,
    "marriage_date" DATETIME,
    "divorce_date" DATETIME,
    "height" DECIMAL,
    "weight" DECIMAL,
    "birth_place" TEXT,
    "education_level" TEXT,
    "spouse_name" TEXT,
    "overseas_contact_phone" TEXT,
    "overseas_family_contact" TEXT,
    "line_id" TEXT,
    "emergency_contact_phone" TEXT,
    "bank_account_no" TEXT,
    "bank_code" TEXT,
    "bank_branch_name" TEXT,
    "bank_account_holder" TEXT,
    "loan_bank" TEXT,
    "loan_amount" DECIMAL,
    "flight_arrival_info" TEXT,
    "one_stop_service_serial" TEXT,
    "flight_departure" TEXT,
    "old_passport_number" TEXT,
    "dormitory_id" TEXT,
    "dormitory_bed_id" TEXT,
    "foreign_agency_id" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workers_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "dormitories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workers_dormitory_bed_id_fkey" FOREIGN KEY ("dormitory_bed_id") REFERENCES "dorm_beds" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workers_foreign_agency_id_fkey" FOREIGN KEY ("foreign_agency_id") REFERENCES "foreign_agencies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_tax_statuses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NON_RESIDENT',
    "days_stayed" INTEGER NOT NULL DEFAULT 0,
    "is_finalized" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_tax_statuses_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "deployment_id" TEXT,
    "education_degree" TEXT,
    "education_score" INTEGER NOT NULL DEFAULT 0,
    "avg_monthly_salary" DECIMAL,
    "salary_score" INTEGER NOT NULL DEFAULT 0,
    "experience_years" DECIMAL,
    "experience_score" INTEGER NOT NULL DEFAULT 0,
    "qualification_details" TEXT,
    "qualification_score" INTEGER NOT NULL DEFAULT 0,
    "chinese_level" TEXT,
    "chinese_score" INTEGER NOT NULL DEFAULT 0,
    "other_language_details" TEXT,
    "other_language_score" INTEGER NOT NULL DEFAULT 0,
    "overseas_growth_details" TEXT,
    "overseas_growth_score" INTEGER NOT NULL DEFAULT 0,
    "policy_details" TEXT,
    "policy_score" INTEGER NOT NULL DEFAULT 0,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "is_qualified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "review_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_evaluations_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_evaluations_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recruitment_letters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employer_id" TEXT NOT NULL,
    "letter_number" TEXT NOT NULL,
    "issue_date" DATETIME NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "approved_quota" INTEGER NOT NULL DEFAULT 0,
    "used_quota" INTEGER NOT NULL DEFAULT 0,
    "review_fee_receipt_no" TEXT,
    "review_fee_date" DATETIME,
    "review_fee_amount" INTEGER DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recruitment_letters_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "entry_permits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruitment_letter_id" TEXT NOT NULL,
    "permit_number" TEXT NOT NULL,
    "issue_date" DATETIME NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "quota" INTEGER NOT NULL,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entry_permits_recruitment_letter_id_fkey" FOREIGN KEY ("recruitment_letter_id") REFERENCES "recruitment_letters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_passports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "passport_number" TEXT NOT NULL,
    "issue_date" DATETIME NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "issue_place" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_passports_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_arcs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "arc_number" TEXT NOT NULL,
    "issue_date" DATETIME NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_arcs_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "entry_permit_id" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "service_status" TEXT NOT NULL DEFAULT 'active_service',
    "source_type" TEXT NOT NULL DEFAULT 'direct_hiring',
    "process_stage" TEXT NOT NULL DEFAULT 'recruitment',
    "job_description" TEXT,
    "job_type" TEXT,
    "shift" TEXT,
    "labor_contract_type" TEXT,
    "basic_salary" DECIMAL,
    "labor_insurance_amt" DECIMAL,
    "health_insurance_amt" DECIMAL,
    "entry_date" DATETIME,
    "entry_report_serial" TEXT,
    "entry_report_doc_no" TEXT,
    "entry_report_date" DATETIME,
    "flight_number" TEXT,
    "flight_arrival_date" DATETIME,
    "visa_letter_no" TEXT,
    "visa_letter_date" DATETIME,
    "visa_number" TEXT,
    "food_status" TEXT NOT NULL DEFAULT 'provided_free',
    "food_amount" DECIMAL NOT NULL DEFAULT 0,
    "termination_reason" TEXT,
    "termination_notes" TEXT,
    "runaway_report_date" DATETIME,
    "runaway_report_doc_no" TEXT,
    "runaway_report_no" TEXT,
    "termination_permit_date" DATETIME,
    "termination_permit_no" TEXT,
    "transfer_permit_date" DATETIME,
    "transfer_permit_no" TEXT,
    "fingerprint_date" DATETIME,
    "replacement_letter_number" TEXT,
    "replacement_letter_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deployments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "deployments_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "deployments_entry_permit_id_fkey" FOREIGN KEY ("entry_permit_id") REFERENCES "entry_permits" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employment_permits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deployment_id" TEXT NOT NULL,
    "permit_number" TEXT NOT NULL,
    "issue_date" DATETIME NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INITIAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "receipt_number" TEXT,
    "application_date" DATETIME,
    "fee_amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employment_permits_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permit_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employer_id" TEXT NOT NULL,
    "permit_number" TEXT NOT NULL,
    "issue_date" DATETIME NOT NULL,
    "issuing_authority" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permit_documents_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_permit_details" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "permit_document_id" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "permit_type" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_permit_details_permit_document_id_fkey" FOREIGN KEY ("permit_document_id") REFERENCES "permit_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "worker_permit_details_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_timelines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deployment_id" TEXT NOT NULL,
    "entry_med_check_deadline" DATETIME,
    "emp_permit_deadline" DATETIME,
    "arc_deadline" DATETIME,
    "med_check_6mo_deadline" DATETIME,
    "med_check_18mo_deadline" DATETIME,
    "med_check_30mo_deadline" DATETIME,
    "residence_permit_expiry" DATETIME,
    "passport_expiry" DATETIME,
    "renewal_window_start" DATETIME,
    "renewal_window_end" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_timelines_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "check_type" TEXT NOT NULL,
    "check_date" DATETIME NOT NULL,
    "hospital_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "notification_date" DATETIME,
    "result" TEXT NOT NULL DEFAULT 'pending',
    "report_date" DATETIME,
    "approval_date" DATETIME,
    "approval_doc_no" TEXT,
    "is_recheck_required" BOOLEAN NOT NULL DEFAULT false,
    "recheck_date" DATETIME,
    "recheck_result" TEXT,
    "treatment_hospital" TEXT,
    "fail_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "health_checks_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "health_checks_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT,
    "employer_id" TEXT,
    "description" TEXT NOT NULL,
    "severity_level" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'open',
    "incident_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "source_ref_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "incidents_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "incidents_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employer_id" TEXT,
    "worker_id" TEXT,
    "internal_user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_assignments_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_assignments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_assignments_internal_user_id_fkey" FOREIGN KEY ("internal_user_id") REFERENCES "internal_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_insurances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "deployment_id" TEXT,
    "type" TEXT NOT NULL,
    "provider_name" TEXT,
    "policy_number" TEXT,
    "insured_amount" DECIMAL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "apply_date" DATETIME,
    "effective_date" DATETIME,
    "withdraw_apply_date" DATETIME,
    "withdraw_effective_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_insurances_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "worker_insurances_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worker_address_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "address_type" TEXT NOT NULL,
    "address_detail" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_address_history_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employer_id" TEXT NOT NULL,
    "order_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "required_workers" INTEGER NOT NULL,
    "expected_arrival_date" DATETIME,
    "local_recruitment_deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_orders_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "job_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "job_orders_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "internal_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "domestic_recruitments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_order_id" TEXT NOT NULL,
    "registry_date" DATETIME NOT NULL,
    "registry_number" TEXT,
    "labor_violation_certificate_date" DATETIME,
    "no_violation_certificate_number" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "domestic_recruitments_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_order_id" TEXT NOT NULL,
    "interview_date" DATETIME NOT NULL,
    "location" TEXT,
    "interviewer" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interviews_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interview_candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interview_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_candidates_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "interview_candidates_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "record_id" TEXT NOT NULL,
    "record_table_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "internal_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comment_mentions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comment_id" TEXT NOT NULL,
    "mentioned_user_id" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comment_mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "system_comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comment_mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "internal_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fee_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "default_amount" DECIMAL NOT NULL,
    "category" TEXT NOT NULL,
    "nationality" TEXT,
    "description" TEXT,
    "is_zero_fee_subject" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "insurance_tiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grade" INTEGER NOT NULL,
    "min_salary" DECIMAL NOT NULL,
    "max_salary" DECIMAL NOT NULL,
    "labor_fee" DECIMAL NOT NULL,
    "health_fee" DECIMAL NOT NULL,
    "effective_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bill_no" TEXT NOT NULL,
    "payer_type" TEXT NOT NULL,
    "worker_id" TEXT,
    "employer_id" TEXT,
    "deployment_id" TEXT,
    "billing_date" DATETIME NOT NULL,
    "due_date" DATETIME NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "paid_amount" DECIMAL NOT NULL DEFAULT 0,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "previous_balance" DECIMAL NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL DEFAULT 0,
    "month" INTEGER NOT NULL DEFAULT 0,
    "billing_period_start" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billing_period_end" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "invoice_number" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bills_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bills_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bills_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "nationality" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bill_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bill_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "fee_category" TEXT NOT NULL,
    "compliance_override_reason" TEXT,
    "is_overridden" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "bill_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "monthly_service_fees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deployment_id" TEXT NOT NULL,
    "amount_year_1" DECIMAL NOT NULL DEFAULT 1800,
    "amount_year_2" DECIMAL NOT NULL DEFAULT 1700,
    "amount_year_3" DECIMAL NOT NULL DEFAULT 1500,
    "accommodation_fee" DECIMAL NOT NULL DEFAULT 0,
    "last_billed_date" DATETIME,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "monthly_service_fees_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fee_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deployment_id" TEXT NOT NULL,
    "installment_no" INTEGER NOT NULL,
    "schedule_date" DATETIME NOT NULL,
    "expected_amount" DECIMAL NOT NULL,
    "paid_amount" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "bill_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fee_schedules_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fee_schedules_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dormitories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "current_occupancy" INTEGER NOT NULL DEFAULT 0,
    "landlord_name" TEXT,
    "landlord_phone" TEXT,
    "accommodation_type" TEXT,
    "safety_inspection_date" DATETIME,
    "primary_manager" TEXT,
    "total_area" DECIMAL,
    "building_use_type" TEXT,
    "fire_safety_expiry" DATETIME,
    "bathroom_count" INTEGER NOT NULL DEFAULT 0,
    "water_heater_count" INTEGER NOT NULL DEFAULT 0,
    "is_factory_separated" BOOLEAN NOT NULL DEFAULT true,
    "has_fire_extinguisher" BOOLEAN NOT NULL DEFAULT true,
    "has_fire_alarm" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "dorm_rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dormitory_id" TEXT NOT NULL,
    "room_number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "current_head_count" INTEGER NOT NULL DEFAULT 0,
    "gender" TEXT,
    "floor" INTEGER,
    "area" DECIMAL,
    "accommodation_type" TEXT,
    CONSTRAINT "dorm_rooms_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "dormitories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dorm_beds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "bed_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'vacant',
    CONSTRAINT "dorm_beds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "dorm_rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dorm_meters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "meter_name" TEXT NOT NULL,
    "meter_type" TEXT NOT NULL,
    "rate_per_unit" DECIMAL NOT NULL DEFAULT 5.0,
    CONSTRAINT "dorm_meters_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "dorm_rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meter_readings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meter_id" TEXT NOT NULL,
    "reading_date" DATETIME NOT NULL,
    "reading_value" DECIMAL NOT NULL,
    "usage" DECIMAL NOT NULL,
    "cost" DECIMAL NOT NULL,
    "is_billed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meter_readings_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "dorm_meters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agency_companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "license_no" TEXT NOT NULL,
    "tax_id" TEXT NOT NULL,
    "responsible_person" TEXT NOT NULL,
    "name_en" TEXT,
    "address_en" TEXT,
    "representative_en" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "bank_name" TEXT,
    "bank_code" TEXT,
    "bank_branch" TEXT,
    "bank_account_no" TEXT,
    "bank_account_name" TEXT,
    "seal_large_url" TEXT,
    "seal_small_url" TEXT,
    "logo_url" TEXT,
    "agency_code" TEXT,
    "license_expiry_date" DATETIME,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "transfer_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worker_id" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "old_employer_id" TEXT NOT NULL,
    "new_employer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "agreement_date" DATETIME,
    "mol_letter_number" TEXT,
    "mol_letter_date" DATETIME,
    "new_employer_reg_date" DATETIME,
    "transfer_date" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transfer_records_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transfer_records_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transfer_records_old_employer_id_fkey" FOREIGN KEY ("old_employer_id") REFERENCES "employers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transfer_records_new_employer_id_fkey" FOREIGN KEY ("new_employer_id") REFERENCES "employers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "foreign_agencies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "chinese_name" TEXT,
    "country" TEXT NOT NULL,
    "code" TEXT,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "dispute_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incident_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "complaint_type" TEXT NOT NULL,
    "coordinator_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dispute_records_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "internal_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "dispute_records_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resolution_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dispute_record_id" TEXT NOT NULL,
    "log_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "outcome" TEXT,
    "handler_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resolution_logs_handler_id_fkey" FOREIGN KEY ("handler_id") REFERENCES "internal_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "resolution_logs_dispute_record_id_fkey" FOREIGN KEY ("dispute_record_id") REFERENCES "dispute_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "advance_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payer_id" TEXT NOT NULL,
    "worker_id" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "receipt_image" TEXT,
    "payment_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bill_item_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "advance_payments_bill_item_id_fkey" FOREIGN KEY ("bill_item_id") REFERENCES "bill_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "advance_payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "internal_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "advance_payments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bill_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "random_code" TEXT,
    "total_amount" DECIMAL NOT NULL,
    "buyer_name" TEXT,
    "buyer_identifier" TEXT,
    "carrier_type" TEXT,
    "carrier_id" TEXT,
    "donation_code" TEXT,
    "print_mark" TEXT DEFAULT 'N',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dorm_id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "contract_item" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "monthly_rent" DECIMAL NOT NULL,
    "deposit" DECIMAL DEFAULT 0,
    "is_utilities_included" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leases_dorm_id_fkey" FOREIGN KEY ("dorm_id") REFERENCES "dormitories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dorm_equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dorm_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand_model" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "maintenance_interval_months" INTEGER,
    "compliance_interval_months" INTEGER,
    "last_maintenance_date" DATETIME,
    "next_maintenance_date" DATETIME,
    "purchase_date" DATETIME,
    "warranty_expiry" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "dorm_equipment_dorm_id_fkey" FOREIGN KEY ("dorm_id") REFERENCES "dormitories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipment_id" TEXT,
    "dorm_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reported_by" TEXT,
    "notification_date" DATETIME,
    "completion_date" DATETIME,
    "cost" DECIMAL DEFAULT 0,
    "payer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoice_info" TEXT,
    "photo_paths" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "maintenance_logs_dorm_id_fkey" FOREIGN KEY ("dorm_id") REFERENCES "dormitories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "maintenance_logs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "dorm_equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT,
    "contact_person" TEXT,
    "job_title" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "line_id" TEXT,
    "address" TEXT,
    "tax_id" TEXT,
    "arc_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "estimated_worker_count" INTEGER,
    "industry" TEXT,
    "assigned_to" TEXT,
    "last_contact_date" DATETIME,
    "next_follow_up_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "internal_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lead_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detailed_notes" TEXT,
    "outcome" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tax_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "min_wage" INTEGER NOT NULL,
    "min_wage_threshold_multiplier" DECIMAL NOT NULL DEFAULT 1.5,
    "standard_deduction" INTEGER NOT NULL,
    "salary_deduction" INTEGER NOT NULL,
    "personal_exemption" INTEGER NOT NULL,
    "tax_rate_resident" DECIMAL NOT NULL,
    "non_resident_low_rate" DECIMAL NOT NULL,
    "non_resident_high_rate" DECIMAL NOT NULL,
    "effective_date" DATETIME NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "bucket_name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "worker_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_username_key" ON "internal_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_email_key" ON "internal_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employers_tax_id_key" ON "employers"("tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "employer_factory_infos_employer_id_key" ON "employer_factory_infos"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "employer_labor_counts_employer_id_year_month_key" ON "employer_labor_counts"("employer_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "employer_home_care_infos_employer_id_key" ON "employer_home_care_infos"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "employer_institution_infos_employer_id_key" ON "employer_institution_infos"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "workers_dormitory_bed_id_key" ON "workers"("dormitory_bed_id");

-- CreateIndex
CREATE UNIQUE INDEX "worker_tax_statuses_worker_id_year_key" ON "worker_tax_statuses"("worker_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "student_evaluations_worker_id_key" ON "student_evaluations"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_letters_letter_number_key" ON "recruitment_letters"("letter_number");

-- CreateIndex
CREATE UNIQUE INDEX "entry_permits_permit_number_key" ON "entry_permits"("permit_number");

-- CreateIndex
CREATE UNIQUE INDEX "employment_permits_permit_number_key" ON "employment_permits"("permit_number");

-- CreateIndex
CREATE UNIQUE INDEX "permit_documents_permit_number_key" ON "permit_documents"("permit_number");

-- CreateIndex
CREATE UNIQUE INDEX "worker_timelines_deployment_id_key" ON "worker_timelines"("deployment_id");

-- CreateIndex
CREATE UNIQUE INDEX "domestic_recruitments_job_order_id_key" ON "domestic_recruitments"("job_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_candidates_interview_id_worker_id_key" ON "interview_candidates"("interview_id", "worker_id");

-- CreateIndex
CREATE INDEX "system_comments_record_table_name_record_id_idx" ON "system_comments"("record_table_name", "record_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_mentions_comment_id_mentioned_user_id_key" ON "comment_mentions"("comment_id", "mentioned_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_no_key" ON "bills"("bill_no");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_service_fees_deployment_id_key" ON "monthly_service_fees"("deployment_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_records_incident_id_key" ON "dispute_records"("incident_id");

-- CreateIndex
CREATE UNIQUE INDEX "advance_payments_bill_item_id_key" ON "advance_payments"("bill_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_bill_id_key" ON "invoices"("bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "tax_configs_year_key" ON "tax_configs"("year");
