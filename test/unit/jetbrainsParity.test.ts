import { strict as assert } from 'node:assert';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSON_FILE_NAME, PYTHON_FILE } from 'src/helpers/constants';
import { fileExceptions, folderExceptions } from 'src/icons/exceptions';
import { commonFiles } from 'src/icons/files/common';
import { commonFolders } from 'src/icons/folders/common';
import { IconThemeGenerator } from 'src/icons/generators/IconThemeGenerator';
import {
  fileKeys,
  findAssociation,
  folderKeys,
  iconName,
  loadDefaultAssociations,
  readAssociations,
} from 'src/scripts/icons/jetbrainsMatcher';

import type { IconConfiguration } from 'src/models/IconConfiguration';

const repoRoot = join(__dirname, '..', '..');
const iconGeneratorPath = join(repoRoot, 'iconGenerator');
const iconsPath = join(iconGeneratorPath, 'assets', 'icons');

/** `role-run-`, `role-package-`…: what an icon with the mark of a role has before the name of the icon under the mark */
const ROLE_ICON = /^role-[a-z]+-/;

/** Packs of the JetBrains plugin that VS Code has (other packs are not ported) */
const PORTED_PACKS = new Set(['ANGULAR', 'ANGULAR2', 'NEST', 'NEXTJS', 'NGRX', 'RAILS', 'RECOIL', 'REDUX', 'TESTS']);

type OwnFiles = { fileExtensions?: string[]; fileNames?: string[]; name: string };

/** name -> icon; an extension as the names VS Code applies it to: `file.<extension>` and the dot file `.<extension>` */
const fileIconsOf = (associations: OwnFiles[]) =>
  new Map(
    associations.flatMap(({ fileExtensions = [], fileNames = [], name }) => [
      ...fileNames.map((fileName) => [fileName, name] as const),
      ...fileExtensions.flatMap((extension) => [[`file.${extension}`, name] as const, [`.${extension}`, name] as const]),
    ]),
  );
const folderIconsOf = (associations: Array<{ folderNames: string[]; name: string }>) =>
  new Map(associations.flatMap(({ folderNames, name }) => folderNames.map((folderName) => [folderName, name] as const)));

/**
 * What this theme decides for itself, after the icons of the JetBrains plugin: the icon of the common names the
 * plugin has no icon of their own for (`common.ts`), and of the few names it gives another icon than the plugin on
 * purpose (src/icons/exceptions.ts)
 */
const COMMON_FILES = fileIconsOf(commonFiles);
const COMMON_FOLDERS = folderIconsOf(commonFolders);
const FILE_EXCEPTIONS = fileIconsOf(fileExceptions);
const FOLDER_EXCEPTIONS = folderIconsOf(folderExceptions);
const OWN_FILES = new Map([...COMMON_FILES, ...FILE_EXCEPTIONS]);
const OWN_FOLDERS = new Map([...COMMON_FOLDERS, ...FOLDER_EXCEPTIONS]);

/**
 * The default theme must show, for every name of the JetBrains associations that VS Code can express,
 * the icon the JetBrains plugin shows in PyCharm (emulated by jetbrainsMatcher), but for what this theme decides
 * for itself.
 */
describe('JetBrains parity', () => {
  let theme: IconConfiguration;
  let dist: string;

  /** VS Code lowercases the keys of an icon theme */
  const lowerKeys = (map?: Record<string, string>) =>
    new Map(Object.entries(map ?? {}).map(([key, value]) => [key.toLowerCase(), value]));
  /**
   * Icon file of a definition, without the config hash nor the `_dark` variant. An icon with the mark of a role
   * (`role-run-go` for `main.go`) is the icon under the mark: the mark is added to the icon of the JetBrains plugin.
   */
  const iconOf = (definition?: string) =>
    (definition &&
      theme.iconDefinitions?.[definition]?.iconPath
        ?.split('/')
        .pop()
        ?.replace(/(~[^.]*)?\.svg$/, '')
        .replace(/_dark$/, '')
        .replace(ROLE_ICON, '')) ??
    undefined;

  before(async () => {
    dist = mkdtempSync(join(tmpdir(), 'afi-parity-'));
    await new IconThemeGenerator({}, { dist, iconGenerator: iconGeneratorPath }).createJsonTheme();
    theme = JSON.parse(readFileSync(join(dist, JSON_FILE_NAME), 'utf8'));
  });

  after(() => rmSync(dist, { force: true, recursive: true }));

  it('gives each file name and extension the icon of the JetBrains plugin, in dark and light themes', () => {
    const associations = loadDefaultAssociations(iconGeneratorPath, 'icon_associations.json');
    const dark = { fileExtensions: lowerKeys(theme.fileExtensions), fileNames: lowerKeys(theme.fileNames) };
    // a light theme uses the light section, then the base one
    const light = {
      fileExtensions: new Map([...dark.fileExtensions, ...lowerKeys(theme.light?.fileExtensions)]),
      fileNames: new Map([...dark.fileNames, ...lowerKeys(theme.light?.fileNames)]),
    };

    /** The icon definition VS Code uses for a file name: exact name, then longest extension */
    const definitionFor = (maps: typeof dark, fileName: string) => {
      if (maps.fileNames.has(fileName)) return maps.fileNames.get(fileName);
      const parts = fileName.split('.');
      for (let index = 1; index < parts.length; index++) {
        const definition = maps.fileExtensions.get(parts.slice(index).join('.'));
        if (definition) return definition;
      }
      return;
    };

    // the example names of the JetBrains associations and every name and extension of the theme:
    // an extension also applies to the dot file of that name (`.pre-commit-config.yaml`),
    // and a multi-part extension does not apply to the file of that exact name (`test.js`)
    const names = new Set([
      ...fileKeys(readAssociations(iconGeneratorPath, 'icon_associations.json')).map(({ matchedName }) => matchedName),
      ...dark.fileNames.keys(),
      ...[...dark.fileExtensions.keys()].flatMap((extension) => [`file.${extension}`, `.${extension}`, extension]),
    ]);

    const different: string[] = [];
    for (const matchedName of new Set([...names, ...OWN_FILES.keys()])) {
      if (matchedName.includes('/')) continue;
      const winner = findAssociation(associations, matchedName);
      if (!winner || (winner.iconPack && !PORTED_PACKS.has(winner.iconPack))) continue;
      // the pycharm pack shows the PyCharm Python icon instead, as PyCharm does
      if (PYTHON_FILE.test(matchedName)) continue;

      const jetbrains = iconName(winner.icon).replace(/_dark$/, '');
      const expected = OWN_FILES.get(matchedName) ?? jetbrains;
      if (!existsSync(join(iconsPath, 'files', `${expected}.svg`))) continue;

      // the json writes some icon names in another case than the svg (`groovyfile` for `groovyFile.svg`)
      const darkIcon = iconOf(definitionFor(dark, matchedName));
      if (darkIcon?.toLowerCase() !== expected.toLowerCase()) different.push(`dark ${matchedName}: ${darkIcon} instead of ${expected}`);

      // the light theme must not keep the icon of another association, nor use the `_dark` variant
      const lightDefinition = definitionFor(light, matchedName);
      const lightIcon = iconOf(lightDefinition);
      if (lightIcon?.toLowerCase() !== expected.toLowerCase() || lightDefinition?.endsWith('_dark')) {
        different.push(`light ${matchedName}: ${lightDefinition} instead of ${expected}`);
      }
    }
    assert.deepEqual(different, []);
  });

  describe('what this theme decides for itself', () => {
    const files = loadDefaultAssociations(iconGeneratorPath, 'icon_associations.json');
    const folders = loadDefaultAssociations(iconGeneratorPath, 'folder_associations.json');
    const jetbrains = (associations: typeof files, name: string) => {
      const winner = findAssociation(associations, name);
      return winner && iconName(winner.icon).replace(/_dark$/, '');
    };
    /** What the plugin gives any file with the extension of this name: `requirements-dev.txt` -> the icon of a text file */
    const byExtension = (name: string) => (name.includes('.', 1) ? jetbrains(files, `file${name.slice(name.indexOf('.', 1))}`) : undefined);

    it('keeps as exceptions only names the JetBrains plugin gives another icon', () => {
      // an exception the plugin does not know, or agrees with, is a common name (or nothing) and not an exception
      const stale = [
        ...[...FILE_EXCEPTIONS].filter(([name, icon]) => [undefined, icon].includes(jetbrains(files, name))).map(([name]) => name),
        ...[...FOLDER_EXCEPTIONS].filter(([name, icon]) => [undefined, icon].includes(jetbrains(folders, name))).map(([name]) => `${name}/`),
      ];
      assert.deepEqual(stale, []);
    });

    it('keeps as common names only names the JetBrains plugin has no icon of their own for', () => {
      // a name the plugin gives an icon for what it is, not for its extension, follows the plugin or is an exception
      const known = [
        ...[...COMMON_FILES]
          .filter(([name, icon]) => ![undefined, icon, byExtension(name)].includes(jetbrains(files, name)))
          .map(([name]) => `${name}: ${jetbrains(files, name)}`),
        ...[...COMMON_FOLDERS].filter(([name]) => jetbrains(folders, name) !== undefined).map(([name]) => `${name}/: ${jetbrains(folders, name)}`),
      ];
      assert.deepEqual(known, []);
    });

    it('shows the icon of the common names, which the examples of the plugin do not all list', () => {
      const fileNames = lowerKeys(theme.fileNames);
      const folderNames = lowerKeys(theme.folderNames);
      const different = [
        ...[...OWN_FILES].filter(([name]) => !name.startsWith('file.') && !/^\.env\./.test(name)).flatMap(([name, icon]) => (iconOf(fileNames.get(name)) === icon ? [] : [name])),
        ...[...OWN_FOLDERS].flatMap(([name, icon]) => (folderNames.get(name)?.replace(/^folder-/, '') === icon ? [] : [`${name}/`])),
      ];
      assert.deepEqual(different, []);
    });
  });

  it('gives each folder name the icon of the JetBrains plugin', () => {
    const associations = loadDefaultAssociations(iconGeneratorPath, 'folder_associations.json');
    const folderNames = lowerKeys(theme.folderNames);

    const different: string[] = [];
    for (const { folderName, matchedName } of folderKeys(readAssociations(iconGeneratorPath, 'folder_associations.json'))) {
      const winner = findAssociation(associations, matchedName);
      if (!winner) continue;

      const expected = OWN_FOLDERS.get(folderName) ?? iconName(winner.icon);
      if (!existsSync(join(iconsPath, 'folders', `${expected}.svg`))) continue;

      const actual = folderNames.get(folderName)?.replace(/^folder-/, '') ?? 'folder';
      if (actual !== expected) different.push(`${folderName}: ${actual} instead of ${expected}`);
    }
    assert.deepEqual(different, []);
  });
});
