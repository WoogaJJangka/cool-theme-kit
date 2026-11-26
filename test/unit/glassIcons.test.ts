import { strict as assert } from 'node:assert';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { IconStyle } from 'src/@types/config';
import { JSON_FILE_NAME } from 'src/helpers/constants';
import { getDefaultConfig, getFileConfigHash } from 'src/icons/configUtils';
import { IconThemeGenerator } from 'src/icons/generators/IconThemeGenerator';
import { monochromeService } from 'src/icons/generators/MonochromeService';
import { opacityService } from 'src/icons/generators/OpacityService';
import { saturationService } from 'src/icons/generators/SaturationService';
import { glassFile, glassFolder, glassIcon, luminance, mainPaint, mixColors, paintCount, parseFolder, parseSvg, toEntry, toMetric } from 'src/icons/glass/glassIcons';
import { FILE_OVERRIDES, measureFile, measureFolder, measureGlyph } from 'src/scripts/icons/iconMetrics';
import { glyphNotice, JETBRAINS_GLYPHS, toGlyph } from 'src/scripts/icons/jetbrainsGlyphs';
import { iconFolders, measureIcons, METRICS_FILE } from 'src/scripts/icons/syncIconMetrics';

import type { IconMetrics, MetricEntry } from 'src/icons/glass/glassIcons';
import type { IconConfiguration } from 'src/models/IconConfiguration';

const repoRoot = join(__dirname, '..', '..');

const svg = (content: string, root = 'viewBox="0 0 24 24"') => `<!-- license -->\n<svg xmlns="http://www.w3.org/2000/svg" ${root}>${content}</svg>`;

/** A blue square with nothing in it */
const SQUARE = svg('<path fill="#1565C0" d="M3 3h18v18H3z"/>');
/** A yellow one: a light tile */
const YELLOW = svg('<path fill="#FFCB6B" d="M3 3h18v18H3z"/>');
/** Two colors */
const TWO_COLORS = svg('<path fill="#1565C0" d="M3 3h18v18H3z"/><path fill="#ffca28" d="M8 8h8v8H8z"/>');
/** A square with a smaller square cut out of it: a badge with a hole */
const BADGE = svg('<path fill="#1565C0" fill-rule="evenodd" d="M2 2h20v20H2zM8 8v8h8V8z"/>');

const FOLDER = svg(
  '<path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" fill="#5C6BC0" data-folderColor="Sources"/>' +
    '<path fill="#89ddff" data-folderIconColor="Sources" d="M12 12h8v8h-8z"/>',
);
const PLAIN_FOLDER = svg('<path fill="#78909C" data-themed="true" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>');

describe('glass icons', () => {
  describe('colors', () => {
    it('mixes two colors', () => {
      assert.equal(mixColors('#000000', '#ffffff', 0.5), '#808080');
      assert.equal(mixColors('#102030', '#ffffff', 0), '#102030');
      assert.equal(mixColors('#abc', '#000000', 0), '#aabbcc');
    });

    it('gives the luminance of a color', () => {
      assert.equal(luminance('#000000'), 0);
      assert.equal(Math.round(luminance('#ffffff') * 100), 100);
      assert.ok(luminance('#ffcb6b') > 0.45, 'the yellow of JavaScript is a light tile');
      assert.ok(luminance('#1565c0') < 0.45, 'the blue of TypeScript is a dark tile');
    });

    it('finds the paint an svg uses the most, and how many it uses', () => {
      const text = '<g fill="#111"><path fill="#222222"/><path stroke="#222222"/><stop style="stop-color:#333"/></g>';
      assert.equal(mainPaint(text), '#222222');
      assert.equal(paintCount(text), 3);
      assert.equal(mainPaint('<path fill="none"/>'), undefined);
      assert.equal(paintCount('<path fill="url(#a)"/>'), 0);
    });
  });

  describe('parseSvg', () => {
    it('gives the content, the viewBox and what the content inherits from the root', () => {
      const parts = parseSvg(svg('<path d="M0 0"/>', 'fill-rule="evenodd" fill="#123456" viewBox="0 -1 16 16" width="16px" xmlns:xlink="http://www.w3.org/1999/xlink"'));
      assert.deepEqual(parts, {
        attributes: 'fill-rule="evenodd" fill="#123456"',
        content: '<path d="M0 0"/>',
        namespaces: ' xmlns:xlink="http://www.w3.org/1999/xlink"',
        viewBox: [0, -1, 16, 16],
      });
    });

    it('reads the attributes of the root whatever their quotes and spaces, and a sign inside a value', () => {
      const parts = parseSvg(`<svg viewBox = '0 0 8 8'\n  style="a=b; fill:#111" fill='#222' width=16><path/></svg>`);
      assert.deepEqual(parts?.viewBox, [0, 0, 8, 8]);
      assert.equal(parts?.attributes, `style="a=b; fill:#111" fill='#222'`);
    });

    it('takes the size of an svg without a viewBox, and leaves the comments out', () => {
      const parts = parseSvg('<svg width="32px" height="24"><!-- a > b --><path/><!-- end --></svg>');
      assert.deepEqual(parts?.viewBox, [0, 0, 32, 24]);
      assert.equal(parts?.content, '<path/>');
    });

    it('gives nothing for a text that is not an svg', () => {
      assert.equal(parseSvg('not an svg'), undefined);
      assert.equal(parseSvg('<svg><path/>'), undefined);
    });
  });

  describe('metrics', () => {
    it('reads and writes an entry of metrics.json', () => {
      const entries: MetricEntry[] = [[1, 2, 3, 4], [1, 2, 3, 4, 'h'], [1, 2, 3, 4, 'l'], [1, 2, 3, 4, '#aabbcc'], [1, 2, 3, 4, 'h', '#aabbcc']];
      for (const entry of entries) assert.deepEqual(toEntry(toMetric(entry)!), entry);
      assert.deepEqual(toMetric([1, 2, 3, 4, 'h', '#aabbcc']), { box: [1, 2, 3, 4], color: '#aabbcc', holes: true });
      assert.equal(toMetric(undefined), undefined);
    });
  });

  describe('glassFile', () => {
    it('draws an icon of one color as a white glyph on a tile of that color', () => {
      const glass = glassFile(SQUARE, { box: [3, 3, 18, 18] });
      assert.match(glass, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 16 16" width="16px" height="16px">/);
      assert.ok(glass.includes(`stop-color="${mixColors('#1565c0', '#ffffff', 0.18)}"`), 'the tile is lighter at the top');
      assert.ok(glass.includes(`stop-color="${mixColors('#1565c0', '#000000', 0.16)}"`), 'and darker at the bottom');
      assert.ok(glass.includes('<feFlood flood-color="#ffffff"/><feComposite in2="SourceAlpha" operator="in"/>'));
      assert.ok(glass.includes('<path fill="#1565C0" d="M3 3h18v18H3z"/>'), 'the icon itself is the glyph');
    });

    it('gives a light tile a dark glyph', () => {
      const glass = glassFile(YELLOW, { box: [3, 3, 18, 18] });
      assert.ok(glass.includes(`<feFlood flood-color="${mixColors('#ffcb6b', '#000000', 0.74)}"/>`));
    });

    it('centers the box of the glyph on the tile, with the size of a square glyph', () => {
      // 18 units wide in a viewBox of 24: 10.2 wide on the tile, 24 units are 13.6
      const glass = glassFile(SQUARE, { box: [3, 3, 18, 18] });
      assert.ok(glass.includes('<svg x="1.2" y="1.2" width="13.6" height="13.6" viewBox="0 0 24 24" overflow="visible">'), glass);
    });

    it('draws a glyph made of lines larger: its lines are made for 16 pixels', () => {
      const glass = glassFile(SQUARE, { box: [3, 3, 18, 18], lines: true });
      // 18 units are 11.6 on the tile, 24 units are 15.4667
      assert.ok(glass.includes('width="15.4667" height="15.4667" viewBox="0 0 24 24"'), glass);
    });

    it('makes a long glyph no longer than the tile allows', () => {
      const glass = glassFile(svg('<path fill="#1565C0" d="M0 9h24v6H0z"/>'), { box: [0, 9, 24, 6] });
      assert.ok(glass.includes('width="11.6" height="11.6" viewBox="0 0 24 24"'), glass);
    });

    it('draws an icon of several colors as it is, on a dark tile', () => {
      const glass = glassFile(TWO_COLORS, { box: [3, 3, 18, 18] });
      assert.ok(!glass.includes('feFlood'), 'no glyph of one color');
      assert.ok(glass.includes(`stop-color="${mixColors('#3b4048', '#ffffff', 0.18)}"`));
      assert.ok(glass.includes('fill="#ffca28"'));
    });

    it('draws an icon of several colors as one glyph when its metric names the color of the tile', () => {
      const glass = glassFile(TWO_COLORS, { box: [3, 3, 18, 18], color: '#ffca28' });
      assert.ok(glass.includes(`stop-color="${mixColors('#ffca28', '#ffffff', 0.18)}"`));
      assert.ok(glass.includes('operator="in"'));
    });

    it('draws the holes of a badge as the glyph', () => {
      const glass = glassFile(BADGE, { box: [8, 8, 8, 8], holes: true });
      assert.ok(glass.includes('<feComposite in2="SourceAlpha" operator="out"/>'), 'what the badge does not draw');
      assert.ok(glass.includes('<clipPath id="ctk-c"><rect x="2.9" y="2.9" width="10.2" height="10.2"/></clipPath>'), glass);
      assert.ok(glass.includes(`stop-color="${mixColors('#1565c0', '#ffffff', 0.18)}"`), 'the tile takes the color of the badge');
    });

    it('places an icon that was not measured by its viewBox', () => {
      const glass = glassFile(SQUARE);
      assert.ok(glass.includes('<svg x="2.1" y="2.1" width="11.8" height="11.8" viewBox="0 0 24 24" overflow="visible">'), glass);
    });

    it('keeps the namespaces of the icon and what its content inherits from its root', () => {
      const icon = svg('<use xlink:href="#a"/>', 'viewBox="0 0 8 8" fill="#00ff00" stroke-width="2" xmlns:xlink="http://www.w3.org/1999/xlink"');
      const glass = glassFile(icon);
      assert.ok(glass.startsWith('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 16 16"'));
      assert.ok(glass.includes('<g fill="#00ff00" stroke-width="2"><use xlink:href="#a"/></g>'));
    });

    it('uses ids no icon would use', () => {
      const ids = [...glassFile(BADGE, { box: [8, 8, 8, 8], holes: true }).matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
      assert.deepEqual(ids, ['ctk-t', 'ctk-r', 'ctk-k', 'ctk-c']);
    });

    it('leaves what is not an svg, or has no size, as it is', () => {
      assert.equal(glassFile('not an svg'), 'not an svg');
      assert.equal(glassFile('<svg><path/></svg>'), '<svg><path/></svg>');
      assert.equal(glassFile(SQUARE, { box: [0, 0, 0, 5] }), SQUARE);
    });
  });

  describe('glassFolder', () => {
    it('splits a bundled folder icon into its folder shape and its badge', () => {
      const parts = parseFolder(FOLDER);
      assert.equal(parts?.color, '#5c6bc0');
      assert.equal(parts?.badge, '<path fill="#89ddff" data-folderIconColor="Sources" d="M12 12h8v8h-8z"/>');
      assert.equal(parseFolder(PLAIN_FOLDER)?.badge, '');
    });

    it('finds a folder shape without a mark by its outline, closed and open', () => {
      const closed = svg('<path d="m10 4h-6c-1.11 0-2 0.89-2 2v12z" fill="#C792EA"/><path d="M1 1h2v2z"/>');
      const open = svg('<path fill="#ef5350" d="M20,18H4V8H20M20,6H12L10,4H4z"></path><path d="M1 1h2v2z"/>');
      assert.equal(parseFolder(closed)?.color, '#c792ea');
      assert.equal(parseFolder(open)?.badge, '<path d="M1 1h2v2z"/>');
      assert.equal(parseFolder(svg('<path d="M1 1h2v2z" fill="#ef5350"/>')), undefined);
    });

    it('draws a folder of its color, with its badge as a glyph on the front', () => {
      const glass = glassFolder(FOLDER, false, { box: [12, 12, 8, 8] });
      assert.ok(glass.includes(`stop-color="${mixColors('#5c6bc0', '#000000', 0.34)}"`), 'the back');
      assert.ok(glass.includes(`stop-color="${mixColors('#5c6bc0', '#ffffff', 0.3)}"`), 'the front');
      assert.ok(glass.includes('<feFlood flood-color="#ffffff"/>'));
      assert.ok(glass.includes('data-folderIconColor="Sources"'));
      assert.ok(!glass.includes('data-folderColor'), 'the folder shape of the icon is replaced');
      assert.ok(!glass.includes('opacity=".6"'), 'no sheet in a closed folder');
    });

    it('draws an expanded folder with a lower front and a sheet', () => {
      const closed = glassFolder(FOLDER, false, { box: [12, 12, 8, 8] });
      const open = glassFolder(FOLDER, true, { box: [12, 12, 8, 8] });
      assert.ok(closed.includes('<rect x=".5" y="5.1" width="15" height="9.4" rx="1.9"'));
      assert.ok(open.includes('<rect x=".5" y="7.3" width="15" height="7.2" rx="1.9"'));
      assert.ok(open.includes('opacity=".6"'));
    });

    it('draws a plain folder without a badge', () => {
      const glass = glassFolder(PLAIN_FOLDER, false);
      assert.ok(glass.includes(`stop-color="${mixColors('#78909c', '#ffffff', 0.3)}"`));
      assert.ok(!glass.includes('feFlood'));
    });

    it('draws a badge of several colors as it is', () => {
      const icon = FOLDER.replace('d="M12 12h8v8h-8z"/>', 'd="M12 12h8v8h-8z"/><path fill="#ff0000" d="M14 14h2v2h-2z"/>');
      const glass = glassFolder(icon, false, { box: [12, 12, 8, 8] });
      assert.ok(!glass.includes('feFlood'));
      assert.ok(glass.includes('fill="#ff0000"'));
    });

    it('leaves a folder it cannot draw as it is: a badge that was not measured, another drawing', () => {
      assert.equal(glassFolder(FOLDER, false), FOLDER);
      assert.equal(glassFolder(SQUARE, false, { box: [3, 3, 18, 18] }), SQUARE);
      assert.equal(glassIcon(SQUARE, 'folderOpen'), SQUARE);
    });
  });

  describe('with the other filters of the icons', () => {
    const glass = glassFile(BADGE, { box: [8, 8, 8, 8], holes: true });

    it('takes the monochrome color: the tile and the glyph, not a transparency', () => {
      const monochrome = monochromeService.applyMonochrome(glass, true, '#546E7A');
      assert.ok(!monochrome.includes(mixColors('#1565c0', '#ffffff', 0.18)), 'the tile is recolored');
      assert.ok(!monochrome.includes('<mask'), 'a recolored mask would be a transparency');
      assert.match(monochrome, /url\(#ctk-t\)/);
    });

    it('takes the opacity and the saturation on its root', () => {
      const filtered = saturationService.applySaturation(opacityService.applyOpacity(glass, 0.5), 0.3);
      assert.match(filtered, /^<svg filter="url\(#saturation\)" opacity="0.5" xmlns=/);
      assert.ok(filtered.endsWith("<filter id='saturation'><feColorMatrix type='saturate' values='0.3'/></filter></svg>"));
    });
  });

  describe('measures', () => {
    it('measures the box of a glyph', () => {
      assert.deepEqual(measureFile(SQUARE), { box: [3, 3, 18, 18] });
      assert.equal(measureFile(svg('')), undefined);
    });

    it('does not measure an icon drawn with text: the fonts of the machine would decide its box', () => {
      assert.equal(measureFile(svg('<text x="2" y="20" fill="#ffd54f" font-size="24">D</text>')), undefined);
    });

    it('finds a badge with its glyph cut out, and the box of the holes', () => {
      const metric = measureFile(BADGE);
      assert.equal(metric?.holes, true);
      const [x, y, width, height] = metric!.box!;
      // the hole is 8..16, measured on a picture: within a pixel of it
      for (const [value, expected] of [[x, 8], [y, 8], [width, 8], [height, 8]]) assert.ok(Math.abs(value - expected) < 0.7, `${value} ~ ${expected}`);
    });

    it('does not take a ring, or a shape with a dent, for a badge', () => {
      const ring = svg('<path fill="#1565C0" fill-rule="evenodd" d="M2 2h20v20H2zM4 4v16h16V4z"/>');
      const dent = svg('<path fill="#1565C0" fill-rule="evenodd" d="M2 2h20v8H12v4h10v8H2zM5 5v3h3V5z"/>');
      assert.equal(measureFile(ring)?.holes, undefined);
      assert.equal(measureFile(dent)?.holes, undefined);
    });

    it('keeps a badge of the overrides plain, by icon name', () => {
      assert.ok(FILE_OVERRIDES.lock.plain);
      assert.equal(measureFile(BADGE, 'lock')?.holes, undefined);
    });

    it('measures the badge of a folder icon', () => {
      assert.deepEqual(measureFolder(FOLDER), { box: [12, 12, 8, 8] });
      assert.equal(measureFolder(PLAIN_FOLDER), undefined);
      assert.equal(measureFolder(SQUARE), undefined);
    });
  });

  describe('metrics.json', () => {
    const metrics = JSON.parse(readFileSync(join(repoRoot, METRICS_FILE), 'utf8')) as IconMetrics;

    it('is up to date with the bundled icons (bun run sync:metrics)', function () {
      this.timeout(300_000);
      const measured = measureIcons(repoRoot);

      for (const group of ['files', 'folders', 'foldersOpen', 'glyphs'] as const) {
        assert.deepEqual(Object.keys(metrics[group]), Object.keys(measured[group]), `${group}: icons added or removed`);
        for (const [name, entry] of Object.entries(measured[group])) {
          const stored = metrics[group][name];
          assert.deepEqual(stored.slice(4), entry.slice(4), `${group}/${name}: holes or color`);
          // the same up to the rounding of another machine
          for (const index of [0, 1, 2, 3]) {
            const [a, b] = [Number(stored[index]), Number(entry[index])];
            assert.ok(Math.abs(a - b) <= Math.max(Math.abs(b), 1) * 0.005, `${group}/${name}: ${JSON.stringify(stored)} is not ${JSON.stringify(entry)}`);
          }
        }
      }
    });

    it('has a box for every file icon, and for every folder icon with a badge', () => {
      const folders = iconFolders(repoRoot);
      for (const folder of folders.files) {
        for (const file of readdirSync(folder).filter((name) => name.endsWith('.svg'))) {
          // an icon drawn with text is not measured: the fonts of the machine would decide its box
          if (!readFileSync(join(folder, file), 'utf8').includes('<text')) assert.ok(metrics.files[file.slice(0, -4)], `files/${file}`);
        }
      }
      for (const group of ['folders', 'foldersOpen'] as const) {
        for (const file of readdirSync(folders[group][0]).filter((name) => name.endsWith('.svg'))) {
          const parts = parseFolder(readFileSync(join(folders[group][0], file), 'utf8'));
          // `seed` is not drawn like the others: it stays as it is
          if (parts?.badge) assert.ok(metrics[group][file.slice(0, -4)], `${group}/${file}`);
        }
      }
    });

    it('lists the overrides of icons that exist', () => {
      for (const name of Object.keys(FILE_OVERRIDES)) assert.ok(metrics.files[name], name);
    });
  });

  describe('JetBrains New UI glyphs', () => {
    const glyphsFolder = join(repoRoot, 'assets', 'icons', 'glass', 'files');
    const iconFolder = (name: string) => iconFolders(repoRoot).files.find((folder) => existsSync(join(folder, `${name}.svg`)));
    const icon16 = (content: string) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;

    it('keeps the lines of an icon in its color, and removes the dark fill inside them', () => {
      // like java.svg: a cup with a dark inside, and a saucer
      const cup = icon16('<rect x="2" y="13" width="12" height="1" fill="#C77D55"/><path d="M2 3h10v8H2z" fill="#45322B" stroke="#C77D55"/>');
      assert.equal(toGlyph(cup), icon16('<rect x="2" y="13" width="12" height="1" fill="#c77d55"/><path d="M2 3h10v8H2z" fill="none" stroke="#c77d55"/>'));
    });

    it('gives the tile the color of the icon, not the gray of its letters', () => {
      // like yaml.svg: a red page with a gray letter, more gray paints than red ones
      const page = icon16('<path d="M3 1h8v13H3z" fill="#402929"/><path d="M3 1h8" stroke="#DB5C5C"/><path d="M12 9h3" fill="#CED0D6"/><path d="M12 11h3" fill="#CED0D6"/>');
      const glyph = toGlyph(page);
      assert.equal(mainPaint(glyph), '#db5c5c');
      assert.equal(paintCount(glyph), 1);
      assert.ok(glyph.includes('<path d="M12 9h3" fill="#db5c5c"/>'), 'the letter is a part of the glyph');
    });

    it('gives an icon of gray alone a gray tile', () => {
      assert.equal(mainPaint(toGlyph(icon16('<rect x="2" y="3" width="12" height="1" fill="#CED0D6"/>'))), '#ced0d6');
    });

    it('keeps only the letters of a filled shape with letters on it: the tile takes the place of the shape', () => {
      // like javaScript.svg (dark letters on a yellow square) and typeScript.svg (white letters on a blue one)
      const js = icon16('<path d="M2 2h12v12H2z" fill="#F2C55C"/><path d="M5 9h2v3H5z" fill="#1E1F22"/>');
      assert.equal(toGlyph(js, ['#1E1F22']), icon16('<path d="M2 2h12v12H2z" fill="none"/><path d="M5 9h2v3H5z" fill="#f2c55c"/>'));
      const ts = icon16('<path d="M2 2h12v12H2z" fill="#548AF7"/><path d="M5 9h2v3H5z" fill="white"/>');
      assert.equal(toGlyph(ts, ['white']), icon16('<path d="M2 2h12v12H2z" fill="none"/><path d="M5 9h2v3H5z" fill="#548af7"/>'));
    });

    it('refuses an icon without a paint for the tile', () => {
      assert.throws(() => toGlyph(icon16('<path d="M2 2h12v12H2z" fill="#1E1F22"/>')), /without a paint/);
    });

    it('says where a glyph comes from, and that it was changed', () => {
      assert.match(glyphNotice('json_dark.svg'), /^<!-- From JetBrains\/intellij-community, platform\/icons\/src\/expui\/fileTypes\/json_dark\.svg: .*Apache License 2\.0\. Changed for Cool Theme Kit .* -->\n$/);
    });

    it('measures a glyph as lines, whatever its holes', () => {
      assert.deepEqual(measureGlyph(BADGE), { box: [2, 2, 20, 20], lines: true });
    });

    it('gives each icon of this theme one New UI icon, and names icons that exist', () => {
      const names = JETBRAINS_GLYPHS.flatMap((glyph) => glyph.names);
      assert.equal(new Set(names).size, names.length, 'an icon named twice');
      for (const name of names) assert.ok(iconFolder(name), `no icon ${name}`);
    });

    it('has the glyph of every icon of the table, for its dark variant too, and no other (bun run sync:glyphs)', () => {
      const expected = JETBRAINS_GLYPHS.flatMap((glyph) => glyph.names).flatMap((name) => [name, `${name}_dark`].filter((item) => iconFolder(item)));
      assert.deepEqual(readdirSync(glyphsFolder).sort(), expected.map((name) => `${name}.svg`).sort());
    });

    it('has glyphs of one color, with their notice and their measures', () => {
      const metrics = JSON.parse(readFileSync(join(repoRoot, METRICS_FILE), 'utf8')) as IconMetrics;
      for (const file of readdirSync(glyphsFolder)) {
        const glyph = readFileSync(join(glyphsFolder, file), 'utf8');
        assert.ok(glyph.startsWith('<!-- From JetBrains/intellij-community, platform/icons/src/expui/fileTypes/'), file);
        assert.equal(paintCount(glyph), 1, file);
        assert.ok(toMetric(metrics.glyphs[file.slice(0, -4)])?.lines, `${file}: bun run sync:metrics`);
      }
    });
  });

  describe('the generated theme', () => {
    let directory: string;

    const generate = async (style: IconStyle) => {
      directory = mkdtempSync(join(tmpdir(), 'afi-glass-'));
      for (const folder of ['iconGenerator', 'assets']) symlinkSync(join(repoRoot, folder), join(directory, folder), 'junction');
      const dist = join(directory, 'dist');
      const config = { ...getDefaultConfig(), iconStyle: style };
      await new IconThemeGenerator(config, { dist, iconGenerator: join(directory, 'iconGenerator') }).createJsonTheme();
      const theme = JSON.parse(readFileSync(join(dist, JSON_FILE_NAME), 'utf8')) as IconConfiguration;
      const icon = (definition: string) => readFileSync(join(dist, theme.iconDefinitions![definition].iconPath!), 'utf8');
      return { config, icon, theme };
    };

    afterEach(() => {
      // the junctions first: the real icons are never touched
      for (const folder of ['iconGenerator', 'assets']) rmSync(join(directory, folder), { force: true, recursive: false });
      rmSync(directory, { force: true, recursive: true });
    });

    it('is glass by default: tiles, glass folders, and the same icon names as before', async function () {
      this.timeout(120_000);
      const { config, icon, theme } = await generate(IconStyle.Glass);

      assert.equal(getFileConfigHash(config), '', 'the default style adds nothing to the names of the icons');
      assert.equal(theme.atomConfig?.iconStyle, 'glass');
      assert.ok(icon(theme.fileExtensions!.ts).includes('url(#ctk-t)'), 'a file icon is on a tile');
      assert.ok(icon(theme.fileExtensions!.pdf).includes('operator="out"'), 'PDF: the glyph cut out of the square');
      assert.ok(icon(theme.folderNames!.src).includes('url(#ctk-f)'), 'a folder icon is a glass folder');
      assert.ok(icon(theme.folderNamesExpanded!.src).includes('opacity=".6"'), 'an expanded folder holds a sheet');
      assert.ok(icon(theme.folder!).includes('url(#ctk-f)'), 'the default folder too');
    });

    it('draws an expanded glass folder for a folder icon that only has a closed one', async function () {
      this.timeout(120_000);
      const { icon, theme } = await generate(IconStyle.Glass);
      const closedOnly = readdirSync(join(repoRoot, 'iconGenerator', 'assets', 'icons', 'folders')).find(
        (file) => !existsSync(join(repoRoot, 'iconGenerator', 'assets', 'icons', 'foldersOpen', file)) && file !== 'seed.svg',
      );
      if (!closedOnly) return;

      const definition = Object.values(theme.folderNamesExpanded!).find((name) => name.replace(/_dark$/, '') === closedOnly.slice(0, -4));
      if (definition) assert.ok(icon(definition).includes('opacity=".6"'), closedOnly);
    });

    it('draws the JetBrains New UI glyph of a file type that has one, on a tile of its color', async function () {
      this.timeout(120_000);
      const { icon, theme } = await generate(IconStyle.Glass);
      const glyphs = join(repoRoot, 'assets', 'icons', 'glass', 'files');
      const color = (name: string) => mainPaint(readFileSync(join(glyphs, `${name}.svg`), 'utf8'))!;

      const json = icon(theme.fileExtensions!.json);
      assert.ok(json.includes(`stop-color="${mixColors(color('json'), '#ffffff', 0.18)}"`), 'the tile takes the color of the New UI icon');
      assert.ok(!json.includes('data-iconColor'), 'not the icon of the icon plugin');
      assert.ok(icon(theme.file!).includes(`stop-color="${mixColors(color('file'), '#ffffff', 0.18)}"`), 'the default file icon too');
      // the icon for the dark themes and the one for the light themes: the same glyph
      assert.equal(icon(theme.fileExtensions!.css), icon(theme.light!.fileExtensions!.css));
      // a file type the IDE has no icon for keeps the icon of the icon plugin
      assert.ok(icon(theme.fileExtensions!.rs).includes('data-iconColor'));
    });

    it('keeps the icons as they are drawn with the flat style, under other file names', async function () {
      this.timeout(120_000);
      const { config, icon, theme } = await generate(IconStyle.Flat);

      assert.notEqual(getFileConfigHash(config), '');
      assert.ok(theme.iconDefinitions![theme.fileExtensions!.ts].iconPath!.includes('~'), 'VS Code loads the icons again');
      assert.ok(!icon(theme.fileExtensions!.ts).includes('ctk-'));
      assert.ok(icon(theme.fileExtensions!.json).includes('data-iconColor="JSON"'), 'the icon of the icon plugin, not the New UI glyph');
      assert.ok(icon(theme.folderNames!.src).includes('data-folderColor'));
    });
  });
});
