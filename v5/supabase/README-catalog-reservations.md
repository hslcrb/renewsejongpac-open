# 콘텐츠와 좌석 예약 운영 / Catalog and reservation operations

`20261023013321_catalog_reservations.sql`은 기존 회원 테이블 이후에 적용합니다. `catalog-seed.sql`은 이전 콘텐츠를 최초 이관하는 명시적 관리 작업입니다. 일반 빌드는 seed를 실행하지 않고 공개 DB의 `sejong_catalog_snapshot()`만 읽습니다. DB 조회에 실패하면 snapshot CLI는 실패하며 기존 파일로 성공을 가장하지 않습니다.

## 이관과 게시

- `node scripts/catalog/import-legacy.ts`는 보존 원본 `legacy-source.json`과 페이지 원고를 SQL로 변환합니다. 같은 입력을 다시 적용하면 revision과 checksum이 그대로 유지됩니다. 다른 입력은 DB의 기존 편집 내용을 바꿀 수 있으므로 자동 빌드에 연결하지 않습니다.
- 원본의 임의 가격·회차·관람연령·소요시간과 다른 작품의 포스터 매핑은 공개 데이터에서 제거했습니다. 원본 전체는 `sejong_private.content_revisions`에 보존됩니다. 게시 변경은 revision trigger가 기록합니다.
- 기존 40석 배치는 `legacy-grid`라는 검증되지 않은 좌석도로만 보존됩니다. 예약을 활성화하려면 프로그램, 회차, 좌석도의 출처를 검증하고 실제 `session_seats.price`를 등록해야 합니다.
- 브라우저는 기존 정적 경로에 대응하는 ID만 새로 읽습니다. 새 프로그램·시설·공지·페이지 경로를 공개하려면 DB snapshot으로 다시 빌드해야 합니다.
- `node --env-file=.env.local scripts/catalog/snapshot.ts`는 공개 키만 사용합니다. 서비스 역할 키를 브라우저나 snapshot 파일에 넣지 않습니다.

## 예약 상태와 동시성

`held`는 5분, `reserved_unpaid`는 확인 후 30분입니다. 만료한 점유는 inventory 조회, 회원 예약 조회, 보류·확인·취소 요청에서 서버 시각으로 정리합니다. 결제 승인, 발권, 환불 상태는 구현 범위에 포함하지 않습니다.

모든 쓰기는 회차 행을 먼저 잠그고, 좌석을 ID 순서로 잠급니다. 한 요청의 좌석이 모두 비어 있어야 성공하며 회원별 동일 회차의 유효 보류·예약 합계는 4석 이하입니다. 소유권은 `auth.uid()`에서 결정하고 제목·가격·장소는 DB에서 복사합니다. 브라우저의 예약 테이블 직접 쓰기는 금지됩니다. 공개 좌석 RPC는 소유자 ID와 예약 ID를 반환하지 않습니다.

hold와 confirm에는 별도 키와 payload fingerprint가 있습니다. 같은 키와 같은 선택의 재요청은 현재 상태를 반환하며 만료 시각을 늘리지 않습니다. 다른 선택으로 키를 재사용하면 `IDEMPOTENCY_CONFLICT`가 반환됩니다.

## 검증

`node scripts/catalog/local-sql-check.ts`는 `.lemonade/postgres/portable/pgsql/bin`의 PostgreSQL 실행 파일을 사용합니다. localhost 55439에서 일회용 DB와 최소 Auth stub을 만들고 회원·콘텐츠 migration, seed 두 번, `tests/reservations.sql`, 실제 별도 연결 100개의 좌석 보류와 100개의 확인 재요청을 실행합니다. 완료 후 검증 DB를 삭제합니다. 토큰이나 운영 DB에는 접근하지 않습니다.

`tests/reservations.sql`은 전체 테스트를 transaction/rollback으로 감쌉니다. 실패 주입으로 예약 헤더·좌석 항목·점유가 함께 롤백되는지, RLS 소유권, 직접 쓰기 금지, 익명 권한, 누적 제한, 중복 키와 서버 만료를 검증합니다.

실제 PostgREST HTTP 확인에는 `scripts/catalog/concurrency-check.ts`를 사용할 수 있습니다. 두 테스트 계정의 JWT와 명시적인 `test-` 회차·좌석을 환경 변수로 받아 100 HTTP hold와 100 confirm을 검증하고 자신의 성공 예약을 취소합니다. 실제 관객의 회차나 좌석을 테스트 대상으로 사용하지 않습니다.

## 쓰기 중단과 복구

운영 rollback은 기존 예약을 삭제하지 않고 새 보류·확인 권한부터 중단하는 방식으로 수행합니다. 아래 SQL은 검토 후 수동으로 실행하는 운영 조치입니다. 취소와 내역 조회는 유지합니다.

```sql
begin;
revoke execute on function public.hold_seats(text,text[],uuid), public.confirm_reservation(uuid,uuid) from authenticated;
revoke execute on function sejong_private.hold_seats(text,text[],uuid), sejong_private.confirm_reservation(uuid,uuid) from authenticated;
commit;
```

복구할 때는 검증을 통과한 함수에 동일한 `grant execute ... to authenticated`를 적용합니다. 콘텐츠 자체를 되돌릴 때는 비공개 revision과 DB 백업을 검토하고 필요한 행만 정상 UPDATE로 복원하여 새 revision을 남깁니다. 운영 데이터가 생긴 후 테이블을 삭제하거나 기존 회원 migration으로 무조건 되돌리지 않습니다.

## Advisor 검토 기록

`20261023015030_catalog_reservation_indexes.sql`은 새 콘텐츠·예약 테이블의 FK 12개에 covering index를 추가합니다. `sejong_seat_plans`, `sejong_venue_seats`, `sejong_session_seats`와 비공개 `content_revisions`의 RLS 정책 없음 알림은 의도한 기본 거부입니다. 좌석 정보는 제한된 inventory RPC로만 공개하고 revision은 일반 회원·익명에게 공개하지 않습니다. `sejong_booking_items`는 자기 예약의 항목만 SELECT하는 정책이 있습니다.

기존 프로젝트의 `rls_auto_enable` SECURITY DEFINER 경고와 leaked-password protection 설정은 이번 변경에서 생성하지 않은 기존 항목입니다. 이번 migration은 해당 함수·설정을 변경하지 않습니다.
