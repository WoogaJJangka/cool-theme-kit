/**
 * Runs inside the VS Code started by `run.js`: opens each sample, waits for the semantic tokens of its language server
 * (the TypeScript server needs a few seconds to start) and writes them with their legend.
 */
const { writeFileSync } = require('node:fs');
const vscode = require('vscode');

const TIMEOUT = 120_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tokensOf = async (uri) => {
  const end = Date.now() + TIMEOUT;
  for (;;) {
    const legend = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokensLegend', uri);
    const tokens = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', uri);
    if (legend && tokens && tokens.data.length > 0) return { data: Array.from(tokens.data), legend: { tokenModifiers: legend.tokenModifiers, tokenTypes: legend.tokenTypes } };
    if (Date.now() > end) throw new Error(`No semantic tokens for ${uri.fsPath} after ${TIMEOUT / 1000} s`);
    await sleep(1000);
  }
};

const run = async () => {
  const files = JSON.parse(process.env.SEMANTIC_FILES ?? '[]');
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (!folder) throw new Error('No sample folder open');
  const result = { vscode: vscode.version, files: {} };
  for (const file of files) {
    const uri = vscode.Uri.joinPath(folder, file);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    result.files[file] = { language: document.languageId, ...(await tokensOf(uri)) };
  }
  writeFileSync(process.env.SEMANTIC_OUTPUT, JSON.stringify(result, null, 2));
};

module.exports = { run };
