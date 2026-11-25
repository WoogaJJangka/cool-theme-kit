# Third-party notices

This extension is an unofficial fork of
[AtomMaterialUI/a-file-icon-vscode](https://github.com/AtomMaterialUI/a-file-icon-vscode). It is not affiliated with or
endorsed by the original authors, JetBrains, or the owners of any logo shown in the icons.

The sections up to "Themes you mix" are about what is in the extension package. The last section is about code that is
only in the repository (build and check scripts).

## Code and icons from the original project

- `a-file-icon-vscode` — MIT, Copyright (c) 2023 Elior "Mallowigi" Boukhobza and Philipp "PKief" Kief
  (see [LICENSE.md](./LICENSE.md)). The implementation is based on
  [Material Icon Theme](https://github.com/PKief/vscode-material-icon-theme) (MIT).
- `iconGenerator` (the icon SVGs in `iconGenerator/assets/icons`) — MIT, Copyright (c) 2017-2019 Elior Boukhobza
  (<https://github.com/AtomMaterialUI/iconGenerator>). The full text is in `iconGenerator/LICENSE`.
- The Cool Material Icons product icon font (`productIcons/a-file-icon-vscode.woff`) is made from the same
  `iconGenerator` SVGs by the original project's `src/scripts/icons/webfont.ts`.

## Sources the original icons credit

The `iconGenerator` project credits the following sources for its icons. Each keeps its own license; see the linked
projects for the exact terms (for example, the icons of Font Awesome 4.7 are glyphs of its font, which is SIL OFL 1.1;
its CSS is MIT).

- [Atom File Icons](https://github.com/file-icons/atom) and [File-Icons](https://github.com/file-icons/source)
- [Sublime Text A File Icon](https://github.com/SublimeText/AFileIcon) (credited for the idea and icons)
- [Font Awesome 4.7.0](https://fontawesome.com/v4.7/license/)
- [MFixx](https://github.com/file-icons/MFixx), [Devicons](https://github.com/file-icons/DevOpicons)
- [Octicons](https://primer.style/foundations/icons)
- [Material Design Icons](https://pictogrammers.com/library/mdi/)

## Extension logo

`logo.svg` and `logo.png` were drawn for this fork and are covered by the MIT license of this repository
(the original project's atom logo is not used).

## Icons added by this fork

- `assets/icons/files/pycharm-python*.svg` — from
  [JetBrains/intellij-community](https://github.com/JetBrains/intellij-community), Apache License 2.0,
  Copyright 2000-2024 JetBrains s.r.o. and contributors. See [assets/icons/NOTICE.md](./assets/icons/NOTICE.md) and
  [assets/icons/LICENSE-APACHE-2.0.txt](./assets/icons/LICENSE-APACHE-2.0.txt).
- `assets/icons/glass/files/*.svg` (the glyphs of the glass icon style for the file types the JetBrains IDEs have
  their own icon for) — the New UI file type icons of
  [JetBrains/intellij-community](https://github.com/JetBrains/intellij-community) (`platform/icons/src/expui/fileTypes`),
  at the commit given in `themes/jetbrains-source.json`, Apache License 2.0, Copyright 2000-2025 JetBrains s.r.o. and
  contributors. The icons were changed, as the first line of each file says: drawn with one color, the fills inside
  their lines removed, by `src/scripts/icons/syncJetbrainsGlyphs.ts`. See
  [assets/icons/NOTICE.md](./assets/icons/NOTICE.md).
- `productIcons/cool-islands-icons.woff` (Cool Islands Icons) — a font made from the New UI icons of
  [JetBrains/intellij-community](https://github.com/JetBrains/intellij-community) (`platform/icons/src/expui` and the
  terminal plugin), at the commit given in `themes/jetbrains-source.json`, Apache License 2.0, Copyright 2000-2026
  JetBrains s.r.o. and contributors. The icons were changed: traced into one-color glyphs by
  `src/scripts/productIcons/buildJetbrainsFont.ts`.

## Colors from the JetBrains IDEs

The color themes (`themes/cool-islands-*.base.json` and the `dist/cool-islands-*-color-theme.json` made from them) are
derived from these sources, at the commit given in `themes/jetbrains-source.json`. The colors were converted to the
VS Code color theme format by `src/scripts/themes/syncJetbrainsColors.ts`, with the rules of
`src/themes/jetbrainsTokenMap.ts`, `src/themes/textMateTheme.ts` and `src/themes/jetbrainsFallbacks.ts`.

- [JetBrains/intellij-community](https://github.com/JetBrains/intellij-community) — Apache License 2.0,
  Copyright 2000-2026 JetBrains s.r.o. and contributors; the license text is in
  [assets/icons/LICENSE-APACHE-2.0.txt](./assets/icons/LICENSE-APACHE-2.0.txt) and its `NOTICE.txt` is quoted in
  [assets/icons/NOTICE.md](./assets/icons/NOTICE.md):
  - the Islands, Dark, Light, Darcula and IntelliJ UI themes and editor color schemes (`platform/platform-resources`);
  - the color schemes of the Python, Markdown, YAML, shell, XML, Groovy, reStructuredText and Kotlin plugins;
  - the colors the TextMate plugin gives the scopes of TextMate grammars (`plugins/textmate`: `TextMateDefaultColorsProvider`,
    `TextMateTheme`);
  - the attribute keys and their fallbacks in the highlighters (`DefaultLanguageHighlighterColors`, `PyHighlighter`,
    `RegExpHighlighter`, `XmlHighlighterColors`, `PropertiesHighlighter`, the `env-files-support` plugin and the other
    files named in `src/themes/jetbrainsFallbacks.ts`).
- [JetBrains/intellij-plugins](https://github.com/JetBrains/intellij-plugins) — Apache License 2.0: the attribute keys
  and fallbacks of the Pug (`JadeHighlighter`) and Handlebars (`HbHighlighter`) highlighters.
- [intellij-rust/intellij-rust](https://github.com/intellij-rust/intellij-rust) — MIT: the names of the Rust attribute
  keys (`RsColors.kt`). No code or colors are taken from it.

### Colors read from the IDEs

The colors that closed plugins give Ruby, PHP, JavaScript/TypeScript and CSS are not in intellij-community. They were
read from the rich text that RubyMine, PhpStorm and WebStorm 2026.3 copy of this repository's own samples
(`src/themes/capturedAttributes.ts`, the captures are in `test/colors/ide`). Only color values were taken: no file,
code or icon of these IDEs is part of the extension.

<!-- bundled-packages:start: generated by `bun run sync:notices` from the bundled packages, do not edit -->
## npm packages in the extension code

The bundled code of the extension (`dist/extension.js`) contains these npm packages. The extension package has no
`node_modules` folder, so their license texts are here.

| Package | License |
|---|---|
| [fs-extra](https://www.npmjs.com/package/fs-extra) | MIT |
| [graceful-fs](https://www.npmjs.com/package/graceful-fs) | BlueOak-1.0.0 |
| [i18next](https://www.npmjs.com/package/i18next) | MIT |
| [jsonfile](https://www.npmjs.com/package/jsonfile) | MIT |
| [lodash.merge](https://www.npmjs.com/package/lodash.merge) | MIT |
| [universalify](https://www.npmjs.com/package/universalify) | MIT |

### fs-extra

```text
(The MIT License)

Copyright (c) 2011-2024 JP Richardson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
(the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify,
 merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### graceful-fs

```text
# Blue Oak Model License

Version 1.0.0

## Purpose

This license gives everyone as much permission to work with
this software as possible, while protecting contributors
from liability.

## Acceptance

In order to receive this license, you must agree to its
rules.  The rules of this license are both obligations
under that agreement and conditions to your license.
You must not do anything with this software that triggers
a rule that you cannot or will not follow.

## Copyright

Each contributor licenses you to do everything with this
software that would otherwise infringe that contributor's
copyright in it.

## Notices

You must ensure that everyone who gets a copy of
any part of this software from you, with or without
changes, also gets the text of this license or a link to
<https://blueoakcouncil.org/license/1.0.0>.

## Excuse

If anyone notifies you in writing that you have not
complied with [Notices](#notices), you can keep your
license by taking all practical steps to comply within 30
days after the notice.  If you do not do so, your license
ends immediately.

## Patent

Each contributor licenses you to do everything with this
software that would otherwise infringe any patent claims
they can license or become able to license.

## Reliability

No contributor can revoke this license.

## No Liability

***As far as the law allows, this software comes as is,
without any warranty or condition, and no contributor
will be liable to anyone for any damages related to this
software or this license, under any kind of legal claim.***
```

### i18next

```text
The MIT License (MIT)

Copyright (c) 2025 i18next

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### jsonfile

```text
(The MIT License)

Copyright (c) 2012-2015, JP Richardson <jprichardson@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
(the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify,
 merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### lodash.merge

```text
Copyright OpenJS Foundation and other contributors <https://openjsf.org/>

Based on Underscore.js, copyright Jeremy Ashkenas,
DocumentCloud and Investigative Reporters & Editors <http://underscorejs.org/>

This software consists of voluntary contributions made by many
individuals. For exact contribution history, see the revision history
available at https://github.com/lodash/lodash

The following license applies to all parts of this software except as
documented below:

====

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

====

Copyright and related rights for sample code are waived via CC0. Sample
code is defined as all source code displayed within the prose of the
documentation.

CC0: http://creativecommons.org/publicdomain/zero/1.0/

====

Files located in the node_modules and vendor directories are externally
maintained libraries used by this software which have their own
licenses; we recommend you read them, as their terms may differ from the
terms above.
```

### universalify

```text
(The MIT License)

Copyright (c) 2017, Ryan Zimmerman <opensrc@ryanzim.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the 'Software'), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
<!-- bundled-packages:end -->

## Themes you mix

Mixing themes reads the icon, color and product icon themes you have installed and copies their icons and fonts into
this extension's folder on your own computer, and their colors into the color themes it writes there. Those stay under
the license of their own theme and are not part of this package.

## Trademarks

Product names, logos and brands (Angular, React, Vue, Python, and so on) are the property of their respective owners.
They appear only to identify file and folder types. JetBrains, IntelliJ, PyCharm, WebStorm, PhpStorm and RubyMine are
trademarks of JetBrains s.r.o.; Visual Studio Code is a trademark of Microsoft Corporation. This extension is not made
or endorsed by them.

## Code in the repository only

These are used by the build and check scripts and are not in the extension package.

- `src/themes/semanticTokens.ts` (`bun run check:semantic`) is a port of parts of
  [microsoft/vscode](https://github.com/microsoft/vscode) (`tokenClassificationRegistry.ts`, `colorThemeData.ts`,
  `semanticTokensProviderStyling.ts`, named in the file).
- `build/web-extension.webpack.config.js` comes from the web extension template of Visual Studio Code.

Both are under the MIT License of Microsoft:

```text
MIT License

Copyright (c) 2015 - present Microsoft Corporation

All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`bun run check:colors` and `check:semantic` download Visual Studio Code and use its built-in grammars and TypeScript
server while they run; nothing of it is stored in the repository.
