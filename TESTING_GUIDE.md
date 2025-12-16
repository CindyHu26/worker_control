# E2E Testing Execution Guide

## Overview
This guide covers how to run the CRM conversion E2E test, which includes:
1.  Starting the necessary Backend & Frontend servers.
2.  Executing the Playwright test.
3.  Cleaning up test data.

## 1. Prerequisites
Ensure you are in the root directory `d:\worker_control`.
Install necessary dependencies if you haven't:
```bash
npm install
npm install -D @prisma/client dotenv ts-node typescript @types/node
```

## 2. Start Servers
You need to run both Backend (port 3001) and Frontend (port 3000).

**Option A: Separate Terminals (Recommended)**
Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

## 3. Run E2E Test
In a new terminal (Root directory):
```bash
npx playwright test tests/e2e/crm-conversion.spec.ts
```

> **Note**: The test script automatically attempts to clean up "宏華精密工業" data after it finishes (using `test.afterAll`).

## 4. Manual Data Cleanup
If the test crashes before cleanup, or you want to force a reset:
```bash
npx ts-node scripts/cleanup-test-data.ts
```
This script connects to the database and hard-deletes the test Lead and Employer.

## 5. Troubleshooting
- **`ERR_CONNECTION_REFUSED`**: Check if `localhost:3000` is accessible.
- **Prisma Errors (Missing Client)**: 
  The E2E test requires the Prisma Client to be generated. If you encounter errors, run:
  ```bash
  # Option 1: Generate using Server's schema (Recommended)
  cd server
  npx prisma generate
  cd ..
  ```
  If the root project still complains about missing `@prisma/client`, ensure dependencies are installed in the root (`npm install`).
