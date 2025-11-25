// Lightweight index file that dynamically loads laws from JSON files
// This replaces the old monolithic data structure

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

// Import index
import lawsIndex from './laws/index.json';

// Function to load a law dynamically
export async function loadLaw(lawId: string): Promise<LegalText> {
  const lawInfo = lawsIndex.find((l: any) => l.id === lawId);
  if (!lawInfo) {
    throw new Error(`Law ${lawId} not found`);
  }
  
  // Dynamic import based on filename
  const lawData = await import(`./laws/${lawInfo.fileName}`);
  return lawData.default;
}

// Export lightweight list for home screen
export const legalTexts = lawsIndex.map((law: any) => ({
  id: law.id,
  title: law.title,
  sfsNumber: law.sfsNumber,
  department: law.department,
  issued: law.issued,
  lastAmended: law.lastAmended,
  chapters: [], // Will be loaded dynamically
}));
