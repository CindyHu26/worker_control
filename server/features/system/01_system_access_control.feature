# language: zh-TW
Feature: 系統存取與用戶管理 (System Access Control)
  為了確保個資安全與內網控管
  身為 系統管理員 (Admin/Manager)
  我需要能夠建立員工帳號並分配權限

  Background:
    Given 系統中已存在一位最高權限管理者 "admin"
    And 系統運行於受信任的內網環境

  Scenario: 高階主管新增一般行政人員
    Given 我以 "admin" 身份登入
    When 我建立一個新的使用者:
      | username | user_staff_01       |
      | role     | STAFF               |
      | email    | staff@company.local |
    Then 系統應在 "internal_users" 資料表中建立該帳號
    And 該帳號的預設狀態應為 "ACTIVE"

  Scenario: 一般員工嘗試新增帳號應被拒絕
    Given 我以 "user_staff_01" (角色: STAFF) 身份登入
    When 我嘗試發送請求至 "POST /api/users"
    Then 回應狀態碼應為 403 (Forbidden)
    And 系統不應建立任何新帳號

  Scenario: 密碼安全性要求
    Given 我以 "admin" 身份登入
    When 我嘗試建立一個密碼過短的使用者:
      | username | user_weak_pass      |
      | password | 123                 |
    Then 系統應拒絕建立該帳號
    And 回應錯誤訊息應包含 "密碼長度不足"

  Scenario: 帳號停用與禁止登入
    Given 系統中存在用戶 "user_left" 且狀態為 "ACTIVE"
    When 我將該用戶狀態更新為 "DISABLED"
    Then 該用戶嘗試登入時應收到 "帳號已停用" 訊息
