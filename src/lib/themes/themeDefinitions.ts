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

export const THEME_PRESETS: ThemeDefinition[] = [
  {
    id: 'dark',
    name: 'Dark (Obsidian)',
    description: 'Deep obsidian slate with indigo accents',
    isDark: true,
    background: '#090a0f',
    foreground: '#f3f4f6',
    card: '#12131a',
    border: '#232530',
    accent: '#6366f1',
    primary: '#4f46e5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    syntaxBg: '#12131a',
    syntaxKeyword: '#c084fc',
    syntaxString: '#a7f3d0',
    syntaxFunction: '#60a5fa',
    syntaxComment: '#6b7280',
    syntaxVariable: '#f472b6',
    syntaxNumber: '#fb923c',
    syntaxOperator: '#818cf8',
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Clean crisp paper with indigo accents',
    isDark: false,
    background: '#ffffff',
    foreground: '#0f172a',
    card: '#f8fafc',
    border: '#e2e8f0',
    accent: '#4f46e5',
    primary: '#4338ca',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    syntaxBg: '#f8fafc',
    syntaxKeyword: '#7c3aed',
    syntaxString: '#059669',
    syntaxFunction: '#2563eb',
    syntaxComment: '#64748b',
    syntaxVariable: '#db2777',
    syntaxNumber: '#ea580c',
    syntaxOperator: '#4f46e5',
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    description: 'Warm parchment with precision cyan & amber tones',
    isDark: false,
    background: '#fdf6e3',
    foreground: '#586e75',
    card: '#eee8d5',
    border: '#e0d9c4',
    accent: '#268bd2',
    primary: '#2aa198',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    syntaxBg: '#eee8d5',
    syntaxKeyword: '#859900',
    syntaxString: '#2aa198',
    syntaxFunction: '#268bd2',
    syntaxComment: '#93a1a1',
    syntaxVariable: '#cb4b16',
    syntaxNumber: '#b58900',
    syntaxOperator: '#6c71c4',
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: 'Signature teal-tinted low-contrast dark palette',
    isDark: true,
    background: '#002b36',
    foreground: '#839496',
    card: '#073642',
    border: '#0b4654',
    accent: '#2aa198',
    primary: '#268bd2',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    syntaxBg: '#073642',
    syntaxKeyword: '#859900',
    syntaxString: '#2aa198',
    syntaxFunction: '#268bd2',
    syntaxComment: '#586e75',
    syntaxVariable: '#cb4b16',
    syntaxNumber: '#b58900',
    syntaxOperator: '#6c71c4',
  },
  {
    id: 'monokai',
    name: 'Monokai',
    description: 'Vibrant lime and magenta on charcoal base',
    isDark: true,
    background: '#272822',
    foreground: '#f8f8f2',
    card: '#1e1f1c',
    border: '#3e3d32',
    accent: '#a6e22e',
    primary: '#f92672',
    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
    syntaxBg: '#1e1f1c',
    syntaxKeyword: '#f92672',
    syntaxString: '#e6db74',
    syntaxFunction: '#a6e22e',
    syntaxComment: '#75715e',
    syntaxVariable: '#fd971f',
    syntaxNumber: '#ae81ff',
    syntaxOperator: '#f92672',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy pine and moss hues for calm focus',
    isDark: true,
    background: '#0c1a14',
    foreground: '#e2f1e7',
    card: '#13281f',
    border: '#1f3d30',
    accent: '#34d399',
    primary: '#10b981',
    fontFamily: 'system-ui, sans-serif',
    syntaxBg: '#13281f',
    syntaxKeyword: '#34d399',
    syntaxString: '#a7f3d0',
    syntaxFunction: '#6ee7b7',
    syntaxComment: '#4b7361',
    syntaxVariable: '#fcd34d',
    syntaxNumber: '#fbbf24',
    syntaxOperator: '#10b981',
  },
  {
    id: 'seahorse',
    name: 'Seahorse',
    description: 'Aquatic teal waters with pink coral highlights',
    isDark: true,
    background: '#0e1a24',
    foreground: '#e0f2fe',
    card: '#162838',
    border: '#223f57',
    accent: '#38bdf8',
    primary: '#f472b6',
    fontFamily: 'system-ui, sans-serif',
    syntaxBg: '#162838',
    syntaxKeyword: '#f472b6',
    syntaxString: '#38bdf8',
    syntaxFunction: '#818cf8',
    syntaxComment: '#52728c',
    syntaxVariable: '#fb7185',
    syntaxNumber: '#34d399',
    syntaxOperator: '#38bdf8',
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    description: 'Midnight navy oceanic tones with electric cyan',
    isDark: true,
    background: '#070f1e',
    foreground: '#e2e8f0',
    card: '#0f1d33',
    border: '#1e3355',
    accent: '#06b6d4',
    primary: '#3b82f6',
    fontFamily: 'system-ui, sans-serif',
    syntaxBg: '#0f1d33',
    syntaxKeyword: '#06b6d4',
    syntaxString: '#7dd3fc',
    syntaxFunction: '#60a5fa',
    syntaxComment: '#47678e',
    syntaxVariable: '#a5b4fc',
    syntaxNumber: '#38bdf8',
    syntaxOperator: '#0ea5e9',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    description: 'Modern fluent gray cards with signature enterprise blue',
    isDark: false,
    background: '#f3f4f6',
    foreground: '#18181b',
    card: '#ffffff',
    border: '#e4e4e7',
    accent: '#0078d4',
    primary: '#107c41',
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
    syntaxBg: '#f8fafc',
    syntaxKeyword: '#0078d4',
    syntaxString: '#107c41',
    syntaxFunction: '#5c2d91',
    syntaxComment: '#605e5c',
    syntaxVariable: '#d83b01',
    syntaxNumber: '#b4009e',
    syntaxOperator: '#2b579a',
  },
  {
    id: 'hacker',
    name: 'Hacker',
    description: 'Phosphor green CRT glow in pitch black void',
    isDark: true,
    background: '#040b07',
    foreground: '#00ff66',
    card: '#08170e',
    border: '#0d361c',
    accent: '#22c55e',
    primary: '#10b981',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    syntaxBg: '#08170e',
    syntaxKeyword: '#00ff66',
    syntaxString: '#86efac',
    syntaxFunction: '#22c55e',
    syntaxComment: '#166534',
    syntaxVariable: '#4ade80',
    syntaxNumber: '#bbf7d0',
    syntaxOperator: '#00ff66',
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Personalized user tokens or AI-generated theme',
    isDark: true,
    background: '#13131a',
    foreground: '#f4f4f5',
    card: '#1c1c26',
    border: '#2e2e3d',
    accent: '#a855f7',
    primary: '#8b5cf6',
    fontFamily: 'system-ui, sans-serif',
    syntaxBg: '#1c1c26',
    syntaxKeyword: '#c084fc',
    syntaxString: '#a7f3d0',
    syntaxFunction: '#60a5fa',
    syntaxComment: '#71717a',
    syntaxVariable: '#f472b6',
    syntaxNumber: '#fb923c',
    syntaxOperator: '#818cf8',
  },
];

export const DEFAULT_CUSTOM_THEME: ThemeDefinition = {
  id: 'custom',
  name: 'Custom Theme',
  description: 'Customized palette with optional background image',
  isDark: true,
  background: '#13131a',
  foreground: '#f4f4f5',
  card: '#1c1c26',
  border: '#2e2e3d',
  accent: '#a855f7',
  primary: '#8b5cf6',
  fontFamily: 'system-ui, sans-serif',
  syntaxBg: '#1c1c26',
  syntaxKeyword: '#c084fc',
  syntaxString: '#a7f3d0',
  syntaxFunction: '#60a5fa',
  syntaxComment: '#71717a',
  syntaxVariable: '#f472b6',
  syntaxNumber: '#fb923c',
  syntaxOperator: '#818cf8',
  backgroundImageUrl: '',
  bgOpacity: 0.25,
};

/**
 * Apply theme CSS variables and document classes
 */
export function applyThemeToDocument(theme: ThemeDefinition) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Toggle dark/light class for Tailwind compatibility
  if (theme.isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // Set CSS custom properties
  root.style.setProperty('--background', theme.background);
  root.style.setProperty('--foreground', theme.foreground);
  root.style.setProperty('--card', theme.card);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--font-family', theme.fontFamily);

  // Set Syntax Highlighting custom properties
  root.style.setProperty('--syntax-bg', theme.syntaxBg || theme.card);
  root.style.setProperty('--syntax-keyword', theme.syntaxKeyword || theme.primary);
  root.style.setProperty('--syntax-string', theme.syntaxString || theme.accent);
  root.style.setProperty('--syntax-function', theme.syntaxFunction || theme.accent);
  root.style.setProperty('--syntax-comment', theme.syntaxComment || '#6b7280');
  root.style.setProperty('--syntax-variable', theme.syntaxVariable || theme.foreground);
  root.style.setProperty('--syntax-number', theme.syntaxNumber || '#fb923c');
  root.style.setProperty('--syntax-operator', theme.syntaxOperator || theme.accent);

  if (theme.backgroundImageUrl) {
    root.style.setProperty('--bg-image', `url("${theme.backgroundImageUrl}")`);
  } else {
    root.style.removeProperty('--bg-image');
  }

  // Inject or update dynamic Google Font if requested
  if (theme.fontFamilyGoogleUrl) {
    let fontLink = document.getElementById('kite-dynamic-font') as HTMLLinkElement | null;
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'kite-dynamic-font';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    fontLink.href = theme.fontFamilyGoogleUrl;
  }
}
