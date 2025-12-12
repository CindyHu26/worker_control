# Document Template Creation Guide

## 📄 How to Create Templates

### Step 1: Create a Word Document (.docx)

1. Open Microsoft Word
2. Design your document layout
3. Add placeholders where dynamic data should appear

### Step 2: Use Placeholders

Placeholders use the format: `{placeholder_name}`

**Example:**
```
Worker Name: {worker_name_en}
Chinese Name: {worker_name_cn}
Passport No: {passport_no}
Employer: {employer_name}
```

### Available Placeholders

#### Worker Information
- `{worker_name_en}` - English name
- `{worker_name_cn}` - Chinese name
- `{worker_nationality}` - Nationality
- `{worker_dob}` - Date of birth
- `{worker_mobile}` - Mobile phone
- `{worker_address_foreign}` - Foreign address

#### Identity Documents
- `{passport_no}` - Passport number
- `{passport_issue_date}` - Passport issue date
- `{passport_expiry_date}` - Passport expiry date
- `{arc_no}` - ARC number
- `{arc_issue_date}` - ARC issue date
- `{arc_expiry_date}` - ARC expiry date

#### Employer Information
- `{employer_name}` - Company name
- `{employer_tax_id}` - Tax ID
- `{employer_phone}` - Phone number
- `{employer_address}` - Address
- `{employer_rep}` - Responsible person

#### Deployment/Job Information
- `{job_description}` - Job description
- `{entry_date}` - Entry date to Taiwan
- `{contract_start}` - Contract start date
- `{contract_end}` - Contract end date

#### Dormitory Information
- `{dorm_name}` - Dormitory name
- `{dorm_address}` - Dormitory address
- `{dorm_landlord}` - Landlord name
- `{dorm_room}` - Room number
- `{dorm_bed}` - Bed code

#### System Information
- `{today}` - Current date
- `{year}` - Current year
- `{month}` - Current month
- `{day}` - Current day

### Step 3: Save the Template

1. Save as `.docx` format (not .doc)
2. Use a descriptive filename
3. Place in appropriate category folder:
   - `templates/entry_packet/` - Entry packet documents
   - `templates/entry_report/` - Entry reporting documents
   - `templates/permit_app/` - Permit applications
   - `templates/medical/` - Medical documents
   - `templates/transfer/` - Transfer documents
   - `templates/termination/` - Termination documents

### Step 4: Upload via API

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/documents/templates \
  -F "file=@your-template.docx" \
  -F "name=勞工保險加保申報表" \
  -F "category=entry_packet" \
  -F "description=Labor insurance enrollment form"
```

**Using Postman:**
1. Method: POST
2. URL: `http://localhost:3001/api/documents/templates`
3. Body: form-data
   - file: [Select .docx file]
   - name: Template display name
   - category: entry_packet | entry_report | permit_app | medical | transfer | termination
   - description: (optional) Description

## 📋 Sample Template

### Labor Insurance Form Example

```
中華民國勞工保險加保申報表

姓名（中文）：{worker_name_cn}
姓名（英文）：{worker_name_en}
出生日期：{worker_dob}
國籍：{worker_nationality}
護照號碼：{passport_no}

雇主資訊：
公司名稱：{employer_name}
統一編號：{employer_tax_id}
公司地址：{employer_address}
負責人：{employer_rep}

工作資訊：
職務：{job_description}
到職日：{entry_date}
合約起日：{contract_start}
合約迄日：{contract_end}

申請日期：{today}
```

## 🎨 Formatting Tips

1. **Tables**: Use Word tables - they will be preserved
2. **Fonts**: Choose standard fonts for compatibility
3. **Images**: Static images are preserved, dynamic images need special handling
4. **Page Breaks**: Use Word's page break feature
5. **Headers/Footers**: Supported with placeholders

## ⚠️ Important Notes

1. **Placeholder Syntax**: Must use curly braces `{placeholder}`
2. **Case Sensitive**: Use exact placeholder names
3. **Missing Data**: Empty string if data not available
4. **File Size**: Max 10MB per template
5. **Format**: Only .docx supported (not .doc, .pdf, etc.)

## 🔧 Testing Your Template

1. Upload the template via API
2. Go to Worker Detail → Government Tab → Document Center
3. Select your template
4. Click "Generate Documents"
5. Check the downloaded file for correct data replacement

## 🐛 Troubleshooting

**Problem**: Placeholder not replaced
- **Solution**: Check spelling and case of placeholder name

**Problem**: Upload fails
- **Solution**: Ensure file is .docx format and under 10MB

**Problem**: Generated document corrupted
- **Solution**: Avoid complex Word features, use simple formatting

**Problem**: Chinese characters display incorrectly
- **Solution**: Ensure UTF-8 encoding, use standard fonts

## 📞 Support

For issues or questions about template creation, contact the development team.

---

**Last Updated:** 2025-12-12
