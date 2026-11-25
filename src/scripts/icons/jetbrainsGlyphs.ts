/**
 * The glyphs of the glass icon style that come from the JetBrains New UI: for a file type the IDE has its own icon
 * for (JSON, YAML, Java, SQL, text…), the tile shows that shape and takes its color, instead of the icon of the
 * JetBrains icon plugin (iconGenerator). The JetBrains look comes first: the New UI icons are drawn for 16 pixels,
 * with lines that stay readable on a tile, where a logo drawn with fine lines fades.
 *
 * `bun run sync:glyphs` downloads the icons of this table from JetBrains/intellij-community (Apache License 2.0) at
 * the commit pinned in `themes/jetbrains-source.json`, turns each into a glyph of one color with {@link toGlyph} and
 * writes it to `assets/icons/glass/files/<icon of this theme>.svg`. The flat icon style does not use them.
 */
import { luminance } from 'src/icons/glass/glassIcons';

/** A New UI file type icon, and the icons of this theme drawn with it in the glass style */
type GlyphSource = {
  /** its name in `platform/icons/src/expui/fileTypes` (the `_dark` variant is taken: the colors of the dark themes) */
  icon: string;
  /**
   * the paints that are the glyph, for an icon that is a filled shape with letters on it (the square of JavaScript):
   * the tile takes the place of the shape. Without it, the glyph is everything but the dark inner fills.
   */
  ink?: string[];
  /** the icons of this theme (iconGenerator or `assets/icons/files`), without `_dark` */
  names: string[];
};

const FILE_TYPES_FOLDER = 'platform/icons/src/expui/fileTypes';

/**
 * Hand kept: change it and run `bun run sync:glyphs`, then `bun run sync:metrics`.
 * Left out on purpose: the icons that are not file types (`modified`, `scratch`, `contexts`…), an illustration
 * (`jenkins`), and logos the plugin icon already shows better as one glyph (`bazel`, `eclipse`).
 */
const JETBRAINS_GLYPHS: GlyphSource[] = [
  { icon: 'Csharp', names: ['csharp'] },
  { icon: 'actionScript', names: ['actionscript'] },
  // the icon of a file of no known type: the default file icon
  { icon: 'anyType', names: ['file'] },
  { icon: 'archive', names: ['archive'] },
  { icon: 'aspectJ', names: ['aspectj'] },
  { icon: 'binaryData', names: ['binary'] },
  { icon: 'c', names: ['c'] },
  { icon: 'config', names: ['preferences', 'pref'] },
  { icon: 'cpp', names: ['cpp'] },
  { icon: 'css', ink: ['white'], names: ['css'] },
  { icon: 'csv', names: ['csv'] },
  { icon: 'docker', names: ['docker'] },
  { icon: 'editorConfig', names: ['editorconfig'] },
  { icon: 'font', names: ['font'] },
  { icon: 'gitignore', names: ['git', 'gitignore'] },
  { icon: 'gradle', names: ['gradle'] },
  { icon: 'graphql', names: ['graphql'] },
  { icon: 'groovy', names: ['groovy'] },
  { icon: 'h', names: ['hh'] },
  { icon: 'html', names: ['html'] },
  { icon: 'http', names: ['http'] },
  { icon: 'i18n', names: ['i18n'] },
  { icon: 'idl', names: ['idl'] },
  // the IDE shows every picture with one icon
  { icon: 'image', names: ['image', 'png', 'jpg', 'gif', 'bmp', 'webp', 'icon'] },
  { icon: 'java', names: ['java'] },
  { icon: 'javaClass', names: ['class'] },
  { icon: 'javaScript', ink: ['#1E1F22'], names: ['js'] },
  { icon: 'json', names: ['json'] },
  { icon: 'jsonSchema', names: ['jsonschema'] },
  { icon: 'jsp', names: ['jsp'] },
  { icon: 'jupyter', names: ['jupyter', 'jupyternotebook'] },
  { icon: 'manifest', names: ['manifest', 'manifestfiles'] },
  { icon: 'markdown', names: ['markdown'] },
  { icon: 'microsoftWindows', names: ['windows'] },
  { icon: 'patch', names: ['patch', 'diff'] },
  { icon: 'perl', names: ['perl'] },
  { icon: 'regexp', names: ['regex'] },
  { icon: 'rst', names: ['rst'] },
  { icon: 'shell', names: ['shell'] },
  { icon: 'sourceMap', names: ['sourcemap'] },
  { icon: 'sql', names: ['sql'] },
  { icon: 'swiftLang', names: ['swift'] },
  { icon: 'terraform', names: ['terraform'] },
  { icon: 'text', names: ['text'] },
  { icon: 'toml', names: ['toml'] },
  { icon: 'typeScript', ink: ['white'], names: ['typeScript'] },
  { icon: 'vue', names: ['vue'] },
  { icon: 'wsdl', names: ['wsdl'] },
  { icon: 'xml', names: ['xml'] },
  { icon: 'xsd', names: ['xsd'] },
  { icon: 'yaml', names: ['yaml'] },
];

const NAMED_PAINTS: Record<string, string> = { black: '#000000', white: '#ffffff' };
const PAINT = /\b(fill|stroke)="(#[\dA-Fa-f]{6}|#[\dA-Fa-f]{3}|black|white)"/g;

/** `#abc`, `#AABBCC` or a color name as `#aabbcc` */
const toHex = (paint: string): string => {
  const hex = (NAMED_PAINTS[paint] ?? paint).toLowerCase();
  return hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
};

/** Under this luminance a paint of a New UI icon is the dark fill inside its lines, not a part of its shape */
const INNER_FILL = 0.1;

/** A paint that is a color, not the gray of a text or white */
const isColor = (paint: string): boolean => {
  const channels = [1, 3, 5].map((at) => Number.parseInt(paint.slice(at, at + 2), 16));
  const most = Math.max(...channels);
  return most > 0 && (most - Math.min(...channels)) / most > 0.15;
};

/**
 * A New UI icon as a glyph of one color, for the glass icon style: its lines and accents keep one paint, the color of
 * the icon, which the tile takes; the dark fills inside its lines are removed.
 * The icons are drawn with a color for their lines, a dark tint of it for their inside, and often the gray of a text
 * for a letter: the tile is the color, and everything that is not the inside is the glyph.
 * @param svg the icon, of the dark themes
 * @param ink the paints that are the glyph, when they are not every paint but the dark ones
 * @throws when the icon has no paint to give the tile
 */
const toGlyph = (svg: string, ink?: string[]): string => {
  const counts = new Map<string, number>();
  for (const match of svg.matchAll(PAINT)) {
    const paint = toHex(match[2]);
    counts.set(paint, (counts.get(paint) ?? 0) + 1);
  }

  // the color the icon uses the most; the gray of an icon without a color
  const shape = [...counts].filter(([paint]) => luminance(paint) > INNER_FILL && paint !== NAMED_PAINTS.white).sort((a, b) => b[1] - a[1]).map(([paint]) => paint);
  const tile = shape.find((paint) => isColor(paint)) ?? shape[0];
  if (!tile) throw new Error('A New UI icon without a paint for its tile');

  const glyph = ink && new Set(ink.map((paint) => toHex(paint)));
  const isGlyph = (paint: string) => (glyph ? glyph.has(paint) : luminance(paint) > INNER_FILL);
  return svg.replaceAll(PAINT, (_, kind: string, paint: string) => `${kind}="${isGlyph(toHex(paint)) ? tile : 'none'}"`);
};

/** What the Apache License asks of a changed file: where it comes from, and that it was changed */
const glyphNotice = (file: string): string =>
  `<!-- From JetBrains/intellij-community, ${FILE_TYPES_FOLDER}/${file}: Copyright 2000-2025 JetBrains s.r.o. and contributors, ` +
  'Apache License 2.0. Changed for Cool Theme Kit by `bun run sync:glyphs`: drawn with one color, the fills inside its lines removed. -->\n';

export { FILE_TYPES_FOLDER, glyphNotice, JETBRAINS_GLYPHS, toGlyph };
export type { GlyphSource };
