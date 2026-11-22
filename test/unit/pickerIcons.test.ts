import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getIconPacks } from 'src/helpers/iconPacks';

const root = join(__dirname, '..', '..');
const read = <T>(file: string) => JSON.parse(readFileSync(join(root, file), 'utf8')) as T;

type FontIcon = { default: { fontCharacter: string; fontPath: string }; description: string };
const FONT_PATH = './productIcons/a-file-icon-vscode.woff';

/**
 * The icons of the pickers (`$(atom-…)`: icon packs, folder themes, arrow styles) are glyphs of
 * productIcons/a-file-icon-vscode.woff, given in package.json by their code point. `bun run webfont` numbers the glyphs
 * in order, so a new icon moves the code points after it: the font was made again upstream (2024) without them, and the
 * pickers showed other icons (Angelscript for Angular, Pest for React). The glyph of each icon, by its name in
 * productIcons/a-file-icon-vscode-product-icon-theme.json (written with the font):
 */
const PICKER_GLYPHS: Record<string, string> = {
  'atom-angular': 'file_angular',
  'atom-angular2': 'file_angular2',
  'atom-arrows-arrows': 'arrow-arrow-right',
  'atom-arrows-material': 'arrow-material-right',
  'atom-arrows-plusMinus': 'arrow-plusminus-right',
  'atom-arrows-triangles': 'arrow-triangle-right',
  'atom-folder-classic': 'folder_folder',
  'atom-folder-specific': 'folder-open_folder',
  'atom-nest': 'file_nest',
  'atom-next': 'file_nextjs',
  'atom-ngrx': 'file_ngrxjs',
  // the font is one color: the dark variants have the same shapes
  'atom-phalcon': 'file_phalcon_dark',
  'atom-rails': 'file_rails',
  'atom-react': 'file_react',
  'atom-recoil': 'file_recoil',
  'atom-redux': 'file_redux-action',
  'atom-volt': 'file_volt_dark',
  'atom-vue': 'file_vue',
  'atom-vuex': 'file_vuex',
};

describe('the icons of the pickers', () => {
  const icons = read<{ contributes: { icons: Record<string, FontIcon> } }>('package.json').contributes.icons;
  const glyphs = read<{ iconDefinitions: Record<string, { fontCharacter: string }> }>(
    'productIcons/a-file-icon-vscode-product-icon-theme.json'
  ).iconDefinitions;

  it('are the glyphs of their names in the font', () => {
    assert.deepEqual(Object.keys(icons).sort(), Object.keys(PICKER_GLYPHS).sort());
    for (const [id, glyph] of Object.entries(PICKER_GLYPHS)) {
      assert.ok(glyphs[glyph], `${glyph} is not in the font`);
      assert.equal(icons[id].default.fontPath, FONT_PATH, id);
      assert.equal(icons[id].default.fontCharacter, glyphs[glyph].fontCharacter, `${id}: the code point of ${glyph}`);
    }
  });

  it('are given to the icon packs', () => {
    for (const pack of getIconPacks()) {
      const id = /^\$\((atom-[^)]+)\)$/.exec(pack.icon ?? '')?.[1];
      if (id) assert.ok(icons[id], `${pack.title}: ${id} is not in package.json`);
    }
  });
});
