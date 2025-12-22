Feature: 宿舍安全與法規合規性 (Dorm Compliance)
  為了確保外勞住宿安全並符合法規
  身為系統管理者
  我希望系統能根據動態法規參數檢查宿舍狀態

  Scenario: 宿舍面積違規檢測 (Dynamic Rule)
    Given 目前 "DORM_MIN_AREA_PER_PERSON" 法規設定為 3.6 平方公尺
    And 有一間宿舍 "Dorm A" 且包含房間 "Room 101"
    Given 房間 "Room 101" 面積為 10 平方公尺，住 3 人
    When 執行宿舍 "Dorm A" 改良合規檢查
    Then 檢查結果應回傳 "DENSITY_TOO_HIGH" 錯誤
    And 檢查結果訊息應包含 "人均僅 3.3m²"
    And 檢查結果訊息應包含 "標準: 3.6m²"

  Scenario: 消防安檢警告期檢測 (Dynamic Rule)
    Given 目前 "FIRE_SAFETY_WARNING_DAYS" 法規設定為 60 天
    And 宿舍 "Dorm A" 消防安檢將於 45 天後到期
    When 執行宿舍 "Dorm A" 改良合規檢查
    Then 檢查結果應回傳 "EXPIRING_SOON" 警告
    And 檢查結果訊息應包含 "將於 45 天後到期"
