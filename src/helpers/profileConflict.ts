import { randomBytes } from 'node:crypto';
import { THEME_SETTING_KEYS } from 'src/@types/config';
import { EXTENSION_KEY } from 'src/helpers/constants';
import { isDeepEqual } from 'src/helpers/utils';

import type { ThemeWriter } from 'src/helpers/themeState';

/**
 * The profiles of VS Code share the extension folder, so the theme files generated in it, while the settings that
 * generate them are kept per profile. Two profiles with other values then overwrite each other's theme at every start
 * of a window. A setting listed in `workbench.settings.applyToAllProfiles` is the same in all profiles: VS Code reads
 * and writes it in the settings of the Default profile.
 */
const SHARED_SECTION = 'workbench.settings';
const SHARED_KEY = 'applyToAllProfiles';

/** The theme settings of one window: their values (`null` when unset) and the ones a workspace sets */
type ThemeSettings = Pick<ThemeWriter, 'settings' | 'workspace'>;

/** The full id of a setting of this extension, as `workbench.settings.applyToAllProfiles` lists it */
const settingId = (key: string) => `${EXTENSION_KEY}.${key}`;

/**
 * A new id for a profile, kept in its `globalState` (services/ProfileConflictService). The global state is the one
 * thing an extension has per profile: `globalStorageUri` is the same folder in every profile (VS Code 1.147), and no
 * API names the profile.
 */
const newProfileId = (): string => randomBytes(8).toString('hex');

/** The theme settings whose value changed in this window between two regenerations (none before the first one) */
const changedSettings = (previous: Record<string, unknown> | undefined, current: Record<string, unknown>): Set<string> =>
  new Set(previous ? THEME_SETTING_KEYS.filter((key) => !isDeepEqual(previous[key] ?? null, current[key] ?? null)) : []);

/**
 * The theme settings for which this window overwrote the theme files of another profile: that profile generated them
 * with another value, and
 * - the setting is not shared across profiles (a shared one has one value; the files may predate the sharing),
 * - neither value comes from a workspace (it then depends on the folder, not on the profile, and sharing would not change it),
 * - it was not changed in this window since its last regeneration: that is a change the user just made here, the other
 *   profile overwrites it back at its next start and says so there.
 */
const conflictingSettings = (
  writer: ThemeWriter | undefined,
  profile: string,
  current: ThemeSettings,
  shared: readonly unknown[],
  changedHere: ReadonlySet<string>,
): string[] => {
  // the state file can be anything: an older one, or edited
  if (!writer || typeof writer.profile !== 'string' || writer.profile === profile) return [];
  const { settings } = writer;
  if (!settings || typeof settings !== 'object') return [];
  const fromWorkspace = new Set([...(Array.isArray(writer.workspace) ? writer.workspace : []), ...current.workspace]);

  return THEME_SETTING_KEYS.filter(
    (key) =>
      Object.hasOwn(settings, key) &&
      !isDeepEqual(settings[key], current.settings[key] ?? null) &&
      !shared.includes(settingId(key)) &&
      !fromWorkspace.has(key) &&
      !changedHere.has(key),
  );
};

export { changedSettings, conflictingSettings, newProfileId, settingId, SHARED_KEY, SHARED_SECTION };
export type { ThemeSettings };
