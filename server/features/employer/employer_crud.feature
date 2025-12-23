Feature: 雇主管理功能 (Employer CRUD)
  為了能順利管理不同類型的雇主
  身為系統管理者
  我希望能透過 API 根據雇主類型 (家庭/事業) 進行正確的資料驗證與寫入

  Scenario: 成功新增家庭類雇主 (Household)
    Given 我準備了一份 "HOME_CARE" 類型的雇主資料
    And 該資料不包含統編，但包含負責人身分證字號 "A123456789"
    And 該資料包含負責人姓名 "王小明"
    When 我發送 POST 請求至 "/api/employers"
    Then 回應狀態碼應為 201
    And 資料庫中該雇主的 "individualInfo" 應包含身分證字號 "A123456789"
    And 該雇主不應有統編

  Scenario: 成功新增事業類雇主 (Business)
    Given 我準備了一份 "MANUFACTURING" 類型的雇主資料
    And 該資料包含統編 "12345678" 和負責人 "陳大同"
    When 我發送 POST 請求至 "/api/employers"
    Then 回應狀態碼應為 201
    And 資料庫中該雇主應有統編 "12345678"
    And 該雇主的 "corporateInfo" 不為空

  Scenario: 家庭類雇主缺少身分證字號應失敗
    Given 我準備了一份 "HOME_CARE" 類型的雇主資料
    And 該資料不包含身分證字號
    When 我發送 POST 請求至 "/api/employers"
    Then 回應狀態碼應為 400
    And 回應錯誤訊息應包含 "Missing responsible person ID" 或類似訊息

  Scenario: 事業類雇主缺少統編應失敗
    Given 我準備了一份 "MANUFACTURING" 類型的雇主資料
    And 該資料不包含統編
    When 我發送 POST 請求至 "/api/employers"
    Then 回應狀態碼應為 400
    And 回應錯誤訊息應包含 "Missing Tax ID" 或類似訊息
