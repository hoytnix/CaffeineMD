import type { ThemeDefinition } from '../themeDefinitions';

/**
 * Seasonal Theme Presets
 * Inspired by nature's four seasons with distinct color palettes,
 * custom syntax highlighting, and typography tokens.
 */

/**
 * Spring: Fresh botanical mint green theme with tender leaf tones.
 */
export const springTheme: ThemeDefinition = {
  id: 'spring',
  name: 'Spring',
  description: 'Fresh mint botanical garden with tender leaf tones',
  isDark: false,
  background: '#f8faf6',
  foreground: '#1f2e1f',
  card: '#edf5eb',
  border: '#d4e6d1',
  accent: '#16a34a',
  primary: '#84cc16',
  fontFamily: 'system-ui, sans-serif',
  syntaxBg: '#edf5eb',
  syntaxKeyword: '#15803d',
  syntaxString: '#047857',
  syntaxFunction: '#0284c7',
  syntaxComment: '#65a30d',
  syntaxVariable: '#b45309',
  syntaxNumber: '#c2410c',
  syntaxOperator: '#16a34a',
};

/**
 * Summer: Golden sunshine warmth with vibrant citrus amber hues.
 */
export const summerTheme: ThemeDefinition = {
  id: 'summer',
  name: 'Summer',
  description: 'Sunlit warmth with golden citrus and amber glow',
  isDark: false,
  background: '#fffdf5',
  foreground: '#3d321d',
  card: '#fef7dc',
  border: '#faeaaf',
  accent: '#ea580c',
  primary: '#f59e0b',
  fontFamily: 'system-ui, sans-serif',
  syntaxBg: '#fef7dc',
  syntaxKeyword: '#c2410c',
  syntaxString: '#b45309',
  syntaxFunction: '#ca8a04',
  syntaxComment: '#854d0e',
  syntaxVariable: '#ea580c',
  syntaxNumber: '#d97706',
  syntaxOperator: '#9a3412',
};

/**
 * Autumn: Cozy spiced chestnut and radiant maple orange embers.
 */
export const autumnTheme: ThemeDefinition = {
  id: 'autumn',
  name: 'Autumn',
  description: 'Cozy spiced chestnut and maple orange embers',
  isDark: true,
  background: '#19120e',
  foreground: '#fcebe0',
  card: '#271c16',
  border: '#3f2d23',
  accent: '#f97316',
  primary: '#ea580c',
  fontFamily: 'system-ui, sans-serif',
  syntaxBg: '#271c16',
  syntaxKeyword: '#f97316',
  syntaxString: '#fde047',
  syntaxFunction: '#fb923c',
  syntaxComment: '#78533c',
  syntaxVariable: '#ef4444',
  syntaxNumber: '#f59e0b',
  syntaxOperator: '#ea580c',
};

/**
 * Winter: Glacial sapphire and subzero ice crystal glow.
 */
export const winterTheme: ThemeDefinition = {
  id: 'winter',
  name: 'Winter',
  description: 'Glacial sapphire and subzero ice crystal glow',
  isDark: true,
  background: '#09111c',
  foreground: '#e0f2fe',
  card: '#111f32',
  border: '#1c3452',
  accent: '#38bdf8',
  primary: '#60a5fa',
  fontFamily: 'system-ui, sans-serif',
  syntaxBg: '#111f32',
  syntaxKeyword: '#38bdf8',
  syntaxString: '#93c5fd',
  syntaxFunction: '#60a5fa',
  syntaxComment: '#4b6584',
  syntaxVariable: '#c084fc',
  syntaxNumber: '#7dd3fc',
  syntaxOperator: '#67e8f9',
};

/**
 * Array of all seasonal themes in calendar order.
 */
export const seasonalThemes: ThemeDefinition[] = [
  springTheme,
  summerTheme,
  autumnTheme,
  winterTheme,
];
