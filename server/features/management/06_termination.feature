# language: zh-TW
Feature: 合約終止與離境 (Termination)
  為了正確結算費用並通報主管機關
  身為 行政人員
  我需要處理移工的離境或逃跑程序

  Background:
    Given 我以行政人員身份登入
    And 移工 "Nguyen Van A" 目前在職於雇主 "大發鋼鐵"

  # ==========================================
  # 期滿離境
  # ==========================================
  Scenario: 移工合約即將到期提醒
    Given 移工 "Nguyen Van A" 合約到期日為 "2027-05-01"
    When 系統於 "2027-03-01" 執行合約到期檢查
    Then 系統應產生 "WARNING" 等級的合約到期提醒
    And 提醒應包含建議動作 (續聘/離境)

  Scenario: 移工期滿離境
    Given 移工 "Nguyen Van A" 合約已到期
    And 雇主決定不續聘
    When 我執行 "期滿離境" 程序:
      | departure_date | 2027-05-15 |
      | flight_number  | CI-456     |
    Then 該 Worker 的狀態應更新為 "DEPARTED"
    And 該 Deployment 的 serviceStatus 應為 "commission_ended"
    And 系統應自動計算並顯示未結清帳款

  Scenario: 離境前帳款結算
    Given 移工 "Nguyen Van A" 即將離境
    And 該移工有未結清帳款 5000 元
    When 我查看離境結算報表
    Then 報表應顯示所有未付款項目
    And 系統應提示需收取尾款後才能完成離境

  # ==========================================
  # 轉出作業
  # ==========================================
  Scenario: 移工轉出至其他雇主
    Given 移工 "Nguyen Van A" 因故需轉換雇主
    And 新雇主 "鴻海科技" 已在系統中建立
    When 我執行 "轉出" 程序:
      | transfer_date   | 2025-08-01 |
      | new_employer    | 鴻海科技   |
      | transfer_reason | 雇主歇業   |
    Then 原 Deployment 狀態應更新為 "ended"
    And 原 Deployment 的 serviceStatus 應為 "transferred_out"
    And 系統應建立新的 Deployment 關聯至新雇主
    And 新 Deployment 的 sourceType 應為 "transfer_in"

  Scenario: 轉出申請許可追蹤
    Given 移工 "Nguyen Van A" 正在辦理轉出
    When 我記錄勞動部轉出許可:
      | permit_date   | 2025-07-20            |
      | permit_number | 勞動發管字第11300456號 |
    Then 轉出許可資訊應被儲存
    And 系統應更新相關時程提醒

  # ==========================================
  # 逃跑通報
  # ==========================================
  Scenario: 移工失聯初報
    Given 接獲通知移工 "Nguyen Van B" 未按時上班
    When 我建立一筆 "失聯" 紀錄:
      | missing_date | 2025-03-10 |
      | last_contact | 2025-03-09 |
      | notes        | 手機關機無法聯繫 |
    Then 移工狀態應標記為 "MISSING"
    And 系統應產生 "WARNING" 等級警報
    And 系統應開始計算失聯天數

  Scenario: 移工逃跑通報 (滿3日)
    Given 移工 "Nguyen Van B" 已失聯滿 3 日
    When 我建立正式 "Runaway" 紀錄:
      | runaway_date | 2025-03-13 |
      | status       | confirmed_runaway |
    Then 系統應立即產生 "CRITICAL" 等級的系統警報
    And 該 Worker 狀態應標記為 "RUNAWAY"
    And 系統應鎖定該移工的後續服務排程
    And 系統應記錄需向移民署通報的時限

  Scenario: 逃跑通報完成
    Given 移工 "Nguyen Van B" 已確認逃跑
    When 我完成逃跑通報並輸入:
      | report_date   | 2025-03-15            |
      | report_doc_no | 逃報字第11303150001號 |
    Then 逃跑通報紀錄應被儲存
    And 相關的通報提醒應標記為 "已完成"

  Scenario: 逃跑移工尋獲
    Given 移工 "Nguyen Van B" 狀態為 "RUNAWAY"
    When 我更新該移工為 "已尋獲":
      | found_date | 2025-04-01 |
      | notes      | 警方協尋尋獲 |
    Then 移工狀態應更新為適當的後續狀態
    And 系統應記錄尋獲資訊
    And 後續處理流程應重新啟動

  # ==========================================
  # 其他終止情況
  # ==========================================
  Scenario: 移工死亡處理
    Given 接獲通知移工 "Nguyen Van C" 不幸於工作中身亡
    When 我建立 "死亡" 終止紀錄:
      | death_date | 2025-06-15    |
      | cause      | 工傷意外       |
      | incident   | 建立工傷事件   |
    Then 移工狀態應更新為 "DECEASED"
    And 系統應自動建立 "CRITICAL" 等級的 Incident
    And 該移工的所有排程應立即終止
    And 系統應產生相關通報與保險處理提醒

  Scenario: 合約提前終止 (雇主因素)
    Given 雇主 "大發鋼鐵" 因營業問題需提前終止合約
    When 我為移工 "Nguyen Van A" 執行 "提前終止" 程序:
      | termination_date | 2025-09-01    |
      | reason           | 雇主歇業       |
      | compensation     | 已結算資遣費   |
    Then 移工狀態應更新為 "TERMINATED"
    And 系統應記錄終止原因
    And 移工應可進入轉出流程
