#!/usr/bin/env python3
"""
add_files.py - Automated File Watcher for Epstein Investigation

Monitors a directory for new files and automatically:
1. Extracts metadata (date, file type, summary)
2. Updates the Timeline page with new entries
3. Updates the Documents page with new files
4. Regenerates data JSON files
5. Generates search-index.json for Fuse.js

Usage:
    python add_files.py --watch /path/to/watch
    python add_files.py --scan /path/to/scan  # One-time scan

Requirements:
    pip install watchdog
"""

import os
import sys
import json
import hashlib
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import quote

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    print("Warning: watchdog not installed. Run: pip install watchdog")
    class FileSystemEventHandler: pass


# Configuration
DASHBOARD_DIR = Path(__file__).parent
DATA_DIR = DASHBOARD_DIR / "data"
DOCS_DIR = DASHBOARD_DIR / "docs"

# File type categories
FILE_CATEGORIES = {
    ".pdf": "document",
    ".doc": "document",
    ".docx": "document",
    ".txt": "text",
    ".jpg": "image",
    ".jpeg": "image",
    ".png": "image",
    ".gif": "image",
    ".mp4": "video",
    ".mov": "video",
    ".avi": "video",
    ".dat": "data",
    ".opt": "data",
}


def get_file_hash(filepath: Path) -> str:
    """Generate MD5 hash for file deduplication."""
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()[:8]


def extract_metadata(filepath: Path) -> Dict:
    """Extract metadata from a file."""
    stat = filepath.stat()
    ext = filepath.suffix.lower()
    
    return {
        "filename": filepath.name,
        "path": str(filepath),
        "extension": ext,
        "category": FILE_CATEGORIES.get(ext, "other"),
        "size_bytes": stat.st_size,
        "size_human": format_size(stat.st_size),
        "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "hash": get_file_hash(filepath) if stat.st_size < 100_000_000 else "large_file"
    }


def format_size(size_bytes: int) -> str:
    """Convert bytes to human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def scan_directory(directory: Path) -> List[Dict]:
    """Scan a directory for all files and extract metadata."""
    files = []
    
    for filepath in directory.rglob("*"):
        if filepath.is_file():
            try:
                metadata = extract_metadata(filepath)
                files.append(metadata)
            except Exception as e:
                print(f"Error processing {filepath}: {e}")
    
    return files


def update_documents_data(files: List[Dict]) -> None:
    """Update the documents.json data file."""
    DATA_DIR.mkdir(exist_ok=True)
    
    # Group files by category
    by_category = {}
    for f in files:
        cat = f["category"]
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(f)
    
    # Generate statistics
    stats = {
        "total_files": len(files),
        "total_size": sum(f["size_bytes"] for f in files),
        "by_category": {cat: len(items) for cat, items in by_category.items()},
        "last_updated": datetime.now().isoformat()
    }
    
    data = {
        "statistics": stats,
        "files": files[:1000],  # Limit to first 1000 for JSON size
        "by_category": by_category
    }
    
    output_path = DATA_DIR / "documents.json"
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Updated {output_path} with {len(files)} files")


def update_timeline_data(files: List[Dict]) -> None:
    """Update timeline.json with date-sorted entries."""
    DATA_DIR.mkdir(exist_ok=True)
    
    # Sort by modification date
    sorted_files = sorted(files, key=lambda x: x["modified"], reverse=True)
    
    # Group by month
    by_month = {}
    for f in sorted_files:
        month = f["modified"][:7]  # YYYY-MM
        if month not in by_month:
            by_month[month] = []
        by_month[month].append({
            "filename": f["filename"],
            "category": f["category"],
            "size": f["size_human"],
            "date": f["modified"][:10]
        })
    
    data = {
        "entries": list(by_month.items())[:12],  # Last 12 months
        "last_updated": datetime.now().isoformat()
    }
    
    output_path = DATA_DIR / "timeline.json"
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Updated {output_path}")



# -----------------------------------------------------------------------------
# Metadata Helpers (Refactored for extensive tagging & simple maintenance)
# -----------------------------------------------------------------------------

def get_path_info(abs_path: str) -> tuple:
    """Derive relative path, collection name, and S3 URL from absolute path."""
    from urllib.parse import quote
    
    path_obj = Path(abs_path)
    parts = path_obj.parts
    rel_path = str(path_obj)
    collection = "Uncategorized"
    
    # Analyze path structure
    # Analyze path structure
    if "extracted" in parts:
        try:
            idx = parts.index("extracted")
            rel_parts = parts[idx+1:] # Collection/File...
            if len(rel_parts) > 0:
                collection = rel_parts[0]
            rel_path = "/".join(rel_parts)
        except: pass
    elif "archive" in parts:
        try:
            idx = parts.index("archive")
            rel_parts = parts[idx:] # archive/Collection/...
            rel_path = "/".join(rel_parts)
            if len(rel_parts) > 1:
                collection = rel_parts[1] 
        except: pass
    elif "dashboard" in abs_path:
        try:
            rel_path = abs_path.split("dashboard")[1].lstrip(os.sep).replace("\\", "/")
        except: pass
        
    s3_url = f"https://epstein-archive-media.s3.us-east-1.amazonaws.com/{quote(rel_path.replace(os.sep, '/'), safe='/')}"
    return rel_path, collection, s3_url

def get_semantic_tags(filename: str, path: str) -> List[str]:
    """Generate extensive tags based on filename and known keywords."""
    tags = ["epstein"] # Global tag for broad search
    
    # Text Analysis
    text = (filename + " " + path).lower()
    
    # 1. File Type
    ext = Path(filename).suffix.replace(".", "").lower()
    if ext: tags.append(ext)
    
    # 2. Key People
    people = {
        "maxwell": ["maxwell", "ghislaine", "gmax"],
        "andrew": ["andrew", "york", "prince", "hrh"],
        "clinton": ["clinton", "bill", "president"],
        "trump": ["trump", "donald"],
        "dershowitz": ["dershowitz", "alan"],
        "acosta": ["acosta", "alex"],
        "giuffre": ["giuffre", "virginia", "roberts"],
        "sjoberg": ["sjoberg", "johanna"],
        "wexner": ["wexner", "les"]
    }
    for tag, keywords in people.items():
        if any(k in text for k in keywords):
            tags.append(tag)
            tags.append("person_interest")

    # 3. Locations
    locations = {
        "island": ["island", "lsj", "little st", "james", "usvi"],
        "palm_beach": ["palm beach", "florida", "pb"],
        "zorro": ["zorro", "ranch", "mexico"],
        "nyc": ["manhattan", "nyc", "york", "mansion"],
        "paris": ["paris", "france"]
    }
    for tag, keywords in locations.items():
        if any(k in text for k in keywords):
            tags.append(tag)
            tags.append("location")

    # 4. Context & Evidence Type
    context = {
        "flight_log": ["flight", "log", "manifest", "pilot", "plane", "aircraft", "g550", "727"],
        "legal": ["deposition", "testimony", "affidavit", "motion", "order", "sealed", "redacted", "court", "exhibit"],
        "financial": ["check", "bank", "wire", "payment", "ledger", "finance"],
        "correspondence": ["email", "letter", "fax", "message", "contact"],
        "media": ["photo", "image", "video", "camera", "dvr", "surveillance"],
        "victim": ["victim", "minor", "underage", "recruit", "massage", "girl"]
    }
    for tag, keywords in context.items():
        if any(k in text for k in keywords):
            tags.append(tag)
            
    return list(set(tags))

def get_source_category(collection: str, filename: str) -> str:
    """Determine high-level source category for filtering."""
    s = (collection + " " + filename).lower()
    
    # Relaxed Logic for better matching
    if "doj" in s or "oversight" in s or "release" in s: return "doj"
    if "court" in s or "deposition" in s or "legal" in s or "exhibit" in s: return "court"
    if "maxwell" in s: return "maxwell"
    if "estate" in s: return "estate"
    if "usvi" in s: return "usvi"
    
    return "S3_ARCHIVE"


def generate_search_index(files: List[Dict]) -> None:
    """Generate search-index.json for Fuse.js fuzzy search."""
    DATA_DIR.mkdir(exist_ok=True)
    
    search_index = []
    for f in files:
        rel_path, collection, s3_url = get_path_info(f["path"])
        tags = get_semantic_tags(f["filename"], f["path"])
        
        search_index.append({
            "name": f["filename"],
            "type": f["category"],
            "tags": tags,
            "path": s3_url
        })
    
    output_path = DATA_DIR / "search-index.json"
    with open(output_path, 'w') as f:
        json.dump(search_index, f)
    
    print(f"Generated {output_path} with {len(search_index)} entries")


def generate_manifest(files: List[Dict]) -> None:
    """Generate master manifest.json for Production Gallery."""
    manifest = []
    
    for f in files:
        rel_path, collection, s3_url = get_path_info(f["path"])
        
        manifest.append({
            "filename": f["filename"],
            "relative_path": s3_url,
            "collection_name": collection,
            "file_type": f["category"],
            "last_modified": f["modified"]
        })
        
    output_path = DASHBOARD_DIR / "manifest.json"
    with open(output_path, 'w') as f:
        json.dump({"files": manifest}, f)
        
    print(f"Generated Production Manifest: {output_path}")


def generate_master_archive(files: List[Dict]) -> None:
    """Generate master_archive.json for Archive.js (Evidence Tracker)."""
    records = []
    
    for i, f in enumerate(files):
        rel_path, collection, s3_url = get_path_info(f["path"])
        tags = get_semantic_tags(f["filename"], f["path"])
        source = get_source_category(collection, f["filename"])
        
        records.append({
            "id": f"EVD-{collection[:3].upper()}-{str(i).zfill(4)}",
            "name": f["filename"],
            "path": s3_url,
            "collection": collection,
            "type": f["category"],
            "date": f["modified"][:10],
            "description": f"Recovered from {collection}",
            "source": source,
            "tags": tags
        })
        
    output_path = DATA_DIR / "master_archive.json"
    with open(output_path, 'w') as f:
        json.dump({"records": records}, f)
    with open(output_path, 'w') as f:
        json.dump({"records": records}, f)
        
    print(f"Generated Master Archive: {output_path}")



class NewFileHandler(FileSystemEventHandler):
    """Handler for new file events."""
    
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.processed = set()
    
    def on_created(self, event):
        if event.is_directory:
            return
        
        filepath = Path(event.src_path)
        if filepath in self.processed:
            return
        
        print(f"New file detected: {filepath}")
        self.processed.add(filepath)
        
        try:
            metadata = extract_metadata(filepath)
            print(f"  Category: {metadata['category']}")
            print(f"  Size: {metadata['size_human']}")
            
            # Update data files
            all_files = scan_directory(self.base_dir)
            update_documents_data(all_files)
            update_timeline_data(all_files)
            generate_search_index(all_files)
            generate_manifest(all_files)
            
        except Exception as e:
            print(f"  Error: {e}")


def watch_directory(directory: Path) -> None:
    """Watch a directory for new files."""
    if not WATCHDOG_AVAILABLE:
        print("Error: watchdog library required. Install with: pip install watchdog")
        sys.exit(1)
    
    print(f"Watching directory: {directory}")
    print("Press Ctrl+C to stop...")
    
    event_handler = NewFileHandler(directory)
    observer = Observer()
    observer.schedule(event_handler, str(directory), recursive=True)
    observer.start()
    
    try:
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    
    observer.join()


def main():
    parser = argparse.ArgumentParser(description="Epstein Files Auto-Updater")
    parser.add_argument("--watch", type=Path, help="Watch directory for new files")
    parser.add_argument("--scan", type=Path, help="One-time scan of directory")
    parser.add_argument("--output", type=Path, default=DATA_DIR, help="Output directory for JSON")
    
    args = parser.parse_args()
    
    if args.watch:
        watch_directory(args.watch)
    elif args.scan:
        print(f"Scanning {args.scan}...")
        files = scan_directory(args.scan)
        print(f"Found {len(files)} files")
        update_documents_data(files)
        update_timeline_data(files)
        generate_search_index(files)
        generate_manifest(files)
        generate_master_archive(files)
        print("Done!")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
