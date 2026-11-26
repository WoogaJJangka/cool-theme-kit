/**
 * Build a VS Code color theme from a resolved JetBrains UI theme and editor color scheme, with the hand-kept maps.
 */
import { fallbackChain } from './jetbrainsFallbacks';
import { SEMANTIC_RULES, TOKEN_RULES } from './jetbrainsTokenMap';
import { UI_MAP } from './jetbrainsUiMap';
import { selectorScore, TEXTMATE_LANGUAGES, textMateAttributes, textMateScopes } from './textMateTheme';
import { withTranslucentHighlights } from './translucent';

import type { ResolvedScheme, ResolvedUiTheme, TextAttributes } from './jetbrainsTheme';
import type { ColorSource } from './jetbrainsUiMap';
import type { TokenRule } from './jetbrainsTokenMap';

/** `textMateLanguages`: the languages drawn like the TextMate plugin of the IDE (default: TEXTMATE_LANGUAGES, none with own `tokens`) */
type Maps = { semantic?: Record<string, string[]>; textMateLanguages?: string[]; tokens?: TokenRule[]; ui?: Record<string, ColorSource[]> };

const ATTRIBUTE_FIELDS: Record<string, keyof TextAttributes> = {
  bg: 'background',
  effect: 'effectColor',
  fg: 'foreground',
  stripe: 'errorStripe',
};

const UNDERLINED = new Set([1, 4]);
const STRIKEOUT = 3;

const styleOf = (attributes: TextAttributes): SemanticStyle => ({
  bold: Boolean((attributes.fontType ?? 0) & 1),
  italic: Boolean((attributes.fontType ?? 0) & 2),
  // The IDE draws an effect only with its color: Islands gives PROPERTIES.KEY an underline type and no color (no line on screen)
  strikethrough: attributes.effectType === STRIKEOUT && attributes.effectColor !== undefined,
  underline: attributes.effectType !== undefined && UNDERLINED.has(attributes.effectType) && attributes.effectColor !== undefined,
});

/**
 * Syntax: the font style of the first attributes found for the keys, the color of the first ones with a color (a key
 * without one shows the layer under it). `undefined` when the scheme defines none of the keys.
 */
const textStyle = (lookup: (keys: string[]) => TextAttributes[], keys: string[]): SemanticStyle | undefined => {
  const defined = lookup(keys);
  if (defined.length === 0) return undefined;
  const style = styleOf(defined[0]);
  const foreground = defined.find((value) => value.foreground)?.foreground;
  return foreground ? { ...style, foreground } : style;
};

const fontStyle = (style: SemanticStyle) =>
  (['italic', 'bold', 'underline', 'strikethrough'] as const).filter((key) => style[key]).join(' ');

export type TokenColor = { name: string; scope: string[]; settings: { fontStyle?: string; foreground?: string } };
export type SemanticStyle = {
  bold?: boolean;
  foreground?: string;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
};

export type VsCodeColorTheme = {
  $schema: string;
  colors: Record<string, string>;
  name: string;
  semanticHighlighting: boolean;
  semanticTokenColors: Record<string, SemanticStyle>;
  tokenColors: TokenColor[];
  type: 'dark' | 'light';
};

export type ConversionResult = {
  theme: VsCodeColorTheme;
  /** Map entries that got no value (VS Code default) */
  unresolved: string[];
};

export const convertJetbrainsTheme = (
  name: string,
  ui: ResolvedUiTheme,
  scheme: ResolvedScheme,
  maps: Maps = {},
): ConversionResult => {
  const uiMap = maps.ui ?? UI_MAP;
  const unresolved: string[] = [];

  // Workbench colors, with `=id` references resolved on demand
  const colors: Record<string, string> = {};
  const done = new Set<string>();
  const resolveId = (id: string, stack: string[] = []): string | undefined => {
    if (done.has(id)) return colors[id];
    if (stack.includes(id)) throw new Error(`Color reference loop: ${[...stack, id].join(' -> ')}`);
    const sources = uiMap[id];
    if (!sources) throw new Error(`Unknown color reference: ${id}`);
    let value: string | undefined;
    for (const source of sources) {
      value = resolveSource(source, [...stack, id]);
      if (value) break;
    }
    done.add(id);
    if (value) colors[id] = value;
    return value;
  };
  const resolveSource = (source: ColorSource, stack: string[]): string | undefined => {
    if (source.startsWith('#')) return source.toLowerCase();
    if (source.startsWith('=')) return resolveId(source.slice(1), stack);
    const separator = source.indexOf(':');
    const kind = source.slice(0, separator);
    const key = source.slice(separator + 1);
    if (kind === 'ui') return ui.get(key);
    if (kind === 'color') return scheme.color(key);
    const field = ATTRIBUTE_FIELDS[kind];
    if (!field) throw new Error(`Unknown color source: ${source}`);
    const value = scheme.attributes(key)?.[field];
    return typeof value === 'string' ? value : undefined;
  };
  for (const id of Object.keys(uiMap)) {
    if (!resolveId(id)) unresolved.push(id);
  }

  // Each key of a rule drawn as the IDE draws it: the first attributes of the key and its fallbacks in the order of the
  // IDE (KEY_FALLBACKS, `ResolvedScheme.lookup`), the way `bun run check:colors` checks. The next keys of the rule are the
  // layers under it, which show when those attributes have no color (a Markdown quote: text, not its STRING fallback)
  const byKey = (keys: string[]) => keys.flatMap((key) => scheme.lookup(fallbackChain(key)).slice(0, 1));

  const tokenColors: TokenColor[] = [];
  for (const rule of maps.tokens ?? TOKEN_RULES) {
    const style = textStyle(byKey, rule.from);
    if (!style) {
      unresolved.push(`token: ${rule.name}`);
      continue;
    }
    const settings: TokenColor['settings'] = { fontStyle: fontStyle(style) };
    if (style.foreground) settings.foreground = style.foreground;
    tokenColors.push({ name: rule.name, scope: rule.scope, settings });
  }

  // Languages the IDE draws with TextMate grammars (textMateTheme.ts): one rule per scope, for every such language. A
  // rule with parent scopes takes what it leaves unset from the rule of the same scope without them (vscode-textmate
  // `ThemeTrieElement`), so the color is always written: the text color when no layer has one. A language gets the rule
  // only when the other rules draw the scope differently there (the theme json is parsed by VS Code: keep it small)
  const tokenRules = maps.tokens ?? TOKEN_RULES;
  const languages = maps.textMateLanguages ?? (maps.tokens ? [] : TEXTMATE_LANGUAGES);
  const text = scheme.lookup(['TEXT'])[0]?.foreground;
  const resolveKey = (key: string) => scheme.lookup(fallbackChain(key))[0];
  const ownRules = [...tokenColors];
  /**
   * The value the rules above give the last scope of a stack: the most specific rule that sets it, like vscode-textmate.
   * Only rules that match that scope count: without one, the token takes the color of its parents (a variable in a string)
   */
  const ownValue = (scopes: string[], setting: 'fontStyle' | 'foreground') => {
    let value: string | undefined;
    let best = (scopes.length - 1) * 10_000 - 1;
    for (const rule of ownRules) {
      if (rule.settings[setting] === undefined) continue;
      for (const selector of rule.scope) {
        const score = selectorScore(selector, scopes);
        if (score >= 0 && score >= best) [best, value] = [score, rule.settings[setting]];
      }
    }
    return value;
  };
  for (const scope of languages.length > 0 ? textMateScopes(tokenRules.flatMap((rule) => rule.scope)) : []) {
    const attributes = textMateAttributes(scope, resolveKey);
    const foreground = attributes?.foreground ?? text;
    if (!attributes || !foreground) continue;
    const settings = { fontStyle: fontStyle(styleOf(attributes)), foreground };
    const differs = (language: string) => {
      const scopes = [language, ...scope.split(' ')];
      return ownValue(scopes, 'fontStyle') !== settings.fontStyle || ownValue(scopes, 'foreground')?.toLowerCase() !== foreground.toLowerCase();
    };
    const where = languages.filter((language) => differs(language));
    if (where.length > 0) tokenColors.push({ name: `TextMate ${scope}`, scope: where.map((language) => `${language} ${scope}`), settings });
  }

  const semanticTokenColors: Record<string, SemanticStyle> = {};
  for (const [selector, keys] of Object.entries(maps.semantic ?? SEMANTIC_RULES)) {
    const style = textStyle(byKey, keys);
    if (!style) {
      unresolved.push(`semantic: ${selector}`);
      continue;
    }
    semanticTokenColors[selector] = style;
  }

  return {
    theme: {
      $schema: 'vscode://schemas/color-theme',
      colors: withTranslucentHighlights(colors),
      name,
      semanticHighlighting: true,
      semanticTokenColors,
      tokenColors,
      type: ui.dark ? 'dark' : 'light',
    },
    unresolved,
  };
};

export { fontStyle, styleOf };
