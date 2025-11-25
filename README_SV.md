# Konkursadministration - Mobil App

En professionell mobilapplikation för konkursförvaltare, advokater och andra yrkesverksamma som arbetar med konkursärenden i Sverige. Appen ger enkel tillgång till svensk lagtext relevant för konkursadministration.

## 📱 Funktioner

### ✅ Implementerade Funktioner (MVP)

#### 1. **Lagtexter**
- Konkurslag (1987:672) - Fullständiga kapitel
- Aktiebolagslag (2005:551) - Konkursrelevanta avsnitt
- Lag om anställningsskydd (LAS) (1982:80)
- Semesterlag (1977:480)

#### 2. **Sökfunktion**
- Sök efter nyckelord i all lagtext
- Sök efter paragrafnummer (t.ex. "5 §")
- Sök efter kapitel (t.ex. "3 kap")
- Visar upp till 50 resultat med kontext

#### 3. **Bokmärken**
- Spara viktiga paragrafer för snabb åtkomst
- Visa alla bokmärken med laghänvisning
- Ta bort bokmärken enkelt
- Lagras lokalt på enheten

#### 4. **Anteckningar**
- Lägg till personliga anteckningar till specifika paragrafer
- Redigera och ta bort anteckningar
- Visas inline med lagtexten
- Lagras lokalt på enheten

#### 5. **Navigation**
- Innehållsförteckning för varje lag
- Expanderbara kapitel
- Tydlig struktur: Kapitel → Paragrafer
- Enkel navigation mellan lagar

#### 6. **Offline-åtkomst**
- Alla lagtexter tillgängliga offline
- Bokmärken och anteckningar lagras lokalt
- Ingen internetanslutning krävs efter första nedladdningen

#### 7. **Användargränssnitt**
- Ren och professionell design
- Svensk språkgränssnitt
- Optimerad för mobil användning
- Stödjer både ljus och mörkt läge (systemanpassat)

## 🏗️ Teknisk Struktur

### Frontend (Expo/React Native)
```
/app/frontend/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Startsida med laglista
│   │   ├── search.tsx         # Sökfunktion
│   │   └── bookmarks.tsx      # Bokmärken
│   ├── law/
│   │   └── [id].tsx           # Lagvisare med kapitel och paragrafer
│   └── _layout.tsx            # Huvudlayout med contexts
├── src/
│   ├── contexts/
│   │   ├── BookmarksContext.tsx
│   │   └── NotesContext.tsx
│   └── data/
│       └── legalTexts.ts      # Lagtext data
```

### Datastruktur

Lagtexter struktureras som:
```typescript
LegalText {
  id: string
  title: string
  sfsNumber: string
  chapters: Chapter[] {
    id: string
    number: number
    title: string
    sections: Section[] {
      id: string
      number: number
      text: string
      references: string[]
    }
  }
}
```

### Lokal Lagring
- **AsyncStorage** används för att spara:
  - Bokmärken: `@konkurs_bookmarks`
  - Anteckningar: `@konkurs_notes`

## 🚀 Användning

### Installation och körning
```bash
cd /app/frontend
yarn install
yarn start
```

### För utveckling
```bash
# Starta Expo development server
sudo supervisorctl restart expo

# Öppna på telefon med Expo Go
# Scanna QR-koden från Expo Go-appen
```

## 📋 Kommande Funktioner (Framtida Versioner)

### Planerade Förbättringar
1. **Uppdateringsnotifieringar**
   - Meddela användare när lagtext uppdateras
   - Version tracking av lagändringar

2. **Korsreferenser**
   - Klickbara länkar mellan laghänvisningar
   - Automatisk navigering till refererad paragraf

3. **Typsnittsinställningar**
   - Justerbar textstorlek
   - Val av typsnitt för bättre läsbarhet

4. **Mörkt läge**
   - Dedikerad dark mode toggle
   - Minskad ögonbelastning vid läsning

5. **Ordlista**
   - Vanliga konkurstermer
   - Snabb uppslagning

6. **Exportfunktion**
   - Exportera bokmärken och anteckningar
   - Dela specifika paragrafer

7. **Backend-system (valfritt)**
   - Synkronisering mellan enheter
   - Användarkontor
   - Molnbaserad backup

## 📱 Skärmdumpar

### Startsida
- Lista över alla tillgängliga lagar
- Information om SFS-nummer och senaste ändring
- Antal kapitel per lag

### Lagvisare
- Lagmetadata (SFS-nummer, department, datum)
- Expanderbara kapitel
- Paragrafer med fullständig lagtext
- Bokmärkes- och anteckningsikoner

### Sök
- Sökfält med placeholder-text
- Resultaträknare
- Sökresultat med kontext
- Navigering till specifik paragraf

### Bokmärken
- Lista över sparade paragrafer
- Laghänvisning och paragrafnummer
- Förhandsgranskning av text
- Borttagningsknapp

## 🔐 Dataskydd

- Alla data lagras lokalt på enheten
- Ingen extern dataöverföring
- GDPR-kompatibel
- Användaren har full kontroll över sina data

## 📄 Licens

Denna app är skapad för professionellt bruk inom konkursadministration i Sverige.

## 🛠️ Support och Feedback

För frågor eller feedback, kontakta utvecklaren.

## 📚 Källor

Lagtexter hämtade från:
- Sveriges Riksdag: https://www.riksdagen.se
- Svensk författningssamling (SFS)

---

**Version:** 1.0.0 (MVP)  
**Plattform:** iOS & Android (via Expo)  
**Språk:** Svenska  
**Utvecklad:** November 2025
