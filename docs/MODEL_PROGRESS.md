# Model Implementation Progress (CRUD)

Tracking implementation status for all models defined in `schema.prisma`.

## [Legend]
- ✅ : Full CRUD + UI + Integration
- 🚧 : Partial (API done, UI in progress)
- 📝 : Backend Service/Route only
- 💤 : Schema only (Not implemented)

---

## 🏗️ Reference Data / Settings
| Model Name | Status | Type | Path |
| :--- | :---: | :--- | :--- |
| `EmployerCategory` | ✅ | Reference | `/employer-categories` |
| `JobType` | ✅ | Reference | `/job-types` |
| `Industry` | ✅ | Reference | `/industries` |
| `IndustryJobTitle` | ✅ | Reference | `/industry-job-titles` |
| `DomesticAgency` | ✅ | Reference | `/domestic-agencies` |
| `Bank` | ✅ | Reference | `/banks` |
| `PartnerAgency` | ✅ | Reference | `/partner-agencies` |
| `Department` | 💤 | Reference | - |
| `LoanBank` | 💤 | Reference | - |
| `ContractType` | 💤 | Reference | - |

## 👥 Personnel & Organizations
| Model Name | Status | Type | Path |
| :--- | :---: | :--- | :--- |
| `InternalUser` | ✅ | Core | (Login/Auth) |
| `Employee` | ✅ | Core | `/employees` |
| `Employer` | ✅ | Core | `/employers` |
| `Worker` | ✅ | Core | `/workers` |

## 💼 Operational Documents
| Model Name | Status | Type | Path |
| :--- | :---: | :--- | :--- |
| `RecruitmentLetter` | ✅ | Doc | `/recruitment` |
| `EntryPermit` | ✅ | Doc | `/recruitment` |
| `Deployment` | ✅ | Core | `/deployments` |
| `WorkerPassport` | ✅ | History | `/workers/[id]` |
| `WorkerArc` | ✅ | History | `/workers/[id]` |
| `PartnerAgencyContract` | 💤 | Doc | - |

## 🛠️ Infrastructure & Others
| Model Name | Status | Type | Path |
| :--- | :---: | :--- | :--- |
| `AuditLog` | 💤 | System | - |
| `SystemComment` | 💤 | System | - |

---

> [!NOTE]
> This list is automatically maintained during the development process.
