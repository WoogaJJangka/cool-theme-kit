import { strict as assert } from 'node:assert';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import i18next from 'i18next';
import { THEME_SETTING_KEYS } from 'src/@types/config';
import { EXTENSION_KEY, JSON_FILE_NAME, JSON_PRODUCT_FILE_NAME } from 'src/helpers/constants';
import { changedSettings, conflictingSettings, settingId } from 'src/helpers/profileConflict';
import { readThemeState, writeThemeState } from 'src/helpers/themeState';
import { initI18next } from 'src/i18n/i18next';
import { configChangeDetector } from 'src/services/ConfigChangeDetector';
import { profileConflictService } from 'src/services/ProfileConflictService';

import { testState } from '../mocks/vscode';

import type { ThemeWriter } from 'src/helpers/themeState';
import type { Memento } from 'vscode';

const repoRoot = join(__dirname, '..', '..');
const LINKED_FOLDERS = ['iconGenerator', 'assets'];
const APPLY_TO_ALL_PROFILES = 'workbench.settings.applyToAllProfiles';

/** The ids the Default profile and another one keep in their global state */
const ids = { default: 'd0d0d0d0d0d0d0d0', other: '0b0b0b0b0b0b0b0b' };

/** A memento kept in memory, as `context.globalState` (one per profile) */
const memento = (initial: Record<string, unknown> = {}): Memento => {
  const values = new Map<string, unknown>(Object.entries(initial));
  return {
    get: <T>(key: string, fallback?: T) => (values.has(key) ? (values.get(key) as T) : fallback),
    keys: () => [...values.keys()],
    update: async (key: string, value: unknown) => {
      values.set(key, value);
    },
  } as Memento;
};

/** Every theme setting unset (`null`), with the given values */
const settings = (values: Record<string, unknown> = {}) => ({
  ...Object.fromEntries(THEME_SETTING_KEYS.map((key) => [key, null])),
  ...values,
});

const writer = (profile: string, values: Record<string, unknown> = {}, workspace: string[] = []): ThemeWriter => ({
  profile,
  settings: settings(values),
  workspace,
});

describe('settings that differ between profiles', () => {
  describe('the theme settings', () => {
    it('are every setting of package.json but the messages to show', () => {
      const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
      const ids = (packageJson.contributes.configuration as { properties: Record<string, unknown> }[]).flatMap((group) => Object.keys(group.properties));
      const themeIds = ids.filter((id) => !/^a-file-icon-vscode\.show\w+Message$/.test(id));
      assert.deepEqual([...THEME_SETTING_KEYS].map(settingId).sort(), themeIds.sort());
    });

    it('are the ones the README says to share across the profiles', () => {
      const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
      const block = /"workbench\.settings\.applyToAllProfiles": \[([^\]]*)\]/.exec(readme);
      assert.ok(block, 'README section "VS Code profiles"');
      assert.deepEqual([...block[1].matchAll(/"([\w.-]+)"/g)].map((match) => match[1]), THEME_SETTING_KEYS.map(settingId));
    });
  });

  describe('the id of a profile', () => {
    it('is made once, and kept in the global state of the profile', () => {
      const state = memento();
      profileConflictService.init({ globalState: state });
      const id = state.get<string>('profileId');
      assert.match(String(id), /^[\da-f]{16}$/);
      profileConflictService.init({ globalState: state });
      assert.equal(state.get('profileId'), id);

      const another = memento();
      profileConflictService.init({ globalState: another });
      assert.notEqual(another.get('profileId'), id);
    });
  });

  describe('conflictingSettings', () => {
    const current = (values: Record<string, unknown> = {}, workspace: string[] = []) => ({ settings: settings(values), workspace });
    const none = new Set<string>();

    it('finds none without a writer, or when this profile wrote the files', () => {
      assert.deepEqual(conflictingSettings(undefined, 'a', current({ accentColor: '#e06c75' }), [], none), []);
      assert.deepEqual(conflictingSettings(writer('a'), 'a', current({ accentColor: '#e06c75' }), [], none), []);
    });

    it('lists the settings another profile generated the files with another value of', () => {
      const other = writer('b', { accentColor: '#e06c75', iconThemeLayers: [] });
      assert.deepEqual(conflictingSettings(other, 'a', current({ iconThemeLayers: ['material-icon-theme'] }), [], none), ['iconThemeLayers', 'accentColor']);
      assert.deepEqual(conflictingSettings(other, 'a', current({ accentColor: '#e06c75', iconThemeLayers: [] }), [], none), []);
    });

    it('leaves out the settings shared across the profiles', () => {
      const other = writer('b', { accentColor: '#e06c75', opacity: 0.5 });
      assert.deepEqual(conflictingSettings(other, 'a', current(), [settingId('accentColor')], none), ['opacity']);
    });

    it('leaves out the settings a workspace sets, in either window', () => {
      const other = writer('b', { accentColor: '#e06c75', opacity: 0.5 }, ['opacity']);
      assert.deepEqual(conflictingSettings(other, 'a', current({ saturation: 0.7 }, ['accentColor']), [], none), ['saturation']);
    });

    it('leaves out the settings changed in this window: the user changed them here', () => {
      const other = writer('b', { opacity: 0.5 });
      assert.deepEqual(conflictingSettings(other, 'a', current({ accentColor: '#e06c75' }), [], new Set(['accentColor'])), ['opacity']);
    });

    it('ignores a state file it cannot read, and the settings it does not list', () => {
      const broken = { profile: 'b', settings: 'nope', workspace: 'nope' } as unknown as ThemeWriter;
      assert.deepEqual(conflictingSettings(broken, 'a', current({ accentColor: '#e06c75' }), [], none), []);
      const older = { profile: 'b', settings: { opacity: 0.5 }, workspace: [] } as ThemeWriter;
      assert.deepEqual(conflictingSettings(older, 'a', current({ accentColor: '#e06c75' }), [], none), ['opacity']);
    });
  });

  describe('changedSettings', () => {
    it('finds no change before the first regeneration, then the settings whose value changed', () => {
      assert.deepEqual([...changedSettings(undefined, settings({ opacity: 0.5 }))], []);
      assert.deepEqual([...changedSettings(settings(), settings({ opacity: 0.5, iconThemeLayers: [] }))], ['iconThemeLayers', 'opacity']);
      assert.deepEqual([...changedSettings(settings({ iconThemeLayers: [] }), settings({ iconThemeLayers: [] }))], []);
    });
  });

  describe('the windows of two profiles', () => {
    const profiles = { default: memento({ profileId: ids.default }), other: memento({ profileId: ids.other }) };
    const dist = () => join(testState.extensionPath, 'dist');

    /** A window of the profile starts (its settings are `testState.config`) */
    const openWindow = (profile: keyof typeof profiles) => profileConflictService.init({ globalState: profiles[profile] });

    /** What `regenerateTheme` of extension.ts does for the icon themes */
    const regenerate = () => profileConflictService.regenerated(configChangeDetector.listenForChanges());

    before(async () => {
      assert.ok(existsSync(join(repoRoot, 'dist', JSON_FILE_NAME)), 'run `bun run build` first');
      await initI18next();
    });

    beforeEach(() => {
      testState.config = {};
      testState.messages = [];
      testState.answers = [];
      testState.sections = new Set();
      testState.defaultProfile = undefined;
      profiles.default = memento({ profileId: ids.default });
      profiles.other = memento({ profileId: ids.other });
      testState.extensionPath = mkdtempSync(join(tmpdir(), 'afi-profiles-'));
      for (const file of [JSON_FILE_NAME, JSON_PRODUCT_FILE_NAME]) cpSync(join(repoRoot, 'dist', file), join(dist(), file));
      for (const folder of LINKED_FOLDERS) symlinkSync(join(repoRoot, folder), join(testState.extensionPath, folder), 'junction');
    });

    afterEach(() => {
      testState.sections = new Set();
      testState.defaultProfile = undefined;
      // remove the junctions first so the real icons are never touched
      for (const folder of LINKED_FOLDERS) rmSync(join(testState.extensionPath, folder), { force: true, recursive: false });
      rmSync(testState.extensionPath, { force: true, recursive: true });
    });

    it('says once in each profile that they overwrite each other, and remembers the last one', async () => {
      openWindow('default');
      testState.config = { iconThemeLayers: ['material-icon-theme'], opacity: 1 };
      await regenerate();
      assert.equal(readThemeState(dist()).writer?.profile, undefined, 'the files of the install are as they were');

      // the other profile has its own value: its window generates the theme again, over the files of the install
      openWindow('other');
      testState.config = { iconThemeLayers: [], opacity: 1 };
      await regenerate();
      assert.deepEqual(testState.messages.map((message) => message.text), [], 'nobody wrote the files before');
      assert.equal(readThemeState(dist()).writer?.profile, ids.other);

      // back in the Default profile: it overwrites the files of the other profile
      openWindow('default');
      testState.config = { iconThemeLayers: ['material-icon-theme'], opacity: 1 };
      await regenerate();
      assert.equal(testState.messages.length, 1);
      assert.equal(testState.messages[0].kind, 'warning');
      assert.match(testState.messages[0].text, /another VS Code profile had generated them with other values of iconThemeLayers\./);
      assert.equal(readThemeState(dist()).writer?.profile, ids.default);

      // and they keep overwriting each other (the theme files are written again each time): told once in each profile
      for (let round = 0; round < 2; round++) {
        openWindow('other');
        testState.config = { iconThemeLayers: [], opacity: 1 };
        await profileConflictService.regenerated(true);
        openWindow('default');
        testState.config = { iconThemeLayers: ['material-icon-theme'], opacity: 1 };
        await profileConflictService.regenerated(true);
      }
      assert.equal(testState.messages.length, 2);
      assert.match(testState.messages[1].text, /other values of iconThemeLayers\./);
    });

    it('says nothing when the profile generated the files itself, or when nothing was written', async () => {
      openWindow('other');
      testState.config = { iconThemeLayers: [] };
      await regenerate();
      // the next window of the same profile: the files are up to date
      openWindow('other');
      await regenerate();
      testState.config = { iconThemeLayers: [], opacity: 0.8 };
      await profileConflictService.regenerated(true);
      assert.deepEqual(testState.messages.map((message) => message.text), []);

      writeThemeState(dist(), { writer: writer(ids.default, { opacity: 0.5 }) });
      openWindow('other');
      await profileConflictService.regenerated(false);
      assert.deepEqual(testState.messages.map((message) => message.text), [], 'the files of the other profile were not touched');
    });

    it('says nothing about a change the user just made in this window', async () => {
      writeThemeState(dist(), { writer: writer(ids.default) });
      openWindow('other');
      await profileConflictService.regenerated(false);
      testState.config = { opacity: 0.8 };
      await profileConflictService.regenerated(true);
      assert.deepEqual(testState.messages.map((message) => message.text), []);
      assert.equal(readThemeState(dist()).writer?.settings.opacity, 0.8);
    });

    it('says nothing about the settings shared across the profiles', async () => {
      writeThemeState(dist(), { writer: writer(ids.default, { accentColor: '#e06c75' }) });
      // read through the section `workbench.settings`, its key `applyToAllProfiles`
      testState.config = { applyToAllProfiles: [settingId('accentColor')] };
      openWindow('other');
      await profileConflictService.regenerated(true);
      assert.deepEqual(testState.messages.map((message) => message.text), []);
    });

    it('is not told again after "Never show again", even for other settings', async () => {
      writeThemeState(dist(), { writer: writer(ids.default, { accentColor: '#e06c75' }) });
      testState.answers = [i18next.t('neverShowAgain')];
      openWindow('other');
      await profileConflictService.regenerated(true);
      assert.equal(testState.messages.length, 1);

      writeThemeState(dist(), { writer: writer(ids.default, { opacity: 0.5 }) });
      openWindow('other');
      await profileConflictService.regenerated(true);
      assert.equal(testState.messages.length, 1);
    });

    it('tells it again for other settings', async () => {
      writeThemeState(dist(), { writer: writer(ids.default, { accentColor: '#e06c75' }) });
      openWindow('other');
      await profileConflictService.regenerated(true);
      writeThemeState(dist(), { writer: writer(ids.default, { accentColor: '#e06c75', opacity: 0.5 }) });
      openWindow('other');
      await profileConflictService.regenerated(true);
      assert.equal(testState.messages.length, 2);
      assert.match(testState.messages[1].text, /other values of opacity, accentColor\./);
    });

    it('makes the settings of this profile the ones of all the profiles', async () => {
      // the window is in another profile; the Default profile shares a setting of its own already
      testState.sections = new Set([EXTENSION_KEY, 'workbench.settings']);
      testState.defaultProfile = { [APPLY_TO_ALL_PROFILES]: ['editor.fontSize'], [settingId('opacity')]: 0.5 };
      testState.config = { [settingId('accentColor')]: '#e06c75', [settingId('iconThemeLayers')]: [] };
      writeThemeState(dist(), { writer: writer(ids.default, { opacity: 0.5 }) });
      testState.answers = [i18next.t('profiles.share')];

      openWindow('other');
      await profileConflictService.regenerated(true);

      const shared = testState.defaultProfile[APPLY_TO_ALL_PROFILES] as string[];
      assert.deepEqual(shared, ['editor.fontSize', ...THEME_SETTING_KEYS.map(settingId)]);
      // the values of this profile, now in the Default profile's settings for all the profiles
      assert.equal(testState.defaultProfile[settingId('accentColor')], '#e06c75');
      assert.deepEqual(testState.defaultProfile[settingId('iconThemeLayers')], []);
      assert.equal(testState.defaultProfile[settingId('opacity')], undefined);
      assert.deepEqual(
        testState.messages.map((message) => message.kind),
        ['warning', 'information'],
      );
      assert.match(testState.messages[0].text, /other values of iconThemeLayers, opacity, accentColor\./);

      // the next regeneration finds every setting shared
      testState.messages = [];
      writeThemeState(dist(), { writer: writer(ids.default, { opacity: 0.5 }) });
      openWindow('other');
      await profileConflictService.regenerated(true);
      assert.deepEqual(testState.messages.map((message) => message.text), []);
    });

    it('adds nothing twice to the shared settings, from the Default profile', async () => {
      testState.sections = new Set([EXTENSION_KEY, 'workbench.settings']);
      testState.config = { [APPLY_TO_ALL_PROFILES]: [settingId('opacity')], [settingId('opacity')]: 0.5 };
      openWindow('default');
      await profileConflictService.shareSettings();
      const others = THEME_SETTING_KEYS.map(settingId).filter((id) => id !== settingId('opacity'));
      assert.deepEqual(testState.config[APPLY_TO_ALL_PROFILES], [settingId('opacity'), ...others]);
      assert.equal(testState.config[settingId('opacity')], 0.5);
      assert.equal(testState.messages.length, 1, 'the settings are shared');
    });
  });
});
