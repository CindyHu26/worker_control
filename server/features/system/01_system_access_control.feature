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
      | role     | staff               |
      | email    | staff@company.local |
    Then 系統應在 "internal_users" 資料表中建立該帳號
    And 該帳號的預設狀態應為 "ACTIVE"

  Scenario: 一般員工嘗試新增帳號應被拒絕
    Given 我以 "user_staff_01" (角色: staff) 身份登入
    When 我嘗試發送請求至 "POST /api/users"
    Then 回應狀態碼應為 403 (Forbidden)
    And 系統不應建立任何新帳號

  Scenario: 管理者可以更新用戶角色
    Given 我以 "admin" 身份登入
    And 系統中存在用戶 "user_staff_01"
    When 我將用戶 "user_staff_01" 的角色更新為 "manager"
    Then 該用戶在資料庫中的角色應為 "manager"

  Scenario: 管理者可以停用帳號
    Given 我以 "admin" 身份登入
    And 系統中存在用戶 "user_to_disable"
    When 我停用用戶 "user_to_disable"
    Then 該用戶應無法登入系統
