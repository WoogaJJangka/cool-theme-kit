/**
 * Draws every bundled icon on contact sheets, at the size of the explorer (16px) and twice that, to review them by eye:
 * which ones fall apart when small, which glyph does not read on its tile.
 *
 * Usage: bun run sheet:icons [-- --flat] [--light] [--only <icon names, with commas>] [--group files|folders|foldersOpen]
 * The sheets go to `out/icon-sheets/<glass|flat>-<dark|light>/` (not in git), emptied first.
 */
import { Resvg } from '@resvg/resvg-js';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareCodeUnits } from 'src/helpers/utils';
import { glassIcon, toMetric } from 'src/icons/glass/glassIcons';

import { iconFolders, METRICS_FILE } from './syncIconMetrics';

import type { IconGroup, IconKind, IconMetrics } from 'src/icons/glass/glassIcons';

const root = join(__dirname, '..', '..', '..');
const COLUMNS = 12;
const CELL = { height: 46, width: 118 };
const PER_SHEET = 240;
const KINDS: Record<IconGroup, IconKind> = { files: 'file', folders: 'folder', foldersOpen: 'folderOpen' };

/** One font file for the labels where there is one: loading every system font takes seconds a sheet */
const LABEL_FONT = 'C:/Windows/Fonts/segoeui.ttf';
const FONT = existsSync(LABEL_FONT) ? { defaultFontFamily: 'Segoe UI', fontFiles: [LABEL_FONT], loadSystemFonts: false } : { loadSystemFonts: true };

const escapeXml = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const option = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);

/** Where the sheets go: a folder of the repository that git ignores, never a path of the command line */
const OUTPUT = join(root, 'out', 'icon-sheets');

const sheets = () => {
  const flat = process.argv.includes('--flat');
  const light = process.argv.includes('--light');
  const only = new Set(option('--only')?.split(',').filter(Boolean));
  const group = option('--group');
  const background = light ? '#f7f8fa' : '#191a1c';
  const metrics = JSON.parse(readFileSync(join(root, METRICS_FILE), 'utf8')) as IconMetrics;

  // the sheets of an earlier run, for other icons, would be read as the ones of this run
  const output = join(OUTPUT, `${flat ? 'flat' : 'glass'}-${light ? 'light' : 'dark'}`);
  rmSync(output, { force: true, recursive: true });
  mkdirSync(output, { recursive: true });

  const { glyphs: glyphFolders, ...iconGroups } = iconFolders(root);
  // the New UI glyph of a file icon, as the generator draws it in the glass style
  const glyphOf = (icon: string) => glyphFolders.map((folder) => join(folder, `${icon}.svg`)).find((file) => existsSync(file));

  for (const [name, folders] of Object.entries(iconGroups) as Array<[IconGroup, string[]]>) {
    if (group && group !== name) continue;

    // the last folder wins, as in the generator
    const icons = new Map<string, string>();
    for (const folder of folders.filter((path) => existsSync(path))) {
      for (const file of readdirSync(folder).filter((item) => item.endsWith('.svg'))) icons.set(file.slice(0, -4), join(folder, file));
    }
    const names = [...icons.keys()].filter((icon) => only.size === 0 || only.has(icon)).sort(compareCodeUnits);

    for (let first = 0; first < names.length; first += PER_SHEET) {
      const part = names.slice(first, first + PER_SHEET);
      const width = COLUMNS * CELL.width;
      const height = Math.ceil(part.length / COLUMNS) * CELL.height;
      let body = `<rect width="${width}" height="${height}" fill="${background}"/>`;

      for (const [index, icon] of part.entries()) {
        const x = (index % COLUMNS) * CELL.width;
        const y = Math.floor(index / COLUMNS) * CELL.height;
        const glyph = name === 'files' && !flat ? glyphOf(icon) : undefined;
        const source = readFileSync(glyph ?? icons.get(icon)!, 'utf8');
        const svg = flat ? source : glassIcon(source, KINDS[name], toMetric(metrics[glyph ? 'glyphs' : name][icon]));
        const href = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
        body += `<image x="${x + 4}" y="${y + 1}" width="32" height="32" href="${href}"/>`;
        body += `<image x="${x + 44}" y="${y + 9}" width="16" height="16" href="${href}"/>`;
        body += `<text x="${x + 4}" y="${y + 43}" font-family="Segoe UI, Arial, sans-serif" font-size="9.5" fill="${light ? '#444' : '#aaa'}">${escapeXml(icon.slice(0, 22))}</text>`;
      }

      const sheet = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">${body}</svg>`;
      const file = join(output, `${name}-${String(first / PER_SHEET + 1).padStart(2, '0')}.png`);
      writeFileSync(file, new Resvg(sheet, { font: FONT }).render().asPng());
      console.log(file, `${part[0]} … ${part.at(-1)}`);
    }
  }
};

sheets();
