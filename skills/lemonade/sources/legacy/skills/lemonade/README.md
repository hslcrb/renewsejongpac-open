# lemonade / 레모네이드

기본 스킬은 [SKILL.md](SKILL.md)다. 큰 이미지를 확대해 정보 구조를 읽고, 역할과 콘텐츠에 맞는 구성을 선택한다.
사용자의 레퍼런스·브랜드·동작·접근성이 스타일 프리셋보다 우선한다.

- [원본 분석](references/wireframe.md): 8개 섹션 역할과 개별 조사 창.
- [관찰 사례](library/reference-cases.json): 12개 GDWEB 정적 캡처의 관찰·대조·접속 제한.
- [갱신 절차](references/learning-loop.md): 실패와 반례로 규칙을 개선하는 방법.
- [현재 평가 시나리오](evals/reference-evals.json): 한국 공연장·기존 브랜드·작은 수정·큰 이미지.

```bash
node scripts/references.mjs --role quick-access
node scripts/draw.mjs --list roles
node scripts/assets.mjs --help
node scripts/lint.mjs <project> --profile reference
node scripts/inspect.mjs <url-or-html> --profile reference --widths 1440,768,390
```

도구 경로는 프로젝트에서 이 스킬의 실제 경로로 지정한다. 기본 검사 프로필 `reference`는 스타일을 검토 사항으로,
실제 깨짐·대비 오류를 수정 대상으로 분리한다. `house`는 이전 엄격한 스타일 비교가 필요할 때 명시한다.
작업 산출물은 프로젝트 `.lemonade/`에 저장한다. 스크립트는 Node, inspector는 Chrome/Edge/Chromium이 필요하다.
원본·브라우저·네트워크가 없으면 미확인 내용을 보고한다. 패키지는 Git 리모트나 자동 업데이트 연결을 만들지 않는다.

기존 연구는 247개 연구 주장과 181개 번들 자료를 구분한다. 이번 12개 GDWEB 검토는 별도 관찰이며
라이브 모바일·사용성·전환율 검증을 뜻하지 않는다. 설치와 14개 스킬 목록은 [루트 README](../../README.md)에 있다.
