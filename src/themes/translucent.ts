/**
 * VS Code draws the editor highlights (the word under the caret, search results, folded ranges, the matching bracket)
 * above the selection, and asks for colors that are not opaque ("must not be opaque so as to not hide underlying
 * decorations"). The IDE draws the selection above them, so its colors are opaque: copied as they are, a highlighted word
 * hides how much of it is selected (fork issue #91). Each of these colors becomes the most transparent color that looks the
 * same on the editor background: unselected text looks like the IDE, and the selection shows through like in the IDE.
 */
const TRANSLUCENT_COLORS = [
  'editor.selectionHighlightBackground',
  'editor.wordHighlightBackground',
  'editor.wordHighlightStrongBackground',
  'editor.wordHighlightTextBackground',
  'editor.symbolHighlightBackground',
  'editor.hoverHighlightBackground',
  'editor.findMatchHighlightBackground',
  'editor.findRangeHighlightBackground',
  'editor.rangeHighlightBackground',
  'editor.foldBackground',
  // Not in the list of VS Code, but drawn the same way (its default is translucent)
  'editorBracketMatch.background',
];

const OPAQUE = /^#[\da-f]{6}$/i;

const channels = (color: string) => [1, 3, 5].map((start) => Number.parseInt(color.slice(start, start + 2), 16));

/**
 * The color with the smallest alpha that, drawn on `background`, gives `color` again (8-bit channels, as the browser
 * blends). A color that already has an alpha, or a background that is not an opaque color, is kept.
 */
const translucentOver = (color: string, background: string): string => {
  if (!OPAQUE.test(color) || !OPAQUE.test(background)) return color;
  const target = channels(color);
  const under = channels(background);
  for (let alpha = 1; alpha < 255; alpha++) {
    const a = alpha / 255;
    const over = target.map((value, index) => Math.round((value - (1 - a) * under[index]) / a));
    const fits = over.every((value, index) => value >= 0 && value <= 255 && Math.round(a * value + (1 - a) * under[index]) === target[index]);
    if (fits) return `#${[...over, alpha].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  }
  return color.toLowerCase();
};

/** `colors` with the highlight colors made translucent on its editor background */
const withTranslucentHighlights = (colors: Record<string, string>): Record<string, string> => {
  const background = colors['editor.background'];
  if (!background) return colors;
  const result = { ...colors };
  for (const id of TRANSLUCENT_COLORS) {
    if (result[id]) result[id] = translucentOver(result[id], background);
  }
  return result;
};

export { TRANSLUCENT_COLORS, translucentOver, withTranslucentHighlights };
