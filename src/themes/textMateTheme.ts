/**
 * Languages the JetBrains IDE draws with TextMate grammars, and the colors it gives their scopes.
 *
 * PyCharm has no plugin for Lua, Swift, Dart… and opens them with the TextMate bundles of VS Code that
 * intellij-community ships (plugins/textmate/lib/bundles: the same grammars as VS Code). Its TextMate plugin colors a
 * scope with `TextMateDefaultColorsProvider` + `TextMateTheme` (plugins/textmate/src/.../highlighting): every rule whose
 * selector matches the scope of a token gives a layer (`TextMateHighlighter.getTokenHighlights`, sorted by
 * `TextMateSelectorWeigherImpl`: the more specific selector on top), and the editor merges the layers like
 * `TextAttributes.merge`: the color of the top layer that has one, the font styles of all of them. A Lua number is
 * CONSTANT (purple italic) + NUMBER (teal) = teal italic (PyCharm 2026.3, 2026-11-21).
 *
 * VS Code takes a style from the deepest scope a rule matches, so the rules here are written for each language root
 * (`source.lua constant.numeric`) with the merged style, which wins over the rules of every language at that depth.
 */
import { compareCodeUnits } from 'src/helpers/utils';

import type { TextAttributes } from './jetbrainsTheme';

/**
 * Root scopes of the languages the IDE (PyCharm, the reference) draws with TextMate: VS Code grammars of languages
 * with no plugin in PyCharm (Go, Rust, C/C++, C#, Java, Ruby and PHP follow their own IDE instead: Ruby and PHP as
 * RubyMine and PhpStorm draw them, captured 2026-11-22). Captured in a PyCharm without plugins (test/colors/ide,
 * 2026-11-22). Perl and R are drawn like the TextMate bundle would, but PyCharm itself opens `.pl` with another
 * highlighter and `.r` as plain text. Not here: diffs (PyCharm opens a patch in its diff viewer, the text has no
 * colors; the diff rules of the theme stay), Razor (HTML and C# rules of the theme reach it, not checked).
 */
const TEXTMATE_LANGUAGES = [
  'source.asp.vb.net',
  'source.batchfile',
  'source.clojure',
  'source.coffee',
  'source.dart',
  'source.fsharp',
  'source.hlsl',
  'source.julia',
  'source.lua',
  'source.makefile',
  'source.objc',
  'source.objcpp',
  'source.perl',
  'source.powershell',
  'source.r',
  'source.shaderlab',
  'source.swift',
  'text.bibtex',
  'text.log',
  'text.tex',
];

/** `markup.bold` and `markup.italic` are keys the TextMate plugin creates with a font style and no color */
const BOLD: TextAttributes = { fontType: 1 };
const ITALIC: TextAttributes = { fontType: 2 };

/**
 * Selector -> attribute key of the IDE (or attributes): `TextMateDefaultColorsProvider`, then the `TextMateTheme`
 * selectors whose keys the IDE has. `punctuation` -> DEFAULT_DOT is the top layer of the quotes of a string, the marker
 * of a comment, the `\` of a LaTeX command…: the text color in Islands (rich text copied from a PyCharm without plugins,
 * 2026-11-22; a look at the screen of a PyCharm with plugins had seen the quotes in the string color). Not written:
 * `markup.underline`/`markup.heading` (an effect without a color draws nothing), and the selectors of `TextMateTheme`
 * whose keys belong to plugins PyCharm does not have (RUBY_*, COFFEESCRIPT.*, PUPPET_*…: no color, no layer).
 */
const TEXTMATE_RULES: Record<string, TextAttributes | string> = {
  comment: 'DEFAULT_LINE_COMMENT',
  'comment.block': 'DEFAULT_BLOCK_COMMENT',
  'comment.block.html': 'HTML_COMMENT',
  'comment.documentation': 'DEFAULT_DOC_COMMENT',
  'comment.line': 'DEFAULT_LINE_COMMENT',
  constant: 'DEFAULT_CONSTANT',
  'constant.character.entity': 'DEFAULT_ENTITY',
  'constant.character.escape': 'DEFAULT_VALID_STRING_ESCAPE',
  'constant.number': 'DEFAULT_NUMBER',
  'constant.numeric': 'DEFAULT_NUMBER',
  entity: 'DEFAULT_IDENTIFIER',
  'entity.name': 'DEFAULT_CLASS_NAME',
  'entity.name.class': 'DEFAULT_CLASS_NAME',
  'entity.name.function': 'DEFAULT_FUNCTION_DECLARATION',
  'entity.name.function.decorator': 'PY.DECORATOR',
  'entity.name.tag': 'HTML_TAG_NAME',
  'entity.name.tag.xml': 'XML_TAG_NAME',
  'entity.other.attribute-name': 'DEFAULT_ATTRIBUTE',
  'entity.other.attribute-name.html': 'HTML_ATTRIBUTE_NAME',
  'entity.other.attribute-name.localname.xml': 'XML_ATTRIBUTE_NAME',
  invalid: 'BAD_CHARACTER',
  'invalid.deprecated': 'DEPRECATED_ATTRIBUTES',
  keyword: 'DEFAULT_KEYWORD',
  'keyword.operator': 'DEFAULT_OPERATION_SIGN',
  'markup.bold': BOLD,
  'markup.changed': 'DIFF_MODIFIED',
  'markup.deleted': 'DIFF_DELETED',
  'markup.inserted': 'DIFF_INSERTED',
  'markup.italic': ITALIC,
  'meta.tag': 'DEFAULT_METADATA',
  punctuation: 'DEFAULT_DOT',
  'punctuation.definition.tag': 'DEFAULT_TAG',
  storage: 'DEFAULT_KEYWORD',
  'storage.type': 'DEFAULT_KEYWORD',
  'string': 'DEFAULT_STRING',
  'string.regexp': 'JS.REGEXP',
  'support.function': 'DEFAULT_FUNCTION_CALL',
  'support.type': 'DEFAULT_PREDEFINED_SYMBOL',
  variable: 'DEFAULT_LOCAL_VARIABLE',
  'variable.parameter': 'DEFAULT_PARAMETER',
};

/** Whether a selector (`entity.name`) matches a scope (`entity.name.function.ruby`): whole segments */
const matches = (selector: string, scope: string) => scope === selector || scope.startsWith(`${selector}.`);

const dots = (selector: string) => selector.split('.').length;

/**
 * Layers merged like `TextAttributes.merge`, the bottom one first: the color and the effect of the top layer that has
 * one, the font styles of all of them.
 */
const mergeAttributes = (layers: TextAttributes[]): TextAttributes =>
  layers.reduce<TextAttributes>(
    (under, above) => ({
      ...under,
      ...(above.foreground ? { foreground: above.foreground } : {}),
      ...(above.effectColor ? { effectColor: above.effectColor, effectType: above.effectType } : {}),
      fontType: (under.fontType ?? 0) | (above.fontType ?? 0),
    }),
    {},
  );

/** The rules that match a scope, the least specific first (a selector with more segments weighs more) */
const rulesOf = (scope: string) =>
  Object.keys(TEXTMATE_RULES)
    .filter((selector) => matches(selector, scope))
    .sort((first, second) => dots(first) - dots(second));

/**
 * Scopes the grammars only put inside another: the marker of a comment is always in the comment, so its rule takes the
 * layers of the comment too. Written on the scope itself, not as `comment punctuation.definition.comment`: vscode-textmate
 * ranks two rules for the same scope by the length of their nearest parent, and `source.lua` beats `comment`.
 */
const IMPLIED_PARENTS: Record<string, string> = { 'punctuation.definition.comment': 'comment' };

/**
 * The attributes the IDE draws a scope with, the rules that match it merged (the more specific on top). A scope with
 * parents (`comment.block.documentation punctuation.definition.comment`) gets the layers of its parents under its own,
 * and those of `IMPLIED_PARENTS`.
 * @param resolve the attributes of a key in the scheme (with its fallbacks), undefined when it has none
 * @returns undefined when no rule matches the scope
 */
const textMateAttributes = (scope: string, resolve: (key: string) => TextAttributes | undefined): TextAttributes | undefined => {
  const parts = scope.split(' ');
  const implied = Object.entries(IMPLIED_PARENTS).find(([selector]) => matches(selector, parts.at(-1)!))?.[1];
  const selectors = [...(implied && !parts.some((part) => matches(implied, part)) ? [implied] : []), ...parts].flatMap((part) => rulesOf(part));
  if (selectors.length === 0) return undefined;
  const layers = selectors.flatMap((selector) => {
    const rule = TEXTMATE_RULES[selector];
    const attributes = typeof rule === 'string' ? resolve(rule) : rule;
    return attributes ? [attributes] : [];
  });
  return mergeAttributes(layers);
};

/** The last segment of the scopes of grammars the IDE does not draw with TextMate: their rules never reach these languages */
const OTHER_LANGUAGE = /\.(c|cpp|cs|css|dotenv|go|groovy|ini|java|jsdoc|js|json|jsx|less|markdown|php|properties|python|regexp|rst|ruby|rust|scss|shell|sql|toml|ts|tsx|xml|yaml)$/;

/**
 * Scopes inside others whose layers add up to a style no single rule gives: the `rem` of a batch comment is a keyword
 * in a comment, keyword color with the italic of the comment (Islands Light); the `\` of a LaTeX symbol, punctuation
 * in a constant, takes the italic of the constant. They win only where no rule of the language root names the same
 * scope (see `IMPLIED_PARENTS`)
 */
const NESTED_SCOPES = ['comment keyword', 'constant punctuation'];

/**
 * The scopes to write a rule for in each TextMate language: the selectors above, and the scopes of other rules of the
 * theme that are deeper than one of them (`constant.language` is a keyword elsewhere; in Ruby it is a CONSTANT) or that
 * have parents one of them matches (the delimiters of a doc comment are a doc comment elsewhere), and the scopes
 * of `NESTED_SCOPES`.
 */
const textMateScopes = (otherScopes: string[]): string[] => {
  const reached = otherScopes.filter((scope) => {
    const parts = scope.split(' ');
    return parts.every((part) => !OTHER_LANGUAGE.test(part)) && parts.some((part) => rulesOf(part).length > 0);
  });
  return [...new Set([...Object.keys(TEXTMATE_RULES), ...reached, ...NESTED_SCOPES])].sort(compareCodeUnits);
};

/**
 * How specifically a selector (`meta.function-call entity.name.function`) matches a scope stack, or -1 when it does not:
 * the depth of the scope its last part matches first, then the length of that part, then the number of parts.
 * An approximation of vscode-textmate (the deepest scope a rule matches colors it), for the report and to leave out the
 * TextMate rules that change nothing
 */
const selectorScore = (selector: string, scopes: string[]): number => {
  const parts = selector.trim().split(/\s+/);
  const last = parts.at(-1)!;
  for (let depth = scopes.length - 1; depth >= 0; depth--) {
    if (!matches(last, scopes[depth])) continue;
    let next = depth - 1;
    let matched = true;
    for (let index = parts.length - 2; index >= 0 && matched; index--) {
      while (next >= 0 && !matches(parts[index], scopes[next])) next--;
      matched = next >= 0;
      next--;
    }
    if (matched) return depth * 10_000 + last.split('.').length * 100 + parts.length;
  }
  return -1;
};

export { mergeAttributes, selectorScore, TEXTMATE_LANGUAGES, TEXTMATE_RULES, textMateAttributes, textMateScopes };
