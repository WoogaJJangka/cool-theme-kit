/**
 * Writes `out/jetbrains-icons/` (not in git): the file icon themes the JetBrains plugin (`cool-theme-kit-jetbrains`,
 * `gradlew syncIcons`) takes from Cool Theme Kit besides `dist/`, for the settings it offers as VS Code does
 * (`docs/SAME_SCREEN.md`).
 *
 * - `<style>/` for each icon style but glass (`flat/`, `glossy/`): the theme drawn with that `iconStyle` and the default
 *   settings otherwise. The names point to the same icons in every style, only the drawing of each icon changes: the
 *   plugin takes the svg of that style of every icon it has.
 * - `no-role-marks/`: the theme with `roleMarks: false` (its json alone), and `role-names.json`, the names with a role.
 *   A file association can change the icon under the mark of a role name (`"*.py": "rust"` makes `main.py` the Rust
 *   icon with the mark of its role) unless the name has an icon of its own: the plugin reads which names have one in
 *   the theme without the marks.
 * - `associations.json`: sample `filesAssociations`, `foldersAssociations` and `languagesAssociations`, and the icon
 *   VS Code shows for sample names with them (the theme generated with them, matched as VS Code matches a file icon
 *   theme). The plugin applies the same settings to its own mapping and is tested against these icons.
 *
 * Usage: bun run export:jetbrains-icons (before `gradlew syncIcons` in the plugin)
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { IconStyle } from 'src/@types/config';
import { normalizeName } from 'src/helpers/utils';
import { IconThemeGenerator } from 'src/icons/generators/IconThemeGenerator';
import { ROLE_NAMES } from 'src/icons/roles';

import type { AtomConfig } from 'src/@types/config';

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

const generate = async (name: string, config: Partial<AtomConfig>) => {
  const distribution = join(OUTPUT, name);
  await new IconThemeGenerator(config, { dist: distribution, iconGenerator: join(root, 'iconGenerator') }).createJsonTheme();
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

const run = async () => {
  rmSync(OUTPUT, { force: true, recursive: true });
  mkdirSync(OUTPUT, { recursive: true });

  for (const iconStyle of Object.values(IconStyle).filter((style) => style !== IconStyle.Glass)) await generate(iconStyle, { iconStyle });

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

  console.log(`wrote ${OUTPUT}`);
};

// ts-node runs it as CommonJS, without top-level await
// eslint-disable-next-line unicorn/prefer-top-level-await
run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
