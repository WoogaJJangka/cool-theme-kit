/**
 * Writes `out/jetbrains/` (not in git): what the JetBrains plugin (`cool-theme-kit-jetbrains`, `gradlew syncIcons`) takes
 * from Cool Theme Kit besides the icons of `dist/`, so that it draws the accent as VS Code does (`docs/SAME_SCREEN.md`).
 *
 * - `accent.json`: the accent presets, the backgrounds the text tints are measured on, and the colors `accentColors`
 *   gives for each preset: the plugin's port of `src/themes/accent.ts` is tested against them.
 * - `folder-color.json`: the icons the folder color changes (`accentTargets: folders` paints them with the accent),
 *   each drawn with the default folder color and with a probe color, for the glass style (`icons`) and each other one
 *   (`flat`, `glossy`). The plugin recolors the same icons, and is tested against the probe.
 *
 * Usage: bun run export:jetbrains (after `bun run build`, before `gradlew syncIcons` in the plugin)
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { IconStyle } from 'src/@types/config';
import { compareCodeUnits } from 'src/helpers/utils';
import { DEFAULT_FOLDER_COLOR } from 'src/helpers/constants';
import { IconThemeGenerator } from 'src/icons/generators/IconThemeGenerator';
import { ACCENT_PRESETS, accentColors, DEFAULT_ACCENT } from 'src/themes/accent';

const root = join(__dirname, '..', '..', '..');
const OUTPUT = join(root, 'out', 'jetbrains');
const WORK = join(OUTPUT, 'work');

/** The color the folder icons are drawn with to find the ones that take the folder color (the green preset) */
const PROBE_COLOR = '#79cb60';

/** The blues of the Islands palette (`blue-10` to `blue-160`, the same in both themes) and a see-through one */
const ISLANDS_BLUES = [
  '#131a28', '#182337', '#1b283f', '#233558', '#2a4371', '#2e4d89', '#2f5eb9', '#3871e1',
  '#538af9', '#71a1fe', '#92b7ff', '#a7c5ff', '#bdd3ff', '#d0dffe', '#e3ebfe', '#f7f8ff', '#2f5eb9b3',
];

type Case = { accent: string; background?: string; base: string; expected: string; kind: 'onAccent' | 'target' | 'text' | 'tint' };

const readBase = (name: string) =>
  (JSON.parse(readFileSync(join(root, 'themes', `cool-islands-${name}.base.json`), 'utf8')) as { colors: Record<string, string> }).colors;

/** The colors of the editor schemes the accent tints (the plugin leaves them alone once the user changed them) */
const editorColors = (colors: Record<string, string>) => ({
  link: colors['editorLink.activeForeground'],
  selection: colors['editor.selectionBackground'],
});

const accentCases =(backgrounds: Record<string, string>): Case[] => {
  const cases: Case[] = [];
  const accents = [...ACCENT_PRESETS.map((preset) => preset.color), '#ffffff', '#000000', '#808080'];
  for (const accent of accents) {
    for (const base of ISLANDS_BLUES) {
      // a tint (the selection): the lightness and opacity of the blue, the hue and saturation moved like the accent
      const tint = accentColors({ 'editor.selectionBackground': base }, accent)['editor.selectionBackground'] ?? base;
      cases.push({ accent, base, expected: tint, kind: 'tint' });
      // a tint that is text on the editor: it also keeps its contrast there
      for (const background of Object.values(backgrounds)) {
        const text = accentColors({ 'editor.background': background, 'textLink.foreground': base }, accent)['textLink.foreground'] ?? base;
        cases.push({ accent, background, base, expected: text, kind: 'text' });
      }
    }
    // the text on the accent itself (a default button): kept if it reads, else black or white
    for (const base of ['#ffffff', '#000000']) {
      const colors = accentColors({ 'button.background': DEFAULT_ACCENT, 'button.foreground': base }, accent);
      cases.push({ accent, base, expected: colors['button.foreground'] ?? base, kind: 'onAccent' });
    }
    // a part of `accentTargets`: the accent itself, with the opacity of the part (the unfocused tab line: 80)
    for (const base of ['#80808059', '#ffffff29', '#73767c']) {
      const colors = accentColors({ 'scrollbarSlider.background': base }, accent, ['controls']);
      cases.push({ accent, base, expected: colors['scrollbarSlider.background'], kind: 'target' });
    }
  }
  return cases;
};

/** `<group>/<name>` -> content, the hash of the filter settings taken out of the file names */
const readIcons = (folder: string) => {
  const icons = new Map<string, string>();
  for (const group of ['files', 'folders', 'foldersOpen']) {
    for (const file of readdirSync(join(folder, group))) {
      if (!file.endsWith('.svg')) continue;
      const name = file.replace(/~-?\d+(?=\.svg$)/, '').replace(/\.svg$/, '');
      icons.set(`${group}/${name}`, readFileSync(join(folder, group, file), 'utf8'));
    }
  }
  return icons;
};

/** The icons of the default settings, but for the icon style and the folder color */
const generate = async (name: string, iconStyle: IconStyle, folderColor?: string) => {
  const folder = join(WORK, name);
  const config = { iconStyle, ...(folderColor ? { folderColor } : {}) };
  await new IconThemeGenerator(config, { dist: folder, iconGenerator: join(root, 'iconGenerator') }).createJsonTheme();
  return readIcons(folder);
};

/** The icons of a style that the folder color changes: as drawn by default, and with the probe color */
const changedIcons = async (iconStyle: IconStyle) => {
  const plain = await generate(`${iconStyle}-default`, iconStyle);
  const probe = await generate(`${iconStyle}-probe`, iconStyle, PROBE_COLOR);
  const icons: Record<string, { default: string; probe: string }> = {};
  for (const [name, svg] of [...plain].sort(([a], [b]) => compareCodeUnits(a, b))) {
    const probed = probe.get(name);
    if (probed !== undefined && probed !== svg) icons[name] = { default: svg, probe: probed };
  }
  return icons;
};

/** The icon styles but glass: flat, and glossy where the generator has it */
const OTHER_STYLES = Object.values(IconStyle).filter((style) => style !== IconStyle.Glass);

type ChangedIcons = Awaited<ReturnType<typeof changedIcons>>;

const folderColorIcons = async () => {
  const styles: Record<string, ChangedIcons> = {};
  for (const style of OTHER_STYLES) styles[style] = await changedIcons(style);
  return { icons: await changedIcons(IconStyle.Glass), styles };
};

const run = async () => {
  rmSync(OUTPUT, { force: true, recursive: true });
  mkdirSync(OUTPUT, { recursive: true });

  const [dark, light] = [readBase('dark'), readBase('light')];
  const editorBackground = { dark: dark['editor.background'], light: light['editor.background'] };
  const editor = { dark: editorColors(dark), light: editorColors(light) };
  const accent = { cases: accentCases(editorBackground), defaultAccent: DEFAULT_ACCENT, editor, editorBackground, presets: ACCENT_PRESETS };
  writeFileSync(join(OUTPUT, 'accent.json'), `${JSON.stringify(accent, undefined, 2)}\n`);

  const { icons, styles } = await folderColorIcons();
  const folders = { defaultColor: DEFAULT_FOLDER_COLOR, icons, probeColor: PROBE_COLOR, ...styles };
  writeFileSync(join(OUTPUT, 'folder-color.json'), `${JSON.stringify(folders, undefined, 2)}\n`);
  rmSync(WORK, { force: true, recursive: true });

  const changed = [`${Object.keys(icons).length} glass`, ...Object.entries(styles).map(([style, changedIn]) => `${Object.keys(changedIn).length} ${style}`)].join(', ');
  console.log(`out/jetbrains: ${accent.cases.length} accent cases, ${changed} that take the folder color`);
};

// ts-node runs it as CommonJS, without top-level await
// eslint-disable-next-line unicorn/prefer-top-level-await
run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
