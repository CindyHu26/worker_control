# language: zh-TW
Feature: 基礎參數設定 (Configuration)
  為了符合勞動部法規與公司作業流程
  身為 系統操作員
  我需要設定行業別與標準文件範本

  Background:
    Given 我以管理者身份登入

  Scenario: 設定製造業與家庭看護工的行業類別
    When 我批次匯入行業類別清單:
      | code | name_zh    | category      |
      | A01  | 金屬製造業 | MANUFACTURING |
      | H01  | 家庭看護工 | CARE_TAKER    |
    Then 資料庫 "industries" 表中應包含 "A01" 與 "H01"
    And 我應能為 "MANUFACTURING" 類別設定 "3K5級" 的核配比率規則

  Scenario: 設定申請類別 (Application Categories)
    When 我建立申請類別:
      | code | name_zh      | workerCategory |
      | MFG  | 製造業       | general        |
      | HC   | 家庭看護工   | general        |
      | IC   | 機構看護工   | general        |
    Then 資料庫 "application_categories" 應包含這些類別
    And 每個類別應可被關聯至雇主

  Scenario: 設定內部業務與雙語人員
    When 我在 "employees" 表中建立員工資料:
      | full_name | job_title | is_bilingual | is_sales |
      | 陳小美    | 雙語翻譯  | true         | false    |
      | 王大同    | 業務經理  | false        | true     |
    Then 該員工 "陳小美" 應可被指派為 "移工訪視人員"
    And 該員工 "王大同" 應可被指派為 "Leads" 的負責人

  Scenario: 設定收費項目 (Billing Items)
    When 我建立收費項目:
      | code       | name_zh    | category     | defaultAmount |
      | SVC_FEE    | 服務費     | SERVICE_FEE  | 1800          |
      | ARC_FEE    | 居留證費   | ARC_FEE      | 1000          |
      | HEALTH_CHK | 體檢費     | MEDICAL_FEE  | 2000          |
    Then 資料庫 "billing_items" 應包含這些項目
    And 這些項目應可用於計費方案

  Scenario: 設定國外仲介 (Overseas Agencies)
    When 我建立國外仲介:
      | nameEn       | country | licenseNo |
      | ABC Manpower | VN      | VN-12345  |
      | PH Agency    | PH      | PH-67890  |
    Then 資料庫 "agency_companies" 應包含這些仲介
    And 這些仲介應可被關聯至招募訂單
