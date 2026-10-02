// Strukturerad data för "jämför ändring"-vyn (EJU-87).
//
// Varje post kopplas till en NewsItem (via newsId) och innehåller den
// faktiska gamla och nya lydelsen per ändrad/ny/upphävd paragraf, så att
// användaren kan se exakt vad som ändrades -- inte bara en sammanfattning.
//
// Källa för Konkurslag SFS 2025:796: Prop. 2024/25:135 "Ett nytt
// konkursförfarande", avsnitt 2.1 (Nuvarande lydelse / Föreslagen lydelse)
// och avsnitt 11.5.3 (motivering till upphävandet av 2 kap. 2 a §).
// Verifierad mot lagtexten i src/data/laws/konkurslag.ts (som fortfarande
// har den upphävda 2 kap. 2 a § kvar, taggad "Upphör att gälla").
//
// OBS: Denna fil är handskriven för den här ändringen. Se README-anteckning
// i botten av filen för förslag på hur detta kan automatiseras vid framtida
// lagdatauppdateringar.

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
      'Ändringarna flyttar ansvar från tingsrätten till tillsynsmyndigheten och förvaltaren, och ersätter den tidigare forumregeln för konkursansökningar med en enklare regel.',
    effectiveDate: '2026-07-01',
    source: 'Prop. 2024/25:135 "Ett nytt konkursförfarande"',
    paragraphs: [
      {
        id: 'kap-1-§-3',
        reference: '1 kap. 3 §',
        changeType: 'ändrad',
        oldText:
          'Förvaltningen av ett konkursbo handhas av en eller flera förvaltare. Förvaltningen av boet står under tillsyn av tillsynsmyndigheten.',
        newText:
          'Förvaltningen av ett konkursbo handhas av en eller flera förvaltare. Tillsynsmyndigheten utövar tillsyn över förvaltningen. Tillsynsmyndigheten utför även de andra uppgifter som anges i denna lag.',
      },
      {
        id: 'kap-1-§-6',
        reference: '1 kap. 6 §',
        changeType: 'ändrad',
        oldText:
          'Om det i någon annan lag har meddelats någon bestämmelse som avviker från denna lag, gäller den bestämmelsen. Angående tillämpligheten av rättegångsbalken ges bestämmelser i det följande.',
        newText:
          'Om en annan lag innehåller en bestämmelse som avviker från denna lag, tillämpas den bestämmelsen.',
      },
      {
        id: 'kap-2-§-1',
        reference: '2 kap. 1 §',
        changeType: 'ändrad',
        oldText:
          'En ansökan om konkurs görs skriftligen till den tingsrätt där gäldenären svarar i tvistemål som angår betalningsskyldighet i allmänhet. Sökanden ska ange och styrka de omständigheter som gör rätten behörig, om de inte är kända. En ansökan ska avvisas, om det inte av den framgår vilken tingsrätt som är behörig och sökanden inte följer ett föreläggande att avhjälpa bristen. I 3 och 4 §§ lagen (2017:473) med kompletterande bestämmelser till 2015 års insolvensförordning finns ytterligare bestämmelser om ansökans innehåll.',
        newText:
          'En ansökan om konkurs görs skriftligen till tingsrätten. Sökanden ska ange och styrka de omständigheter som gör rätten behörig, om de inte är kända. En ansökan ska avvisas, om det inte av den framgår vilken tingsrätt som är behörig och sökanden inte följer ett föreläggande att avhjälpa bristen. I 3 och 4 §§ lagen (2017:473) med kompletterande bestämmelser till 2015 års insolvensförordning finns det ytterligare bestämmelser om ansökans innehåll.',
      },
      {
        id: 'kap-2-§-2a',
        reference: '2 kap. 2 a §',
        changeType: 'upphävd',
        oldText:
          'Har en konkursansökan gjorts hos en tingsrätt som inte är behörig, skall rätten genast sända handlingarna i ärendet till den tingsrätt som enligt vad dessa visar är behörig och underrätta sökanden. Ansökan skall anses gjord, när ansökningshandlingen kom in till den förra tingsrätten.',
        newText: null,
      },
      {
        id: 'kap-2-§-6a',
        reference: '2 kap. 6 a §',
        changeType: 'ny',
        oldText: null,
        newText:
          'I 24 kap. 1 § lagen (2015:1016) om resolution och i 3 kap. 2 § lagen (2022:739) med kompletterande bestämmelser till EU:s förordning om återhämtning och resolution av centrala motparter finns det särskilda bestämmelser om en konkursansökan som avser en gäldenär som omfattas av någon av de lagarna.',
      },
    ],
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
//    research varje gång som gjordes för Konkurslag SFS 2025:796 ovan.
// ---------------------------------------------------------------------------
