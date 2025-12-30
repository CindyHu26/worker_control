# language: zh-TW
Feature: 移工招募與入境作業 (Recruitment & Entry)
  為了引進外籍勞工
  身為 文件專員
  我需要管理從勞動部函文到移工入境的所有文件

  Background:
    Given 我以文件專員身份登入
    And 雇主 "大發鋼鐵" 已在系統中建立

  # ==========================================
  # 招募許可相關
  # ==========================================
  Scenario: 申請招募許可函
    Given 雇主 "大發鋼鐵" 需要引進製造業移工
    When 我為該雇主建立 "招募許可函" 申請:
      | job_type       | 製造業-3K5級 |
      | required_count | 5            |
      | nationality    | VN,PH,ID     |
    Then 系統應產生唯一的申請編號
    And 申請狀態應為 "PENDING"

  Scenario: 招募許可函核准
    Given 雇主 "大發鋼鐵" 有一份待核准的招募許可申請
    When 我輸入勞動部核准資訊:
      | permit_number | 勞動發事字第1130012345號 |
      | approved_count| 5                        |
      | valid_until   | 2024-12-31               |
    Then 招募許可狀態應更新為 "APPROVED"
    And 系統應記錄核准文號與有效期限

  # ==========================================
  # 招募訂單相關
  # ==========================================
  Scenario: 建立招募訂單 (Job Order)
    Given 雇主 "大發鋼鐵" 已取得勞動部 "招募許可函"
    When 我為該雇主建立一張 "Job Order":
      | job_type       | 3K製造業 |
      | required_count | 5        |
      | nationality    | VN,PH    |
      | agency         | ABC Manpower |
    Then 系統應產生唯一的 "Job Order ID"
    And 狀態應為 "OPEN"
    And 該訂單應關聯至招募許可函

  Scenario: 招募訂單指派國外仲介
    Given 存在一張 "OPEN" 狀態的招募訂單
    When 我將訂單指派給國外仲介 "ABC Manpower"
    Then 訂單狀態應更新為 "SOURCING"
    And 仲介應收到通知 (系統紀錄)

  # ==========================================
  # 選工與面試
  # ==========================================
  Scenario: 國外仲介提供候選人
    Given 招募訂單 "JO-001" 正在進行中
    When 國外仲介提供 3 位候選人:
      | name          | passport_no | nationality |
      | Nguyen Van A  | VN12345678  | VN          |
      | Nguyen Van B  | VN87654321  | VN          |
      | Maria Santos  | PH11223344  | PH          |
    Then 資料庫 "candidates" 應有這 3 位候選人
    And 候選人狀態應為 "PENDING"
    And 候選人應關聯至該招募訂單

  Scenario: 安排視訊面試
    Given 招募訂單 "JO-001" 有 3 位候選人
    When 我安排一場視訊面試:
      | date       | 2024-03-15     |
      | candidates | Nguyen Van A, Nguyen Van B |
    Then 系統應建立面試紀錄
    And 相關候選人狀態應更新為 "INTERVIEWING"

  Scenario: 面試結果錄取
    Given 候選人 "Nguyen Van A" 完成面試
    When 我將其面試結果標記為 "SELECTED"
    Then 系統應自動將該候選人轉入 "待入境" 流程
    And 該候選人應被標記為 "已佔用" 避免重複推薦
    And 招募訂單的 "已錄取人數" 應增加 1

  Scenario: 面試結果淘汰
    Given 候選人 "Nguyen Van B" 完成面試
    When 我將其面試結果標記為 "REJECTED"
    Then 該候選人狀態應更新為 "REJECTED"
    And 該候選人應可被其他訂單重新推薦

  # ==========================================
  # 入境前準備
  # ==========================================
  Scenario: 上傳入境文件
    Given 候選人 "Nguyen Van A" 已確認錄取
    When 我上傳以下文件:
      | type       | filename          |
      | VISA       | visa_nguyen.pdf   |
      | PERMIT_APP | permit_app.pdf    |
    Then 文件應儲存並關聯至該候選人
    And 系統應記錄上傳時間與操作人員

  Scenario: 設定入境日期
    Given 候選人 "Nguyen Van A" 文件已備齊
    When 我設定預計入境日期為 "2024-05-01"
    And 我輸入航班資訊 "CI-123"
    Then 系統應在 "EntryFiling" 模組中建立一筆入境案件
    And 系統應建立一個 "SystemAlert" 提醒在 "2024-05-04" 前進行入境通報 (3日內)

  Scenario: 入境通報期限計算
    Given 候選人 "Nguyen Van A" 預計於 "2024-05-01" 入境
    When 系統計算入境通報期限
    Then 通報期限應為入境日後 3 個工作日內
    And 系統應產生對應的提醒事項
