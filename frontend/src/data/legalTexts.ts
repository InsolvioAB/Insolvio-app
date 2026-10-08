// Complete Swedish Legal Texts for Konkursadministration
// Data source: Sveriges Riksdag (riksdagen.se)
// Structure optimized for mobile app performance

export type Section = {
  id: string;
  number: number;
  /** Letter after the number, e.g. 'a' for "1 a §" */
  suffix?: string;
  /** Sub-heading (rubrik) that introduces this section */
  heading?: string;
  /** Heading one level above `heading`, when the law has two levels */
  groupHeading?: string;
  text: string;
  references: string[];
};

/** "1 §", "1 a §" */
export const sectionLabel = (s: { number: number; suffix?: string }): string =>
  `${s.number}${s.suffix ? ' ' + s.suffix : ''} §`;

export type Chapter = {
  id: string;
  number: number;
  numberSuffix?: string;
  title: string;
  sections: Section[];
};

export type LegalText = {
  id: string;
  title: string;
  sfsNumber: string;
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
];

