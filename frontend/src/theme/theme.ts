/**
 * Insolvio Design System
 * Färgschema och typografi för Insolvio-appen
 */

// Färgschemat är baserat på "Supabase"-temat från tweakcn.com (Sofies
// önskemål, september 2026, för att matcha eJuridiks hemsida). Samma
// tokennamn som tidigare behålls (inga andra filer behöver ändras),
// men värdena är uppdaterade för att matcha temat. De token som inte
// har en direkt motsvarighet i Supabase-temat (t.ex. *Alt/*Alt2-nyanser)
// är härledda matematiskt så att samma relativa gradient bevaras.
export const colors = {
  // Primära färger
  deepGreen: '#121212',      // Mörk bakgrund (Supabase dark.background)
  cream: '#fcfcfc',          // Ljus bakgrund (Supabase light.background)

  // Accent färger
  greenPrimary: '#72e3ad',   // Grön accent (Supabase light.primary)
  greenPrimaryForeground: '#1e2723', // Text/ikoner OVANPÅ greenPrimary (Supabase light.primary-foreground) -- viktigt för kontrast, greenPrimary är ljus mint
  greenHover: '#9eebc4',     // Grön accent, hover/ljusare

  // Text färger på ljus bakgrund
  ink: '#171717',            // Primär text på ljust (Supabase light.foreground)
  darkText: '#2f2f2f',       // Mörk text, sekundär
  darkTextAlt: '#3c3c3c',    // Alternativ mörk text
  mutedText: '#4e4e4e',      // Dämpad text på ljust
  mutedTextAlt: '#5f5f5f',   // Alternativ dämpad text

  // Svag text/labels på ljus bakgrund
  weakText: '#7c7c7c',
  weakTextAlt: '#8c8c8c',
  weakTextAlt2: '#9c9c9c',

  // Text på mörk bakgrund
  lightText: '#e2e8f0',
  lightTextAlt: '#eaeef4',
  lightTextAlt2: '#f0f3f7',
  mutedOnDark: '#a2a2a2',    // Dämpad text på mörkt (Supabase dark.muted-foreground)

  // Avdelare/linjer
  dividerDark: '#292929',    // På mörkt (Supabase dark.border)
  dividerLight: '#dfdfdf',   // På ljust (Supabase light.border)
  dividerLightAlt: '#d5d5d5',

  // Statusfärger (nya, tillagda från Supabase-temat -- ej ännu kopplade
  // någonstans i appen, tillgängliga för framtida bruk t.ex. felmeddelanden)
  destructive: '#ca3214',           // Fel/varning (Supabase light.destructive)
  destructiveForeground: '#fffcfc', // Text ovanpå destructive
  inputBackground: '#f6f6f6',       // Inmatningsfält (Supabase light.input)

  // Speciella
  white: '#ffffff',          // Ren vit (logotyp)
};

export const typography = {
  // Font family - using 'Outfit' (Supabase-temats typsnitt), falls back to system font if not loaded
  fontFamily: {
    regular: 'Outfit',
    medium: 'Outfit',
    semiBold: 'Outfit',
    bold: 'Outfit',
    extraBold: 'Outfit',
  },
  
  // Rubriker - weight 600, tight tracking
  heading: {
    fontFamily: 'Outfit',
    fontWeight: '600' as const,
    letterSpacing: -0.015,
  },
  
  // Etiketter/eyebrows - versaler, wide tracking
  label: {
    fontFamily: 'Outfit',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.22,
  },
  
  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

// Helper för att skapa heading styles
export const createHeadingStyle = (fontSize: number) => ({
  fontFamily: typography.heading.fontFamily,
  fontWeight: typography.heading.fontWeight,
  fontSize,
  letterSpacing: fontSize * typography.heading.letterSpacing,
});

// Helper för att skapa label styles
export const createLabelStyle = (fontSize: number) => ({
  fontFamily: typography.label.fontFamily,
  fontWeight: typography.label.fontWeight,
  fontSize,
  letterSpacing: fontSize * typography.label.letterSpacing,
  textTransform: typography.label.textTransform,
});
