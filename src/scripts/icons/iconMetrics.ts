/**
 * Measures what the glass icon style needs to know about an icon and cannot read from its text
 * (src/icons/glass/glassIcons.ts): the box its glyph fills, and whether it is a badge with its glyph cut out.
 * The icons are rendered with resvg, which the extension does not ship: the measures are written to
 * `assets/icons/metrics.json` by `bun run sync:metrics`.
 */
import { Resvg } from '@resvg/resvg-js';
import { mainPaint, parseFolder, parseSvg } from 'src/icons/glass/glassIcons';

import type { GlyphBox, IconMetric, SvgParts } from 'src/icons/glass/glassIcons';

/** No text is rendered (see `measureFile`): loading the system fonts for each icon would take seconds */
const OPTIONS = { font: { loadSystemFonts: false } };

/** The side of the picture an icon is analysed on */
const RASTER = 96;
const OPAQUE = 128;

const precise = (value: number): number => Number(value.toPrecision(4));

type Parts = Pick<SvgParts, 'attributes' | 'namespaces' | 'viewBox'>;

const document = (parts: Parts, content: string, size: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg"${parts.namespaces} ${size}><g ${parts.attributes}>${content}</g></svg>`;

/** The box of what the content draws, in the units of the icon: one unit is one pixel of the picture */
const boxOf = (parts: Parts, content: string): GlyphBox | undefined => {
  const size = parts.viewBox
    ? `viewBox="${parts.viewBox.join(' ')}" width="${parts.viewBox[2]}" height="${parts.viewBox[3]}"`
    : 'width="4096" height="4096"';
  const box = new Resvg(document(parts, content, size), OPTIONS).getBBox();
  if (!box || box.width <= 0 || box.height <= 0) return undefined;
  return [precise(box.x), precise(box.y), precise(box.width), precise(box.height)];
};

/** Where the glyph is drawn when it fills a square picture, `RASTER` pixels a side: one value a pixel */
const drawnPixels = (parts: SvgParts, box: GlyphBox): boolean[] => {
  // the icon in its own viewBox (its lengths in percent), seen through the box of its glyph
  const width = parts.viewBox?.[2] ?? 4096;
  const height = parts.viewBox?.[3] ?? 4096;
  const inner = `<svg ${parts.viewBox ? `viewBox="${parts.viewBox.join(' ')}" ` : ''}width="${width}" height="${height}" overflow="visible"><g ${parts.attributes}>${parts.content}</g></svg>`;
  const outer = `<svg xmlns="http://www.w3.org/2000/svg"${parts.namespaces} viewBox="${box.join(' ')}" width="${RASTER}" height="${RASTER}">${inner}</svg>`;
  const { pixels } = new Resvg(outer, OPTIONS).render();
  return Array.from({ length: RASTER * RASTER }, (_, index) => pixels[index * 4 + 3] >= OPAQUE);
};

/** The pixels the glyph does not draw that the outside does not reach: its holes */
const holePixels = (drawn: boolean[]): boolean[] => {
  const outside = Array.from({ length: drawn.length }, () => false);
  const pending: number[] = [];
  const visit = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= RASTER || y >= RASTER) return;
    const index = y * RASTER + x;
    if (drawn[index] || outside[index]) return;
    outside[index] = true;
    pending.push(index);
  };

  for (let edge = 0; edge < RASTER; edge++) {
    visit(edge, 0);
    visit(edge, RASTER - 1);
    visit(0, edge);
    visit(RASTER - 1, edge);
  }
  for (let index = pending.pop(); index !== undefined; index = pending.pop()) {
    const x = index % RASTER;
    const y = (index - x) / RASTER;
    visit(x - 1, y);
    visit(x + 1, y);
    visit(x, y - 1);
    visit(x, y + 1);
  }
  return drawn.map((isDrawn, index) => !isDrawn && !outside[index]);
};

const count = (pixels: boolean[]) => pixels.reduce((total, pixel) => total + (pixel ? 1 : 0), 0);

type Bounds = { bottom: number; left: number; right: number; top: number };

const boundsOf = (pixels: boolean[]): Bounds | undefined => {
  const bounds = { bottom: -1, left: RASTER, right: -1, top: RASTER };
  for (const [index, pixel] of pixels.entries()) {
    if (!pixel) continue;
    const x = index % RASTER;
    const y = (index - x) / RASTER;
    bounds.left = Math.min(bounds.left, x);
    bounds.right = Math.max(bounds.right, x);
    bounds.top = Math.min(bounds.top, y);
    bounds.bottom = Math.max(bounds.bottom, y);
  }
  return bounds.right < 0 ? undefined : bounds;
};

/** How much of the spans between the first and the last pixel of each line is set: 1 for a shape without a dent */
const solidity = (pixels: boolean[], vertical: boolean): number => {
  let spans = 0;
  for (let line = 0; line < RASTER; line++) {
    let first = -1;
    let last = -1;
    for (let at = 0; at < RASTER; at++) {
      if (!pixels[vertical ? at * RASTER + line : line * RASTER + at]) continue;
      if (first < 0) first = at;
      last = at;
    }
    if (first >= 0) spans += last - first + 1;
  }
  return spans === 0 ? 0 : count(pixels) / spans;
};

/**
 * The box of the holes of a badge with its glyph cut out (the TypeScript logo: a square with "TS" cut out, the C logo:
 * a hexagon with a "C" cut out), in the units of the icon.
 * A badge: a plain shape without a dent (holes filled), mostly drawn, with holes big enough to be a glyph, and nothing
 * but the badge and its holes in the box of the holes (the glass icon paints what is not drawn in that box).
 */
const holesBox = (drawn: boolean[], [x, y, width, height]: GlyphBox): GlyphBox | undefined => {
  const holes = holePixels(drawn);
  const filled = drawn.map((isDrawn, index) => isDrawn || holes[index]);
  const bounds = boundsOf(holes);
  if (!bounds) return undefined;

  const filledArea = count(filled);
  const holeShare = count(holes) / filledArea;
  const isBadge = solidity(filled, false) >= 0.97 && solidity(filled, true) >= 0.97 && filledArea / (RASTER * RASTER) >= 0.45;
  const isGlyph = holeShare >= 0.05 && holeShare <= 0.5 && Math.max(bounds.right - bounds.left, bounds.bottom - bounds.top) >= RASTER * 0.3;
  if (!isBadge || !isGlyph) return undefined;

  // a pixel of margin around the holes, when the badge has it
  const box = {
    bottom: Math.min(RASTER - 1, bounds.bottom + 1),
    left: Math.max(0, bounds.left - 1),
    right: Math.min(RASTER - 1, bounds.right + 1),
    top: Math.max(0, bounds.top - 1),
  };
  for (let row = box.top; row <= box.bottom; row++) {
    for (let column = box.left; column <= box.right; column++) {
      if (!filled[row * RASTER + column]) return undefined;
    }
  }

  // the glyph is centered in the picture, one scale for both sides
  const scale = Math.max(width, height) / RASTER;
  const offsetX = x - (RASTER * scale - width) / 2;
  const offsetY = y - (RASTER * scale - height) / 2;
  return [
    precise(offsetX + box.left * scale),
    precise(offsetY + box.top * scale),
    precise((box.right - box.left + 1) * scale),
    precise((box.bottom - box.top + 1) * scale),
  ];
};

/** Badges whose holes are not their glyph: they stay a glyph on the tile */
const PLAIN = [
    // the hole is the inside of a letter or of an outline, not a glyph
    'actionscript',
    'bitbucket',
    'bluespec',
    'cordova',
    'garden',
    'noon',
    'nu',
    'polyglot',
    'qlikview',
    'sss',
    'tuc',
    // the shape is the meaning: a box, a disk, an envelope, a camera, a padlock
    'archive',
    'backup',
    'email',
    'nixpacks',
    'snapshot',
    'bunlock',
    'composerlock',
    'denolock',
    'flutterlock',
    'lock',
    'npmlock',
    'npmshrinkwrap',
    'pdmlock',
    'pipfilelock',
    'swiftlock',
    'yarnlock',
];

/**
 * Icons of several colors that read better as one glyph on a tile of their main color than as they are drawn on a
 * dark tile: two shades of one color (the Docker Compose whale), or a dark color that a dark tile hides.
 */
const ONE_COLOR = [
  'commitlint',
  'commitlintConfig',
  'dockercompose',
  'dockercomposefiles',
  'goctl',
  'idea',
  'pnpm',
  'pnpmfile',
  'sizelimit',
  'vitest',
  'woodpecker',
];

/** What the measure cannot tell, by icon name */
export const FILE_OVERRIDES: Record<string, { oneColor?: boolean; plain?: boolean }> = Object.fromEntries([
  ...PLAIN.map((name) => [name, { plain: true }] as const),
  ...ONE_COLOR.map((name) => [name, { oneColor: true }] as const),
]);

/**
 * The measures of a file icon; nothing for an svg that draws nothing, or that draws text: its box depends on the fonts
 * of the machine (none on the CI), so it is placed by its viewBox like an icon that is not bundled.
 */
export const measureFile = (svg: string, name?: string): IconMetric | undefined => {
  if (svg.includes('<text')) return undefined;

  const parts = parseSvg(svg);
  const box = parts && boxOf(parts, parts.content);
  if (!parts || !box) return undefined;

  const override = name === undefined ? undefined : FILE_OVERRIDES[name];
  const holes = override?.plain ? undefined : holesBox(drawnPixels(parts, box), box);
  const metric: IconMetric = holes ? { box: holes, holes: true } : { box };
  if (override?.oneColor) metric.color = mainPaint(svg);
  return metric;
};

/** The box of everything an icon draws, in the units of its svg; nothing for an svg that draws nothing */
export const measureBox = (svg: string): GlyphBox | undefined => {
  const parts = parseSvg(svg);
  return parts && boxOf(parts, parts.content);
};

/**
 * The measures of a JetBrains New UI glyph of the glass style: its box, and that it is drawn with lines (larger on
 * the tile). It is already the glyph of its tile (src/scripts/icons/jetbrainsGlyphs.ts): its holes are never taken
 * for it.
 */
export const measureGlyph = (svg: string): IconMetric | undefined => {
  const parts = parseSvg(svg);
  const box = parts && boxOf(parts, parts.content);
  return box ? { box, lines: true } : undefined;
};

/** The measures of a bundled folder icon: the box of its badge; nothing for a plain folder or another drawing */
export const measureFolder = (svg: string): IconMetric | undefined => {
  const parts = parseFolder(svg);
  const box = parts?.badge ? boxOf(parts, parts.badge) : undefined;
  return box ? { box } : undefined;
};
