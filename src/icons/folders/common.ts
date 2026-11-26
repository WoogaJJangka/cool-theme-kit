/**
 * Common folder names the JetBrains icon plugin has no icon for, which showed the plain folder. Hand kept, applied
 * like the other hand-written associations: if the plugin learns one of these names, its icon wins
 * (`bun run sync:upstream`). The names this theme gives another icon than the plugin on purpose are in
 * `src/icons/exceptions.ts`.
 *
 * The icons `c`, `cpp`, `csharp`, `swift`, `claude`, `lab`, `study` and `slides` are this fork's
 * (src/scripts/icons/folderBadges.ts); the others are the folder icons of the plugin.
 */
export const commonFolders = [
  {
    // machine learning, next to `ai`
    folderNames: ['embeddings', 'genai', 'llm', 'llms', 'ml', 'nlp', 'rag'],
    name: 'ai',
  },
  {
    folderNames: ['attic', 'legacy', 'obsolete', 'old'],
    name: 'archive',
  },
  {
    folderNames: ['backtest', 'backtesting', 'backtests', 'bench'],
    name: 'benchmark',
  },
  {
    folderNames: ['crawl', 'crawler', 'crawlers', 'scraper', 'scrapers', 'scraping', 'spiders'],
    name: 'bot',
  },
  {
    folderNames: ['c'],
    name: 'c',
  },
  {
    folderNames: ['billing', 'checkout', 'invoices', 'payment', 'payments'],
    name: 'cart',
  },
  {
    folderNames: [
      'analysis',
      'dashboard',
      'dashboards',
      'finance',
      'market',
      'monitoring',
      'plot',
      'plots',
      'result',
      'results',
      'statistics',
      'stats',
      'tracking',
      'trading',
    ],
    name: 'charts',
  },
  {
    folderNames: ['cd'],
    name: 'ci',
  },
  {
    folderNames: ['.claude', 'claude'],
    name: 'claude',
  },
  {
    // Unity
    folderNames: ['prefabs'],
    name: 'components',
  },
  {
    folderNames: ['projectsettings', 'usersettings'],
    name: 'config',
  },
  {
    folderNames: ['net', 'network', 'networking', 'socket', 'sockets', 'websocket', 'websockets', 'ws'],
    name: 'connection',
  },
  {
    folderNames: ['c++', 'cpp', 'cxx'],
    name: 'cpp',
  },
  {
    folderNames: ['cs', 'csharp'],
    name: 'csharp',
  },
  {
    folderNames: ['clean', 'cleaned', 'dataset', 'datasets', 'processed'],
    name: 'db',
  },
  {
    folderNames: ['obj'],
    name: 'dist',
  },
  {
    folderNames: ['guide', 'guides', 'handbook', 'manual', 'manuals', 'papers', 'reference', 'references', 'refs', 'wiki'],
    name: 'docs',
  },
  {
    folderNames: ['interim', 'raw'],
    name: 'dump',
  },
  {
    folderNames: ['listeners', 'observers', 'subscribers'],
    name: 'events',
  },
  {
    // game art
    folderNames: ['art-src', 'artwork', 'materials', 'sprites', 'spritesheets', 'textures', 'tiles', 'tilesets'],
    name: 'images',
  },
  {
    folderNames: ['worker', 'workers'],
    name: 'job',
  },
  {
    folderNames: ['crypto', 'login', 'signin', 'signup'],
    name: 'keys',
  },
  {
    // trials that are not tests
    folderNames: ['experiment', 'experiments', 'lab', 'labs', 'mlruns', 'runs', 'sweeps', 'trials'],
    name: 'lab',
  },
  {
    folderNames: ['3rdparty', 'third-party', 'third_party', 'thirdparty'],
    name: 'lib',
  },
  {
    folderNames: ['levels', 'stages', 'tilemaps', 'worlds'],
    name: 'maps',
  },
  {
    // competitive programming, next to `algorithms`
    folderNames: ['atcoder', 'baekjoon', 'boj', 'challenges', 'codeforces', 'ds', 'leetcode', 'physics', 'problems', 'programmers'],
    name: 'math',
  },
  {
    folderNames: ['__mocks__'],
    name: 'mocks',
  },
  {
    folderNames: ['dtos'],
    name: 'models',
  },
  {
    folderNames: ['inventory', 'items'],
    name: 'packages',
  },
  {
    folderNames: ['etl', 'ingest', 'ingestion'],
    name: 'pipe',
  },
  {
    // discord.py
    folderNames: ['cogs'],
    name: 'plugin',
  },
  {
    folderNames: ['grpc'],
    name: 'protobuf',
  },
  {
    // what Python tools write next to `__pycache__`
    folderNames: ['.eggs', '.ipynb_checkpoints', '.mypy_cache', '.nox', '.ruff_cache', '.tox', 'site-packages'],
    name: 'python',
  },
  {
    folderNames: ['search'],
    name: 'queries',
  },
  {
    folderNames: ['draft', 'drafts', 'experimental', 'meetings', 'minutes', 'playground', 'playgrounds', 'sandbox', 'wip'],
    name: 'scratch',
  },
  {
    folderNames: ['scenes'],
    name: 'screens',
  },
  {
    // capture the flag
    folderNames: ['ctf', 'exploit', 'exploits', 'forensics', 'payloads', 'pwn', 'rev', 'reversing', 'wordlists'],
    name: 'security',
  },
  {
    folderNames: ['nginx'],
    name: 'server',
  },
  {
    folderNames: ['render', 'renderer', 'rendering'],
    name: 'shader',
  },
  {
    folderNames: ['deck', 'decks', 'ppt', 'presentation', 'presentations', 'slide', 'slides'],
    name: 'slides',
  },
  {
    folderNames: ['checkpoint', 'checkpoints', 'ckpt', 'snapshot', 'snapshots', 'weights'],
    name: 'storage',
  },
  {
    // what is being learned
    folderNames: [
      'answers',
      'assignment',
      'assignments',
      'course',
      'courses',
      'exam',
      'exams',
      'exercise',
      'exercises',
      'homework',
      'lecture',
      'lectures',
      'lesson',
      'lessons',
      'practice',
      'quiz',
      'quizzes',
      'solutions',
      'study',
    ],
    name: 'study',
  },
  {
    folderNames: ['swift'],
    name: 'swift',
  },
  {
    folderNames: ['backlog', 'issues', 'plan', 'plans'],
    name: 'tasks',
  },
  {
    folderNames: ['testing'],
    name: 'tests',
  },
  {
    // Unity
    folderNames: ['editor'],
    name: 'tools',
  },
  {
    folderNames: ['characters', 'enemies', 'npcs', 'player', 'players'],
    name: 'users',
  },
];
