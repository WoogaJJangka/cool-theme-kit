/**
 * Minimal stand-in for the `vscode` module so the theme generation logic can be
 * exercised from plain Node (mocha) without launching VS Code.
 * Only the APIs touched by the services under test are implemented.
 */

/** An installed extension, as `vscode.extensions.all` lists it */
export type TestExtension = { extensionPath: string; id: string; packageJSON: Record<string, unknown> };

export const testState: {
  /**
   * The settings, by bare key (`opacity`, any section answers it), except for the sections listed in `sections`, whose
   * keys carry their section (`editor.fontFamily`): two of them can then hold the same key.
   */
  config: Record<string, unknown>;
  /**
   * The defaults VS Code registered for the settings of a kept apart section (keys with their section), as another
   * extension registering the same keys first leaves them: `get` gives one when the settings set no value, `inspect`
   * reports it as the default
   */
  registeredDefaults: Record<string, unknown>;
  /**
   * The settings of the Default profile when the window is in another profile (unset: the window is in the Default
   * profile). The settings listed in its `workbench.settings.applyToAllProfiles` (that one included) are read from and
   * written to it, as VS Code does; only for the sections in `sections`, whose keys carry their section.
   */
  defaultProfile?: Record<string, unknown>;
  /** sections whose settings are kept apart and reported by `inspect` as user settings (the other sections inspect nothing) */
  sections: Set<string>;
  extensionPath: string;
  /** the other installed extensions */
  extensions: TestExtension[];
  lastTarget?: number;
  /** the notices shown, oldest first */
  messages: { kind: 'error' | 'information' | 'warning'; text: string }[];
  /** the titles of the buttons the user clicks, one per notice in order; a notice with none left is dismissed */
  answers: string[];
  /** the package.json of this extension, as `extensions.getExtension(…).packageJSON` gives it */
  packageJSON: Record<string, unknown>;
  /** what `env.clipboard.writeText` wrote last, and the URLs `env.openExternal` opened */
  clipboard: string;
  opened: string[];
  /** the commands run with `commands.executeCommand`, with their arguments */
  executed: unknown[][];
  /** what the user types in the next input boxes, in order (each value is given to `validateInput` first); none: Escape */
  inputs: string[];
  /** the quick picks created, last one last: a test drives it with `fireActive`, `accept` and `hide` */
  quickPicks: TestQuickPick[];
} = {
  answers: [],
  inputs: [],
  quickPicks: [],
  clipboard: '',
  config: {},
  registeredDefaults: {},
  executed: [],
  extensionPath: '',
  extensions: [],
  messages: [],
  opened: [],
  packageJSON: {},
  sections: new Set(),
};

const show =
  (kind: 'error' | 'information' | 'warning') =>
  async (text: string, ...items: unknown[]) => {
    testState.messages.push({ kind, text });
    const title = testState.answers.shift();
    // the options object of a modal notice has no title
    return items.find((item) => typeof item === 'object' && item !== null && (item as { title?: unknown }).title === title);
  };

const isKeptApart = (section: string | undefined): section is string => section !== undefined && testState.sections.has(section);

const settingKey = (section: string | undefined, key: string) => (isKeptApart(section) ? `${section}.${key}` : key);

const APPLY_TO_ALL_PROFILES = 'workbench.settings.applyToAllProfiles';

/** The settings that hold a key: the Default profile's for a setting shared across the profiles */
const storeOf = (key: string): Record<string, unknown> => {
  const profile = testState.defaultProfile;
  if (!profile) return testState.config;
  const shared = profile[APPLY_TO_ALL_PROFILES];
  return key === APPLY_TO_ALL_PROFILES || (Array.isArray(shared) && shared.includes(key)) ? profile : testState.config;
};

export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}

export enum LogLevel {
  Off = 0,
  Trace = 1,
  Debug = 2,
  Info = 3,
  Warning = 4,
  Error = 5,
}

export enum ColorThemeKind {
  Light = 1,
  Dark = 2,
  HighContrast = 3,
  HighContrastLight = 4,
}

export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}

export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1,
}

export enum QuickPickItemKind {
  Separator = -1,
  Default = 0,
}

const disposable = { dispose: () => undefined };

type Listener<T> = (value: T) => unknown;

/** `window.createQuickPick`, driven by the test */
export class TestQuickPick {
  activeItems: unknown[] = [];
  disposed = false;
  items: unknown[] = [];
  matchOnDescription = false;
  placeholder = '';
  selectedItems: unknown[] = [];
  shown = false;
  title = '';
  private readonly listeners = { accept: [] as Listener<void>[], active: [] as Listener<unknown[]>[], hide: [] as Listener<void>[] };

  onDidAccept(listener: Listener<void>) {
    this.listeners.accept.push(listener);
    return disposable;
  }

  onDidChangeActive(listener: Listener<unknown[]>) {
    this.listeners.active.push(listener);
    return disposable;
  }

  onDidHide(listener: Listener<void>) {
    this.listeners.hide.push(listener);
    return disposable;
  }

  show() {
    this.shown = true;
  }

  hide() {
    if (!this.shown) return;
    this.shown = false;
    for (const listener of this.listeners.hide) listener();
  }

  dispose() {
    this.disposed = true;
  }

  /** The user moves to an item */
  fireActive(item: unknown) {
    this.activeItems = [item];
    for (const listener of this.listeners.active) listener([item]);
  }

  /** The user presses Enter on the active item (or the given one) */
  accept(item?: unknown) {
    if (item) this.activeItems = [item];
    this.selectedItems = [...this.activeItems];
    for (const listener of this.listeners.accept) listener();
  }
}

export const workspace = {
  getConfiguration: (section?: string) => ({
    get: <T>(key: string): T | undefined => {
      if (!section) return undefined;
      const full = settingKey(section, key);
      return (storeOf(full)[full] ?? (isKeptApart(section) ? testState.registeredDefaults[full] : undefined)) as T | undefined;
    },
    inspect: <T>(key: string) => {
      if (!isKeptApart(section)) return undefined;
      const full = settingKey(section, key);
      const value = storeOf(full)[full] as T | undefined;
      const defaultValue = testState.registeredDefaults[full] as T | undefined;
      if (value === undefined && defaultValue === undefined) return undefined;
      return { defaultValue, globalValue: value, key: full };
    },
    update: async (key: string, value: unknown, target?: number) => {
      storeOf(settingKey(section, key))[settingKey(section, key)] = value;
      testState.lastTarget = target;
    },
  }),
  onDidChangeConfiguration: () => disposable,
  workspaceFolders: undefined as unknown[] | undefined,
};

export const extensions = {
  get all(): TestExtension[] {
    return testState.extensions;
  },
  getExtension: () => ({ extensionPath: testState.extensionPath, packageJSON: testState.packageJSON }),
  onDidChange: () => disposable,
};

const noop = () => undefined;
const outputChannel = {
  appendLine: noop,
  debug: noop,
  error: noop,
  info: noop,
  trace: noop,
  warn: noop,
};

export const window = {
  createOutputChannel: () => outputChannel,
  onDidChangeWindowState: () => disposable,
  showErrorMessage: show('error'),
  showInformationMessage: show('information'),
  createQuickPick: () => {
    const quickPick = new TestQuickPick();
    testState.quickPicks.push(quickPick);
    return quickPick;
  },
  showInputBox: async (options?: { validateInput?: (value: string) => unknown }) => {
    const value = testState.inputs.shift();
    if (value !== undefined) await options?.validateInput?.(value);
    return value;
  },
  showQuickPick: async () => undefined,
  showWarningMessage: show('warning'),
};

/** The commands registered so far, by id: a test runs one with `registeredCommands.get(id)?.(...arguments)` */
export const registeredCommands = new Map<string, (...parameters: unknown[]) => unknown>();

export const commands = {
  executeCommand: async (...parameters: unknown[]) => {
    testState.executed.push(parameters);
  },
  registerCommand: (id: string, callback: (...parameters: unknown[]) => unknown) => {
    registeredCommands.set(id, callback);
    return disposable;
  },
};

export enum UIKind {
  Desktop = 1,
  Web = 2,
}

export const version = '1.147.0';

export const env = {
  appName: 'Visual Studio Code',
  clipboard: {
    writeText: async (text: string) => {
      testState.clipboard = text;
    },
  },
  language: 'en',
  openExternal: async (url: unknown) => {
    testState.opened.push(String(url));
    return true;
  },
  remoteName: undefined as string | undefined,
  uiKind: UIKind.Desktop,
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, scheme: 'file' }),
  parse: (value: string) => value,
};
