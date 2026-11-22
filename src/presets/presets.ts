/**
 * The built-in theme combinations (presets) of the command `choosePreset`: a few settings written together, chosen
 * from the research of docs/THEME_COMBINATIONS.md. Pure data: `services/PresetService.ts` applies them.
 *
 * A preset writes only the settings it lists, to the user settings; `null` takes the user value away (the default).
 * The names and descriptions are `preset.<id>.name` / `preset.<id>.description` in the locales.
 */
import { EXTENSION_KEY, ICON_THEME_ID } from 'src/helpers/constants';
import { compareCodeUnits } from 'src/helpers/utils';
import { ISLANDS_PRODUCT_THEME_ID } from 'src/productIcons/islandsProductTheme';
import { COLOR_THEMES } from 'src/themes/colorThemes';

/** The groups of the picker, in its order */
const PRESET_GROUPS = ['jetbrains', 'syntax', 'frame', 'icons'] as const;

type PresetGroup = (typeof PRESET_GROUPS)[number];

type Preset = {
  /** the Marketplace ids of the extensions whose themes it uses, besides this one */
  extensions: string[];
  group: PresetGroup;
  id: string;
  /** full setting id -> value; `null` removes the user value */
  settings: Record<string, unknown>;
};

const DARK = COLOR_THEMES[0].label;
const LIGHT = COLOR_THEMES[1].label;
const kit = (key: string) => `${EXTENSION_KEY}.${key}`;

/** The three themes of the kit, with the given color theme */
const jetbrains = (colorTheme: string) => ({
  'workbench.colorTheme': colorTheme,
  'workbench.iconTheme': ICON_THEME_ID,
  'workbench.productIconTheme': ISLANDS_PRODUCT_THEME_ID,
});

/** The color settings of the kit as they are by default */
const plainColors = {
  [kit('accentColor')]: null,
  [kit('accentTargets')]: null,
  [kit('colorThemeLayers')]: null,
};

const PRESETS: Preset[] = [
  {
    extensions: [],
    group: 'jetbrains',
    id: 'jetbrainsDark',
    settings: { ...jetbrains(DARK), ...plainColors },
  },
  {
    extensions: [],
    group: 'jetbrains',
    id: 'jetbrainsLight',
    settings: { ...jetbrains(LIGHT), ...plainColors },
  },
  {
    extensions: [],
    group: 'jetbrains',
    id: 'materialGreen',
    settings: {
      ...jetbrains(DARK),
      ...plainColors,
      [kit('accentColor')]: '#79cb60',
      [kit('accentTargets')]: ['controls', 'tabs', 'folders'],
    },
  },
  {
    extensions: ['zhuangtongfa.material-theme'],
    group: 'syntax',
    id: 'oneDarkSyntax',
    settings: {
      ...jetbrains(DARK),
      ...plainColors,
      [kit('colorThemeLayers')]: [{ syntax: 'override', theme: 'One Dark Pro', ui: 'off' }],
    },
  },
  {
    extensions: ['dracula-theme.theme-dracula'],
    group: 'syntax',
    id: 'draculaSyntax',
    settings: {
      ...jetbrains(DARK),
      ...plainColors,
      [kit('colorThemeLayers')]: [{ syntax: 'override', theme: 'Dracula Theme', ui: 'off' }],
    },
  },
  {
    extensions: ['catppuccin.catppuccin-vsc', 'catppuccin.catppuccin-vsc-icons'],
    group: 'syntax',
    id: 'catppuccinMocha',
    settings: {
      ...jetbrains(DARK),
      ...plainColors,
      [kit('colorThemeLayers')]: [{ syntax: 'override', theme: 'Catppuccin Mocha', ui: 'off' }],
      [kit('iconThemeLayers')]: [{ files: 'fill', folders: 'override', theme: 'catppuccin-mocha' }],
    },
  },
  {
    extensions: ['github.github-vscode-theme'],
    group: 'frame',
    id: 'githubDarkFrame',
    settings: {
      ...jetbrains(DARK),
      ...plainColors,
      [kit('colorThemeLayers')]: [{ syntax: 'off', theme: 'GitHub Dark Default', ui: 'override' }],
    },
  },
  {
    extensions: ['vscode-icons-team.vscode-icons'],
    group: 'icons',
    id: 'vscodeIconsFill',
    settings: {
      'workbench.iconTheme': ICON_THEME_ID,
      [kit('iconThemeLayers')]: ['vscode-icons'],
    },
  },
];

/** The settings any preset writes: what `undoPreset` restores */
const PRESET_SETTING_IDS = [...new Set(PRESETS.flatMap((preset) => Object.keys(preset.settings)))].sort(compareCodeUnits);

export { PRESET_GROUPS, PRESET_SETTING_IDS, PRESETS };
export type { Preset, PresetGroup };
