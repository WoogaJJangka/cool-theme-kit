/**
 * The semantic tokens the language servers built into VS Code give the samples of test/colors (the TypeScript server
 * for TypeScript and JavaScript), for `bun run check:semantic` (src/scripts/themes/checkSemantic.ts).
 * Starts a real VS Code (downloaded into .vscode-test like the smoke tests) with an empty profile and no other
 * extension, opens each sample and writes the tokens and their legend to a json file.
 *
 * Usage: dumpSemanticTokens({ version, files, output }) from the check, or
 *        node test/semantic/run.js <version> <output.json> <sample> [<sample>...]
 */
const { downloadAndUnzipVSCode, runTests } = require('@vscode/test-electron');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const root = join(__dirname, '..', '..');

const dumpSemanticTokens = async ({ files, output, version }) => {
  const work = mkdtempSync(join(tmpdir(), 'ctk-semantic-'));
  try {
    const cachePath = process.env.VSCODE_TEST_CACHE ?? join(root, '.vscode-test');
    const vscodeExecutablePath = await downloadAndUnzipVSCode({ cachePath, version });
    await runTests({
      extensionDevelopmentPath: join(__dirname, 'extension'),
      extensionTestsEnv: { SEMANTIC_FILES: JSON.stringify(files), SEMANTIC_OUTPUT: output },
      extensionTestsPath: join(__dirname, 'dump.js'),
      launchArgs: [
        join(root, 'test', 'colors'),
        '--disable-extensions',
        '--disable-workspace-trust',
        `--user-data-dir=${join(work, 'user')}`,
        `--extensions-dir=${join(work, 'extensions')}`,
      ],
      vscodeExecutablePath,
    });
    return vscodeExecutablePath;
  } finally {
    rmSync(work, { force: true, maxRetries: 5, recursive: true });
  }
};

if (require.main === module) {
  const [version, output, ...files] = process.argv.slice(2);
  dumpSemanticTokens({ files, output, version }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { dumpSemanticTokens };
