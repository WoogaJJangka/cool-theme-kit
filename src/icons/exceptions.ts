/**
 * The names this theme gives another icon than the JetBrains icon plugin, on purpose (user decision, 2026-11-26).
 * Everywhere else the plugin decides (`bun run sync:upstream`, test/unit/jetbrainsParity.test.ts).
 *
 * The plugin gives some everyday names the icon of one tool that uses them: a `state` folder is Redux, `charts` is
 * Helm, `config.yaml` is GitHub Actions. In most projects the name means the everyday thing, and the icon says
 * something false. Only names like these are here: common, and plainly about something else than the tool.
 * Applied after the associations generated from the plugin, so they win; the parity test checks each one still
 * differs from the plugin (an exception the plugin caught up with is removed).
 */

/** Folder names, with the icon of the plugin they replace */
export const folderExceptions = [
  {
    // the plugin: `helm` (Helm charts)
    folderNames: ['chart', 'charts'],
    name: 'charts',
  },
  {
    // the plugin: `dump`
    folderNames: ['data'],
    name: 'db',
  },
  {
    // the plugin: `exclude` (a folder left out of the project), while `out` and `dist` are `dist`
    folderNames: ['output', 'outputs'],
    name: 'dist',
  },
  {
    // the plugin: `home`
    folderNames: ['tutorial', 'tutorials'],
    name: 'docs',
  },
  {
    // the plugin: `graphql` (GraphQL schemas): also the schemas of a database, of pydantic, of JSON
    folderNames: ['schema', 'schemas'],
    name: 'models',
  },
  {
    // the plugin: `redux-stores` (the store of Redux): also saved state, and what a program stores
    folderNames: ['state', 'states', 'store', 'stores'],
    name: 'storage',
  },
];

/** File names, with the icon of the plugin they replace */
export const fileExceptions = [
  {
    // the plugin: `publisher` (Microsoft Publisher, `*.pub`): the public half of an SSH key
    fileNames: ['id_dsa.pub', 'id_ecdsa.pub', 'id_ed25519.pub', 'id_rsa.pub'],
    name: 'key',
  },
  {
    // the plugin: `hugo` (the configuration of a Hugo site): the configuration of anything
    fileNames: ['config.toml'],
    name: 'toml',
  },
  {
    // the plugin: `githubActions` (`.github/ISSUE_TEMPLATE/config.yml`): the configuration of anything
    fileNames: ['config.yaml', 'config.yml'],
    name: 'yaml',
  },
];
