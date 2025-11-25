#!/usr/bin/env python3
"""
Automated Swedish Legal Text Parser
Generates complete TypeScript files from extracted legal texts
"""

import json
import re
from typing import List, Dict, Any, Tuple

def clean_text(text: str) -> str:
    """Clean and normalize legal text"""
    # Remove markdown links but keep the text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove "Lag (YYYY:NNN)" references at end
    text = re.sub(r'\s*_Lag \(\d{4}:\d+\)\._\s*$', '', text)
    return text

def extract_references(text: str) -> List[str]:
    """Extract legal cross-references from text"""
    refs = set()
    
    # Pattern: "5 kap. 2 §" or "5 kap. 1, 2 och 4 §§"
    refs.update(re.findall(r'\d+\s*kap\.\s*\d+(?:\s*,\s*\d+)*(?:\s+och\s+\d+)?\s*§{1,2}', text))
    
    # Pattern: "5 §" or "1-3 §§"
    refs.update(re.findall(r'\d+(?:-\d+)?\s*§{1,2}(?!\w)', text))
    
    # Limit to 10 most relevant references
    return sorted(list(refs))[:10]

def parse_section_text(lines: List[str], start_idx: int) -> Tuple[str, int]:
    """Parse a section's text until the next section or chapter"""
    text_parts = []
    i = start_idx
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Stop if we hit a new section number or chapter
        if re.match(r'^\*\*\d+\s*§\*\*', line) or re.match(r'^#+\s+\d+\s+kap\.', line):
            break
        
        # Skip empty lines and headers
        if not line or line.startswith('#') or line == '---' or line.startswith('**SFS'):
            i += 1
            continue
        
        # Add non-empty content
        if line and not line.startswith('Svensk författningssamling'):
            text_parts.append(line)
        
        i += 1
    
    return ' '.join(text_parts), i

def parse_law_from_markdown(markdown_text: str, law_info: Dict[str, str]) -> Dict[str, Any]:
    """Parse a complete law from markdown text"""
    lines = markdown_text.split('\n')
    
    law_data = {
        "id": law_info['id'],
        "title": law_info['title'],
        "sfsNumber": law_info['sfsNumber'],
        "department": law_info['department'],
        "issued": law_info['issued'],
        "lastAmended": law_info['lastAmended'],
        "chapters": []
    }
    
    current_chapter = None
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Match chapter header: "### 1 kap. Inledande bestämmelser"
        chapter_match = re.match(r'^#+\s*(\d+)\s+kap\.\s+(.+)$', line)
        if chapter_match:
            chapter_num = int(chapter_match.group(1))
            chapter_title = clean_text(chapter_match.group(2))
            
            # Save previous chapter if exists
            if current_chapter:
                law_data['chapters'].append(current_chapter)
            
            # Start new chapter
            current_chapter = {
                "id": f"kap-{chapter_num}",
                "number": chapter_num,
                "title": chapter_title,
                "sections": []
            }
            i += 1
            continue
        
        # Match section: "**1 §**" or "**2 a §**"
        section_match = re.match(r'^\*\*(\d+(?:\s+[a-z])?)\s*§\*\*', line)
        if section_match and current_chapter:
            section_num_str = section_match.group(1).strip()
            
            # Parse section number (handle "2 a" as special case)
            try:
                section_num = int(section_num_str.split()[0])
            except:
                section_num = len(current_chapter['sections']) + 1
            
            # Get the text after the section marker on same line
            text_start = line[section_match.end():].strip()
            
            # Parse full section text from following lines
            section_text, next_i = parse_section_text(lines, i + 1)
            
            # Combine initial text with following text
            full_text = f"{text_start} {section_text}".strip()
            full_text = clean_text(full_text)
            
            if full_text:  # Only add if there's actual content
                section = {
                    "id": f"kap-{current_chapter['number']}-§-{section_num}",
                    "number": section_num,
                    "text": full_text,
                    "references": extract_references(full_text)
                }
                current_chapter['sections'].append(section)
            
            i = next_i
            continue
        
        i += 1
    
    # Add last chapter
    if current_chapter and current_chapter['sections']:
        law_data['chapters'].append(current_chapter)
    
    return law_data

def generate_typescript_file(law_data: Dict[str, Any], output_path: str):
    """Generate TypeScript file with law data"""
    
    # Convert to TypeScript format
    ts_content = f"""// {law_data['title']}
// Auto-generated from riksdagen.se
// Last amended: {law_data['lastAmended']}

import {{ LegalText }} from '../legalTexts';

export const {law_data['id'].replace('-', '_')}: LegalText = {json.dumps(law_data, ensure_ascii=False, indent=2)};
"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"✓ Generated {output_path}")
    print(f"  - Chapters: {len(law_data['chapters'])}")
    total_sections = sum(len(ch['sections']) for ch in law_data['chapters'])
    print(f"  - Total sections: {total_sections}")

# Law information metadata
LAWS_INFO = {
    'konkurslag': {
        'id': 'sfs-1987-672',
        'title': 'Konkurslag (1987:672)',
        'sfsNumber': '1987:672',
        'department': 'Justitiedepartementet L2',
        'issued': '1987-06-11',
        'lastAmended': 't.o.m. SFS 2025:796'
    },
    'handelsbolag': {
        'id': 'sfs-1980-1102',
        'title': 'Lag (1980:1102) om handelsbolag och enkla bolag',
        'sfsNumber': '1980:1102',
        'department': 'Justitiedepartementet L1',
        'issued': '1980-12-11',
        'lastAmended': 't.o.m. SFS 2018:1662'
    },
    'las': {
        'id': 'sfs-1982-80',
        'title': 'Lag (1982:80) om anställningsskydd (LAS)',
        'sfsNumber': '1982:80',
        'department': 'Arbetsmarknadsdepartementet ARM',
        'issued': '1982-02-24',
        'lastAmended': 't.o.m. SFS 2022:836'
    },
    'semesterlag': {
        'id': 'sfs-1977-480',
        'title': 'Semesterlag (1977:480)',
        'sfsNumber': '1977:480',
        'department': 'Arbetsmarknadsdepartementet ARM',
        'issued': '1977-06-09',
        'lastAmended': 't.o.m. SFS 2014:424'
    },
    'aktiebolagslag': {
        'id': 'sfs-2005-551',
        'title': 'Aktiebolagslag (2005:551) - Konkursrelevanta avsnitt',
        'sfsNumber': '2005:551',
        'department': 'Justitiedepartementet',
        'issued': '2005-04-28',
        'lastAmended': 't.o.m. SFS 2024:862'
    }
}

def main():
    print("=" * 60)
    print("Swedish Legal Text Parser - Automated Generation")
    print("=" * 60)
    print()
    print("This script will parse extracted legal texts and generate")
    print("complete TypeScript files for the mobile app.")
    print()
    print("Status: Parser functions ready")
    print("Next step: Load extracted markdown texts and parse")
    print()
    print("To use:")
    print("1. Save extracted markdown text to files")
    print("2. Run parser on each file")
    print("3. Generate TypeScript exports")
    print()

if __name__ == "__main__":
    main()
