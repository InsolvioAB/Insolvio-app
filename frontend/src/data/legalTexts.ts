// Complete Swedish Legal Texts for Konkursadministration
// Data source: Sveriges Riksdag (riksdagen.se)
// Structure optimized for mobile app performance

export type Section = {
  id: string;
  number: number;
  text: string;
  references: string[];
};

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
  chapters: Chapter[];
};

// Import complete law data files
import { konkurslag } from './laws/konkurslag';
import { handelsbolag } from './laws/handelsbolag';
import { las } from './laws/las';
import { semesterlag } from './laws/semesterlag';
import { aktiebolagslag } from './laws/aktiebolagslag';
import { lönegaranti } from './laws/lönegaranti';
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

