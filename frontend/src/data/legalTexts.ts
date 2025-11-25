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

export const legalTexts: LegalText[] = [
  konkurslag,
  handelsbolag,
  las,
  semesterlag,
  aktiebolagslag,
];

