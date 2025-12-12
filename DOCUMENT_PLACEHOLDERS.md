# Document Generation Update: Agency & Foreign Agency Support

## Overview
The document generation system has been enhanced to automatically fetch and map context-specific agency data. Use the following placeholders in your .docx templates.

## New Placeholders

### 1. Agency Company (Internal)
*Logic: Fetches the agency linked to the Employer. If none, falls back to the Default Agency.*

*   **`{agency_name}`** - Agency Name (e.g. "Da-An Manpower")
*   **`{agency_license_no}`** - License Number
*   **`{agency_tax_id}`** - Tax ID
*   **`{agency_address}`** - Address
*   **`{agency_phone}`** - Phone Number
*   **`{agency_fax}`** - Fax Number
*   **`{agency_email}`** - Email Address
*   **`{agency_responsible_person}`** - Responsible Person

### 2. Foreign Agency (Overseas Partner)
*Logic: Fetches the foreign agency linked to the Worker.*

*   **`{foreign_agency_name}`** - Name
*   **`{foreign_agency_code}`** - Code (e.g. "VN-001")
*   **`{foreign_agency_country}`** - Country Code (VN, ID, PH, TH)

## Existing Placeholders (Refresher)
*   **Worker**: `{worker_name_en}`, `{worker_name_cn}`, `{worker_nationality}`, `{worker_dob}`, `{worker_mobile}`
*   **Employer**: `{employer_name}`, `{employer_tax_id}`, `{employer_address}`, `{employer_rep}`, `{employer_phone}`
*   **Job**: `{job_description}`, `{entry_date}`, `{contract_start}`, `{contract_end}`
*   **Dormitory**: `{dorm_name}`, `{dorm_address}`, `{dorm_landlord}`, `{dorm_room}`, `{dorm_bed}`
*   **Documents**: `{passport_no}`, `{passport_issue_date}`, `{arc_no}`, `{arc_issue_date}`

## Verification
You can now proceed to test document generation. If an employer is linked to "Branch A", the generated document will show Branch A's details. If no link exists, it will show the Default Agency's details.
