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
| 이름 맞추기 | VS Code 아이콘 테마 규칙 | VS Code | `CoolIcons`(파일 이름 → 긴 확장자부터 → 언어 → 기본, NFC + 소문자) | 규칙을 바꾸면 양쪽 코드와 테스트를 같이 |
| 색 테마(UI·문법) | **JetBrains** Islands Dark/Light (`intellij-community` 고정 커밋, `themes/jetbrains-source.json`) | Cool Islands Dark/Light (`sync:colors`) | IDE 내장 Islands 그대로 | 고정 커밋은 플러그인의 대상 PyCharm(`gradle.properties` `platformVersion`)과 같은 버전대로 올린다 |
| UI(제품) 아이콘 | **JetBrains** New UI 아이콘 | Cool Islands Icons (`build:product-icons`) | IDE 내장 | 같은 고정 커밋 |
| 에디터 글꼴 | **JetBrains** 기본(JetBrains Mono) + 한글 대체 글꼴 | `useJetBrainsFonts` 로 고를 때만 | IDE 기본(JetBrains Mono) | 아래 "아직 다른 것" 4 |

## 일부러 다르게 둔 것

어느 한쪽에서 **할 수 없어서** 다른 것이다. 하나를 없애려면 "할 수 없다"가 사실이 아니게 됐는지부터 확인한다.

- VS Code API 로 못 하는 것: 속이 빈 폴더, 아이콘 크기·행 높이, PSI 기반 아이콘, 폴더 경로 기반 연결, 화면(UI) 글꼴
  (`README` 에 적혀 있다).
- 소스·테스트·리소스 루트, 제외 폴더: JetBrains 쪽은 IDE 아이콘을 남긴다(폴더의 역할을 보여 주는 유일한 표시).
  VS Code 에는 그런 정보가 없다.
- 펼친 폴더 아이콘: VS Code 는 펼친 모양이 따로 있고, JetBrains New UI 는 펼침을 아이콘으로 구분하지 않는다
  (`syncIcons` 는 `folderNamesExpanded` 를 복사하지 않는다).

## 아직 다른 것 (할 일 후보)

같은 화면에 가까워지려면 줄여야 할 차이다. 하나를 끝내면 이 목록에서 지우고 위 표나 "일부러 다르게 둔 것"으로 옮긴다.

1. **강조색**: VS Code 는 `accentColor`(대상 `controls`·`tabs`·`folders`, 프리셋), JetBrains 쪽은 Islands 파랑 고정.
   사용자 PyCharm 은 Material Theme UI 의 연두가 얹혀 있다(2026-11-19 확인).
2. **아이콘 설정**: VS Code 는 `iconStyle`(유리/평면)·`roleMarks`·폴더 색·채도·불투명도·단색을 고를 수 있고, 플러그인은
   기본값으로 만든 아이콘 한 벌만 가진다.
3. **모르는 이름**: VS Code 는 기본 섞기 층(`iconThemeLayers` = Material Icon Theme)이 Cool Icons 가 모르는 이름을 채우고,
   플러그인은 기본 파일 아이콘을 준다.
4. **한글 대체 글꼴**: VS Code 는 고르면 `JetBrains Mono` 다음에 `D2Coding` 등을 쓰고, PyCharm 은 사용자가
   Settings > Editor > Font > Fallback font 에서 직접 정한다.
5. **언어 id**: 아이콘 테마의 `languageIds` 는 VS Code 언어 id(`typescriptreact`)인데 플러그인은 JetBrains
   `Language.getID()`(소문자로 비교)를 넣는다. 둘이 다른 언어는 확장자 규칙에 맡겨진다. 차이가 나는 이름이 있는지 확인이 필요하다.

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
