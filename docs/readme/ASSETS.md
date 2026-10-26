# 문서 자산 출처 / Documentation asset provenance

문서의 둥근 타일은 프로젝트의 웜 화이트·옅은 안쪽 경계를 사용합니다. 내부 로고는 공식 SVG의 도형·색상·비율을 바꾸지 않고 여백 안에 배치했습니다. 로고는 사용 기술을 설명합니다.

Rounded tiles use the project palette. The official logo geometry, colors and proportions are preserved with surrounding clear space; they identify the technologies used.

| 파일 / File | 출처 / Source | 처리 / Treatment |
| --- | --- | --- |
| `brand/supabase.svg` | [Supabase 공식 브랜드 페이지](https://supabase.com/brand-assets), [공식 ZIP](https://supabase.com/brand-assets.zip)의 `brand-assets/supabase-logo-icon.svg` | 원본 / Original |
| `brand/vercel.svg` | [Vercel 공식 브랜드 페이지](https://vercel.com/geist/brands), [공식 ZIP](https://k2mkucxia43oc7fa.public.blob.vercel-storage.com/front/press/vercel-assets.zip)의 `Vercel/icon/light/vercel-icon-light.svg` | 원본 / Original |
| `favicon-tile.svg` | [실제 v5 파비콘](../../v5/public/assets/favicon.svg) | 같은 파비콘을 배치 / Same favicon in a tile |
| `supabase-tile.svg`, `vercel-tile.svg` | 위 원본 / Originals above | 88×88px, 곡률 22px 타일 / Rounded tiles |
| `system-overview.svg` | 저장소 구현을 바탕으로 직접 작성 / Authored from this repository | 스크립트 없는 SVG 링크·fragment·CSS / Script-free links, fragments and CSS |
| 설명도의 내장 글꼴 / Embedded font | [프로젝트의 Wanted Sans Variable](../../v5/public/assets/fonts/woff2/WantedSansVariable.woff2), [공식 SIL OFL 1.1 원본](https://github.com/wanteddev/wanted-sans/blob/main/OFL.txt), [동봉한 라이선스](brand/WantedSans-OFL.txt) | 원본 WOFF2를 SVG에 내장 / Original WOFF2 embedded in the SVG |

로고 원본은 해당 브랜드의 권리와 사용 지침을 따릅니다. 프로젝트의 일반 색상 토큰으로 로고 자체를 재색칠하지 않습니다.

Brand marks remain subject to their respective usage guidelines and are not recolored with project tokens.

## 재생성 / Regenerate

저장소 루트에서 실행합니다. 생성기는 [제품 토큰](../../v5/src/data/design-tokens.ts), 공식 로고, 실제 파비콘을 읽습니다. 외부 폰트·이미지·스크립트 요청은 생성 SVG에 없습니다.

Run from the repository root. The generator reads product tokens, official marks and the existing favicon. Generated SVGs are self-contained.

```powershell
node v5/scripts/render-readme-assets.ts
node v5/scripts/render-readme-assets.ts --check
```

구조도는 원본 글꼴을 내장하므로 약 1.8MB입니다. 별도의 폰트 처리 도구 없이 Node.js 생성기만으로 재생성할 수 있습니다. GitHub 이미지와 독립 문서에서 외부 요청 없이 같은 한글 서체를 사용합니다.

The diagram is approximately 1.8MB because it embeds the original font. Regeneration needs only Node.js, with no font-processing tool or external font request.

GitHub에서는 SVG가 이미지로 표시돼 내부 링크를 직접 누를 수 없습니다. README의 그림 링크로 독립 문서를 열면 흐름 선택·키보드 조작·모션 정지를 사용할 수 있습니다. [브라우저의 SVG 이미지 제약 / Browser restrictions](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image)
