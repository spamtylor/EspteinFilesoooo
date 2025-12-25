"""
OCR-Based PDF Text Extraction and Person Tagging

Extracts text from PDFs and searches for person names to tag documents
by their actual content rather than just filenames.
"""

import json
import os
import re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import pdfplumber

# Paths
DATA_DIR = Path("d:/Development/Projects/EpsteinInvestigation/dashboard/data")
MASTER_FILE = DATA_DIR / "master_archive.json"
SEARCH_FILE = DATA_DIR / "search-index.json"

# Person name patterns to search for (lowercase)
PERSON_PATTERNS = {
    "trump": ["trump", "donald trump", "donald j. trump", "president trump"],
    "clinton": ["clinton", "bill clinton", "william clinton", "president clinton", "hillary"],
    "prince": ["prince andrew", "duke of york", "andrew windsor", "prince"],
    "giuffre": ["giuffre", "virginia giuffre", "virginia roberts", "roberts"],
    "dershowitz": ["dershowitz", "alan dershowitz"],
    "brunel": ["brunel", "jean-luc brunel", "jean luc brunel"],
    "wexner": ["wexner", "les wexner", "leslie wexner"],
    "spacey": ["spacey", "kevin spacey"],
    "richardson": ["richardson", "bill richardson"],
    "dubin": ["dubin", "glenn dubin", "eva dubin"],
}

# Base path to look for PDFs
PDF_SEARCH_PATHS = [
    Path("d:/Development/Projects/EpsteinInvestigation/extracted"),
]

def extract_text_from_pdf(pdf_path: str, max_pages: int = 10) -> str:
    """Extract text from first N pages of a PDF."""
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages[:max_pages]):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.lower()
    except Exception as e:
        return ""

def find_pdf_path(filename: str, collection: str) -> str:
    """Try to find the actual PDF file on disk."""
    # Common patterns for finding PDFs
    search_patterns = [
        # Direct path based on collection
        f"d:/Development/Projects/EpsteinInvestigation/extracted/{collection}/{filename}",
        f"d:/Development/Projects/EpsteinInvestigation/extracted/**/{filename}",
    ]
    
    # Search in extracted folders
    for base_path in PDF_SEARCH_PATHS:
        for path in base_path.rglob(filename):
            return str(path)
    
    return None

def get_person_tags_from_text(text: str) -> list:
    """Search text for person name patterns and return matching tags."""
    tags = []
    text_lower = text.lower()
    
    for tag, patterns in PERSON_PATTERNS.items():
        for pattern in patterns:
            if pattern in text_lower:
                tags.append(tag)
                break  # Found this person, move to next
    
    return tags

def process_single_record(record: dict) -> dict:
    """Process a single record to add person tags from PDF content."""
    if record.get('type') != 'document':
        return record
    
    filename = record.get('name', '')
    collection = record.get('collection', '')
    
    if not filename.lower().endswith('.pdf'):
        return record
    
    # Find the PDF file
    pdf_path = find_pdf_path(filename, collection)
    if not pdf_path or not os.path.exists(pdf_path):
        return record
    
    # Extract text and find person tags
    text = extract_text_from_pdf(pdf_path)
    if not text:
        return record
    
    person_tags = get_person_tags_from_text(text)
    
    # Add new tags to existing tags
    existing_tags = set(record.get('tags', []))
    existing_tags.update(person_tags)
    record['tags'] = list(existing_tags)
    
    return record

def main():
    print("Loading master archive...")
    with open(MASTER_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    records = data.get('records', [])
    print(f"Total records: {len(records)}")
    
    # Filter to just PDFs
    pdf_records = [r for r in records if r.get('type') == 'document']
    print(f"PDF records to process: {len(pdf_records)}")
    
    # Process in batches with progress
    processed = 0
    tagged_count = {tag: 0 for tag in PERSON_PATTERNS.keys()}
    
    print("\nProcessing PDFs...")
    for i, record in enumerate(records):
        if record.get('type') == 'document':
            result = process_single_record(record)
            for tag in PERSON_PATTERNS.keys():
                if tag in result.get('tags', []):
                    tagged_count[tag] += 1
            processed += 1
            
            if processed % 100 == 0:
                print(f"  Processed {processed} PDFs...")
    
    # Save updated data
    print("\nSaving updated data...")
    with open(MASTER_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f)
    
    # Rebuild search index
    search_index = [{
        "name": r["name"],
        "type": r.get("type", "document"),
        "tags": r.get("tags", []),
        "path": r["path"]
    } for r in records]
    
    with open(SEARCH_FILE, 'w', encoding='utf-8') as f:
        json.dump(search_index, f)
    
    print("\n=== OCR Tagging Complete ===")
    print(f"Processed {processed} PDF files")
    print("\nPerson tag counts:")
    for tag, count in tagged_count.items():
        print(f"  {tag}: {count}")

if __name__ == "__main__":
    main()
