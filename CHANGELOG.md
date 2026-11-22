### Changelog

All notable changes to this project will be documented in this file. Dates are displayed in UTC.

#### Unreleased

- fix: with the TypeScript server built into VS Code, `this.options` of a readonly property has the text color, a
  readonly parameter of a constructor (a parameter property) the field color, and a method declaration the member
  color of WebStorm in Cool Islands Light: the general semantic rules (`property.readonly`, `method.declaration`) won
  over the ones of TypeScript and JavaScript. `bun run check:semantic` checks the colors of the TypeScript and
  JavaScript samples with the semantic tokens of a real VS Code.

- feat: F#, VB.NET, HLSL, ShaderLab, CoffeeScript, LaTeX and BibTeX get the colors PyCharm gives them with the same
  TextMate grammars as VS Code, and C the colors of CLion. Every TextMate language (Lua, Swift, PowerShell, Dart,
  Julia, Clojure, Objective-C, batch files…) is now compared character by character with a PyCharm without plugins.
- feat: Pug and Handlebars get the colors of the JetBrains plugins for them (a Pug class is a static field, every
  Handlebars identifier a keyword); JSONC, JSON Lines, XSL and `.gitignore` files are checked against the JSON, XML and
  ignore file colors of the IDE.
- fix: the `&` and `;` of an entity in an XML or HTML attribute value (`&gt;`) have the entity color, not the tag color.
- fix: in these languages the quotes of a string, the marker of a comment and the `\` of a LaTeX command have the text
  color, as in PyCharm, instead of the string, comment or keyword color.

#### 1.0.1 (2026-11-22)

Python compared character by character with PyCharm, the icons of the pickers, VS Code profiles that overwrote each
other's theme, and README images of today's extension.

- fix: Python colors compared character by character with a PyCharm 2026.3 without plugins (`test/colors/ide`): the
  prefix of a string (`f`, `r`, `u`) has the string color, the prefix and quotes of bytes the bytes color, the `0x`
  of a hex number is the number, a builtin used as a decorator (`@classmethod`, `@property`) is a decorator, and a
  raw string has the string color all through (PyCharm draws the regex of `re.compile` that way too). The color
  themes are written without indentation, a quarter less for VS Code to read.
- fix: the icon pack, arrow style and folder theme pickers show their own icons again. The font of these icons was
  made again upstream (2024) without updating their code points, so the pickers showed other icons (Angelscript for
  Angular, Pest for React); a test now checks each one against its name in the font.
- fix: VS Code profiles with other Cool Theme Kit settings no longer overwrite each other's theme in silence. All the
  profiles share the theme files of the extension, so a window of one profile generated them again over the theme of
  the other one at every start (icons and colors switching, a reload notice each time). The window that does it now
  names the settings in a notice, once per profile, and in the output channel each time; **Use This Profile's Settings
  in All Profiles** lists the theme settings in `workbench.settings.applyToAllProfiles` with the values of the current
  profile. Shared settings, workspace values and a change just made in the window are not counted. The README lists
  the settings to share by hand ("VS Code profiles").
- fix: the theme pickers say "Cool Theme Kit" next to Cool Icons, Cool Islands Icons and Cool Material Icons instead of
  their ids (`a-file-icon-vscode`, `a-file-icon-vscode-product-icon-theme`), and the settings of the kit no longer
  start with "A-file-icon-vscode:" when you browse them in the Settings editor. The ids stay, so your settings keep
  working; a search in the Settings editor still shows the key of each setting.
- docs: the README shows today's command palette and pickers instead of the 2023 images of Atom Material Icons
  (`bun run screenshots` captures them too).

#### 1.0.0 (2026-11-22)

The first stable release of Cool Theme Kit. Syntax colors compared character by character with WebStorm, PhpStorm, RubyMine and PyCharm, from the rich text the
IDEs copy; Ruby and PHP now follow RubyMine and PhpStorm.

- feat: Ruby and PHP look like RubyMine and PhpStorm (they followed the TextMate colors of PyCharm): constants and
  their declarations, symbols, parameters, local and instance variables, specific calls like `require`, method
  declarations; PHP variables, constants, calls, `{$…}` braces and keywords like `echo` and `null`.
- fix: colors compared character by character with WebStorm, PhpStorm, RubyMine and PyCharm 2026.3, from the rich
  text they copy (`bun run compare:ide`, captures in `test/colors/ide`). The schemes are now read in the order of the
  IDE (a key in the scheme and its base scheme, then its fallbacks): HTML attribute names, CSS property names and the
  properties separator have their gray, class names in Islands Light are black. CSS: the `.` of a class and the `:`
  of a pseudo-class are text, a unit is a string, `url()` and `var()` take the selector color. HTML and XML: the
  `=` of an attribute has the value color, a namespace prefix is purple, the CDATA markers are text. TypeScript and
  JavaScript: a property declaration is a field, a property access and a parameter are text, a local variable, a
  method declaration and a type parameter have the WebStorm colors, a regex literal has one color, `${…}` is code.

#### 0.2.0 (2026-11-21)

Syntax colors of the JetBrains IDE for many more languages, checked token by token against the IDE; named accent
colors with a live preview and more places to paint them; ready-made theme combinations. Nothing is applied by
installing: the accent and the combinations are chosen with their commands.

- feat: **Choose a Theme Combination (with Preview)** applies one of eight ready-made combinations (JetBrains Dark and
  Light, Material green, One Dark Pro / Dracula / Catppuccin Mocha syntax on the Islands frame, the GitHub Dark frame
  with the JetBrains syntax, vscode-icons for the other files), chosen in `docs/THEME_COMBINATIONS.md` by the contrast
  of the mixed syntax colors and the names an icon layer adds. Each one is shown as you move to it; the extensions a
  combination needs are installed only after you agree; **Undo the Last Theme Combination** puts the settings back.
  Also the first step of the walkthrough and a button of the Mix Themes page. Nothing is applied by installing.
- docs: `bun run screenshots -- --preset <id>|all` captures the combinations with their extensions installed into the
  temporary profile only; `bun run analyze:presets` prints the numbers of the research.
- feat: **Choose the Accent Color (with Preview)** lists named accents (the Islands blue and one accent per hue from
  the Material themes), a custom `#rrggbb` and the way back to the Islands blue. Each accent is shown at once while
  you move through the list or type, and Escape goes back. The Colors tab of the Mix Themes page shows it the same
  way, with named swatches and a `#rrggbb` field. The preview writes the changed colors for the moment into the
  `"[Cool Islands Dark]"`/`"[Cool Islands Light]"` blocks of `workbench.colorCustomizations` and takes them away again
  (on Escape, or on the next start once the theme files have the accent); your own values there are kept.
- feat: `accentTargets` paints more with the accent: `controls` (scrollbars, checkbox borders, badges, active search
  options), `tabs` (the line of the active tab, panel title and activity bar item) and `folders` (the folder icons,
  instead of `folderColor`). Empty by default; checkboxes on the Colors tab of the Mix Themes page.
- feat: syntax colors for the languages PyCharm draws with TextMate grammars (Ruby, PHP, Lua, Swift, PowerShell, Dart,
  Perl, R, Julia, Clojure, Objective-C, batch files, Makefiles, log files): the colors its TextMate plugin gives the
  scopes, layered like the IDE (a number is teal italic, a symbol or `nil` a purple italic constant, a variable text).
  Checked against PyCharm, with CSS (whole selectors in the tag color, property names as text, keyword values as
  strings, units as numbers), XML (namespace prefixes in the color of their name, CDATA), SQL (built-in functions
  italic, table names as text) and `.env` files (keys as keywords, values as strings, `export` as a comment).
- test: `bun run check:colors` checks 13 more samples (618 checks); an expectation can list the TextMate `layers` of a token.
- feat: syntax colors of the JetBrains IDE for C/C++, Go, Rust and C#, checked against CLion, GoLand and RustRover:
  function and method calls are text instead of the declaration blue (C++, Go, Rust), C++ member initializers are
  fields, macros have the annotation color and parameter types are class references; Go builtins use the `GO_*`
  colors of Islands Light; Rust doc comments, primitive types, attributes, `self` and lifetimes, and the semantic
  tokens of rust-analyzer; the XML tags of C# doc comments are doc markup. (Rider draws C# with its own palette: C#
  keeps the Islands defaults of the other languages.)
- feat: syntax colors of the JetBrains IDE for more languages, checked against PyCharm: Groovy (class names, package
  paths, map keys), reStructuredText (section headers, inline literals, references, directives), shell (builtins,
  function names, variables in strings take the string color, unquoted words and options are text, the shebang), TOML
  keys are keywords (with the TOML extension), the properties separator is text. An effect (underline, strikethrough)
  is drawn only with its color, like the IDE: no underline under properties keys and doc comment tags.
- fix: syntax colors closer to the JetBrains IDE (Cool Islands Dark and Light), checked against PyCharm: the
  delimiters of doc comments and the quotes of docstrings take the doc comment color, Java class names are no longer
  keyword-colored and the `@` of a Java annotation has the annotation color, TypeScript primitive types (`string`,
  `number`) are keywords, Markdown headers have the color of their level, YAML comments are doc comments and plain YAML
  values (numbers, `true`) are text, the name of a YAML anchor has the anchor color. The colors are looked up in the
  order of the IDE, with the fallbacks of its code (a few small changes in the light theme: method calls, labels).
- test: `bun run check:colors` compares the syntax colors with the JetBrains IDE, in CI: code samples are split into
  tokens with the grammars of a real VS Code, and each token must get the color the IDE gives its key (the scheme chain
  and the fallbacks of the IDE code). The differences still open are listed as known ones.

#### 0.1.1 (2026-11-21)

No change in the extension: the same as 0.1.0.

- ci: the release is published to the Marketplace with trusted publishing (GitHub OIDC), without a stored token
- fix: the open CodeQL alerts in the build scripts

#### 0.1.0 (2026-11-21)

The first version of `woogajjangka.cool-theme-kit`. The versions below it (1.0.0 to 1.3.0) were released as
`woogajjangka.cool-icon-vscode`.

The Marketplace still holds the name "Cool Theme Kit" for the removed extension, so this one is listed as
**Cool Theme Kit (JetBrains Look)** for now. Commands, settings and notifications say Cool Theme Kit.

- feat!: the extension id is now `woogajjangka.cool-theme-kit`, the name of the extension, and the repository is
  `WoogaJJangka/cool-theme-kit`. The old extension `woogajjangka.cool-icon-vscode` is removed from the Marketplace:
  install this one and uninstall the old one (Cool Theme Kit offers to when it finds it installed). The setting ids and
  theme ids do not change, so your settings still apply.
- feat: **Copy Diagnostics (for a Bug Report)** copies what a bug report needs (versions, the selected themes, the
  editor font, the other theme extensions, the settings changed from the defaults, with the home folder written `~`)
  and offers to open the bug report form. New issue forms: bug report, "Looks different from PyCharm" and idea, in
  English and Korean.

- feat!: the JetBrains fonts are opt-in. Installing the extension no longer changes `editor.fontFamily` and
  `markdown.preview.fontFamily` (they were `configurationDefaults`), so a user of the file icons alone keeps the font of
  VS Code. The **Use the JetBrains Fonts** command writes them to the user settings (asking before it replaces a font
  set there), **Stop Using the JetBrains Fonts** removes them, and selecting a Cool Islands color theme without an
  editor font of your own offers them once. If you used the fonts of an earlier version, accept that offer or run the
  command to keep them.
- feat: a **Get Started with Cool Theme Kit** walkthrough with a button for each part of the kit (file icons, color
  theme, product icons, fonts, mixing), each applied only when chosen.
- feat: the settings are grouped by kind in the Settings editor: File Icons, Color Themes, Product Icons, Fonts.
- docs: the README starts with screenshots of Cool Islands Dark and Light, the walkthrough and the Mix Themes page
  (`bun run screenshots` captures them again in an isolated VS Code), and lists what VS Code cannot do (rounded panels,
  colored product icons). The changelog of the original extension moved to `docs/CHANGELOG-upstream.md`.

#### 1.3.0 (2026-11-21)

- feat: a new logo for Cool Theme Kit: Islands panels layered over each other (a light theme, code colors, the file
  icons on the accent blue), in the Cool Islands palette, on a Cool Islands Dark Marketplace banner. `logo.png` is
  rendered from `logo.svg` by `bun run build:logo`
- fix: once a product icon theme had been mixed in, the icon theme was not regenerated any more (settings were ignored
  and an error was shown)
- fix: the files of another theme (icons, fonts, included color themes) are read only from inside its own extension,
  as VS Code does
- fix: in an untrusted folder (Restricted Mode), the file, folder and language icon associations of the folder's
  settings are ignored, since they may point to SVG files that would be copied into the icon theme; those of the user
  settings still apply
- fix: a Mix Themes sample pinned with `iconThemeByName` is found whatever the Unicode form of its name (Korean names
  on macOS)
- chore: the build and test tools are updated within their ranges, mocha 12, and puppeteer (used only by an unused
  screenshot script, removed) is gone: no high or critical advisory left. The smoke test's heap budget is 3 MB
- ci: checks for security (bundled dependency audit, CodeQL), compatibility (the smoke test next to other icon and
  color theme extensions, on Linux and Windows) and memory, described in `docs/MAINTENANCE.md`

#### 1.2.1 (2026-11-20)

- ci: the release workflow takes an exact `version` (greater than the latest release) instead of a patch/minor/major change
- fix: when the extension cannot write in its own folder (a system-wide install, a read-only folder), it says so once per
  version and keeps its default themes, instead of an error at every change of a setting. Other failures are still shown
- test: `bun run test:smoke [version]` starts a real VS Code with the extension (activation, Mix Themes page, regenerated
  icon and color themes); it passes on the lowest supported VS Code, 1.95.0, and on 1.147.0
- docs: a compatibility table in the README (desktop, VS Code for the Web, read-only installs)

- perf: a Mix Themes page that is not shown is no longer kept alive: VS Code drops the hidden page and loads it again when
  shown (its tab and scroll position come back), and a hidden page is not sent states to build any more
- perf: at every start the extension no longer parses the generated theme files (about 900 KB of json) to compare them with
  the settings: it reads a small `dist/.state.json` written beside them, and reads the theme files only when they are not
  the ones the state was written for
- perf: the installed color themes and product icon themes are no longer listed (a read of the manifest of every extension)
  when no theme is mixed in, and the list is kept until an extension is installed, updated or removed
- chore: the debug output of `i18next` is off; `COOL_THEME_KIT_MEMORY=1` makes the extension log the memory of its extension
  host and the time of its start and regeneration to its output channel (nothing is logged without it)

- feat: `accentColor` replaces the blue of Cool Islands Dark and Light (focus ring, buttons, links, active tab, selection),
  with a color picker and swatches on the Colors tab of the Mix Themes page. It wins over the color layers and loses to
  `colorThemeByKey`; the text on the accent stays readable (black or white when needed)
- feat: more language colors of the JetBrains color schemes in Cool Islands Dark/Light: regular expressions (every key of
  the IDE: classes, escapes, meta characters, brackets, group names, flags; plain characters are strings), JavaScript and
  TypeScript (regex literals, member functions, `console`/`window`/`Math`… in the globals color), XML (tags, names,
  namespace prefixes, prologue), HTML custom elements and the separator of properties files
- fix: the brackets of HTML tags have the color of the tag, as in the IDE (they had the plain text color in the dark theme)

#### 1.1.0 (2026-11-20)

- feat: **Cool Islands Icons** product icon theme: the JetBrains New UI icons (tool windows, tree arrows, editor and panel
  actions, find, problems, run and debug, source control, symbols), built into a font by `bun run build:product-icons`
- feat: mix other product icon themes into Cool Islands Icons: `productIconThemeLayers` (`fill` / `override` / `off`,
  Cool Material Icons included) and `productIconByName` (icon ids or globs), with a Product icons tab in the Mix Themes
  page and a reload notification
- perf: a settings change no longer blocks the extension host (and so every other extension) for 6 to 9 seconds while
  the icon theme is regenerated: unchanged icons are not written again, the regeneration waits for the end of a burst
  of events and ignores the settings of other extensions, and it runs after the activation (about 1.3 s now)
- fix: the icons written for a non-default opacity, saturation, folder color or monochrome color no longer pile up in
  the extension folder (a full copy of the icons for every settings change)
- feat: mix other installed color themes into Cool Islands: `colorThemeLayers` (`fill` / `override` / `off` for the
  workbench colors and the syntax colors separately, into the Cool Islands theme of the same kind or `applyTo`) and
  `colorThemeByKey` (single color ids or globs, `scope:` TextMate scopes and `semantic:` selectors from a theme). A
  notification offers to reload the window when the selected theme changes
- feat: the Mix Themes page has a Colors tab with a preview of the result, Cool Islands and each mixed theme; new
  command Mix Color Themes (with Preview)
- feat: the extension is now **Cool Theme Kit**: a JetBrains (PyCharm New UI) style base theme for VS Code, with other
  installed themes layered on top. The file icon theme is **Cool Icons** and the product icon theme **Cool Material
  Icons** in the pickers; their ids, the extension id and the settings do not change
- feat: **Cool Islands Dark** and **Cool Islands Light** color themes, generated from the JetBrains Islands themes
  and color schemes (with the PyCharm colors for Python), `bun run sync:colors`
- feat: JetBrains fonts as defaults for the settings you leave empty: `editor.fontFamily` (JetBrains Mono, then D2Coding
  and the Korean system fonts) and `markdown.preview.fontFamily` (Inter, then the Korean system fonts), with a one-time
  notification to download the missing fonts (`showFontMessage`)
- fix: Korean file and folder names typed in their decomposed Unicode form (NFD) now match in the associations and
  `iconThemeByName`; the Mix Icon Themes page uses Korean fallback fonts and breaks Korean lines between words
- fix: the Polish, Portuguese, Russian and Chinese command titles started with a stray "vuex"
- fix: Korean messages use the right particles after the theme names
- feat: mix other installed icon themes (`iconThemeLayers`: `fill` the names this theme does not know or `override`
  its icons, for files and folders separately; `iconThemeByName`: one name from a given theme). By default the
  Material Icon Theme, when installed, fills the names this theme does not know
- feat: the icons follow the JetBrains plugin: every file and folder name it knows gets the icon PyCharm shows
  (`CONTRIBUTING.md`, `Jenkinsfile`, `index.php`, `setup.cfg`, `.devcontainer`...), in dark and light themes
- feat: default icon packs are the JetBrains defaults (Angular 2 instead of AngularJS, Nest, Next, NgRx, Recoil, Redux)
- fix: file names and extensions are written in lower case, as VS Code reads them (a light theme kept a replaced icon)
- feat: `pycharm` icon pack (on by default): Python files use the two-tone Python icon of PyCharm
- feat: Tests icon pack (on by default) and CSS icon pack (off by default) from the JetBrains plugin
- feat: monochrome icons (`monochrome`, `monochromeColor`) with toggle and color commands
- feat: `hideFileIcons` setting
- feat: custom SVG files in `filesAssociations` / `foldersAssociations`
- feat: `presentation` folders use the views icon (#65)
- feat: icons and associations synced from the JetBrains plugin (`bun run sync:upstream`, weekly CI)
- fix: settings changes rebuild the theme from all the settings (#74, #71, #70)
- fix: theme files are written atomically (#67) and generation errors are shown (#73)
- fix: commands write to the user settings when no folder is opened (#73)
- fix: an active icon pack replaces the base icon in light themes too
- fix: language icons that no file association used had no icon (bower, gruntfile, gulpfile, jupyter...)
- fix: light themes use the plain icon instead of the `_dark` variant made for dark backgrounds
- fix: icons pointing to missing svgs (image2/3, archive2/3, empty, profile, skeleton, zod folders, plastic open folder)
- feat: custom SVG files in `languagesAssociations`, language ids keep their case
- note: test icons now come from the `tests` pack. If you set `activeIconPacks` yourself, add `"tests"` to keep them.

The changelog of the original extension (Atom Material Icons, before the fork) is in
[docs/CHANGELOG-upstream.md](docs/CHANGELOG-upstream.md).
