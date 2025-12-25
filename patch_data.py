
import json
import os
from pathlib import Path

DATA_DIR = Path("d:/Development/Projects/EpsteinInvestigation/dashboard/data")
MASTER_FILE = DATA_DIR / "master_archive.json"
SEARCH_FILE = DATA_DIR / "search-index.json"

# -----------------------------------------------------------------------------
# Re-used Logic from add_files.py (The "Brains" of the fix)
# -----------------------------------------------------------------------------

KEYWORD_MAP = {
    "epstein": ["epstein", "jeffrey", "island", "pedophile"],
    "maxwell": ["ghislaine", "maxwell", "terra", "mar", "terramar"],
    "trump": ["trump", "donald", "president"],
    "clinton": ["clinton", "bill", "president"],
    "prince": ["prince", "andrew", "duke", "royal"],
    "dershowitz": ["dershowitz", "alan"],
    "brunel": ["brunel", "jean", "luc"],
    "les": ["wexner", "leslie"],
    "giuffre": ["virginia", "roberts", "giuffre"],
    "sjberg": ["johanna", "sjoberg", "sjberg"],
    "flight": ["flight", "log", "pilot", "manifest", "plane", "lolita", "express"],
    "court": ["deposition", "transcript", "testimony", "affidavit", "motion", "exhibit", "v."],
    "redacted": ["redacted", "blacked", "out"],
    "financial": ["bank", "check", "deposit", "transfer", "jp", "morgan", "deutsche"],
    "palm": ["palm", "beach", "florida", "mansion"],
    "mexico": ["zorro", "ranch", "mexico", "nm"],
    "paris": ["paris", "france", "apartment"],
    "ny": ["york", "manhattan", "house", "71st"],
    "vi": ["virgin", "islands", "lsj", "little", "james", "sj", "st"],
}

def get_semantic_tags(filename, collection):
    """
    Generates semantic tags based on filename, collection, and keyword matching.
    Tags are added only when there's evidence in the filename/path.
    """
    tags = set()
    lower_name = filename.lower().replace("_", " ").replace("-", " ").replace(".", " ")
    lower_col = collection.lower().replace("_", " ")
    
    # 0. BASE TAGS - All files are from Epstein investigation
    tags.add("epstein")
    tags.add("investigation")
    
    # 1. File Extension Tags
    ext = os.path.splitext(filename)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.gif']: tags.add('image')
    elif ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']: tags.add('video')
    elif ext in ['.pdf']: tags.add('document'); tags.add('pdf')
    
    # 2. Collection Context Tags (location/source based)
    if "usvi" in lower_col:
        tags.update(["island", "usvi", "little st james"])
    if "estate" in lower_col:
        tags.update(["estate", "financial"])
    if "court" in lower_col or "dataset" in lower_col:
        tags.update(["legal", "court", "evidence"])

    # 3. Keyword Matching - ONLY add person tags when found in filename/path
    search_text = f"{lower_name} {lower_col}"
    for category, keywords in KEYWORD_MAP.items():
        for keyword in keywords:
            if keyword in search_text:
                tags.add(category)
                break  # Only add category once
    
    # 4. Inferred Tags from filename patterns
    if "dc" in lower_name or "district" in lower_name: tags.add("legal")
    if "def" in lower_name or "plaintiff" in lower_name: tags.add("court")
    if "deposition" in lower_name or "transcript" in lower_name: tags.add("testimony")

    return list(tags)

def get_source_category(collection: str, filename: str) -> str:
    s = (collection + " " + filename).lower()
    if "doj" in s or "oversight" in s or "release" in s or "gdrive" in s: return "doj"
    if "usvi" in s or "estate" in s: return "usvi"
    if "minors" in s: return "court"
    if "dataset" in s: return "court"
    if "court" in s or "deposition" in s or "legal" in s or "exhibit" in s: return "court"
    if "maxwell" in s: return "maxwell"
    return "S3_ARCHIVE"

# -----------------------------------------------------------------------------
# Patching Logic
# -----------------------------------------------------------------------------

def patch_data():
    print(f"Reading {MASTER_FILE}...")
    try:
        with open(MASTER_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("MASTER FILE NOT FOUND!")
        return

    records = data.get("records", [])
    print(f"Processing {len(records)} records...")
    
    updated_records = []
    search_index = []
    
    for r in records:
        # Regenerate metadata
        r["source"] = get_source_category(r["collection"], r["name"])
        r["tags"] = get_semantic_tags(r["name"], r["collection"])
        
        updated_records.append(r)
        
        # Build Search Index Entry
        search_index.append({
            "name": r["name"],
            "type": r.get("type", "document"), 
            "tags": r["tags"],
            "path": r["path"]
        })

    # Save Master Archive
    data["records"] = updated_records
    with open(MASTER_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f) # No indent to save space
    print(f"Updated {MASTER_FILE} with new metadata.")

    # Save Search Index
    with open(SEARCH_FILE, 'w', encoding='utf-8') as f:
        json.dump(search_index, f)
    print(f"Updated {SEARCH_FILE} with new metadata.")

if __name__ == "__main__":
    patch_data()
