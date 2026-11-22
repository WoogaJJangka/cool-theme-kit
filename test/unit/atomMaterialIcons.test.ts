import * as assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerCommands } from 'src/commands/commands';
import {
  EARLIER_MATERIAL_PRODUCT_THEME_ID,
  EXTENSION_ID,
  EXTENSION_KEY,
  ICON_THEME_ID,
  MATERIAL_PRODUCT_THEME_ID,
  OLD_EXTENSION_ID,
} from 'src/helpers/constants';
import { normalizeByName, normalizeLayers, usedThemeIds } from 'src/helpers/themeLayers';
import { compareCodeUnits } from 'src/helpers/utils';
import { findIconTheme, isOwnIconTheme, listIconThemes } from 'src/helpers/vscodeUtils';
import { initI18next } from 'src/i18n/i18next';
import { getDefaultConfig } from 'src/icons/configUtils';
import { productMixerState } from 'src/panels/productMixerState';
import { ISLANDS_PRODUCT_THEME_ID } from 'src/productIcons/islandsProductTheme';
import { ProductIconGenerator } from 'src/productIcons/ProductIconGenerator';
import { findProductTheme } from 'src/productIcons/productIconLayers';
import { configService } from 'src/services/ConfigService';
import { forgetInstalledProductThemes, listProductThemes, productIconService } from 'src/services/ProductIconService';

import { registeredCommands, testState } from '../mocks/vscode';

import type { AtomConfig } from 'src/@types/config';
import type { ExtensionContext } from 'vscode';
import type { TestExtension } from '../mocks/vscode';

/**
 * The original Atom Material Icons (AtomMaterial.a-file-icon-vscode) contributes a file icon theme, a product icon theme
 * and settings with the same ids as the earlier ones of this extension. VS Code then shows the theme, and keeps the
 * defaults, of the extension whose folder name comes first: theirs.
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

    it('keeps the earlier id in the settings, and the id of this theme only for a name', () => {
      const layers = [{ files: 'override', folders: 'override', theme: EXTENSION_KEY }, ICON_THEME_ID, 'material-icon-theme'];
      assert.deepEqual(
        normalizeLayers(layers).map((layer) => layer.theme),
        [EXTENSION_KEY, 'material-icon-theme'],
      );
      const byName = { '*.md': ICON_THEME_ID, 'README.md': EXTENSION_KEY };
      // a name pinned to this theme gets its own icon back; this theme is not another installed theme to read
      assert.deepEqual(
        normalizeByName(byName).map((entry) => entry.theme),
        [ICON_THEME_ID, EXTENSION_KEY],
      );
      assert.deepEqual(usedThemeIds({ iconThemeByName: byName, iconThemeLayers: layers as AtomConfig['iconThemeLayers'] }), [
        EXTENSION_KEY,
        'material-icon-theme',
      ]);
    });
  });

  // The original contributes a product icon theme ("Atom Material Icons") with the earlier id of Cool Material Icons
  describe('the product icon themes', () => {
    /** An installed extension contributing the given product icon themes (id -> label), all in one json with a font named after the extension */
    const productExtension = (id: string, themes: Record<string, string>): TestExtension => {
      const extensionPath = join(folder, id);
      mkdirSync(join(extensionPath, 'dist'), { recursive: true });
      writeFileSync(join(extensionPath, 'dist', `${id}.woff`), id);
      writeFileSync(
        join(extensionPath, 'dist', 'product.json'),
        JSON.stringify({ fonts: [{ id: 'font', src: [{ format: 'woff', path: `./${id}.woff` }] }], iconDefinitions: { files: { fontCharacter: '\\41' } } }),
      );
      const productIconThemes = Object.entries(themes).map(([themeId, label]) => ({ id: themeId, label, path: './dist/product.json' }));
      return { extensionPath, id, packageJSON: { contributes: { productIconThemes }, version: '2.0.1' } };
    };
    const atomProduct = () => productExtension('AtomMaterial.a-file-icon-vscode', { [EARLIER_MATERIAL_PRODUCT_THEME_ID]: 'Atom Material Icons' });
    const ownThemes = {
      [ISLANDS_PRODUCT_THEME_ID]: 'Cool Islands Icons',
      [MATERIAL_PRODUCT_THEME_ID]: 'Cool Material Icons',
      [EARLIER_MATERIAL_PRODUCT_THEME_ID]: 'Cool Material Icons',
    };
    const own = () => productExtension(EXTENSION_ID, ownThemes);
    const listed = () => listProductThemes().map(({ extensionPath, id, label }) => ({ extensionPath, id, label }));
    /** The extension folder of each font the mix copies */
    const mixedFonts = () =>
      productIconService.mix().layers.map(({ theme }) => ({ font: theme.fonts[0]?.src[0]?.path ?? '', id: theme.id }));

    beforeEach(forgetInstalledProductThemes);
    afterEach(forgetInstalledProductThemes);

    it('list Cool Material Icons by its own id, and the original by the earlier id', () => {
      const [original, kit] = [atomProduct(), own()];
      testState.extensions = [original, kit];
      assert.deepEqual(listed(), [
        { extensionPath: original.extensionPath, id: EARLIER_MATERIAL_PRODUCT_THEME_ID, label: 'Atom Material Icons' },
        { extensionPath: kit.extensionPath, id: MATERIAL_PRODUCT_THEME_ID, label: 'Cool Material Icons' },
      ]);
    });

    it('leave out the old copy of this extension, which has the same ids', () => {
      const kit = own();
      testState.extensions = [productExtension(OLD_EXTENSION_ID, ownThemes), kit];
      assert.deepEqual(listed(), [{ extensionPath: kit.extensionPath, id: MATERIAL_PRODUCT_THEME_ID, label: 'Cool Material Icons' }]);
    });

    it('give the earlier id to the original when it is installed, and to Cool Material Icons otherwise', () => {
      const [original, kit] = [atomProduct(), own()];
      testState.extensions = [original, kit];
      assert.equal(findProductTheme(listProductThemes(), EARLIER_MATERIAL_PRODUCT_THEME_ID)?.extensionPath, original.extensionPath);
      assert.equal(findProductTheme(listProductThemes(), MATERIAL_PRODUCT_THEME_ID)?.extensionPath, kit.extensionPath);

      testState.extensions = [kit];
      forgetInstalledProductThemes();
      // under the earlier id: the mixed fonts keep their folder, so the settings written before give the same theme
      assert.deepEqual(findProductTheme(listProductThemes(), EARLIER_MATERIAL_PRODUCT_THEME_ID), {
        extensionPath: kit.extensionPath,
        id: EARLIER_MATERIAL_PRODUCT_THEME_ID,
        label: 'Cool Material Icons',
        path: join(kit.extensionPath, 'dist', 'product.json'),
      });
      assert.equal(findProductTheme(listProductThemes(), ISLANDS_PRODUCT_THEME_ID), undefined);
      assert.equal(findProductTheme(listProductThemes(), 'fluent-icons'), undefined);
    });

    it('mix the original by the earlier id and Cool Material Icons by its id, and watch both files', () => {
      const [original, kit] = [atomProduct(), own()];
      testState.extensions = [original, kit];
      testState.config.productIconThemeLayers = [{ mode: 'override', theme: EARLIER_MATERIAL_PRODUCT_THEME_ID }, MATERIAL_PRODUCT_THEME_ID];

      assert.deepEqual(mixedFonts(), [
        { font: join(original.extensionPath, 'dist', `${original.id}.woff`), id: EARLIER_MATERIAL_PRODUCT_THEME_ID },
        { font: join(kit.extensionPath, 'dist', `${kit.id}.woff`), id: MATERIAL_PRODUCT_THEME_ID },
      ]);
      assert.deepEqual(productIconService.watchedPaths(), [
        join(original.extensionPath, 'dist', 'product.json'),
        join(kit.extensionPath, 'dist', 'product.json'),
      ]);
    });

    it('keep mixing Cool Material Icons by the earlier id while the original is not installed', () => {
      const kit = own();
      testState.extensions = [kit];
      testState.config.productIconThemeLayers = [EARLIER_MATERIAL_PRODUCT_THEME_ID];
      testState.config.productIconByName = { 'debug-*': EARLIER_MATERIAL_PRODUCT_THEME_ID };

      assert.deepEqual(mixedFonts(), [{ font: join(kit.extensionPath, 'dist', `${kit.id}.woff`), id: EARLIER_MATERIAL_PRODUCT_THEME_ID }]);
      assert.deepEqual(productIconService.mix().byName.map(({ theme }) => theme.id), [EARLIER_MATERIAL_PRODUCT_THEME_ID]);
      assert.deepEqual(productIconService.watchedPaths(), [join(kit.extensionPath, 'dist', 'product.json')]);

      // the Product icons tab shows the layer as installed, by the name of the theme it gives
      const state = productMixerState({
        byName: testState.config.productIconByName,
        distPath: join(folder, 'dist'),
        generator: new ProductIconGenerator({ dist: join(folder, 'dist'), productIcons: join(__dirname, '..', '..', 'productIcons') }),
        installed: listProductThemes(),
        labels: { base: 'Cool Islands Icons', result: 'Result' },
        layers: testState.config.productIconThemeLayers,
        mix: productIconService.mix(),
      });
      assert.deepEqual(state.layers, [{ installed: true, label: 'Cool Material Icons', mode: 'fill', theme: EARLIER_MATERIAL_PRODUCT_THEME_ID }]);
      assert.deepEqual(state.columns.map((column) => column.id), ['result', 'base', EARLIER_MATERIAL_PRODUCT_THEME_ID]);
      // the themes to add: Cool Material Icons once, by its own id
      assert.deepEqual(state.themes, [{ id: MATERIAL_PRODUCT_THEME_ID, label: 'Cool Material Icons' }]);
    });
  });

  describe('the commands', () => {
    afterEach(() => {
      testState.foreignCommands = [];
      registeredCommands.clear();
    });

    it('are registered except the ids the original registered first', () => {
      const ids = (JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
        contributes: { commands: Array<{ command: string }> };
      }).contributes.commands.map((item) => item.command);
      const shared = [`${EXTENSION_KEY}.changeArrowTheme`, `${EXTENSION_KEY}.changeFolderColor`];
      testState.foreignCommands = shared;
      registeredCommands.clear();

      const disposables = registerCommands({} as ExtensionContext);
      assert.equal(disposables.length, ids.length - shared.length);
      assert.deepEqual(
        [...registeredCommands.keys()].sort(compareCodeUnits),
        ids.filter((id) => !shared.includes(id)).sort(compareCodeUnits),
      );
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
