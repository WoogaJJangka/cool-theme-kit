import * as assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EXTENSION_ID, EXTENSION_KEY, ICON_THEME_ID, OLD_EXTENSION_ID } from 'src/helpers/constants';
import { normalizeByName, normalizeLayers, usedThemeIds } from 'src/helpers/themeLayers';
import { findIconTheme, isOwnIconTheme, listIconThemes } from 'src/helpers/vscodeUtils';
import { initI18next } from 'src/i18n/i18next';
import { getDefaultConfig } from 'src/icons/configUtils';
import { configService } from 'src/services/ConfigService';

import { testState } from '../mocks/vscode';

import type { AtomConfig } from 'src/@types/config';
import type { TestExtension } from '../mocks/vscode';

/**
 * The original Atom Material Icons (AtomMaterial.a-file-icon-vscode) contributes a file icon theme and settings with the
 * same ids as the earlier ones of this theme. VS Code then shows the theme, and keeps the defaults, of the extension
 * whose folder name comes first: theirs.
 */
describe('next to the original Atom Material Icons', () => {
  let folder = '';

  /** An installed extension contributing a file icon theme with the given id, its json written */
  const extension = (id: string, themeId: string, label?: string): TestExtension => {
    const extensionPath = join(folder, id);
    mkdirSync(join(extensionPath, 'dist'), { recursive: true });
    writeFileSync(join(extensionPath, 'dist', 'theme.json'), '{}');
    return {
      extensionPath,
      id,
      packageJSON: { contributes: { iconThemes: [{ id: themeId, label, path: './dist/theme.json' }] }, version: '2.0.1' },
    };
  };
  const atom = () => extension('AtomMaterial.a-file-icon-vscode', EXTENSION_KEY, 'Atom Material Icons');

  before(async () => {
    await initI18next();
  });

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'atom-material-'));
    testState.config = {};
    testState.extensions = [];
    testState.messages = [];
    testState.registeredDefaults = {};
    testState.sections = new Set();
  });

  afterEach(() => {
    rmSync(folder, { force: true, recursive: true });
    testState.config = {};
    testState.extensions = [];
    testState.registeredDefaults = {};
    testState.sections = new Set();
  });

  describe('the theme VS Code shows', () => {
    it('is this one for its id, whatever else is installed', () => {
      testState.extensions = [atom()];
      assert.ok(isOwnIconTheme(ICON_THEME_ID));
    });

    it('is this one for the earlier id while no other extension contributes it', () => {
      testState.extensions = [extension(EXTENSION_ID, EXTENSION_KEY), extension('PKief.material-icon-theme', 'material-icon-theme')];
      assert.ok(isOwnIconTheme(EXTENSION_KEY));
    });

    it('is the original one for the earlier id when it is installed, and for the old copy of this extension', () => {
      testState.extensions = [atom()];
      assert.ok(!isOwnIconTheme(EXTENSION_KEY));
      testState.extensions = [extension(OLD_EXTENSION_ID, EXTENSION_KEY)];
      assert.ok(!isOwnIconTheme(EXTENSION_KEY));
    });

    it('is another one for another id', () => {
      assert.ok(!isOwnIconTheme('material-icon-theme'));
      assert.ok(!isOwnIconTheme(''));
    });

    it('is selected by the id of this theme when the kit uses its icons', () => {
      testState.extensions = [atom()];
      configService.activateIcons();
      assert.equal(testState.config['workbench.iconTheme'], ICON_THEME_ID);
    });
  });

  describe('as a layer', () => {
    it('is the theme of the earlier id, and this theme is not', () => {
      const original = atom();
      testState.extensions = [extension(EXTENSION_ID, ICON_THEME_ID), original];

      assert.equal(findIconTheme(EXTENSION_KEY)?.extensionPath, original.extensionPath);
      assert.match(findIconTheme(EXTENSION_KEY)?.stamp ?? '', /^AtomMaterial\.a-file-icon-vscode@2\.0\.1:/);
      assert.equal(findIconTheme(ICON_THEME_ID), undefined);
      assert.deepEqual(
        listIconThemes().map(({ id, label }) => ({ id, label })),
        [{ id: EXTENSION_KEY, label: 'Atom Material Icons' }],
      );
    });

    it('is not the old copy of this extension, nor this extension under the earlier id', () => {
      testState.extensions = [extension(OLD_EXTENSION_ID, EXTENSION_KEY), extension(EXTENSION_ID, EXTENSION_KEY)];
      assert.equal(findIconTheme(EXTENSION_KEY), undefined);
      assert.deepEqual(listIconThemes(), []);
    });

    it('keeps the earlier id in the settings and skips the id of this theme', () => {
      const layers = [{ files: 'override', folders: 'override', theme: EXTENSION_KEY }, ICON_THEME_ID, 'material-icon-theme'];
      assert.deepEqual(
        normalizeLayers(layers).map((layer) => layer.theme),
        [EXTENSION_KEY, 'material-icon-theme'],
      );
      const byName = { '*.md': ICON_THEME_ID, 'README.md': EXTENSION_KEY };
      assert.deepEqual(
        normalizeByName(byName).map((entry) => entry.theme),
        [EXTENSION_KEY],
      );
      assert.deepEqual(usedThemeIds({ iconThemeByName: byName, iconThemeLayers: layers as AtomConfig['iconThemeLayers'] }), [
        EXTENSION_KEY,
        'material-icon-theme',
      ]);
    });
  });

  describe('the settings', () => {
    beforeEach(() => {
      testState.sections = new Set([EXTENSION_KEY]);
    });

    it('take the defaults of this extension, not the ones VS Code registered for the original', () => {
      testState.registeredDefaults[`${EXTENSION_KEY}.activeIconPacks`] = ['angular', 'rails'];
      assert.deepEqual(configService.activeIconPacks, getDefaultConfig().activeIconPacks);
      assert.deepEqual(configService.getIconSettings().activeIconPacks, getDefaultConfig().activeIconPacks);
    });

    it('take the values the user set', () => {
      testState.registeredDefaults[`${EXTENSION_KEY}.activeIconPacks`] = ['angular', 'rails'];
      testState.config[`${EXTENSION_KEY}.activeIconPacks`] = ['rails'];
      assert.deepEqual(configService.activeIconPacks, ['rails']);
    });

    // the getters fall back to getDefaultConfig, so the defaults the Settings editor shows must be the same
    it('have the defaults of package.json', () => {
      const packageJson = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
        contributes: { configuration: Array<{ properties: Record<string, { default?: unknown }> }> };
      };
      const defaults = getDefaultConfig() as unknown as Record<string, unknown>;
      for (const group of packageJson.contributes.configuration) {
        for (const [key, property] of Object.entries(group.properties)) {
          const name = key.slice(EXTENSION_KEY.length + 1);
          if (name in defaults) assert.deepEqual(defaults[name], property.default, key);
        }
      }
    });
  });
});
