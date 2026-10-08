// Strukturerad data för "jämför ändring"-vyn (EJU-87).
//
// Varje post kopplas till en NewsItem (via newsId) och innehåller den
// faktiska gamla och nya lydelsen per ändrad/ny/upphävd paragraf, så att
// användaren kan se exakt vad som ändrades -- inte bara en sammanfattning.
//
// Källa för Konkurslag SFS 2025:796 och Aktiebolagslag SFS 2025:804:
// Prop. 2024/25:135 "Ett nytt konkursförfarande" -- samma lagstiftningsärende
// ändrar båda lagarna (avsnitt 2.1 för konkurslagen, avsnitt 2.9 för
// aktiebolagslagen; avsnitt 11.5.3 för motiveringen till upphävandet av
// 2 kap. 2 a § konkurslagen). Verifierad mot lagtexten i
// src/data/laws/konkurslag.ts respektive aktiebolagslag.ts.
//
// OBS: Aktiebolagslag-posten ersätter en tidigare felaktig placeholder som
// pekade på SFS 2024:862 -- det SFS-numret hör till en helt annan lag
// (betaltjänstlagen) och fanns inte med i aktiebolagslagens egen
// ändringshistorik. Verifierat mot lagen.nu:s lista över samtliga 69
// ändringsförfattningar till aktiebolagslagen (2005:551), där SFS 2025:804
// är den senaste, och mot riksdagens öppna data.
//
// Paragraferna (gammal/ny lydelse) genereras av
// backend/build_amendments_from_docx.py från Regeringskansliets Fulltext-DOCX,
// som innehåller både "Upphör att gälla" och "Träder i kraft"-versionen av
// varje ändrad paragraf. Se konkurslagAmendmentParagraphs.ts och
// aktiebolagslagAmendmentParagraphs.ts -- redigera inte dem för hand.

import { konkurslagAmendmentParagraphs } from './konkurslagAmendmentParagraphs';
import { aktiebolagslagAmendmentParagraphs } from './aktiebolagslagAmendmentParagraphs';

export type AmendmentChangeType = 'ändrad' | 'ny' | 'upphävd';

export interface AmendmentParagraph {
  id: string; // matchar sektions-id i src/data/laws, t.ex. 'kap-1-§-3'
  reference: string; // visningslabel, t.ex. '1 kap. 3 §'
  changeType: AmendmentChangeType;
  oldText: string | null; // null när changeType === 'ny'
  newText: string | null; // null när changeType === 'upphävd'
}

export interface LawAmendment {
  newsId: string; // matchar NewsItem.id i newsContent.ts
  lawId: string;
  sfsNumber: string;
  title: string;
  summary: string;
  effectiveDate: string; // ISO-datum
  source: string;
  paragraphs: AmendmentParagraph[];
}

export const lawAmendments: LawAmendment[] = [
  {
    newsId: 'news-konkurslag-2025-796',
    lawId: 'sfs-1987-672',
    sfsNumber: '2025:796',
    title: 'Ändringar i Konkurslag (1987:672)',
    summary:
      '141 paragrafer ändras, tillkommer eller upphävs (95 ändrade, 29 nya, 17 upphävda). Ändringarna flyttar ansvar från tingsrätten till tillsynsmyndigheten och förvaltaren, och ersätter den tidigare forumregeln för konkursansökningar med en enklare regel.',
    effectiveDate: '2026-07-01',
    source: 'Prop. 2024/25:135 "Ett nytt konkursförfarande"',
    paragraphs: konkurslagAmendmentParagraphs,
  },
  {
    newsId: 'news-aktiebolagslag-2025-804',
    lawId: 'sfs-2005-551',
    sfsNumber: '2025:804',
    title: 'Ändring i Aktiebolagslag (2005:551)',
    summary:
      'En språklig och redaktionell uppdatering av regeln om att ett aktiebolag ska gå i likvidation när en konkurs avslutas med överskott, efter en frivillig uppgörelse eller efter ackord. Den sakliga innebörden är oförändrad.',
    effectiveDate: '2026-07-01',
    source: 'Prop. 2024/25:135 "Ett nytt konkursförfarande"',
    paragraphs: aktiebolagslagAmendmentParagraphs,
  },
];

export function getAmendmentByNewsId(newsId: string): LawAmendment | undefined {
  return lawAmendments.find((amendment) => amendment.newsId === newsId);
}

// ---------------------------------------------------------------------------
// Förslag på automatisering vid framtida lagdatauppdateringar (diskuterat och
// godkänt innan EJU-87 påbörjades):
//
// 1. Innan en lagfil i src/data/laws skrivs över med en ny version, ta en
//    "snapshot" av den gamla paragraftexten per sektions-id.
// 2. Efter uppdateringen, diffa gammal mot ny text per sektions-id. En
//    sektion som fanns innan men saknas nu = "upphävd". En som finns nu men
//    inte innan = "ny". En som finns i båda men med annan text = "ändrad".
// 3. Generera både en NewsItem (newsContent.ts) och en LawAmendment-post
//    (den här filen) automatiskt från diffen, i stället för manuell
//    research varje gång som gjordes för Konkurslag SFS 2025:796 och
//    Aktiebolagslag SFS 2025:804 ovan.
// ---------------------------------------------------------------------------
