# Document API Quick Reference

## Endpoints

### 1. List Templates
```http
GET /api/documents/templates
GET /api/documents/templates?category=entry_packet
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "勞工保險加保申報表",
    "category": "entry_packet",
    "description": "Labor insurance enrollment form"
  }
]
```

### 2. Upload Template
```http
POST /api/documents/templates
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: .docx file (required)
- `name`: Display name (required)
- `category`: Category code (required)
- `description`: Description (optional)

**Categories:**
- `entry_packet` - 新入境套組
- `entry_report` - 入國通報
- `permit_app` - 許可函申請
- `medical` - 體檢相關
- `transfer` - 轉換雇主
- `termination` - 離職相關

**Response:**
```json
{
  "message": "Template uploaded successfully",
  "template": {
    "id": "uuid",
    "name": "勞工保險加保申報表",
    "category": "entry_packet",
    "description": "Labor insurance enrollment form"
  }
}
```

### 3. Generate Documents
```http
POST /api/documents/generate
Content-Type: application/json
```

**Request:**
```json
{
  "workerId": "worker-uuid",
  "templateIds": ["template-uuid-1", "template-uuid-2"]
}
```

**Response:**
- Single template: `.docx` file
- Multiple templates: `.zip` file containing all documents

**Response Headers:**
```
Content-Disposition: attachment; filename="Worker_Name_Documents.zip"
Content-Type: application/zip
```

## cURL Examples

### List all templates
```bash
curl http://localhost:3001/api/documents/templates
```

### List templates by category
```bash
curl http://localhost:3001/api/documents/templates?category=entry_packet
```

### Upload a template
```bash
curl -X POST http://localhost:3001/api/documents/templates \
  -F "file=@labor_insurance.docx" \
  -F "name=勞工保險加保申報表" \
  -F "category=entry_packet" \
  -F "description=Labor insurance enrollment form"
```

### Generate documents
```bash
curl -X POST http://localhost:3001/api/documents/generate \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "abc-123",
    "templateIds": ["template-1", "template-2"]
  }' \
  --output documents.zip
```

## JavaScript/Fetch Examples

### Fetch templates
```javascript
const response = await fetch('http://localhost:3001/api/documents/templates?category=entry_packet');
const templates = await response.json();
```

### Upload template
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', '勞工保險加保申報表');
formData.append('category', 'entry_packet');
formData.append('description', 'Labor insurance form');

const response = await fetch('http://localhost:3001/api/documents/templates', {
  method: 'POST',
  body: formData
});
```

### Generate and download documents
```javascript
const response = await fetch('http://localhost:3001/api/documents/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workerId: 'worker-uuid',
    templateIds: ['template-1', 'template-2']
  })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'documents.zip';
a.click();
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required parameters: workerId, templateIds (array)"
}
```

### 404 Not Found
```json
{
  "error": "Worker not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process document generation"
}
```

## Status Codes

- `200 OK` - Success (GET, generate)
- `201 Created` - Template uploaded successfully
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

**Base URL:** `http://localhost:3001/api/documents`
**Last Updated:** 2025-12-12
