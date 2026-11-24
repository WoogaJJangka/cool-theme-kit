/**
 * The npm packages that reach the users: only the bundles ship in the VSIX (`vsce package --no-dependencies`), so the
 * packages esbuild puts into dist/extension.js and dist/web/extension.js are the shipped ones.
 * Used by `audit:shipped` (their advisories) and `check:notices` (their licenses).
 */
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..', '..');
// bun resolves a bare `esbuild` to the esbuild.js of the root (tsconfig baseUrl is "."): load the package itself
const esbuild = require(join(root, 'node_modules', 'esbuild'));

/** The entry points of the two bundles of the VSIX */
const ENTRY_POINTS = ['src/extension.ts', 'src/web/extension.ts'];

/**
 * The packages bundled into an entry point: name -> version -> folder of that copy
 * @returns {Map<string, Map<string, string>>}
 */
const bundledPackagesOf = (entryPoint) => {
  const result = esbuild.buildSync({
    absWorkingDir: root,
    bundle: true,
    entryPoints: [entryPoint],
    external: ['vscode'],
    format: 'cjs',
    logLevel: 'silent',
    metafile: true,
    outfile: join(root, 'out', 'audit', 'bundle.js'),
    platform: entryPoint.includes('web') ? 'browser' : 'node',
    write: false,
  });

  /** @type {Map<string, Map<string, string>>} */
  const packages = new Map();
  // the paths of the metafile use / on every platform
  for (const input of Object.keys(result.metafile.inputs)) {
    const parts = input.split('/');
    const index = parts.lastIndexOf('node_modules');
    if (index === -1) continue;
    const name = parts[index + 1].startsWith('@') ? `${parts[index + 1]}/${parts[index + 2]}` : parts[index + 1];
    const folder = join(root, ...parts.slice(0, index + 1), ...name.split('/'));
    const manifest = join(folder, 'package.json');
    const version = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')).version : '';
    if (!packages.has(name)) packages.set(name, new Map());
    packages.get(name).set(version ?? '', folder);
  }
  return packages;
};

/**
 * The packages of both bundles: name -> version -> folder
 * @returns {Map<string, Map<string, string>>}
 */
const bundledPackages = () => {
  const shipped = new Map();
  for (const entry of ENTRY_POINTS) {
    for (const [name, copies] of bundledPackagesOf(entry)) {
      if (!shipped.has(name)) shipped.set(name, new Map());
      for (const [version, folder] of copies) shipped.get(name).set(version, folder);
    }
  }
  return shipped;
};

module.exports = { bundledPackages, root };
