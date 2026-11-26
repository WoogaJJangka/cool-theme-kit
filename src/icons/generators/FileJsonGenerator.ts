import merge from 'lodash.merge';
import { FileMappingType, IconPack } from 'src/@types/config';
import {
  DARK_FILE_ENDING,
  HIGH_CONTRAST_FILE_ENDING,
  PYCHARM_PYTHON_ICON,
  PYTHON_EXTENSIONS,
  PYTHON_FILE,
  WILDCARD_PATTERN,
} from 'src/helpers/constants';
import { findCustomIcon, getCustomIconName, isCustomIconPath } from 'src/helpers/customIcons';
import { normalizeName } from 'src/helpers/utils';
import { fileExceptions } from 'src/icons/exceptions';
import { commonFiles } from 'src/icons/files/common';
import { AbstractJsonGenerator } from 'src/icons/generators/AbstractJsonGenerator';
import { upstreamFiles } from 'src/icons/files/upstream';
import { fileIcons } from 'src/icons/index';
import { ROLE_NAMES, roleIconName } from 'src/icons/roles';

import type { AtomConfig } from 'src/@types/config';
import type { FileAssociation, FileAssociations } from 'src/@types/associations';
import type { IconRole } from 'src/icons/glass/glassIcons';
import type { IconConfiguration } from 'src/models/IconConfiguration';

/** The sections of the theme a name has an icon in: the dark themes, the light ones, the high contrast ones */
const VARIANTS = ['dark', 'light', 'highContrast'] as const;

export class FileJsonGenerator extends AbstractJsonGenerator {
  /**
   * The icons with the mark of a role the theme points to, by name: the file icon under the mark, and the role.
   * The theme generator draws them once the associations are loaded.
   */
  public readonly roleIcons = new Map<string, { icon: string; role: IconRole }>();

  constructor(override readonly atomConfig: AtomConfig, override readonly iconConfig: IconConfiguration) {
    super(atomConfig, iconConfig);
  }

  /**
   * Load the file icon definitions onto the icon configuration object.
   * @private
   */
  public loadFileIconAssociations() {
    // JetBrains "Hide file icons": no file icon at all, not even the default one
    if (this.atomConfig.hideFileIcons) return;

    // first, remove languages by pack
    const enabledAssociations = this.disableAssociationsByPack(fileIcons);
    // Order, the last one wins: hand-written associations, then their icon packs (an active pack replaces the base
    // icon of the same name), then the associations generated from the JetBrains plugin, which decide the icon
    // of every name the JetBrains plugin knows, as PyCharm shows it, then what this theme decides for itself: the
    // common names the plugin has no icon of their own for, and the few exceptions
    const upstream = new Set<unknown>(upstreamFiles);
    const own = new Set<unknown>([...commonFiles, ...fileExceptions]);
    const manualAssociations = enabledAssociations.filter((icon) => !upstream.has(icon) && !own.has(icon));
    const ordered = [
      ...manualAssociations.filter((icon) => !icon.enabledFor),
      ...manualAssociations.filter((icon) => icon.enabledFor),
      ...enabledAssociations.filter((icon) => upstream.has(icon)),
      ...enabledAssociations.filter((icon) => own.has(icon)),
    ];

    for (const fileAssoc of ordered) {
      if (fileAssoc.disabled) continue;

      this.loadFileAssociation(fileAssoc);
    }

    // PyCharm shows every Python file with the Python icon, whatever its name (manage.py, __init__.py...)
    if (this.atomConfig.activeIconPacks.includes(IconPack.PyCharm)) {
      this.loadFileAssociation(this.getPythonFilesAssociation());
    }

    // last, the user's custom file associations win over everything
    const customAssociations = this.getCustomAssociations();
    for (const fileAssoc of customAssociations) {
      this.loadFileAssociation(fileAssoc);
    }

    // the names with a role get its mark, but the names the user gave an icon to
    if (this.atomConfig.roleMarks) this.loadRoleMarks(new Set(customAssociations.flatMap((fileAssoc) => fileAssoc.fileNames ?? [])));

    // next, add the default file icon
    this.loadDefaultFileAssociation();
  }

  /**
   * Give the file names with a role (`main.py`, `__init__.py`, `conftest.py`…, src/icons/roles.ts) the icon of their
   * extension with the mark of the role. A name with an icon of its own keeps it: `test.js` (the icon of a JavaScript
   * test), `manage.py` without the pycharm pack (Django). So does a name of a language without an icon, and a name
   * whose extension has an svg of the user as its icon.
   * @param customNames the names the user gave an icon to
   * @private
   */
  private loadRoleMarks(customNames: Set<string>) {
    const sections = { dark: this.iconConfig, highContrast: this.iconConfig.highContrast, light: this.iconConfig.light };

    for (const { fileNames, role } of ROLE_NAMES) {
      for (const fileName of fileNames.map((name) => normalizeName(name))) {
        if (customNames.has(fileName)) continue;

        const extension = this.extensionOf(fileName);
        const icon = extension && this.iconConfig.fileExtensions?.[extension];
        if (!extension || !icon || !this.isBundledFileIcon(icon)) continue;

        const own = this.iconConfig.fileNames?.[fileName];
        if (own && own !== icon) continue;

        // the icon of the extension in each kind of theme, with the mark; a kind without one falls back to the dark one
        for (const variant of VARIANTS) {
          const section = sections[variant];
          const base = section?.fileExtensions?.[extension];
          if (!section || !base || !this.isBundledFileIcon(base)) {
            if (variant !== 'dark') delete section?.fileNames?.[fileName];
            continue;
          }

          const marked = roleIconName(role, base);
          this.roleIcons.set(marked, { icon: base, role });
          this.addFileIconDefinition(marked);
          section.fileNames ??= {};
          section.fileNames[fileName] = marked;
        }
      }
    }
  }

  /** The extension VS Code gives the icon of to a file name: the longest one with an icon */
  private extensionOf(fileName: string): string | undefined {
    const parts = fileName.split('.');
    for (let index = 1; index < parts.length; index++) {
      const extension = parts.slice(index).join('.');
      if (this.iconConfig.fileExtensions?.[extension]) return extension;
    }
    return undefined;
  }

  /**
   * The PyCharm Python icon for every file name and extension of a Python file already mapped by another icon
   * (`manage.py` -> djangoconfig, `test.py` -> testpy...), plus the Python extensions themselves.
   * @private
   */
  private getPythonFilesAssociation(): FileAssociation {
    return {
      fileExtensions: [...new Set([...PYTHON_EXTENSIONS, ...Object.keys(this.iconConfig.fileExtensions ?? {}).filter((key) => PYTHON_FILE.test(key))])],
      fileNames: Object.keys(this.iconConfig.fileNames ?? {}).filter((key) => PYTHON_FILE.test(key)),
      light: true,
      name: PYCHARM_PYTHON_ICON,
    };
  }

  /**
   * Load a file association from the fileIcons.ts onto the config
   * @param {FileAssociation} fileAssoc the association to parse and add
   * @private
   */
  private loadFileAssociation(fileAssoc: FileAssociation): void {
    const assocName = fileAssoc.name;
    // Add regular file association
    this.addFileIconDefinition(assocName);

    // add light variant if needed
    if (fileAssoc.light) {
      // todo check if it indeed works with light/dark
      this.iconConfig.light = merge({}, this.iconConfig.light);
      this.addFileIconDefinition(assocName, DARK_FILE_ENDING);
    }

    // add highContrast variant if needed
    if (fileAssoc.highContrast) {
      // todo check if it indeed works with highContrast
      this.iconConfig.highContrast = merge({}, this.iconConfig.highContrast);
      this.addFileIconDefinition(assocName, HIGH_CONTRAST_FILE_ENDING);
    }

    // next, load the file extensions and file names
    this.mapIconsToAssociations(fileAssoc, FileMappingType.FileExtensions);
    this.mapIconsToAssociations(fileAssoc, FileMappingType.FileNames);
  }

  /**
   * Disable file associations by icon pack
   * @param {FileAssociations} fileIcons
   * @private
   */
  private disableAssociationsByPack(fileIcons: FileAssociations): FileAssociation[] {
    if (!fileIcons.icons) return [];

    return fileIcons.icons.filter((icon) => {
      if (!icon.enabledFor) return true;

      return icon.enabledFor.some((pack) => this.atomConfig.activeIconPacks.includes(pack));
    });
  }

  /**
   * Gets the user's custom file associations, with wildcards removed
   * @returns {FileAssociation[]}
   * @private
   */
  private getCustomAssociations(): FileAssociation[] {
    const fileAssociations = this.atomConfig.filesAssociations;
    if (!fileAssociations) return [];

    return Object.entries(fileAssociations)
      .filter(([key, value]) => key.length > 0 && typeof value === 'string' && value.length > 0)
      // a custom SVG that does not exist would point to a missing file
      .filter(([, value]) => !isCustomIconPath(value) || findCustomIcon(value))
      .map(([key, value]) => {
        const pattern = normalizeName(key);
        const name = isCustomIconPath(value) ? getCustomIconName(value) : this.resolveFileIconName(value);
        // reuse the light/high contrast variants of the built-in icon, if any
        const builtIn = fileIcons.icons.find((icon) => icon.name === name);
        const variants = { highContrast: builtIn?.highContrast, light: builtIn?.light };

        // `*.ext` and `**.ext` target an extension, anything else is an exact file name
        return WILDCARD_PATTERN.test(pattern)
          ? { ...variants, fileExtensions: [pattern.replace(WILDCARD_PATTERN, '')], name }
          : { ...variants, fileNames: [pattern], name };
      });
  }

  /**
   * Map the icons to the file associations
   * @param {FileAssociation} fileAssoc
   * @param {FileMappingType} FileExtensions
   * @private
   */
  private mapIconsToAssociations(fileAssoc: FileAssociation, FileExtensions: FileMappingType) {
    switch (FileExtensions) {
      case FileMappingType.FileExtensions: {
        this.mapFileExtensions(fileAssoc);
        break;
      }
      case FileMappingType.FileNames: {
        this.mapFileNames(fileAssoc);
        break;
      }
      default: {
        break;
      }
    }
  }

  /**
   * Map file extensions to their respective icons
   * @param {FileAssociation} fileAssoc
   * @private
   */
  private mapFileExtensions(fileAssoc: FileAssociation): void {
    // Make sure we have the file extensions...
    if (!fileAssoc.fileExtensions) return;

    // VS Code lowercases the keys: two spellings of a key would be two entries, one silently overriding the other
    for (const fileExtension of fileAssoc.fileExtensions.map((key) => normalizeName(key))) {
      // Skip the association if there is a custom assoc
      if (this.shouldOverwriteFileNames(fileExtension)) continue;

      // First, add the file extension
      if (!this.iconConfig.fileExtensions) {
        this.iconConfig.fileExtensions = {};
      }
      this.iconConfig.fileExtensions[fileExtension] = fileAssoc.name;
      // drop the variants of a previous association of this extension that this one does not replace
      this.clearVariants(FileMappingType.FileExtensions, fileExtension, fileAssoc);

      // Then add the light variant if needed
      if (fileAssoc.light) {
        if (!this.iconConfig.light) {
          this.iconConfig.light = {};
        }
        if (!this.iconConfig.light.fileExtensions) {
          this.iconConfig.light.fileExtensions = {};
        }

        // Replace the original extension to icon with the '_dark' suffix
        this.iconConfig.fileExtensions[fileExtension] = `${fileAssoc.name}${DARK_FILE_ENDING}`;
        // and the plain icon (meant for light backgrounds) to the light config
        this.iconConfig.light.fileExtensions[fileExtension] = fileAssoc.name;
      }

      // Then add the highContrast variant if needed
      if (fileAssoc.highContrast) {
        if (!this.iconConfig.highContrast) {
          this.iconConfig.highContrast = {};
        }
        if (!this.iconConfig.highContrast.fileExtensions) {
          this.iconConfig.highContrast.fileExtensions = {};
        }

        // And add the highContrast variant to the highContrast config
        this.iconConfig.highContrast.fileExtensions[fileExtension] = `${fileAssoc.name}${HIGH_CONTRAST_FILE_ENDING}`;
      }
    }
  }

  /**
   * Map file extensions to their respective icons
   * @param {FileAssociation} fileAssoc
   * @private
   */
  private mapFileNames(fileAssoc: FileAssociation): void {
    // Make sure we have the file names...
    if (!fileAssoc.fileNames) return;

    for (const fileName of fileAssoc.fileNames.map((key) => normalizeName(key))) {
      // Skip the association if there is a custom assoc
      if (this.shouldOverwriteFileNames(fileName)) continue;

      // First, add the file extension
      if (!this.iconConfig.fileNames) {
        this.iconConfig.fileNames = {};
      }
      this.iconConfig.fileNames[fileName] = fileAssoc.name;
      this.clearVariants(FileMappingType.FileNames, fileName, fileAssoc);

      // Then add the light variant if needed
      if (fileAssoc.light) {
        if (!this.iconConfig.light) {
          this.iconConfig.light = {};
        }
        if (!this.iconConfig.light.fileNames) {
          this.iconConfig.light.fileNames = {};
        }

        // Replace the original extension to icon with the '_dark' suffix
        this.iconConfig.fileNames[fileName] = `${fileAssoc.name}${DARK_FILE_ENDING}`;
        // and the plain icon (meant for light backgrounds) to the light config
        this.iconConfig.light.fileNames[fileName] = fileAssoc.name;
      }

      // Then add the highContrast variant if needed
      if (fileAssoc.highContrast) {
        if (!this.iconConfig.highContrast) {
          this.iconConfig.highContrast = {};
        }
        if (!this.iconConfig.highContrast.fileNames) {
          this.iconConfig.highContrast.fileNames = {};
        }

        // Replace the original extension to icon with the '_highContrast' suffix
        this.iconConfig.fileNames[fileName] = `${fileAssoc.name}${HIGH_CONTRAST_FILE_ENDING}`;
        // And add the highContrast variant to the highContrast config
        this.iconConfig.highContrast.fileNames[fileName] = `${fileAssoc.name}${HIGH_CONTRAST_FILE_ENDING}`;
      }
    }
  }

  /**
   * Remove the light / high contrast mapping left by an earlier association of the same key,
   * otherwise the light theme keeps showing the replaced icon (css_dark instead of css2).
   */
  private clearVariants(type: FileMappingType, key: string, fileAssoc: FileAssociation) {
    if (!fileAssoc.light) delete this.iconConfig.light?.[type]?.[key];
    if (!fileAssoc.highContrast) delete this.iconConfig.highContrast?.[type]?.[key];
  }

  /**
   * Add the default file association to the config
   * @private
   */
  private loadDefaultFileAssociation() {
    this.addFileIconDefinition(fileIcons.defaultIcon.name);
    this.iconConfig.file = fileIcons.defaultIcon.name;

    if (fileIcons.defaultIcon.light) {
      this.addFileIconDefinition(fileIcons.defaultIcon.name, DARK_FILE_ENDING);
      // Replace the default file with the variant with the '_dark' suffix
      this.iconConfig.file = fileIcons.defaultIcon.name + DARK_FILE_ENDING;

      // Add the original icon to the light config
      if (!this.iconConfig.light) {
        this.iconConfig.light = {};
      }
      this.iconConfig.light.file = fileIcons.defaultIcon.name;
    }

    if (fileIcons.defaultIcon.highContrast) {
      this.addFileIconDefinition(fileIcons.defaultIcon.name, HIGH_CONTRAST_FILE_ENDING);

      // Add the original icon to the hc config
      if (!this.iconConfig.highContrast) {
        this.iconConfig.highContrast = {};
      }
      this.iconConfig.highContrast.file = fileIcons.defaultIcon.name + HIGH_CONTRAST_FILE_ENDING;
    }
  }

  /**
   * Checks if the custom file associations should overwrite the defined file associations.
   * Only associations with two asterisks in the wildcard should be able to overwrite
   * @param {string} extension
   * @returns {Boolean}
   * @private
   */
  private shouldOverwriteFileNames(extension: string): boolean {
    const customFileAssociations = this.iconConfig.atomConfig?.filesAssociations ?? {};

    return Object.keys(customFileAssociations).some((key) => {
      // overwrite is enabled if there are two asterisks in the wildcard
      if (!/^\*{2}\./.test(key)) {
        return false;
      }

      // check if the file name contains the particular file extension
      // (e.g. extension ".md" in "Readme.md" should be overwritten with the *.md icon)
      const customFileExtension = key.replace(WILDCARD_PATTERN, '.');
      return extension.toLowerCase().includes(customFileExtension.toLowerCase());
    });
  }
}
