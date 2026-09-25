// Innehåll för Nyheter-skärmen (senaste lagändringarna)
// OBS: Detta är exempeldata i väntan på riktig ändringshistorik i lagdatan.
// Varje lag har idag bara ett "lastAmended"-fält (t.ex. "t.o.m. SFS 2025:796"),
// inget strukturerat datum eller beskrivning per ändring. Byt ut mot riktig
// data när det finns.

export interface NewsItem {
  id: string;
  lawId: string;
  date: string; // visningssträng, t.ex. "15 AUG 2026"
  lawTitle: string;
  description: string;
}

export const newsItems: NewsItem[] = [
  {
    id: 'news-konkurslag-2025-796',
    lawId: 'sfs-1987-672',
    date: '15 AUG 2026',
    lawTitle: 'Konkurslag',
    description: 'Ändrad t.o.m. SFS 2025:796 — ändringar i 4 kap. om borgenärers rätt att bevaka fordringar.',
  },
  {
    id: 'news-aktiebolagslag-2024-862',
    lawId: 'sfs-2005-551',
    date: '3 JUN 2026',
    lawTitle: 'Aktiebolagslag',
    description: 'Ändrad t.o.m. SFS 2024:862 — ändringar i 25 kap. om tvångslikvidation.',
  },
];
