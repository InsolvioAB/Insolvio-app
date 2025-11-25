#!/usr/bin/env python3
"""
Robust parser for Swedish legal texts
Handles texts where chapters and sections are concatenated on same line
"""

import re
from typing import Dict, List, Any, Tuple

def clean_text(text: str) -> str:
    """Clean and normalize legal text"""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'_Lag \(\d{4}:\d+\)\._', '', text)
    return text

def extract_references(text: str) -> List[str]:
    """Extract legal cross-references from text"""
    refs = set()
    refs.update(re.findall(r'\d+\s*kap\.\s*\d+(?:\s*,\s*\d+)*(?:\s+och\s+\d+)?\s*§{1,2}', text))
    refs.update(re.findall(r'\d+(?:-\d+)?\s*§{1,2}(?!\w)', text))
    return sorted(list(refs))[:10]

def parse_swedish_law(text: str, law_info: Dict[str, str]) -> Dict[str, Any]:
    """
    Parse Swedish legal text with robust handling of various formats
    """
    
    law_data = {
        "id": law_info['id'],
        "title": law_info['title'],
        "sfsNumber": law_info['sfsNumber'],
        "department": law_info['department'],
        "issued": law_info['issued'],
        "lastAmended": law_info['lastAmended'],
        "chapters": []
    }
    
    # Remove header (everything before first chapter or section)
    first_content = re.search(r'(\d+\s*kap\.|^\d+\s*§)', text, re.IGNORECASE | re.MULTILINE)
    if first_content:
        text = text[first_content.start():]
    
    # Check if this law has chapters
    has_chapters = bool(re.search(r'\d+\s*kap\.', text, re.IGNORECASE))
    
    if not has_chapters:
        # Law without chapters (like LAS) - just sections
        return parse_without_chapters(text, law_info)
    
    # Split into chapter-section units using lookahead
    # This regex finds "X kap." and captures everything until next "Y kap." or end
    # Using lookahead to not consume the next chapter marker
    chapter_pattern = r'(\d+)\s+kap\..*?(?=\d+\s+kap\.|$)'
    chapter_matches = list(re.finditer(chapter_pattern, text, re.DOTALL | re.IGNORECASE))
    
    for chapter_match in chapter_matches:
        chapter_num = int(chapter_match.group(1))
        chapter_content = chapter_match.group(0)
        
        # Extract chapter title (text between "X kap." and first "Y §")
        title_match = re.match(r'\d+\s*kap\.\s*(.*?)(?=\d+\s*§|$)', chapter_content, re.DOTALL | re.IGNORECASE)
        chapter_title = "Kapitel " + str(chapter_num)
        if title_match:
            title_text = title_match.group(1).strip()
            # Remove version markers
            title_text = re.sub(r'/[^/]+/', '', title_text).strip()
            if title_text and len(title_text) > 3 and not title_text.startswith('§'):
                chapter_title = title_text[:100]
        
        # Parse sections within this chapter
        sections = parse_sections_in_chapter(chapter_content, chapter_num)
        
        if sections:
            chapter = {
                "id": f"kap-{chapter_num}",
                "number": chapter_num,
                "title": clean_text(chapter_title),
                "sections": sections
            }
            law_data['chapters'].append(chapter)
    
    # Sort chapters by number
    law_data['chapters'].sort(key=lambda x: x['number'])
    
    return law_data

def parse_sections_in_chapter(chapter_text: str, chapter_num: int) -> List[Dict[str, Any]]:
    """
    Parse all sections within a chapter text
    """
    sections = []
    
    # Pattern to find section markers: "1 §" or "2 a §"
    # Use lookahead to capture text until next section
    section_pattern = r'(\d+(?:\s+[a-z])?)\s*§\s*(.*?)(?=\d+(?:\s+[a-z])?\s*§|$)'
    section_matches = list(re.finditer(section_pattern, chapter_text, re.DOTALL))
    
    seen_sections = set()
    
    for section_match in section_matches:
        section_num_str = section_match.group(1).strip()
        section_text = section_match.group(2).strip()
        
        # Parse section number
        try:
            section_num = int(section_num_str.split()[0])
        except:
            continue
        
        # Skip if we already have this section (avoid duplicates from version markers)
        if section_num in seen_sections:
            continue
        
        # Clean the text - remove version markers
        section_text = re.sub(r'/Upphör att gälla[^/]*/', '', section_text)
        section_text = re.sub(r'/Träder i kraft[^/]*/', '', section_text)
        section_text = re.sub(r'/[^/]+/', '', section_text)
        section_text = clean_text(section_text)
        
        # Only add if there's actual content
        if section_text and len(section_text) > 10:
            sections.append({
                "id": f"kap-{chapter_num}-§-{section_num}",
                "number": section_num,
                "text": section_text,
                "references": extract_references(section_text)
            })
            seen_sections.add(section_num)
    
    # Sort sections by number
    sections.sort(key=lambda x: x['number'])
    
    return sections

def parse_without_chapters(text: str, law_info: Dict[str, str]) -> Dict[str, Any]:
    """
    Parse laws without chapter structure (like LAS)
    """
    law_data = {
        "id": law_info['id'],
        "title": law_info['title'],
        "sfsNumber": law_info['sfsNumber'],
        "department": law_info['department'],
        "issued": law_info['issued'],
        "lastAmended": law_info['lastAmended'],
        "chapters": []
    }
    
    # Create a single chapter
    main_chapter = {
        "id": "kap-1",
        "number": 1,
        "title": law_info['title'],
        "sections": []
    }
    
    # Parse sections
    section_pattern = r'(\d+(?:\s+[a-z])?)\s*§\s*(.*?)(?=\d+(?:\s+[a-z])?\s*§|$)'
    section_matches = list(re.finditer(section_pattern, text, re.DOTALL))
    
    seen_sections = set()
    
    for section_match in section_matches:
        section_num_str = section_match.group(1).strip()
        section_text = section_match.group(2).strip()
        
        try:
            section_num = int(section_num_str.split()[0])
        except:
            continue
        
        if section_num in seen_sections:
            continue
        
        section_text = re.sub(r'/[^/]+/', '', section_text)
        section_text = clean_text(section_text)
        
        if section_text and len(section_text) > 10:
            main_chapter['sections'].append({
                "id": f"kap-1-§-{section_num}",
                "number": section_num,
                "text": section_text,
                "references": extract_references(section_text)
            })
            seen_sections.add(section_num)
    
    main_chapter['sections'].sort(key=lambda x: x['number'])
    
    if main_chapter['sections']:
        law_data['chapters'].append(main_chapter)
    
    return law_data
