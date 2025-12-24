# Walkthrough: Country CRUD Implementation

## Goal
Implement "Country Control" (國別管制) functionality, allowing management of source countries (Nationalities) for foreign workers.

## Changes

### Schema
- **Model**: Added `Country` model with fields `code`, `nameZh`, `nameEn`, `sortOrder`, `isActive`.

### Backend
- **Service**: Created `countryService.ts` providing CRUD operations.
- **Routes**: Created `countries.ts` with Zod validation.
- **Registration**: Added `/api/countries` to `index.ts`.

### Frontend
- **Form**: Created `CountryForm.tsx` with validation and localization.
- **Pages**: Created List (`/countries`), Create (`/countries/new`), and Edit (`/countries/[id]`) pages.
- **Portal**: Added "國別管理" feature card.

## Verification
- **Code Logic**: Verified Zod validation and CRUD flow.
- **Localization**: UI uses Traditional Chinese (e.g., "國別代碼", "中文國名").
- **Layout**: Used standard `PageContainer` and `TableWrapper` for consistency.
