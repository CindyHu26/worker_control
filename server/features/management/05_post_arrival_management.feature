# language: zh-TW
Feature: 入境後管理 (Post-Arrival Management)
  為了符合就業服務法規定
  身為 行政人員
  我需要追蹤移工的體檢與訪視紀錄

  Background:
    Given 我以行政人員身份登入
    And 雇主 "大發鋼鐵" 已在系統中建立

  # ==========================================
  # 入境確認與建檔
  # ==========================================
  Scenario: 移工入境並建立檔案
    Given 候選人 "Nguyen Van A" 預計於今日入境
    When 我執行 "確認入境" 動作:
      | actual_entry_date | 2024-05-01 |
      | flight_number     | CI-123     |
    Then 系統應將 "Candidate" 資料轉換為 "Worker"
    And 新建立的 Worker 狀態應為 "ACTIVE"
    And 系統應自動建立 "Deployment" 關聯至雇主

  Scenario: 自動計算定期體檢日期
    Given 移工 "Nguyen Van A" 於 "2024-05-01" 入境
    When 系統計算法定體檢日期
    Then 系統應自動設定以下體檢日期:
      | type       | date       |
      | 6個月體檢  | 2024-11-01 |
      | 18個月體檢 | 2025-11-01 |
      | 30個月體檢 | 2026-11-01 |
    And 系統應在 "system_alerts" 產生對應日期的提醒

  Scenario: 入境通報完成
    Given 移工 "Nguyen Van A" 已於 "2024-05-01" 入境
    When 我完成入境通報並輸入:
      | report_date   | 2024-05-03                |
      | report_doc_no | 入通字第113050300001號   |
    Then 入境通報紀錄應被儲存
    And 相關的入境通報提醒應標記為 "已完成"

  # ==========================================
  # 定期體檢管理
  # ==========================================
  Scenario: 安排體檢 (6個月)
    Given 移工 "Nguyen Van A" 的 6 個月體檢到期日為 "2024-11-01"
    When 系統於 "2024-10-15" 執行體檢提醒排程
    Then 系統應產生 "WARNING" 等級的體檢提醒
    And 提醒內容應包含移工姓名與體檢類型

  Scenario: 體檢結果登錄 - 合格
    Given 移工 "Nguyen Van A" 完成 6 個月體檢
    When 我登錄體檢結果:
      | check_date | 2024-10-25 |
      | result     | PASS       |
      | hospital   | 台大醫院   |
    Then 體檢紀錄應被儲存
    And 體檢結果應為 "PASS"
    And 體檢提醒狀態應更新為 "RESOLVED"

  Scenario: 體檢結果登錄 - 不合格
    Given 移工 "Nguyen Van B" 完成 6 個月體檢
    When 我登錄體檢結果:
      | check_date  | 2024-10-25     |
      | result      | FAIL           |
      | fail_reason | 胸部X光異常    |
    Then 系統應自動產生 "CRITICAL" 等級的 Incident
    And 移工狀態應標記為 "PENDING_REVIEW"
    And 系統應通知相關人員進行後續處理

  Scenario: 補充體檢
    Given 移工 "Nguyen Van B" 體檢不合格需要複檢
    When 我安排補充體檢:
      | scheduled_date | 2024-11-10 |
      | hospital       | 台大醫院   |
    Then 系統應建立 "SUPPLEMENTARY" 類型的體檢紀錄
    And 系統應產生複檢提醒

  # ==========================================
  # 宿舍與生活訪視
  # ==========================================
  Scenario: 指派宿舍
    Given 移工 "Nguyen Van A" 已入境
    And 系統中存在宿舍 "工廠宿舍 A" 尚有空床位
    When 我將移工指派至 "工廠宿舍 A" 的床位 "A-101"
    Then 移工的住宿紀錄應被更新
    And 宿舍床位 "A-101" 狀態應更新為 "已佔用"

  Scenario: 宿舍訪視紀錄 - 合格
    Given 移工 "Nguyen Van A" 居住在 "工廠宿舍 A"
    And 雙語人員 "陳小美" 負責該移工
    When 雙語人員填寫 "生活訪視紀錄表":
      | visit_date      | 2024-06-01 |
      | environment     | 符合規定   |
      | worker_feedback | 良好       |
      | notes           | 無異常     |
    Then 該紀錄應被儲存並關聯至該移工與雇主
    And 訪視紀錄狀態應為 "COMPLIANT"

  Scenario: 宿舍訪視紀錄 - 不合格
    Given 移工 "Nguyen Van C" 居住在 "工廠宿舍 B"
    When 雙語人員填寫 "生活訪視紀錄表":
      | visit_date      | 2024-06-01      |
      | environment     | 不符合規定      |
      | issues          | 消防設備不足    |
      | severity        | HIGH            |
    Then 系統應產生 "HIGH" 等級的 Incident 警報
    And 系統應自動通知雇主進行改善
    And 訪視紀錄狀態應為 "NON_COMPLIANT"

  # ==========================================
  # 服務團隊指派
  # ==========================================
  Scenario: 指派服務團隊
    Given 移工 "Nguyen Van A" 已入境
    When 我指派服務團隊:
      | role        | employee  |
      | 業務人員    | 王大同    |
      | 雙語人員    | 陳小美    |
      | 行政人員    | 李小芳    |
    Then 每個角色的指派紀錄應儲存在 "service_assignments"
    And 這些人員應可查看該移工的相關資訊

  Scenario: 服務人員轉換
    Given 移工 "Nguyen Van A" 的雙語人員為 "陳小美"
    When 我將雙語人員更換為 "林大華"
    Then "陳小美" 的服務指派應設定結束日期
    And "林大華" 應建立新的服務指派紀錄
    And 系統應保留完整的服務歷史
