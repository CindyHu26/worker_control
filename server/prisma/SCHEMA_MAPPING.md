# Schema Field Mapping (Chinese - English)

This document provides a reference for mapping database schema fields to their English descriptions and original Chinese labels (Taiwan government terminology).

## Enums

| Enum | Value | English Description | Chinese Label |
| :--- | :--- | :--- | :--- |
| **UserRole** | admin | System Admin | 系統管理員 |
| | manager | Manager | 主管 |
| | staff | Regular Staff | 一般員工 |
| **GenderType** | male | Male | 男 |
| | female | Female | 女 |
| | other | Other | 其他 |
| **DeploymentStatus** | active | Active | 在職中 |
| | ended | Ended | 已結束 |
| | pending | Pending | 待報到 |
| | terminated | Terminated | 已終止 |
| **PermitType** | initial | Initial Recruitment | 初次招募 (勞動部許可類別) |
| | extension | Extension | 展延聘僱 |
| | reissue | Reissue | 補發 |
| **HealthCheckType** | entry | Entry Exam (3 days) | 入國後三日內體檢 |
| | 6mo | 6-Month Periodic | 6個月定期健康檢查 |
| | 18mo | 18-Month Periodic | 18個月定期健康檢查 |
| | 30mo | 30-Month Periodic | 30個月定期健康檢查 |
| | supplementary | Supplementary | 補檢 |
| **HealthCheckResult** | pass | Pass | 合格 |
| | fail | Fail | 不合格 |
| | pending | Pending | 待確認 |
| **WorkerCategory** | general | General Worker | 一般外籍勞工 |
| | intermediate_skilled | Intermediate Skilled | 中階技術人員 |
| | professional | Professional | 專業人員 |
| **ManagementSourceType** | direct_hiring | Direct Hiring | 直接聘僱 |
| | re_hiring | Re-hiring | 重新聘僱 |
| | transfer_in | Transfer In | 承接 (轉入) |
| | replacement | Replacement | 遞補 |
| **ServiceStatus** | active_service | Active Service | 委任中 |
| | contract_terminated | Contract Terminated | 終止委任 |
| | runaway | Runaway | 失聯 (行方不明) |
| | transferred_out | Transferred Out | 已轉出 |
| | commission_ended | Commission Ended | 委任結束 |
| **StaffRoleType** | sales_agent | Sales Agent | 業務人員 |
| | admin_staff | Admin Staff | 行政人員 |
| | bilingual_staff | Bilingual Staff | 雙語人員 |
| | customer_service | Customer Service | 服務人員 |
| | accountant | Accountant | 會計 |
| **InsuranceType** | labor | Labor Insurance | 勞工保險 |
| | health | Health Insurance | 全民健康保險 |
| | accident | Accident Insurance | 意外險 |
| **AddressType** | approval_letter | Approval Letter Address | 核函地址 |
| | medical_pickup | Medical Pickup Address | 體檢接送地址 |
| | actual_residence | Actual Residence Address | 實際居住地址 |
| | arc | ARC Address | 居留證地址 |
| | work | Work Address | 工作地址 |
| **JobOrderStatus** | open | Open | 須缺中 |
| | sourcing | Sourcing | 選工中 |
| | partial | Partial | 部分選定 |
| | filled | Filled | 額滿 |
| | processing | Processing | 處理中 |
| | completed | Completed | 已完成 |
| | cancelled | Cancelled | 已取消 |
| **CandidateResult** | selected | Selected | 錄取 |
| | rejected | Rejected | 未錄取 |
| | failed_medical | Failed Medical | 體檢不合格 |
| | pending | Pending | 待定 |
| **WorkerEventType** | RUNAWAY | Runaway | 失聯 (行方不明) |
| | TRANSFER_OUT | Transfer Out | 轉出 |
| | DEPARTURE | Departure | 出境 |
| | DOMESTIC_HIRE | Domestic Hire | 國內承接 (轉換雇主) |
| | CONTRACT_RENEWAL | Contract Renewal | 續約 |
| | DEATH | Death | 死亡 |
| | OTHER | Other | 其他 |
| **RunawayStatus** | reported_internally | Reported Internally | 內部通報 |
| | notification_submitted | Notification Submitted | 已通報移民署 |
| | confirmed_runaway | Confirmed Runaway | 確認失聯 |
| | found | Found | 已尋獲 |
| **EmployerType** | BUSINESS | Business Entity | 事業單位 |
| | INDIVIDUAL | Individual | 自然人 |
| | INSTITUTION | Institution | 機構 |
| **CommentEntityType** | WORKER | Worker | 移工 |
| | EMPLOYER | Employer | 雇主 |
| | DEPLOYMENT | Deployment | 派工記錄 |
| | JOB_ORDER | Job Order | 招募單 |
| | LEAD | Lead | 潛在客戶 |
| | HEALTH_CHECK | Health Check | 健康檢查 |
| **AlertSeverity** | CRITICAL | Critical | 緊急 |
| | WARNING | Warning | 警告 |
| | INFO | Info | 資訊 |
| **AlertStatus** | OPEN | Open | 待處理 |
| | ACKNOWLEDGED | Acknowledged | 已確認 |
| | RESOLVED | Resolved | 已解決 |

## Models

### ApplicationCategory (申請類別)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **code** | Category Code | 申請類別代碼 |
| **nameZh** | Category Name (Chinese) | 類別名稱 (中文) |
| **nameEn** | Category Name (English) | 類別名稱 (英文) |
| **type** | Employer Type | 雇主類型 |
| **quotaBaseRate** | Quota Base Rate | 基礎核配率 |
| **securityFeeStandard** | Standard Security Fee | 標準就業安定費 |
| **iconName** | Icon Name | 圖示名稱 |
| **color** | Color | 顏色 |
| **isActive** | Is Active | 是否啟用 |

### WorkTitle (工種)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **code** | Work Title Code | 工種代碼 |
| **titleZh** | Work Title (Chinese) | 工種名稱 (中文) |
| **titleEn** | Work Title (English) | 工種名稱 (英文) |
| **titleTh** | Work Title (Thai) | 工種名稱 (泰文) |
| **titleId** | Work Title (Indonesian) | 工種名稱 (印尼文) |
| **titleVn** | Work Title (Vietnamese) | 工種名稱 (越文) |
| **isIntermediate** | Is Intermediate Skilled | 是否為中階技術人員 |
| **isDefault** | Is Default Title | 是否為該類別預設工種 |
| **employmentSecurityFee** | Empl. Security Fee | 一般就業安定費 |
| **reentrySecurityFee** | Re-entry Security Fee | 重入國就業安定費 |
| **agencyAccidentInsurance** | Agency Accident Ins. | 代辦意外險加保 |
| **agencyAccidentInsuranceAmt** | Agency Accident Ins. Amt | 代辦意外險保額 |
| **agencyLaborHealthInsurance** | Agency Labor/Health Ins. | 代辦勞健保加保 |
| **collectBankLoan** | Collect Bank Loan | 代收銀行貸款 |
| **payDay** | Pay Day | 發薪日 |
| **requiresMedicalCheckup** | Requires Medical Checkup | 是否需每半年體檢 |
| **isActive** | Is Active | 是否啟用 |

### Industry (行業別)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **code** | Industry Code | 行業代碼 |
| **category** | Industry Category (A,B..) | 行業大類 |
| **nameZh** | Industry Name (Chinese) | 行業名稱 (中文) |
| **nameEn** | Industry Name (English) | 行業名稱 (英文) |

### DomesticAgency (國內仲介)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **code** | Agency Code | 代號 |
| **agencyNameZh** | Agency Name (Chinese) | 公司名稱-中 |
| **agencyNameEn** | Agency Name (English) | 公司名稱-英 |
| **agencyNameShort** | Agency Short Name | 公司名稱-簡 |
| **phone** | Phone | 電話 |
| **fax** | Fax | 傳真 |
| **email** | Email | E-MAIL |
| **emergencyEmail** | Emergency Email | 緊急待辦收件者e-mail |
| **website** | Website | 網址 |
| **customerServicePhone** | Customer Service Phone | 客戶申訴專線 |
| **emergencyPhone** | Emergency Phone | 緊急連絡電話 |
| **zipCode** | Zip Code | 郵遞區號 |
| **city** | City | 縣市 |
| **district** | District | 鄉鎮市區 |
| **addressZh** | Address (Chinese) | 公司地址-中 (路段/巷弄/號) |
| **addressEn** | Address (English) | 公司地址-英 (路段/巷弄/號) |
| **representativeName** | Representative Name | 負責人姓名 |
| **representativeNameEn** | Representative Name (English) | 負責人姓名-英 |
| **representativeIdNo** | Representative ID No | 負責人身分證號 |
| **representativePassport** | Representative Passport | 負責人護照號碼 |
| **checkPayableTo** | Check Payable To | 請款開立支票抬頭 |
| **taxId** | Tax ID (Unified Business No) | 公司統一編號 |
| **taxRegistrationNo** | Tax Registration No | 稅籍編號 |
| **permitNumber** | Permit Number | 公司許可證字號 |
| **permitValidFrom** | Permit Valid From | 公司許可證效期-起 |
| **permitValidTo** | Permit Valid To | 公司許可證效期-訖 |
| **businessRegistrationNo** | Business Registration No | 營利事業登記證號 |
| **postalAccountNo** | Postal Account No | 郵政劃撥帳號 |
| **postalAccountName** | Postal Account Name | 郵政劃撥帳號-戶名 |
| **bankName** | Bank Name | 匯款銀行名稱 |
| **bankCode** | Bank Code | 銀行總行代號 |
| **bankBranchCode** | Bank Branch Code | 銀行分支單位代號 |
| **bankAccountNo** | Bank Account No | 銀行帳號 |
| **bankAccountName** | Bank Account Name | 銀行帳戶名稱 |
| **accountant** | Accountant | 帳務會計 |
| **isActive** | Is Active | 是否啟用 |

### PartnerAgency (國外仲介)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **code** | Agency Code | 代號 |
| **agencyNameZh** | Agency Name (Chinese) | 公司名稱-中 |
| **agencyNameZhShort** | Agency Name Short (Chinese) | 公司名稱-中簡 |
| **agencyNameEn** | Agency Name (English) | 公司名稱-英 |
| **agencyNameEnShort** | Agency Name Short (English) | 公司名稱-英簡 |
| **phone** | Phone | 電話 |
| **fax** | Fax | 傳真 |
| **email** | Email | E-mail |
| **country** | Country Code | 國別代碼 |
| **countryNameZh** | Country Name (Chinese) | 國別中文 |
| **addressZh** | Address (Chinese) | 公司地址-中 |
| **addressEn** | Address (English) | 公司地址-英 |
| **addressShort** | Address Short | 公司地址-簡 |
| **contactPerson** | Contact Person | 聯絡人 |
| **contactPhone** | Contact Phone | 聯絡電話 |
| **mailingAddressZh** | Mailing Address (Chinese) | 寄件地址-中文 |
| **mailingAddressEn** | Mailing Address (English) | 寄件地址-英文 |
| **representativeName** | Representative Name | 負責人姓名 |
| **representativeNameEn** | Rep. Name (English) | 負責人姓名-英 |
| **representativeIdNo** | Rep. ID Number | 負責人身分證號 |
| **representativePassport** | Rep. Passport Number | 負責人護照號碼 |
| **taxId** | Tax ID | 公司統一編號 |
| **businessRegistrationNo** | Business Registration No | 營利事業登記證號 |
| **permitNumber** | Permit Number | 公司許可證字號 |
| **foreignLicenseNo** | Foreign License No | 國外執照編號 |
| **foreignLicenseExpiry** | Foreign License Expiry | 國外執照效期 |
| **molPermitNo** | MOL Permit No | 勞動部許可編號 |
| **molValidFrom** | MOL Valid From | 勞動部認可有效起始日 |
| **molValidTo** | MOL Valid To | 勞動部認可有效屆滿日 |
| **payeeName** | Payee Name | 收款人 |
| **bankName** | Bank Name | 銀行名稱 |
| **bankAccountNo** | Bank Account No | 銀行帳號 |
| **bankAddress** | Bank Address | 銀行地址 |
| **loanBankCode** | Loan Bank Code | 配合貸款銀行代碼 |
| **isActive** | Is Active | 使用中 |
| **notes** | Notes | 備註 |

### Employee (員工)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **code** | Employee Code | 代碼 |
| **fullName** | Full Name | 中文姓名 |
| **fullNameEn** | Full Name (English) | 英文姓名 |
| **jobTitle** | Job Title | 職務名稱 |
| **departmentCode** | Department Code | 部門代碼 |
| **gender** | Gender | 性別 |
| **nationality** | Nationality | 國籍 |
| **dateOfBirth** | Date of Birth | 生日 |
| **idNumber** | ID Number | 身分證字號 |
| **employeeNumber** | Employee Number | 員工編號 |
| **phone** | Phone | 電話 |
| **mobilePhone** | Mobile Phone | 手機 |
| **extension** | Extension | 分機 |
| **email** | Email | E-mail |
| **mailingAddressZh** | Mailing Address (Chinese) | 通訊住址-中文 |
| **mailingAddressEn** | Mailing Address (English) | 通訊住址-英文 |
| **residentialAddressZh** | Residential Addr. (Chinese) | 戶籍住址-中文 |
| **residentialAddressEn** | Residential Addr. (English) | 戶籍住址-英文 |
| **emergencyContact** | Emergency Contact | 緊急連絡人 |
| **emergencyPhone** | Emergency Phone | 緊急連絡人電話 |
| **isActive** | Is Active | 是否在職 |
| **hireDate** | Hire Date | 到職日 |
| **resignationDate** | Resignation Date | 離職日 |
| **insuranceStartDate** | Insurance Start Date | 加保日 |
| **insuranceEndDate** | Insurance End Date | 退保日 |
| **bankName** | Bank Name | 匯款銀行名稱 |
| **bankAccountName** | Bank Account Name | 銀行帳戶名稱 |
| **bankAccountNo** | Bank Account No | 匯款銀行帳號 |
| **notes** | Notes | 備註 |

### Employer (雇主)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **code** | Employer Code | 雇主代碼 |
| **type** | Employer Type | 雇主類別 (事業單位/家庭/機構) |
| **companyName** | Company Name | 雇主名稱 |
| **taxId** | Tax ID (Unified Business No) | 統一編號 |
| **laborInsuranceNo** | Labor Insurance No | 勞保證號 |
| **healthInsuranceNo** | Health Insurance No | 健保證號 |
| **unitTaxId** | Unit Tax ID | 單位稅籍編號 |
| **houseTaxId** | House Tax ID | 房屋稅籍編號 |
| **phone** | Phone | 電話 |
| **fax** | Fax | 傳真 |
| **email** | Email | 電子郵件 |
| **liaisonName** | Liaison Name | 聯絡人姓名 |
| **liaisonRole** | Liaison Role | 聯絡人職稱 |
| **liaisonPhone** | Liaison Phone | 聯絡人電話 |
| **zipCode** | Zip Code | 郵遞區號 |
| **city** | City | 縣市 |
| **address** | Address (Street/Lane) | 地址 (路段/巷弄/號) |

### EmployerFactory (雇主工廠)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **name** | Factory Name | 廠商名稱 |
| **factoryRegNo** | Factory Registration No | 廠商登記編號 |
| **zipCode** | Zip Code | 廠商郵遞區號 |
| **city** | City | 廠商縣市 |
| **district** | District | 廠商鄉鎮市區 |
| **address** | Address (Street/Lane) | 廠商地址 (路段/巷弄/號) |
| **addressEn** | Address (English) | 廠商地址 (英文) |
| **taxId** | Tax ID | 統一編號 |
| **laborInsuranceNo** | Labor Insurance No | 勞保證號 |
| **healthInsuranceNo** | Health Insurance No | 健保證號 |
| **ranking** | Factory Ranking (3K) | 3K五級制 |
| **laborCount** | Domestic Labor Count | 本勞人數 |
| **foreignCount** | Foreign Labor Count | 外勞人數 |

### IndividualInfo (自然人/詳細資料)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **responsiblePersonDob** | Responsible Person DOB | 負責人出生日期 |
| **responsiblePersonIdNo** | Responsible Person ID No | 負責人身分證號 |
| **responsiblePersonSpouse** | Spouse Name | 配偶姓名 |
| **mobilePhone** | Mobile Phone | 負責人行動電話 |
| **englishName** | English Name | 英文姓名 |
| **birthPlace** | Birth Place | 出生地 |
| **birthPlaceEn** | Birth Place (English) | 出生地 (英文) |
| **residenceZip** | Residence Zip | 戶籍郵遞區號 |
| **residenceCity** | Residence City | 戶籍縣市 |
| **residenceDistrict** | Residence District | 戶籍鄉鎮市區 |
| **residenceAddress** | Residence Address | 戶籍地址 (路段/巷弄/號) |
| **idIssueDate** | ID Issue Date | 發證日期 |
| **idIssuePlace** | ID Issue Place | 發證地點 |
| **idIssueType** | ID Issue Type | 發證類別 (初發/補發/換發) |
| **patientName** | Patient Name | 被看護人姓名 |
| **patientIdNo** | Patient ID No | 被看護人身分證號 |
| **careAddress** | Care Address | 照護地點 |
| **relationship** | Relationship | 關係 |

### Worker (移工)
| Field | English Description | Chinese Label |
| :--- | :--- | :--- |
| **englishName** | English Name | 英文姓名 |
| **chineseName** | Chinese Name | 中文姓名 |
| **photoUrl** | Photo URL | 照片網址 |
| **dob** | Date of Birth | 出生日期 |
| **category** | Worker Category | 移工類別 (一般/中階/專業) |
| **gender** | Gender | 性別 |
| **mobilePhone** | Mobile Phone | 手機號碼 |
| **foreignAddress** | Foreign Address | 國外地址 |
| **maritalStatus** | Marital Status | 婚姻狀況 |
| **marriageDate** | Marriage Date | 結婚日期 |
| **divorceDate** | Divorce Date | 離婚日期 |
| **height** | Height | 身高 |
| **weight** | Weight | 體重 |
| **birthPlace** | Birth Place | 出生地 |
| **educationLevel** | Education Level | 教育程度 |
| **spouseName** | Spouse Name | 配偶姓名 |
| **overseasContactPhone** | Overseas Contact Phone | 國外聯絡電話 |
| **overseasFamilyContact** | Overseas Family Contact | 國外家屬聯絡人 |
| **lineId** | LINE ID | LINE ID |
| **religion** | Religion | 宗教 |
| **emergencyContactName** | Emergency Contact (TW) | 台灣緊急聯絡人 |
| **emergencyContactPhone** | Emergency Phone (TW) | 台灣緊急聯絡電話 |
| **bankAccountNo** | Bank Account No | 銀行帳號 |
| **bankCode** | Bank Code | 銀行代碼 |
| **loanBank** | Loan Bank | 貸款銀行 |
| **loanAmount** | Loan Amount | 貸款金額 |
| **flightArrivalInfo** | Flight Arrival Info | 入境班機資訊 |
| **flightDeparture** | Flight Departure Info | 出境班機資訊 |
| **oneStopServiceSerial** | One-Stop Service Serial | 一站式服務序號 |
| **residencePermitExpiry** | Residence Permit Expiry | 居留證效期 |
| **passportExpiry** | Passport Expiry | 護照效期 |


