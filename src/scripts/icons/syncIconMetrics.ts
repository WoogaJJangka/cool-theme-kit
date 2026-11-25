/**
 * Writes `assets/icons/metrics.json`: what the glass icon style needs to know about each bundled icon
 * (see ./iconMetrics.ts). Run it after the icons change (the iconGenerator submodule, `assets/icons`):
 * `test/unit/glassIcons.test.ts` fails when the file is behind.
 *
 * Usage: bun run sync:metrics [-- <another file>]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toEntry } from 'src/icons/glass/glassIcons';

import { measureFile, measureFolder, measureGlyph } from './iconMetrics';

import type { IconMetric, IconMetrics, MetricEntry } from 'src/icons/glass/glassIcons';

const root = join(__dirname, '..', '..', '..');

/** The folders of the bundled icons: the fork's own icons replace those of iconGenerator with the same name */
const iconFolders = (repository: string) => ({
  files: [join(repository, 'iconGenerator', 'assets', 'icons', 'files'), join(repository, 'assets', 'icons', 'files')],
  folders: [join(repository, 'iconGenerator', 'assets', 'icons', 'folders')],
  foldersOpen: [join(repository, 'iconGenerator', 'assets', 'icons', 'foldersOpen')],
  // the JetBrains New UI glyphs the glass style draws instead of the file icon of the same name
  glyphs: [join(repository, 'assets', 'icons', 'glass', 'files')],
});

const METRICS_FILE = join('assets', 'icons', 'metrics.json');

const measureAll = (folders: string[], measure: (svg: string, name: string) => IconMetric | undefined): Record<string, MetricEntry> => {
  const entries = new Map<string, MetricEntry>();
  for (const folder of folders.filter((path) => existsSync(path))) {
    for (const file of readdirSync(folder).filter((name) => name.endsWith('.svg'))) {
      const name = file.slice(0, -'.svg'.length);
      const metric = measure(readFileSync(join(folder, file), 'utf8'), name);
      if (metric) entries.set(name, toEntry(metric));
    }
  }
  return Object.fromEntries([...entries].sort(([a], [b]) => (a < b ? -1 : 1)));
};

const measureIcons = (repository: string): IconMetrics => {
  const folders = iconFolders(repository);
  return {
    files: measureAll(folders.files, measureFile),
    folders: measureAll(folders.folders, measureFolder),
    foldersOpen: measureAll(folders.foldersOpen, measureFolder),
    glyphs: measureAll(folders.glyphs, measureGlyph),
  };
};

/** One icon a line: a changed icon is one changed line */
const formatMetrics = (metrics: IconMetrics): string => {
  const groups = Object.entries(metrics).map(([group, entries]) => {
    const lines = Object.entries(entries).map(([name, entry]) => `    ${JSON.stringify(name)}: ${JSON.stringify(entry)}`);
    return `  ${JSON.stringify(group)}: {\n${lines.join(',\n')}\n  }`;
  });
  return `{\n${groups.join(',\n')}\n}\n`;
};

if (require.main === module) {
  const metrics = measureIcons(root);
  // another file to look at the measures without replacing them
  writeFileSync(process.argv[2] ?? join(root, METRICS_FILE), formatMetrics(metrics));
  const holes = Object.values(metrics.files).filter((entry) => entry.includes('h')).length;
  console.log(
    `${METRICS_FILE}: ${Object.keys(metrics.files).length} file icons (${holes} with holes), ` +
      `${Object.keys(metrics.folders).length} + ${Object.keys(metrics.foldersOpen).length} folder badges, ` +
      `${Object.keys(metrics.glyphs).length} New UI glyphs`,
  );
}

export {
  formatMetrics,
  iconFolders,
  measureIcons,
  METRICS_FILE,
};
