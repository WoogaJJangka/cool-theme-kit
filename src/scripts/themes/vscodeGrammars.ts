/**
 * The grammars of a real VS Code (downloaded into .vscode-test, like the smoke tests) and vscode-textmate, the
 * tokenizer of VS Code, with the token rules of a theme: how VS Code colors the samples of test/colors.
 * Used by `check:colors` and `compare:ide`.
 */
import { downloadAndUnzipVSCode } from '@vscode/test-electron';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma';
import { INITIAL, parseRawGrammar, Registry } from 'vscode-textmate';
import { extensionRoot, THEMES_FOLDER } from 'src/themes/colorThemes';
import { compareCodeUnits } from 'src/helpers/utils';
import { DEFAULT_RULES, SUPER_TYPES } from 'src/themes/semanticTokens';

import type { LineToken } from 'src/themes/colorCheck';
import type { DefaultRule } from 'src/themes/semanticTokens';
import type { VsCodeColorTheme } from 'src/themes/convertJetbrainsTheme';
import type { IGrammar, IRawGrammar } from 'vscode-textmate';

/** The VS Code whose grammars are checked: move it with the grammars (a newer grammar can change scopes) */
const VSCODE_VERSION = '1.147.0';

type Contribution = { injectTo?: string[]; path: string; scopeName: string };

const root = extensionRoot(__dirname);

/** The `extensions` folder of the downloaded VS Code (resources/app/extensions, one level down on newer Windows builds) */
const findExtensionsFolder = (executable: string): string => {
  const candidates = [dirname(executable), join(dirname(executable), '..', 'Resources')];
  for (const start of candidates) {
    for (const folder of [start, ...(existsSync(start) ? readdirSync(start).map((entry) => join(start, entry)) : [])]) {
      const extensions = join(folder, 'resources', 'app', 'extensions');
      if (existsSync(extensions)) return extensions;
      const mac = join(folder, 'app', 'extensions');
      if (existsSync(mac)) return mac;
    }
  }
  throw new Error(`No resources/app/extensions next to ${executable}`);
};

const readGrammars = (extensions: string): Contribution[] =>
  readdirSync(extensions).flatMap((name) => {
    const manifest = join(extensions, name, 'package.json');
    if (!existsSync(manifest)) return [];
    const json = JSON.parse(readFileSync(manifest, 'utf8')) as { contributes?: { grammars?: Contribution[] } };
    return (json.contributes?.grammars ?? []).map((grammar) => ({
      ...grammar,
      path: join(extensions, name, grammar.path),
    }));
  });

const loadTheme = (file: string) =>
  JSON.parse(readFileSync(join(root, THEMES_FOLDER, file), 'utf8')) as VsCodeColorTheme;

/** The theme as VS Code hands it to the tokenizer: the editor colors as the default rule, then the token rules */
const textMateTheme = (theme: VsCodeColorTheme) => ({
  name: theme.name,
  settings: [
    { settings: { background: theme.colors['editor.background'], foreground: theme.colors['editor.foreground'] } },
    ...theme.tokenColors.map((rule) => ({ name: rule.name, scope: rule.scope, settings: rule.settings })),
  ],
});

const tokenize = (grammar: IGrammar, text: string): Array<{ line: string; tokens: LineToken[] }> => {
  let state = INITIAL;
  return text.split(/\r?\n/).map((line) => {
    const scoped = grammar.tokenizeLine(line, state);
    const encoded = grammar.tokenizeLine2(line, state);
    state = encoded.ruleStack;
    const tokens: LineToken[] = [];
    for (let index = 0; index < encoded.tokens.length; index += 2) {
      const start = encoded.tokens[index];
      const end = index + 2 < encoded.tokens.length ? encoded.tokens[index + 2] : line.length;
      // The scopes of the first token of the plain tokenizer that starts here (both split at the same places or finer)
      const scopes = scoped.tokens.find((token) => token.startIndex <= start && token.endIndex > start)?.scopes ?? [];
      tokens.push({ end, metadata: encoded.tokens[index + 1], scopes, start });
    }
    return { line, tokens };
  });
};

/** The grammars of VS Code `version` and a registry that loads them */
const loadVsCodeGrammars = async (version: string) => {
  const executable = await downloadAndUnzipVSCode(version);
  const contributions = readGrammars(findExtensionsFolder(executable));
  const byScope = new Map(contributions.map((grammar) => [grammar.scopeName, grammar]));

  const wasm = readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
  await loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const registry = new Registry({
    getInjections: (scopeName) =>
      contributions.filter((grammar) => grammar.injectTo?.includes(scopeName)).map((grammar) => grammar.scopeName),
    loadGrammar: async (scopeName): Promise<IRawGrammar | null> => {
      const grammar = byScope.get(scopeName);
      return grammar ? parseRawGrammar(readFileSync(grammar.path, 'utf8'), grammar.path) : null;
    },
    onigLib: Promise.resolve({ createOnigScanner, createOnigString }),
  });
  return { contributions, registry };
};

type SemanticContributions = {
  semanticTokenScopes?: Array<{ language?: string; scopes: Record<string, string[]> }>;
  semanticTokenTypes?: Array<{ id: string; superType?: string }>;
};

/**
 * What the extensions built into VS Code `version` add to semantic highlighting (`TokenClassificationExtensionPoint`):
 * default rules (`semanticTokenScopes`, with their language) after the ones of VS Code, and super types of new token types
 */
const loadSemanticContributions = async (version: string) => {
  const extensions = findExtensionsFolder(await downloadAndUnzipVSCode(version));
  const defaults: DefaultRule[] = [...DEFAULT_RULES];
  const superTypes: Record<string, string> = { ...SUPER_TYPES };
  for (const name of readdirSync(extensions).sort(compareCodeUnits)) {
    const manifest = join(extensions, name, 'package.json');
    if (!existsSync(manifest)) continue;
    const contributes = (JSON.parse(readFileSync(manifest, 'utf8')) as { contributes?: SemanticContributions }).contributes ?? {};
    for (const type of contributes.semanticTokenTypes ?? []) if (type.superType) superTypes[type.id] = type.superType;
    for (const { language, scopes } of contributes.semanticTokenScopes ?? []) {
      for (const [selector, probes] of Object.entries(scopes)) {
        defaults.push({ scopesToProbe: probes.map((probe) => probe.split(' ')), selector: language && !selector.includes(':') ? `${selector}:${language}` : selector });
      }
    }
  }
  return { defaults, superTypes };
};

export { VSCODE_VERSION, loadSemanticContributions, loadTheme, loadVsCodeGrammars, root, textMateTheme, tokenize };
export type { Contribution };
