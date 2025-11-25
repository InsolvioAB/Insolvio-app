# Swedish Legal Texts - JSON Structure

This directory contains complete Swedish legal texts structured as JSON files.

## Files:
- `index.json` - Index of all available laws
- `konkurslag.json` - Konkurslag (1987:672) - Complete
- `handelsbolag.json` - Lag om handelsbolag och enkla bolag (1980:1102) - Complete
- `las.json` - Lag om anställningsskydd (1982:80) - Complete
- `semesterlag.json` - Semesterlag (1977:480) - Complete
- `aktiebolagslag.json` - Aktiebolagslag (2005:551) - Relevant sections

## Structure:
Each law file contains:
```json
{
  "id": "sfs-YYYY-NNN",
  "title": "Law Title",
  "sfsNumber": "YYYY:NNN",
  "department": "Department name",
  "issued": "YYYY-MM-DD",
  "lastAmended": "Amendment info",
  "chapters": [
    {
      "id": "kap-N",
      "number": N,
      "title": "Chapter Title",
      "sections": [
        {
          "id": "kap-N-§-M",
          "number": M,
          "text": "Complete legal text...",
          "references": ["cross-references"]
        }
      ]
    }
  ]
}
```

## Data Source:
All texts sourced from Sveriges Riksdag (riksdagen.se)
- Official Swedish legal repository
- Current as of extraction date
- Includes all amendments up to SFS numbers listed

## Usage:
Import in React Native app:
```typescript
import lawData from './laws/konkurslag.json';
```

## Maintenance:
To update:
1. Fetch latest text from riksdagen.se
2. Parse using parse_laws.py script
3. Regenerate JSON file
4. Update lastAmended field

