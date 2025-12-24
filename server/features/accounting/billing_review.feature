Feature: 帳務變更審核機制 (Billing Review Workflow)

  作為財務人員
  為了防止文書修改資料後帳務未同步
  我希望系統能自動偵測異動並提示審核

  Scenario: 文書修改宿舍觸發財務審核
    Given 系統中有一名移工 "ReviewWorker01"
    And 該移工目前居住於 "DormA" (租金 2000)
    And 該移工已有 "CONFIRMED" 的帳務計畫
    When 文書人員將該移工搬遷至 "DormB" (租金 1500)
    Then 該移工的帳務計畫狀態應變更為 "NEEDS_REVIEW"
    And 審核原因應包含 "住宿異動"

  Scenario: 財務審核差異並採納建議
    Given 移工 "ReviewWorker02" 的帳務計畫狀態為 "NEEDS_REVIEW"
    And 原帳務計畫顯示 2024-02-01 的宿舍費為 2000
    And 系統模擬計算顯示 2024-02-01 的宿舍費應為 1500
    When 財務人員呼叫模擬API並選擇 "採納建議"
    Then 帳務計畫中 2024-02-01 的宿舍費應更新為 1500
    And 系統應產生一筆 "BillingModificationLog" 紀錄
    And 帳務計畫狀態應回復為 "NORMAL" (或待確認)
