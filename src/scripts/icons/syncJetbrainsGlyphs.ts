/**
 * Downloads the JetBrains New UI file type icons of `./jetbrainsGlyphs.ts` (JetBrains/intellij-community, Apache
 * License 2.0) at the commit pinned in `themes/jetbrains-source.json`, and writes them as the glyphs of the glass icon
 * style: `assets/icons/glass/files/<icon of this theme>.svg`, one color each. Run `bun run sync:metrics` afterwards.
 *
 * Usage: bun run sync:glyphs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkedCommit } from 'src/scripts/jetbrainsSource';

import { FILE_TYPES_FOLDER, glyphNotice, JETBRAINS_GLYPHS, toGlyph } from './jetbrainsGlyphs';

const root = join(__dirname, '..', '..', '..');
const REPOSITORY = 'JetBrains/intellij-community';
const GLYPHS_FOLDER = join(root, 'assets', 'icons', 'glass', 'files');
/** Where the icons of this theme are: a glyph is written for the names that exist, and for their `_dark` variant */
const ICON_FOLDERS = [join(root, 'iconGenerator', 'assets', 'icons', 'files'), join(root, 'assets', 'icons', 'files')];

const hasIcon = (name: string) => ICON_FOLDERS.some((folder) => existsSync(join(folder, `${name}.svg`)));

/** The icon of the dark themes; a few icons have one variant for every theme */
const download = async (commit: string, icon: string): Promise<{ file: string; svg: string }> => {
  for (const file of [`${icon}_dark.svg`, `${icon}.svg`]) {
    const response = await fetch(`https://raw.githubusercontent.com/${REPOSITORY}/${commit}/${FILE_TYPES_FOLDER}/${file}`);
    if (response.ok) return { file, svg: await response.text() };
    if (response.status !== 404) throw new Error(`${file}: HTTP ${response.status}`);
  }
  throw new Error(`${icon}: no such icon in ${FILE_TYPES_FOLDER}`);
};

const main = async () => {
  const source = JSON.parse(readFileSync(join(root, 'themes', 'jetbrains-source.json'), 'utf8')) as { commit: unknown };
  const commit = checkedCommit(source.commit);
  console.log(`${REPOSITORY}@${commit}`);
  mkdirSync(GLYPHS_FOLDER, { recursive: true });

  const written = new Set<string>();
  for (const { icon, ink, names } of JETBRAINS_GLYPHS) {
    const { file, svg } = await download(commit, icon);
    const glyph = glyphNotice(file) + toGlyph(svg, ink);

    for (const name of names) {
      if (!hasIcon(name)) throw new Error(`${icon}: this theme has no icon ${name}`);
      // an icon with a variant for the dark themes is two files: the same glyph for both
      for (const target of [name, `${name}_dark`].filter((item) => hasIcon(item))) {
        if (written.has(`${target}.svg`)) throw new Error(`${target}: two New UI icons for one icon`);
        writeFileSync(join(GLYPHS_FOLDER, `${target}.svg`), glyph);
        written.add(`${target}.svg`);
      }
    }
  }

  // the glyphs of the names taken out of the table
  for (const file of readdirSync(GLYPHS_FOLDER).filter((item) => !written.has(item))) rmSync(join(GLYPHS_FOLDER, file));
  console.log(`assets/icons/glass/files: ${written.size} glyphs from ${JETBRAINS_GLYPHS.length} New UI icons`);
};

// ts-node runs it as CommonJS, without top-level await
// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
