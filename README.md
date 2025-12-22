# 台灣移工管理系統 (Taiwan Migrant Worker Management System)

## 專案是做什麼的？

### 問題背景 (Problem)
台灣的人力仲介公司在管理移工（外籍勞工）時，面臨以下挑戰：

1. **複雜的法規流程**：從招募許可申請、入境健檢、居留證辦理到定期體檢，每個環節都有嚴格的時效與文件要求
2. **多方協作困難**：需要同時管理雇主資料、移工個人檔案、政府文件、健檢醫院等多個利害關係人
3. **資料分散且易出錯**：傳統使用 Excel 或紙本管理，容易遺漏重要期限（如居留證到期、體檢逾期）
4. **缺乏即時追蹤**：無法快速掌握每位移工的當前狀態（在職、逃逸、轉出等）

### 解決方案 (Solution)
本系統是一個**全生命週期管理平台**，涵蓋：

- **CRM 模組**：潛在客戶（Lead）→ 正式雇主（Employer）轉換管理
- **招募許可流程**：工業局 3K 認定 → 國內求才證明 → 勞動部招募函申請
- **移工管理**：護照/居留證追蹤、健康檢查排程、地址異動紀錄
- **聘僱管理**：部署（Deployment）狀態追蹤、合約到期提醒、轉出/逃逸事件處理
- **文件自動化**：批次產生政府表單（Word/PDF）、Excel 報表匯出
- **財務模組**：服務費計算、帳單管理、稅務申報資料

---

## 核心功能與流程概覽

### 1. 招募許可申請流程（Pre-Permit Workflow）
這是系統最核心的業務邏輯，遵循台灣勞動部規定的四步驟：

```
步驟一：工業局 3K 認定
  ↓ 取得「工業局核定函」，確認雇主產業級別（A+/A/B/C/D）
  
步驟二：國內求才證明
  ↓ 向公立就業服務站登記求才，取得「求才證明書」
  
步驟三：審查費繳納
  ↓ 郵局劃撥每人 200 元審查費
  
步驟四：招募許可函
  ↓ 勞動部核發「招募許可函」，取得外勞名額
```

**系統實作重點**：
- `IndustryRecognition` 模型：儲存工業局核定函，包含 `tier`（級別）、`allocationRate`（核配比率，如 20%）
- `RecruitmentProof` 模型：儲存求才證明，系統會驗證是否在 60 天有效期內
- `EmployerRecruitmentLetter` 模型：最終招募函，關聯前兩個文件並自動計算可申請名額
- **自動計算邏輯**：`approvedQuota = 雇主本勞人數 × allocationRate`

### 2. 移工生命週期管理（Worker Lifecycle）

```
海外招募階段
  ├─ 面試候選人（InterviewCandidate）
  ├─ 海外體檢（HealthCheck: type=overseas）
  └─ 簽證申請（Deployment: visaStatus）

入境階段
  ├─ 入境體檢（HealthCheck: type=entry）
  ├─ 居留證申請（WorkerArc）
  └─ 部署到雇主（Deployment: status=active）

在職管理
  ├─ 定期體檢（6個月/18個月/30個月）
  ├─ 居留證展延（每 3 年）
  ├─ 護照更新
  └─ 地址異動紀錄（WorkerAddressHistory）

離職/異常事件
  ├─ 合約到期
  ├─ 轉出（TRANSFER_OUT）
  ├─ 逃逸（RUNAWAY）→ 自動產生 Incident
  └─ 其他事件（WorkerEvent）
```

**系統實作重點**：
- **Soft Delete**：所有核心資料（Employer, Worker, Deployment）都有 `deletedAt` 欄位，刪除時僅標記而不真正刪除
- **自動排程**：使用 `node-cron` 每日檢查證件到期日，自動產生提醒通知
- **事件追蹤**：`WorkerEvent` 紀錄所有重要異動（逃逸、轉出、死亡等），並自動建立 `Incident` 供追蹤

### 3. 文件產生與匯出

系統支援批次產生政府表單：

- **Word 文件**：使用 `docxtemplater` 填入範本（如入境通報表、健檢申請書）
- **PDF 文件**：使用 `pdf-lib` 填寫既有 PDF 表單欄位
- **Excel 報表**：使用 `exceljs` 匯出移工名冊、薪資清單等

**假設**：範本檔案應存放於 `server/templates/` 目錄（實際路徑需確認 `templates.ts` 路由實作）

---

## 專案結構說明

```
worker_control/
├── packages/
│   └── shared/              # 共用型別定義（Prisma 生成的 DTO）
│       ├── src/
│       │   └── index.ts     # 匯出所有共用型別
│       └── package.json
│
├── server/                  # 後端 API（Node.js + Express）
│   ├── prisma/
│   │   ├── schema.prisma    # 資料庫結構定義（單一真相來源）
│   │   ├── seed.ts          # 初始資料（預設管理員、稅率設定等）
│   │   └── migrations/      # 資料庫版本控制
│   │
│   ├── src/
│   │   ├── routes/          # API 路由（30+ 個端點）
│   │   │   ├── employers.ts       # 雇主 CRUD
│   │   │   ├── workers.ts         # 移工 CRUD
│   │   │   ├── recruitment.ts     # 招募函申請
│   │   │   ├── deployments.ts     # 聘僱部署
│   │   │   ├── health.ts          # 健檢管理
│   │   │   ├── documents.ts       # 文件產生
│   │   │   └── ...
│   │   │
│   │   ├── services/        # 業務邏輯層
│   │   │   ├── complianceService.ts   # 零付費合規檢查
│   │   │   ├── permitService.ts       # 許可證邏輯
│   │   │   └── ...
│   │   │
│   │   ├── utils/           # 工具函式
│   │   │   ├── documentContext.ts    # 文件範本資料組裝
│   │   │   └── ...
│   │   │
│   │   └── index.ts         # Express 伺服器入口
│   │
│   └── package.json
│
├── client/                  # 前端（Next.js 14 App Router）
│   ├── app/
│   │   ├── employers/       # 雇主管理頁面
│   │   ├── workers/         # 移工管理頁面
│   │   ├── recruitment/     # 招募流程頁面
│   │   ├── deployments/     # 聘僱部署頁面
│   │   ├── health/          # 健檢管理頁面
│   │   ├── dormitories/     # 宿舍管理頁面
│   │   ├── accounting/      # 財務模組頁面
│   │   ├── crm/             # CRM（潛在客戶）頁面
│   │   └── settings/        # 系統設定頁面
│   │
│   ├── components/          # UI 元件
│   │   ├── ui/              # shadcn/ui 基礎元件
│   │   ├── employers/       # 雇主相關元件
│   │   ├── workers/         # 移工相關元件
│   │   └── ...
│   │
│   └── package.json
│
├── pnpm-workspace.yaml      # Monorepo 工作區設定
└── package.json             # 根目錄設定
```

### 重要資料夾說明

- **`server/prisma/schema.prisma`**：整個系統的資料結構定義，包含 40+ 個模型（Employer, Worker, Deployment 等）
- **`packages/shared`**：由 Prisma 自動生成的 TypeScript 型別，供前後端共用，避免型別不一致
- **`server/src/routes/`**：每個檔案對應一組 RESTful API（如 `GET /api/workers`, `POST /api/recruitment`）
- **`client/app/`**：Next.js 的檔案路由系統，資料夾名稱即為 URL 路徑

---

## 如何安裝與執行

### 前置需求

- **Node.js**: v18 或以上
- **pnpm**: v8 或以上（必須使用 pnpm，因為是 monorepo）
- **PostgreSQL**: v14 或以上
- **Git**: 用於版本控制

### 步驟一：Clone 專案並安裝依賴

```bash
# Clone 專案
git clone <repository-url>
cd worker_control

# 安裝所有依賴（pnpm 會自動處理 workspace）
pnpm install
```

**常見踩雷點 1**：如果你使用 `npm install` 會失敗，因為專案使用 pnpm workspace 管理 monorepo。

### 步驟二：設定資料庫

1. **建立 PostgreSQL 資料庫**：

```sql
CREATE DATABASE worker_control;
```

2. **設定環境變數**：

在 `server/` 目錄下建立 `.env` 檔案：

```env
# 資料庫連線
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/worker_control?schema=public"

# JWT 密鑰（用於登入驗證）
JWT_SECRET="your-secret-key-change-this-in-production"

# 伺服器設定
PORT=3001
NODE_ENV=development
```

**常見踩雷點 2**：`DATABASE_URL` 的格式必須完全正確，包含 `?schema=public`，否則 Prisma 會找不到資料表。

### 步驟三：初始化資料庫

```bash
cd server

# 執行 Migration（建立所有資料表）
pnpm prisma migrate dev

# 寫入初始資料（預設管理員帳號、稅率設定等）
pnpm prisma db seed
```

執行成功後，你會看到：
> **預設帳號**: `admin` / **密碼**: `change_me`
> 
> ⚠️ **重要**: 生產環境請務必修改預設密碼！
- 基礎稅率設定（勞保、健保費率等）

**常見踩雷點 3**：如果 `migrate dev` 失敗，檢查：
1. PostgreSQL 是否正在運行
2. `.env` 的 `DATABASE_URL` 是否正確
3. 資料庫使用者是否有建立資料表的權限

### 步驟四：啟動開發伺服器

開啟兩個終端機視窗：

**終端機 1 - 後端**：
```bash
cd server
pnpm dev
# 伺服器會在 http://localhost:3001 啟動
```

**終端機 2 - 前端**：
```bash
cd client
pnpm dev
# 前端會在 http://localhost:3000 啟動
```

**常見踩雷點 4**：前端的 API 請求會透過 Next.js 的 `rewrites` 轉發到後端（見 `client/next.config.js`），所以後端必須先啟動。

### 步驟五：登入系統

1. 開啟瀏覽器訪問 `http://localhost:3000`
2. 使用預設帳號登入：
   - 帳號：`admin`
   - 密碼：`password123` change_me

---

## 常見使用情境

### 情境一：新增一位雇主並申請招募許可

**步驟**：
1. **CRM → 新增潛在客戶（Lead）**
   - 填寫公司名稱、統編、聯絡人
   - 系統會自動產生 Lead ID

2. **CRM → 轉換為正式雇主（Employer）**
   - 補充完整資料（工廠登記證、勞健保投保單位等）
   - 系統會建立 `Employer` 並關聯原 `Lead`

3. **雇主管理 → 上傳工業局核定函**
   - 新增 `IndustryRecognition` 紀錄
   - 填寫核定級別（如 B 級）、核配比率（如 20%）

4. **雇主管理 → 上傳求才證明**
   - 新增 `RecruitmentProof` 紀錄
   - 系統會驗證是否在 60 天有效期內

5. **招募管理 → 申請招募許可函**
   - 選擇已上傳的工業局函文與求才證明
   - 系統自動計算可申請名額：`本勞人數 × 20% = 可申請外勞數`
   - 填寫勞動部發文號、核准日期等資訊

### 情境二：移工入境後的健檢排程

**步驟**：
1. **移工管理 → 新增移工資料**
   - 填寫護照資料、國籍、出生日期等

2. **聘僱管理 → 建立部署（Deployment）**
   - 關聯雇主與移工
   - 選擇招募許可函（系統會自動扣減名額）
   - 填寫入境日期

3. **健檢管理 → 排程入境體檢**
   - 系統會自動建立 `HealthCheck` 紀錄（type=entry）
   - 選擇指定醫院、預約日期

4. **系統自動提醒**：
   - 入境後 6 個月：系統自動產生「6 個月體檢」提醒
   - 入境後 18 個月：產生「18 個月體檢」提醒
   - 入境後 30 個月：產生「30 個月體檢」提醒

### 情境三：批次產生政府表單

**步驟**：
1. **移工管理 → 勾選多位移工**
2. **點選「批次匯出」**
3. **選擇範本類型**：
   - 入境通報表（Word）
   - 健檢申請書（PDF）
   - 移工名冊（Excel）

4. **系統會**：
   - 從資料庫抓取移工、雇主、部署等相關資料
   - 使用 `documentContext.ts` 組裝範本所需欄位
   - 呼叫 `docxtemplater` 或 `pdf-lib` 填入資料
   - 打包成 ZIP 檔供下載

---

## 限制與注意事項

### 1. 資料庫 Schema 變更流程

**重要**：絕對不要直接修改資料庫結構（如手動 `ALTER TABLE`），必須遵循以下流程：

```bash
# 1. 修改 server/prisma/schema.prisma
# 2. 產生 Migration
cd server
pnpm prisma migrate dev --name your_change_description

# 3. 系統會自動：
#    - 產生 SQL 檔案到 prisma/migrations/
#    - 執行 SQL 更新資料庫
#    - 重新產生 @prisma/client 型別
#    - 更新 packages/shared 的型別定義
```

**假設**：線上環境應使用 `prisma migrate deploy`（不會提示確認），而非 `migrate dev`。

### 2. Soft Delete 機制

系統對以下模型啟用軟刪除（Soft Delete）：
- `Employer`（雇主）
- `Worker`（移工）
- `Deployment`（聘僱部署）
- `EmployerRecruitmentLetter`（招募函）
- `IndustryRecognition`（工業局核定）

**行為**：
- 刪除時只會設定 `deletedAt = 當前時間`，資料仍保留在資料庫
- 查詢時預設會過濾 `deletedAt IS NULL` 的資料（透過 Prisma Middleware）
- 如需查看已刪除資料，需在查詢時明確指定

**假設**：Prisma Middleware 應已在 `server/src/prisma.ts` 中實作全域過濾邏輯。

### 3. 型別同步問題

**問題**：如果你修改了 `schema.prisma` 但忘記執行 `prisma generate`，前端會出現型別錯誤。

**解決方案**：
```bash
# 在 server/ 目錄執行
pnpm prisma generate

# 這會更新：
# - node_modules/@prisma/client
# - packages/shared/node_modules/@prisma/client（透過 workspace link）
```

### 4. API 路由規則

後端 API 遵循以下慣例：
- `GET /api/workers` - 列表查詢（支援分頁、篩選）
- `GET /api/workers/:id` - 單筆查詢
- `POST /api/workers` - 新增
- `PUT /api/workers/:id` - 更新
- `DELETE /api/workers/:id` - 刪除（軟刪除）

**假設**：所有 API 都需要 JWT 驗證（除了 `/api/auth/login`），Token 應放在 `Authorization: Bearer <token>` header。

### 5. 文件範本路徑

**假設**：Word/PDF 範本應存放於 `server/templates/` 目錄，並在 `templates.ts` 路由中註冊。實際實作需確認 `documentContext.ts` 的範本載入邏輯。

### 6. 效能考量

- **大量資料查詢**：移工列表頁面應使用分頁（預設每頁 50 筆）
- **關聯查詢**：避免 N+1 問題，使用 Prisma 的 `include` 一次載入關聯資料
- **文件產生**：批次產生超過 100 份文件時，建議使用背景任務（目前未實作）

### 7. 開發環境限制

- **熱重載**：後端使用 `ts-node-dev`，修改程式碼會自動重啟
- **前端快取**：Next.js 的 SWR 會快取 API 回應，開發時可能需要手動重新整理
- **資料庫連線**：開發環境預設最多 10 個連線，如果出現 `Too many connections` 錯誤，重啟後端即可

---

## 技術棧總覽

### 後端
- **框架**：Express.js
- **ORM**：Prisma（PostgreSQL）
- **驗證**：JWT（jsonwebtoken）
- **文件處理**：docxtemplater, pdf-lib, exceljs
- **排程**：node-cron
- **日誌**：winston

### 前端
- **框架**：Next.js 14（App Router）
- **UI 庫**：Tailwind CSS, shadcn/ui, Radix UI
- **狀態管理**：SWR（資料快取）
- **表單**：react-hook-form + zod（驗證）
- **拖拉排序**：@dnd-kit

### 開發工具
- **Monorepo**：pnpm workspace
- **型別檢查**：TypeScript 5
- **資料庫管理**：Prisma Studio（`pnpm prisma studio`）

---

## 常見問題 FAQ

### Q1: 如何重置資料庫？
```bash
cd server
pnpm db:reset  # 會刪除所有資料並重新執行 seed
```

### Q2: 如何查看資料庫內容？
```bash
cd server
pnpm prisma studio
# 開啟瀏覽器訪問 http://localhost:5555
```

### Q3: 前端無法連接後端 API？
檢查：
1. 後端是否在 `http://localhost:3001` 運行
2. `client/next.config.js` 的 `rewrites` 設定是否正確
3. 瀏覽器 Console 是否有 CORS 錯誤

### Q4: Prisma 型別不同步？
```bash
cd server
pnpm prisma generate
# 然後重啟前端開發伺服器
```

### Q5: 如何新增一個 API 端點？
1. 在 `server/src/routes/` 建立新檔案（如 `myFeature.ts`）
2. 在 `server/src/routes/index.ts` 註冊路由
3. 前端使用 `fetch('/api/my-feature')` 呼叫

---

## 聯絡與支援

- **問題回報**：請提交 GitHub Issue
- **開發文件**：見 `API_REFERENCE.md`
- **資料庫結構**：見 `server/prisma/schema.prisma`

---

## 授權

本專案為內部使用系統，未開放公開授權。
