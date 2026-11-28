/**
 * Measures what the glass icon style needs to know about an icon and cannot read from its text
 * (src/icons/glass/glassIcons.ts): the box its glyph fills, and whether it is a badge with its glyph cut out.
 * The icons are rendered with resvg, which the extension does not ship: the measures are written to
 * `assets/icons/metrics.json` by `bun run sync:metrics`.
 */
import { Resvg } from '@resvg/resvg-js';
import { mainPaint, parseFolder, parseSvg, shownSquare } from 'src/icons/glass/glassIcons';

import type { GlyphBox, IconMetric, SvgParts } from 'src/icons/glass/glassIcons';

/** No text is rendered (see `measureFile`): loading the system fonts for each icon would take seconds */
const OPTIONS = { font: { loadSystemFonts: false } };

/** The side of the picture an icon is analysed on */
const RASTER = 96;
/** A pixel the glyph draws, for its holes */
const OPAQUE = 128;
/** A pixel the icon shows at all, for its box */
const SHOWN = 16;

const precise = (value: number): number => Number(value.toPrecision(4));

type Parts = Pick<SvgParts, 'attributes' | 'namespaces' | 'viewBox'>;

const document = (parts: Parts, content: string, size: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg"${parts.namespaces} ${size}><g ${parts.attributes}>${content}</g></svg>`;

/** The part of a box inside another one; nothing when they do not overlap */
const intersect = ([x, y, width, height]: GlyphBox, [left, top, right, bottom]: [number, number, number, number]): GlyphBox | undefined => {
  const [from, to] = [Math.max(x, left), Math.min(x + width, right)];
  const [above, below] = [Math.max(y, top), Math.min(y + height, bottom)];
  return to > from && below > above ? [from, above, to - from, below - above] : undefined;
};

/**
 * The box of what the content draws, in the units of the icon: one unit is one pixel of the picture. Only what the
 * icon shows (`shownSquare`): some draw shapes well outside their viewBox (avro, angelscript, factor), which neither VS
 * Code nor the JetBrains IDEs show.
 */
const boxOf = (parts: Parts, content: string): GlyphBox | undefined => {
  const size = parts.viewBox
    ? `viewBox="${parts.viewBox.join(' ')}" width="${parts.viewBox[2]}" height="${parts.viewBox[3]}"`
    : 'width="4096" height="4096"';
  const bounds = new Resvg(document(parts, content, size), OPTIONS).getBBox();
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return undefined;

  let box: GlyphBox | undefined = [bounds.x, bounds.y, bounds.width, bounds.height];
  if (parts.viewBox) {
    const [left, top, side] = shownSquare(parts.viewBox);
    box = intersect(box, [left, top, left + side, top + side]);
  }
  return box?.map(precise) as GlyphBox | undefined;
};

/** The alpha of the icon when its box fills a square picture, `RASTER` pixels a side: one value a pixel */
const alphaOf = (parts: SvgParts, box: GlyphBox): number[] => {
  // the icon in its own viewBox (its lengths in percent), what it shows of it, seen through the box of its glyph
  const [left, top, side] = parts.viewBox ? shownSquare(parts.viewBox) : [0, 0, 4096];
  const view = parts.viewBox ? `viewBox="${parts.viewBox.join(' ')}" ` : '';
  const inner = `<svg x="${left}" y="${top}" width="${side}" height="${side}" ${view}><g ${parts.attributes}>${parts.content}</g></svg>`;
  const outer = `<svg xmlns="http://www.w3.org/2000/svg"${parts.namespaces} viewBox="${box.join(' ')}" width="${RASTER}" height="${RASTER}">${inner}</svg>`;
  const { pixels } = new Resvg(outer, OPTIONS).render();
  return Array.from({ length: RASTER * RASTER }, (_, index) => pixels[index * 4 + 3]);
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

/** How far inside the box of its shapes, in pixels of the picture, what an icon shows is to be its box instead */
const SHOWN_MARGIN = 2;

/**
 * The box of what an icon shows, when it is well inside the box of its shapes: shapes it does not show (under a mask,
 * transparent) would make it smaller than the others and off center (rspack, jakt, vb). Otherwise nothing: the box of
 * the shapes is exact, the picture is within a pixel of it.
 */
const shownBox = (drawn: boolean[], [x, y, width, height]: GlyphBox): GlyphBox | undefined => {
  const bounds = boundsOf(drawn);
  if (!bounds) return undefined;

  // the box is centered in the picture, one scale for both sides
  const scale = Math.max(width, height) / RASTER;
  const marginX = (RASTER - width / scale) / 2;
  const marginY = (RASTER - height / scale) / 2;
  const inside = Math.max(bounds.left - marginX, bounds.top - marginY, RASTER - marginX - bounds.right - 1, RASTER - marginY - bounds.bottom - 1);
  if (inside <= SHOWN_MARGIN) return undefined;

  return [
    precise(x + (bounds.left - marginX) * scale),
    precise(y + (bounds.top - marginY) * scale),
    precise((bounds.right - bounds.left + 1) * scale),
    precise((bounds.bottom - bounds.top + 1) * scale),
  ];
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
  const shapes = parts && boxOf(parts, parts.content);
  if (!parts || !shapes) return undefined;

  const alpha = alphaOf(parts, shapes);
  const shown = shownBox(
    alpha.map((value) => value >= SHOWN),
    shapes,
  );
  const box = shown ?? shapes;
  const override = name === undefined ? undefined : FILE_OVERRIDES[name];
  const drawn = (shown ? alphaOf(parts, box) : alpha).map((value) => value >= OPAQUE);
  const holes = override?.plain ? undefined : holesBox(drawn, box);
  const metric: IconMetric = holes ? { badge: box, box: holes, holes: true } : { box };
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
