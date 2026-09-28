// Innehåll för Nyheter-skärmen (senaste lagändringarna)
// OBS: Detta är exempeldata i väntan på riktig ändringshistorik i lagdatan.
// Varje lag har idag bara ett "lastAmended"-fält (t.ex. "t.o.m. SFS 2025:796"),
// inget strukturerat datum eller beskrivning per ändring. Byt ut mot riktig
// data när det finns.

export interface NewsItem {
  id: string;
  lawId: string;
  date: string; // visningssträng, t.ex. "15 AUG 2026"
  dateISO: string; // ISO-datum (YYYY-MM-DD) som styr synlighetsfönstret nedan
  lawTitle: string;
  description: string;
}

export const newsItems: NewsItem[] = [
  {
    id: 'news-konkurslag-2025-796',
    lawId: 'sfs-1987-672',
    date: '15 AUG 2026',
    dateISO: '2026-08-15',
    lawTitle: 'Konkurslag',
    description: 'Ändrad t.o.m. SFS 2025:796 — ändringar i 4 kap. om borgenärers rätt att bevaka fordringar.',
  },
  {
    id: 'news-aktiebolagslag-2024-862',
    lawId: 'sfs-2005-551',
    date: '3 JUN 2026',
    dateISO: '2026-06-03',
    lawTitle: 'Aktiebolagslag',
    description: 'Ändrad t.o.m. SFS 2024:862 — ändringar i 25 kap. om tvångslikvidation.',
  },
];

// En lagändring visas som "ny"/"uppdaterad" (i Nyheter-listan, badgen och
// bannern på Lagar-skärmen) i högst så här många månader efter ändringen.
export const NEWS_WINDOW_MONTHS = 3;

function isWithinNewsWindow(dateISO: string, now: Date = new Date()): boolean {
  const changed = new Date(dateISO);
  const cutoff = new Date(now.getFullYear(), now.getMonth() - NEWS_WINDOW_MONTHS, now.getDate());
  return changed >= cutoff && changed <= now;
}

// De ändringar som fortfarande ligger inom det rullande visningsfönstret --
// detta är vad UI:t ska använda, inte den råa `newsItems`-listan ovan.
export const activeNewsItems: NewsItem[] = newsItems.filter((item) =>
  isWithinNewsWindow(item.dateISO)
);

// Lag-id:n för lagar med en aktiv (inom fönstret) ändring, för badgen på
// Lagar-skärmen.
export const updatedLawIds: Set<string> = new Set(activeNewsItems.map((item) => item.lawId));
