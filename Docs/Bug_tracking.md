# Bug Tracking - Cursor Rules

## Primary Directive
Track and document all bugs during development. Every issue must have root cause analysis and fix record.

## Format
Each bug entry must include:
- 🔖 **ID**: Unique identifier
- 🐛 **Summary**: One-line description
- 📄 **Context**: Component/file affected
- 📋 **Error Message** (if applicable)
- 🧠 **Root Cause**
- 🛠️ **Fix & Commit**
- 🔁 **Related Tasks**
- 📅 **Date Logged** / **Date Resolved**

---

## Example

### 🔖 ID: BUG-001
**Summary**: Recipe upload hangs on mobile

**Context**: `mobile/screens/UploadScreen.tsx`

**Error**: N/A (network timeout)

**Root Cause**: Axios call not awaiting Firebase upload properly

**Fix**: Added `await` to image URI resolver → Commit: `abc123`

**Related Task**: `Stage 2: Implement recipe upload`

**Date Logged**: 2025-07-12  
**Date Resolved**: 2025-07-13

---

## Known Issues
- [ ] Intermittent camera crash on Android 14
- [ ] Scroll performance issues in large recipe list
- [ ] Edge case failures in OCR fusion pipeline
