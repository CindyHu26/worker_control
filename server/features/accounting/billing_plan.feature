Feature: Billing Plan Generation
  As an accountant
  I want to automatically generate a 3-year billing plan for a worker's deployment
  So that I can verify and forecast future receivables

  Scenario: 服務費破月計算 (Service Fee Proration)
    Given 移工於 "2024-01-15" 入境，服務費每月 1500
    When 生成收款計畫
    Then "2024-01" 的服務費應為 750 元
    And "2024-02" 的服務費應為 1500 元

  Scenario: 護照過期導致居留證費用變動 (Passport Expiry Logic)
    Given 合約為 3 年
    But 移工護照只剩 1.5 年效期
    When 生成 ARC 費用
    Then 應產生 2000 元 的費用
    And 備註應提示 "護照效期限制"

  Scenario: 房租關聯 (Dormitory Linkage)
    Given 宿舍 A 租金 2000，宿舍 B 租金 1500
    When 移工住 "宿舍 B" 並生成計畫
    Then 每月應產生 1500 元的房租
