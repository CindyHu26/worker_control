# 系統實作狀態追蹤 (System Implementation Status)

本文件用於對照更新後的 `DOMAIN_BLUEPRINT.md` 與目前系統實際開發進度。

**最後更新時間：** 2025-12-24 (Aligning with Blueprint v2.0)

---

## 🔵 階段 0：人才池與招募媒合 (Talent & Recruitment)

| 藍圖項目 | 實作狀態 | 系統對應模組/功能 | 備註 |
| :--- | :---: | :--- | :--- |
| **0.1 履歷匯入** | ✅ 已完成 | `Candidate`, `candidateService`, `/candidates` | 支援 Excel 批次匯入、護照重複檢核、狀態管理 (NEW/INTERVIEW/SELECTED/REJECTED)。 |
| **0.2 面試紀錄** | ⚪ 尚未實作 | - | 需建立 `Candidate` 與 `InterviewRecord` 實體。 |

## 🟢 階段 1：雇主資格與前置作業 (Qualifications)

| 藍圖項目 | 實作狀態 | 系統對應模組/功能 | 備註 |
| :--- | :---: | :--- | :--- |
| **1.1 國內招募** | ✅ 已完成 | `RecruitmentProof`, `DomesticRecruitmentService` | 已實作 21/7 天等待期自動驗證與前端介面。 |
| **1.2 行業認定** | ✅ 已完成 | `IndustryRecognition` | 支援級別 (Tier) 與核配比率管理。 |

## 🟡 階段 2：許可函申請流程 (Permits)

| 藍圖項目 | 實作狀態 | 系統對應模組/功能 | 備註 |
| :--- | :---: | :--- | :--- |
| **2.1 招募許可函** | ✅ 已完成 | `RecruitmentLetter` | 支援名額自動扣除 (`quota`, `used_quota`)。 |
| **2.2 入國引進許可** | 🟡 部分完成 | `PermitDetails` | 目前作為 `Deployment` 附件管理。 |

## 🟠 階段 3：海外追蹤與入境準備 (Overseas & Entry Prep)

| 藍圖項目 | 實作狀態 | 系統對應模組/功能 | 備註 |
| :--- | :---: | :--- | :--- |
| **3.1 海外進度追蹤** | ⚪ 尚未實作 | - | 規劃中：海外體檢、良民證追蹤介面。 |
| **3.2 入境安排** | 🟡 部分完成 | `Worker.entryDate` | 基礎日期紀錄已完成。 |
| **3.3 文件預製** | ⚪ 尚未實作 | - | 規劃中：自動產生入國通報 PDF。 |

## 🔴 階段 4：入境與報到 (Arrival & Onboarding)

| 藍圖項目 | 實作狀態 | 系統對應模組/功能 | 備註 |
| :--- | :---: | :--- | :--- |
| **4.1 入國通報/報到** | 🟡 部分完成 | `WorkerDocuments` | 「結果導向驗證」邏輯待進一步優化至 Dashboard。 |
| **4.2 體檢與異常** | ✅ 已完成 | `HealthCheck` | 基礎體檢歷史紀錄已建立。 |

## 🔵 階段 5：履約管理與帳務 (Lifecycle & Finance)

| 藍圖項目 | 實作狀態 | 系統對應模組/功能 | 備註 |
| :--- | :---: | :--- | :--- |
| **5.1 健檢與證照** | ✅ 已完成 | `BillingGeneratorService` | 6/18/30 個月健檢自動排程費用。 |
| **5.2 智慧帳務** | ✅ 已完成 | **Smart Billing System** | 包含服務費、宿舍費、差異比對與審核流程。 |
| **5.3 宿舍管理** | ✅ 已完成 | `Dormitory`, `AccommodationService` | 完整床位管理與搬遷追蹤。 |

## 🟣 階段 6：轉出與離境 (Termination)

| 藍圖項目 | 實作狀態 | 系統對應模組/功能 | 備註 |
| :--- | :---: | :--- | :--- |
| **6.1 轉換雇主** | 🟡 部分完成 | `Deployment.status` | 支援狀態變更，三方合意文件生成待補。 |
| **6.2 完工離境** | 🟡 部分完成 | `Worker.status` | 已可標記離境狀態。 |

## 💠 階段 7：協作與異常監控 (Collaboration & Alerts)

| 藍圖項目 | 實作狀態 | 系統對應模組/功能 | 備註 |
| :--- | :---: | :--- | :--- |
| **7.1 討論串/@提及** | ⚪ 尚未實作 | - | 規劃掛載於 Worker 的溝通層。 |
| **7.2 異常儀表板** | 🟡 部分完成 | `Compliance Logic` | 已有基礎到期警示，需優化為分級顯示。 |

---

## 🚀 藍圖外已實作功能 (Extended Features)
*   **基礎資料管理 (Master Data)**：國家、銀行、合約類型、行業別等完整 CRUD。
*   **帳務稽核 (Audit Log)**：`BillingModificationLog` 紀錄所有金額調整細節。
*   **智慧紅綠燈**：移工詳情頁的資料完整度檢查。
