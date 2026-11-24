import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTextSize } from '../contexts/TextSizeContext';

/**
 * Samma som React Natives Text, men fontstorlek och radavstånd följer
 * den valda textstorleken (Liten / Normal / Stor) i hela appen.
 *
 * Skalar bara när stilen anger fontSize uttryckligen, så att nästlade
 * Text-element utan eget fontSize fortfarande ärver från sin förälder.
 * Använd RNText direkt (import { Text } from 'react-native') för text som
 * inte ska ändras, t.ex. Aa-knappen själv.
 */
export function Text({ style, ...props }: TextProps) {
  const { scale } = useTextSize();
  if (scale === 1) {
    return <RNText style={style} {...props} />;
  }
  const flat = StyleSheet.flatten(style) || {};
  const scaled: { fontSize?: number; lineHeight?: number } = {};
  if (typeof flat.fontSize === 'number') scaled.fontSize = flat.fontSize * scale;
  if (typeof flat.lineHeight === 'number') scaled.lineHeight = flat.lineHeight * scale;
  return <RNText {...props} style={[style, scaled]} />;
}
