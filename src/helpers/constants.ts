export const ICON_THEME_KEY = 'workbench.iconTheme';
/**
 * Key of the settings, and the earlier id of the file icon theme. The original Atom Material Icons
 * (AtomMaterial.a-file-icon-vscode) contributes a theme and settings with the same ids: with both installed, VS Code
 * keeps the ones of the extension whose folder name comes first, theirs.
 */
export const EXTENSION_KEY = 'a-file-icon-vscode';
/**
 * Id of the file icon theme (`workbench.iconTheme`) the kit selects: no other extension contributes it. EXTENSION_KEY
 * still selects the same theme while no other extension contributes that id.
 */
export const ICON_THEME_ID = 'cool-theme-kit-icons';
/**
 * The id of this extension from 1.0.0 to 1.3.0. It was removed from the Marketplace, and an installed copy contributes the
 * same settings and theme ids as this one.
 */
export const OLD_EXTENSION_ID = 'woogajjangka.cool-icon-vscode';
/** `publisher` of package.json: the extension id is `publisher.name`, so keep these three in sync (see packageIdentity.test.ts) */
export const PUBLISHER_ID = 'woogajjangka';
/** `name` of package.json. Not EXTENSION_KEY: the marketplace needs a name that is unique across publishers */
export const PACKAGE_NAME = 'cool-theme-kit';
export const FONT_NAME = `${EXTENSION_KEY}.woff`;
export const EXTENSION_ID = `${PUBLISHER_ID}.${PACKAGE_NAME}`;
export const VERSION_KEY = `${EXTENSION_KEY}.version`;
export const JSON_FILE_NAME = `${EXTENSION_KEY}-icon-theme.json`;
/** Theme id of the Material Icon Theme extension (PKief.material-icon-theme) */
export const MATERIAL_ICON_THEME = 'material-icon-theme';
export const JSON_PRODUCT_FILE_NAME = `${EXTENSION_KEY}-product-icon-theme.json`;

export const DEFAULT_FOLDER_COLOR = '#90a4ae';
export const DEFAULT_OPACITY = 1;
export const DEFAULT_SATURATION = 1;
export const DEFAULT_MONOCHROME_COLOR = '#90a4ae';

/** Icon of Python files in PyCharm (assets/icons/files, from JetBrains/intellij-community) */
export const PYCHARM_PYTHON_ICON = 'pycharm-python';
export const PYTHON_EXTENSIONS = ['py', 'pyi', 'pyw'];
/** A file name or extension of a Python file: `py`, `manage.py`, `test.py`... */
export const PYTHON_FILE = /(?:^|\.)(?:py|pyi|pyw)$/;

export const FOLDER_PREFIX = 'folder-';
export const ICON_GENERATOR_PATH = 'iconGenerator/assets/icons';
export const FILES_SUBPATH = 'files';
export const FOLDERS_SUBPATH = 'folders';
export const FOLDERS_OPEN_SUBPATH = 'foldersOpen';
export const DIST_PATH = 'dist';

export const getFilesPath = (prefix: string) => `${prefix}/${FILES_SUBPATH}`;
export const getFoldersPath = (prefix: string) => `${prefix}/${FOLDERS_SUBPATH}`;
export const getFoldersOpenPath = (prefix: string) => `${prefix}/${FOLDERS_OPEN_SUBPATH}`;

export const ICON_FOLDER_PATH = `./../iconGenerator/assets/icons`;
export const FILES_FOLDER_PATH = getFilesPath(ICON_FOLDER_PATH);
export const FOLDERS_FOLDER_PATH = getFoldersPath(ICON_FOLDER_PATH);
export const FOLDERS_OPEN_FOLDER_PATH = getFoldersOpenPath(ICON_FOLDER_PATH);

export const RELATIVE_DIST = `./../dist`;
export const RELATIVE_DIST_FILES_FOLDER_PATH = getFilesPath(RELATIVE_DIST);
export const RELATIVE_DIST_FOLDERS_FOLDER_PATH = getFoldersPath(RELATIVE_DIST);
export const RELATIVE_DIST_FOLDERS_OPEN_FOLDER_PATH = getFoldersOpenPath(RELATIVE_DIST);

export const DARK_FILE_ENDING = '_dark';
export const HIGH_CONTRAST_FILE_ENDING = '_highContrast';
export const WILDCARD_PATTERN = new RegExp(/^\*{1,2}\./);
export const OPENED_FOLDER_SUFFIX = '-open';
