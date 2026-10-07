#!/usr/bin/env python3
"""Wrap a bare chapter extract (starts at '12 kap. Hyra', no header, no table of
contents, no transitional text) so build_laws_from_docx.py can parse it.
  python3 normalize_chapter_extract_docx.py IN.docx OUT.docx "SFS nr" "Ändrad"
Adds the header paragraph, 'Innehåll:' and the TOC-end paragraph in front and
makes the chapter line bold. Body paragraphs are left untouched."""
import sys
from docx import Document

src, dst, sfs, amended = sys.argv[1:5]
d = Document(src)
first = d.paragraphs[0]
for r in first.runs:
    r.bold = True
for text in [f'SFS nr: {sfs}\nÄndrad: {amended}', 'Innehåll:', 'Övergångsbestämmelser']:
    first.insert_paragraph_before(text)
d.save(dst)
