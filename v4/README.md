# 세종문화회관 v4

v3 전체를 복사한 독립 버전입니다. 기존 138개 경로를 보존하고 방문 계획과 대관 공간 비교를 더해 140개 콘텐츠 경로를 제공합니다.

## 실행

저장소 루트에서 `python -m http.server 8764 --bind 127.0.0.1` 실행 후 `http://127.0.0.1:8764/v4/index.html`을 여세요. 루트 버전 선택에서도 진입할 수 있습니다. 앱은 HTML/CSS/JavaScript ES modules이며 빌드나 앱 의존성 설치가 필요 없습니다.

## 주요 화면

- 홈: 히어로, 빠른 예매, 프로그램 발견, 방문 안내, 소식과 참여, 기관 정체성의 6개 영역.
- 빠른 예매: 날짜·프로그램·회차·인원을 선택해 공연/전시 예매 또는 교육 신청으로 전달. 작은 화면에는 기본 날짜 입력 사용.
- 방문 계획 `#/visit/plan`: 일정과 교통·접근성에 맞춘 준비 순서, 주소 공유, 브라우저 저장.
- 공간 비교 `#/rental/compare`: 최대 세 공간의 규모·장비 비교, 일정 및 대관 신청 연결.
- 소개 `#/about`: 큰 문장과 세종의 실제 사진, 공간 선택, 예술단·역사·천지인·참여로 이어지는 구성.
- 통합검색 `#/search`: 제목·콘텐츠·동의어 검색과 분류. 굿즈·계정·기존 신청 기능 보존.

## 자료와 구조

`src/app.js`가 hash 경로를 분배하며 각 기능은 `src/features/`에 있습니다. 새 스타일은 `experience.css`, `home-v4.css`, `story.css`, `journeys.css`가 담당합니다. 기존 모션 수명 관리와 기본 입력을 유지하고 모션 감소 설정을 지원합니다. 방문자 데이터는 `sejong-v4:` 이름으로 분리합니다.

- [전체 복사 증거](docs/sources/copy-verification.json)
- [참고 사이트 관찰과 한계](docs/sources/reference-motion-evidence.md)
- [검증 기록](docs/verification-2026-10-16.md)
- 원본 Figma/PPTX 분석: 저장소 `.codex/analysis-v4/`
- 보존된 중첩 v2/v3·스킬 아카이브는 원본 복사본입니다. 현재 실행 파일은 이 디렉터리의 `index.html`과 `src/`입니다.

## 검사

저장소 루트에서 최종 Node 검사:

```powershell
node --test tests/*.test.mjs v2/tests/*.test.mjs v3/tests/*.test.mjs v4/tests/*.test.mjs
```

브라우저 검사는 Playwright와 Chrome이 있는 환경에서 실행합니다. `SEJONG_TEST_URL`은 위 v4 주소, `CHROMIUM_PATH`는 브라우저 실행 파일입니다. 앱 자체에는 이 도구들이 필요하지 않습니다.

```powershell
node v4/tests/site-browser.cjs
node v4/tests/home-v4.cjs
node v4/tests/story-browser.cjs
$env:SEJONG_JOURNEYS_BROWSER='1'
node --test v4/tests/journeys.test.mjs
```

실제 결제·좌석 확보·기관 접수는 없는 비공식 체험입니다. 프로그램 날짜·회차·요금은 시연 자료입니다. 예매·신청·저장 내역은 현재 브라우저에 보관합니다.
