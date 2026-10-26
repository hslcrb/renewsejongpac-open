# 세종 AI 상담 연결

Deep Chat (MIT) UI를 기존 Next.js 정적 빌드 v5 셸 우측 하단에 등록합니다. Groq → Mistral 서버 자동 폴백. **API는 v5/chat-service/server.mjs 를 별도 Node.js 20+ 호스트(HTTPS)에 배포해야 합니다.** 키는 서버 전용입니다. 정적 Next 빌드는 기존과 동일하게 유지합니다.

## 구성
```env
NEXT_PUBLIC_AI_CHAT_API_URL=https://YOUR-API-HOST.example/api/ai-chat\nALLOWED_ORIGIN=https://renewsejongpac.rhee.life\nPORT=8787\nSUPABASE_URL=\nSUPABASE_ANON_KEY=\nGROQ_API_KEY=
MISTRAL_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
MISTRAL_MODEL=mistral-small-latest
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CHAT_ENCRYPTION_KEY=
```

`CHAT_ENCRYPTION_KEY`는 32-byte 랜덤 키의 64자리 hex 값입니다 (`openssl rand -hex 32`). 절대 커밋하거나 공개하지 마세요. 서버 DB 기록은 `supabase/migrations/20261026_ai_chat_histories.sql`을 운영 DB에 적용한 뒤 활성화합니다. 배포 후에는 서버 환경변수로만 설정합니다. `NEXT_PUBLIC_AI_CHAT_API_URL`은 정적 사이트 **빌드 환경 변수**, 나머지 비밀 값과 `ALLOWED_ORIGIN`은 채팅 API 서버 런타임 환경 변수입니다. API는 `cd v5 && node chat-service/server.mjs`로 기동합니다. 운영에는 HTTPS 역방향 프록시를 설정하세요.

### 저장
- 로그인: 실제 Supabase 세션 검증 후 사용자 ID로 구분하여 **서버에서 AES-256-GCM 암호화**한 대화 최대 40개를 DB에 보관합니다. DB 자격증명/암호화 키가 없는 경우 원격 기록은 비활성화됩니다.
- 비로그인: 브라우저 Web Crypto AES-GCM으로 암호화한 텍스트를 localStorage에, 내보낼 수 없는 CryptoKey를 IndexedDB에 보관합니다. 같은 출처에서 실행되는 악성 JS/XSS는 키를 사용할 수 있으므로 E2E 암호화가 아닙니다.
- 브라우저 데이터를 삭제하면 비회원 기록도 없어질 수 있습니다. DB 측 별도 삭제/보존 정책은 운영 전 설정하세요.
- AI 상담은 예약 확정/개인정보 입력 채널이 아닙니다.

### 운영 주의사항
서버의 간단한 메모리 요청량 제한 외에도 프록시/CDN/WAF에서 분산 요청량 제한을 추가로 적용해야 합니다. 배포 전에 개인정보 처리방침, AI 대화 데이터 보존 및 삭제 정책, 장애 모니터링과 비용 상한을 정하고 보호 대책을 검토하세요. 이 패치는 프로덕션 비밀키를 생성·적용하지 않습니다.
