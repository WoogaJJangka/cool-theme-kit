# cool-theme-kit — Claude Code 작업 메모

`AtomMaterialUI/a-file-icon-vscode`(VS Code용 Atom Material Icons, 2025-01 이후 방치)의 포크. 마켓 표시 이름 "Cool Theme Kit"("Cool Theme" 은 Marketplace 에 이미 있어 게시가 거부돼 2026-11-20 바꿈)
(확장 ID `woogajjangka.cool-theme-kit`, 0.1.0(2026-11-21, 새 식별자의 첫 버전)부터. 그 전(1.0.0~1.3.0) `woogajjangka.cool-icon-vscode` 는 Marketplace 에서 지웠고,
둘 다 설치돼 있으면 `services/OldExtensionService` 가 옛 것을 지우라고 권한다. 저장소도 같은 날 `WoogaJJangka/cool-theme-kit` 으로 바꿈).
- 이름 규칙: 확장·명령 분류·설정 제목·알림 = "Cool Theme Kit"(단 `package.json` `displayName` 은 임시로 "Cool Theme Kit (JetBrains Look)":
  Marketplace 가 지운 옛 확장의 표시 이름 "Cool Theme Kit" 을 계속 잡고 있어 2026-11-21 0.1.0 게시가 네 번 거부됨. 풀리면 되돌린다), 파일 아이콘 테마 = "Cool Icons", 색 = "Cool Islands Dark/Light",
  제품 아이콘 = "Cool Islands Icons"(id `cool-islands-product-icons`)·"Cool Material Icons". 테마 id·설정 id 는 바꾸지 않는다(사용자 설정이 가리킴).
  단 파일 아이콘 테마는 2026-11-22 부터 겹치지 않는 id `cool-theme-kit-icons`(`ICON_THEME_ID`, 우리가 고를 때 쓰는 것)를 더 갖는다: 옛 id
  `a-file-icon-vscode` 는 원본 Atom Material Icons 도 기여해서 둘 다 설치되면 VS Code 가 원본을 고른다. 섞기에서 `a-file-icon-vscode` = 원본
  (`docs/MAINTENANCE.md` 2장 규칙 11, `test/unit/atomMaterialIcons.test.ts`).
  제품 아이콘 Cool Material Icons 도 같은 이유로 새 id `cool-material-product-icons`(`MATERIAL_PRODUCT_THEME_ID`)를 갖는다(옛 id
  `a-file-icon-vscode-product-icon-theme` = 원본 "Atom Material Icons"). 섞기에서 옛 id 는 원본이 있으면 원본, 없으면 우리 것
  (`productIconLayers.findProductTheme` 으로만 찾는다).
  그래서 옛 id 가 화면에 나오지 않게 한다: 테마 선택 목록은 `description`("Cool Theme Kit")이 없으면 id 를 보여 주고, 설정 화면은
  설정 묶음 `id`(`a-file-icon-vscode.<종류>`)가 없으면 이름 앞에 "A-file-icon-vscode:" 를 붙인다(검색 결과·`@ext:` 에서는 VS Code 가 늘 붙임).
  `test/unit/packageIdentity.test.ts` 가 지킨다. 한국어 조사는 읽는 소리 기준: "Cool Theme Kit이/과", "Cool Icons가/와".

## 방향 (2026-11-19 전면 수정)
- **JetBrains(PyCharm New UI, Islands) 모양의 기본 테마 묶음**을 VS Code 에 준다: 파일 아이콘(지금 것), 색 테마
  (Islands Dark/Light), 제품 아이콘(New UI), 폰트 기본값. 기준은 사용자 PyCharm 화면이다.
- VS Code 는 종류마다 테마를 하나만 고를 수 있다 → **JetBrains 기본 위에 다른 설치된 테마를 우선순위·예외로 얹는다**
  (파일 아이콘의 `iconThemeLayers`·`iconThemeByName` 과 같은 규칙을 색·제품 아이콘에도). 섞은 결과는 테마 파일을 다시
  써서 반영하고, VS Code 가 다시 읽지 않는 것(색·제품 아이콘)은 창 다시 로드를 권한다.
- **아이콘 모양은 유리 스타일이 기본(2026-11-25 사용자 결정)**: 어떤 이름에 어떤 아이콘이 붙는지는 계속 JetBrains(PyCharm + Atom
  Material Icons)를 따르고(`jetbrainsParity.test.ts`), 그리는 방식만 바꾼다. 파일 = 같은 둥근 타일 위의 글리프, 폴더 = 같은 둥근
  폴더(종류별 색 유지) + 배지 글리프. 예전 평면 모양은 `iconStyle: "flat"` 로 남긴다.
  **JetBrains 형태가 기본이라는 것을 잊지 않는다(사용자가 같은 날 다시 강조)**: 글리프를 새로 그리거나 다른 그림으로 바꾸지 않는다.
  글리프의 출처는 ① JetBrains 가 직접 그린 New UI 파일 아이콘이 있는 종류는 그 모양과 색(사용자 선택 "New UI 모양 우선"),
  ② 없는 종류는 JetBrains 아이콘 플러그인(Atom Material Icons) 모양. 다듬는다는 것은 이 둘 안에서 고르고 크기를 맞추는 일이다. 사용자 기준: 심플·모던 최우선, 16px 에서
  무너지는 입체 표현은 쓰지 않음(그래서 그라데이션 + 위쪽 하이라이트 한 줄만 — 진짜 굴절·투명은 이 크기에서 안 보인다), 둥글고
  투명한 유리 느낌, 모든 아이콘의 통일감, 의미가 바로 보일 것.
- **묶음이지만 opt-in(2026-11-21 사용자 결정)**: 설치만으로는 아무것도 바꾸지 않고, 사용자가 고른 것만 적용한다. 아이콘만 쓰는
  사람의 글꼴·색을 건드리지 않는다. Get Started 안내(`contributes.walkthroughs`)에 부분마다 버튼(`useTheme` 명령, `useJetBrainsFonts`).
- 폰트: JetBrains 글꼴(JetBrains Mono, Markdown 미리보기는 Inter) + 한글 대체 글꼴을 사용자가 고를 때만 사용자 설정에 쓴다
  (`configurationDefaults` 는 쓰지 않는다, `fonts.test.ts`). VS Code 화면(UI) 글꼴은 확장이 못 바꾼다.
- 한국어 호환이 중요하다: 사용자 글꼴 `'Roboto Mono', 'D2Coding', monospace` 로 한글 이름·주석·화면 문구가 깨지지 않는지 확인.
- 단계별 로드맵은 포크 이슈 #19~#23, 진행 상황은 메모리(`project-status`).

## 환경 (Node·bun 은 conda env)
- conda env `cool-theme-kit` = Node 24 + bun 1.4 (`environment.yml`, 2026-11-21 `a-file-icon-vscode` 에서 이름 바꿈, 폴더도 `D:\dev\projects\cool-theme-kit` 으로 옮김). 이 PC 에는 시스템 Node 가 없다.
  새 PC: `conda env create -f environment.yml`, 바뀌면 `conda env update -f environment.yml --prune`.
- 프로필 없이 도는 셸(Claude Code)에서는 env 를 PATH 앞에 붙여 쓴다. node.exe 는 env 루트, bun.exe 는 `Library\bin`:
  - Git Bash: `E=/c/Users/siwon/miniconda3/envs/cool-theme-kit; export PATH="$E:$E/Library/bin:$PATH"`
  - PowerShell: `conda run -n cool-theme-kit --no-capture-output bun run build`
- 처음 한 번: `git submodule update --init` → `bun install`.
  잠금 파일은 텍스트 `bun.lock`(2026-11-19 `bun.lockb` 에서 변환, Dependabot `bun` 이 읽는 형식).
- `conda.bat` 인자에 `>=` 를 쓰면 cmd 가 리다이렉트로 읽어 파일이 생긴다. 버전 조건은 `=` 로 쓴다.

## 명령
| 목적 | 명령 |
|---|---|
| 빌드 (webpack dev + 테마 json 생성) | `bun run build` |
| 단위 테스트 (빌드된 `dist` 필요) | `bun run test:unit` (`-- <파일 이름 일부>` 로 골라 돌림) |
| 실제 VS Code 스모크 (빌드 필요, VS Code 를 `.vscode-test` 에 받음) | `bun run test:smoke -- 1.95.0` / `bun run test:smoke` (stable) / `-- stable --with-extensions` (다른 테마 확장과 함께) |
| README 스크린샷 다시 찍기 (격리 VS Code, `docs/screenshots/`, 기본 섞기 층 Material Icon Theme 을 받아 설치) | `bun run screenshots -- --vsix <경로>.vsix` (`--vsix` 없으면 개발 모드라 제목 줄에 표시가 남음) |
| 단위 테스트 + 커버리지 (`coverage/lcov.info`, Sonar CI 분석용) | `bun run test:coverage` |
| 배포 의존성 감사 (번들에 든 패키지의 high/critical 만 실패) | `bun run audit:shipped` |
| 번들 패키지 라이선스 전문 확인 / 다시 쓰기 (`THIRD-PARTY-NOTICES.md` 의 생성 부분) | `bun run check:notices` / `bun run sync:notices` |
| 크기 예산 (번들·테마 json·VSIX, `vsce package` 뒤) | `bun run check:size <경로>.vsix` |
| 프리셋 조사 수치(대비·아이콘 fill 수, 확장은 `.vscode-test/preset-extensions` 에 격리 설치) / 프리셋 화면 | `bun run analyze:presets` / `bun run screenshots -- --preset <id>` (`all` 은 전부) |
| 유지보수 점검 보고서 (GitHub·SonarQube MCP, 읽기 전용, 설정은 `docs/MAINTENANCE.md` 7장) | Claude Code 에서 `/maintenance-check [PR 번호] [--local]` |
| lint (`vsce package` 가 먼저 돌림, 0 errors 유지) | `bun run lint` |
| JetBrains 연결 규칙 동기화 | `bun run sync:upstream` |
| 유리 스타일의 JetBrains New UI 글리프 받기 (`assets/icons/glass/files`, 대응표를 고치거나 고정 커밋이 바뀌면. 뒤에 `sync:metrics`) | `bun run sync:glyphs` |
| 유리 스타일용 아이콘 측정값 다시 쓰기 (`assets/icons/metrics.json`, 아이콘 SVG 가 바뀌면) | `bun run sync:metrics` |
| 전체 아이콘을 16px·32px 시트로 그려 눈으로 검토 (무너지는 글리프 찾기) | `bun run sheet:icons` (`-- --flat` 평면, `--light`, `--only <이름,이름…>`, `--group files\|folders\|foldersOpen`. 그림은 `out/icon-sheets/<glass\|flat>-<dark\|light>/`) |
| JetBrains 색 테마 동기화 (고정 커밋 / 최신) | `bun run sync:colors` / `bun run sync:colors -- --latest` |
| 문법 색을 JetBrains 와 비교 (실제 VS Code 문법으로 `test/colors` 샘플을 토큰으로 나눔, `.vscode-test` 에 받음) | `bun run check:colors` (`-- --report` 토큰마다 scope·색·규칙, 색 없는 scope) |
| 같은 비교를 VS Code 내장 TypeScript 서버의 의미 토큰까지 얹어서 (TS·JS 샘플, 실제 VS Code 를 띄움, Linux 는 `xvfb-run -a`) | `bun run check:semantic` (`-- --report` 의미 토큰마다 종류·수식어·스타일) |
| IDE 서식 복사(`test/colors/ide/*.rtf`)와 글자 단위 비교 (다른 곳만 출력, 실패하지 않음) | `bun run compare:ide` (`-- ruby php` 이름 일부로 고름) |
| New UI 제품 아이콘 글꼴 만들기 (확인용 그림 포함) | `bun run build:product-icons` (`-- --sheet <png>`) |
| VSIX 만들기 | `npx --yes @vscode/vsce@3.6.0 package --no-dependencies --allow-missing-repository --skip-license -o <경로>.vsix` |

- `tsc --noEmit` 의 `@types/lodash` ↔ TS lib `WeakMap` 오류 4개는 원래 있던 것. 그 밖의 오류만 본다.
- `npx tsc` 는 엉뚱한 `tsc` 패키지를 받는다. `node node_modules/typescript/bin/tsc` 로 부른다.

## 구조
- 아이콘 원본은 서브모듈 `iconGenerator`(`AtomMaterialUI/iconGenerator`, HTTPS). JetBrains 플러그인과 같은 SVG·연결 json.
- 파일/폴더 연결: `src/icons/files/*.ts`, `src/icons/folders/*.ts`(알파벳별, 손으로 관리)
  + `upstream.ts`(생성물, **손대지 않는다**). `src/scripts/icons/syncUpstream.ts` 가 JetBrains 플러그인의 선택을
  `jetbrainsMatcher.ts`(정규식 + priority, 경로 패턴은 `/project/<이름>` 으로)로 흉내 내서, JetBrains 가 아는 이름
  (예시 이름 + 손으로 쓴 모든 이름, `.ext` 점 파일, 확장자와 같은 이름의 파일)마다 JetBrains 아이콘이 다르면 덮어쓴다.
  생성기는 손으로 쓴 것 → 그 팩 → upstream → pycharm → 사용자 설정 순으로 적용(뒤가 이김).
  JetBrains 가 모르는 이름만 손으로 고쳐서 바뀐다. 고친 뒤 `sync:upstream`.
- `test/unit/jetbrainsParity.test.ts` 가 기본 테마의 모든 키를 JetBrains 선택과 비교한다(어두운·밝은 테마).
- 포크가 직접 넣은 아이콘은 `assets/icons/files/`(iconGenerator 와 같은 구조, 출처·라이선스는 `assets/icons/NOTICE.md`).
  생성기가 iconGenerator 다음에 복사한다. 테스트 fixture 는 `iconGenerator`·`assets` 둘 다 junction 으로 건다.
- 방향: **어떤 아이콘이 붙는지**는 PyCharm(Atom Material Icons 설치)에서 보이는 것에 맞춘다(모양은 유리 스타일, 아래). PyCharm 은 `.py` 를 이름과 상관없이 자체 New UI
  Python 아이콘으로 보여 줘서 `pycharm` 팩이 그걸 따른다. 다른 차이는 PyCharm 화면과 나란히 비교해서 찾는다.
- `name` = SVG 파일 이름(확장자 제외). `light: true` = `<name>_dark.svg` 가 있다는 뜻(어두운 테마에 _dark 사용).
- 설정 → 테마: `services/ConfigChangeDetector` 가 `ConfigService.getIconConfigChanges()` 로 **설정 전체**를 저장된
  `atomConfig` 와 비교하고, 다르면 `IconThemeGenerator(전체 설정, 경로)` 로 `dist/` 의 json·SVG 를 다시 쓴다.
  바뀐 값만 넘기거나 `lodash.merge` 로 합치면 #74·#71·#70 이 되살아난다(`configUtils.withDefaults` 사용).
- 테마에 들어가는 설정을 추가할 때 고칠 곳: `@types/config.ts`(`AtomConfig`, `ICON_SETTING_KEYS`), `configUtils.getDefaultConfig`
  (+ SVG 를 바꾸면 `getFileConfigHash`), `ConfigService`(getter/setter, `getIconSettings`, `resetConfig`, `EMPTY_DEFAULTS`),
  `package.json` `contributes.configuration`, `package.nls.json` + `package.nls.ko.json`(한국어는 필수, 다른 언어는 없으면 영어로
  대체). 화면 문구(`src/i18n/locales/`)도 `en.json` + `ko.json`. `test/unit/korean.test.ts` 가 한국어 누락·`{{자리}}` 불일치·
  다른 언어의 남는 키를 잡는다.
- 이름 비교는 `helpers/utils.normalizeName`(NFC + 소문자, VS Code 와 같은 소문자 비교에 한글 NFD 대응)만 쓴다. `toLowerCase()` 를
  따로 쓰지 않는다.
- 글꼴(`helpers/fonts.ts` 상수 `JETBRAINS_FONT_SETTINGS`, `services/FontCheckService.ts`): `useJetBrainsFonts` 명령이 사용자 설정
  (Global)에 `editor.fontFamily`·`markdown.preview.fontFamily` 를 쓰고(사용자 값이 있으면 모달로 묻는다), `removeJetBrainsFonts` 는
  우리 목록과 같은 값만 지운다. Cool Islands 색 테마가 선택돼 있고 사용자가 에디터 글꼴을 안 정했으면 시작 때·`workbench.colorTheme`
  변경 때 한 번 권한다(globalState `fontOfferShown`). 에디터가 우리 목록을 쓸 때만 글꼴 폴더에서 JetBrains Mono(한국어 화면이면
  D2Coding 도)를 찾고, 없으면 같은 조합에 대해 한 번만 알린다(globalState `fontMessageShown`, 명령으로 고르면 매번).
  명령은 설정을 쓰면 끝나고 알림은 기다리지 않는다(스모크가 `executeCommand` 로 부름). VS Code UI 글꼴은 확장이 못 바꾼다.
- 설정은 `contributes.configuration` 배열로 종류별 묶음(일반·파일 아이콘·색 테마·제품 아이콘·글꼴). 새 설정은 맞는 묶음에 넣고
  묶음 제목은 `configuration.title.*`(영어·한국어).
- 테마 섞기(방향: Atom 이 기본, 다른 테마는 겹쳐 쓰기): VS Code 는 아이콘 테마를 하나만 쓰므로, 생성 마지막에
  `ThemeLayerGenerator` 가 설치된 다른 테마 json 을 읽어 섞고 SVG 를 필터 적용해 `dist/layers/` 에 복사한다.
  - `iconThemeLayers`(기본 `["material-icon-theme"]`): 테마 id 또는 `{theme, files, folders}`, 모드는 `fill`(아무 테마도
    모르는 이름만, 이름·확장자 접미사·언어·폴더 이름의 마지막 조각으로 판단) / `override`(그 테마가 아이콘을 주는 이름은
    전부 그 테마, 기본 파일·폴더 아이콘도) / `off`. `iconThemeByName`: `파일이름`·`*.ext`·`폴더/` → 테마 id.
  - 우선순위: byName > override 층(앞이 이김, 사용자 `*Associations` 이름은 건드리지 않음) > Atom > fill 층(앞이 이김).
    byName 값이 우리 id `cool-theme-kit-icons` 면 층을 섞기 전 우리 아이콘으로 되돌린다(`ThemeLayerGenerator` 가 섞기 전 사본 `own` 을 읽음,
    섞기 화면은 이 id 를 열 없이 이름별 선택지로만 보여 줌). override 층은 그 테마만 쓸 때 VS Code 가 보여 줄 아이콘(확장자로 찾은 것 포함)을 쓴다.
  - 이름 해석은 VS Code 와 같게(파일 이름 > 긴 확장자부터 > 언어). 밝은·고대비 변형은 같은 항목의 것만 쓰고 없으면
    우리 변형을 지운다. SVG 는 필터 적용 복사, Seti 같은 글꼴 테마는 글꼴을 `dist/layers` 에 복사하고 글리프마다
    `fontId`·`fontSize` 를 명시(VS Code 는 첫 글꼴을 모든 아이콘의 기본으로 씀). `dist/layers` 정리(`ThemeLayerGenerator.clean`)는 파일만 지운다:
    `dist/layers/product/` 는 제품 아이콘 생성기의 것(폴더까지 지우려다 EISDIR 로 아이콘 재생성이 멈췄던 버그, 스모크가 찾음). 글꼴 색은 채도·모노크롬만(VS Code 가 알파 없는
    `#rrggbb` 만 받아 불투명도는 못 씀). PNG 는 건너뜀.
    `usesCurrentColor` 테마(VS Code Modern)는 VS Code 가 선택된 테마의 아이콘만 글자색으로 칠하므로, 복사할 때 `currentColor` 를
    어두운 테마 `#cccccc`, 밝은 변형 `#3b3b3b` 로 바꾼다(원본에 밝은 변형이 없어도 만든다).
  - 섞기 화면(`openThemeMixer` 명령, `src/panels/ThemeMixerPanel.ts` + `media/themeMixer.{js,css}`, 빌드 없는 정적 파일):
    두 설정을 고치고, 미리보기는 `helpers/themePreview.ts`(`LayerReader` 재사용)로 각 테마 json 과 생성된 우리 json 에서
    이름별 아이콘을 찾는다. 설정 쓰기 → 테마 재생성 → `extension.ts` 의 `regenerateTheme` 가 `ThemeMixerPanel.refresh()`.
    화면 문구는 `en.json` 의 `themeMixer.*`(다른 언어는 영어로 대체됨).
  - 다른 테마(아이콘·색·제품 아이콘)의 json 이 가리키는 파일(SVG·글꼴·`include`·`tokenColors`)은 `helpers/themePaths.resolveThemePath`
    로만 푼다: 그 테마를 기여한 확장 폴더(`extensionPath`, 설치된 테마 목록이 가짐) 밖이면 없는 파일처럼 건너뛴다(`docs/MAINTENANCE.md` 1장 규칙 2).
  - 쓰는 테마들의 지문(`layerThemes`, 확장 버전 + json 수정 시각)을 테마 json 에 저장해 바뀌면 다시 만든다
    (`extension.ts` 가 각 json 을 watchFile). 스크립트·parity 테스트는 다른 테마 없이 돈다.
- 색 테마(Cool Islands Dark/Light, `src/themes/`): `syncJetbrainsColors.ts` 가 `JetBrains/intellij-community` 의 고정 커밋
  (`themes/jetbrains-source.json`)에서 UI 테마 json·에디터 scheme xml·플러그인 추가 속성(Python·Markdown·YAML·sh·XML·Groovy·reST·Kotlin)을 받아
  `jetbrainsTheme.ts` 로 IDE 와 같게 푼다: UI 는 parent 체인 + 팔레트 이름 + `*` 와일드카드(부모 키 뒤에 자식 키가 붙고
  **뒤에 적용된 값이 이김** → 자식의 `*` 가 부모 명시 키를 덮음), scheme 은 parent 체인 + `baseAttributes`(값이 같이 있으면 자기 값)
  + 추가 속성(그 scheme 을 부모로 둔 scheme 이 물려받음). `jetbrainsUiMap.ts`(VS Code 색 id ← `ui:`/`color:`/`fg:`·`bg:`… 후보)와
  `jetbrainsTokenMap.ts`(TextMate·semantic ← 속성 키 후보, 코드에만 있는 대체 키는 여기 적음)로 `themes/cool-islands-*.base.json`
  (생성물, **손대지 않는다**)을 만들고, `ColorThemeGenerator` 가 빌드 때 `dist/` 로 쓴다. IDE 는 선택 영역을 강조 위에 그리지만 VS Code 는
  강조(단어·검색 결과·접기·괄호)를 선택 위에 그려서, 그 색들은 `translucent.ts` 가 에디터 배경 위에서 같은 색이 되는 가장 투명한 색으로 바꾼다
  (불투명하면 선택이 가려짐, 포크 #91). 선택 강조(`editor.selectionHighlightBackground`)는 투명: VS Code 는 선택한 단어의 다른 위치에 단어 강조와
  겹쳐 그리는데 IDE 에는 없는 강조라 겹치면 색이 달라진다(2026-11-25 사용자 결정). Python 규칙은 PyCharm `PyHighlighter.java`
  의 키·대체 키 기준(상수·속성 색 없음, 메서드 호출 = 함수 호출). 정규식은 `RegExpHighlighter.java`, XML·HTML 은 `XmlHighlighterColors.java`,
  properties 는 `PropertiesHighlighter.java` 의 대체 키를 따른다. 닫힌 플러그인 키(JS.*)는 scheme 에 있는 값만 쓰고 대체 키는 원래 규칙을 둔다.
  Sass·Less·Kotlin·JSX 컴포넌트 키는 VS Code 쪽 scope 를 확정할 수 없거나(VS Code 에 Kotlin 문법 없음) 쓰임을 공개 소스로 확인할 수 없어 넣지 않았다.
  scope 이름은 VS Code 에 들어 있는 문법(`resources/app/extensions/*/syntaxes`)에서 확인한다. 화면 확인은 격리 VS Code(아래 "확인 방법"의 세 옵션)를
  `--remote-debugging-port` 로 띄워 CDP `Page.captureScreenshot` 으로 캡처(창을 앞으로 가져오지 않아 사용자 작업을 방해하지 않음).
- 의미 색 검사(`bun run check:semantic`, `src/themes/semanticTokens.ts` = VS Code `tokenClassificationRegistry.ts`·`colorThemeData.getTokenStyle` 포팅,
  `test/semantic/run.js` 가 실제 VS Code 에서 내장 TypeScript 서버의 의미 토큰을 뽑음): TS·JS 샘플의 기대값을 TextMate 색 위에 의미 스타일을 얹어 비교한다.
  선택자 점수는 수식어 100·타입 100·언어 10 이라 `property.readonly`(200)가 `property:typescript`(110)를 이긴다 → 언어별 규칙에 일반 규칙의 수식어를 다시 적는다
  (`SEMANTIC_RULES` 의 JS 부분). 의미 스타일이 비운 속성은 VS Code 기본 규칙(+ 내장 확장의 `semanticTokenScopes`)이 테마 `tokenColors` 에서 scope 를 찾아 채운다.
  의미 토큰으로도 남는 차이는 기대값 `semantic` 에 이유를 적는다(`todo` 는 TextMate 만의 차이). 다른 언어 서버(Pylance·Java·C++)는 확장이라 검사하지 않는다.
- 문법 색 검사(`bun run check:colors`, `src/themes/colorCheck.ts` 순수 함수 + `src/scripts/themes/checkColors.ts`): `test/colors/<이름>.<확장자>` 샘플을
  VS Code(`VSCODE_VERSION`, `.vscode-test` 에 받음) 내장 문법 + `vscode-textmate` 로 나누고, `<이름>.expect.json` 의 토큰마다(`key` = IDE 하이라이터가 주는 키 하나)
  `themes/*.base.json` 의 색이 IDE 의 색과 같은지 두 테마 다 본다. IDE 색은 `sync:colors` 가 함께 쓰는 `test/colors/jetbrains-attributes.json`(scheme 체인)과
  `jetbrainsFallbacks.ts`(코드의 대체 키, 출처 파일별)로 `ResolvedScheme.lookup` 이 IDE 순서(`EditorColorsSchemeImpl.getAttributes` 소스 그대로: 키 하나를
  scheme 과 그 부모에서 찾고(`getDirectlyDefinedAttributes`) 없으면 다음 대체 키를 같은 식으로. 부모는 첫 기본 scheme(Darcula·Default, 실행 때 부모가 없는
  `DefaultColorsScheme`)에서 끝나고 그 위(Islands Dark 의 Default)는 맨 마지막 key defaults)로 찾는다. 플러그인이 붙이는 속성은 그 기본 scheme 의 것.
  2026-11-22 IDE 서식 복사로 확인: Islands Dark 의 HTML 속성 이름 = Darcula 의 HTML_ATTRIBUTE_NAME(#bababa, Islands 의 대체 키 XML_ATTRIBUTE_NAME 아님),
  Light 의 클래스 이름 = Default 의 DEFAULT_IDENTIFIER(#000000, Light 의 TEXT 아님), properties `=` = Darcula 값(#808080). 생성기도 같은 순서다:
  `TOKEN_RULES` 의 `from` 은 키마다 대체 키까지 IDE 처럼 찾고(첫 속성), 뒤 키는 그 속성에 색이 없을 때 밑에 깔리는 층(Markdown 인용 = 글자색).
  주석(annotator)이 위에 덧칠하는 것(Markdown 링크 주소 = HYPERLINK_ATTRIBUTES)은 그 키를 `from` 에 바로 쓴다. 아직 다른 것은 기대값에 `todo`(이유 적음,
  실패 아님)로 두고, 두 테마에서 다 맞게 되면 `FIXED` 로 실패해 todo 를 지우게 한다. 새 언어는 샘플 + 기대값 + 그 언어 키의 대체 키(`jetbrainsFallbacks.ts`)를 같이 넣는다.
  효과(밑줄·취소선)는 효과 색이 있을 때만 쓴다(Islands 의 PROPERTIES.KEY 는 밑줄 종류만 있고 색이 없어 화면에 선이 없다). 하이라이터가 키 밑에 다른 층을
  깔면(reST 인라인 리터럴 = 배경만 있는 REST.FIXED 밑에 문자열) 기대값에 `under` 로, 규칙에는 두 번째 `from` 키로 적는다.
  닫힌 IDE(GoLand·CLion·RustRover·Rider)는 키·대체 키가 공개돼 있지 않다: 공개 구성표에 있는 키(밝은 쪽 GO_*)와 기본 키를 쓰고, 화면에서 본 색이
  공개 키에 없으면 가장 가까운 공개 키를 주석과 함께 쓴다(Rust 수명 = 타입 매개변수 청록). Rust 키는 intellij-rust(MIT) `RsColors.kt`, 단 그 RustDarcula 색은
  2024년 옛 색이라 쓰지 않는다. Rider 는 C# 를 자체 팔레트로 그려서 따르지 않는다(C# 은 Islands 기본 키). 다른 규칙을 덮는 규칙은 색이 없을 때
  밑 규칙 색이 비치므로 `from` 끝에 'TEXT' 층을 둔다(밝은 테마 C++ 호출이 선언 색으로 남던 것).
  닫힌 플러그인 중 RubyMine(Ruby)·PhpStorm(PHP)·WebStorm(JS/TS·CSS)이 그리는 색은 IDE 서식 복사에서 읽어 `src/themes/capturedAttributes.ts` 에 적는다
  (`CAPTURED_ATTRIBUTES` = Darcula/Default 에 붙는 추가 속성, 키 이름 `IDE.*` 은 우리 것, 다른 테마 쪽 공개 키는 `CAPTURED_FALLBACKS`). RubyMine·PhpStorm 의
  Islands Dark 는 플러그인이 Darcula 에 준 옛 Darcula 색(Ruby 상수 #ffc66d 등)이다.
  PyCharm 에 플러그인이 없는 언어(Lua·Swift·PowerShell·Dart·Makefile·log 등, `textMateTheme.ts` `TEXTMATE_LANGUAGES`)는 IDE 가 VS Code 와 같은
  TextMate 문법으로 칠한다: `TEXTMATE_RULES` = intellij-community `TextMateDefaultColorsProvider` + `TextMateTheme`(선택자 → 키). 맞는 선택자가 전부 층이 되고
  (구체적인 것이 위) 색은 위 층, 글꼴 모양은 모두 합친다(`TextAttributes.merge`: Ruby 숫자 = 상수 기울임 + 숫자 청록). 생성기는 언어 루트마다
  `source.ruby constant.numeric` 처럼 합친 스타일을 쓰고, 색이 없으면 글자색을 명시한다(부모 scope 규칙은 같은 scope 일반 규칙의 빈 값을 물려받음).
  기대값은 `layers`(밑 층 키, 가까운 것부터). 구두점(`punctuation` → DEFAULT_DOT)도 층이다: 문자열 따옴표·주석 표시·LaTeX `\` 는 글자색
  (플러그인 없는 PyCharm 서식 복사 2026-11-22, 예전 화면 판단 "따옴표 = 문자열 색"은 틀렸음). 주석 표시는 늘 주석 안이라 `IMPLIED_PARENTS` 로 주석 층
  (밝은 테마 기울임)을 같이 쓴다: vscode-textmate 는 같은 scope 의 두 규칙을 가까운 부모 이름 길이로 가려 `source.lua X` 가 `source.lua comment X` 를 이긴다.
  다른 겹침은 `NESTED_SCOPES`. 새 TextMate 언어는 격리 PyCharm 서식 복사로 정말 TextMate 인지 본다(diff 는 비교 화면이라 텍스트에 색 없음, Perl 은 다른
  하이라이터, R 은 색 없음). 기대값 초안은 TextMate 층으로 뽑고(토큰마다 층 조합 하나) 캡처로 확인한다. .env 는 intellij-community `env-files-support`(키 = 키워드, 값 = 문자열, `export` = 주석),
  CSS·SQL(닫힌 플러그인)은 WebStorm 서식 복사 색의 공개 키(선택자·함수 = HTML 태그 이름, 속성 이름 = HTML 속성 이름, 값 키워드·단위 = 문자열, SQL 함수 = 정적 메서드).
  **IDE 와 비교는 서식 복사로**(`bun run compare:ide`, `test/colors/ide/<샘플>.<IDE>.<dark|light>.rtf`): IDE 에서 샘플을 열고 Edit > Select All → Edit > Copy
  (서식 있는 복사가 기본) → STA PowerShell 로 클립보드의 'Rich Text Format' 을 저장. 글자마다 정확한 색이 나온다(화면 픽셀은 ClearType 때문에 못 씀,
  검사 색은 대부분 안 들어가지만 안 쓰는 이름의 회색은 들어간다: 비교에서 그 줄은 무시). 사용자 PyCharm 에는 **무지개 괄호 플러그인**이 있어 괄호·`<>`·CDATA 표시가 깊이별 색이다(예전 화면 판단 "CDATA = 태그 색,
  네임스페이스 접두사 = 이름 색"은 이것 때문에 틀렸다) → 기준 캡처는 플러그인 없는 WebStorm·PhpStorm·RubyMine 에서. 이 IDE 들은 캡처 뒤 지웠다(2026-11-22): 다시 캡처하려면 설치부터(체험판).
  IDE 띄우기: computer-use `open_application`(클릭 권한만: 메뉴는 햄버거 → Edit 위에 마우스 → 항목 클릭, 선택이 없으면 Select All 위치가 한 칸 위,
  항목 위치는 매번 스크린샷으로 확인). 열 프로젝트는 IDE 설정 `options/recentProjects.xml`(마지막 열린 것)·`trusted-paths.xml` 을 백업 후 고쳐서
  `D:\dev\sandbox\jetbrains-colors` 를 열고, 끝나면 백업으로 되돌린다. 밝은 테마는 Settings > Appearance > Theme = Islands Light(편집기 scheme 이름은 "Light"),
  끝나면 `laf.xml` 을 지우고 `colors.scheme.xml` 을 되돌린다. 창 닫기는 File > Exit → Exit 확인(창 X 는 스냅 레이아웃에 걸림).
  PyCharm 은 pycharm MCP `open_file_in_editor` 로 연다(열린 프로젝트 폴더에 샘플 복사). 플러그인 없는 Python 캡처(2026-11-22)는 **격리 PyCharm**:
  scratchpad 에 `idea.properties`(`idea.config/system/plugins/log.path`)를 두고 PowerShell 에서 `$env:PYCHARM_PROPERTIES=…; Start-Process pycharm64.exe <폴더> <파일>`
  (창이 뜬다, 사용자 PyCharm 설정은 그대로). 인터프리터는 배너의 Add Local Interpreter → **Select existing** → Conda → `miniconda3` base
  (기본값 Generate new = venv 는 누르지 않는다, 기본 Conda 환경은 Anaconda Desktop 내부용이라 바꾼다). builtin 색은 인터프리터가 있어야 나온다.
  Python 의 `re.compile(r"…")` 정규식은 `import re` 가 있어야 주입되지만 Islands 는 그것도 문자열 색으로 그린다(배경만).
- 색 테마 섞기(`src/themes/colorLayers.ts` 순수 엔진, `readColorTheme.ts` JSONC·`include`·`tokenColors` 경로 읽기,
  `services/ColorThemeService.ts` 설치된 테마 목록·섞기·다시 로드 알림): `colorThemeLayers`(테마 id 또는 `{theme, ui, syntax, applyTo}`,
  `fill`/`override`/`off`, 같은 종류의 Islands 에만 — `applyTo` 로 바꿈)·`colorThemeByKey`(색 id glob, `scope:`, `semantic:`).
  우선순위: byKey(뒤가 이김) > override 층(앞이 이김) > Islands > fill 층(앞이 이김). 문법 override 는 Islands 문법을 통째로 대신하고,
  문법 fill 은 Islands 규칙이 덮지 않는 scope 만 앞에 붙인다. 아이콘 설정이 아니라 `ICON_SETTING_KEYS` 에 넣지 않는다.
  `regenerateTheme` 마다 `ColorThemeGenerator.createJsonThemes(mix)` 가 **내용이 바뀐 테마만** 쓰고, 선택된 테마가 바뀌면
  알림 하나(`showReloadMessage`)로 창 다시 로드를 권한다. 테마 id 는 `workbench.colorTheme` 값 = 기여한 `id` ?? label
  (VS Code 1.147 기본 테마 id 는 "Dark Modern" 처럼 "Default" 없이). JSONC 는 `jsonc-parser` 대신 자체 `stripJsonComments`
  (jsonc-parser 의 UMD 빌드는 esbuild 번들에서 깨짐). 섞기 화면은 아이콘/색 탭(`openColorMixer` 명령은 색 탭으로 연다),
  색 탭 상태는 `panels/colorMixerState.ts`. 격리 확인에서 탭 전환은 클릭 대신 이 명령으로.
- 강조색(`src/themes/accent.ts`): `ACCENT_PRESETS` = `{ id, color, source }`(이름은 locales `accent.preset.<id>`, `package.json` `examples` 와 같은
  순서, 테스트가 지킴). `accentTargets`(`controls`·`tabs`·`folders`)의 색 키는 `ACCENT_TARGET_KEYS`(두 기본 테마에 있어야 함), 강조색이 없으면
  Islands 파랑으로 칠한다. `folders` 는 아이콘 설정 경로: `ConfigService.getIconSettings()` 의 `folderColor` 가 `effectiveFolderColor`
  (folders 켜짐 → 강조색 ?? Islands 파랑, 아니면 `folderColor`)라 해시·재생성이 그대로 따라온다(`ICON_SETTING_KEYS` 는 그대로).
  **미리보기 예외**: `chooseAccentColor` 명령(`pickers/AccentColorPicker.ts`, `createQuickPick`, 아이콘은 `dist/accents/<rrggbb>.svg`)과
  섞기 화면 색 선택기는 `services/AccentPreviewService` 로 `workbench.colorCustomizations` 의 `"[Cool Islands Dark/Light]"` 칸에
  바뀌는 키만 잠깐 쓴다(사용자 결정 2026-11-21, 규칙은 `docs/MAINTENANCE.md` 2장 규칙 2). 다른 곳에서 `colorCustomizations` 를 쓰지 않는다.
- 테마 조합(프리셋, `src/presets/presets.ts` 데이터 + `services/PresetService.ts` + 명령 `choosePreset`·`undoPreset`): 고른 근거는 `docs/THEME_COMBINATIONS.md`.
  프리셋은 나열한 설정만 사용자(Global) 설정에 쓰고 `null` 은 사용자 값을 지운다. 머무르는 동안 `workbench.colorTheme/iconTheme/productIconTheme`
  는 바로 바꾸고 강조색은 `AccentPreviewService`, 층 섞기는 고른 뒤. Esc 는 열 때의 값으로 되돌린다. 다른 확장이 필요하면 모달로 묻고
  `workbench.extensions.installExtension`. 바꾸기 전 값은 globalState `presetUndo`. 설치만으로는 아무것도 적용하지 않는다(`presets.test.ts`).
  프리셋을 고치면 locales `preset.<id>.name/description`(영어·한국어)와 조사 문서를 같이 고친다.
- 제품 아이콘(Cool Islands Icons, `src/productIcons/`): `jetbrainsMap.ts`(VS Code 아이콘 id → New UI SVG, 손으로 관리, 폴더 없는 경로는
  `platform/icons/src/expui/`, 플러그인 것은 전체 경로)로 `buildJetbrainsFont.ts` 가 고정 커밋(`themes/jetbrains-source.json`)의 SVG 를
  받아 흑백으로 바꾸고(진한 색 검정, 흰색·밝은 채움은 구멍) resvg 로 그린 뒤 potrace 로 따서 `webfont` 로 글꼴을 만든다
  (`productIcons/cool-islands-icons.woff`·`cool-islands-product-icon-theme.json`, 생성물·**손대지 않는다**, ttf ts=0 이라 같은 입력이면 같은 파일).
  svg-fixer 는 그리기 전에 채움을 검정으로 덮어 흰 구멍이 사라져서 쓰지 않는다. 매핑에 없는 id 는 VS Code 코디콘.
  New UI 이름 대응은 `platform/icons/src/PlatformIconMappings.json` 이 참고가 된다(예: 브랜치 = `general/vcs`).
  섞기: `productIconThemeLayers`(fill/override/off)·`productIconByName`(id glob), 우선순위는 색·아이콘과 같다. 다른 테마 글꼴은
  `dist/layers/product/<테마>/` 로 복사하고 글리프마다 `fontId`(Islands 글꼴이 첫 번째라 fontId 없는 정의는 Islands). Cool Material Icons 도
  층으로 고를 수 있다(새 id `cool-material-product-icons`). 화살표 스타일(`arrowTheme`)은 Material 테마에만 적용. 섞기 화면 제품 아이콘 탭(`openThemeMixer` 에 'product' 인자).
- 유리 스타일(`iconStyle`, `src/icons/glass/glassIcons.ts` 순수 함수 — 확장 호스트에는 SVG 를 그릴 것이 없다): `IconThemeGenerator.filterSvg`
  에서 폴더 색 필터 **뒤**(색을 아이콘에서 읽는다), 단색·불투명도·채도 필터 **앞**(어떤 SVG 에도 듣는다)에 적용한다.
  - 파일: 단색 아이콘 = 그 색 타일 + 흰 글리프(밝은 타일(휘도 > 0.45, JS 노랑)은 어두운 글리프), 여러 색 아이콘 = 어두운 타일 + 원래 색
    그대로(한 색으로 누르면 대부분 덩어리가 된다), 글리프를 뚫은 배지(`holes`: TS 사각형·C# 육각형·HTML 방패) = 타일이 배지를 대신하고
    구멍이 글리프(배지가 그리지 않은 곳을 구멍 상자 안에서 칠함: `feComposite out` + clip). 글리프 크기는 긴 변 11.6·정사각 10.2 로 맞춘다.
  - JetBrains New UI 글리프(`src/scripts/icons/jetbrainsGlyphs.ts` 대응표, 손으로 관리 → `sync:glyphs` 가
    `assets/icons/glass/files/<우리 아이콘 이름>.svg` 로 씀, 생성물·**손대지 않는다**): intellij-community
    `platform/icons/src/expui/fileTypes` 의 `_dark` 아이콘(어두운 테마 색)을 한 색 글리프로 바꾼 것. New UI 아이콘은 "선 색 + 그 색의
    어두운 안쪽 채움 + 글자용 회색"으로 그려져 있어서, 휘도 0.1 아래 채움은 지우고 나머지를 아이콘 색 하나로 칠한다(타일이 그 색을
    가져감). 채운 도형 위에 글자를 얹은 것(JS·TS·CSS)은 대응표의 `ink` 로 글자만 남긴다(타일이 도형을 대신함). 생성기는 유리 스타일일 때
    같은 이름의 파일 아이콘 대신 이 파일을 원본으로 쓴다(`_dark` 변형이 있는 아이콘은 두 파일 다 같은 글리프). 측정값은
    `metrics.json` 의 `glyphs`(구멍 판정 안 함, `"l"` = 선 글리프라 타일에서 더 크게: 긴 변 12.4·정사각 11.6). 평면 스타일은 쓰지 않는다.
    대응표에서 뺀 것: 파일 종류가 아닌 아이콘, 삽화(jenkins), 플러그인 로고가 더 나은 것(bazel·eclipse). 고정 커밋은 색 테마와 같은
    `themes/jetbrains-source.json`. Apache 2.0 의 변경 고지는 각 파일 첫 줄(`glyphNotice`)과 `assets/icons/NOTICE.md`.
  - 폴더: `data-folderColor`/`data-themed` 표시가 있는 path(없으면 Material 폴더 윤곽 `M10,4H4`·`M20,18`)가 폴더 모양, 나머지가 배지.
    그 색으로 뒤판·앞판을 그리고 배지를 앞판에 글리프로 놓는다(여러 색 배지는 원래 색). 펼친 폴더는 앞판이 낮고 종이가 보인다.
    `seed` 는 구조가 달라 평면 그대로. 펼친 아이콘이 없는 폴더는 닫힌 아이콘의 배지로 펼친 유리 폴더를 그린다.
  - 글리프 색은 mask 가 아니라 filter(`feFlood` + `feComposite`)로 입힌다: 단색 설정이 뒤에서 모든 paint 를 바꾸므로 mask 는 투명도가 돼 버린다.
    생성한 id 는 `ctk-` 로 시작한다(아이콘 안의 id 와 겹치지 않게).
  - 글리프는 원래 viewBox 를 가진 안쪽 `<svg>` 로 놓는다(퍼센트 길이 유지: detekt 의 mask "100%"). 그래서 한 파일에 `</svg>` 가 여럿이다:
    `SaturationService` 는 마지막 것 앞에 필터를 넣는다.
  - 렌더러가 있어야 아는 것(글리프가 실제로 차지하는 상자, 뚫린 배지인지)은 `sync:metrics`(resvg, `src/scripts/icons/iconMetrics.ts`)가
    `assets/icons/metrics.json`(생성물, **손대지 않는다**, VSIX 에 들어감)에 미리 잰다. 측정으로 알 수 없는 것은 `iconMetrics.ts` 의
    `PLAIN`(구멍이 글리프가 아닌 배지: 자물쇠·봉투·카메라·글자 속 구멍)·`ONE_COLOR`(여러 색이지만 한 색 글리프가 나은 것: Docker Compose).
    아이콘이 바뀌면 다시 쓴다(`sync-upstream.yml` 이 같이 돌린다). `glassIcons.test.ts` 가 뒤처진 측정값을 잡는다(`<text>` 로 그린
    아이콘은 PC 글꼴에 따라 상자가 달라 재지 않는다: 번들되지 않은 아이콘처럼 viewBox 로 놓는다. Linux CI 에는 글꼴이 없다).
    개발 스크립트도 Sonar·CodeQL 이 본다: 명령줄 인자로 받은 문자열을 경로(S8707)나 정규식(js/regex-injection)으로 쓰지 않는다
    (`sheet:icons` 는 고정 폴더에 쓰고 `--only` 는 이름 목록). 새 아이콘이 들어오면 `sheet:icons` 로 보고 필요한 이름을 두 목록에 넣는다.
  - 측정값이 없는 아이콘(사용자 커스텀 SVG, 섞는 다른 테마의 **파일** 아이콘)은 viewBox 로 놓고 같은 타일에 올린다. 다른 테마·사용자의
    **폴더** 아이콘은 통째 그림이라 그대로 둔다(`ThemeLayerGenerator` 가 파일용·폴더용 정의를 따로 복사한다).
  - `iconStyle` 은 기본값(glass)이 아닐 때만 아이콘 파일 이름 해시에 들어간다(`getFileConfigHash`). 밝은·어두운 테마 변형(`_dark`)은
    그대로 두 벌이다(타일이라 둘 다 어느 배경에서나 보인다).
- 아이콘 팩(`enabledFor`) 항목은 생성 때 일반 항목 뒤에 적용돼 같은 확장자를 덮어쓴다(css → css2). 기본 팩은
  `package.json` 기본값과 `getDefaultConfig` 를 같이 고친다.
- 시작 때 설정과 생성된 테마를 비교하느라 테마 json(아이콘 735 KB + 제품 180 KB)을 통째로 파싱하지 않는다: `helpers/themeState.ts` 가
  `dist/.state.json`(테마 파일의 크기·수정 시각 + 그 파일을 만든 설정·층 지문)을 같이 쓰고, `ConfigChangeDetector` 는 파일이 상태와 같을 때만
  상태를 믿는다(다르거나 없으면 예전처럼 파일을 읽는다). 상태는 `.vscodeignore` 로 VSIX 에서 뺀다(런타임에 생김).
- VS Code 프로필은 확장 폴더(`dist/`)를 같이 쓰고 설정은 따로라, 값이 다른 프로필끼리 창을 열 때마다 서로의 테마를 다시 만든다(2026-11-22 재현).
  `.state.json` 의 `writer`(마지막으로 쓴 프로필 = 그 프로필 globalState 의 무작위 `profileId`, 그때의 `THEME_SETTING_KEYS` 값, 워크스페이스 값인 키)를 보고
  `services/ProfileConflictService.regenerated(written)`(`regenerateTheme` 끝에서 부름)이 다른 설정을 출력 채널에 매번, 알림으로 한 번 알리고,
  버튼은 `workbench.settings.applyToAllProfiles` 에 우리 키를 덧붙인 뒤 이 프로필 값을 비교 없이 모두(`THEME_SETTING_KEYS`, 21개) 쓴다(공유 직후 확장 호스트가
  잠깐 이 프로필 값을 돌려줘서 비교하면 쓰기를 건너뜀, 1.147 확인). 판단은 `helpers/profileConflict.ts`(순수 함수).
  테마를 바꾸는 설정을 추가하면 `THEME_SETTING_KEYS` 와 README "VS Code profiles" 목록도 고친다(`profileConflict.test.ts`).
  격리 VS Code 로 프로필 확인: `Code.exe … --profile B <폴더>` 로 한 번 열어 프로필을 만든 뒤 `code.cmd … --profile B --install-extension <vsix>`.
- 설치된 색·제품 아이콘 테마 목록은 `extensions.onDidChange` 때만 다시 읽고(`forgetInstalled*Themes`), 섞을 테마가 없으면 읽지 않는다.
  섞기 화면은 `retainContextWhenHidden: false`: 숨기면 VS Code 가 페이지를 버리고 다시 열 때 `ready` 로 상태를 받는다. 탭·스크롤은
  `media/themeMixer.js` 의 `setState`, 요청된 탭은 `ThemeMixerPanel.tabPending`. 숨겨진 패널은 `refresh()` 에서 상태를 만들지 않는다.
- 메모리·시간 측정: `COOL_THEME_KIT_MEMORY=1` 로 VS Code 를 띄우면 출력 채널에 `MEMORY` 줄이 남는다(활성화 끝·재생성 끝, GC 뒤 `heapUsed`·`rss`).
  격리 프로필의 `logs/*/window1/exthost/output_logging_*/1-Cool Theme Kit.log`. 재생성 시간에는 이 GC 가 들어간다(웜 스타트 기준 베이스라인 ≈ 50 ms).
  보유 메모리(37 MB)는 VS Code 확장 호스트가 대부분이라 파싱 같은 일시적 할당은 `heapUsed` 에 안 보인다.
- dist 쓰기는 `helpers/fsUtils.writeFileAtomic`/`writeFileAtomicAsync`(임시 파일 + rename)만 쓴다(#67). 내용이 같으면 쓰지 않는다: 아이콘 ~2,500개를
  다시 쓰면 Windows 에서 확장 호스트가 6~9초 멈춘다(포크 #28). 아이콘 파일 이름의 해시(`getFileConfigHash`)는 SVG 필터 설정
  (색·불투명도·채도·모노크롬)만으로 만들고, 생성기가 이번에 쓰지 않은 `~해시`·`custom-` 아이콘은 지운다.
  **아이콘 SVG(우리 것 + 섞는 테마 것)는 동기로 읽고 쓰지 않는다**: 생성기는 json 을 만들면서 복사할 것만 `helpers/fileCopies.FileCopies` 에
  모으고, `IconThemeGenerator.createJsonTheme()`(async)가 16개씩 비동기로 복사 → 테마 json → 안 쓰는 아이콘 지우기 순으로 한다.
  다른 확장의 SVG 를 처음 읽을 때 Windows 는 파일마다 수 ms(백신 검사로 추정)라, 동기로 5,000개를 읽던 때는 섞기 재생성 하나가
  확장 호스트를 43초 막았다(2026-11-23, "Extension host is unresponsive", 섞기 화면도 안 열림). 동기는 json·글꼴처럼 몇 개짜리만.
  재생성은 `extension.ts` 의 `scheduleRegenerate`(300ms 묶기, 이 확장·`files.associations` 설정만)로만 부르고, `startRegenerate` 가
  한 번에 하나만 돌린다(도는 중 온 이벤트는 끝난 뒤 한 번 더).
  재생성 실패는 `services/themeFailure.reportThemeFailure` 로만 알린다: 확장 폴더에 쓸 수 없으면(`helpers/readOnly`, 권한 오류 +
  폴더에 시험 파일을 못 만듦 — Windows 의 EPERM 은 다른 창이 연 파일 때문일 수도 있어서) 버전마다 한 번 경고, 그 밖은 오류 토스트.
  생성기는 파일 시스템 오류를 `{ cause }` 로 감싸서 코드가 남는다.
- 엔진 하한 `^1.95.0` 은 `@types/vscode ~1.95.0` 로 타입이 지키고, `test/smoke`(`@vscode/test-electron`, 확장 사본 + 빈 프로필)로
  1.95.0·stable 에서 실제로 돌려 확인한다. VS Code 1.95 의 Node 는 20 이라 Node 22 전용 API(`Set.prototype.union` 등)는 쓰지 않는다.
- **유지보수 지침(보안·다른 확장과의 호환·메모리)은 `docs/MAINTENANCE.md`**: 규칙, 자동 검사, 예산, 주기 점검, 점검 결과(후속 과제).
  보안·호환·메모리에 닿는 변경은 그 문서의 규칙을 따르고, 규칙·예산을 바꾸면 문서와 검사(`test/checks/`, `test/smoke/`)를 같이 고친다.
  모든 워크플로는 기본 `contents: read`, `uses:` 는 커밋 SHA + 버전 주석(`security.yml` 이 검사), 설치는 `bun install --frozen-lockfile --ignore-scripts`
  (`npx` 도 `--ignore-scripts`).
- **출처·라이선스는 `THIRD-PARTY-NOTICES.md`**(VSIX 에 들어감): 남의 코드(포팅 포함)·아이콘·글꼴·색·데이터를 넣으면 같은 PR 에서 적는다
  (`docs/MAINTENANCE.md` 1장 규칙 8). 번들 npm 패키지의 라이선스 전문은 생성 부분이라 손대지 않고 `sync:notices` 로 쓴다(VSIX 에
  `node_modules` 가 없고 최소화한 번들은 그 주석을 남기지 않음, 2026-11-23 전에는 빠져 있었음). 번들 패키지 목록은
  `test/checks/bundledPackages.js`(esbuild metafile, `audit:shipped` 와 같이 씀).
- CI(`.github/workflows`): `build.yml`(lint·notices·build·test·VSIX·크기 예산), `security.yml`(배포 의존성 감사·Actions 고정 검사·CodeQL,
  매주 화), `smoke.yml`(실제 VS Code 1.95.0·stable, Linux·Windows, 다른 테마 확장과 함께, 재생성 반복 뒤 힙 증가 예산, 매주 수),
  `sonar.yml`(SonarQube Cloud CI 분석 + 커버리지 + 품질 게이트, `SONAR_TOKEN` 이 있을 때만), `sync-upstream.yml`(매주 iconGenerator 최신화 → PR,
  저장소 설정 "Allow GitHub Actions to create … pull requests" 필요), `release.yml`(수동, Marketplace 는 Trusted Publishing(`vsce --oidc`, environment `marketplace`), Open VSX 는 토큰 시크릿이 있을 때만 배포, `docs/MAINTENANCE.md` "Marketplace 배포"). main 이 보호돼 있어 커밋하지 않는다: 다음 버전은 이 저장소의
  마지막 GitHub Release 태그(없으면 package.json)에서 계산해 VSIX 안에만 넣고, package.json 버전은 그대로 둔다
  (원본의 v5.x 태그는 릴리스가 아니라서 무시). 이미 있는 태그(옛 `cool-icon-vscode` 의 v1.1.0~v1.3.0, 원본 v3~v5)는 쓰지 않는다:
  계산한 버전은 같은 종류로 다음 빈 번호까지 건너뛰고(1.0.0 의 minor = 1.4.0), 직접 준 버전이면 멈춘다.
- 테스트: `test/run-unit.js` 가 esbuild 로 묶으며 `vscode` 를 `test/mocks/vscode.ts` 로 바꿔 mocha 실행.
- SonarQube Cloud(`WoogaJJangka_a-file-icon-vscode`)는 2026-11-21 부터 **CI 분석**(`sonar.yml`, secret `SONAR_TOKEN`, 커버리지 포함,
  게이트 실패 = 검사 실패)으로 돈다. Automatic Analysis 는 꺼 둔다(켜면 CI 스캔이 실패). 이전의 Automatic Analysis 는 실패 표시 없이
  사흘 멈춰 있었다. 설정은 `.sonarcloud.properties`(CI 가 `sonar-project.properties` 로 복사). 생성 파일·서브모듈·데이터 표는 거기서 뺀다.
  자주 나오는 지적(정렬 비교 함수, 정규식 백트래킹, 웹뷰 메시지 출처 등)의 답은 `docs/MAINTENANCE.md` 4장.
- 커버리지: `.c8rc.json`. 번들된 테스트를 소스맵으로 되돌리므로 `include` 를 쓰면 숫자가 100% 로 깨진다 → 제외 목록만 쓴다.
- bun 으로 도는 스크립트에서 `require('esbuild')` 는 tsconfig `baseUrl: "."` 때문에 루트의 `esbuild.js` 로 풀린다 → `node_modules/esbuild` 경로로 부른다.

## 확인 방법
- `package.json` 의 `"_watch": true` 는 개발 모드(`--extensionDevelopmentPath`)에서만 테마 파일을 다시 읽는다.
  사용자 환경을 확인하려면 VSIX 를 격리 프로필에 설치해 본다(사용자 VS Code 를 건드리지 않음):
  `code --user-data-dir <tmp>/u --extensions-dir <tmp>/x --shared-data-dir <tmp>/s --install-extension <vsix>` →
  `<tmp>/u/User/settings.json` 에 `"workbench.iconTheme": "cool-theme-kit-icons"` →
  `code --user-data-dir … --extensions-dir … --shared-data-dir … <샘플 폴더>`(`Code.exe` 를 바로 띄울 때도 같은 세 옵션).
  설정은 그 settings.json 을 고쳐서 바꾼다(창은 다시 열 필요 없음).
- **`--shared-data-dir` 는 빼먹지 않는다**(포크 #40): VS Code 1.147 은 GitHub 로그인 같은 일부 상태를 `--user-data-dir` 밖의
  `~/.vscode-shared/sharedStorage/state.vscdb` 에 두고, 격리 프로필은 암호화 키가 달라 그 토큰을 풀지 못해 지워 버린다
  → 사용자 VS Code 가 다음 시작 때 GitHub 로그인을 다시 요구하고, 최근 연 폴더에도 샘플 폴더가 쌓인다.
  격리본 `main.log` 의 `[shared storage] Creating shared storage database at '<tmp>/s…'` 로 확인한다(`~/.vscode-shared` 면 잘못 띄운 것).
  `--extensionTestsPath` 실행(단위·통합 테스트)은 공유 저장소를 메모리에 둬서 상관없다.

## git
- remote: `origin` = 포크 `WoogaJJangka/cool-theme-kit`(2026-11-21 까지 `a-file-icon-vscode`, 옛 주소는 GitHub 가 넘겨 줌), `upstream` = 원본. 작업 브랜치는 같은 이름의 origin 브랜치를 추적.
  머지된 PR 의 브랜치는 GitHub 가 자동으로 지운다(저장소 설정) → 로컬에서도 `git fetch --prune` 후 `git branch -d`.
- 이 문서·코드 주석의 #74·#71·#70·#67 같은 번호는 원본 저장소 이슈다. 포크 이슈는 #17 부터(로드맵 #19~#23).
- 의존성 갱신은 `.github/dependabot.yml`(Actions 매주, bun 매월 묶음). 원본의 Renovate·semantic-release·techstack 설정은 지웠다.
- `.idea/` 는 추적하지 않는다(D:\dev 규칙). `.vscode/{launch,tasks,extensions}.json`·`settings.json` 은 확장 실행·디버그에
  쓰여서 예외로 커밋한다.
