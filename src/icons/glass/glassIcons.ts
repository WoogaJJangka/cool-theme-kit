/**
 * The "glass" look of the file and folder icons (the `iconStyle` setting): every file icon becomes the same rounded
 * tile in the color of the icon, with its shape as one flat glyph on it, and every folder the same rounded folder in
 * its color with its badge as a glyph. One shape for all the icons is what makes them read as one set, and a tile keeps
 * dark logos visible on dark themes (and light ones on light themes).
 *
 * Only what survives at 16px is drawn: the rounded shape, a soft vertical gradient and one highlight on the top edge.
 *
 * Pure functions of the svg text: the theme is regenerated in the extension host, where nothing can render an svg.
 * What needs a renderer (the box a glyph really fills, whether a logo is a badge with its glyph cut out) is measured
 * ahead by `sync:metrics` (`assets/icons/metrics.json`).
 *
 * The glyph of a file type the JetBrains IDEs have their own New UI icon for is that icon, not the logo of the icon
 * plugin: `assets/icons/glass/files` (`sync:glyphs`, src/scripts/icons/jetbrainsGlyphs.ts). The generator gives
 * it to these functions in place of the icon; it is an icon of one color like any other.
 */

/** What an icon is drawn for */
type IconKind = 'file' | 'folder' | 'folderOpen';

/** x, y, width and height of what an icon draws, in the units of its svg */
type GlyphBox = [x: number, y: number, width: number, height: number];

/** What was measured for an icon */
type IconMetric = {
  /** the box its glyph fills (for a folder, the box of its badge); with `holes`, the box of the holes */
  box?: GlyphBox;
  /** the color of its tile, for an icon of several colors drawn as one glyph all the same */
  color?: string;
  /**
   * a badge (square, disc, hexagon…) with the glyph cut out of it, like the TypeScript logo: on a tile it would be
   * a badge in a badge, so the tile takes its place and the holes are the glyph
   */
  holes?: boolean;
  /**
   * a glyph drawn with lines one pixel wide for an icon of 16 pixels (the JetBrains New UI icons): it is drawn larger
   * than a logo, or its lines would be well under a pixel on the tile
   */
  lines?: boolean;
};

/** An entry of `metrics.json`: the box, then `"h"` for holes, `"l"` for lines and/or the `#rrggbb` color */
type MetricEntry = Array<number | string>;

/** The icons of this theme: file icons, folder icons, expanded folder icons */
type IconGroup = 'files' | 'folders' | 'foldersOpen';

/**
 * The measures of the bundled icons, by icon name (without `.svg`). `glyphs`: the JetBrains New UI glyphs drawn
 * instead of a file icon of the same name (`assets/icons/glass/files`).
 */
type IconMetrics = Record<IconGroup | 'glyphs', Record<string, MetricEntry>>;

const toMetric = (entry: MetricEntry | undefined): IconMetric | undefined => {
  if (!entry) return undefined;

  const box = entry.slice(0, 4);
  const metric: IconMetric = {};
  if (box.length === 4 && box.every((value) => typeof value === 'number')) metric.box = box as GlyphBox;
  for (const flag of entry.slice(4)) {
    if (flag === 'h') metric.holes = true;
    else if (flag === 'l') metric.lines = true;
    else if (typeof flag === 'string' && flag.startsWith('#')) metric.color = flag;
  }
  return metric;
};

const toEntry = ({ box, color, holes, lines }: IconMetric): MetricEntry => [
  ...(box ?? []),
  ...(holes ? ['h'] : []),
  ...(lines ? ['l'] : []),
  ...(color ? [color] : []),
];

// region colors

type Rgb = [red: number, green: number, blue: number];

const WHITE = '#ffffff';
const BLACK = '#000000';
/** The tile of an icon without a color of its own */
const NEUTRAL = '#90a4ae';
/** The tile of an icon drawn with its own colors: dark, so that any of them shows on it */
const DARK_TILE = '#3b4048';

const toRgb = (hex: string): Rgb => {
  const digits = hex.slice(1);
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF];
};

const toHex = (rgb: Rgb): string =>
  `#${rgb.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`;

/** `amount` of the way from a color to another */
const mixColors = (from: string, to: string, amount: number): string => {
  const a = toRgb(from);
  const b = toRgb(to);
  return toHex([a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount]);
};

/** Relative luminance (WCAG), 0 for black and 1 for white */
const luminance = (hex: string): number => {
  const [red, green, blue] = toRgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.039_28 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/** Above this luminance a tile gets a dark glyph instead of a white one (the yellow of JavaScript) */
const LIGHT_TILE = 0.45;

/** The color of a glyph on a tile of that color */
const inkOn = (tile: string): string => (luminance(tile) > LIGHT_TILE ? mixColors(tile, BLACK, 0.74) : WHITE);

/** `fill="#abc"`, `stroke='#aabbcc'`, `stop-color:#abc` (in a style) */
const HEX_PAINT = /(?:fill|stroke|stop-color)\s*[:=][\s"']*(#[\dA-Fa-f]{6}|#[\dA-Fa-f]{3})(?![\dA-Fa-f])/g;

/** The paint color an svg uses the most, the first one among equals */
const mainPaint = (svg: string): string | undefined => {
  const counts = new Map<string, number>();
  for (const match of svg.matchAll(HEX_PAINT)) {
    const color = toHex(toRgb(match[1]));
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }

  let main: string | undefined;
  let most = 0;
  for (const [color, count] of counts) {
    if (count > most) {
      main = color;
      most = count;
    }
  }
  return main;
};

/** How many paint colors an svg uses */
const paintCount = (svg: string): number => new Set([...svg.matchAll(HEX_PAINT)].map((match) => toHex(toRgb(match[1])))).size;

// endregion

// region svg text

const stripComments = (svg: string): string => {
  let text = '';
  let from = 0;
  for (let start = svg.indexOf('<!--'); start >= 0; start = svg.indexOf('<!--', from)) {
    const end = svg.indexOf('-->', start + 4);
    text += svg.slice(from, start);
    if (end === -1) return text;
    from = end + 3;
  }
  return text + svg.slice(from);
};

const ATTRIBUTE = /([\w:-]+)\s*=\s*("[^"]*"|'[^']*')/g;

/** The attributes of the root that its content inherits: they move to a group around the content */
const INHERITED = new Set([
  'clip-rule',
  'color',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'style',
]);

/** The parts of an svg file its glass version is made of */
type SvgParts = {
  /** the inherited attributes of the root, for a group around the content */
  attributes: string;
  /** what the root contains */
  content: string;
  /** the namespace prefixes the content may use (`xmlns:xlink`…), for the new root */
  namespaces: string;
  /** the viewBox, or the size, of the root */
  viewBox?: GlyphBox;
};

const numbers = (text: string | undefined): number[] =>
  (text ?? '').split(/[\s,]+/).filter(Boolean).map((part) => Number.parseFloat(part));

const parseSvg = (svg: string): SvgParts | undefined => {
  const text = stripComments(svg);
  const start = text.indexOf('<svg');
  const rootEnd = text.indexOf('>', start);
  const end = text.lastIndexOf('</svg>');
  if (start === -1 || rootEnd === -1 || end < rootEnd) return undefined;

  const root = new Map<string, string>();
  for (const match of text.slice(start, rootEnd).matchAll(ATTRIBUTE)) root.set(match[1], match[2]);

  const value = (name: string) => root.get(name)?.slice(1, -1);
  const box = numbers(value('viewBox'));
  const size = [0, 0, Number.parseFloat(value('width') ?? ''), Number.parseFloat(value('height') ?? '')];
  const viewBox = [box, size].find((candidate) => candidate.length === 4 && candidate.every((item) => Number.isFinite(item)) && candidate[2] > 0 && candidate[3] > 0);

  return {
    attributes: [...root].filter(([name]) => INHERITED.has(name)).map(([name, quoted]) => `${name}=${quoted}`).join(' '),
    content: text.slice(rootEnd + 1, end),
    namespaces: [...root].filter(([name]) => name.startsWith('xmlns:')).map(([name, quoted]) => ` ${name}=${quoted}`).join(''),
    viewBox: viewBox as GlyphBox | undefined,
  };
};

const round = (value: number): string => String(Number(value.toFixed(4)));

/**
 * The content of an icon, its `box` scaled by `scale` and centered on a point of the 16 unit canvas.
 * In an svg element with the viewBox of the icon when it has one: the lengths in percent of its content (a mask over
 * "100%") keep meaning what they meant.
 */
const place = (parts: Pick<SvgParts, 'attributes' | 'content' | 'viewBox'>, box: GlyphBox, scale: number, centerX: number, centerY: number): string => {
  const [x, y, width, height] = box;
  const content = `<g ${parts.attributes}>${parts.content}</g>`;
  if (!parts.viewBox) {
    const transform = `translate(${round(centerX)} ${round(centerY)}) scale(${round(scale)}) translate(${round(-(x + width / 2))} ${round(-(y + height / 2))})`;
    return `<g transform="${transform}">${content}</g>`;
  }

  const [left, top, viewWidth, viewHeight] = parts.viewBox;
  const position = `x="${round(centerX - scale * (x + width / 2 - left))}" y="${round(centerY - scale * (y + height / 2 - top))}"`;
  const size = `width="${round(viewWidth * scale)}" height="${round(viewHeight * scale)}"`;
  return `<svg ${position} ${size} viewBox="${parts.viewBox.join(' ')}" overflow="visible">${content}</svg>`;
};

const SIZE = 16;
const ROOT = (namespaces: string) => `<svg xmlns="http://www.w3.org/2000/svg"${namespaces} viewBox="0 0 ${SIZE} ${SIZE}" width="16px" height="16px">`;

/** Ids of this file in the generated svg: none an icon would use */
const ID = 'ctk-';
const FILTER_AREA = `x="0" y="0" width="${SIZE}" height="${SIZE}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"`;

/**
 * Paints a group with one color where it draws anything (`in`), or where it draws nothing (`out`): the glyph of an
 * icon, whatever its colors. A filter and not a mask: the monochrome setting recolors every paint afterwards, and a
 * recolored mask would be a transparency.
 */
const inkFilter = (id: string, color: string, operator: 'in' | 'out') =>
  `<filter id="${ID}${id}" ${FILTER_AREA}><feFlood flood-color="${color}"/><feComposite in2="SourceAlpha" operator="${operator}"/></filter>`;

/** The highlight of a glass edge: bright at the top, gone in the middle, a little back at the bottom */
const rimGradient = (id: string, top: number, bottom: number) =>
  `<linearGradient id="${ID}${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity="${top}"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity="${bottom}"/></linearGradient>`;

const verticalGradient = (id: string, top: string, bottom: string, opacities?: [number, number]) =>
  `<linearGradient id="${ID}${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${top}"${opacities ? ` stop-opacity="${opacities[0]}"` : ''}/><stop offset="1" stop-color="${bottom}"${opacities ? ` stop-opacity="${opacities[1]}"` : ''}/></linearGradient>`;

// endregion

// region file icons

const TILE_RADIUS = 4.6;
/** The longest side of a glyph on its tile, and the side of a square glyph: a long glyph is not as tall as a square one */
const GLYPH_LONGEST = 11.6;
const GLYPH_SQUARE = 10.2;
/** The same for a glyph drawn with lines (`lines`): larger, its lines stay close to a pixel */
const LINES_LONGEST = 12.4;
const LINES_SQUARE = 11.6;
/** A glyph placed by the viewBox of its file (an icon that was not measured) usually has a margin in it */
const GLYPH_UNMEASURED = 11.8;

const TILE = `<rect width="${SIZE}" height="${SIZE}" rx="${TILE_RADIUS}" fill="url(#${ID}t)"/>`;
const SHEEN = '<path d="M0 4.6A4.6 4.6 0 0 1 4.6 0h6.8A4.6 4.6 0 0 1 16 4.6v2C11.4 8.4 4.6 8.4 0 6.6Z" fill="#fff" opacity=".13"/>';
const RIM = `<rect x=".5" y=".5" width="15" height="15" rx="4.1" fill="none" stroke="url(#${ID}r)" stroke-width=".9"/>`;

/**
 * A file icon as a glyph on a tile.
 * - An icon of one color: a tile of that color, the glyph white (dark on a light tile).
 * - An icon of several colors: a dark tile, the icon as it is drawn. Flattened to one color, most are a blob.
 * - A badge with the glyph cut out (`holes`): a tile of its color, the holes as the glyph.
 * @param svg the icon
 * @param metric what was measured for it; without it the glyph is placed by its viewBox (the icons of the user and
 * of other themes)
 */
const glassFile = (svg: string, metric?: IconMetric): string => {
  const parts = parseSvg(svg);
  const box = metric?.box ?? parts?.viewBox;
  if (!parts || !box || box[2] <= 0 || box[3] <= 0) return svg;

  const ownColors = paintCount(svg) > 1 && !metric?.color && !metric?.holes;
  const color = ownColors ? DARK_TILE : (metric?.color ?? mainPaint(svg) ?? NEUTRAL);
  const width = box[2];
  const height = box[3];
  const [longest, square] = metric?.lines ? [LINES_LONGEST, LINES_SQUARE] : [GLYPH_LONGEST, GLYPH_SQUARE];
  const scale = metric?.box
    ? Math.min(longest / Math.max(width, height), square / Math.sqrt(width * height))
    : GLYPH_UNMEASURED / Math.max(width, height);
  const placed = place(parts, box, scale, SIZE / 2, SIZE / 2);

  let glyph = placed;
  let extra = '';
  if (metric?.holes) {
    // everything the badge does not draw inside the box of its holes
    const [w, h] = [width * scale, height * scale];
    extra = `<clipPath id="${ID}c"><rect x="${round((SIZE - w) / 2)}" y="${round((SIZE - h) / 2)}" width="${round(w)}" height="${round(h)}"/></clipPath>`;
    glyph = `<g clip-path="url(#${ID}c)"><g filter="url(#${ID}k)">${placed}</g></g>`;
  } else if (!ownColors) {
    glyph = `<g filter="url(#${ID}k)">${placed}</g>`;
  }

  return [
    ROOT(parts.namespaces),
    '<defs>',
    verticalGradient('t', mixColors(color, WHITE, 0.18), mixColors(color, BLACK, 0.16)),
    rimGradient('r', 0.7, 0.22),
    ownColors ? '' : inkFilter('k', inkOn(color), metric?.holes ? 'out' : 'in'),
    extra,
    '</defs>',
    TILE,
    SHEEN,
    glyph,
    RIM,
    '</svg>',
  ].join('');
};

// endregion

// region folder icons

/**
 * The folder shape of a bundled folder icon is the path marked with the color it takes (`data-folderColor`, or
 * `data-themed` for the plain folders of the folder color setting). The few without a mark start like the Material
 * folder, closed (`M10,4H4…`) and open (`M20,18H4V8…`).
 */
const FOLDER_MARK = /\sdata-(?:folderColor|themed)\s*=/;
const CLOSED_FOLDER = 'm104h';
const OPEN_FOLDER = 'm2018';

const PATH_ELEMENT = /<path\b[^>]*>/g;
const PATH_DATA = /\sd\s*=\s*["']([^"']*)["']/;
const FILL = /\sfill\s*=\s*["'](#[\dA-Fa-f]{6}|#[\dA-Fa-f]{3})["']/;
const DRAWN = /<(?:path|circle|rect|polygon|polyline|ellipse|line|use|text|image)\b/;

/** The folder shape of a bundled folder icon: its color, and the rest of the icon (the badge) */
type FolderParts = SvgParts & {
  /** the icon without its folder shape: its badge, empty for a plain folder */
  badge: string;
  /** the color of the folder */
  color: string;
};

const isFolderShape = (path: string) => {
  const data = PATH_DATA.exec(path)?.[1].replaceAll(/[\s,]+/g, '').toLowerCase();
  return data?.startsWith(CLOSED_FOLDER) || data?.startsWith(OPEN_FOLDER);
};

/**
 * Split a bundled folder icon into its folder shape and its badge.
 * @returns nothing for an svg that is not drawn that way (the folder icon of another theme, a custom one)
 */
const parseFolder = (svg: string): FolderParts | undefined => {
  const parts = parseSvg(svg);
  if (!parts) return undefined;

  const paths = [...parts.content.matchAll(PATH_ELEMENT)];
  const shape = paths.find((match) => FOLDER_MARK.test(match[0])) ?? paths.find((match) => isFolderShape(match[0]));
  if (!shape) return undefined;

  const end = shape.index + shape[0].length;
  // `<path …/>`, or `<path …></path>`
  const closing = shape[0].endsWith('/>') ? end : parts.content.indexOf('</path>', end) + '</path>'.length;
  const badge = parts.content.slice(0, shape.index) + parts.content.slice(Math.max(end, closing));
  const fill = FILL.exec(shape[0])?.[1];
  return { ...parts, badge: DRAWN.test(badge) ? badge : '', color: fill ? toHex(toRgb(fill)) : NEUTRAL };
};

const FOLDER_BACK =
  'M.5 3.9A1.9 1.9 0 0 1 2.4 2h3.3c.5 0 .98.2 1.34.55l.62.6c.36.36.84.55 1.34.55h4.6a1.9 1.9 0 0 1 1.9 1.9v7a1.9 1.9 0 0 1-1.9 1.9H2.4a1.9 1.9 0 0 1-1.9-1.9Z';
const FOLDER_BOTTOM = 14.5;
/** The top of the front of the folder, closed and open: an open folder shows the sheet it holds */
const FRONT_TOP = { closed: 5.1, open: 7.3 };
const SHEET = '<rect x="1.9" y="4.9" width="12.2" height="4.4" rx="1" fill="#fff" opacity=".6"/>';
/** The box a badge fits in on the front of the folder: its width, and its height closed and open */
const BADGE_WIDTH = 9.8;
const BADGE_HEIGHT = { closed: 6.3, open: 4.9 };

/**
 * A bundled folder icon as a glass folder of its color, with its badge as a glyph on the front.
 * @param svg the icon, after the folder color setting
 * @param open the expanded folder
 * @param metric the box of its badge; a badge that was not measured cannot be placed, the icon is left as it is
 */
const glassFolder = (svg: string, open: boolean, metric?: IconMetric): string => {
  const parts = parseFolder(svg);
  if (!parts || (parts.badge && !metric?.box)) return svg;

  const { color } = parts;
  const state = open ? 'open' : 'closed';
  const top = FRONT_TOP[state];
  const height = FOLDER_BOTTOM - top;
  const front = mixColors(color, WHITE, 0.14);

  let badge = '';
  // a badge of several colors is drawn as it is: flattened to one color, most are a blob
  let ownColors = false;
  if (parts.badge && metric?.box) {
    const scale = Math.min(BADGE_WIDTH / metric.box[2], BADGE_HEIGHT[state] / metric.box[3]);
    const placed = place({ ...parts, content: parts.badge }, metric.box, scale, SIZE / 2, top + height / 2 + 0.1);
    ownColors = paintCount(parts.badge) > 1;
    badge = ownColors ? placed : `<g filter="url(#${ID}k)">${placed}</g>`;
  }

  return [
    ROOT(parts.namespaces),
    '<defs>',
    verticalGradient('b', mixColors(color, BLACK, 0.16), mixColors(color, BLACK, 0.34)),
    verticalGradient('f', mixColors(color, WHITE, 0.3), mixColors(color, BLACK, 0.04), [0.97, 0.92]),
    rimGradient('r', 0.75, 0),
    badge && !ownColors ? inkFilter('k', inkOn(front), 'in') : '',
    '</defs>',
    `<path d="${FOLDER_BACK}" fill="url(#${ID}b)"/>`,
    open ? SHEET : '',
    `<rect x=".5" y="${top}" width="15" height="${round(height)}" rx="1.9" fill="url(#${ID}f)"/>`,
    `<rect x=".9" y="${round(top + 0.4)}" width="14.2" height="${round(height - 0.8)}" rx="1.5" fill="none" stroke="url(#${ID}r)" stroke-width=".7"/>`,
    badge,
    '</svg>',
  ].join('');
};

// endregion

/** An icon in the glass style: a file icon on its tile, a bundled folder icon as a glass folder */
const glassIcon = (svg: string, kind: IconKind, metric?: IconMetric): string =>
  kind === 'file' ? glassFile(svg, metric) : glassFolder(svg, kind === 'folderOpen', metric);

export {
  glassFile,
  glassFolder,
  glassIcon,
  luminance,
  mainPaint,
  mixColors,
  paintCount,
  parseFolder,
  parseSvg,
  toEntry,
  toMetric,
};
export type { FolderParts, GlyphBox, IconGroup, IconKind, IconMetric, IconMetrics, MetricEntry, SvgParts };
