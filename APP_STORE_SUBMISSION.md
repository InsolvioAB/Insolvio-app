# Insolvio — App Store Connect: innehåll att klistra in

Utkast baserat på en genomgång av koden (inga nätverksanrop, ingen analys, ingen spårning, endast lokal lagring via AsyncStorage för bokmärken/anteckningar/nyligen visade). Justera gärna formuleringarna innan de klistras in.

## App-information

- **Namn:** Insolvio
- **Undertitel (max 30 tecken):** Svensk insolvensrätt i fickan
- **Bundle ID:** se.ejuridik.insolvio (bekräftad av Sofie)
- **Kategori:** Referens (Reference) — alternativt Juridik om Apple erbjuder det i din marknad
- **Prissättning:** [FYLL I]

## Beskrivning (utkast)

Insolvio samlar svensk lagstiftning om insolvens, konkurs och obestånd på ett ställe — alltid uppdaterad, alltid tillgänglig offline.

Bläddra i fullständig lagtext för bland annat konkurslagen, lönegarantilagen, förmånsrättslagen och aktiebolagslagen. Bokmärk paragrafer du återkommer till, gör egna anteckningar, och se exakt vad som ändrats när en lag uppdateras — med en tydlig jämförelse mellan gammal och ny lydelse.

Insolvio kräver inget konto och ingen internetuppkoppling för att läsa lagtexter. Appen samlar inte in eller delar någon personlig information.

Funktioner:
- Fullständig, uppdaterad lagtext för svensk insolvensrätt
- Bokmärk paragrafer för snabb åtkomst
- Egna anteckningar per paragraf
- Se vad som ändrats vid lagändringar (jämför gammal/ny lydelse)
- Fungerar offline

## Nyckelord (keywords, kommaseparerat, max 100 tecken)

konkurs,insolvens,obestånd,lagtext,juridik,konkurslag,lönegaranti,förmånsrätt,aktiebolagslag,lag

## Supportwebbadress / Marknadsföringswebbadress

[FYLL I — t.ex. en sida på ejuridik.com]

## Integritetspolicy-URL

[FYLL I — PRIVACY_POLICY.md måste publiceras på en offentlig URL. Förslag: en enkel sida under ejuridik.com, t.ex. ejuridik.com/insolvio/privacy, eller GitHub Pages om ni vill ha något snabbt upp.]

---

## Åldersgräns (Age Rating-frågeformuläret)

Appens innehåll är ren lagtext utan användargenererat innehåll som delas, inget våld, ingen reklam riktad mot vuxna, inget spel om pengar. Rimligt svar på samtliga frågor i Apples formulär är "Nej/Inget" vilket ger **4+**.

## App Privacy-frågeformuläret ("App Privacy" / data-insamling)

Baserat på kodgenomgången (ingen nätverkstrafik, inga SDK:er för analys/annonsering, endast AsyncStorage lokalt):

- **Data Not Collected** — detta är det korrekta svaret i Apples formulär: appen samlar inte in någon data som lämnar enheten.
- Om App Store Connect ändå kräver att man går igenom varje kategori (Contact Info, Health, Financial Info, Location, osv.): svara **Nej** / **ingen insamling** på samtliga, eftersom:
  - Ingen inloggning eller kontoskapande
  - Ingen nätverkskommunikation (verifierat: inga fetch/axios-anrop i koden)
  - Inga analys- eller annonserings-SDK:er (t.ex. ingen Firebase, Sentry, Amplitude)
  - Inga behörigheter begärs (ingen kamera, plats, kontakter, notiser)
  - Bokmärken/anteckningar/nyligen visade sparas enbart lokalt på enheten (AsyncStorage) och synkas aldrig till en server

Om detta ändras i framtiden (t.ex. om ni lägger till molnsynk eller analys) måste både integritetspolicyn och detta formulär uppdateras.

---

## Vad som måste göras manuellt av dig (kräver ditt Apple-ID och betalning)

Jag kan inte logga in på ditt Apple-ID, betala avgiften eller skicka in appen åt dig — det är kontobundna/betalningssteg. Så här gör du:

1. **Registrera Apple Developer Program** (99 USD/år): gå till https://developer.apple.com/programs/enroll/, logga in med ert Apple-ID (eller skapa ett organisations-ID om ni registrerar som eJuridik AB — kräver ofta ett D-U-N-S-nummer för företag, kolla https://developer.apple.com/support/D-U-N-S/ om ni inte redan har ett), betala avgiften.
2. **Logga in EAS lokalt**, så att jag kan köra byggen åt dig härifrån:
   ```
   cd ~/Documents/Insolvio-app/frontend
   npx eas login
   ```
3. Säg till mig när du är inloggad, så kör jag `eas build --platform ios --profile production` åt dig (eas.json är redan på plats).
4. **Skapa listningen i App Store Connect** (https://appstoreconnect.apple.com): ny app → klistra in namn/bundle ID/beskrivning/nyckelord från den här filen → ladda upp skärmdumpar (saknas ännu, se nedan) → fyll i Age Rating och App Privacy enligt svaren ovan.
5. **Skicka in för granskning** (Submit for Review) — sista steget, görs av dig i App Store Connect när allt ovan är ifyllt och bygget är uppladdat.

## Saknas fortfarande innan ni kan skicka in

- **App-ikon:** nuvarande icon.png är 512×513 px (inte kvadratisk) och verkar vara samma platshållarbild som favicon/adaptive-icon. Apple kräver en skarp 1024×1024 px-ikon utan transparens. Skicka mig den riktiga Insolvio-logotypen så fixar jag storlek/format.
- **Skärmdumpar** för App Store-listningen (minst en uppsättning för 6.7"-skärmar).
- **Startskärmens rubrik:** `frontend/app/(tabs)/index.tsx` visar fortfarande "Konkursadministration" / "Svensk lagsamling för konkursförvaltning" som rubrik — kvar sedan appen hette så, innan den växte till att täcka fler lagar. Vill du att jag byter till "Insolvio" + ny undertext, och i så fall vilken?
