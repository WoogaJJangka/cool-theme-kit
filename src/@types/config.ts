import type { IconAssociations } from './associations';
import type { ProductIconLayer } from 'src/productIcons/productIconLayers';
import type { AccentTarget } from 'src/themes/accent';
import type { ColorThemeLayer } from 'src/themes/colorLayers';

export enum IconPack {
  Angular = 'angular',
  Angular2 = 'angular2',
  Css = 'css',
  Nest = 'nest',
  Next = 'next',
  Ngrx = 'ngrx',
  Phalcon = 'phalcon',
  PyCharm = 'pycharm',
  Rails = 'rails',
  React = 'react',
  Recoil = 'recoil',
  Redux = 'redux',
  Tests = 'tests',
  Volt = 'volt',
  Vue = 'vue',
  Vuex = 'vuex',
  None = 'none',
}

export enum FolderTheme {
  Classic = 'classic',
  None = 'none',
  Specific = 'specific',
}

/**
 * How the file and folder icons are drawn:
 * - glass: every file icon is a glyph on the same rounded tile, every folder the same rounded folder (the default)
 * - glossy: the icons as the JetBrains plugin draws them, with the shading of the glass style over their own shape
 * - flat: the icons as the JetBrains plugin draws them (the look before the style existed)
 */
export enum IconStyle {
  Flat = 'flat',
  Glass = 'glass',
  Glossy = 'glossy',
}

export enum PredefinedOpacity {
  Transparent = 'transparent',
  SemiTransparent = 'semiTransparent',
  Opaque = 'opaque',
  Custom = 'custom'
}

export enum PredefinedSaturation {
  Grayscale = 'grayscale',
  Desaturated = 'desaturated',
  Vivid = 'vivid',
  Custom = 'custom'
}

export type AtomConfig = {
  /** `#rrggbb` replacing the blue of Cool Islands (not an icon setting); empty for the Islands blue */
  accentColor?: string,
  /** what else takes the accent: `controls`, `tabs` (workbench colors) and `folders` (the folder icons, through `folderColor`) */
  accentTargets: AccentTarget[],
  activeIconPacks: IconPack[],
  arrowTheme: ArrowTheme,
  /** color id glob, `scope:<TextMate scope>` or `semantic:<selector>` -> id of the installed color theme giving it */
  colorThemeByKey?: Record<string, string>,
  /** other installed color themes mixed with Cool Islands, the first listed wins (not an icon setting) */
  colorThemeLayers: ColorThemeLayer[],
  filesAssociations?: IconAssociations,
  foldersAssociations?: IconAssociations,
  folderColor: string,
  folderTheme: FolderTheme,
  hideFileIcons: boolean,
  iconStyle: IconStyle,
  /** file name, `*.ext` or `folder/` -> id of the installed file icon theme giving its icon */
  iconThemeByName?: Record<string, string>,
  /** other installed file icon themes mixed with this theme, the first listed wins */
  iconThemeLayers: IconThemeLayer[],
  languagesAssociations?: IconAssociations,
  monochrome: boolean,
  monochromeColor: string,
  opacity: number,
  /** icon id or glob -> id of the installed product icon theme giving its icon (not an icon setting) */
  productIconByName?: Record<string, string>,
  /** other installed product icon themes mixed with Cool Islands Icons, the first listed wins (not an icon setting) */
  productIconThemeLayers: ProductIconLayer[],
  /** mark the files whose name gives them a role (`main.py`, `__init__.py`, `conftest.py`…) over the corner of their icon */
  roleMarks: boolean,
  saturation: number,
  /** suggest installing the fonts of the default editor font when they are missing */
  showFontMessage: boolean,
  showReloadMessage: boolean,
  showUpdateMessage: boolean,
  showWelcomeMessage: boolean,
}

/**
 * How a layer theme mixes with this theme, for files or for folders:
 * - fill: only for the names no theme above gives an icon to
 * - override: its icon wins for every name it gives an icon to, and its default file or folder icon too
 * - off: nothing
 */
export type LayerMode = 'fill' | 'off' | 'override';

/** Another installed file icon theme: its id (`fill` for files and folders), or its id with a mode for each */
export type IconThemeLayer = string | { files?: LayerMode; folders?: LayerMode; theme: string };

export enum UpdateStatus {
  NeverUsedBefore,
  Updated,
  Current,
}

export enum FileMappingType {
  FileExtensions = 'fileExtensions',
  FileNames = 'fileNames',
}

export type Theme = {
  accent: string;
  attributes: string;
  background: string;
  blue: string;
  border: string;
  button: string;
  className: string;
  classes: string;
  comments: string;
  contrast: string;
  cyan: string;
  dark: boolean;
  desc: string
  disabled: string;
  error: string;
  excluded: string;
  foreground: string;
  functions: string;
  gray: string;
  green: string;
  hl: string;
  id: string;
  keywords: string;
  links: string;
  name2: string;
  name: string;
  notif: string;
  numbers: string;
  operators: string;
  orange: string;
  parameters: string;
  purple: string;
  red: string;
  scheme: string;
  second: string;
  selectBg: string;
  selectFg2: string;
  selectFg: string;
  strings: string;
  table: string;
  tags: string;
  text: string;
  tree: string;
  vars: string;
  white: string;
  yellow: string;
}

export type ThemeColor = {
  name: string,
  color: string;
}

export enum ArrowTheme {
  Material = 'material',
  Triangle = 'triangle',
  PlusMinus = 'plusMinus',
  Arrow = 'arrow',
  None = 'none',
}

/** Settings that are baked into the generated icon theme json */
export const ICON_SETTING_KEYS = [
  'activeIconPacks',
  'filesAssociations',
  'folderColor',
  'folderTheme',
  'foldersAssociations',
  'hideFileIcons',
  'iconStyle',
  'iconThemeByName',
  'iconThemeLayers',
  'languagesAssociations',
  'monochrome',
  'monochromeColor',
  'opacity',
  'roleMarks',
  'saturation',
] as const;

export type IconSettings = Pick<AtomConfig, (typeof ICON_SETTING_KEYS)[number]>;

/**
 * Every setting that changes a generated theme file: the file icons, the product icons and the Cool Islands colors.
 * The files are in the extension folder, which all the VS Code profiles share: these are the settings to share across
 * the profiles (`workbench.settings.applyToAllProfiles`, services/ProfileConflictService). Every setting of
 * package.json but the `show…Message` ones (test/unit/profileConflict.test.ts).
 */
export const THEME_SETTING_KEYS = [
  ...ICON_SETTING_KEYS,
  'accentColor',
  'accentTargets',
  'arrowTheme',
  'colorThemeByKey',
  'colorThemeLayers',
  'productIconByName',
  'productIconThemeLayers',
] as const;
