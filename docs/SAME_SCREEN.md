# 같은 화면: VS Code 와 JetBrains IDE

Cool Theme Kit 은 두 저장소로 만든다. **목표는 VS Code 와 PyCharm 을 번갈아 써도 같은 화면을 보는 느낌**이다
(2026-11-26 사용자 결정). 두 저장소는 방향이 같고, 한쪽을 고칠 때마다 다른 쪽을 참고한다.

| 저장소 | 폴더 | 하는 일 |
|---|---|---|
| Cool Theme Kit (VS Code 확장) | `D:\dev\projects\cool-theme-kit` | JetBrains(PyCharm New UI, Islands)의 색·UI 아이콘·글꼴을 VS Code 로 가져오고, 파일 아이콘 Cool Icons 를 만든다 |
| Cool Theme Kit for JetBrains (플러그인) | `D:\dev\projects\cool-theme-kit-jetbrains` | Cool Icons 를 PyCharm·JetBrains IDE 로 가져간다 |

즉 **화면의 각 부분은 원본이 한 곳**이고, 다른 쪽은 그것을 따라 그린다. 원본을 새로 만들지 않는다.

## 부분마다 원본과 맞추는 방법

| 부분 | 원본 | VS Code 쪽 | JetBrains 쪽 | 맞추는 방법 |
|---|---|---|---|---|
| 파일·폴더 아이콘(유리 스타일, 역할 표시, 흔한 이름, 예외) | **Cool Theme Kit** (어떤 이름에 어떤 아이콘인지는 PyCharm + Atom Material Icons) | 생성기가 `dist/` 에 만든다 | `gradlew syncIcons` 가 `dist/` 를 복사(`src/main/resources/coolicons/`) | 여기서 고침 → `bun run build` → 플러그인에서 `syncIcons` → 두 저장소 다 커밋 |
| 이름 맞추기 | VS Code 아이콘 테마 규칙 | VS Code | `CoolIcons`(파일 이름 → 긴 확장자부터 → 언어 → 기본, NFC + 소문자. JetBrains 언어 id 는 VS Code id 로 옮기고 없으면 기반 언어로) | 규칙을 바꾸면 양쪽 코드와 테스트를 같이 |
| 펼친 폴더 | VS Code `folderNamesExpanded` | VS Code | `CoolFolderIcon`(트리가 그리는 행이 펼쳐졌으면 열린 폴더) | `syncIcons` 가 함께 복사 |
| 아이콘 연결(`filesAssociations` 등) | Cool Theme Kit 생성기(`FileJsonGenerator` 등) | 테마를 다시 만든다 | `CoolAssociations` | 규칙을 바꾸면 `export:jetbrains-icons` 의 예시와 `CoolAssociationsParityTest` 를 같이 |
| 아이콘 색(`folderColor`·`monochrome`·`opacity`·`saturation`) | Cool Theme Kit `filterSvg`(`MonochromeService` 등) | 아이콘을 다시 쓴다 | `CoolIconFilters`(포팅, 시스템 폴더에 다시 쓴 아이콘) | 규칙을 바꾸면 `export:jetbrains-icons` 의 `filters.json` → `CoolIconFiltersTest` |
| 모르는 이름(`iconThemeLayers`, 기본 Material Icon Theme) | **Material Icon Theme** + Cool Theme Kit `ThemeLayerGenerator`(fill) | 설치된 테마를 섞는다 | `export:jetbrains-icons` 가 이 PC VS Code 의 Material Icon Theme 으로 섞은 테마를 `syncIcons` 가 복사(`coolicons*/layers/`, 라이선스 포함), 설정에서 끌 수 있다 | Material Icon Theme 이 바뀌면 다시 내보내기 → `syncIcons` |
| 색 테마(UI·문법) | **JetBrains** Islands Dark/Light (`intellij-community` 고정 커밋, `themes/jetbrains-source.json`) | Cool Islands Dark/Light (`sync:colors`) | IDE 내장 Islands 그대로 | 고정 커밋은 플러그인의 대상 PyCharm(`gradle.properties` `platformVersion`)과 같은 버전대로 올린다 |
| UI(제품) 아이콘 | **JetBrains** New UI 아이콘 | Cool Islands Icons (`build:product-icons`) | IDE 내장 | 같은 고정 커밋 |
| 강조색(`accentColor`·`accentTargets`, 프리셋) | **Cool Theme Kit** `src/themes/accent.ts`(Islands 파랑 → 고른 색: 그 색 그대로 / 밝기 유지한 색조 이동) | Cool Islands 색 테마를 다시 쓴다(창 다시 로드) | `CoolAccent`(포팅): Islands 의 이름 색(`UIThemeCustomizer`, IDE 다시 시작), 스크롤바·배지·편집기 선택·링크는 바로, 폴더 색 아이콘은 다시 그림 | 규칙을 바꾸면 `bun run export:jetbrains` → 플러그인 `syncIcons` → `CoolAccentTest`·`CoolFolderColorTest` |
| 에디터 글꼴 | **JetBrains** 기본(JetBrains Mono) + 한글 대체 글꼴 | `useJetBrainsFonts` 로 고를 때만 | IDE 기본(JetBrains Mono) | 아래 "아직 다른 것" 2 |

## 일부러 다르게 둔 것

어느 한쪽에서 **할 수 없어서** 다른 것이다. 하나를 없애려면 "할 수 없다"가 사실이 아니게 됐는지부터 확인한다.

- VS Code API 로 못 하는 것: 속이 빈 폴더, 아이콘 크기·행 높이, PSI 기반 아이콘, 폴더 경로 기반 연결, 화면(UI) 글꼴
  (`README` 에 적혀 있다).
- 소스·테스트·리소스 루트, 제외 폴더: JetBrains 쪽은 IDE 아이콘을 남긴다(폴더의 역할을 보여 주는 유일한 표시).
  VS Code 에는 그런 정보가 없다.
- 제품 아이콘 `sync`: VS Code 는 이 아이콘을 돌려서 진행 표시로 쓴다("Detecting Kernels", `$(sync~spin)`). JetBrains 의
  Update 화살표(`vcs/update`)를 돌리면 화살표가 빙빙 돌아서 새로고침 화살표(`general/refresh`)로 그린다. IDE 는 진행 표시용
  애니메이션 아이콘이 따로 있어 이 문제가 없다. Pull(`repo-pull`)은 그대로 Update 화살표다.
- 강조색이 보이는 때: VS Code 는 창 다시 로드, PyCharm 은 IDE 다시 시작(테마를 한 번만 읽는다). PyCharm 편집기 색은 구성표를
  바꾸지 않고 열린 편집기마다 바꾼다(구성표는 IDE 가 사용자 설정으로 저장해서), 그래서 사용자가 바꾼 선택·링크 색은 그대로 둔다.
- 없는 아이콘을 가리키는 연결: VS Code 는 `filesAssociations` 등의 값이 번들 아이콘도 있는 SVG 도 아니면 빈 아이콘을 그리고,
  플러그인은 그 연결을 무시해 원래 아이콘을 둔다(잘못 쓴 설정을 빈칸으로 보여 줄 이유가 없다).

## 아직 다른 것 (할 일 후보)

같은 화면에 가까워지려면 줄여야 할 차이다. 하나를 끝내면 이 목록에서 지우고 위 표나 "일부러 다르게 둔 것"으로 옮긴다.

1. **아이콘 설정**: `iconStyle`(유리/광택/평면)·`roleMarks`·`filesAssociations`·`foldersAssociations`·`languagesAssociations` 는
   플러그인에도 같은 이름으로 있다(2026-11-27. 평면 아이콘과 연결 검사용 테마는 `bun run export:jetbrains-icons` →
   `out/jetbrains-icons/`, 플러그인 `syncIcons` 가 가져감). 아이콘 색과 Material Icon Theme 층도 위 표로 옮겼다. `folderTheme`·
   `hideFileIcons` 도 같고, 플러그인 설정 화면의 "Import from VS Code" 가 VS Code `settings.json` 의 `a-file-icon-vscode.*` 를 한 번에
   가져온다. 남은 것은 `activeIconPacks`, 층의 세부(`iconThemeByName`, override 모드, 다른 테마), 연결로 생긴 역할 표시 아이콘 중
   `dist/` 에 없는 것(VS Code 는 테마를 만들 때 그리고, 플러그인은 표시 없이 준다), 그리고 VS Code 설정을 바뀔 때마다 따라가는 것
   (지금은 버튼을 눌러 가져온다).
   광택 아이콘의 크기 맞춤과, viewBox 밖 도형을 그리지 않는 유리·광택 아이콘(2026-11-27)은 플러그인에서 `syncIcons` 를 다시
   돌려야 들어간다(플러그인이 안쪽 `<svg>` 를 잘라 그리는지도 그때 PyCharm 에서 avro·factor 로 본다).
2. **한글 대체 글꼴**: VS Code 는 고르면 `JetBrains Mono` 다음에 `D2Coding` 등을 쓰고, PyCharm 은 사용자가
   Settings > Editor > Font > Fallback font 에서 직접 정한다.

## 고칠 때 규칙

- **한쪽을 바꾸면 같은 작업에서 다른 쪽을 본다.** 아이콘을 바꿨으면 `syncIcons` 까지, 색·UI 아이콘의 고정 커밋을 올렸으면
  플러그인의 대상 PyCharm 버전과 맞는지까지.
- **새 기능을 한쪽에 넣을 때** 다른 쪽에서 같은 모양을 낼 수 있는지 적는다: 할 수 있으면 "아직 다른 것"에, 할 수 없으면
  이유와 함께 "일부러 다르게 둔 것"에.
- 기준은 사용자 PyCharm 화면이다(Cool Theme Kit `CLAUDE.md` "방향"). 두 쪽이 서로 다를 때 PyCharm 을 VS Code 에 맞추지 않는다:
  JetBrains 가 원본인 부분(색·UI 아이콘·글꼴)은 VS Code 가 따라가고, Cool Icons 는 플러그인이 따라간다.
- 이름(표시 이름 "Cool Theme Kit", 아이콘 "Cool Icons", 색 "Cool Islands")은 양쪽이 같다.

## 나란히 비교하기

같은 폴더를 두 편집기에서 열어 같은 크기로 캡처해 비교한다. 폴더는 `D:\dev\sandbox\jetbrains-colors`(언어별 샘플)나
Cool Theme Kit 의 `test/colors`.

- VS Code: VSIX 를 격리 프로필에 설치해 연다(Cool Theme Kit `CLAUDE.md` "확인 방법", `--shared-data-dir` 필수).
  캡처는 `--remote-debugging-port` + CDP.
- JetBrains: 플러그인 폴더에서 `./gradlew runIde -PrunIdeProject=<폴더>`(샌드박스 IDE, 사용자 PyCharm 설정은 그대로).
  다른 아이콘 플러그인(Atom Material Icons)이 없는 상태가 기준이다.
