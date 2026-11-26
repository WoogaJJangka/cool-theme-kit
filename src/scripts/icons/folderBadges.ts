/**
 * The folder icons this fork adds to those of the JetBrains icon plugin (iconGenerator), for common folder names the
 * plugin has no icon for: `.claude`, `cpp`, `experiments`, `homework`… Each is drawn like the folders of the plugin,
 * with what the plugin already draws: its folder shape in a color, and the shape of one of its file icons (or of a
 * JetBrains New UI glyph) as the badge. Nothing is drawn by hand.
 *
 * `bun run sync:folders` writes them to `assets/icons/folders/<name>.svg` and `assets/icons/foldersOpen/<name>.svg`
 * (generated, do not edit). The folder names that get them are in `src/icons/folders/*.ts`, like any folder icon.
 */

/** A folder icon of this fork */
type FolderBadge = {
  /** the color of the folder */
  color: string;
  /** the file icon whose shape is the badge, without `.svg` */
  glyph: string;
  /**
   * where the shape comes from: the file icons of the plugin (`files`, the default), or the JetBrains New UI glyphs
   * of the glass style (`glass`, `assets/icons/glass/files`), when its letters read better in a badge (C#)
   */
  from?: 'files' | 'glass';
  /** the name of the icon: `<name>.svg` */
  name: string;
};

/** Hand kept: change it and run `bun run sync:folders`, then `bun run sync:metrics` */
const FOLDER_BADGES: FolderBadge[] = [
  // languages, next to the `java`, `kotlin`, `python`, `go` and `rust` folders of the plugin
  { color: '#5C6BC0', glyph: 'c', name: 'c' },
  { color: '#7E57C2', glyph: 'cpp', name: 'cpp' },
  { color: '#43A047', from: 'glass', glyph: 'csharp', name: 'csharp' },
  { color: '#F4511E', from: 'glass', glyph: 'swift', name: 'swift' },
  // the folder of Claude Code in a project
  { color: '#D97757', glyph: 'claude', name: 'claude' },
  // trials that are not tests: experiments, labs
  { color: '#AB47BC', glyph: 'test', name: 'lab' },
  // what is being learned: homework, lectures, exercises
  { color: '#26A69A', glyph: 'bookmark', name: 'study' },
  // slides and presentations
  { color: '#42A5F5', glyph: 'keynote', name: 'slides' },
];

export { FOLDER_BADGES };
export type { FolderBadge };
