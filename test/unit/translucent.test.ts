import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COLOR_THEMES, THEMES_FOLDER } from 'src/themes/colorThemes';
import { TRANSLUCENT_COLORS, translucentOver, withTranslucentHighlights } from 'src/themes/translucent';

const root = join(__dirname, '..', '..');

const channels = (color: string) => [1, 3, 5, 7].map((start) => Number.parseInt(color.slice(start, start + 2) || 'ff', 16));
/** `color` drawn on the opaque `background`, as the browser blends */
const blend = (color: string, background: string) => {
  const [r, g, b, alpha] = channels(color);
  const under = channels(background);
  const a = alpha / 255;
  return `#${[r, g, b].map((value, index) => Math.round(a * value + (1 - a) * under[index]).toString(16).padStart(2, '0')).join('')}`;
};

describe('translucent highlight colors', () => {
  it('looks the same on the editor background, with the smallest alpha', () => {
    for (const [color, background] of [
      ['#373b39', '#191a1c'],
      ['#402f33', '#191a1c'],
      ['#114957', '#191a1c'],
      ['#edebfc', '#ffffff'],
      ['#fcd47e', '#ffffff'],
      ['#93d9d9', '#ffffff'],
    ]) {
      const translucent = translucentOver(color, background);
      assert.match(translucent, /^#[\da-f]{8}$/, color);
      assert.equal(blend(translucent, background), color, color);
      const alpha = channels(translucent)[3];
      assert.ok(alpha < 255, color);
      // one step more transparent no longer gives the color back
      const less = `${translucent.slice(0, 7)}${(alpha - 1).toString(16).padStart(2, '0')}`;
      assert.notEqual(blend(less, background), color, color);
    }
  });

  it('lets the selection show through a highlighted word (#91)', () => {
    const word = translucentOver('#373b39', '#191a1c');
    const selection = '#214283';
    const [r, g, b] = channels(blend(word, selection));
    // still blue, not the gray of the highlight
    assert.ok(b - r > 60 && b - g > 30, blend(word, selection));
  });

  it('keeps colors with an alpha and other colors', () => {
    assert.equal(translucentOver('#37373980', '#191a1c'), '#37373980');
    assert.equal(translucentOver('#373b39', '#191a1c80'), '#373b39');
    const colors = { 'editor.background': '#191a1c', 'editor.selectionBackground': '#214283', 'editor.wordHighlightBackground': '#373b39' };
    const result = withTranslucentHighlights(colors);
    assert.equal(result['editor.selectionBackground'], '#214283');
    assert.notEqual(result['editor.wordHighlightBackground'], '#373b39');
    assert.equal(colors['editor.wordHighlightBackground'], '#373b39');
  });

  it('is applied to the generated Cool Islands themes', () => {
    for (const theme of COLOR_THEMES) {
      const colors: Record<string, string> = JSON.parse(readFileSync(join(root, THEMES_FOLDER, theme.base), 'utf8')).colors;
      const present = TRANSLUCENT_COLORS.filter((id) => colors[id]);
      assert.ok(present.includes('editor.wordHighlightBackground'), theme.base);
      for (const id of present) assert.match(colors[id], /^#[\da-f]{6}(?!ff)[\da-f]{2}$/, `${theme.base}: ${id} must not be opaque, run \`bun run sync:colors\``);
      // VS Code draws it under the word highlight on the occurrences of a selected word: the IDE draws only the word highlight
      assert.equal(colors['editor.selectionHighlightBackground'], '#00000000', theme.base);
    }
  });
});
