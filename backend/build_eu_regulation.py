#!/usr/bin/env python3
"""
Build frontend/src/data/laws/<regulation>.ts from an EUR-Lex DOCX export of an EU
regulation (Swedish language version).

EUR-Lex DOCX files use only the 'Normal' style, so the structure is read from the text:
  KAPITEL I / title         -> Chapter (label "Kapitel I")
  AVSNITT 1 / title         -> groupHeading of the first article in the avsnitt
  Underavsnitt 1 / title    -> appended to groupHeading
  Artikel N / title         -> Section (label "Artikel N", heading = article title)
  "1.<nbsp><nbsp><nbsp>..." -> numbered point (own stycke)
  tables                    -> lettered / roman lists ("a)", "i)"), one line per row,
                               indented 3 spaces like the Swedish law parser does
Recitals (skäl, a table before KAPITEL I), annexes (BILAGA A-D), the closing formula and
the signature block are NOT included.
Inline footnote markers like "(13)" are removed (the footnotes themselves are not in the app).

Usage: build_eu_regulation.py --docx FILE --out FILE.ts --export NAME --id ID
"""
import argparse, json, re
from docx import Document
from docx.oxml.ns import qn

NBSP = '\xa0'
ROMAN = {'I': 1, 'V': 5, 'X': 10}


def roman(s):
    n = 0
    for i, c in enumerate(s):
        v = ROMAN[c]
        if i + 1 < len(s) and ROMAN[s[i + 1]] > v:
            n -= v
        else:
            n += v
    return n


def ptext(p):
    return ''.join(t.text or '' for t in p.iter(qn('w:t')))


def clean(t):
    t = t.replace(NBSP, ' ')
    t = re.sub(r'[ \t]+', ' ', t).strip()
    # EUR-Lex definitions: "1. term : definition" -> "1. term: definition"
    t = re.sub(r'^(\d+\.) (.{1,120}?) : ', r'\1 \2: ', t)
    # inline footnote markers after references to other EU acts: "direktiv 2009/65/EG (13) och"
    t = re.sub(r' \((\d{1,2})\)(?=[ ,.;:]|$)', '', t)
    return t


def sentence_case(t):
    t = t.strip().lower()
    return t[:1].upper() + t[1:]


def table_lines(tbl):
    lines = []
    for tr in tbl.findall(qn('w:tr')):
        tcs = tr.findall(qn('w:tc'))
        label = clean(' '.join(ptext(p) for p in tcs[0].findall(qn('w:p'))))
        paras = []
        for tc in tcs[1:]:
            paras += [clean(ptext(p)) for p in tc.findall(qn('w:p'))]
        paras = [p for p in paras if p]
        if not paras:
            continue
        lines.append('   ' + (label + ' ' if label else '') + paras[0])
        for extra in paras[1:]:
            lines.append('      ' + extra)
    return lines


def parse(path):
    d = Document(path)
    body = list(d.element.body.iterchildren())

    start = next(i for i, c in enumerate(body)
                 if c.tag.endswith('}p') and re.fullmatch(r'KAPITEL I', ptext(c).strip()))
    end = next(i for i, c in enumerate(body)
               if c.tag.endswith('}p') and re.fullmatch(r'BILAGA A', ptext(c).strip()))

    chapters = []
    cur_ch = None
    cur_sec = None
    blocks = []          # list of stycken (each a list of lines) for cur_sec
    pending_group = None
    avsnitt = None
    underavsnitt = None

    def flush():
        nonlocal cur_sec, blocks
        if cur_sec is not None:
            cur_sec['text'] = '\n\n'.join('\n'.join(b) for b in blocks)
            cur_ch['sections'].append(cur_sec)
        cur_sec, blocks = None, []

    i = start
    while i < end:
        el = body[i]
        if el.tag.endswith('}p'):
            t = clean(ptext(el))
            m = re.fullmatch(r'KAPITEL ([IVX]+)', t)
            if m:
                flush()
                n = roman(m.group(1))
                title = sentence_case(clean(ptext(body[i + 1])))
                cur_ch = {'id': f'kap-{n}', 'number': n, 'label': f'Kapitel {m.group(1)}',
                          'title': title, 'sections': []}
                chapters.append(cur_ch)
                pending_group = avsnitt = underavsnitt = None
                i += 2
                continue
            m = re.fullmatch(r'AVSNITT (\d+)', t)
            if m:
                flush()
                avsnitt = f'Avsnitt {m.group(1)} – {clean(ptext(body[i + 1]))}'
                underavsnitt = None
                pending_group = avsnitt
                i += 2
                continue
            m = re.fullmatch(r'Underavsnitt (\d+)', t)
            if m:
                flush()
                underavsnitt = f'Underavsnitt {m.group(1)} – {clean(ptext(body[i + 1]))}'
                pending_group = f'{avsnitt} · {underavsnitt}' if avsnitt else underavsnitt
                i += 2
                continue
            m = re.fullmatch(r'Artikel (\d+)', t)
            if m:
                flush()
                n = int(m.group(1))
                cur_sec = {'id': f'{cur_ch["id"]}-art-{n}', 'number': n, 'label': f'Artikel {n}',
                           'heading': clean(ptext(body[i + 1])), 'text': '', 'references': []}
                if pending_group:
                    cur_sec['groupHeading'] = pending_group
                    pending_group = None
                i += 2
                continue
            if t.startswith('Denna förordning är till alla delar bindande'):
                break   # closing formula, signatures and footnotes follow: not part of the text
            if cur_sec is not None and t:
                blocks.append([t])
        elif el.tag.endswith('}tbl') and cur_sec is not None:
            lines = table_lines(el)
            if blocks and lines:
                blocks[-1].extend(lines)   # list belongs to the stycke it follows
            elif lines:
                blocks.append(lines)
        i += 1
    flush()
    return chapters


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--docx', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--export', required=True)
    ap.add_argument('--id', required=True)
    a = ap.parse_args()

    chapters = parse(a.docx)
    law = {
        'id': a.id,
        'title': 'Europaparlamentets och rådets förordning (EU) 2015/848 av den 20 maj 2015 om insolvensförfaranden (omarbetning)',
        'sfsNumber': '2015/848',
        'citation': 'Förordning (EU) 2015/848',
        'department': 'Europaparlamentet och Europeiska unionens råd',
        'issued': '2015-05-20',
        'lastAmended': 'Ursprunglig lydelse (ej konsoliderad)',
        'chaptered': True,
        'chapters': chapters,
    }
    header = (
        '// Europaparlamentets och rådets förordning (EU) 2015/848 om insolvensförfaranden (omarbetning)\n'
        '// Generated by backend/build_eu_regulation.py from the EUR-Lex DOCX (Swedish language version).\n'
        '// Contains chapters I-VII (artikel 1-92). Skäl (recitals), bilagor A-D and the signature block are not included.\n'
        '// Do not edit by hand - fix the parser or the source DOCX and regenerate.\n\n'
        "import { LegalText } from '../legalTexts';\n\n"
    )
    body = json.dumps(law, ensure_ascii=False, indent=2)
    open(a.out, 'w', encoding='utf-8').write(f'{header}export const {a.export}: LegalText = {body};\n')
    n = sum(len(c['sections']) for c in chapters)
    print(f'{a.export}: chapters={len(chapters)} articles={n}')


if __name__ == '__main__':
    main()
