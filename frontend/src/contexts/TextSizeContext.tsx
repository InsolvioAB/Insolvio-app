import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TextSize = 'small' | 'normal' | 'large';

export const TEXT_SIZE_SCALE: Record<TextSize, number> = {
  small: 0.9,
  normal: 1,
  large: 1.2,
};

export const TEXT_SIZE_LABEL: Record<TextSize, string> = {
  small: 'Liten',
  normal: 'Normal',
  large: 'Stor',
};

const TEXT_SIZE_KEY = '@insolvio_text_size';

type TextSizeContextType = {
  textSize: TextSize;
  /** Multiplicera lagtextens fontstorlek och radavstånd med detta */
  scale: number;
  setTextSize: (size: TextSize) => Promise<void>;
};

// Standardvärde så att skärmar aldrig kraschar om providern saknas
const TextSizeContext = createContext<TextSizeContextType>({
  textSize: 'normal',
  scale: 1,
  setTextSize: async () => {},
});

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>('normal');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TEXT_SIZE_KEY);
        if (stored === 'small' || stored === 'normal' || stored === 'large') {
          setTextSizeState(stored);
        }
      } catch (error) {
        console.error('Error loading text size:', error);
      }
    })();
  }, []);

  const setTextSize = async (size: TextSize) => {
    setTextSizeState(size);
    try {
      await AsyncStorage.setItem(TEXT_SIZE_KEY, size);
    } catch (error) {
      console.error('Error saving text size:', error);
    }
  };

  return (
    <TextSizeContext.Provider value={{ textSize, scale: TEXT_SIZE_SCALE[textSize], setTextSize }}>
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize() {
  return useContext(TextSizeContext);
}
