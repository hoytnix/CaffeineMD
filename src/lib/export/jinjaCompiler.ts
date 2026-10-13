export interface TemplatePage {
  title: string;
  url: string;
  path: string;
  excerpt?: string;
  date?: string;
  [key: string]: any;
}

export interface TemplateContext {
  title: string;
  content: string;
  description?: string;
  date?: string;
  wordCount?: number;
  readingTime?: string;
  reading_time?: string;
  word_count?: number;
  isPwa?: boolean;
  is_pwa?: boolean;
  frontmatter?: Record<string, any>;
  pages?: TemplatePage[];
  notes?: Array<{ id: string; title: string; slug?: string; url?: string; [key: string]: any }>;
  folderName?: string;
  folder_name?: string;
  themeVars?: string;
  theme_vars?: string;
  [key: string]: any;
}

export function escapeHtml(str: string): string {
  return (str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[m] || m));
}

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((prev, curr) => {
    if (prev === null || prev === undefined) return undefined;
    if (prev[curr] !== undefined) return prev[curr];
    // Aliases: camelCase <-> snake_case
    const camel = curr.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
    if (prev[camel] !== undefined) return prev[camel];
    const snake = curr.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (prev[snake] !== undefined) return prev[snake];
    return undefined;
  }, obj);
}

function evaluateCondition(expr: string, context: TemplateContext): boolean {
  const trimmed = expr.trim();
  if (trimmed.includes('==')) {
    const [leftKey, rightValRaw] = trimmed.split('==').map((s) => s.trim());
    const leftVal = String(getNestedValue(context, leftKey) ?? '');
    const rightVal = rightValRaw.replace(/^['"]|['"]$/g, '');
    return leftVal === rightVal;
  }
  if (trimmed.includes('!=')) {
    const [leftKey, rightValRaw] = trimmed.split('!=').map((s) => s.trim());
    const leftVal = String(getNestedValue(context, leftKey) ?? '');
    const rightVal = rightValRaw.replace(/^['"]|['"]$/g, '');
    return leftVal !== rightVal;
  }
  if (trimmed.startsWith('!') || trimmed.startsWith('not ')) {
    const key = trimmed.replace(/^(!|not\s+)/, '').trim();
    return !Boolean(getNestedValue(context, key));
  }
  return Boolean(getNestedValue(context, trimmed));
}

export function renderJinjaTemplate(template: string, context: TemplateContext): string {
  let output = template;

  // 1. Process Conditionals (innermost first to support nesting)
  const ifRegex = /{%\s*if\s+([^%]+?)\s*%}((?:(?!{%\s*if)[\s\S])*?)(?:{%\s*else\s*%}((?:(?!{%\s*if)[\s\S])*?))?{%\s*endif\s*%}/g;
  let prevIf = '';
  while (prevIf !== output) {
    prevIf = output;
    output = output.replace(ifRegex, (_, condition, trueBranch, falseBranch = '') => {
      return evaluateCondition(condition, context) ? trueBranch : falseBranch;
    });
  }

  // 2. Process Loops: {% for item in collection %}...{% endfor %}
  output = output.replace(
    /{%\s*for\s+(\w+)\s+in\s+([\w.]+)\s*%}([\s\S]*?){%\s*endfor\s*%}/g,
    (_, loopVar, collectionKey, loopBody) => {
      const list = getNestedValue(context, collectionKey);
      if (!Array.isArray(list) || list.length === 0) return '';
      return list
        .map((item) => {
          const itemContext = { ...context, [loopVar]: item };
          return renderJinjaTemplate(loopBody, itemContext);
        })
        .join('');
    }
  );

  // 3. Process Variables: {{ variable }} or {{ variable | filter }}
  output = output.replace(/{{\s*([\w.]+)(?:\s*\|\s*(\w+))?\s*}}/g, (_, key, filter) => {
    let value = getNestedValue(context, key);
    if (value === undefined || value === null) return '';
    value = String(value);
    if (filter === 'escape') value = escapeHtml(value);
    else if (filter === 'lower') value = value.toLowerCase();
    else if (filter === 'upper') value = value.toUpperCase();
    else if (filter === 'trim') value = value.trim();
    return value;
  });

  return output;
}
