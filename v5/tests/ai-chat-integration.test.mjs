import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("independent AI backend preserves Next static export", () => {
  assert.match(read("../next.config.mjs"), /output:\s*'export'/);
  assert.match(read("../chat-service/server.mjs"), /createServer\(/);
  assert.doesNotMatch(read("../app/layout.tsx"), /api\/ai-chat/);
});
test("secrets stay on server and guest storage uses AES-GCM", () => {
  const ui = read("../components/AiChatWidget.tsx");
  const server = read("../chat-service/server.mjs");
  assert.doesNotMatch(ui, /(?:GROQ_API_KEY|MISTRAL_API_KEY|SERVICE_ROLE_KEY)/);
  assert.match(server, /GROQ_API_KEY/);
  assert.match(server, /MISTRAL_API_KEY/);
  assert.match(server, /CHAT_ENCRYPTION_KEY/);
  assert.match(read("../src/lib/guest-chat-storage.ts"), /AES-GCM/);
  assert.match(read("../components/SiteShell.tsx"), /<AiChatWidget\s*\/>/);
});
