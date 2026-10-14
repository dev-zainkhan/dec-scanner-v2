import { Platform, type TextStyle } from 'react-native';
import { colors } from './colors';

export const font = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
};

export const type = {
  display: {
    fontFamily: font.serif,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  title: {
    fontFamily: font.serif,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
  } satisfies TextStyle,
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  } satisfies TextStyle,
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  } satisfies TextStyle,
};
