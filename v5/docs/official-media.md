# 공식 이미지 출처

현재 v5의 공연·전시·교육 이미지와 공간 사진은 세종문화회관 공식 자료를 사용합니다.
로컬 원본의 URL, 공식 소개 페이지, 이미지 설명, SHA-256은
[`official-media.ts`](../src/data/official-media.ts)에 기록했습니다.
`node scripts/sync-official-media.ts`로 원본을 확인하거나 다시 받을 수 있습니다.

- 공연 자료: [2025 세종시즌](https://www.sejongpac.or.kr/season/season2025/seasonProgram.do)
- 일무 포스터와 공연 사진: [공식 공연 상세](https://www.sejongpac.or.kr/portal/performance/performance/performTicket.do?menuNo=200320&performIdx=35922)
- 대극장: [공식 공간 소개](https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200358)
- M씨어터·체임버홀·S씨어터·미술관: 공간 소개의 해당 시설 페이지

원본은 재가공하지 않았으며, 화면에서는 비율을 유지해 배치합니다.
기존 시연 일정과 프로그램명은 유지합니다. 장르별 자료 사진이 해당 시연 작품의 포스터로
오인되지 않도록 대체 텍스트에는 공식 자료의 실제 설명을 사용합니다.
공식 외관·객석 사진과 로고의 기존 출처는 `public/assets/images/README.txt`에 있습니다.
보존된 legacy 화면과 이전 버전 스냅샷은 이 교체의 대상이 아닙니다.
