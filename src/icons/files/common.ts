/**
 * Common file names the JetBrains icon plugin has no icon of their own for in VS Code: it matches them with a pattern
 * VS Code cannot express (`.env.*`), or only knows their extension (`secrets.json` is a JSON file), or does not know
 * them, and they showed the icon of their extension or the plain file.
 * Hand kept, applied after the associations generated from the plugin: `bun run sync:upstream` takes the icon the
 * plugin gives the extension of a name for the icon of that name, and would replace these.
 * test/unit/jetbrainsParity.test.ts fails when the plugin gives one of these names an icon of its own: the name then
 * follows the plugin (take it out), or moves to the names this theme gives another icon than the plugin on purpose,
 * `src/icons/exceptions.ts`. The marks of `main.py`, `__init__.py`… are in `src/icons/roles.ts`.
 */
export const commonFiles = [
  {
    fileNames: ['conda.yaml', 'conda.yml', 'environment.yaml', 'environment.yml'],
    name: 'conda',
  },
  {
    fileNames: ['dockerfile.dev', 'dockerfile.prod', 'dockerfile.test'],
    name: 'docker',
  },
  {
    fileNames: [
      'compose.dev.yaml',
      'compose.override.yaml',
      'compose.override.yml',
      'compose.prod.yaml',
      'docker-compose.dev.yml',
      'docker-compose.override.yaml',
      'docker-compose.override.yml',
      'docker-compose.prod.yml',
      'docker-compose.test.yml',
    ],
    name: 'dockercompose',
  },
  {
    // `.env.local`, `.env.example`…: the kinds of `.env` file, which are extensions for VS Code
    fileExtensions: [
      'env.ci',
      'env.defaults',
      'env.development',
      'env.development.local',
      'env.dist',
      'env.docker',
      'env.example',
      'env.local',
      'env.local.example',
      'env.production',
      'env.production.local',
      'env.sample',
      'env.staging',
      'env.template',
      'env.test.local',
    ],
    name: 'envs',
  },
  {
    // the plugin knows the name, VS Code had no entry for it
    fileNames: ['known_hosts'],
    name: 'hosts',
  },
  {
    // SSH keys
    fileNames: ['authorized_keys', 'id_dsa', 'id_ecdsa', 'id_ed25519', 'id_rsa'],
    name: 'key',
  },
  {
    fileNames: [
      'license-apache',
      'license-mit',
      'notice',
      'notice.md',
      'notice.txt',
      'third-party-notices.md',
      'third-party-notices.txt',
      'third_party_notices.md',
    ],
    name: 'license',
  },
  {
    // Model Context Protocol servers of a project
    fileNames: ['.mcp.json', 'mcp.json'],
    name: 'mcp',
  },
  {
    fileNames: ['note.md', 'note.txt', 'notes.md', 'notes.txt'],
    name: 'note',
  },
  {
    fileNames: [
      'constraints.txt',
      'dev-requirements.txt',
      'requirements-dev.txt',
      'requirements-docs.txt',
      'requirements-prod.txt',
      'requirements-test.txt',
      'requirements_dev.txt',
      'requirements_test.txt',
    ],
    name: 'pypi',
  },
  {
    fileNames: ['credentials.json', 'credentials.yaml', 'credentials.yml', 'secrets.json', 'secrets.toml', 'secrets.yaml', 'secrets.yml', 'token.json'],
    name: 'secret',
  },
];
