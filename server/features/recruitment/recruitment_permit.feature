Feature: 招募許可函管理 (Recruitment Permit Management)
  為了能正確計算雇主的可聘僱名額
  身為系統管理者
  我希望能登錄招募許可函，並由系統自動更新雇主的名額

  Scenario: 新增有效的初次招募函
    Given 雇主 "台積電" 目前名額為 0
    When 登錄一張 "初次招募許可函"，文號 "勞職許字第112001號"，核准人數 5 人，發文日 "2024-01-01"
    Then 系統應儲存該函文
    And 雇主的 "totalQuota" 應自動更新為 5

  Scenario: 招募函重複登錄防呆
    Given 系統已存在文號 "勞職許字第112001號" 的招募函
    When 再次嘗試登錄相同文號
    Then 系統應回傳 "DUPLICATE_LETTER_NO" 錯誤

  Scenario: 函文效期自動計算
    When 登錄招募函，類別為 "初次招募"，發文日 "2024-01-01"
    Then 系統應自動設定失效日期 為 "2025-01-01" (發文日後 1 年) ? Or follow strict rule.
    # Note: Initial recruitment permit valid for 1 year usually? Or 6 months + extension?
    # User prompt said "1 Year (or based on regulation)". I'll use 1 year for now.
    # Actually, schema has validUntil default now(). Service needs to override.
    Then 系統應自動設定失效日期 為 "2025-01-01"
