
import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#172B4D',
    background: '#F3F7FC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DBEAFE',
    textSecondary: '#64748B',
    accent: '#2563EB',
    border: '#DFE7F1',
    success: '#15803D',
  },
  dark: {
    text: '#F4F7FB',
    background: '#0B0F14',
    backgroundElement: '#151B23',
    backgroundSelected: '#203126',
    textSecondary: '#8D99A8',
    accent: '#8BE28B',
    border: '#252D38',
    success: '#8BE28B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({
  ios: 50,
  android: 80,
}) ?? 0;

export const MaxContentWidth = 800;
