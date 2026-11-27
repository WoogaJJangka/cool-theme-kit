/**
 * Captures the screenshots of the README in a real VS Code: `bun run build`, then
 * `bun run screenshots [version] [--vsix <file>] [--preset <id>|all]` (default `stable`). The images go to `docs/screenshots/`:
 * the whole window, and the pickers of the settings (PICKERS) alone.
 * With `--preset`, only the theme combinations of `src/presets/presets.ts` are captured, to
 * `docs/screenshots/presets/<id>.png` (docs/THEME_COMBINATIONS.md): the extensions they need are installed into the
 * temporary profile only.
 * With `--vsix` (from `vsce package`), the extension is installed as users get it; without it, it runs in development
 * mode and the title bar says so.
 *
 * - VS Code runs with an empty profile in a temporary folder: `--user-data-dir`, `--extensions-dir` and
 *   `--shared-data-dir` all point there, never to the user's own VS Code (fork #40). The extension runs from this
 *   folder (`--extensionDevelopmentPath`), so the images show the code as it is.
 * - A small sample project with Korean names and comments is written next to the profile.
 * - The window is driven through the Chrome DevTools Protocol (`--remote-debugging-port`): key presses for the commands,
 *   `Page.captureScreenshot` for the images. The window is not brought to the front, so it does not get in the way.
 */
const { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath } = require('@vscode/test-electron');
const { spawn, spawnSync } = require('node:child_process');
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { dirname, join, resolve } = require('node:path');

const root = join(__dirname, '..', '..');
const output = join(root, 'docs', 'screenshots');
const args = process.argv.slice(2);
const vsixIndex = args.indexOf('--vsix');
const vsix = vsixIndex === -1 ? undefined : resolve(args[vsixIndex + 1]);
const presetIndex = args.indexOf('--preset');
const presetArgument = presetIndex === -1 ? undefined : args[presetIndex + 1];
// the value of an option that is not given is no argument: `-1 + 1` would leave out the first one, the version
const optionValues = new Set([vsixIndex, presetIndex].filter((index) => index !== -1).map((index) => index + 1));
const version = args.find((argument, index) => !argument.startsWith('--') && !optionValues.has(index)) ?? 'stable';

/** The presets of `--preset` (`all`: every one), read from the TypeScript source through esbuild */
const loadPresets = () => {
  if (!presetArgument) return [];
  // the esbuild package, not the esbuild.js of the root (CLAUDE.md)
  const { buildSync } = require(join(root, 'node_modules', 'esbuild'));
  const folder = mkdtempSync(join(tmpdir(), 'cool-presets-'));
  const outfile = join(folder, 'presets.js');
  buildSync({ bundle: true, entryPoints: [join(root, 'src', 'presets', 'presets.ts')], format: 'cjs', logLevel: 'warning', outfile, platform: 'node', tsconfig: join(root, 'tsconfig.json') });
  const { PRESETS } = require(outfile);
  rmSync(folder, { force: true, recursive: true });
  const chosen = presetArgument === 'all' ? PRESETS : PRESETS.filter((preset) => preset.id === presetArgument);
  if (chosen.length === 0) throw new Error(`No preset ${presetArgument}: ${PRESETS.map((preset) => preset.id).join(', ')}`);
  return chosen;
};

/** The settings of the profile with the ones of a preset (`null` removes one) */
const presetSettings = (preset) => {
  const result = settings(preset.settings['workbench.colorTheme'] ?? 'Cool Islands Dark');
  for (const [id, value] of Object.entries(preset.settings)) {
    if (value === null) delete result[id];
    else result[id] = value;
  }
  return result;
};
const PORT = 9339;
const WIDTH = 1440;
const HEIGHT = 900;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const EDITOR_FONT =
  "'JetBrains Mono', 'D2Coding', Consolas, Menlo, 'Droid Sans Mono', 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans Mono CJK KR', 'Courier New', monospace";

/**
 * The settings of the profile: the kit selected, nothing else on the screen (no chat, no notices, no tips).
 * `more`: other settings for one capture.
 */
const settings = (colorTheme, more = {}) => ({
  'a-file-icon-vscode.showUpdateMessage': false,
  'a-file-icon-vscode.showWelcomeMessage': false,
  'chat.disableAIFeatures': true,
  'editor.fontFamily': EDITOR_FONT,
  'editor.fontSize': 14,
  'editor.minimap.enabled': false,
  'explorer.compactFolders': false,
  'extensions.autoCheckUpdates': false,
  'extensions.ignoreRecommendations': true,
  'security.workspace.trust.enabled': false,
  'telemetry.telemetryLevel': 'off',
  'update.mode': 'none',
  'window.commandCenter': true,
  'workbench.colorTheme': colorTheme,
  'workbench.iconTheme': 'cool-theme-kit-icons',
  'workbench.layoutControl.enabled': false,
  'workbench.productIconTheme': 'cool-islands-product-icons',
  'workbench.secondarySideBar.defaultVisibility': 'hidden',
  'workbench.startupEditor': 'none',
  'workbench.tips.enabled': false,
  ...more,
});

const MAIN_PY = `"""주문 처리 서비스: Cool Islands 미리보기용 예제."""
import re
from dataclasses import dataclass, field
from typing import Iterable

PRICE_PATTERN = re.compile(r"^(\\d+)원$")


@dataclass
class Order:
    """주문 한 건."""

    customer: str
    items: list[str] = field(default_factory=list)
    total: int = 0

    def add(self, name: str, price: int) -> None:
        # 상품을 담고 합계를 늘린다
        self.items.append(name)
        self.total += price

    def __repr__(self) -> str:
        return f"Order({self.customer!r}, {len(self.items)}개, {self.total:,}원)"


def parse_price(text: str) -> int | None:
    match = PRICE_PATTERN.match(text.strip())
    return int(match.group(1)) if match else None


def summarize(orders: Iterable[Order]) -> dict[str, int]:
    summary: dict[str, int] = {}
    for order in orders:
        summary[order.customer] = summary.get(order.customer, 0) + order.total
    return summary


if __name__ == "__main__":
    order = Order(customer="김코딩")
    order.add("키보드", parse_price("89000원") or 0)
    print(order, summarize([order]), sep="\\n")
`;

/** A project with the files of a usual Python and web repository */
const SAMPLE = {
  '.env.example': 'DATABASE_URL=postgres://localhost/orders\n',
  '.github/workflows/ci.yml': 'name: CI\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n',
  '.gitignore': '__pycache__/\nnode_modules/\n.env\n',
  'Dockerfile': 'FROM python:3.13-slim\nCOPY . /app\nCMD ["python", "-m", "app.main"]\n',
  'LICENSE': 'MIT License\n',
  'README.md': '# 주문 서비스\n\nCool Theme Kit 미리보기용 예제입니다.\n',
  'docker-compose.yml': 'services:\n  app:\n    build: .\n',
  'docs/설계.md': '# 설계\n',
  'package.json': '{\n  "name": "orders-web",\n  "private": true\n}\n',
  'pyproject.toml': '[project]\nname = "orders"\nversion = "0.1.0"\n',
  'requirements.txt': 'fastapi\n',
  'src/app/__init__.py': '',
  'src/app/main.py': MAIN_PY,
  'src/app/models.py': '"""모델."""\n',
  'src/app/settings.py': 'DEBUG = False\n',
  'src/conftest.py': 'import pytest\n',
  'datasets/주문.csv': '고객,합계\n김코딩,89000\n',
  'src/app/주문.json': '{ "customer": "김코딩" }\n',
  'tests/test_main.py': 'from app.main import parse_price\n\n\ndef test_parse_price():\n    assert parse_price("1000원") == 1000\n',
  'tsconfig.json': '{ "compilerOptions": { "strict": true } }\n',
  'web/app.ts': 'export const hello = (name: string) => `안녕, ${name}`;\n',
  'web/index.html': '<!doctype html>\n<title>주문</title>\n',
  'web/style.css': 'body { margin: 0; }\n',
};

const writeFiles = (folder, files) => {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(folder, path)), { recursive: true });
    writeFileSync(join(folder, path), content);
  }
};

/** The page of the workbench, through CDP */
const connect = async () => {
  let pages = [];
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      pages = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      if (pages.some((page) => page.type === 'page' && page.url.includes('workbench'))) break;
    } catch {
      // not listening yet
    }
    await sleep(500);
  }
  const page = pages.find((item) => item.type === 'page' && item.url.includes('workbench'));
  if (!page) throw new Error('VS Code did not open its window');

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve);
    socket.addEventListener('error', reject);
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    // only the answer to a request of this script: events have no id, and an id is a number this script gave
    if (!Number.isInteger(message.id)) return;
    const resolve = pending.get(message.id);
    if (typeof resolve !== 'function') return;
    pending.delete(message.id);
    resolve(message);
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      pending.set(++id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });
  return { close: () => socket.close(), send };
};

const EXTENSION_ID = 'woogajjangka.cool-theme-kit';

/**
 * The commands of the captures, each on a key of the profile: the command palette could pick another command with a
 * similar title, and a key also passes arguments
 */
const COMMANDS = {
  clearNotifications: { command: 'notifications.clearAll' },
  closeEditors: { command: 'workbench.action.closeAllEditors' },
  mixColors: { args: 'colors', command: 'a-file-icon-vscode.openThemeMixer' },
  mixIcons: { args: 'icons', command: 'a-file-icon-vscode.openThemeMixer' },
  mixProduct: { args: 'product', command: 'a-file-icon-vscode.openThemeMixer' },
  reload: { command: 'workbench.action.reloadWindow' },
  walkthrough: { args: `${EXTENSION_ID}#coolThemeKit`, command: 'workbench.action.openWalkthrough' },
  // the pickers of the README, captured alone (PICKERS)
  arrowTheme: { command: 'a-file-icon-vscode.changeArrowTheme' },
  commandPalette: { args: '>Cool Theme Kit: ', command: 'workbench.action.quickOpen' },
  folderColor: { command: 'a-file-icon-vscode.changeFolderColor' },
  folderTheme: { command: 'a-file-icon-vscode.changeFolderTheme' },
  iconPacks: { command: 'a-file-icon-vscode.toggleIconPacks' },
  opacity: { command: 'a-file-icon-vscode.changeOpacity' },
  productIconTheme: { command: 'workbench.action.selectProductIconTheme' },
  saturation: { command: 'a-file-icon-vscode.changeSaturation' },
};
/** The pickers of the README: the command of COMMANDS → the image in docs/screenshots */
const PICKERS = {
  commandPalette: 'command-palette.png',
  iconPacks: 'icon-packs.png',
  arrowTheme: 'arrow-styles.png',
  folderColor: 'folder-color.png',
  folderTheme: 'folder-theme.png',
  opacity: 'opacity.png',
  saturation: 'saturation.png',
  productIconTheme: 'product-icon-theme.png',
};
/** F13 to F24, then the same keys with Shift: keys no other binding uses */
const commandKey = (index) => {
  const number = 13 + (index % 12);
  return { code: `F${number}`, key: `F${number}`, modifiers: index < 12 ? 0 : 8, windowsVirtualKeyCode: 111 + number };
};
const keybindings = () =>
  Object.values(COMMANDS).map((binding, index) => ({ ...binding, key: `${index < 12 ? '' : 'shift+'}f${13 + (index % 12)}` }));

const capture = async () => {
  const presets = loadPresets();
  const executable = await downloadAndUnzipVSCode(version);
  const temporary = mkdtempSync(join(tmpdir(), 'cool-screenshots-'));
  const folders = Object.fromEntries(['user', 'extensions', 'shared', 'sample'].map((name) => [name, join(temporary, name)]));
  const settingsFile = join(folders.user, 'User', 'settings.json');
  writeFiles(folders.sample, SAMPLE);
  writeFiles(folders.user, {
    'User/keybindings.json': JSON.stringify(keybindings(), null, 2),
    'User/settings.json': JSON.stringify(settings('Cool Islands Dark'), null, 2),
  });
  mkdirSync(join(output, 'presets'), { recursive: true });

  const profile = [
    `--user-data-dir=${folders.user}`,
    `--extensions-dir=${folders.extensions}`,
    // the shared storage of the user's own VS Code is never opened (fork #40)
    `--shared-data-dir=${folders.shared}`,
  ];
  // the theme of the default layer of `iconThemeLayers`, so the Mix Themes page shows it mixed in; and an installed
  // VSIX, as users get the extension (without one, it runs from this folder in development mode, and the title bar
  // says "[Extension Development Host]")
  const [cli] = resolveCliArgsFromVSCodeExecutablePath(executable);
  const presetExtensions = presets.flatMap((preset) => preset.extensions);
  for (const extension of [...new Set(['PKief.material-icon-theme', ...presetExtensions, ...(vsix ? [vsix] : [])])]) {
    const installed = spawnSync(cli, [...profile, '--install-extension', extension], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });
    if (installed.status !== 0) throw new Error(`Could not install ${extension}`);
  }

  const code = spawn(
    executable,
    [
      ...profile,
      ...(vsix ? [] : [`--extensionDevelopmentPath=${root}`]),
      `--remote-debugging-port=${PORT}`,
      '--disable-workspace-trust',
      '--skip-release-notes',
      '--skip-welcome',
      '--new-window',
      folders.sample,
      join(folders.sample, 'src', 'app', 'main.py'),
    ],
    { stdio: 'ignore' },
  );

  let page = await connect();
  const run = async (expression) => (await page.send('Runtime.evaluate', { awaitPromise: true, expression, returnByValue: true })).result?.result?.value;
  /** Run a command of COMMANDS by its key, with the focus moved from a webview (it would get the key) to the explorer */
  const command = async (name, wait = 2500) => {
    await run("document.querySelector('.explorer-folders-view .monaco-list')?.focus()");
    await sleep(300);
    const key = commandKey(Object.keys(COMMANDS).indexOf(name));
    for (const type of ['rawKeyDown', 'keyUp']) await page.send('Input.dispatchKeyEvent', { type, ...key });
    await sleep(wait);
  };
  const shot = async (name) => {
    await run('document.activeElement?.blur()');
    await sleep(400);
    const image = await page.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(output, name), Buffer.from(image.result.data, 'base64'));
    console.log(`  docs/screenshots/${name}`);
  };
  /** The open picker alone, with a margin (it closes when it loses the focus, so nothing is blurred); then Escape */
  const pickerShot = async (name) => {
    const box = await run(
      "(() => { const box = document.querySelector('.quick-input-widget')?.getBoundingClientRect(); return box?.height ? { height: box.height, width: box.width, x: box.x, y: box.y } : undefined; })()",
    );
    if (!box) throw new Error(`No picker is open for ${name}`);
    // the keys of COMMANDS are this profile's, not the user's
    await run("document.querySelectorAll('.quick-input-widget .monaco-keybinding').forEach((key) => { key.style.display = 'none'; })");
    const margin = 8;
    const x = Math.max(0, Math.floor(box.x - margin));
    const y = Math.max(0, Math.floor(box.y - margin));
    const clip = { height: Math.min(HEIGHT - y, Math.ceil(box.height) + 2 * margin), scale: 1, width: Math.min(WIDTH - x, Math.ceil(box.width) + 2 * margin), x, y };
    const image = await page.send('Page.captureScreenshot', { clip, format: 'png' });
    writeFileSync(join(output, name), Buffer.from(image.result.data, 'base64'));
    console.log(`  docs/screenshots/${name}`);
    for (const type of ['rawKeyDown', 'keyUp']) await page.send('Input.dispatchKeyEvent', { code: 'Escape', key: 'Escape', type, windowsVirtualKeyCode: 27 });
    await sleep(600);
  };
  const useSettings = async (colorTheme, more = {}, wait = 3000) => {
    writeFileSync(settingsFile, JSON.stringify(settings(colorTheme, more), null, 2));
    await sleep(wait);
  };
  /** The tree of the explorer alone, twice its size: the icons are 16 pixels */
  const explorerShot = async (name) => {
    await run('document.activeElement?.blur()');
    await sleep(400);
    const box = await run(
      "(() => { const rows = [...document.querySelectorAll('.explorer-folders-view .monaco-list-row')]; if (rows.length === 0) return undefined; const first = rows[0].getBoundingClientRect(); const last = rows.at(-1).getBoundingClientRect(); return { height: last.bottom - first.top, x: first.x, y: first.y }; })()",
    );
    if (!box) throw new Error(`No explorer for ${name}`);
    const clip = { height: Math.ceil(box.height) + 8, scale: 2, width: 232, x: Math.floor(box.x), y: Math.max(0, Math.floor(box.y) - 4) };
    const image = await page.send('Page.captureScreenshot', { clip, format: 'png' });
    writeFileSync(join(output, name), Buffer.from(image.result.data, 'base64'));
    console.log(`  docs/screenshots/${name}`);
  };

  try {
    await page.send('Emulation.setDeviceMetricsOverride', { deviceScaleFactor: 1, height: HEIGHT, mobile: false, width: WIDTH });
    // the first start of a profile shows a welcome dialog over the window
    await sleep(6000);
    await run("document.querySelector('.onboarding-a-close-btn')?.click()");
    // the extension generates its theme files on the first start
    await sleep(6000);
    await command('clearNotifications', 800);

    if (presets.length > 0) {
      for (const preset of presets) {
        // the mixed themes are generated, then read by VS Code after a reload
        writeFileSync(settingsFile, JSON.stringify(presetSettings(preset), null, 2));
        await sleep(10_000);
        await command('reload', 0);
        page.close();
        await sleep(3000);
        page = await connect();
        await page.send('Emulation.setDeviceMetricsOverride', { deviceScaleFactor: 1, height: HEIGHT, mobile: false, width: WIDTH });
        await sleep(9000);
        await command('clearNotifications', 800);
        await shot(`presets/${preset.id}.png`);
      }
      return;
    }

    await shot('cool-islands-dark.png');
    await useSettings('Cool Islands Light');
    await shot('cool-islands-light.png');
    await useSettings('Cool Islands Dark');

    // the three icon styles: the icons are generated again, under other names, and VS Code loads them
    await explorerShot('icon-style-glass.png');
    await useSettings('Cool Islands Dark', { 'a-file-icon-vscode.iconStyle': 'glossy' }, 12_000);
    await explorerShot('icon-style-glossy.png');
    await useSettings('Cool Islands Dark', { 'a-file-icon-vscode.iconStyle': 'flat' }, 12_000);
    await explorerShot('icon-style-flat.png');
    await useSettings('Cool Islands Dark', {}, 12_000);

    for (const [name, image] of Object.entries(PICKERS)) {
      await command(name, 2000);
      await pickerShot(image);
    }

    await command('mixIcons', 4000);
    await shot('mix-icon-themes.png');
    await command('mixColors', 3000);
    await shot('mix-color-themes.png');
    await command('mixProduct', 3000);
    await shot('mix-product-icon-themes.png');
    await command('closeEditors', 800);

    await command('walkthrough', 3000);
    await command('clearNotifications', 800);
    await shot('walkthrough.png');
  } finally {
    page.close();
    // VS Code starts more processes than the one spawned: end the whole tree
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(code.pid), '/t', '/f'], { stdio: 'ignore' });
    else code.kill();
    await sleep(2000);
    rmSync(temporary, { force: true, maxRetries: 5, recursive: true });
  }
};

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
