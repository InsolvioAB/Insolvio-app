#!/usr/bin/env python3
"""
Advanced parser for Swedish legal texts
Handles cases where chapters and sections are on the same line
"""

import re
from typing import Dict, List, Any

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

def parse_law_advanced(text: str, law_info: Dict[str, str]) -> Dict[str, Any]:
    """
    Advanced parser that handles various formatting issues
    Including: chapters and sections on same line
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
    
    # Remove header (everything before first chapter)
    first_chapter = re.search(r'\d+\s*kap\.', text, re.IGNORECASE)
    if first_chapter:
        text = text[first_chapter.start():]
    
    # First, split text into tokens (chapters and sections)
    # This regex captures both the delimiter and what's between
    pattern = r'(\d+\s*kap\.|\d+(?:\s+[a-z])?\s*§)'
    tokens = re.split(pattern, text, flags=re.IGNORECASE)
    
    current_chapter = None
    current_section_number = None
    current_section_text = []
    
    i = 0
    while i < len(tokens):
        token = tokens[i].strip()
        
        if not token:
            i += 1
            continue
        
        # Check if it's a chapter marker
        chapter_match = re.match(r'^(\d+)\s*kap\.$', token, re.IGNORECASE)
        if chapter_match:
            # Save previous section
            if current_section_number is not None and current_chapter:
                section_text = clean_text(' '.join(current_section_text))
                if section_text:
                    current_chapter['sections'].append({
                        "id": f"kap-{current_chapter['number']}-§-{current_section_number}",
                        "number": current_section_number,
                        "text": section_text,
                        "references": extract_references(section_text)
                    })
            
            # Save previous chapter
            if current_chapter and current_chapter['sections']:
                law_data['chapters'].append(current_chapter)
            
            # Create new chapter
            chapter_num = int(chapter_match.group(1))
            
            # Get chapter title from next token (if it's not a section marker)
            chapter_title = f"Kapitel {chapter_num}"
            if i + 1 < len(tokens):
                next_token = tokens[i + 1].strip()
                # If next token is not a section or chapter, it's the title
                if not re.match(r'^\d+\s*kap\.$|^\d+(?:\s+[a-z])?\s*§$', next_token, re.IGNORECASE):
                    # Extract title (everything up to first section marker)
                    title_match = re.split(r'(\d+(?:\s+[a-z])?\s*§)', next_token, maxsplit=1, flags=re.IGNORECASE)
                    if title_match:
                        chapter_title = clean_text(title_match[0])
                        # If there was a section on same line, process it
                        if len(title_match) > 1:
                            # Put back the section marker and text
                            tokens[i + 1] = ''.join(title_match[1:])
                        else:
                            i += 1  # Skip title token
            
            current_chapter = {
                "id": f"kap-{chapter_num}",
                "number": chapter_num,
                "title": chapter_title,
                "sections": []
            }
            current_section_number = None
            current_section_text = []
            i += 1
            continue
        
        # Check if it's a section marker
        section_match = re.match(r'^(\d+(?:\s+[a-z])?)\s*§$', token)
        if section_match:
            # Save previous section
            if current_section_number is not None and current_chapter:
                section_text = clean_text(' '.join(current_section_text))
                if section_text:
                    current_chapter['sections'].append({
                        "id": f"kap-{current_chapter['number']}-§-{current_section_number}",
                        "number": current_section_number,
                        "text": section_text,
                        "references": extract_references(section_text)
                    })
            
            # Start new section
            section_num_str = section_match.group(1).strip()
            try:
                current_section_number = int(section_num_str.split()[0])
            except:
                current_section_number = len(current_chapter['sections']) + 1 if current_chapter else 1
            
            current_section_text = []
            i += 1
            continue
        
        # Otherwise it's content text
        if current_section_number is not None:
            current_section_text.append(token)
        
        i += 1
    
    # Save last section
    if current_section_number is not None and current_chapter:
        section_text = clean_text(' '.join(current_section_text))
        if section_text:
            current_chapter['sections'].append({
                "id": f"kap-{current_chapter['number']}-§-{current_section_number}",
                "number": current_section_number,
                "text": section_text,
                "references": extract_references(section_text)
            })
    
    # Save last chapter
    if current_chapter and current_chapter['sections']:
        law_data['chapters'].append(current_chapter)
    
    # If no chapters were found, try parsing as a law without chapters
    if not law_data['chapters']:
        return parse_law_without_chapters(text, law_info)
    
    return law_data

def parse_law_without_chapters(text: str, law_info: Dict[str, str]) -> Dict[str, Any]:
    """
    Parse laws that don't have chapter structure (like LAS)
    Only sections: 1 §, 2 §, etc.
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
    
    # Create a single chapter to hold all sections
    main_chapter = {
        "id": "kap-1",
        "number": 1,
        "title": law_info['title'],
        "sections": []
    }
    
    # Split by section markers
    pattern = r'(\d+(?:\s+[a-z])?\s*§)'
    tokens = re.split(pattern, text)
    
    current_section_number = None
    current_section_text = []
    
    i = 0
    while i < len(tokens):
        token = tokens[i].strip()
        
        if not token:
            i += 1
            continue
        
        # Check if it's a section marker
        section_match = re.match(r'^(\d+(?:\s+[a-z])?)\s*§$', token)
        if section_match:
            # Save previous section
            if current_section_number is not None:
                section_text = clean_text(' '.join(current_section_text))
                if section_text:
                    main_chapter['sections'].append({
                        "id": f"kap-1-§-{current_section_number}",
                        "number": current_section_number,
                        "text": section_text,
                        "references": extract_references(section_text)
                    })
            
            # Start new section
            section_num_str = section_match.group(1).strip()
            try:
                current_section_number = int(section_num_str.split()[0])
            except:
                current_section_number = len(main_chapter['sections']) + 1
            
            current_section_text = []
            i += 1
            continue
        
        # Otherwise it's content text
        if current_section_number is not None:
            current_section_text.append(token)
        
        i += 1
    
    # Save last section
    if current_section_number is not None:
        section_text = clean_text(' '.join(current_section_text))
        if section_text:
            main_chapter['sections'].append({
                "id": f"kap-1-§-{current_section_number}",
                "number": current_section_number,
                "text": section_text,
                "references": extract_references(section_text)
            })
    
    # Add the main chapter if it has sections
    if main_chapter['sections']:
        law_data['chapters'].append(main_chapter)
    
    return law_data
