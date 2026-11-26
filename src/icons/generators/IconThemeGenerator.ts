
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';
import { IconStyle } from 'src/@types/config';
import { getFilesPath, getFoldersOpenPath, getFoldersPath, JSON_FILE_NAME } from 'src/helpers/constants';
import { findCustomIcon, findCustomOpenFolderIcon, getCustomIconName, isCustomIconPath } from 'src/helpers/customIcons';
import { FileCopies } from 'src/helpers/fileCopies';
import { writeFileAtomicAsync } from 'src/helpers/fsUtils';
import { getFileConfigHash, withDefaults } from 'src/icons/configUtils';
import { glassIcon, markedFile, toMetric } from 'src/icons/glass/glassIcons';
import { ROLE_ICON_PREFIX } from 'src/icons/roles';
import { IconConfiguration } from 'src/models/IconConfiguration';

import { FileJsonGenerator } from './FileJsonGenerator';
import { folderColorService } from './FolderColorService';
import { FolderJsonGenerator } from './FolderJsonGenerator';
import { filterFontColor } from './FontColorService';
import { LanguageJsonGenerator } from './LanguageJsonGenerator';
import { monochromeService } from './MonochromeService';
import { opacityService } from './OpacityService';
import { saturationService } from './SaturationService';
import { ThemeLayerGenerator } from './ThemeLayerGenerator';

import type { AtomConfig } from 'src/@types/config';
import type { LanguageLookup, LayerTheme } from 'src/helpers/themeLayers';
import type { IconGroup, IconKind, IconMetric, IconMetrics, IconRole } from 'src/icons/glass/glassIcons';

/** The measures of the bundled icons the glass style places them with (`bun run sync:metrics`), in `assets/icons` */
const METRICS_FILE = 'metrics.json';

/** What an icon is drawn for in the glass style, and what was measured for it (nothing for an icon not bundled) */
type Glass = { kind: IconKind; metric?: IconMetric };

const KINDS: Record<IconGroup, IconKind> = { files: 'file', folders: 'folder', foldersOpen: 'folderOpen' };

/**
 * The JetBrains New UI glyphs (`bun run sync:glyphs`): in the glass style, a file icon with a file of its name in
 * this folder of `assets/icons` is drawn with it, in place of the icon of the icon plugin
 */
const GLYPHS_FOLDER = 'glass';

/** Association values that are paths to custom SVG files */
const customValues = (associations?: Record<string, string>) =>
  Object.values(associations ?? {}).filter((value) => typeof value === 'string' && isCustomIconPath(value));

/**
 * Icons written for other settings: `name~hash.svg` (a filter setting that is not the default), the custom icons
 * of the user (`custom-…`) and the icons with the mark of a role (`role-…`, for the names of the settings of the
 * moment). Without a cleanup, every filter change left a full copy of the icons in the extension folder.
 */
const isGeneratedIcon = (file: string) => /~-?\d+\.svg$/.test(file) || file.startsWith('custom-') || file.startsWith(ROLE_ICON_PREFIX);

/**
 * `name.svg` (or `name~old.svg`) -> `name<hash>.svg`: the name up to its first `.` or `~`, then the hash of the filter
 * settings. Names that start with `.`/`~` or have no `.svg` are kept. Same result as the former
 * `replace(/(^[^.~]+)(.*)\.svg/, …)`, without its backtracking.
 */
export const hashedIconName = (file: string, hash: string): string => {
  const stem = file.search(/[.~]/);
  const svg = file.lastIndexOf('.svg');
  if (stem <= 0 || svg < stem) return file;
  return `${file.slice(0, stem)}${hash}.svg${file.slice(svg + '.svg'.length)}`;
};

/** The installed icon themes mixed with this theme, and the languages of the file names and extensions */
export type ThemeLayers = { languages: LanguageLookup; themes: LayerTheme[] };

/**
 * Explicit locations used by the generators. When omitted, they are guessed from `__dirname`.
 */
export type GeneratorPaths = {
  /** Folder receiving the generated theme json and processed icons */
  dist: string;
  /** Root of the iconGenerator submodule */
  iconGenerator: string;
};

export class IconThemeGenerator {
  atomConfig: AtomConfig;
  iconConfig: IconConfiguration;

  /** The icon files written in each dist folder by this generation */
  private readonly writtenIcons = new Map<string, Set<string>>();
  /** The icon files to write: copied together once the theme json is made */
  private readonly copies = new FileCopies();
  /** The files of `dist/layers` the mixed themes use, the others are removed */
  private layerFiles = new Set<string>();
  /** The measures of the bundled icons, read for the glass style only */
  private metrics: IconMetrics | undefined;
  /** The files of the New UI glyphs (`json.svg`), and their folder: none with the flat style */
  private glyphs = new Set<string>();
  private glyphsPath = '';
  /** Where each bundled file icon is drawn from (`go.svg`), and how: an icon with the mark of a role is drawn from it again */
  private readonly fileSources = new Map<string, { file: string; glass?: Glass }>();

  languageGenerator: LanguageJsonGenerator;
  fileGenerator: FileJsonGenerator;
  folderGenerator: FolderJsonGenerator;

  /**
   * @param updatedJSONConfig the settings, missing ones get their default value
   * @param paths where to read the icons and write the theme
   * @param layers the installed icon themes the settings mix with this theme, and the languages of the names
   */
  constructor(
    updatedJSONConfig: Partial<AtomConfig> = {},
    private readonly paths?: GeneratorPaths,
    private readonly layers?: ThemeLayers,
  ) {
    // Initializes the config with the default values and provided changes
    // A shallow merge on purpose: lodash.merge would merge arrays index by index,
    // mixing the user's activeIconPacks with the default ones (#71)
    const atomConfig = withDefaults(updatedJSONConfig);
    const iconConfig = new IconConfiguration(atomConfig);

    this.languageGenerator = new LanguageJsonGenerator(atomConfig, iconConfig);
    this.fileGenerator = new FileJsonGenerator(atomConfig, iconConfig);
    this.folderGenerator = new FolderJsonGenerator(atomConfig, iconConfig);

    this.atomConfig = atomConfig;
    this.iconConfig = iconConfig;
  }

  /**
   * Create the atom config to be serialized to json, and the icon files it points to. The files are read and written
   * without blocking the extension host, before the json: the theme never points to an icon not written yet.
   */
  async createJsonTheme(): Promise<void> {
    // Update this.iconConfig
    this.generateJsonConfig();
    await this.copies.run();

    try {
      const json = this.iconConfig;
      await writeFileAtomicAsync(join(this.iconPath(), JSON_FILE_NAME), JSON.stringify(json, undefined, 2));
    } catch (error) {
      throw new Error('Failed to create icon file: ' + error, { cause: error });
    }

    // the icons of other settings and of the themes no longer mixed, once the theme no longer points to them
    for (const [folder, written] of this.writtenIcons) this.removeStaleIcons(folder, written);
    ThemeLayerGenerator.clean(this.iconPath(), this.layerFiles);
  }

  /**
   * Generate the theme json from the files
   * @private
   */
  private generateJsonConfig() {
    // Apply filters and copy icons to dist
    const fileIconNames = this.prepareIcons();
    for (const generator of [this.languageGenerator, this.fileGenerator]) {
      generator.setFileIconNames(fileIconNames);
    }

    // Load language icons onto the config
    this.languageGenerator.loadLanguageIconAssociations();

    // Load file icons onto the config
    this.fileGenerator.loadFileIconAssociations();
    this.writeRoleIcons();

    // Load folder icons onto the config
    this.folderGenerator.loadFolderIconAssociations();

    // Last, mix the other installed icon themes
    this.loadThemeLayers();
  }

  /**
   * The icons with the mark of a role the file names point to (`role-run-go.svg` for `main.go`): the file icon under
   * the mark, drawn with the mark over its corner.
   * @private
   */
  private writeRoleIcons() {
    const destination = getFilesPath(this.iconPath());
    const fileConfigHash = getFileConfigHash(this.atomConfig);

    for (const [name, { icon, role }] of this.fileGenerator.roleIcons) {
      const source = this.fileSources.get(`${icon}.svg`);
      if (source) this.writeIcon(destination, hashedIconName(`${name}.svg`, fileConfigHash), source.file, source.glass, role);
    }
  }

  /**
   * Mix the other installed icon themes of `iconThemeLayers` and `iconThemeByName` with this theme.
   * Their fingerprint is stored in the json to regenerate the theme when one of them changes.
   * @private
   */
  private loadThemeLayers() {
    const distributionPath = this.iconPath();
    this.iconConfig.layerThemes = '';

    if (!this.layers?.themes.length) return;

    const generator = new ThemeLayerGenerator(
      this.atomConfig,
      this.iconConfig,
      this.layers.themes,
      this.layers.languages,
      distributionPath,
      this.copies,
      getFileConfigHash(this.atomConfig),
      // a file icon of another theme goes on a tile like those of this theme; its folders keep their own drawing
      (svg, isFile) => this.filterSvg(svg, isFile ? { kind: 'file' } : undefined),
      (color) => filterFontColor(color, this.atomConfig),
    );
    // a theme that cannot be read (being rewritten) is left out, so the fingerprint differs and it is read again
    this.iconConfig.layerThemes = generator.apply();
    this.layerFiles = generator.files;
  }

  /**
   * TODO this logic sucks because the iconPath can be different depending on the execution context
   * if it's npm or if it's vscode :(
   * @returns {string}
   * @private
   */
  private iconPath() {
    if (this.paths) return this.paths.dist;

    let iconJsonPath = __dirname;
    // if executed via script
    if (basename(__dirname) !== 'dist') {
      iconJsonPath = join(__dirname, '..', '..', '..', 'dist');
    }
    return iconJsonPath;
  }

  /**
   * TODO this logic sucks because the iconPath can be different depending on the execution context
   * if it's npm or if it's vscode :(
   * @returns {string}
   * @private
   */
  private iconGeneratorPath() {
    if (this.paths) return this.paths.iconGenerator;

    let iconJsonPath = __dirname;
    // if executed via script
    if (basename(__dirname) !== 'dist') {
      iconJsonPath = join(__dirname, '..', '..', '..', 'dist');
    }
    if (basename(iconJsonPath) === 'dist') {
      iconJsonPath = join(iconJsonPath, '..', 'iconGenerator');
    }
    return iconJsonPath;
  }

  /**
   * Apply filters to the icons and copy them to dist
   * @returns the names of the bundled file icons, without `.svg`
   * @private
   */
  private prepareIcons(): string[] {
    const iconGeneratorPath = join(this.iconGeneratorPath(), 'assets', 'icons');

    const filesPath = getFilesPath(iconGeneratorPath);
    // A package built without the iconGenerator submodule cannot regenerate anything (#73)
    if (!existsSync(filesPath)) {
      throw new Error(`Icon sources not found in ${iconGeneratorPath}: the extension package is incomplete`);
    }
    const foldersPath = getFoldersPath(iconGeneratorPath);
    const foldersOpenPath = getFoldersOpenPath(iconGeneratorPath);

    const distributionPath = this.iconPath();

    const distributionFilesPath = getFilesPath(distributionPath);
    const distributionFoldersPath = getFoldersPath(distributionPath);
    const distributionFoldersOpenPath = getFoldersOpenPath(distributionPath);

    this.metrics = this.readMetrics();
    this.readGlyphs();
    this.applyFiltersAndCopy(filesPath, distributionFilesPath, 'files');
    this.applyFiltersAndCopy(foldersPath, distributionFoldersPath, 'folders');
    this.applyFiltersAndCopy(foldersOpenPath, distributionFoldersOpenPath, 'foldersOpen');
    this.copyMissingOpenFolders(foldersPath, foldersOpenPath, distributionFoldersOpenPath);

    // icons of this fork that are not in iconGenerator (assets/icons/NOTICE.md), next to the submodule
    const extraPath = join(this.iconGeneratorPath(), '..', 'assets', 'icons');
    const extraFilesPath = getFilesPath(extraPath);
    const extraFiles = existsSync(extraFilesPath) ? readdirSync(extraFilesPath) : [];
    if (extraFiles.length > 0) this.applyFiltersAndCopy(extraFilesPath, distributionFilesPath, 'files');
    // its folder icons (src/scripts/icons/folderBadges.ts), each with its expanded icon
    for (const [path, destination, group] of [
      [getFoldersPath(extraPath), distributionFoldersPath, 'folders'],
      [getFoldersOpenPath(extraPath), distributionFoldersOpenPath, 'foldersOpen'],
    ] as const) {
      if (existsSync(path)) this.applyFiltersAndCopy(path, destination, group);
    }

    this.copyCustomIcons(distributionPath);

    return [...readdirSync(filesPath), ...extraFiles].map((file) => file.replace(/\.svg$/, ''));
  }

  /**
   * The measures of the bundled icons, for the glass style. Without them (a package without the file) the file icons
   * are placed by their viewBox and the folders stay as they are drawn: a worse look, not a failure.
   * @private
   */
  private readMetrics(): IconMetrics | undefined {
    if (this.atomConfig.iconStyle !== IconStyle.Glass) return undefined;

    try {
      const file = join(this.iconGeneratorPath(), '..', 'assets', 'icons', METRICS_FILE);
      return JSON.parse(readFileSync(file, 'utf8')) as IconMetrics;
    } catch {
      return undefined;
    }
  }

  /** The New UI glyphs of the glass style: a few file names, read once a generation */
  private readGlyphs() {
    this.glyphsPath = getFilesPath(join(this.iconGeneratorPath(), '..', 'assets', 'icons', GLYPHS_FOLDER));
    const used = this.atomConfig.iconStyle === IconStyle.Glass && existsSync(this.glyphsPath);
    this.glyphs = new Set(used ? readdirSync(this.glyphsPath) : []);
  }

  /** How an icon is drawn in the glass style; nothing with the flat style */
  private glass(group: keyof IconMetrics, iconFile: string, kind: IconKind): Glass | undefined {
    if (this.atomConfig.iconStyle !== IconStyle.Glass) return undefined;
    return { kind, metric: toMetric(this.metrics?.[group]?.[iconFile.replace(/\.svg$/, '')]) };
  }

  /**
   * A folder icon without an expanded variant (`plastic`) keeps its closed icon when expanded,
   * instead of pointing the theme to a missing file.
   * @private
   */
  private copyMissingOpenFolders(foldersPath: string, foldersOpenPath: string, destination: string) {
    const fileConfigHash = getFileConfigHash(this.atomConfig);
    const openIcons = new Set(readdirSync(foldersOpenPath));

    for (const iconFile of readdirSync(foldersPath)) {
      if (openIcons.has(iconFile)) continue;

      const hashedFile = hashedIconName(iconFile, fileConfigHash);
      // the glass folder is drawn open, with the badge of the closed icon
      this.writeIcon(destination, hashedFile, join(foldersPath, iconFile), this.glass('folders', iconFile, 'folderOpen'));
    }
  }

  /**
   * Copy the user's custom SVG icons next to the bundled ones, with the same filters.
   * Missing files are skipped: the generators then drop their association.
   * @private
   */
  private copyCustomIcons(distributionPath: string) {
    const fileConfigHash = getFileConfigHash(this.atomConfig);

    // language icons are file icons too
    const fileValues = [
      ...customValues(this.atomConfig.filesAssociations),
      ...customValues(this.atomConfig.languagesAssociations),
    ];
    for (const value of fileValues) {
      const source = findCustomIcon(value);
      if (!source) continue;
      const target = `${getCustomIconName(value)}${fileConfigHash}.svg`;
      // a file icon of the user goes on a tile like the others; a folder icon is a whole drawing, kept as it is
      const glass: Glass | undefined = this.atomConfig.iconStyle === IconStyle.Glass ? { kind: 'file' } : undefined;
      this.writeIcon(getFilesPath(distributionPath), target, source, glass);
    }

    for (const value of customValues(this.atomConfig.foldersAssociations)) {
      const source = findCustomIcon(value);
      if (!source) continue;
      const target = `${getCustomIconName(value)}${fileConfigHash}.svg`;
      this.writeIcon(getFoldersPath(distributionPath), target, source);
      this.writeIcon(getFoldersOpenPath(distributionPath), target, findCustomOpenFolderIcon(source));
    }
  }

  /**
   * Apply filters to the icons and copy them to dist
   * @param {string} source
   * @param destination
   * @param group what the icons are: files, folders or expanded folders
   * @private
   */
  private applyFiltersAndCopy(source: string, destination: string, group: IconGroup) {
    const iconFiles = readdirSync(source);
    const fileConfigHash = getFileConfigHash(this.atomConfig);

    for (const iconFile of iconFiles) {
      // apply color, opacity and saturation
      const hashedFile = hashedIconName(iconFile, fileConfigHash);
      // a file type the JetBrains IDEs have their own icon for: its glyph in place of the icon, in the glass style
      const glyph = group === 'files' && this.glyphs.has(iconFile);
      const file = glyph ? join(this.glyphsPath, iconFile) : join(source, iconFile);
      const glass = this.glass(glyph ? 'glyphs' : group, iconFile, KINDS[group]);
      if (group === 'files') this.fileSources.set(iconFile, { file, glass });
      this.writeIcon(destination, hashedFile, file, glass);
    }
  }

  /**
   * Write an icon of a source file to a dist folder, with the filters, and remember it to keep it in
   * {@link removeStaleIcons}. It is written with the other icons by {@link createJsonTheme}.
   * @param role for a file icon, the role to mark over its corner
   */
  private writeIcon(folder: string, file: string, source: string, glass?: Glass, role?: IconRole) {
    let written = this.writtenIcons.get(folder);
    if (!written) {
      written = new Set();
      this.writtenIcons.set(folder, written);
    }
    written.add(file);
    this.copies.add({ change: (svg) => this.filterSvg(svg, glass, role), source, target: join(folder, file) });
  }

  /**
   * Remove the icons generated for previous settings, which the theme no longer uses.
   * The bundled icons without a hash are kept: the packaged theme points to them.
   * @private
   */
  private removeStaleIcons(folder: string, written: Set<string>) {
    for (const file of readdirSync(folder)) {
      if (isGeneratedIcon(file) && !written.has(file)) rmSync(join(folder, file), { force: true });
    }
  }

  /**
   * The filters of the icons (folder color, glass style, monochrome, opacity, saturation), for the content of an svg
   * file. The glass style comes after the folder color, which it reads from the icon, and before the others, which
   * work on any svg. The mark of a role is drawn with the glass style, or alone on a flat icon.
   */
  private filterSvg(content: string, glass?: Glass, role?: IconRole) {
    let svg = content;

    // folder color
    svg = folderColorService.applyFolderColor(svg, this.atomConfig.folderColor);

    // glass style
    if (glass && this.atomConfig.iconStyle === IconStyle.Glass) svg = glassIcon(svg, glass.kind, glass.metric, role);
    else if (role) svg = markedFile(svg, role);

    // Monochrome
    svg = monochromeService.applyMonochrome(svg, this.atomConfig.monochrome, this.atomConfig.monochromeColor);

    // Opacity
    svg = opacityService.applyOpacity(svg, this.atomConfig.opacity);

    // Saturation
    svg = saturationService.applySaturation(svg, this.atomConfig.saturation);

    return svg;
  }
}
