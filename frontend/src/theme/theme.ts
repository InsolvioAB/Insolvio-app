/**
 * Insolvio Design System
 * Färgschema och typografi för Insolvio-appen
 */

export const colors = {
  // Primära färger
  deepGreen: '#0e1d18',      // Djupgrön, mörk bakgrund
  cream: '#f4f1ea',          // Cream, ljus bakgrund + text på mörkt
  
  // Accent färger
  greenPrimary: '#3f9b7d',   // Grön accent (primär)
  greenHover: '#56b895',     // Grön accent, hover/ljusare
  
  // Text färger på ljus bakgrund
  ink: '#16211c',            // Primär text på ljust
  darkText: '#2c3a33',       // Mörk text, sekundär
  darkTextAlt: '#3a4841',    // Alternativ mörk text
  mutedText: '#4a5a51',      // Dämpad text på ljust
  mutedTextAlt: '#5c6b62',   // Alternativ dämpad text
  
  // Svag text/labels på ljus bakgrund
  weakText: '#7a877e',
  weakTextAlt: '#8a978e',
  weakTextAlt2: '#9aa79f',
  
  // Text på mörk bakgrund
  lightText: '#9db8ac',
  lightTextAlt: '#b9c8bf',
  lightTextAlt2: '#cdd8d1',
  mutedOnDark: '#6f8479',    // Dämpad text på mörkt
  
  // Avdelare/linjer
  dividerDark: '#26382f',    // På mörkt
  dividerLight: '#d8d2c4',   // På ljust
  dividerLightAlt: '#c3c9bf',
  
  // Speciella
  white: '#ffffff',          // Ren vit (logotyp)
};

export const typography = {
  // Font family
  fontFamily: {
    regular: 'OpenSans_400Regular',
    medium: 'OpenSans_500Medium',
    semiBold: 'OpenSans_600SemiBold',
    bold: 'OpenSans_700Bold',
    extraBold: 'OpenSans_800ExtraBold',
  },
  
  // Rubriker - weight 600, tight tracking
  heading: {
    fontFamily: 'OpenSans_600SemiBold',
    letterSpacing: -0.015,
  },
  
  // Etiketter/eyebrows - versaler, wide tracking
  label: {
    fontFamily: 'OpenSans_600SemiBold',
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
  fontSize,
  letterSpacing: fontSize * typography.heading.letterSpacing,
});

// Helper för att skapa label styles
export const createLabelStyle = (fontSize: number) => ({
  fontFamily: typography.label.fontFamily,
  fontSize,
  letterSpacing: fontSize * typography.label.letterSpacing,
  textTransform: typography.label.textTransform,
});
