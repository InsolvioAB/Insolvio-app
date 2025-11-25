#!/usr/bin/env python3
"""
Process DOCX files containing Swedish legal texts
Downloads from URLs and converts to structured TypeScript format
"""

import os
import re
import json
import requests
import mammoth
from typing import Dict, List, Any, Tuple
from pathlib import Path
from final_parser import parse_swedish_law_final

# Law information metadata
LAWS_INFO = {
    'konkurslag': {
        'id': 'sfs-1987-672',
        'title': 'Konkurslag (1987:672)',
        'sfsNumber': '1987:672',
        'department': 'Justitiedepartementet L2',
        'issued': '1987-06-11',
        'lastAmended': 't.o.m. SFS 2025:796',
        'url': 'https://customer-assets.emergentagent.com/job_docuapp-6/artifacts/8bq8hd9u_Konkurslagen.docx'
    },
    'handelsbolag': {
        'id': 'sfs-1980-1102',
        'title': 'Lag (1980:1102) om handelsbolag och enkla bolag',
        'sfsNumber': '1980:1102',
        'department': 'Justitiedepartementet L1',
        'issued': '1980-12-11',
        'lastAmended': 't.o.m. SFS 2018:1662',
        'url': 'https://customer-assets.emergentagent.com/job_docuapp-6/artifacts/67sfbudp_Lag%20om%20handelsbolag%20och%20enkla%20bolag.docx'
    },
    'utsökningsbalken': {
        'id': 'sfs-utsokningsbalken',
        'title': 'Utsökningsbalk',
        'sfsNumber': 'Utsökningsbalk',
        'department': 'Justitiedepartementet',
        'issued': '',
        'lastAmended': '',
        'url': 'https://customer-assets.emergentagent.com/job_docuapp-6/artifacts/2w17y3lx_Utso%CC%88kningsbalken.docx'
    },
    'aktiebolagslag': {
        'id': 'sfs-2005-551',
        'title': 'Aktiebolagslag (2005:551)',
        'sfsNumber': '2005:551',
        'department': 'Justitiedepartementet',
        'issued': '2005-04-28',
        'lastAmended': 't.o.m. SFS 2024:862',
        'url': 'https://customer-assets.emergentagent.com/job_docuapp-6/artifacts/nehhh736_ABL.docx'
    },
    'las': {
        'id': 'sfs-1982-80',
        'title': 'Lag (1982:80) om anställningsskydd',
        'sfsNumber': '1982:80',
        'department': 'Arbetsmarknadsdepartementet ARM',
        'issued': '1982-02-24',
        'lastAmended': 't.o.m. SFS 2022:836',
        'url': 'https://customer-assets.emergentagent.com/job_docuapp-6/artifacts/9bi1sjz2_LAS.docx'
    },
    'semesterlag': {
        'id': 'sfs-1977-480',
        'title': 'Semesterlag (1977:480)',
        'sfsNumber': '1977:480',
        'department': 'Arbetsmarknadsdepartementet ARM',
        'issued': '1977-06-09',
        'lastAmended': 't.o.m. SFS 2014:424',
        'url': 'https://customer-assets.emergentagent.com/job_lawfinder-8/artifacts/5rb9ford_Semesterlag.docx'
    }
}

def download_docx(url: str, output_path: str) -> bool:
    """Download DOCX file from URL"""
    try:
        print(f"  Laddar ner från: {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        print(f"  ✓ Nedladdad: {output_path}")
        return True
    except Exception as e:
        print(f"  ✗ Fel vid nedladdning: {e}")
        return False

def extract_text_from_docx(docx_path: str) -> str:
    """Extract text from DOCX file using mammoth"""
    try:
        with open(docx_path, 'rb') as docx_file:
            result = mammoth.extract_raw_text(docx_file)
            return result.value
    except Exception as e:
        print(f"  ✗ Fel vid extrahering: {e}")
        return ""

def clean_text(text: str) -> str:
    """Clean and normalize legal text"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove special markers
    text = re.sub(r'_Lag \(\d{4}:\d+\)\._', '', text)
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

def parse_law_structure(text: str, law_info: Dict[str, str]) -> Dict[str, Any]:
    """Parse legal text into structured format"""
    
    law_data = {
        "id": law_info['id'],
        "title": law_info['title'],
        "sfsNumber": law_info['sfsNumber'],
        "department": law_info['department'],
        "issued": law_info['issued'],
        "lastAmended": law_info['lastAmended'],
        "chapters": []
    }
    
    # Remove header information (everything before first chapter)
    # Look for first chapter marker
    first_chapter_pos = re.search(r'\d+\s*kap\.', text, re.IGNORECASE)
    if first_chapter_pos:
        text = text[first_chapter_pos.start():]
    
    # Split into sentences/paragraphs for better processing
    # Use regex to split on chapter and section markers while keeping them
    parts = re.split(r'(\d+\s*kap\.[^\n]*|\d+(?:\s+[a-z])?\s*§)', text, flags=re.IGNORECASE)
    
    current_chapter = None
    current_section = None
    
    i = 0
    while i < len(parts):
        part = parts[i].strip()
        
        if not part:
            i += 1
            continue
        
        # Check if this is a chapter marker
        chapter_match = re.match(r'^(\d+)\s*kap\.(.*)$', part, re.IGNORECASE)
        if chapter_match:
            # Save previous section if exists
            if current_section and current_section.get('text'):
                if current_chapter:
                    current_chapter['sections'].append(current_section)
            
            # Save previous chapter if exists
            if current_chapter and current_chapter['sections']:
                law_data['chapters'].append(current_chapter)
            
            # Start new chapter
            chapter_num = int(chapter_match.group(1))
            chapter_title = chapter_match.group(2).strip() or f"Kapitel {chapter_num}"
            
            current_chapter = {
                "id": f"kap-{chapter_num}",
                "number": chapter_num,
                "title": chapter_title,
                "sections": []
            }
            current_section = None
            i += 1
            continue
        
        # Check if this is a section marker
        section_match = re.match(r'^(\d+(?:\s+[a-z])?)\s*§$', part)
        if section_match:
            # Save previous section if exists
            if current_section and current_section.get('text'):
                if current_chapter:
                    current_chapter['sections'].append(current_section)
            
            # Start new section
            section_num_str = section_match.group(1).strip()
            try:
                section_num = int(section_num_str.split()[0])
            except:
                section_num = len(current_chapter['sections']) + 1 if current_chapter else 1
            
            # Get the text from next part
            section_text = ""
            if i + 1 < len(parts):
                section_text = parts[i + 1].strip()
                i += 1  # Skip next part as we've used it
            
            if current_chapter:
                current_section = {
                    "id": f"kap-{current_chapter['number']}-§-{section_num}",
                    "number": section_num,
                    "text": clean_text(section_text),
                    "references": extract_references(section_text)
                }
            i += 1
            continue
        
        # Otherwise, if we have a current section, add to its text
        if current_section and part:
            current_text = current_section.get('text', '')
            if current_text:
                current_section['text'] = clean_text(current_text + ' ' + part)
            else:
                current_section['text'] = clean_text(part)
            current_section['references'] = extract_references(current_section['text'])
        
        i += 1
    
    # Save last section
    if current_section and current_section.get('text'):
        if current_chapter:
            current_chapter['sections'].append(current_section)
    
    # Save last chapter
    if current_chapter and current_chapter['sections']:
        law_data['chapters'].append(current_chapter)
    
    return law_data

def generate_typescript_file(law_data: Dict[str, Any], output_path: str, var_name: str):
    """Generate TypeScript file with law data"""
    
    ts_content = f"""// {law_data['title']}
// Auto-generated from uploaded DOCX
// Last amended: {law_data['lastAmended']}

import {{ LegalText }} from '../legalTexts';

export const {var_name}: LegalText = {json.dumps(law_data, ensure_ascii=False, indent=2)};
"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"  ✓ Genererade {output_path}")
    print(f"    - Kapitel: {len(law_data['chapters'])}")
    total_sections = sum(len(ch['sections']) for ch in law_data['chapters'])
    print(f"    - Totalt paragrafer: {total_sections}")

def process_all_laws():
    """Download and process all laws"""
    
    # Create directories
    backend_dir = Path('/app/backend')
    docx_dir = backend_dir / 'docx_files'
    docx_dir.mkdir(exist_ok=True)
    
    output_dir = Path('/app/frontend/src/data/laws')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 70)
    print("Bearbetar Svenska Juridiska Texter från DOCX-filer")
    print("=" * 70)
    print()
    
    for law_key, law_info in LAWS_INFO.items():
        print(f"\n📜 Bearbetar: {law_info['title']}")
        print("-" * 70)
        
        # Download DOCX
        docx_path = docx_dir / f"{law_key}.docx"
        if not download_docx(law_info['url'], str(docx_path)):
            continue
        
        # Extract text
        print("  Extraherar text...")
        text = extract_text_from_docx(str(docx_path))
        if not text:
            continue
        
        print(f"  ✓ Extraherade {len(text)} tecken")
        
        # Parse structure using final parser
        print("  Parsar lagstruktur...")
        law_data = parse_swedish_law_final(text, law_info)
        
        if not law_data['chapters']:
            print("  ⚠ Ingen struktur hittades, sparar som ett kapitel...")
            # Create a single chapter with all text
            law_data['chapters'] = [{
                "id": "kap-1",
                "number": 1,
                "title": "Fullständig text",
                "sections": [{
                    "id": "kap-1-§-1",
                    "number": 1,
                    "text": clean_text(text[:10000]),  # Limit to first 10000 chars
                    "references": extract_references(text[:10000])
                }]
            }]
        
        # Generate TypeScript file
        output_file = output_dir / f"{law_key}.ts"
        generate_typescript_file(law_data, str(output_file), law_key)
        
        print("  ✓ Färdig!")
    
    print("\n" + "=" * 70)
    print("✓ Alla lagar har bearbetats!")
    print("=" * 70)

if __name__ == "__main__":
    process_all_laws()
