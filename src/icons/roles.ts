/**
 * The file names that say what a file is in its project, whatever its language (the `roleMarks` setting): the file a
 * program starts with, the file that makes a folder a package, tests, settings. Such a file keeps the icon of its
 * language (`main.py` is still a Python file) and gets the mark of its role over the corner of that icon, the way the
 * JetBrains IDEs mark a runnable class or a test class (src/icons/glass/glassIcons.ts draws it).
 *
 * A name gets a mark only when it has no icon of its own: `manage.py` is the Django icon without the pycharm pack,
 * `test.js` the icon of a JavaScript test, and they keep it (FileJsonGenerator).
 */
import type { IconRole } from 'src/icons/glass/glassIcons';

type RoleNames = {
  /** the names, in lower case (VS Code compares the names of an icon theme in lower case) */
  fileNames: string[];
  role: IconRole;
};

/**
 * Hand kept. Only exact names: an icon theme has no pattern for `test_*.py` or `*_test.go`.
 * A name of a language this theme has no icon for is left without a mark.
 */
const ROLE_NAMES: RoleNames[] = [
  {
    // where a program starts
    fileNames: [
      // Python
      '__main__.py',
      'app.py',
      'asgi.py',
      'bot.py',
      'cli.py',
      'main.py',
      'manage.py',
      'run.py',
      'server.py',
      'start.py',
      'wsgi.py',
      // C, C++, Objective-C, assembly
      'main.asm',
      'main.c',
      'main.cc',
      'main.cpp',
      'main.cxx',
      'main.m',
      'main.mm',
      // the JVM, .NET
      'app.java',
      'app.kt',
      'app.scala',
      'application.java',
      'application.kt',
      'main.cs',
      'main.java',
      'main.kt',
      'main.scala',
      'program.cs',
      'program.fs',
      // the root of a React app made with Vite (`main.js` and `main.ts` have the Node.js icon)
      'main.jsx',
      'main.tsx',
      // other languages
      'app.rb',
      'main.cr',
      'main.dart',
      'main.ex',
      'main.gd',
      'main.go',
      'main.hs',
      'main.jl',
      'main.lua',
      'main.nim',
      'main.php',
      'main.pl',
      'main.r',
      'main.rb',
      'main.rs',
      'main.swift',
      'main.zig',
      // the root module of a Terraform configuration
      'main.tf',
      // scripts
      'main.ps1',
      'main.sh',
      'run.bat',
      'run.ps1',
      'run.sh',
      'start.bat',
      'start.ps1',
      'start.sh',
    ],
    role: 'run',
  },
  {
    // what makes a folder a package or a module
    fileNames: [
      '__init__.py',
      '__init__.pyi',
      'doc.go',
      'init.lua',
      'lib.rs',
      'mod.rs',
      'mod.ts',
      'module-info.java',
      'package-info.java',
    ],
    role: 'package',
  },
  {
    // tests, and what they share
    fileNames: [
      'conftest.py',
      'main_test.go',
      'runtests.jl',
      'test.c',
      'test.cc',
      'test.cpp',
      'test.cs',
      'test.dart',
      'test.ex',
      'test.exs',
      'test.go',
      'test.java',
      'test.jl',
      'test.kt',
      'test.lua',
      'test.php',
      'test.ps1',
      'test.py',
      'test.r',
      'test.rb',
      'test.rs',
      'test.sh',
      'test.swift',
      'test_helper.exs',
      'test_helper.rb',
      'tests.cpp',
      'tests.cs',
      'tests.java',
      'tests.kt',
      'tests.py',
      'tests.rs',
      'tests.swift',
    ],
    role: 'test',
  },
  {
    // settings and constants
    fileNames: [
      'conf.py',
      'config.cjs',
      'config.cs',
      'config.dart',
      'config.ex',
      'config.exs',
      'config.go',
      'config.h',
      'config.hpp',
      'config.java',
      'config.js',
      'config.kt',
      'config.lua',
      'config.mjs',
      'config.php',
      'config.ps1',
      'config.py',
      'config.rb',
      'config.rs',
      'config.sh',
      'config.swift',
      'config.ts',
      'configuration.py',
      'constants.cs',
      'constants.dart',
      'constants.go',
      'constants.java',
      'constants.js',
      'constants.kt',
      'constants.php',
      'constants.py',
      'constants.rs',
      'constants.swift',
      'constants.ts',
      'consts.py',
      'consts.rs',
      'local_settings.py',
      'settings.cs',
      'settings.js',
      'settings.lua',
      'settings.php',
      'settings.py',
      'settings.ts',
      'setup.py',
    ],
    role: 'config',
  },
];

/** The icons with a mark are files of their own, named after the role and the icon under the mark */
const ROLE_ICON_PREFIX = 'role-';

/** `run`, `go` -> `role-run-go`: the name of the icon of a role over a file icon (with its `_dark` when it has one) */
const roleIconName = (role: IconRole, icon: string): string => `${ROLE_ICON_PREFIX}${role}-${icon}`;

export { ROLE_ICON_PREFIX, ROLE_NAMES, roleIconName };
export type { RoleNames };
