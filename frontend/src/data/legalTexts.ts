// Complete Swedish Legal Texts for Konkursadministration
// Data source: Sveriges Riksdag (riksdagen.se)
// Structure optimized for mobile app performance

export type Section = {
  id: string;
  number: number;
  /** Letter after the number, e.g. 'a' for "1 a §" */
  suffix?: string;
  /** Overrides the default "N §" label, e.g. "Artikel 5" for EU regulations */
  label?: string;
  /** Sub-heading (rubrik) that introduces this section */
  heading?: string;
  /** Heading one level above `heading`, when the law has two levels */
  groupHeading?: string;
  text: string;
  references: string[];
};

/** "1 §", "1 a §", or "Artikel 1" for EU regulations */
export const sectionLabel = (s: { number: number; suffix?: string; label?: string }): string =>
  s.label ?? `${s.number}${s.suffix ? ' ' + s.suffix : ''} §`;

/** "5 kap.", or "Kapitel V" for EU regulations */
export const chapterLabel = (c: { number: number; numberSuffix?: string; label?: string }): string =>
  c.label ?? `${c.number}${c.numberSuffix ?? ''} kap.`;

/** "2 kap. 7 §", or "Kapitel III, Artikel 34" for EU regulations */
export const chapterSectionLabel = (
  c: { number: number; numberSuffix?: string; label?: string },
  s: { number: number; suffix?: string; label?: string }
): string => `${chapterLabel(c)}${c.label ? ',' : ''} ${sectionLabel(s)}`;

/** "SFS 2016:676", or "Förordning (EU) 2015/848" */
export const lawCitation = (law?: { sfsNumber: string; citation?: string }): string =>
  law ? law.citation ?? (law.sfsNumber ? `SFS ${law.sfsNumber}` : '') : '';

export type Chapter = {
  id: string;
  number: number;
  numberSuffix?: string;
  /** Overrides the default "N kap." label, e.g. "Kapitel V" for EU regulations */
  label?: string;
  title: string;
  sections: Section[];
};

export type LegalText = {
  id: string;
  title: string;
  sfsNumber: string;
  /** Shown instead of "SFS <sfsNumber>", e.g. "Förordning (EU) 2015/848" */
  citation?: string;
  department: string;
  issued: string;
  lastAmended: string;
  /** false for laws without kapitel (LAS, semesterlagen, ...) - UI then shows no "kap." labels */
  chaptered?: boolean;
  chapters: Chapter[];
  /** Övergångsbestämmelser, one entry per amending SFS */
  transitional?: { sfs: string; text: string }[];
};

// Import complete law data files
import { konkurslag } from './laws/konkurslag';
import { handelsbolag } from './laws/handelsbolag';
import { las } from './laws/las';
import { semesterlag } from './laws/semesterlag';
import { aktiebolagslag } from './laws/aktiebolagslag';
import { lönegaranti } from './laws/lonegaranti';
import { företagsrekonstruktion } from './laws/foretagsrekonstruktion';
import { förmånsrättslag } from './laws/formansrattslag';
import { skuldsaneringslagen } from './laws/skuldsaneringslagen';
import { lönegarantiförordning } from './laws/lonegarantiforordning';
import { jordabalken12Kap } from './laws/jordabalken_12kap';
import { kompletterandeInsolvensförordning } from './laws/kompletterandeinsolvensforordning';
import { fSkuldsanering } from './laws/fskuldsanering';
import { euInsolvensförordning } from './laws/euinsolvensforordning';

export const legalTexts: LegalText[] = [
  konkurslag,
  handelsbolag,
  aktiebolagslag,
  las,
  semesterlag,
  lönegaranti,
  företagsrekonstruktion,
  förmånsrättslag,
  skuldsaneringslagen,
  lönegarantiförordning,
  jordabalken12Kap,
  kompletterandeInsolvensförordning,
  fSkuldsanering,
  euInsolvensförordning,
];

