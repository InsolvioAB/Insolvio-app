// Korta lagnamn utan SFS-nummer, för kort och listor i appen (EJU-193).
// OBS: PRELIMINÄRA namn -- ska bekräftas av Sofie.
// Lagfilerna i src/data/laws är genererade och ska inte ändras för hand,
// därför ligger namnen i en egen fil, nycklade på lagens id.
// Hela officiella titeln (med SFS-nummer) visas fortfarande på lagsidan.

const shortNameById: Record<string, string> = {
  'sfs-1987-672': 'Konkurslagen',
  'sfs-2005-551': 'Aktiebolagslagen',
  'sfs-1980-1102': 'Handelsbolag och enkla bolag',
  'sfs-1982-80': 'Anställningsskyddslagen (LAS)',
  'sfs-1977-480': 'Semesterlagen',
  'sfs-1992-497': 'Lönegarantilagen',
  'sfs-2024-1329': 'Lönegarantiförordningen',
  'sfs-1970-979': 'Förmånsrättslagen',
  'sfs-2016-675': 'Skuldsaneringslagen',
  'sfs-2016-676': 'F-skuldsaneringslagen',
  'sfs-2017-473': 'Kompletterande bestämmelser till insolvensförordningen',
  'sfs-2022-964': 'Lag om företagsrekonstruktion',
  'sfs-1970-994-kap12': 'Jordabalken 12 kap. Hyra',
};

// Kort namn för en lag; faller tillbaka på titeln utan "(1987:672)" om id saknas i listan
export function getShortLawName(lawId: string, fallbackTitle: string): string {
  return shortNameById[lawId] ?? fallbackTitle.replace(/\s*\(\d{4}:\d+\)/, '');
}
