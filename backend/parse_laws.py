#!/usr/bin/env python3
"""
Automated Legal Text Parser for Swedish Laws
Converts extracted markdown texts from riksdagen.se into structured JSON
"""

import json
import re
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """Clean up text by removing extra whitespace and formatting"""
    # Remove markdown links
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_section(section_text: str, section_num: int) -> Dict[str, Any]:
    """Parse a section (§) from the law text"""
    # Extract the main text (everything after the section number)
    text = section_text.strip()
    
    # Remove any markup
    text = clean_text(text)
    
    # Extract references if any (looking for patterns like "5 kap. 2 §")
    references = re.findall(r'(\d+\s*kap\.?\s*\d+\s*§)', text)
    references.extend(re.findall(r'(\d+\s*§)', text))
    
    return {
        "id": f"section-{section_num}",
        "number": section_num,
        "text": text,
        "references": list(set(references))[:5]  # Limit to 5 unique references
    }

def parse_konkurslag() -> Dict[str, Any]:
    """Parse Konkurslag from the extracted text"""
    # This will contain the complete structure
    return {
        "id": "sfs-1987-672",
        "title": "Konkurslag (1987:672)",
        "sfsNumber": "1987:672",
        "department": "Justitiedepartementet L2",
        "issued": "1987-06-11",
        "lastAmended": "t.o.m. SFS 2025:796",
        "chapters": []  # Will be populated by detailed parsing
    }

def parse_handelsbolag() -> Dict[str, Any]:
    """Parse Handelsbolag law"""
    return {
        "id": "sfs-1980-1102",
        "title": "Lag (1980:1102) om handelsbolag och enkla bolag",
        "sfsNumber": "1980:1102",
        "department": "Justitiedepartementet L1",
        "issued": "1980-12-11",
        "lastAmended": "t.o.m. SFS 2018:1662",
        "chapters": []
    }

def parse_las() -> Dict[str, Any]:
    """Parse LAS (Anställningsskydd)"""
    return {
        "id": "sfs-1982-80",
        "title": "Lag (1982:80) om anställningsskydd (LAS)",
        "sfsNumber": "1982:80",
        "department": "Arbetsmarknadsdepartementet ARM",
        "issued": "1982-02-24",
        "lastAmended": "t.o.m. SFS 2022:836",
        "chapters": []
    }

def parse_semesterlag() -> Dict[str, Any]:
    """Parse Semesterlag"""
    return {
        "id": "sfs-1977-480",
        "title": "Semesterlag (1977:480)",
        "sfsNumber": "1977:480",
        "department": "Arbetsmarknadsdepartementet ARM",
        "issued": "1977-06-09",
        "lastAmended": "t.o.m. SFS 2014:424",
        "chapters": []
    }

def save_law_json(law_data: Dict[str, Any], filename: str):
    """Save law data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(law_data, f, ensure_ascii=False, indent=2)
    print(f"✓ Created {filename}")

if __name__ == "__main__":
    print("Legal Text Parser - Starting...")
    print("This script will generate structured JSON files from extracted legal texts")
    print()
    
    # Note: The actual parsing will be done with the complete extracted texts
    # For now, this shows the structure
    
    print("Parser structure ready. Next step: Process extracted texts into JSON format")
