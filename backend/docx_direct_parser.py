#!/usr/bin/env python3
"""
Direct DOCX parser using python-docx for better structure
"""

import re
from docx import Document
from typing import Dict, List, Any

def clean_text(text: str) -> str:
    """Clean and normalize legal text"""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'_Lag \(\d{4}:\d+\)\._', '', text)
    text = re.sub(r'/[^/]*/', '', text)
    return text

def extract_references(text: str) -> List[str]:
    """Extract legal cross-references from text"""
    refs = set()
    refs.update(re.findall(r'\d+\s*kap\.\s*\d+(?:\s*,\s*\d+)*(?:\s+och\s+\d+)?\s*§{1,2}', text))
    refs.update(re.findall(r'\d+(?:-\d+)?\s*§{1,2}(?!\w)', text))
    return sorted(list(refs))[:10]

def is_chapter_heading(text: str) -> tuple:
    """Check if text is a chapter heading. Returns (is_chapter, chapter_num, title)"""
    match = re.match(r'^(\d+)\s+kap\.\s*(.*)$', text.strip())
    if match:
        chapter_num = int(match.group(1))
        title = match.group(2).strip()
        return (True, chapter_num, title)
    return (False, None, None)

def is_section_marker(text: str) -> tuple:
    """Check if text is a section marker. Returns (is_section, section_num)"""
    match = re.match(r'^(\d+(?:\s+[a-z])?)\s+§\s*(.*)$', text.strip())
    if match:
        section_num_str = match.group(1).strip()
        section_text = match.group(2).strip()
        try:
            section_num = int(section_num_str.split()[0])
            return (True, section_num, section_text)
        except:
            pass
    return (False, None, None)

def parse_docx_directly(docx_path: str, law_info: Dict[str, str]) -> Dict[str, Any]:
    """
    Parse DOCX file directly using paragraph structure
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
    
    doc = Document(docx_path)
    
    chapters_dict = {}
    current_chapter_num = None
    current_chapter_title = None
    current_section_num = None
    current_section_text = []
    
    in_actual_content = False  # Skip table of contents
    first_section_found = False
    
    for para in doc.paragraphs:
        text = para.text.strip()
        
        if not text:
            continue
        
        # Detect when we've reached actual content (after TOC)
        # Look for pattern like "1 kap. Title \n 1 § Text..."
        if not first_section_found:
            is_sec, sec_num, sec_text = is_section_marker(text)
            if is_sec and sec_text and len(sec_text) > 20:  # Real section with content
                first_section_found = True
                in_actual_content = True
        
        # If not yet in actual content and this looks like TOC, skip
        if not in_actual_content:
            continue
        
        # Check if this is a chapter heading
        is_chap, chap_num, chap_title = is_chapter_heading(text)
        if is_chap:
            # Save previous section
            if current_chapter_num and current_section_num and current_section_text:
                text_content = ' '.join(current_section_text)
                text_content = clean_text(text_content)
                if text_content and len(text_content) > 10:
                    if current_chapter_num not in chapters_dict:
                        chapters_dict[current_chapter_num] = {
                            "id": f"kap-{current_chapter_num}",
                            "number": current_chapter_num,
                            "title": current_chapter_title or f"Kapitel {current_chapter_num}",
                            "sections": []
                        }
                    
                    section_ids = {s['number'] for s in chapters_dict[current_chapter_num]['sections']}
                    if current_section_num not in section_ids:
                        chapters_dict[current_chapter_num]['sections'].append({
                            "id": f"kap-{current_chapter_num}-§-{current_section_num}",
                            "number": current_section_num,
                            "text": text_content,
                            "references": extract_references(text_content)
                        })
            
            # Start new chapter
            current_chapter_num = chap_num
            current_chapter_title = clean_text(chap_title) if chap_title else f"Kapitel {chap_num}"
            current_section_num = None
            current_section_text = []
            continue
        
        # Check if this is a section marker
        is_sec, sec_num, sec_text = is_section_marker(text)
        if is_sec:
            # Save previous section
            if current_chapter_num and current_section_num and current_section_text:
                text_content = ' '.join(current_section_text)
                text_content = clean_text(text_content)
                if text_content and len(text_content) > 10:
                    if current_chapter_num not in chapters_dict:
                        chapters_dict[current_chapter_num] = {
                            "id": f"kap-{current_chapter_num}",
                            "number": current_chapter_num,
                            "title": current_chapter_title or f"Kapitel {current_chapter_num}",
                            "sections": []
                        }
                    
                    section_ids = {s['number'] for s in chapters_dict[current_chapter_num]['sections']}
                    if current_section_num not in section_ids:
                        chapters_dict[current_chapter_num]['sections'].append({
                            "id": f"kap-{current_chapter_num}-§-{current_section_num}",
                            "number": current_section_num,
                            "text": text_content,
                            "references": extract_references(text_content)
                        })
            
            # Start new section
            current_section_num = sec_num
            current_section_text = [sec_text] if sec_text else []
            continue
        
        # Otherwise, add to current section
        if current_section_num is not None and current_chapter_num is not None:
            current_section_text.append(text)
    
    # Save last section
    if current_chapter_num and current_section_num and current_section_text:
        text_content = ' '.join(current_section_text)
        text_content = clean_text(text_content)
        if text_content and len(text_content) > 10:
            if current_chapter_num not in chapters_dict:
                chapters_dict[current_chapter_num] = {
                    "id": f"kap-{current_chapter_num}",
                    "number": current_chapter_num,
                    "title": current_chapter_title or f"Kapitel {current_chapter_num}",
                    "sections": []
                }
            
            section_ids = {s['number'] for s in chapters_dict[current_chapter_num]['sections']}
            if current_section_num not in section_ids:
                chapters_dict[current_chapter_num]['sections'].append({
                    "id": f"kap-{current_chapter_num}-§-{current_section_num}",
                    "number": current_section_num,
                    "text": text_content,
                    "references": extract_references(text_content)
                })
    
    # Convert to sorted list
    law_data['chapters'] = sorted(chapters_dict.values(), key=lambda x: x['number'])
    
    # Sort sections within each chapter
    for chapter in law_data['chapters']:
        chapter['sections'].sort(key=lambda x: x['number'])
    
    return law_data
