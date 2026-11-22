/**
 * `bun run check:colors` (src/scripts/themes/checkColors.ts): do the Cool Islands themes color code like the JetBrains
 * IDE? Samples in `test/colors/` are split into tokens with the grammars of a real VS Code, and each token an
 * expectation names must get the style the IDE draws its attribute key with. Pure functions: the script reads the
 * files and runs the tokenizer.
 */
import { compareCodeUnits } from 'src/helpers/utils';

import { fontStyle, styleOf } from './convertJetbrainsTheme';
import { fallbackChain, KEY_FALLBACKS } from './jetbrainsFallbacks';
import { mergeAttributes, selectorScore } from './textMateTheme';

import type { ResolvedScheme, SchemeChainData } from './jetbrainsTheme';

// The metadata of a token of vscode-textmate (`EncodedTokenAttributes`, not exported by the package):
// bits 11-14 the font style, bits 15-23 the index of the foreground in the color map
const FONT_STYLE_OFFSET = 11;
const FONT_STYLE_MASK = 0b1111;
const FOREGROUND_OFFSET = 15;
const FOREGROUND_MASK = 0b1_1111_1111;
const FONT_STYLE_BITS: Array<[number, string]> = [
  [1, 'italic'],
  [2, 'bold'],
  [4, 'underline'],
  [8, 'strikethrough'],
];

/** The structure scopes most themes do not color: left out of the list of scopes no rule colors */
const STRUCTURE_SCOPE = /^(meta|punctuation|source|text)(\.|$)/;

const sameStyle = (first: TokenStyle, second: TokenStyle) =>
  first.foreground === second.foreground && first.fontStyle === second.fontStyle;

/** Whether a scope selector part (`entity.name`) matches a scope (`entity.name.function.python`): whole segments */
const partMatches = (part: string, scope: string) => scope === part || scope.startsWith(`${part}.`);

const selectorParts = (selector: string) => selector.trim().split(/\s+/);

/** Written by `bun run sync:colors`: color theme label -> its editor scheme and the attributes of that scheme chain */
export const ATTRIBUTES_FILE = 'test/colors/jetbrains-attributes.json';
/** The samples (`<name>.<ext>`) and their expectations (`<name>.expect.json`) */
export const SAMPLES_FOLDER = 'test/colors';

/** An editor scheme and its parents, as `schemeChainData` gives them */
export type SchemeChain = SchemeChainData;

/**
 * A token of a sample and the key the highlighter of the IDE gives it (`JAVA_STRING`); its fallbacks come from
 * `KEY_FALLBACKS`.
 */
export type Expectation = {
  key: string;
  /**
   * A language the IDE draws with a TextMate grammar (textMateTheme.ts): the keys of the other rules that match the
   * scope, under `key`, the nearest first. Their font styles add up; the color is the top one that has one.
   */
  layers?: string[];
  /** 1-based line of the sample */
  line: number;
  /** Which occurrence of `text` on the line, 1-based (default 1) */
  nth?: number;
  text: string;
  /** A known difference, still to be fixed: reported, not a failure */
  todo?: string;
  /**
   * A difference that stays with the semantic tokens of the language server built into VS Code (`check:semantic`), and
   * why; `todo` is the one of the TextMate colors alone
   */
  semantic?: string;
  /** The key of the layer the highlighter puts under it, which shows when `key` has no color (a reST literal: a string) */
  under?: string;
};

export type SampleExpectations = {
  /** The sample file, beside the expectation file */
  file: string;
  /** Root scope of the grammar, e.g. `source.java` */
  scope: string;
  tokens: Expectation[];
};

/** A style as VS Code draws a token: `#rrggbb` and the words of `fontStyle` in a fixed order ('' when plain) */
export type TokenStyle = { fontStyle: string; foreground: string };

/** A token of a line: where it is and its scopes, outermost first */
export type LineToken = { end: number; metadata: number; scopes: string[]; start: number };

/**
 * The style the IDE draws a key with: the first attributes of the key and its fallbacks in the order of the IDE
 * (`ResolvedScheme.lookup`). Attributes without a color are drawn in the text color (`TEXT`), as the editor does.
 * @returns undefined when the scheme defines neither the key nor a fallback of it (a key the IDE does not have)
 */
export const expectedStyle = (
  scheme: ResolvedScheme,
  key: string,
  under?: string,
  fallbacks: Record<string, string> = KEY_FALLBACKS,
  layers: string[] = [],
): TokenStyle | undefined => {
  // A key of the IDE code that no scheme defines (nor its fallbacks) is drawn with the default attributes: text
  const drawn = (name: string) => [...scheme.lookup(fallbackChain(name, fallbacks)), ...(name in fallbacks ? scheme.lookup(['TEXT']) : [])][0];
  const stack = [...layers].reverse().flatMap((layer) => drawn(layer) ?? []);
  const top = drawn(key);
  const attributes = layers.length > 0 ? mergeAttributes([...stack, ...(top ? [top] : [])]) : top;
  const foreground = attributes?.foreground ?? (under ? drawn(under)?.foreground : undefined) ?? scheme.attributes('TEXT')?.foreground;
  if (!attributes || !foreground) return undefined;
  return { fontStyle: fontStyle(styleOf(attributes)), foreground: foreground.toLowerCase().slice(0, 7) };
};

/**
 * The style of a token from its metadata.
 * @param colorMap `Registry.getColorMap()`: index -> color in upper case
 */
export const decodeStyle = (metadata: number, colorMap: string[]): TokenStyle => {
  const bits = (metadata >>> FONT_STYLE_OFFSET) & FONT_STYLE_MASK;
  const foreground = colorMap[(metadata >>> FOREGROUND_OFFSET) & FOREGROUND_MASK] ?? '';
  return {
    fontStyle: FONT_STYLE_BITS.filter(([bit]) => bits & bit)
      .map(([, word]) => word)
      .join(' '),
    foreground: foreground.toLowerCase().slice(0, 7),
  };
};

/**
 * The tokens that draw the `nth` occurrence of `text` on a line.
 * @returns undefined when the line does not have it
 */
export const tokensOf = (line: string, tokens: LineToken[], text: string, nth = 1): LineToken[] | undefined => {
  let start = -1;
  for (let found = 0; found < nth; found++) {
    start = line.indexOf(text, start + 1);
    if (start === -1) return undefined;
  }
  const end = start + text.length;
  return tokens.filter((token) => token.start < end && token.end > start);
};

export const describeStyle = (style: TokenStyle) => (style.fontStyle ? `${style.foreground} ${style.fontStyle}` : style.foreground);

/** What is wrong with a token, or undefined when every part of it has the expected style */
export const compareStyles = (expected: TokenStyle, actual: TokenStyle[]): string | undefined => {
  if (actual.every((style) => sameStyle(style, expected))) return undefined;
  const got = [...new Set(actual.map((style) => describeStyle(style)))].join(' + ');
  return `expected ${describeStyle(expected)}, got ${got}`;
};

/** The name of the token rule that colors a scope stack (the most specific, the later one on a tie), for the report */
export const winningRule = (rules: Array<{ name: string; scope: string[] }>, scopes: string[]): string | undefined => {
  let best: { name: string; score: number } | undefined;
  for (const rule of rules) {
    for (const selector of rule.scope) {
      const score = selectorScore(selector, scopes);
      if (score >= 0 && (!best || score >= best.score)) best = { name: rule.name, score };
    }
  }
  return best?.name;
};

/**
 * Every scope name a grammar file gives (`name`, `contentName`, the names of captures), without `$1` patterns and the
 * display name of the grammar ("Batch File": a scope starts with a lower case letter)
 */
export const grammarScopes = (grammar: string): string[] => {
  const names = new Set<string>();
  for (const match of grammar.matchAll(/"(?:name|contentName)"\s*:\s*"([^"]+)"/g)) {
    for (const name of match[1].split(/\s+/)) {
      if (/^[a-z]/.test(name) && !name.includes('$')) names.add(name);
    }
  }
  return [...names].sort(compareCodeUnits);
};

/**
 * The selector parts of the token rules that no grammar gives (a typo, or a scope a grammar dropped).
 * @param known scopes of all grammars
 * @param external language suffixes of grammars VS Code does not bundle (`.toml`): never reported
 */
export const missingRuleScopes = (rules: Array<{ name: string; scope: string[] }>, known: string[], external: string[]): string[] => {
  const missing = new Set<string>();
  for (const rule of rules) {
    for (const part of rule.scope.flatMap((selector) => selectorParts(selector))) {
      if (external.some((suffix) => part.endsWith(suffix) || part.includes(`${suffix}.`))) continue;
      if (!known.some((scope) => partMatches(part, scope))) missing.add(`${rule.name}: ${part}`);
    }
  }
  return [...missing].sort(compareCodeUnits);
};

/** The scopes of a grammar that no rule colors (the structure scopes left out): the candidates for a new rule */
export const uncoloredScopes = (rules: Array<{ scope: string[] }>, scopes: string[]): string[] => {
  const lastParts = rules.flatMap((rule) => rule.scope.map((selector) => selectorParts(selector).at(-1)!));
  return scopes.filter((scope) => !STRUCTURE_SCOPE.test(scope) && !lastParts.some((part) => partMatches(part, scope)));
};
