import React from 'react';
import { Text } from './AppText';
import { typography } from '../theme/theme';
import { useTheme } from '../theme/useTheme';

/**
 * Rubrik i det inbyggda toppfältet som följer vald textstorlek (Liten /
 * Normal / Stor). Används som headerTitle så att även lagens namn och
 * skärmarnas titlar ändras med resten av texten. Lång rubrik kortas av med "…".
 */
export default function HeaderTitle({ children }: { children?: string }) {
  const { colors } = useTheme();
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={{
        fontSize: 17,
        fontFamily: typography.fontFamily.bold,
        fontWeight: '700',
        color: colors.ink,
        flexShrink: 1,
      }}
      accessibilityRole="header"
    >
      {children}
    </Text>
  );
}
