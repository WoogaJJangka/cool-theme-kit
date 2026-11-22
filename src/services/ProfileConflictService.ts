import i18next from 'i18next';
import { join } from 'node:path';
import { THEME_SETTING_KEYS } from 'src/@types/config';
import { EXTENSION_KEY } from 'src/helpers/constants';
import { changedSettings, conflictingSettings, newProfileId, settingId, SHARED_KEY, SHARED_SECTION } from 'src/helpers/profileConflict';
import { readThemeState, writeThemeState } from 'src/helpers/themeState';
import { isCancellation } from 'src/helpers/utils';
import { getExtensionPath } from 'src/helpers/vscodeUtils';
import { logger } from 'src/services/LoggingService';
import { ConfigurationTarget, window, workspace } from 'vscode';

import type { ThemeSettings } from 'src/helpers/profileConflict';
import type { Memento } from 'vscode';

/** The settings the notice was shown for in this profile (the same ones are not told twice), `true` after "Never show again" */
const SHOWN_KEY = 'profileConflictShown';
/** The id of this profile, made the first time (the global state is per profile) */
const PROFILE_KEY = 'profileId';

/**
 * All the VS Code profiles share the theme files in the extension folder, but each one has its own settings
 * (helpers/profileConflict). The files remember the profile that wrote them last (`writer` of `.state.json`): when a
 * window rewrites the files of another profile because their theme settings differ, it is logged each time and said
 * once, with a button that makes the settings of this profile the ones of all profiles.
 */
class ProfileConflictService {
  private profile = '';
  private state: Memento | undefined;
  /** The theme settings at the last regeneration of this window: what differs from them was changed here */
  private last: Record<string, unknown> | undefined;
  /** A notice is open */
  private asking = false;

  init(context: { globalState: Memento }): void {
    const known = context.globalState.get<unknown>(PROFILE_KEY);
    this.profile = typeof known === 'string' && known.length > 0 ? known : newProfileId();
    if (this.profile !== known) context.globalState.update(PROFILE_KEY, this.profile);
    this.state = context.globalState;
    this.last = undefined;
    this.asking = false;
  }

  /** The theme settings of this window */
  current(): ThemeSettings {
    const config = workspace.getConfiguration(EXTENSION_KEY);
    const settings: Record<string, unknown> = {};
    const fromWorkspace: string[] = [];
    for (const key of THEME_SETTING_KEYS) {
      settings[key] = config.get(key) ?? null;
      const inspected = config.inspect(key);
      if (inspected?.workspaceValue !== undefined || inspected?.workspaceFolderValue !== undefined) fromWorkspace.push(key);
    }
    return { settings, workspace: fromWorkspace };
  }

  /**
   * After each regeneration of the themes. When it wrote theme files that another profile generated with other values,
   * the two profiles overwrite each other at every start: the settings are logged, and told once. The files are then
   * the ones of this profile. Resolves when the notice is answered (nothing waits for it but the tests).
   * @param written whether a theme file was written
   */
  async regenerated(written: boolean): Promise<void> {
    const current = this.current();
    const changedHere = changedSettings(this.last, current.settings);
    this.last = current.settings;
    const extensionPath = getExtensionPath();
    if (!written || !this.profile || !extensionPath) return;

    const distribution = join(extensionPath, 'dist');
    const { writer } = readThemeState(distribution);
    const keys = conflictingSettings(writer, this.profile, current, this.sharedSettings(), changedHere);
    writeThemeState(distribution, { writer: { profile: this.profile, ...current } });
    if (keys.length > 0) await this.report(keys);
  }

  /**
   * Make the theme settings of this profile the ones of every profile: list them in `workbench.settings.applyToAllProfiles`
   * (VS Code then reads and writes them in the settings of the Default profile, for all profiles), then write the values
   * of this profile there. The other profiles keep their own values in their settings files, unused while shared.
   */
  async shareSettings(): Promise<void> {
    const before = workspace.getConfiguration(EXTENSION_KEY);
    const own = THEME_SETTING_KEYS.map((key) => [key, before.inspect(key)?.globalValue] as const);
    const shared = this.sharedSettings();
    const missing = THEME_SETTING_KEYS.map((key) => settingId(key)).filter((id) => !shared.includes(id));
    if (missing.length > 0) {
      await workspace.getConfiguration(SHARED_SECTION).update(SHARED_KEY, [...shared, ...missing], ConfigurationTarget.Global);
    }

    // Every one, unset ones included (they remove the value of the Default profile): VS Code writes a shared setting in
    // the settings of the Default profile, but the extension host can still give the values of this profile for a
    // moment, so comparing with them would skip the writes (seen in VS Code 1.147)
    const config = workspace.getConfiguration(EXTENSION_KEY);
    for (const [key, value] of own) await config.update(key, value, ConfigurationTarget.Global);
    logger.info(`Theme settings shared across the profiles (${SHARED_SECTION}.${SHARED_KEY})`);
    window.showInformationMessage(i18next.t('profiles.shared'));
  }

  /** The settings listed in `workbench.settings.applyToAllProfiles` */
  private sharedSettings(): unknown[] {
    const value = workspace.getConfiguration(SHARED_SECTION).get<unknown>(SHARED_KEY);
    return Array.isArray(value) ? value : [];
  }

  private async report(keys: string[]): Promise<void> {
    const names = keys.join(', ');
    logger.warn(
      `The theme files were generated by another VS Code profile with other values of ${names}. The profiles share the ` +
        `theme files and overwrite each other's: list these settings in ${SHARED_SECTION}.${SHARED_KEY} to share them.`,
    );
    const shown = this.state?.get<boolean | string>(SHOWN_KEY);
    if (this.asking || shown === true || shown === names) return;

    this.asking = true;
    await this.state?.update(SHOWN_KEY, names);
    const share = { title: i18next.t('profiles.share') };
    const never = { title: i18next.t('neverShowAgain') };
    let action: typeof share | undefined;
    try {
      action = await window.showWarningMessage(i18next.t('profiles.conflict', { settings: names }), share, never);
    } catch (error) {
      // the window closed with the notice open
      if (!isCancellation(error)) logger.error(String(error));
      return;
    } finally {
      this.asking = false;
    }

    if (action === never) await this.state?.update(SHOWN_KEY, true);
    if (action !== share) return;
    try {
      await this.shareSettings();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Could not share the settings across the profiles: ${message}`);
      window.showErrorMessage(`Cool Theme Kit: ${message}`);
    }
  }
}

export const profileConflictService = new ProfileConflictService();
