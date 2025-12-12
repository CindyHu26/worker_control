# Document Generation System - Implementation Summary

## ✅ Completed Implementation

### Backend (`server/src/routes/documents.ts`)

#### 1. **GET `/api/documents/templates`**
- Lists all active document templates from the database
- Supports optional `category` query parameter for filtering
- Returns: `{ id, name, category, description }`

#### 2. **POST `/api/documents/templates`**
- Upload new .docx templates with metadata
- Uses Multer for file handling
- Validates file type (.docx only, max 10MB)
- Organizes files by category in `server/templates/{category}/`
- Stores metadata in `DocumentTemplate` table
- Auto-cleanup on validation/database errors

**Request Format:**
```
Content-Type: multipart/form-data
Fields:
  - file: .docx file
  - name: Template display name
  - category: entry_packet | entry_report | permit_app | medical | transfer | termination
  - description: (optional) Template description
```

#### 3. **POST `/api/documents/generate`**
- Generates documents from templates with worker data
- Supports single or multiple templates
- Uses `docxtemplater` for placeholder replacement
- Returns single .docx or ZIP archive for multiple files

**Request Format:**
```json
{
  "workerId": "uuid",
  "templateIds": ["uuid1", "uuid2", ...]
}
```

**Available Placeholders:**
```
Worker: worker_name_cn, worker_name_en, worker_nationality, worker_dob, worker_mobile, worker_address_foreign
Documents: passport_no, passport_issue_date, passport_expiry_date, arc_no, arc_issue_date, arc_expiry_date
Employer: employer_name, employer_tax_id, employer_phone, employer_address, employer_rep
Deployment: job_description, entry_date, contract_start, contract_end
Dormitory: dorm_name, dorm_address, dorm_landlord, dorm_room, dorm_bed
System: today, year, month, day
```

### Frontend (`client/components/workers/GovtTabContent.tsx`)

#### Document Center Section Features:

1. **Category Filter**
   - 7 categories: All, Entry Packet, Entry Report, Permit App, Medical, Transfer, Termination
   - Dynamic template loading based on selected category

2. **Template Selection**
   - Grid layout with checkboxes
   - Visual feedback for selected templates
   - Shows template name, description, and category badge
   - Selection counter

3. **Batch Document Generation**
   - "Generate Documents" button
   - Shows loading state during generation
   - Auto-downloads generated file(s)
   - Handles both single .docx and multi-file ZIP

4. **UI/UX Enhancements**
   - Gradient background with modern styling
   - Hover effects and animations
   - Clear selection button
   - Disabled states for better UX

### Database Schema

```prisma
model DocumentTemplate {
  id          String  @id @default(uuid())
  name        String
  category    String
  filePath    String
  description String?
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Seeded Templates

8 templates across 3 categories:

**Entry Packet (新入境套組):**
- 勞工保險加保申報表
- 全民健康保險投保申報表
- 移工履歷表 (Bio Data)
- 工資切結書 (Loan Agreement)

**Entry Report (入國通報):**
- 入國通報申報書
- 外國人名冊

**Permit Application (許可函申請):**
- 聘僱許可申請書
- 居留證申請書

## 📁 File Structure

```
server/
├── src/routes/documents.ts (Enhanced with upload & generate)
├── templates/
│   ├── entry_packet/
│   ├── entry_report/
│   └── permit_app/
└── prisma/
    ├── schema.prisma (DocumentTemplate model)
    └── seed.ts (Template seeding)

client/
└── components/workers/
    └── GovtTabContent.tsx (Document Center UI)
```

## 🚀 Usage Guide

### For Users:

1. **View Templates:**
   - Navigate to Worker Detail → Government Tab
   - Scroll to "Document Center" section
   - Use category filters to browse templates

2. **Generate Documents:**
   - Select one or more templates using checkboxes
   - Click "生成文件" button
   - Document(s) will auto-download

3. **Upload New Templates:**
   - Use API endpoint or create admin UI
   - Upload .docx file with placeholders like `{worker_name_en}`
   - Specify category and description

### For Developers:

**Adding New Placeholders:**
Edit the `tags` object in `documents.ts` line 95-137

**Adding New Categories:**
1. Update category filter in `GovtTabContent.tsx`
2. Add to seed data in `seed.ts`
3. Update schema if using enums

**Creating Template Files:**
1. Create .docx file in Word
2. Use placeholders: `{placeholder_name}`
3. Upload via POST /api/documents/templates

## 🔧 Technical Details

### Dependencies Used:
- **multer**: File upload handling
- **docxtemplater**: .docx template processing
- **pizzip**: ZIP file creation/manipulation

### Security Features:
- File type validation (.docx only)
- File size limit (10MB)
- Automatic file cleanup on errors
- Path traversal prevention

### Performance Optimizations:
- Lazy loading of templates by category
- Efficient ZIP generation for multiple files
- Optimistic UI updates

## 📝 Next Steps (Optional Enhancements)

1. **Admin Template Management UI**
   - Upload interface in admin panel
   - Template preview
   - Edit/delete templates

2. **Batch Worker Processing**
   - Generate documents for multiple workers
   - Bulk download as ZIP

3. **Template Versioning**
   - Track template changes
   - Rollback capability

4. **Advanced Placeholders**
   - Conditional sections
   - Loops for arrays (e.g., multiple deployments)
   - Image insertion

5. **Document History**
   - Track generated documents
   - Re-download previous generations

## ✨ Key Features Delivered

✅ Template listing with category filtering  
✅ Template upload with validation  
✅ Dynamic document generation with worker data  
✅ Single file or ZIP download  
✅ Modern, intuitive UI  
✅ Comprehensive error handling  
✅ Database seeding with sample templates  
✅ Full TypeScript type safety  

---

**Status:** ✅ Fully Implemented and Ready for Use
**Last Updated:** 2025-12-12
