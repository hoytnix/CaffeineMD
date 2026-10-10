import { Node, mergeAttributes } from '@tiptap/core';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';

export const WikiLinkPluginKey = new PluginKey('wikiLinkSuggestion');

export interface WikiLinkOptions {
  suggestion: Partial<SuggestionOptions>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiLink: {
      setWikiLink: (attributes: { target: string; alias?: string }) => ReturnType;
    };
  }
}

export const WikiLinkNode = Node.create<WikiLinkOptions>({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      target: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-target'),
        renderHTML: (attributes) => ({
          'data-target': attributes.target,
        }),
      },
      alias: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-alias'),
        renderHTML: (attributes) => ({
          'data-alias': attributes.alias,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wikilink]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            target: element.getAttribute('data-wikilink') || element.getAttribute('data-target'),
            alias: element.getAttribute('data-alias'),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const target = node.attrs.target || '';
    const alias = node.attrs.alias || target;
    return [
      'span',
      mergeAttributes(
        {
          class:
            'wiki-link inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer px-1 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors',
          'data-wikilink': target,
        },
        HTMLAttributes
      ),
      `[[${alias}]]`,
    ];
  },

  renderText({ node }) {
    if (node.attrs.alias && node.attrs.alias !== node.attrs.target) {
      return `[[${node.attrs.target}|${node.attrs.alias}]]`;
    }
    return `[[${node.attrs.target}]]`;
  },

  addOptions() {
    return {
      suggestion: {
        char: '[[',
        pluginKey: WikiLinkPluginKey,
      } as Partial<SuggestionOptions>,
    };
  },

  addCommands() {
    return {
      setWikiLink:
        (attributes) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: attributes,
            })
            .run();
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        pluginKey: this.options.suggestion.pluginKey || WikiLinkPluginKey,
      }),
    ];
  },
});
