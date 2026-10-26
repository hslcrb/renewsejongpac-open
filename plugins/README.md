# Third-party plugin assets / 플러그인 보관함

**상태: VENDORED / NOT CONNECTED (2026-10-26)**

이 디렉터리의 플러그인은 배포용 정적 파일과 라이선스 원본만 저장합니다. 현재 페이지·Next.js·HTML·CSS 어디에도 플러그인을 `import`/초기화/연결하지 않습니다. 라이브러리를 사용하려면 별도의 변경·검증·승인이 필요합니다.

| Plugin | Version | Files | Runtime |
| --- | --- | --- | --- |
| [Swiper](swiper/) | 12.2.0 | `swiper-bundle.min.js`, `swiper-bundle.min.css`, `LICENSE` | Disabled |
| [AOS](aos/) | 2.3.2 | `aos.js`, `aos.css`, `LICENSE` | Disabled |

`plugins/swiper/`는 동일 소유자의 [firstclass 내 배포 아티팩트](https://github.com/hslcrb/firstclass/tree/main/plugins/swiper)를 출처로 사용하며 공식 Swiper MIT 라이선스를 포함합니다. `plugins/aos/`는 [michalsnik/aos](https://github.com/michalsnik/aos)의 `master/dist` 배포 파일입니다. 원본은 수정하지 않았고 해시 검증이 가능한 Git blob으로 저장했습니다.

> Swiper 번들 끝의 sourceMappingURL은 상위 번들의 기본 주석이며 소스맵 파일은 원본 firstclass 경로에 없습니다. 실제 실행 자산(JS/CSS)은 완비되어 있습니다. 프로덕션 연결은 별도 작업으로 진행하세요.

## 추후 연결 지침

1. 별도 `chatgpt-extrahigh/` 작업 브랜치를 만듭니다.
2. 라이선스와 현재 버전을 다시 확인합니다.
3. 필요한 페이지에서 해당 에셋만 선택적으로 로드합니다. 기존 캐러셀이나 스크롤 모션을 무조건 교체하지 마세요.
4. 접근성·성능·motion-reduced·반응형 테스트를 통과한 뒤 PR로 병합합니다.

아카이브 및 v2/v3/v4/v5 기존 UI 실행 코드는 현재 그대로 유지합니다.
