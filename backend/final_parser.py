#!/usr/bin/env python3
"""
Final robust parser for Swedish legal texts
Sequential parsing approach to avoid regex complexity
"""

import re
from typing import Dict, List, Any, Optional

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

def is_version_marker(text: str) -> bool:
    """Check if text is a version/amendment marker"""
    markers = [
        r'/Upphör att gälla',
        r'/Träder i kraft',
        r'/Kapitelrubriken',
        r'/Rubriken',
        r'Lag \(\d{4}:\d+\)',
    ]
    for marker in markers:
        if re.search(marker, text):
            return True
    return False

def parse_swedish_law_final(text: str, law_info: Dict[str, str]) -> Dict[str, Any]:
    """
    Final robust parser using sequential token-based approach
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
    
    # Remove everything before first chapter or section
    first_content = re.search(r'(\d+\s+kap\.|^\d+\s+§)', text, re.MULTILINE)
    if first_content:
        text = text[first_content.start():]
    
    # Check if law has chapters
    has_chapters = bool(re.search(r'\d+\s+kap\.', text))
    
    if not has_chapters:
        # Law without chapters (like LAS)
        return parse_without_chapters_final(text, law_info)
    
    # Tokenize: split on chapter and section markers while keeping them
    tokens = re.split(r'(\d+\s+kap\.|\d+(?:\s+[a-z])?\s+§)', text)
    
    chapters_dict = {}  # Use dict to avoid duplicates: {chapter_num: chapter_data}
    current_chapter_num = None
    current_chapter_title = None
    current_section_num = None
    current_section_text = []
    
    i = 0
    while i < len(tokens):
        token = tokens[i].strip()
        
        if not token:
            i += 1
            continue
        
        # Check if it's a chapter marker
        chapter_match = re.match(r'^(\d+)\s+kap\.$', token)
        if chapter_match:
            # Save previous section if exists
            if current_chapter_num and current_section_num and current_section_text:
                text_content = ' '.join(current_section_text)
                if not is_version_marker(text_content):
                    text_content = re.sub(r'/[^/]*/', '', text_content)
                    text_content = clean_text(text_content)
                    if text_content and len(text_content) > 10:
                        if current_chapter_num not in chapters_dict:
                            chapters_dict[current_chapter_num] = {
                                "id": f"kap-{current_chapter_num}",
                                "number": current_chapter_num,
                                "title": current_chapter_title or f"Kapitel {current_chapter_num}",
                                "sections": []
                            }
                        
                        # Check if section already exists
                        section_ids = {s['number'] for s in chapters_dict[current_chapter_num]['sections']}
                        if current_section_num not in section_ids:
                            chapters_dict[current_chapter_num]['sections'].append({
                                "id": f"kap-{current_chapter_num}-§-{current_section_num}",
                                "number": current_section_num,
                                "text": text_content,
                                "references": extract_references(text_content)
                            })
            
            # Start new chapter
            new_chapter_num = int(chapter_match.group(1))
            current_chapter_num = new_chapter_num
            current_section_num = None
            current_section_text = []
            
            # Get chapter title from next token
            if i + 1 < len(tokens):
                next_token = tokens[i + 1].strip()
                # If next token is not a section or chapter marker, it's the title
                if not re.match(r'^\d+\s+kap\.$|^\d+(?:\s+[a-z])?\s+§$', next_token):
                    # Extract title (up to first sentence or 100 chars)
                    title_text = next_token.split('\n')[0].strip()
                    title_text = re.sub(r'/[^/]*/', '', title_text).strip()
                    if title_text and len(title_text) > 3 and not is_version_marker(title_text):
                        current_chapter_title = title_text[:100]
                    else:
                        current_chapter_title = f"Kapitel {new_chapter_num}"
                    i += 1  # Skip the title token
                else:
                    current_chapter_title = f"Kapitel {new_chapter_num}"
            else:
                current_chapter_title = f"Kapitel {new_chapter_num}"
            
            i += 1
            continue
        
        # Check if it's a section marker
        section_match = re.match(r'^(\d+(?:\s+[a-z])?)\s+§$', token)
        if section_match:
            # Save previous section
            if current_chapter_num and current_section_num and current_section_text:
                text_content = ' '.join(current_section_text)
                if not is_version_marker(text_content):
                    text_content = re.sub(r'/[^/]*/', '', text_content)
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
            section_num_str = section_match.group(1).strip()
            try:
                current_section_num = int(section_num_str.split()[0])
            except:
                current_section_num = None
            
            current_section_text = []
            i += 1
            continue
        
        # Otherwise it's content - add to current section
        if current_section_num is not None:
            current_section_text.append(token)
        
        i += 1
    
    # Save last section
    if current_chapter_num and current_section_num and current_section_text:
        text_content = ' '.join(current_section_text)
        if not is_version_marker(text_content):
            text_content = re.sub(r'/[^/]*/', '', text_content)
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
    
    # Convert dict to sorted list
    law_data['chapters'] = sorted(chapters_dict.values(), key=lambda x: x['number'])
    
    # Sort sections within each chapter
    for chapter in law_data['chapters']:
        chapter['sections'].sort(key=lambda x: x['number'])
    
    return law_data

def parse_without_chapters_final(text: str, law_info: Dict[str, str]) -> Dict[str, Any]:
    """Parse laws without chapters"""
    law_data = {
        "id": law_info['id'],
        "title": law_info['title'],
        "sfsNumber": law_info['sfsNumber'],
        "department": law_info['department'],
        "issued": law_info['issued'],
        "lastAmended": law_info['lastAmended'],
        "chapters": [{
            "id": "kap-1",
            "number": 1,
            "title": law_info['title'],
            "sections": []
        }]
    }
    
    tokens = re.split(r'(\d+(?:\s+[a-z])?\s+§)', text)
    
    sections_dict = {}
    current_section_num = None
    current_section_text = []
    
    i = 0
    while i < len(tokens):
        token = tokens[i].strip()
        
        if not token:
            i += 1
            continue
        
        section_match = re.match(r'^(\d+(?:\s+[a-z])?)\s+§$', token)
        if section_match:
            # Save previous
            if current_section_num and current_section_text:
                text_content = ' '.join(current_section_text)
                text_content = re.sub(r'/[^/]*/', '', text_content)
                text_content = clean_text(text_content)
                if text_content and len(text_content) > 10 and current_section_num not in sections_dict:
                    sections_dict[current_section_num] = {
                        "id": f"kap-1-§-{current_section_num}",
                        "number": current_section_num,
                        "text": text_content,
                        "references": extract_references(text_content)
                    }
            
            # Start new
            section_num_str = section_match.group(1).strip()
            try:
                current_section_num = int(section_num_str.split()[0])
            except:
                current_section_num = None
            current_section_text = []
        else:
            if current_section_num is not None:
                current_section_text.append(token)
        
        i += 1
    
    # Save last
    if current_section_num and current_section_text:
        text_content = ' '.join(current_section_text)
        text_content = re.sub(r'/[^/]*/', '', text_content)
        text_content = clean_text(text_content)
        if text_content and len(text_content) > 10 and current_section_num not in sections_dict:
            sections_dict[current_section_num] = {
                "id": f"kap-1-§-{current_section_num}",
                "number": current_section_num,
                "text": text_content,
                "references": extract_references(text_content)
            }
    
    law_data['chapters'][0]['sections'] = sorted(sections_dict.values(), key=lambda x: x['number'])
    
    return law_data
