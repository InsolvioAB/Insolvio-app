// Kategori per lag för filterchips på Lagar-fliken (EJU-193).
// OBS: PRELIMINÄR indelning gjord av utvecklaren -- ska bekräftas av Sofie/jurist.
// Lagfilerna i src/data/laws är genererade och ska inte ändras för hand,
// därför ligger kategorierna i en egen fil, nycklade på lagens id.
// Lagar som saknas här visas bara under "Alla".

export const LAW_CATEGORIES = ['Insolvens', 'Bolagsrätt', 'Arbetsrätt'] as const;
export type LawCategory = (typeof LAW_CATEGORIES)[number];

// En lag kan höra till flera kategorier (visas då under flera chips).
export const lawCategoriesById: Record<string, LawCategory[]> = {
  'sfs-1987-672': ['Insolvens'],                 // Konkurslag
  'sfs-1970-979': ['Insolvens'],                 // Förmånsrättslag
  'sfs-2016-675': ['Insolvens'],                 // Skuldsaneringslag
  'sfs-2022-964': ['Insolvens'],                 // Lag om företagsrekonstruktion
  'sfs-1992-497': ['Insolvens', 'Arbetsrätt'],   // Lönegarantilag
  'sfs-2024-1329': ['Insolvens', 'Arbetsrätt'],  // Lönegarantiförordning
  'sfs-2016-676': ['Insolvens'],                 // Lag om skuldsanering för företagare (F-skuldsanering)
  'sfs-2017-473': ['Insolvens'],                 // Lag med kompletterande bestämmelser till 2015 års insolvensförordning
  'sfs-2005-551': ['Bolagsrätt'],                // Aktiebolagslag
  'sfs-1980-1102': ['Bolagsrätt'],               // Lag om handelsbolag och enkla bolag
  'sfs-1982-80': ['Arbetsrätt'],                 // LAS
  'sfs-1977-480': ['Arbetsrätt'],                // Semesterlag
  // 'sfs-1970-994-kap12' (Jordabalken 12 kap. Hyra): ingen kategori ännu
};
