# 台灣移工管理系統 (TMS) - 專案說明文件

## 1. 專案簡介
本系統是一個專為台灣規範設計的移工生命週期管理系統 (TMS)，涵蓋從招募、入境、聘僱到轉出的完整流程。

- **前端**: Next.js (App Router), Tailwind CSS
- **後端**: Node.js, Express, Prisma ORM
- **資料庫**: PostgreSQL

---

## 2. 快速開始 (Quick Start)

### 首次安裝
請依照以下步驟啟動專案：

1.  **安裝依賴套件**:
    ```bash
    # 在專案根目錄執行 (假設 client 和 server 分別在不同資料夾)
    cd server
    npm install
    
    cd ../client
    npm install
    ```

2.  **設定環境變數**:
    在 `server` 目錄下建立 `.env` 檔案，並填入資料庫連線資訊：
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/worker_db?schema=public"
    ```

3.  **資料庫初始化 (Migration & Seed)**:
    這一步驟會建立資料表並寫入預設管理員帳號。
    ```bash
    cd server
    # 建立資料表
    npm run db:migrate
    # 寫入預設資料 (Admin User)
    npm run db:seed
    ```
    > **預設帳號**: `admin` / **密碼**: `change_me`

4.  **啟動服務**:
    ```bash
    # 啟動後端 (Port 3001)
    cd server
    npm run dev
    
    # 啟動前端 (Port 3000)
    cd ../client
    npm run dev
    ```

---

## 3. 系統維護與升級 (Migrations)

本系統使用 **Prisma Migrate** 進行資料庫版本控制。請勿直接手動修改 SQL，應遵循以下流程。

### A. 如何修改資料庫結構？
當需要新增欄位 (例如在 `workers` 表新增 `vaccination_date`) 時：

1.  **修改 Schema 檔案**:
    編輯 `server/prisma/schema.prisma`：
    ```prisma
    model Worker {
      // ... 原有欄位
      vaccinationDate DateTime? @map("vaccination_date") @db.Date
    }
    ```

2.  **產生 Migration 檔案**:
    執行以下指令，系統會自動比對並產生 SQL：
    ```bash
    cd server
    npx prisma migrate dev --name add_vaccination_date
    ```

3.  **確認生效**:
    該指令會自動將變更應用到資料庫，並重新產生 Client端型別定義。

### B. 線上更新 (Deployment)
我們提供了自動化更新腳本。在伺服器上執行更新時：

1.  **執行更新指令**:
    ```bash
    cd server
    npm run run-update
    ```
    
    此指令會執行：
    1. `git pull` (拉取最新程式碼)
    2. `npm install` (更新套件)
    3. `npm run db:migrate` (應用資料庫變更)
    4. `pm2 restart tms-server` (重啟服務)

---

## 4. 目錄結構說明

- **`client/`**: 前端程式碼
  - `app/`: 一般頁面 (Dashboard, Worker Profile)
  - `components/`: UI 元件
- **`server/`**: 後端 API
  - `prisma/`: 資料庫定義 (`schema.prisma`) 與種子資料 (`seed.ts`)
  - `src/routes/`: API 路由邏輯

---

## 5. 聯絡支援
若有任何系統問題，請聯繫開發團隊或提交 Issue。
