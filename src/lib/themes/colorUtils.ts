import type { ThemeDefinition, ThemeColors } from './themeDefinitions';

/**
 * Converts a hex color string (#rgb, #rrggbb) to RGBA string rgba(r, g, b, alpha).
 */
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Converts a hex color string (#rgb, #rrggbb) to RGB tuple [r, g, b] (0-255).
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleaned = hex.replace(/^#/, '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (cleaned.length !== 6) {
    return [0, 0, 0];
  }
  const num = parseInt(cleaned, 16);
  if (Number.isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Converts an RGB tuple [r, g, b] (0-255) to a hex string (#rrggbb).
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (val: number) => clamp(val).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts a hex color string to HSL values [h, s, l].
 * h: 0-360, s: 0-100, l: 0-100.
 */
export function hexToHsl(hex: string): [number, number, number] {
  const [rNorm, gNorm, bNorm] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / delta + 2) * 60;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / delta + 4) * 60;
        break;
    }
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Converts HSL values (h: 0-360, s: 0-100, l: 0-100) to hex string.
 */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    [rPrime, gPrime, bPrime] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [rPrime, gPrime, bPrime] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [rPrime, gPrime, bPrime] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [rPrime, gPrime, bPrime] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [rPrime, gPrime, bPrime] = [x, 0, c];
  } else {
    [rPrime, gPrime, bPrime] = [c, 0, x];
  }

  return rgbToHex((rPrime + m) * 255, (gPrime + m) * 255, (bPrime + m) * 255);
}

/**
 * Calculates WCAG relative luminance of a sRGB hex color (0 to 1).
 */
export function calculateLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates the WCAG contrast ratio between two hex colors (1 to 21).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = calculateLuminance(hex1);
  const lum2 = calculateLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Returns true if the contrast ratio meets WCAG AA standards for normal text (>= 4.5).
 */
export function meetsWcagAA(foregroundHex: string, backgroundHex: string): boolean {
  return getContrastRatio(foregroundHex, backgroundHex) >= 4.5;
}

/**
 * Apply theme CSS variables and document classes to root DOM element.
 */
export function applyThemeToDocument(colors: ThemeColors | ThemeDefinition): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Toggle dark/light class for Tailwind compatibility
  if (colors.isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // Set data-theme attribute for theme-scoped selectors
  root.setAttribute('data-theme', colors.id);

  const bgPrimary = colors.bgPrimary || colors.background;
  const bgSidebar = colors.bgSidebar || colors.card;
  const bgCard = colors.bgCard || colors.card;
  const bgImageUrl = colors.bgImageUrl || colors.backgroundImageUrl;
  const hasBg = Boolean(bgImageUrl || colors.backgroundGradient);

  // Set CSS custom properties
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--card', colors.card);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--primary', colors.primary);

  // Set theme semantic custom properties for views
  root.style.setProperty('--theme-bg-primary', bgPrimary);
  root.style.setProperty('--theme-bg-sidebar', bgSidebar);
  root.style.setProperty('--theme-bg-card', bgCard);
  root.style.setProperty('--bg-primary', bgPrimary);
  root.style.setProperty('--bg-secondary', bgSidebar);
  root.style.setProperty('--theme-border', colors.border);
  root.style.setProperty('--theme-text-primary', colors.foreground);
  root.style.setProperty('--theme-text-secondary', colors.foreground);
  root.style.setProperty('--theme-text-muted', colors.isDark ? '#94a3b8' : '#64748b');
  root.style.setProperty('--theme-accent', colors.accent);

  // Map colors.fontFamily to CSS font stack variable --theme-font-family
  let themeFontFamily = 'var(--font-sans)';
  if (colors.fontFamily === 'JetBrains Mono' || colors.fontFamily?.includes('JetBrains Mono')) {
    themeFontFamily = 'var(--font-mono)';
  } else if (colors.fontFamily === 'Merriweather' || colors.fontFamily?.includes('Merriweather')) {
    themeFontFamily = 'Georgia, Cambria, "Times New Roman", Times, serif';
  } else {
    themeFontFamily = 'var(--font-sans)';
  }
  root.style.setProperty('--theme-font-family', themeFontFamily);
  root.dataset.themeFont = colors.fontFamily || 'Inter';

  // Background image & gradient configuration
  root.dataset.hasBgImage = hasBg ? 'true' : 'false';
  const bgImageValue = bgImageUrl
    ? `url("${bgImageUrl}")`
    : (colors.backgroundGradient || 'none');
  root.style.setProperty('--theme-bg-image', bgImageValue);

  // Opacity settings
  const themeOpacity = typeof colors.bgOpacity === 'number' ? colors.bgOpacity : 0.85;
  root.style.setProperty('--theme-opacity', String(themeOpacity));
  root.style.setProperty('--bg-image-opacity', String(themeOpacity));

  // Solid fallbacks for legacy glass variables so UI surfaces never turn transparent
  root.style.setProperty('--theme-bg-primary-glass', bgPrimary);
  root.style.setProperty('--theme-bg-sidebar-glass', bgSidebar);
  root.style.setProperty('--theme-bg-card-glass', bgCard);

  // Guarantee universal color emoji font fallback across all themes
  const withEmojiFallback = (font: string): string => {
    if (!font) return '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    if (font.includes('Color Emoji')) return font;
    const emojiStack = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
    if (/\b(sans-serif|serif|monospace)\b/.test(font)) {
      return font.replace(/\b(sans-serif|serif|monospace)\b/, `${emojiStack}, $1`);
    }
    return `${font}, ${emojiStack}, sans-serif`;
  };

  root.style.setProperty('--font-family', withEmojiFallback(colors.fontFamily));

  // Set Syntax Highlighting custom properties
  root.style.setProperty('--syntax-bg', colors.syntaxBg || colors.card);
  root.style.setProperty('--syntax-keyword', colors.syntaxKeyword || colors.primary);
  root.style.setProperty('--syntax-string', colors.syntaxString || colors.accent);
  root.style.setProperty('--syntax-function', colors.syntaxFunction || colors.accent);
  root.style.setProperty('--syntax-comment', colors.syntaxComment || '#6b7280');
  root.style.setProperty('--syntax-variable', colors.syntaxVariable || colors.foreground);
  root.style.setProperty('--syntax-number', colors.syntaxNumber || '#fb923c');
  root.style.setProperty('--syntax-operator', colors.syntaxOperator || colors.accent);

  if (bgImageUrl) {
    root.style.setProperty('--bg-image', `url("${bgImageUrl}")`);
  } else {
    root.style.removeProperty('--bg-image');
  }

  // Inject or update dynamic Google Font if requested
  if (colors.fontFamilyGoogleUrl) {
    let fontLink = document.getElementById('kite-dynamic-font') as HTMLLinkElement | null;
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'kite-dynamic-font';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    fontLink.href = colors.fontFamilyGoogleUrl;
  }
}
