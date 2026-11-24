/**
 * How VS Code styles a semantic token with a color theme, for `bun run check:semantic` (src/scripts/themes/checkSemantic.ts).
 * A port of microsoft/vscode:
 * - src/vs/platform/theme/common/tokenClassificationRegistry.ts: the selectors (`type.modifier:language`) and their
 *   score, the token types and the default rules (`registerTokenType` scopes to probe, `registerTokenStyleDefault`);
 * - src/vs/workbench/services/themes/common/colorThemeData.ts: `getTokenStyle` (the `semanticTokenColors` of the
 *   theme, then for the properties they leave unset the default rules, whose scopes are probed in the `tokenColors`
 *   of the theme by `resolveScopes`) and `nameMatcher`;
 * - src/vs/editor/common/services/semanticTokensProviderStyling.ts: a style replaces only the properties it sets on
 *   the TextMate style of the token.
 * Those parts: Copyright (c) Microsoft Corporation, MIT License (the text is in THIRD-PARTY-NOTICES.md, "Code in the
 * repository only"). Used only by the check script: not in the extension package.
 */
import type { TokenStyle } from './colorCheck';

/** A semantic token: its type and modifiers from the legend of the provider, and the language of the document */
type SemanticClass = { language: string; modifiers: string[]; type: string };

/** What a style sets: undefined leaves the property to the TextMate style */
type SemanticStyle = { bold?: boolean; foreground?: string; italic?: boolean; strikethrough?: boolean; underline?: boolean };

/** A `semanticTokenColors` value of a theme */
type SemanticSetting = string | { bold?: boolean; fontStyle?: string; foreground?: string; italic?: boolean; strikethrough?: boolean; underline?: boolean };

/** A rule of `tokenColors` */
type TokenColorRule = { scope?: string[] | string; settings: { fontStyle?: string; foreground?: string } };

/** A default rule: a selector and the scopes to look up in the `tokenColors` of the theme (each one a list of scopes) */
type DefaultRule = { scopesToProbe: string[][]; selector: string };

type Selector = { language?: string; modifiers: string[]; type: string };

const WILDCARD = '*';

/** `type.modifier.modifier:language` */
const parseSelector = (text: string, defaultLanguage?: string): Selector => {
  const [classifier, language] = text.split(':');
  const [type, ...modifiers] = classifier.split('.');
  return { language: language ?? defaultLanguage, modifiers, type };
};

/**
 * The score of a selector for a token, -1 when it does not match: 10 for its language, 100 minus the depth of its
 * type in the hierarchy of the token type (none for `*`), 100 for each of its modifiers (all must be on the token).
 * @param superTypes the super type of a token type (`member` -> `method`, and those the extensions contribute)
 */
const selectorScore = (selector: Selector, token: SemanticClass, superTypes: Record<string, string> = SUPER_TYPES): number => {
  let score = 0;
  if (selector.language !== undefined) {
    if (selector.language !== token.language) return -1;
    score += 10;
  }
  if (selector.type !== WILDCARD) {
    const hierarchy = [token.type];
    for (let type = superTypes[token.type]; type && !hierarchy.includes(type); type = superTypes[type]) hierarchy.push(type);
    const level = hierarchy.indexOf(selector.type);
    if (level === -1) return -1;
    score += 100 - level;
  }
  if (selector.modifiers.some((modifier) => !token.modifiers.includes(modifier))) return -1;
  return score + selector.modifiers.length * 100;
};

/** `TokenStyle.fromSettings`: a `fontStyle` string sets every font property, true for the words it has */
const fromSettings = (setting: SemanticSetting): SemanticStyle => {
  if (typeof setting === 'string') return { foreground: setting };
  const style: SemanticStyle = { foreground: setting.foreground };
  if (typeof setting.fontStyle === 'string') {
    const words = setting.fontStyle.split(/\s+/);
    style.bold = words.includes('bold');
    style.italic = words.includes('italic');
    style.underline = words.includes('underline');
    style.strikethrough = words.includes('strikethrough');
  }
  for (const property of ['bold', 'italic', 'underline', 'strikethrough'] as const) {
    if (typeof setting[property] === 'boolean') style[property] = setting[property];
  }
  return style;
};

/** `nameMatcher` of colorThemeData.ts: every part of a selector matches one of the scopes (whole segments) */
const scopesAreMatching = (scope: string, selector: string) => scope === selector || (scope.startsWith(selector) && scope[selector.length] === '.');

const nameScore = (selector: string, scopes: string[]): number => {
  const parts = selector.trim().split(/\s+/);
  if (scopes.length < parts.length) return -1;
  let score = -1;
  for (const part of parts) {
    let index = scopes.length - 1;
    while (index >= 0 && !scopesAreMatching(scopes[index], part)) index--;
    if (index === -1) return -1;
    score = (index + 1) * 0x1_00_00 + part.length;
  }
  return score;
};

/** `resolveScopes`: the first probe that a rule of `tokenColors` styles, its best foreground and font style */
const resolveScopes = (probes: string[][], rules: TokenColorRule[]): SemanticStyle | undefined => {
  for (const probe of probes) {
    let foreground: string | undefined;
    let fontStyle: string | undefined;
    let foregroundScore = -1;
    let fontStyleScore = -1;
    for (const rule of rules) {
      const selectors = rule.scope === undefined ? [] : (Array.isArray(rule.scope) ? rule.scope : rule.scope.split(','));
      const score = Math.max(-1, ...selectors.map((selector) => nameScore(selector, probe)));
      if (score < 0) continue;
      if (score >= foregroundScore && rule.settings.foreground) [foreground, foregroundScore] = [rule.settings.foreground, score];
      if (score >= fontStyleScore && typeof rule.settings.fontStyle === 'string') [fontStyle, fontStyleScore] = [rule.settings.fontStyle, score];
    }
    if (foreground !== undefined || fontStyle !== undefined) return fromSettings({ fontStyle, foreground });
  }
  return undefined;
};

/** Super types of the token types VS Code registers */
const SUPER_TYPES: Record<string, string> = { member: 'method' };

/** The default rules VS Code registers, in its order (`registerTokenType` with scopes to probe, then `registerTokenStyleDefault`) */
const DEFAULT_RULES: DefaultRule[] = [
  { scopesToProbe: [['comment']], selector: 'comment' },
  { scopesToProbe: [['string']], selector: 'string' },
  { scopesToProbe: [['keyword.control']], selector: 'keyword' },
  { scopesToProbe: [['constant.numeric']], selector: 'number' },
  { scopesToProbe: [['constant.regexp']], selector: 'regexp' },
  { scopesToProbe: [['keyword.operator']], selector: 'operator' },
  { scopesToProbe: [['entity.name.namespace']], selector: 'namespace' },
  { scopesToProbe: [['entity.name.type'], ['support.type']], selector: 'type' },
  { scopesToProbe: [['entity.name.type.struct']], selector: 'struct' },
  { scopesToProbe: [['entity.name.type.class'], ['support.class']], selector: 'class' },
  { scopesToProbe: [['entity.name.type.interface']], selector: 'interface' },
  { scopesToProbe: [['entity.name.type.enum']], selector: 'enum' },
  { scopesToProbe: [['entity.name.type.parameter']], selector: 'typeParameter' },
  { scopesToProbe: [['entity.name.function'], ['support.function']], selector: 'function' },
  { scopesToProbe: [['entity.name.function.member'], ['support.function']], selector: 'method' },
  { scopesToProbe: [['entity.name.function.preprocessor']], selector: 'macro' },
  { scopesToProbe: [['variable.other.readwrite'], ['entity.name.variable']], selector: 'variable' },
  { scopesToProbe: [['variable.parameter']], selector: 'parameter' },
  { scopesToProbe: [['variable.other.property']], selector: 'property' },
  { scopesToProbe: [['variable.other.enummember']], selector: 'enumMember' },
  { scopesToProbe: [['variable.other.event']], selector: 'event' },
  { scopesToProbe: [['entity.name.decorator'], ['entity.name.function']], selector: 'decorator' },
  { scopesToProbe: [['variable.other.constant']], selector: 'variable.readonly' },
  { scopesToProbe: [['variable.other.constant.property']], selector: 'property.readonly' },
  { scopesToProbe: [['support.type']], selector: 'type.defaultLibrary' },
  { scopesToProbe: [['support.class']], selector: 'class.defaultLibrary' },
  { scopesToProbe: [['support.class']], selector: 'interface.defaultLibrary' },
  { scopesToProbe: [['support.variable'], ['support.other.variable']], selector: 'variable.defaultLibrary' },
  { scopesToProbe: [['support.constant']], selector: 'variable.defaultLibrary.readonly' },
  { scopesToProbe: [['support.variable.property']], selector: 'property.defaultLibrary' },
  { scopesToProbe: [['support.constant.property']], selector: 'property.defaultLibrary.readonly' },
  { scopesToProbe: [['support.function']], selector: 'function.defaultLibrary' },
  { scopesToProbe: [['support.function']], selector: 'member.defaultLibrary' },
];

/**
 * The style VS Code gives a semantic token (`getTokenStyle`): the properties set by the best `semanticTokenColors`
 * selector (a later one wins a tie), then, if a property is still unset, the default rules whose scopes the theme styles.
 * @param defaults the default rules of VS Code, then those of the extensions (`semanticTokenScopes`, their language set)
 */
const semanticStyle = (
  token: SemanticClass,
  semanticTokenColors: Record<string, SemanticSetting>,
  tokenColors: TokenColorRule[],
  defaults: DefaultRule[] = DEFAULT_RULES,
  superTypes: Record<string, string> = SUPER_TYPES,
): SemanticStyle => {
  const result: SemanticStyle = {};
  const score: Record<keyof SemanticStyle, number> = { bold: -1, foreground: -1, italic: -1, strikethrough: -1, underline: -1 };
  const process = (matchScore: number, style: SemanticStyle) => {
    if (style.foreground && score.foreground <= matchScore) [score.foreground, result.foreground] = [matchScore, style.foreground];
    for (const property of ['bold', 'underline', 'strikethrough', 'italic'] as const) {
      if (style[property] !== undefined && score[property] <= matchScore) [score[property], result[property]] = [matchScore, style[property]];
    }
  };
  for (const [selector, setting] of Object.entries(semanticTokenColors)) {
    const matchScore = selectorScore(parseSelector(selector), token, superTypes);
    if (matchScore >= 0) process(matchScore, fromSettings(setting));
  }
  if (Object.values(score).includes(-1)) {
    for (const key of Object.keys(score) as Array<keyof SemanticStyle>) if (score[key] !== -1) score[key] = Number.MAX_VALUE;
    for (const rule of defaults) {
      const matchScore = selectorScore(parseSelector(rule.selector), token, superTypes);
      if (matchScore < 0) continue;
      const style = resolveScopes(rule.scopesToProbe, tokenColors);
      if (style) process(matchScore, style);
    }
  }
  return result;
};

/** The TextMate style of a token with what a semantic style sets on it (semanticTokensProviderStyling.ts) */
const applySemanticStyle = (textMate: TokenStyle, style: SemanticStyle): TokenStyle => {
  const words = new Set(textMate.fontStyle.split(' ').filter(Boolean));
  for (const property of ['italic', 'bold', 'underline', 'strikethrough'] as const) {
    if (style[property] === true) words.add(property);
    if (style[property] === false) words.delete(property);
  }
  return {
    fontStyle: ['italic', 'bold', 'underline', 'strikethrough'].filter((word) => words.has(word)).join(' '),
    foreground: style.foreground ? style.foreground.toLowerCase().slice(0, 7) : textMate.foreground,
  };
};

/** A semantic token of a document: 0-based line and character */
type SemanticToken = SemanticClass & { character: number; length: number; line: number };

/** The tokens of `vscode.provideDocumentSemanticTokens` (5 numbers each, relative positions) with their legend */
const decodeSemanticTokens = (data: number[], legend: { tokenModifiers: string[]; tokenTypes: string[] }, language: string): SemanticToken[] => {
  const tokens: SemanticToken[] = [];
  let line = 0;
  let character = 0;
  for (let index = 0; index + 4 < data.length; index += 5) {
    const [deltaLine, deltaStart, length, type, modifierBits] = data.slice(index, index + 5);
    line += deltaLine;
    character = deltaLine === 0 ? character + deltaStart : deltaStart;
    const modifiers = legend.tokenModifiers.filter((_, bit) => modifierBits & (1 << bit));
    tokens.push({ character, language, length, line, modifiers, type: legend.tokenTypes[type] });
  }
  return tokens;
};

export { applySemanticStyle, decodeSemanticTokens, DEFAULT_RULES, parseSelector, resolveScopes, selectorScore, semanticStyle, SUPER_TYPES };
export type { DefaultRule, SemanticClass, SemanticSetting, SemanticStyle, SemanticToken, TokenColorRule };
