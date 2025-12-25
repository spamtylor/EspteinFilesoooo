# OCR Content Tagging - Troubleshooting Guide

## Overview

This document explains the OCR-based tagging system and how to extend it for person-based search filters.

---

## Current State

### Working Filters

| Filter Type | Status | Notes |
|-------------|--------|-------|
| Type (PDF/Image/Video) | ✅ Working | Based on file extension |
| Collection | ✅ Working | Based on folder/collection name |
| Source (DOJ/Maxwell/USVI) | ✅ Working | Fixed - datasets now return "maxwell" |
| Person: Epstein | ✅ Working | Base tag on all 18,550 records |
| Person: Maxwell | ✅ Working | 15,127 records from DataSets 1-8 |

### Filters Requiring OCR (Future Work)

| Filter | Current State | Reason |
|--------|---------------|--------|
| Trump | Not implemented | Needs content-based tagging |
| Clinton | Not implemented | Needs content-based tagging |
| Prince Andrew | Not implemented | Needs content-based tagging |
| Virginia Giuffre | Not implemented | Needs content-based tagging |

---

## Why OCR Is Required

The archive contains 18,550 files with **cryptic Bates number filenames** like:

- `EFTA00000001.pdf`
- `MAXWELL_001234.pdf`

These filenames don't contain person names. The actual content (depositions, testimony, etc.) mentions people like Trump, Clinton, and Prince Andrew, but **we can't tag documents by content without reading the files**.

---

## Technical Challenges

### 1. Files Are Stored on S3

- 14,682 PDFs are stored in AWS S3, not locally
- Running OCR would require downloading all files first
- Estimated download: ~20 GB

### 2. Existing Text Extracts Are Poor Quality

The `extracted_text/` folder contains 18 text files but:

- OCR quality is poor (characters broken up)
- Only covers a small subset of documents

### 3. Aggregated Data Exists But Not Per-Document

`CLEANED_PERSON_NAMES.json` contains person name counts:

```json
{"name": "Donald Trump", "count": 47}
{"name": "Bill Clinton", "count": 89}
{"name": "Prince Andrew", "count": 123}
```

But this doesn't map names to specific documents.

---

## How To Implement Full OCR Tagging

### Option A: Local Processing (Recommended)

1. **Download PDFs from S3**

   ```bash
   aws s3 sync s3://bucket-name/pdfs ./local_pdfs
   ```

2. **Run OCR extraction**

   ```python
   import pdfplumber
   
   def extract_text(pdf_path):
       with pdfplumber.open(pdf_path) as pdf:
           return "\n".join(page.extract_text() for page in pdf.pages)
   ```

3. **Search for person names**

   ```python
   PATTERNS = {
       "trump": ["trump", "donald trump"],
       "clinton": ["clinton", "bill clinton"],
       # ...
   }
   ```

4. **Update master_archive.json with new tags**

### Option B: Cloud-Based Processing

Use AWS Textract or Google Document AI:

- Upload PDFs to cloud service
- Extract text automatically
- Download results and parse for names

### Option C: Pre-Processing Pipeline

Build into the data ingestion:

- When new PDFs are uploaded to S3
- Trigger Lambda function for OCR
- Store extracted text in separate bucket
- Tag records automatically

---

## Files Modified

| File | Changes |
|------|---------|
| `patch_data.py` | Fixed maxwell source filter |
| `archive.html` | Simplified person filters, added OCR note |
| `main.css` | Added sidebar-note styling |
| `ocr_tagger.py` | Created (not yet functional for S3 files) |

---

## Maintenance

### Adding New Person Tags

1. Download the relevant PDFs
2. Run OCR extraction
3. Search for person patterns
4. Update `master_archive.json` with new tags
5. Run `patch_data.py` to rebuild search index
6. Deploy to Vercel

### Keeping Tags Accurate

- Only tag documents that actually contain the person's name
- Don't blanket-tag entire collections (defeats filter purpose)
- Verify tags with spot-checks on actual document content
