import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EXTENSION_KEY, ICON_THEME_ID } from 'src/helpers/constants';
import { initI18next } from 'src/i18n/i18next';
import { PRESET_GROUPS, PRESET_SETTING_IDS, PRESETS } from 'src/presets/presets';
import { ISLANDS_PRODUCT_THEME_ID } from 'src/productIcons/islandsProductTheme';
import { missingExtensions, presetItems, PresetService } from 'src/services/PresetService';
import { normalizeAccent, normalizeAccentTargets } from 'src/themes/accent';
import { normalizeColorLayers } from 'src/themes/colorLayers';
import { COLOR_THEMES } from 'src/themes/colorThemes';

import type { Preset } from 'src/presets/presets';
import type { AccentPreviewService } from 'src/services/AccentPreviewService';
import type { Memento } from 'vscode';

import { testState } from '../mocks/vscode';

const root = join(__dirname, '..', '..');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const english = JSON.parse(readFileSync(join(root, 'src', 'i18n', 'locales', 'en.json'), 'utf8'));
const korean = JSON.parse(readFileSync(join(root, 'src', 'i18n', 'locales', 'ko.json'), 'utf8'));
const contributedSettings = new Set(
  manifest.contributes.configuration.flatMap((group: { properties: object }) => Object.keys(group.properties)),
);

const byId = (id: string) => PRESETS.find((preset) => preset.id === id)!;

const memento = () => {
  const state = new Map<string, unknown>();
  return {
    get: <T>(key: string) => state.get(key) as T | undefined,
    keys: () => [...state.keys()],
    update: async (key: string, value: unknown) => {
      if (value === undefined) state.delete(key);
      else state.set(key, value);
    },
  } as unknown as Memento;
};

/** An accent preview that records the calls */
const recorder = () => {
  const calls: string[] = [];
  let pending = false;
  const preview = {
    accept: async (accent: string | undefined) => {
      pending = false;
      calls.push(`accept ${accent}`);
    },
    cancel: async () => {
      pending = false;
      calls.push('cancel');
    },
    get isPending() {
      return pending;
    },
    show: async (accent: string | undefined) => {
      pending = true;
      calls.push(`show ${accent}`);
    },
  };
  return { calls, preview: preview as unknown as AccentPreviewService };
};

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

type Item = { label: string; preset?: Preset };
const itemOf = (id: string) => (testState.quickPicks.at(-1)!.items as Item[]).find((item) => item.preset?.id === id)!;

describe('theme combinations (presets)', () => {
  describe('the data', () => {
    it('has 6 to 8 presets, each id once, in known groups, each named in English and Korean', () => {
      assert.ok(PRESETS.length >= 6 && PRESETS.length <= 8, String(PRESETS.length));
      assert.equal(new Set(PRESETS.map((preset) => preset.id)).size, PRESETS.length);
      for (const preset of PRESETS) {
        assert.ok((PRESET_GROUPS as readonly string[]).includes(preset.group), preset.id);
        for (const locale of [english, korean]) {
          assert.ok(locale.preset[preset.id]?.name, `${preset.id} name`);
          assert.ok(locale.preset[preset.id]?.description, `${preset.id} description`);
        }
      }
      for (const group of PRESET_GROUPS) assert.ok(english.preset.group[group] && korean.preset.group[group], group);
    });

    it('writes only settings that exist, with values their settings take', () => {
      for (const id of PRESET_SETTING_IDS) {
        assert.ok(id.startsWith('workbench.') || contributedSettings.has(id), id);
      }
      for (const preset of PRESETS) {
        const { settings } = preset;
        const color = settings['workbench.colorTheme'];
        if (color !== undefined) assert.ok(COLOR_THEMES.some((info) => info.label === color), `${preset.id} ${String(color)}`);
        if ('workbench.iconTheme' in settings) assert.equal(settings['workbench.iconTheme'], ICON_THEME_ID);
        if ('workbench.productIconTheme' in settings) assert.equal(settings['workbench.productIconTheme'], ISLANDS_PRODUCT_THEME_ID);
        const accent = settings[`${EXTENSION_KEY}.accentColor`];
        if (accent !== undefined && accent !== null) assert.equal(normalizeAccent(accent), accent, preset.id);
        const targets = settings[`${EXTENSION_KEY}.accentTargets`];
        if (Array.isArray(targets)) assert.deepEqual(normalizeAccentTargets(targets), targets, preset.id);
        const layers = settings[`${EXTENSION_KEY}.colorThemeLayers`];
        if (Array.isArray(layers)) assert.equal(normalizeColorLayers(layers).length, layers.length, preset.id);
      }
    });

    it('names the extensions it needs by their Marketplace id, and needs one for every theme of another extension', () => {
      for (const preset of PRESETS) {
        for (const id of preset.extensions) assert.match(id, /^[\da-z-]+\.[\da-z-]+$/, preset.id);
        const others = JSON.stringify(preset.settings).match(/"theme":/g)?.length ?? 0;
        assert.ok(others === 0 || preset.extensions.length > 0, preset.id);
      }
    });

    it('is not applied by installing the extension: no configurationDefaults of the workbench', () => {
      const defaults = Object.keys(manifest.contributes.configurationDefaults ?? {});
      assert.deepEqual(defaults.filter((key) => key.startsWith('workbench.')), []);
    });
  });

  describe('PresetService', () => {
    before(async () => {
      await initI18next();
    });

    beforeEach(() => {
      testState.config = { 'workbench.colorTheme': 'Default Dark Modern' };
      testState.sections = new Set(['workbench', EXTENSION_KEY]);
      testState.quickPicks = [];
      testState.messages = [];
      testState.answers = [];
      testState.executed = [];
      testState.extensions = [];
    });

    afterEach(() => {
      testState.config = {};
      testState.sections = new Set();
      testState.quickPicks = [];
      testState.messages = [];
      testState.answers = [];
      testState.executed = [];
      testState.extensions = [];
    });

    it('lists the presets by group, telling which ones need an extension', () => {
      const items = presetItems() as Item[];
      assert.equal(items.filter((item) => item.preset).length, PRESETS.length);
      const oneDark = items.find((item) => item.preset?.id === 'oneDarkSyntax') as Item & { description?: string };
      assert.match(oneDark.description ?? '', /zhuangtongfa\.material-theme/);
      assert.deepEqual(missingExtensions(byId('jetbrainsDark')), []);
      testState.extensions = [{ extensionPath: '', id: 'Zhuangtongfa.Material-Theme', packageJSON: {} }];
      assert.deepEqual(missingExtensions(byId('oneDarkSyntax')), []);
    });

    it('shows the preset the user stops on, and puts everything back on Escape', async () => {
      const { calls, preview } = recorder();
      const service = new PresetService(preview);
      service.init(memento());
      const choosing = service.choose();
      const quickPick = testState.quickPicks.at(-1)!;

      quickPick.fireActive(itemOf('materialGreen'));
      await wait(300);
      assert.equal(testState.config['workbench.colorTheme'], 'Cool Islands Dark');
      assert.equal(testState.config['workbench.iconTheme'], ICON_THEME_ID);
      // the layers and targets wait for the choice
      assert.equal(testState.config[`${EXTENSION_KEY}.accentTargets`], undefined);

      quickPick.fireActive(itemOf('vscodeIconsFill'));
      await wait(300);
      // a preset without a color theme shows the one of the user
      assert.equal(testState.config['workbench.colorTheme'], 'Default Dark Modern');

      quickPick.hide();
      await choosing;
      assert.deepEqual(calls, ['show #79cb60', 'cancel']);
      assert.equal(testState.config['workbench.colorTheme'], 'Default Dark Modern');
      assert.equal(testState.config['workbench.iconTheme'], undefined);
    });

    it('applies the preset chosen, and undo puts the settings back', async () => {
      testState.config[`${EXTENSION_KEY}.colorThemeLayers`] = [{ syntax: 'override', theme: 'Monokai', ui: 'off' }];
      const { calls, preview } = recorder();
      const service = new PresetService(preview);
      service.init(memento());
      const choosing = service.choose();
      testState.quickPicks.at(-1)!.accept(itemOf('materialGreen'));
      await choosing;

      assert.equal(testState.config['workbench.colorTheme'], 'Cool Islands Dark');
      assert.equal(testState.config['workbench.productIconTheme'], ISLANDS_PRODUCT_THEME_ID);
      assert.deepEqual(testState.config[`${EXTENSION_KEY}.accentTargets`], ['controls', 'tabs', 'folders']);
      assert.equal(testState.config[`${EXTENSION_KEY}.colorThemeLayers`], undefined);
      assert.deepEqual(calls, ['accept #79cb60']);
      assert.match(testState.messages.at(-1)?.text ?? '', /Material green/);

      await service.undo();
      assert.equal(testState.config['workbench.colorTheme'], 'Default Dark Modern');
      assert.equal(testState.config['workbench.productIconTheme'], undefined);
      assert.equal(testState.config[`${EXTENSION_KEY}.accentTargets`], undefined);
      assert.deepEqual(testState.config[`${EXTENSION_KEY}.colorThemeLayers`], [{ syntax: 'override', theme: 'Monokai', ui: 'off' }]);
      assert.deepEqual(calls, ['accept #79cb60', 'accept undefined']);

      await service.undo();
      assert.match(testState.messages.at(-1)?.text ?? '', /No theme combination to undo/);
    });

    it('asks before installing the extensions a preset needs, and changes nothing when the user declines', async () => {
      const service = new PresetService(recorder().preview);
      service.init(memento());

      assert.equal(await service.apply(byId('oneDarkSyntax')), false);
      assert.deepEqual(testState.executed, []);
      assert.equal(testState.config[`${EXTENSION_KEY}.colorThemeLayers`], undefined);
      assert.equal(testState.config['workbench.colorTheme'], 'Default Dark Modern');

      testState.answers = ['Install and Apply'];
      assert.equal(await service.apply(byId('oneDarkSyntax')), true);
      assert.deepEqual(testState.executed, [['workbench.extensions.installExtension', 'zhuangtongfa.material-theme']]);
      assert.deepEqual(testState.config[`${EXTENSION_KEY}.colorThemeLayers`], [{ syntax: 'override', theme: 'One Dark Pro', ui: 'off' }]);
    });

    it('offers a reload and the undo once applied', async () => {
      const service = new PresetService(recorder().preview);
      service.init(memento());
      testState.answers = ['Undo'];
      await service.apply(byId('jetbrainsLight'));
      await wait(10);
      assert.equal(testState.config['workbench.colorTheme'], 'Default Dark Modern');
    });
  });
});
