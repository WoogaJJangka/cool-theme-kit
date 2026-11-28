/**
 * Writes `out/jetbrains-icons/` (not in git): the file icon themes the JetBrains plugin (`cool-theme-kit-jetbrains`,
 * `gradlew syncIcons`) takes from Cool Theme Kit besides `dist/`, for the settings it offers as VS Code does
 * (`docs/SAME_SCREEN.md`).
 *
 * - `<style>/` for each icon style (`glass/`, `glossy/`, `flat/`): the theme drawn with that `iconStyle` and the default
 *   settings otherwise, mixed with the other installed themes of `iconThemeLayers` as VS Code does by default (the
 *   names Cool Icons has no icon for get the one of Material Icon Theme). The names point to the same icons in every
 *   style, only the drawing of each icon changes: the plugin takes its mapping from `glass/` and the svg of each style.
 *   `licenses/<theme id>.txt`: the license of each theme mixed in, shipped with its icons.
 * - `no-role-marks/`: the theme with `roleMarks: false` (its json alone), and `role-names.json`, the names with a role.
 *   A file association can change the icon under the mark of a role name (`"*.py": "rust"` makes `main.py` the Rust
 *   icon with the mark of its role) unless the name has an icon of its own: the plugin reads which names have one in
 *   the theme without the marks.
 * - `associations.json`: sample `filesAssociations`, `foldersAssociations` and `languagesAssociations`, and the icon
 *   VS Code shows for sample names with them (the theme generated with them, matched as VS Code matches a file icon
 *   theme). The plugin applies the same settings to its own mapping and is tested against these icons.
 *
 * - `filters.json`: sample icons as VS Code draws them with `folderColor`, `monochrome`, `opacity` and `saturation`, in
 *   each style; the plugin draws the same from the icons of the default settings.
 *
 * Usage: bun run export:jetbrains-icons (before `gradlew syncIcons` in the plugin)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { IconStyle } from 'src/@types/config';
import { normalizeLayers } from 'src/helpers/themeLayers';
import { normalizeName } from 'src/helpers/utils';
import { getDefaultConfig } from 'src/icons/configUtils';
import { IconThemeGenerator } from 'src/icons/generators/IconThemeGenerator';
import { ROLE_NAMES } from 'src/icons/roles';

import type { AtomConfig } from 'src/@types/config';
import type { LanguageLookup, LayerTheme } from 'src/helpers/themeLayers';
import type { ThemeLayers } from 'src/icons/generators/IconThemeGenerator';

const root = join(__dirname, '..', '..', '..');
const OUTPUT = join(root, 'out', 'jetbrains-icons');
const JSON_FILE = 'a-file-icon-vscode-icon-theme.json';

/** The settings the plugin is tested with: a new extension, an extension and names that have an icon, role names */
const ASSOCIATIONS: Pick<AtomConfig, 'filesAssociations' | 'foldersAssociations' | 'languagesAssociations'> = {
  filesAssociations: {
    '**.bar.baz': 'rust',
    '*.foo': 'TypeScript',
    '*.py': 'rust',
    'Dockerfile.dev': 'docker',
    'README.md': 'json',
    'settings.py': 'yaml',
    'unknown.txt': 'no-such-icon',
  },
  foldersAssociations: {
    Datasets: 'python',
    mystuff: 'docs',
    src: 'tests',
    weird: 'no-such-folder',
  },
  languagesAssociations: {
    jsonc: 'yaml',
    python: 'docker',
  },
};

const FILE_NAMES = [
  'a.py', 'main.py', '__init__.py', 'conftest.py', 'settings.py', 'setup.py', 'manage.py', 'x.foo', 'x.bar.baz',
  'y.baz', 'Dockerfile.dev', 'Dockerfile', 'README.md', 'readme.MD', 'notes.md', 'unknown.txt', 'other.txt', 'app.py',
  '__main__.py', 'settings.ts', 'main.go',
];
const LANGUAGES = ['python', 'jsonc', 'json', 'rust'];
const FOLDER_NAMES = ['src', '.src', '_src', 'datasets', 'Datasets', 'mystuff', '.mystuff', 'weird', 'docs', 'other'];

type Section = Partial<Record<'file' | 'folder' | 'folderExpanded', string>> & Partial<Record<'fileExtensions' | 'fileNames' | 'folderNames' | 'folderNamesExpanded' | 'languageIds', Record<string, string>>>;
type Theme = Section & { iconDefinitions: Record<string, { iconPath: string }>; light?: Section };

/** The strings of a value of a package.json */
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);

/**
 * The other icon themes `iconThemeLayers` mixes with this theme by default (Material Icon Theme fills the names Cool
 * Icons has no icon for), as VS Code finds them: the theme in the installed extension, and the languages the installed
 * extensions and VS Code itself declare (`findLayerThemes`, `getLanguageLookup`). Read from this computer's VS Code
 * (`VSCODE_EXTENSIONS` and `VSCODE_BUILTIN_EXTENSIONS` override the folders); none when the theme is not installed.
 */
const findLayers = (): ThemeLayers | undefined => {
  const userExtensions = process.env.VSCODE_EXTENSIONS ?? join(homedir(), '.vscode', 'extensions');
  const builtinRoot = join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Microsoft VS Code');
  const builtinExtensions = process.env.VSCODE_BUILTIN_EXTENSIONS ?? [join(builtinRoot, 'resources', 'app', 'extensions'),
    ...(existsSync(builtinRoot) ? readdirSync(builtinRoot).map((folder) => join(builtinRoot, folder, 'resources', 'app', 'extensions')) : [])]
    .find((folder) => existsSync(folder));
  const folders = (parent: string | undefined) => (parent && existsSync(parent) ? readdirSync(parent).map((name) => join(parent, name)) : []);
  const packageOf = (folder: string) => {
    try {
      return JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')) as {
        contributes?: { iconThemes?: Array<{ id?: string; path?: string }>; languages?: Array<{ extensions?: unknown; filenames?: unknown; id?: unknown }> };
        version?: string;
      };
    } catch {
      return;
    }
  };
  const extensions = [...folders(builtinExtensions), ...folders(userExtensions)];

  const themes: LayerTheme[] = [];
  for (const { theme: id } of normalizeLayers(getDefaultConfig().iconThemeLayers)) {
    for (const folder of extensions) {
      const manifest = packageOf(folder);
      const theme = manifest?.contributes?.iconThemes?.find((candidate) => candidate.id === id);
      if (!theme?.path || themes.some((found) => found.id === id)) continue;
      themes.push({ extensionPath: folder, id, path: join(folder, theme.path), stamp: `${manifest?.version ?? ''}` });
    }
  }
  if (themes.length === 0) {
    console.warn(`no theme of iconThemeLayers installed in ${userExtensions}: the themes are written without layers`);
    return undefined;
  }

  const languages: LanguageLookup = { extensions: {}, fileNames: {} };
  for (const folder of extensions) {
    for (const language of packageOf(folder)?.contributes?.languages ?? []) {
      if (typeof language?.id !== 'string') continue;
      for (const name of strings(language.extensions)) languages.extensions[name.replace(/^\./, '').toLowerCase()] = language.id;
      for (const name of strings(language.filenames)) languages.fileNames[name.toLowerCase()] = language.id;
    }
  }
  console.log(`layers: ${themes.map((theme) => `${theme.id} ${theme.stamp}`).join(', ')}`);
  return { languages, themes };
};

const LAYERS = findLayers();

/** A theme of the settings, written to `out/jetbrains-icons/<name>/`; `layers`: mixed with the other themes as by default */
const generate = async (name: string, config: Partial<AtomConfig>, layers?: ThemeLayers) => {
  const distribution = join(OUTPUT, name);
  await new IconThemeGenerator(config, { dist: distribution, iconGenerator: join(root, 'iconGenerator') }, layers).createJsonTheme();
  return JSON.parse(readFileSync(join(distribution, JSON_FILE), 'utf8')) as Theme;
};

/** `<dir>/<stem>` of an icon, without the hash of the filter settings */
const iconOf = (theme: Theme, id: string | undefined) => {
  if (!id) return null;
  const path = theme.iconDefinitions[id]?.iconPath;
  return path ? path.split('/').slice(-2).join('/').replace(/~-?\d+(?=\.svg$)/, '').replace(/\.svg$/, '') : `missing:${id}`;
};

/** The icon id VS Code gives a file of a section: its name, its extensions from the longest, its language, the default */
const fileId = (theme: Theme, section: Section | undefined, name: string, language?: string) => {
  const pick = (key: 'fileExtensions' | 'fileNames' | 'languageIds', value: string) => section?.[key]?.[value] ?? (section === theme ? undefined : theme[key]?.[value]);
  const lower = normalizeName(name);
  const byName = pick('fileNames', lower);
  if (byName) return byName;
  for (let dot = lower.indexOf('.'); dot !== -1; dot = lower.indexOf('.', dot + 1)) {
    const byExtension = pick('fileExtensions', lower.slice(dot + 1));
    if (byExtension) return byExtension;
  }
  const byLanguage = language === undefined ? undefined : pick('languageIds', language);
  return byLanguage ?? section?.file ?? theme.file;
};

const folderId = (theme: Theme, section: Section | undefined, name: string, expanded: boolean) => {
  const key = expanded ? 'folderNamesExpanded' : 'folderNames';
  const lower = normalizeName(name);
  return section?.[key]?.[lower] ?? theme[key]?.[lower] ?? (expanded ? (section?.folderExpanded ?? theme.folderExpanded) : (section?.folder ?? theme.folder));
};

const both = (theme: Theme, id: (section: Section | undefined) => string | undefined) => ({
  dark: iconOf(theme, id(theme)),
  light: iconOf(theme, id(theme.light)),
});

/**
 * The filters of the icons (`folderColor`, `monochrome`, `opacity`, `saturation`): the icons VS Code draws with each, and
 * with all of them, in each style. The plugin draws the same from the icons of the default settings.
 */
const FILTER_CASES: Array<{ name: string; settings: Partial<AtomConfig> }> = [
  { name: 'folderColor', settings: { folderColor: '#e06c75' } },
  { name: 'monochrome', settings: { monochrome: true, monochromeColor: '#e5c07b' } },
  { name: 'opacity', settings: { opacity: 0.6 } },
  { name: 'saturation', settings: { saturation: 0.4 } },
  { name: 'all', settings: { folderColor: '#61afef', monochrome: true, monochromeColor: '#98c379', opacity: 0.75, saturation: 0.3 } },
];

/** Icons of each kind: a glyph, a logo, a role mark, an icon in the folder color, plain and named folders, dark variants */
const FILTER_ICONS = [
  'files/file', 'files/python', 'files/pycharm-python', 'files/pycharm-python_dark', 'files/role-run-pycharm-python',
  'files/role-run-pycharm-python_dark', 'files/js', 'files/typeScript', 'files/docker', 'files/readme', 'files/readme_dark',
  'files/alexignore', 'files/gitignore', 'folders/folder', 'foldersOpen/folder', 'folders/folder-root', 'folders/src',
  'foldersOpen/src', 'folders/tests', 'folders/claude', 'folders/python',
];

/** `<group>/<name>` -> content of the icons of a generated theme, the hash of the filter settings taken out of the names */
const readIcons = (folder: string, names: string[]) => {
  const icons: Record<string, string> = {};
  for (const group of ['files', 'folders', 'foldersOpen']) {
    for (const file of readdirSync(join(folder, group))) {
      const name = `${group}/${file.replace(/~-?\d+(?=\.svg$)/, '').replace(/\.svg$/, '')}`;
      if (names.includes(name)) icons[name] = readFileSync(join(folder, group, file), 'utf8');
    }
  }
  return icons;
};

const run = async () => {
  rmSync(OUTPUT, { force: true, recursive: true });
  mkdirSync(OUTPUT, { recursive: true });

  // every style, glass too, with the layers: what VS Code shows with the default settings, and the license of each layer
  for (const theme of LAYERS?.themes ?? []) {
    const license = readdirSync(theme.extensionPath).find((file) => /^licen[cs]e(\.(md|txt))?$/i.test(file));
    if (!license) throw new Error(`no license file in ${theme.extensionPath}`);
    mkdirSync(join(OUTPUT, 'licenses'), { recursive: true });
    writeFileSync(join(OUTPUT, 'licenses', `${theme.id}.txt`), readFileSync(join(theme.extensionPath, license)));
  }
  for (const iconStyle of Object.values(IconStyle)) await generate(iconStyle, { iconStyle }, LAYERS);

  // the json is enough: the svgs are those of the default theme
  await generate('no-role-marks', { roleMarks: false });
  for (const group of ['files', 'folders', 'foldersOpen']) rmSync(join(OUTPUT, 'no-role-marks', group), { force: true, recursive: true });
  const roleNames = ROLE_NAMES.flatMap(({ fileNames, role }) => fileNames.map((name) => ({ name: normalizeName(name), role })));
  writeFileSync(join(OUTPUT, 'role-names.json'), `${JSON.stringify(roleNames, undefined, 2)}\n`);

  const theme = await generate('associations', ASSOCIATIONS);
  const files = [
    ...FILE_NAMES.map((name) => ({ name, ...both(theme, (section) => fileId(theme, section, name)) })),
    ...LANGUAGES.map((language) => ({ language, name: 'zz-no-such-name', ...both(theme, (section) => fileId(theme, section, 'zz-no-such-name', language)) })),
  ];
  const folders = FOLDER_NAMES.map((name) => ({
    closed: both(theme, (section) => folderId(theme, section, name, false)),
    name,
    open: both(theme, (section) => folderId(theme, section, name, true)),
  }));
  writeFileSync(join(OUTPUT, 'associations.json'), `${JSON.stringify({ files, folders, settings: ASSOCIATIONS }, undefined, 2)}\n`);
  rmSync(join(OUTPUT, 'associations'), { force: true, recursive: true });

  const filters = [];
  for (const iconStyle of Object.values(IconStyle)) {
    for (const { name, settings } of FILTER_CASES) {
      const folder = `filters-${iconStyle}-${name}`;
      await generate(folder, { ...settings, iconStyle });
      filters.push({ icons: readIcons(join(OUTPUT, folder), FILTER_ICONS), name, settings, style: iconStyle });
      rmSync(join(OUTPUT, folder), { force: true, recursive: true });
    }
  }
  writeFileSync(join(OUTPUT, 'filters.json'), `${JSON.stringify(filters, undefined, 2)}\n`);

  console.log(`wrote ${OUTPUT}`);
};

// ts-node runs it as CommonJS, without top-level await
// eslint-disable-next-line unicorn/prefer-top-level-await
run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
