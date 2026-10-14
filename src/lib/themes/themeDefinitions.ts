import { baseThemes } from './presets/baseThemes';
import { seasonalThemes } from './presets/seasonalThemes';
import { customThemes, DEFAULT_CUSTOM_THEME } from './presets/customThemes';
import { applyThemeToDocument } from './colorUtils';

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  background: string;
  foreground: string;
  card: string;
  border: string;
  accent: string;
  primary: string;
  fontFamily: string;
  fontFamilyGoogleUrl?: string;
  backgroundImageUrl?: string;
  bgImageUrl?: string;
  backgroundGradient?: string;
  bgPrimary?: string;
  bgSidebar?: string;
  bgCard?: string;
  bgOpacity?: number;

  // Code Block Syntax Highlighting Tokens
  syntaxBg: string;
  syntaxKeyword: string;
  syntaxString: string;
  syntaxFunction: string;
  syntaxComment: string;
  syntaxVariable: string;
  syntaxNumber: string;
  syntaxOperator: string;
}

export type Theme = ThemeDefinition;
export type ThemeColors = ThemeDefinition;
export type ThemeMode = 'light' | 'dark' | 'custom' | string;

export const THEME_PRESETS: ThemeDefinition[] = [
  ...baseThemes,
  ...customThemes.filter((t) => t.id !== 'custom'),
  ...seasonalThemes,
  // Ensure custom preset is at the end matching original registry order
  customThemes.find((t) => t.id === 'custom')!,
];

export const themeDefinitions = THEME_PRESETS;

export function getThemeDefinition(
  themeId: string = 'dark',
  customThemeColors?: Partial<ThemeDefinition>
): ThemeDefinition {
  if (themeId === 'custom') {
    return {
      ...DEFAULT_CUSTOM_THEME,
      ...(customThemeColors || {}),
      id: 'custom',
    };
  }
  const found = THEME_PRESETS.find((t) => t.id === themeId);
  return found || THEME_PRESETS[0];
}

export function applyThemeId(
  themeId: string = 'dark',
  customThemeColors?: Partial<ThemeDefinition>
): ThemeDefinition {
  const target = getThemeDefinition(themeId, customThemeColors);
  applyThemeToDocument(target);
  return target;
}

export { DEFAULT_CUSTOM_THEME };
export { baseThemes } from './presets/baseThemes';
export { seasonalThemes } from './presets/seasonalThemes';
export { customThemes } from './presets/customThemes';
export {
  applyThemeToDocument,
  calculateLuminance,
  getContrastRatio,
  hexToHsl,
  hexToRgb,
  hexToRgba,
  hslToHex,
  meetsWcagAA,
  rgbToHex,
} from './colorUtils';
