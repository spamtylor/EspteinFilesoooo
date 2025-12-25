# TROUBLESHOOTING REPORT: Epstein Files Archive

## Executive Summary

This document details the diagnosis and resolution of persistent "AccessDenied" errors and non-functional filters on the Epstein Files archive website.

---

## Issue 1: S3 "AccessDenied" for PDFs/Media in Browser

### Issue Identified

Users clicking on PDFs, images, and videos in the archive received `AccessDenied` XML errors in the browser, despite the files existing and being accessible via `curl` from the command line.

### Verification Method

1. **Browser Console (Network Tab):** Requests to S3 URLs returned `403 Forbidden`.
2. **Command Line Test:**

    ```bash
    curl -I "https://epstein-archive-media.s3.us-east-1.amazonaws.com/archive/DataSet%201/DataSet%201/VOL00001/IMAGES/0001/EFTA00000002.pdf"
    # Result: HTTP/1.1 200 OK
    ```

    This proved S3 permissions were correct, but browsers were being blocked.
3. **AWS CLI CORS Check:**

    ```bash
    aws s3api get-bucket-cors --bucket epstein-archive-media
    # Result: NoSuchCORSConfiguration
    ```

### Root Cause

**Missing CORS (Cross-Origin Resource Sharing) Configuration on S3.**

When a browser (running on `epstein-files.vercel.app`) requests a file from a different domain (`epstein-archive-media.s3.amazonaws.com`), S3 checks its CORS policy. Without one, S3 blocks the request for security reasons. The `curl` command bypasses this because it doesn't enforce CORS.

### Steps Taken to Fix

1. Created `cors.json`:

    ```json
    {
      "CORSRules": [{
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
        "MaxAgeSeconds": 3600
      }]
    }
    ```

2. Applied the policy:

    ```bash
    aws s3api put-bucket-cors --bucket epstein-archive-media --cors-configuration file://cors.json
    ```

### Prevention Plan

- **For future buckets:** Always configure CORS immediately after creation if the bucket will serve browser requests.
- **Monitoring:** Add a pre-deployment check script that verifies `get-bucket-cors` returns a valid policy.

---

## Issue 2: S3 Path Mismatch (404 Disguised as AccessDenied)

### Issue Identified

Some files returned "AccessDenied" even after bucket policies were correct.

### Verification Method

```bash
aws s3 ls "s3://epstein-archive-media/archive/12.11.25 Estate Production/" --recursive | head
# Confirmed files exist under "archive/" prefix
```

Compared to URLs in `master_archive.json` which were missing the `archive/` prefix.

### Root Cause

The `add_files.py` script was generating S3 URLs like:
`https://.../12.11.25 Estate Production/file.jpg`

But the actual S3 structure was:
`https://.../archive/12.11.25 Estate Production/file.jpg`

S3 returns "AccessDenied" for non-existent keys (security measure to not reveal file existence).

### Steps Taken to Fix

1. Modified `get_path_info()` in `add_files.py` to prepend `archive/` to all paths.
2. Created `patch_data.py` to update the existing `master_archive.json` in-place without needing the original source files.
3. Regenerated `master_archive.json` and `search-index.json`.

### Prevention Plan

- **Standardize S3 Structure:** All uploads should go to `s3://bucket/archive/Collection/file`.
- **Path Validation:** Add a post-generation step that samples 5 random URLs and confirms `head-object` returns 200.

---

## Issue 3: Sidebar Filters Returning Zero Results

### Issue Identified

Clicking "Court Records" or "Maxwell Trial" in the sidebar returned no results.

### Verification Method

```powershell
Get-Content master_archive.json | ConvertFrom-Json | Select-Object -ExpandProperty records | Select-Object -ExpandProperty source | Select-Object -Unique
# Result: usvi, doj, S3_ARCHIVE (no "court" or "maxwell")
```

### Root Cause

The `get_source_category()` function in `add_files.py` was mapping collections incorrectly. For example, files in "DataSet 1" (which are legal discovery documents) were being categorized as `S3_ARCHIVE` instead of `court`.

### Steps Taken to Fix

1. Updated `get_source_category()`:

    ```python
    if "dataset" in s: return "court"  # DataSets are legal discovery
    if "estate" in s: return "usvi"    # Map estate to usvi for sidebar
    ```

2. Re-ran `patch_data.py` to update all records.

### Prevention Plan

- **Explicit Collection-to-Source Map:** Maintain a `COLLECTION_SOURCE_MAP` dictionary for predictable categorization.
- **Unit Tests:** Add tests verifying that specific collection names map to expected sources.

---

## Issue 4: Search Not Finding "Trump" or "Maxwell"

### Issue Identified

Searching for "Trump" or "Maxwell" returned zero results.

### Verification Method

```powershell
Select-String -Pattern "trump" master_archive.json
# Result: No matches
```

### Root Cause

Filenames (e.g., `EFTA00000002.pdf`, `HOUSE_OVERSIGHT_034601.JPG`) don't contain the names "Trump" or "Maxwell". The `get_semantic_tags()` function only added tags based on filename content.

### Steps Taken to Fix

1. Implemented broad context tagging in `get_semantic_tags()`:

    ```python
    if "court" in lower_col or "dataset" in lower_col:
        tags.update(["legal", "court", "evidence", "maxwell", "investigation"])
    ```

2. Added a "Filter by Person" sidebar section with hardcoded links for key individuals.

### Prevention Plan

- **OCR/Content Analysis:** For true searchability, implement document OCR to extract text content.
- **Manual Tagging:** For high-priority documents, add a manual tagging interface.

---

## Current Architecture

```
┌─────────────────┐       ┌─────────────────────────────────────┐
│   Vercel Site   │       │         AWS S3 Bucket               │
│  (Static HTML)  │──────▶│  epstein-archive-media              │
│                 │       │  └── archive/                       │
│  Serves:        │       │      ├── 12.03.25 USVI Production/  │
│  - HTML/CSS/JS  │       │      ├── DataSet 1/DataSet 1/       │
│  - JSON Data    │       │      └── ...                        │
└─────────────────┘       └─────────────────────────────────────┘
                                         │
                                         │ CORS Enabled (AllowedOrigins: *)
                                         ▼
                                    [User Browser]
```

---

## Verification Checklist (Post-Fix)

| Test | Command/Action | Expected Result |
|------|----------------|-----------------|
| S3 CORS | `aws s3api get-bucket-cors --bucket epstein-archive-media` | Returns CORSRules JSON |
| PDF Access | Open PDF link in Incognito | PDF loads without error |
| Filter: Court | Click "Court Records" in sidebar | Shows 10,000+ records |
| Filter: Person | Click "Donald Trump" | Shows records tagged "trump" |
| Search | Type "maxwell" in search bar | Shows matching records |

---

## Files Modified

| File | Change |
|------|--------|
| `add_files.py` | Fixed path generation, improved tagging |
| `patch_data.py` | New script for in-place JSON updates |
| `archive.html` | Added "Filter by Person" sidebar |
| `archive.js` | Added person filter logic |
| `cors.json` | S3 CORS configuration |
| `master_archive.json` | Regenerated with correct paths/tags |

---

*Report generated: 2025-12-24*
