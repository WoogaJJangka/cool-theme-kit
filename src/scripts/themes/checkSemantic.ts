/**
 * Check the colors of the samples of test/colors with the semantic tokens of the language servers built into VS Code
 * (the TypeScript server, for TypeScript and JavaScript): what a user of VS Code sees with no other extension.
 * `check:colors` checks the TextMate colors alone; here the semantic style of each token (src/themes/semanticTokens.ts,
 * a port of VS Code) goes over them, and the result is compared with the IDE like `check:colors` does.
 * The tokens come from a real VS Code (test/semantic/run.js, downloaded into .vscode-test; on Linux it needs a display:
 * `xvfb-run -a bun run check:semantic`). Other language servers (Pylance, Java, C/C++…) are extensions: not checked.
 *
 * An expectation that still differs with the semantic tokens says why in `semantic` (like `todo` for `check:colors`).
 *
 * Usage: bun run check:semantic                 every expectation of the TypeScript and JavaScript samples
 *        bun run check:semantic -- --report     also each semantic token and the style VS Code gives it
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ATTRIBUTES_FILE, compareStyles, decodeStyle, expectedStyle, SAMPLES_FOLDER, tokensOf } from 'src/themes/colorCheck';
import { COLOR_THEMES } from 'src/themes/colorThemes';
import { resolveScheme } from 'src/themes/jetbrainsTheme';
import { applySemanticStyle, decodeSemanticTokens, semanticStyle } from 'src/themes/semanticTokens';

import { loadSemanticContributions, loadTheme, loadVsCodeGrammars, root, textMateTheme, tokenize, VSCODE_VERSION } from './vscodeGrammars';

import type { SampleExpectations, SchemeChain } from 'src/themes/colorCheck';
import type { DefaultRule, SemanticSetting, SemanticToken, TokenColorRule } from 'src/themes/semanticTokens';

/** Root scopes of the samples a language server built into VS Code gives semantic tokens */
const SEMANTIC_SCOPES = new Set(['source.js', 'source.js.jsx', 'source.ts', 'source.tsx']);

type Dump = { files: Record<string, { data: number[]; language: string; legend: { tokenModifiers: string[]; tokenTypes: string[] } }>; vscode: string };

// eslint-disable-next-line @typescript-eslint/no-require-imports -- a plain script of test/, outside the TypeScript sources
const { dumpSemanticTokens } = require(join(root, 'test', 'semantic', 'run.js')) as {
  dumpSemanticTokens: (options: { files: string[]; output: string; version: string }) => Promise<string>;
};

const report = process.argv.includes('--report');

type DrawContext = {
  colorMap: string[];
  defaults: DefaultRule[];
  semantic: SemanticToken[];
  semanticRules: Record<string, SemanticSetting>;
  superTypes: Record<string, string>;
  tokenColors: TokenColorRule[];
};

/**
 * The style VS Code draws the part of a TextMate token in [start, end) of a line with, the semantic token over it (if
 * any) applied: a TextMate token can span several semantic ones (the tokenizer merges neighbors of the same style)
 */
const drawn = (context: DrawContext, line: number, token: { end: number; metadata: number; start: number }, start: number, end: number) => {
  const textMate = decodeStyle(token.metadata, context.colorMap);
  const [from, to] = [Math.max(start, token.start), Math.min(end, token.end)];
  const over = context.semantic.find((item) => item.line === line && item.character < to && item.character + item.length > from);
  if (!over) return { over, style: textMate };
  return { over, style: applySemanticStyle(textMate, semanticStyle(over, context.semanticRules, context.tokenColors, context.defaults, context.superTypes)) };
};

const main = async () => {
  const samplesFolder = join(root, SAMPLES_FOLDER);
  const samples = readdirSync(samplesFolder)
    .filter((file) => file.endsWith('.expect.json'))
    .map((file) => JSON.parse(readFileSync(join(samplesFolder, file), 'utf8')) as SampleExpectations);
  const semanticSamples = samples.filter((sample) => SEMANTIC_SCOPES.has(sample.scope));

  const work = mkdtempSync(join(tmpdir(), 'ctk-semantic-dump-'));
  let dump: Dump;
  try {
    const output = join(work, 'tokens.json');
    await dumpSemanticTokens({ files: semanticSamples.map((sample) => sample.file), output, version: VSCODE_VERSION });
    dump = JSON.parse(readFileSync(output, 'utf8')) as Dump;
  } finally {
    rmSync(work, { force: true, recursive: true });
  }
  console.log(`VS Code ${dump.vscode}`);

  const { registry } = await loadVsCodeGrammars(VSCODE_VERSION);
  const { defaults, superTypes } = await loadSemanticContributions(VSCODE_VERSION);
  const allAttributes = JSON.parse(readFileSync(join(root, ATTRIBUTES_FILE), 'utf8')) as Record<string, SchemeChain>;

  let checked = 0;
  let failures = 0;
  let known = 0;
  const knownChecked = new Set<string>();
  const knownFailed = new Set<string>();
  for (const info of COLOR_THEMES) {
    const theme = loadTheme(info.base);
    const chain = allAttributes[info.label];
    const scheme = resolveScheme(chain.schemes, chain.scheme, chain.additional);
    registry.setTheme(textMateTheme(theme));
    const colorMap = registry.getColorMap();
    const semanticRules = (theme.semanticTokenColors ?? {}) as Record<string, SemanticSetting>;
    console.log(`\n${info.label}`);

    for (const sample of semanticSamples) {
      const file = dump.files[sample.file];
      if (!file) throw new Error(`${sample.file}: no semantic tokens`);
      const semantic = decodeSemanticTokens(file.data, file.legend, file.language);
      const grammar = await registry.loadGrammar(sample.scope);
      if (!grammar) throw new Error(`${sample.file}: VS Code ${VSCODE_VERSION} has no grammar ${sample.scope}`);
      const lines = tokenize(grammar, readFileSync(join(samplesFolder, sample.file), 'utf8'));
      const context: DrawContext = { colorMap, defaults, semantic, semanticRules, superTypes, tokenColors: theme.tokenColors };

      for (const expectation of sample.tokens) {
        const where = `${sample.file}:${expectation.line} "${expectation.text}"`;
        const line = lines[expectation.line - 1];
        const tokens = line ? tokensOf(line.line, line.tokens, expectation.text, expectation.nth) : undefined;
        const expected = expectedStyle(scheme, expectation.key, expectation.under, undefined, expectation.layers);
        if (!tokens || tokens.length === 0 || !expected) throw new Error(`${where}: not on that line, or no attributes for ${expectation.key}`);
        checked++;
        let start = -1;
        for (let found = 0; found < (expectation.nth ?? 1); found++) start = line.line.indexOf(expectation.text, start + 1);
        const results = tokens.map((token) => drawn(context, expectation.line - 1, token, start, start + expectation.text.length));
        const problem = compareStyles(expected, results.map((result) => result.style));
        const classes = describeTokens(results.flatMap((result) => (result.over ? [result.over] : [])));
        if (expectation.semantic) knownChecked.add(where);
        if (!problem) continue;
        if (expectation.semantic) {
          known++;
          knownFailed.add(where);
          console.log(`  known ${where} (${expectation.key}): ${problem} [${classes}] — ${expectation.semantic}`);
        } else {
          failures++;
          console.log(`  FAIL  ${where} (${expectation.key}): ${problem} [${classes}]`);
        }
      }

      if (report) {
        console.log(`  -- ${sample.file}`);
        for (const token of semantic) {
          const text = lines[token.line].line.slice(token.character, token.character + token.length);
          const style = semanticStyle(token, semanticRules, theme.tokenColors, defaults, superTypes);
          console.log(`     ${token.line + 1}: ${JSON.stringify(text)} ${describeTokens([token])} -> ${JSON.stringify(style)}`);
        }
      }
    }
  }

  const stale = [...knownChecked].filter((where) => !knownFailed.has(where));
  for (const where of stale) console.log(`  FIXED ${where}: matches the IDE in both themes, remove its "semantic" note`);
  failures += stale.length;
  console.log(`\n${checked} checks with semantic tokens, ${failures} differences, ${known} known differences`);
  if (failures > 0) process.exitCode = 1;
};

const describeTokens = (tokens: SemanticToken[]) =>
  tokens.length === 0 ? 'no semantic token' : tokens.map((token) => [token.type, ...token.modifiers].join('.')).join(' + ');

// ts-node runs the scripts as CommonJS, which has no top-level await
// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

