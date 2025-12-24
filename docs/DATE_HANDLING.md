# Date Handling Best Practices

## Taiwan Timezone (UTC+8)

This system operates in Taiwan timezone. All date-only fields must use timezone-aware utilities to prevent off-by-one-day errors.

## Rules

### ✅ DO

#### 1. Use dateUtils for date-only fields

```typescript
import { getTaiwanToday, parseTaiwanDate, formatTaiwanDate } from '../utils/dateUtils';

// Current date
const today = getTaiwanToday();

// Parse user input (YYYY-MM-DD)
const entryDate = parseTaiwanDate(req.body.entryDate);

// Format for display
const displayDate = formatTaiwanDate(worker.dob);
```

#### 2. Use native Date for timestamps

```typescript
// For createdAt, updatedAt - these need exact time
createdAt: new Date()
updatedAt: new Date()
```

#### 3. Use date-fns for date arithmetic

```typescript
import { addDays, addMonths } from 'date-fns';

const dueDate = addDays(getTaiwanToday(), 30);
const nextMonth = addMonths(getTaiwanToday(), 1);
```

### ❌ DON'T

#### 1. Don't use new Date() for date-only fields

```typescript
// ❌ BAD - timezone dependent
entryDate: new Date()

// ✅ GOOD - Taiwan timezone aware
entryDate: getTaiwanToday()
```

#### 2. Don't do manual date arithmetic

```typescript
// ❌ BAD - error prone
new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

// ✅ GOOD - clear and correct
addDays(getTaiwanToday(), 30)
```

#### 3. Don't parse dates without timezone context

```typescript
// ❌ BAD - depends on server timezone
new Date('2024-12-15')

// ✅ GOOD - explicit Taiwan timezone
parseTaiwanDate('2024-12-15')
```

## Field Types

| Field Type | Function | Example Fields |
|------------|----------|----------------|
| Date-only | `getTaiwanToday()` or `parseTaiwanDate()` | entryDate, dob, payDate, expiryDate |
| Timestamp | `new Date()` | createdAt, updatedAt |
| Date arithmetic | `date-fns` functions | dueDate, nextCheckDate |

## Common Patterns

### Creating a deployment

```typescript
router.post('/deployments', async (req, res) => {
    const deployment = await prisma.deployment.create({
        data: {
            workerId: req.body.workerId,
            employerId: req.body.employerId,
            startDate: parseTaiwanDate(req.body.startDate),  // ✅
            entryDate: parseTaiwanDate(req.body.entryDate),  // ✅
            createdAt: new Date()  // ✅ Timestamp
        }
    });
});
```

### Calculating tax year

```typescript
import { getTaiwanYearStart, getTaiwanYearEnd } from '../utils/dateUtils';

const payrolls = await prisma.payrollRecord.findMany({
    where: {
        payDate: {
            gte: getTaiwanYearStart(2024),  // ✅
            lte: getTaiwanYearEnd(2024)     // ✅
        }
    }
});
```

### Birthday calculations

```typescript
import { getTaiwanToday } from '../utils/dateUtils';
import { toZonedTime } from 'date-fns-tz';

const now = getTaiwanToday();
const taiwanNow = toZonedTime(now, 'Asia/Taipei');
const currentMonth = taiwanNow.getMonth() + 1;  // ✅
```

## Why This Matters

### The Problem

When server timezone is UTC but users are in Taiwan (UTC+8):

```typescript
// User submits form at Taiwan time: 2025-12-15 01:00 AM
const entryDate = new Date();
// Server records: 2025-12-14 17:00 UTC (PREVIOUS DAY!)
```

### The Impact

- ❌ 183-day tax calculation wrong → incorrect tax status
- ❌ Payroll dates off → wrong tax year
- ❌ Birthday month wrong → missed notifications
- ❌ Contract expiry dates wrong → compliance issues

### The Solution

```typescript
// User submits at Taiwan time: 2025-12-15 01:00 AM
const entryDate = getTaiwanToday();
// Stores: 2025-12-15T00:00:00.000Z (CORRECT DATE!)
```

## Migration Checklist

When updating existing code:

1. ✅ Replace `new Date()` with `getTaiwanToday()` for date fields
2. ✅ Replace `new Date(dateString)` with `parseTaiwanDate(dateString)`
3. ✅ Replace manual date arithmetic with `date-fns` functions
4. ✅ Keep `new Date()` for timestamps (createdAt, updatedAt)
5. ✅ Test edge cases (Dec 31, Jan 1, month boundaries)

## Testing

### Edge Cases to Test

1. **Year boundary**: Dec 31 → Jan 1
2. **Month boundary**: Last day → First day
3. **183-day calculation**: Entry on Dec 31 should count in that year
4. **Payroll**: Payment on Jan 1 should attribute to correct tax year

### Example Test

```typescript
// Test: Worker enters Taiwan on Dec 31, 2024 at 11:59 PM
const entryDate = parseTaiwanDate('2024-12-31');
// Should count as Dec 31, 2024, not Jan 1, 2025

const residency = await calculateResidencyStatus(workerId, 2024);
// Should include Dec 31 in 2024 day count
```
