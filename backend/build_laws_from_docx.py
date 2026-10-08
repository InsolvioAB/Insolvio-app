#!/usr/bin/env python3
"""
Build frontend/src/data/laws/<law>.ts from the official Riksdagen/Regeringskansliet
DOCX exports ("Fulltext"), replacing the older parsers in backend/.

Fixes the data bugs found in Oct 2026:
  * sub-headings were glued onto the END of the previous section's text
    -> now stored in Section.heading of the section they introduce
  * lettered sections (1 a §, 1 b §) all had number 1
    -> now Section.suffix = 'a' and the label is built from number + suffix
  * övergångsbestämmelser were dropped -> now LegalText.transitional
  * laws without chapters were shown as "Kapitel 1" -> LegalText.chaptered=False
  * stycke breaks and numbered lists were collapsed into one blob
    -> kept as \n\n between stycken and \n between list items
  * two versions of a section (Upphör att gälla / Träder i kraft) were both kept
    -> only the version in force on --today is kept

Usage:
  python3 build_laws_from_docx.py --docx DOCX --ts OLD_TS --out NEW_TS [--today YYYY-MM-DD] [--only-chapter N]
"""
import argparse, datetime, json, re, sys
from docx import Document

NBSP = '\xa0'
SEC_RE = re.compile(r'^(\d+)\s*([a-z]?)\s*§§?\*?[ \t' + NBSP + r']*(.*)$', re.S)
CHAP_RE = re.compile(r'^(\d+)\s*([a-z]?)\s*kap\.\s*(.*)$', re.S)
MARK_RE = re.compile(r'/(Rubriken |Kapitlet |Kapitelrubriken )?(träder i kraft I|upphör att gälla U):(\d{4}-\d\d-\d\d)[^/]*(?:/|$)' + NBSP + '?', re.I)
SFS_RE = re.compile(r'^(\d{4}:\d+)\s*(?:\n|$)(.*)$', re.S)


def is_bold_only(p):
    runs = [r for r in p.runs if r.text.strip()]
    return bool(runs) and all(r.bold for r in runs)


_HYPH_CONJ = {'och', 'eller', 'respektive', 'samt', 'än', 'men', 'alternativt', 'resp'}
_HYPH_RE = re.compile(r'([A-Za-zåäöÅÄÖ]{2,})- ([a-zåäö]{2,})\b')


def fix_linebreak_hyphens(line):
    """Join words split by a typographic line-break hyphen ('bestäm- melserna'),
    but keep 'kost- och'-style suspended hyphens and 'IMI- förordningen'."""
    def sub(m):
        a, b = m.group(1), m.group(2)
        if b in _HYPH_CONJ:
            return m.group(0)
        if a.isupper() or a == 'icke':
            return a + '-' + b
        return a + b
    return _HYPH_RE.sub(sub, line)


def norm_block(text):
    """Normalise one docx paragraph into display text.
    Lines starting with NBSP indentation are list items; keep them on their own
    line, indented 3 spaces per level."""
    out = []
    for line in text.split('\n'):
        m = re.match('^(' + NBSP + '+)', line)
        level = 0
        if m:
            level = max(1, len(m.group(1)) // 3)
            line = line[m.end():]
        line = line.replace(NBSP, ' ')
        line = re.sub(r'[ \t]+', ' ', line).strip()
        line = fix_linebreak_hyphens(line)
        if not line:
            continue
        out.append(('   ' * level) + line if level else line)
    return '\n'.join(out)


def in_force(kind, date, today):
    """kind: 'träder i kraft I' or 'upphör att gälla U'."""
    if kind.lower().startswith('träder'):
        return date <= today
    return date > today  # upphör att gälla: still in force until that date


def extract_refs(text):
    refs = []
    for m in re.finditer(r'(?:\d+\s*[a-z]?\s*kap\.\s*)?\d+(?:\s*[a-z])?(?:\s*(?:,|och|-)\s*\d+(?:\s*[a-z])?)*\s*§§?', text):
        r = re.sub(r'\s+', ' ', m.group(0)).strip()
        if r not in refs:
            refs.append(r)
    return refs[:12]


def parse(docx_path, today, only_chapter=None):
    d = Document(docx_path)
    ps = list(d.paragraphs)
    # Saved web pages from riksdagen.se end with site footer text ("All offentlig
    # makt i Sverige utgår från folket ...", "Kontakt", "Växel" ...). It is not
    # part of the law, so cut everything from there on.
    for i, p in enumerate(ps):
        if p.text.strip().startswith('All offentlig makt i Sverige'):
            ps = ps[:i]
            break
    meta = {}
    hdr = next((p for p in ps[:12] if p.text.startswith('SFS nr:')), ps[0])
    for line in hdr.text.split('\n'):
        if ':' in line:
            k, v = line.split(':', 1)
            meta[k.strip()] = v.strip().replace(NBSP, ' ')
    # body starts after the table of contents, whose last entry is the
    # paragraph 'Övergångsbestämmelser'; the real transitional section is the
    # LAST paragraph with that text.
    ov = [i for i, p in enumerate(ps) if p.text.strip() == 'Övergångsbestämmelser']
    if not ov:
        toc_end, trans_start = next(i for i, p in enumerate(ps) if p.text.strip() == 'Innehåll:') + 1, len(ps)
        # no TOC marker at all: body starts at first bold heading/section
    elif len(ov) == 1:
        toc_end, trans_start = ov[0], len(ps)  # TOC only, no transitional text
    else:
        toc_end, trans_start = ov[0], ov[-1]

    chapters = []
    chaptered = False
    cur_ch = None
    cur_sec = None
    pending_heading = None
    pending_chapter_heading = None
    active = True  # current section version in force?
    log = []

    def new_chapter(num, suffix, title):
        nonlocal cur_ch
        cur_ch = {'id': f'kap-{num}{suffix}', 'number': num, 'title': title, 'sections': []}
        if suffix:
            cur_ch['numberSuffix'] = suffix
        chapters.append(cur_ch)

    dropped = []
    deferred_heading = None
    marker_pending = None      # ('Rubriken'|'Kapitlet', in_force) from a marker-only paragraph
    chapter_active = True
    pending_group = None

    def push_heading(h):
        nonlocal pending_heading, pending_group
        if pending_heading:
            pending_group = pending_heading
        pending_heading = h

    items = [(q, q.text.strip()) for q in ps[toc_end + 1:trans_start] if q.text.strip()]
    for idx, (p, t) in enumerate(items):
        nxt = items[idx + 1][0] if idx + 1 < len(items) else None
        if deferred_heading:
            push_heading(deferred_heading)
            deferred_heading = None
        # a bold heading that sits on the last LINE of a normal paragraph
        if not is_bold_only(p) and '\n' in p.text:
            acc = ''
            for r in reversed(p.runs):
                if (r.bold and r.text.strip()) or not r.text.strip():
                    acc = r.text + acc
                else:
                    break
            acc_s = acc.strip()
            body_t = p.text.rstrip()
            if acc_s and len(acc_s) <= 120 and not acc_s.endswith(('.', ':', ';', ',')) and body_t.endswith(acc_s):
                before = body_t[:-len(acc_s)]
                if before.endswith('\n') and before.strip():
                    t = before.strip()
                    deferred_heading = acc_s
                    log.append(f'trailing bold heading split: {acc_s[:70]}')
        if deferred_heading is None and not is_bold_only(p) and '\n' in t and nxt is not None:
            head, _, last_line = t.rpartition('\n')
            ll = last_line.strip()
            nxt_t = nxt.text.strip()
            nxt_starts = is_bold_only(nxt) or (SEC_RE.match(nxt_t) and ((nxt.runs and nxt.runs[0].bold) or re.match(r'^\d+\s*[a-z]?\s*§§?\*?' + NBSP, nxt_t)))
            if (ll and not last_line.startswith(NBSP) and len(ll) <= 120 and ll[0].isupper()
                    and not ll.endswith(('.', ':', ';', ',', ')', '?', '!')) and head.rstrip().endswith(('.', ')', '"'))
                    and nxt_starts):
                t = head.strip()
                deferred_heading = ll
                log.append(f'trailing plain heading split: {ll[:70]}')
        # marker-only paragraph: applies to the NEXT heading / chapter ------
        mm = MARK_RE.fullmatch(t) if t.startswith('/') else None
        if mm:
            marker_pending = (mm.group(1).strip().capitalize() if mm.group(1) else '', in_force(mm.group(2), mm.group(3), today), t)
            continue
        # headings ---------------------------------------------------------
        if (is_bold_only(p) or (marker_pending and marker_pending[0] in ('Rubriken', 'Kapitelrubriken'))) and not SEC_RE.match(t):
            applies = marker_pending
            marker_pending = None
            cm = CHAP_RE.match(t)
            if cm:
                if applies and applies[0] == 'Kapitelrubriken' and not applies[1]:
                    log.append(f'old chapter title skipped: {t[:60]}')
                    dropped.append(t)
                    continue
                if applies and applies[0] == 'Kapitlet' and not applies[1]:
                    chapter_active = False
                    cur_sec = None
                    log.append(f'chapter version dropped: {t[:60]}')
                    dropped.append(t)
                    continue
                chapter_active = True
                chaptered = True
                new_chapter(int(cm.group(1)), cm.group(2), cm.group(3).strip())
                cur_sec = None
                pending_heading = None
                pending_group = None
                continue
            if not chapter_active:
                dropped.append(t)
                continue
            if applies and not applies[1]:
                dropped.append(t)
                continue  # old version of a heading
            push_heading(t)
            continue
        if marker_pending is not None and not (is_bold_only(p)):
            marker_pending = None
        if not chapter_active:
            dropped.append(t)
            continue
        # sections ---------------------------------------------------------
        sm = SEC_RE.match(t)
        if sm and ((p.runs and p.runs[0].bold) or re.match(r'^\d+\s*[a-z]?\s*§§?\*?' + NBSP, t)):
            num, suffix, rest = int(sm.group(1)), sm.group(2), sm.group(3)
            m = MARK_RE.search(rest)
            active = True
            if m:
                active = in_force(m.group(2), m.group(3), today)
                rest = MARK_RE.sub('', rest, count=1)
                if not active and m.group(2).lower().startswith('träder'):
                    log.append(f'FUTURE version skipped (not yet in force): {num}{suffix} § from {m.group(3)}')
                if not active:
                    log.append(f'version dropped: {num}{(" " + suffix) if suffix else ""} § {m.group(2)} {m.group(3)}')
            if not active:
                cur_sec = None
                dropped.append(t)
                continue
            if cur_ch is None:
                new_chapter(1, '', meta.get('title') or 'LAW')
            sec = {
                'id': f'{cur_ch["id"]}-§-{num}{suffix}',
                'number': num,
                'text': norm_block(rest),
                'references': [],
            }
            if suffix:
                sec['suffix'] = suffix
            if pending_heading:
                sec['heading'] = pending_heading
                if pending_group:
                    sec['groupHeading'] = pending_group
                pending_heading = None
                pending_group = None
            cur_ch['sections'].append(sec)
            cur_sec = sec
            continue
        # non-bold heading line directly before a bold heading / section ----
        if (not is_bold_only(p) and nxt is not None and len(t) <= 120
                and not t.endswith(('.', ':', ';', ',', ')')) and not t.startswith('/')
                and not SEC_RE.match(t) and not re.match(r'^(\d+\.|[a-z]\)|\s)', t)
                and (is_bold_only(nxt) or (SEC_RE.match(nxt.text.strip()) and ((nxt.runs and nxt.runs[0].bold) or re.match(r'^\d+\s*[a-z]?\s*§§?\*?' + NBSP, nxt.text.strip()))))):
            log.append(f'nonbold heading: {t[:80]}')
            push_heading(t)
            continue
        # continuation paragraph (further stycke) --------------------------
        if cur_sec is not None and active:
            m = MARK_RE.search(t)
            if m:
                log.append(f'stray marker inside {cur_sec["id"]}: {m.group(0)[:50]}')
                t = MARK_RE.sub('', t)
            blk = norm_block(t)
            if blk:
                cur_sec['text'] += '\n\n' + blk
        elif active and cur_ch is not None and len(t) <= 100 and not t.endswith(('.', ':', ';', ',')) and not t.startswith('/'):
            # non-bold group heading (e.g. 'Lån m.m. till närstående') before a bold sub-heading
            push_heading(t)
        elif active and not t.startswith('/'):
            log.append(f'orphan paragraph: {t[:70]}')
        elif not active:
            dropped.append(t)

    # references + only-chapter filter
    for ch in chapters:
        for s in ch['sections']:
            s['references'] = extract_refs(s['text'])
    if only_chapter is not None:
        chapters = [c for c in chapters if c['number'] == only_chapter]

    # transitional provisions ---------------------------------------------
    transitional = []
    cur = None
    for p in ps[trans_start + 1:]:
        t = p.text.strip()
        if not t:
            continue
        m = SFS_RE.match(t)
        if m:
            cur = {'sfs': m.group(1), 'text': norm_block(m.group(2))}
            transitional.append(cur)
        elif cur is not None:
            cur['text'] = (cur['text'] + '\n\n' if cur['text'] else '') + norm_block(t)
    for tr in transitional:
        tr['text'] = tr['text'].strip()

    for ch in chapters:
        for sec in ch['sections']:
            last = sec['text'].split('\n')[-1].strip()
            if len(last) <= 80 and last and last[0].isupper() and not last.endswith(('.', ':', ';', ')', '?', '!')) and '\n\n' in sec['text']:
                log.append(f'SUSPECT trailing heading in {sec["id"]}: {last}')
    parse.dropped = dropped
    return meta, chapters, chaptered, transitional, log


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--docx', required=True)
    ap.add_argument('--ts', required=True, help='existing TS file (id/title/export name are taken from it)')
    ap.add_argument('--out', required=True)
    ap.add_argument('--today', default=datetime.date.today().isoformat())
    ap.add_argument('--only-chapter', type=int)
    a = ap.parse_args()

    old = open(a.ts, encoding='utf-8').read()
    m = re.search(r'export const (\w+)(?::\s*LegalText)?\s*=\s*', old)
    export_name = m.group(1)
    old_json = json.loads(old[m.end():].rstrip().rstrip(';'))

    meta, chapters, chaptered, transitional, log = parse(a.docx, a.today, a.only_chapter)

    if not chaptered and chapters:
        chapters[0]['title'] = old_json['title']
    law = {
        'id': old_json['id'],
        'title': old_json['title'],
        'sfsNumber': meta.get('SFS nr', old_json['sfsNumber']),
        'department': meta.get('Departement/myndighet', old_json['department']),
        'issued': meta.get('Utfärdad', old_json['issued']),
        'lastAmended': ('(se utdrag, endast 12 kap.) ' if a.only_chapter else '') + meta.get('Ändrad', old_json['lastAmended']),
        'chaptered': chaptered,
        'chapters': chapters,
    }
    if transitional and not a.only_chapter:
        law['transitional'] = transitional
    body = json.dumps(law, ensure_ascii=False, indent=2)
    header = (f'// {old_json["title"]}\n'
              f'// Generated by backend/build_laws_from_docx.py from the official DOCX (Regeringskansliet fulltext).\n'
              f'// Versions in force on {a.today}. Do not edit by hand - fix the parser or the source DOCX and regenerate.\n'
              f'// Last amended: {law["lastAmended"]}\n\n'
              "import { LegalText } from '../legalTexts';\n\n")
    open(a.out, 'w', encoding='utf-8').write(f'{header}export const {export_name}: LegalText = {body};\n')

    json.dump(parse.dropped, open(a.out + '.dropped.json', 'w', encoding='utf-8'), ensure_ascii=False)
    nsec = sum(len(c['sections']) for c in chapters)
    print(f'{export_name}: chaptered={chaptered} chapters={len(chapters)} sections={nsec} transitional={len(transitional)}')
    for l in [x for x in log if 'SUSPECT' in x or 'orphan' in x or 'stray' in x or 'nonbold' in x or 'trailing bold' in x or 'trailing plain' in x or 'FUTURE' in x][:40]:
        print('   log:', l)


if __name__ == '__main__':
    main()
