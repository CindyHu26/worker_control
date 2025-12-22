Feature: 雇主管理功能 (Employer CRUD)
  為了能順利管理雇主資料
  身為系統管理者
  我希望能透過 API 新增、查詢、修改雇主，並包含完整的關聯欄位

  Scenario: 成功新增包含完整資訊的雇主
    Given 我準備了一份完整的雇主資料 JSON
    And 該資料包含公司基本資訊 "Tech Corp" 和統編 "12345678"
    And 該資料包含負責人資訊 "John Doe"
    And 該資料包含詳細的 CorporateInfo 與 IndividualInfo
    When 我發送 POST 請求至 "/api/employers"
    Then 回應狀態碼應為 201
    And 回應資料應包含 "id" 欄位
    And 資料庫中應能找到統編為 "12345678" 的雇主
    And 該雇主的 "corporateInfo" 也不為空

  Scenario: 新增重複統編的雇主應失敗
    Given 資料庫中已存在統編為 "12345678" 的雇主
    When 我再次使用相同統編發送 POST 請求至 "/api/employers"
    Then 回應狀態碼應為 400
    And 回應錯誤訊息應包含 "Tax ID already exists" 或類似訊息
