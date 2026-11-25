# Third-party icons

Icons in this folder that do not come from `iconGenerator` (the Atom Material Icons set, MIT).

| File | Source | License |
|---|---|---|
| `files/pycharm-python.svg`, `files/pycharm-python_dark.svg` | [JetBrains/intellij-community](https://github.com/JetBrains/intellij-community) `python/python-parser/resources/icons/com/jetbrains/python/parser/expui/python.svg` and `python_dark.svg` (commit `89d58ee436`) | Apache License 2.0, Copyright 2000-2024 JetBrains s.r.o. and contributors |

| `glass/files/*.svg` | [JetBrains/intellij-community](https://github.com/JetBrains/intellij-community) `platform/icons/src/expui/fileTypes`, the icons listed in `src/scripts/icons/jetbrainsGlyphs.ts` (the commit of `themes/jetbrains-source.json`) | Apache License 2.0, Copyright 2000-2025 JetBrains s.r.o. and contributors |

The files of `files/` are unmodified copies. The files of `glass/files/` are changed copies, written by
`bun run sync:glyphs`: each is drawn with one color (the color of the icon for the dark themes) and the fills inside
its lines are removed, to make the glyph the glass icon style puts on a tile. Their first line says so.
A copy of the Apache License 2.0 is in
[LICENSE-APACHE-2.0.txt](./LICENSE-APACHE-2.0.txt) (also at <https://www.apache.org/licenses/LICENSE-2.0>).
The `NOTICE.txt` of intellij-community at that commit reads:

```
This software includes code from IntelliJ IDEA Community Edition
Copyright (C) JetBrains s.r.o.
https://www.jetbrains.com/idea/
```
`_dark` is the variant for dark themes, as for the other icons of this extension.
