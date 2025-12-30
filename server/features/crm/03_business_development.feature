# language: zh-TW
Feature: 業務開發與簽約 (CRM to Employer)
  為了擴大業務規模
  身為 業務人員
  我需要追蹤潛在客戶並將其轉化為正式簽約雇主

  Background:
    Given 我以業務人員身份登入
    And 系統中已設定好行業類別

  Scenario: 建立潛在客戶
    When 我建立一筆 "Lead" 資料:
      | company_name | 大發鋼鐵     |
      | tax_id       | 12345678     |
      | status       | NEW          |
      | source       | 電話銷售     |
    Then 資料庫 "leads" 表中應有該筆資料
    And 該 Lead 的狀態應為 "NEW"

  Scenario: 記錄客戶互動並更新狀態
    Given 系統中存在 Lead "大發鋼鐵" (狀態: NEW)
    When 我新增一筆 "CALL" 類型的互動紀錄:
      | notes     | 初次聯繫，客戶有意願了解 |
      | result    | POSITIVE                  |
      | next_date | 2024-02-01               |
    Then 該 Lead 的狀態應自動更新為 "CONTACTED"
    And 系統應建立一個跟進提醒

  Scenario: 安排客戶拜訪
    Given 系統中存在 Lead "大發鋼鐵" (狀態: CONTACTED)
    When 我新增一筆 "MEETING" 類型的互動紀錄:
      | notes     | 現場拜訪，介紹服務內容 |
      | result    | INTERESTED               |
    Then 該 Lead 的狀態應更新為 "NEGOTIATING"

  Scenario: 潛在客戶簽約轉正 (Lead Conversion)
    Given "Lead" "大發鋼鐵" 狀態為 "NEGOTIATING"
    And 客戶已決定簽約
    When 我執行 "轉化為雇主" (Convert to Employer) 動作
    Then 系統應在 "employers" 表中建立一筆新資料
    And 新雇主的 "統編" 應為 "12345678"
    And 原始 "Lead" 資料的 "convertedToEmployerId" 欄位應被填入
    And 該 Lead 的狀態應更新為 "CONVERTED"

  Scenario: 地址格式驗證
    Given 我正在建立新雇主資料
    When 我輸入地址資料:
      | city     | 台北市   |
      | district | 信義區   |
      | address  | 信義路五段7號 |
      | zipCode  | 110      |
    Then 系統應自動組裝 "fullAddress" 為 "台北市信義區信義路五段7號"
    And 系統應驗證地址欄位格式正確

  Scenario: 統編重複檢查
    Given 系統中已存在統編 "12345678" 的雇主
    When 我嘗試以統編 "12345678" 轉化 Lead 為雇主
    Then 系統應提示 "該統編已存在於系統中"
    And 轉化動作應被阻止
