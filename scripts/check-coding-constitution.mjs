#!/usr/bin/env node
/**
 * 코딩헌법규정 v1.0.0 — 신규 커밋 제목 검사기, Node 18+ (외부 의존성 없음).
 * node scripts/check-coding-constitution.mjs --subject "**docs/demo** docs: 문서 형식 검증"
 * node scripts/check-coding-constitution.mjs --range origin/main..HEAD [--advisory]
 */
import { execFileSync } from "node:child_process";
export const ALLOWED_TYPES = Object.freeze(["feat","fix","refactor","style","docs","test","chore","build","ci","perf","security","deps","backup","revert","release","merge"]);
const SUBJECT_RE = /^\*\*([^\s*]+)\*\* ([a-z]+)(?:\(([a-z0-9._/-]+)\))?(!)?: (\S.*)$/u;
export function validateSubject(subject, expectedBranch = null) {
  const matched = SUBJECT_RE.exec(String(subject ?? "").trim());
  if (!matched) return {ok:false, reason:"형식 오류: **<브랜치>** type(scope): 구체적인 한국어 설명"};
  const [, branch, type, , , description] = matched;
  if (!ALLOWED_TYPES.includes(type)) return {ok:false,reason:"비허용 접두사: "+type};
  if (description.length < 4 || !/[가-힣]/u.test(description)) return {ok:false,reason:"한국어 설명 4자 이상 필요"};
  if (expectedBranch && expectedBranch !== branch) return {ok:false,reason:"작업 브랜치와 제목 표기가 다름"};
  return {ok:true};
}
function option(args,flag) { const index=args.indexOf(flag);return index<0?null:(args[index+1]??null); }
function main(){
  const args=process.argv.slice(2), advisory=args.includes("--advisory");
  const subject=option(args,"--subject"), range=option(args,"--range"), expected=option(args,"--expected-branch");
  if(Boolean(subject)===Boolean(range)){console.error("usage: --subject <title> | --range <base..head> [--advisory]");process.exitCode=2;return;}
  let commits;
  if(subject) commits=[{hash:"direct",subject}];
  else{
    if(!/^[a-zA-Z0-9_.\/-]+\.\.[a-zA-Z0-9_.\/-]+$/u.test(range)){console.error("Unsafe revision range");process.exitCode=2;return;}
    try{
      commits=execFileSync("git",["log","--no-merges","--format=%H%x09%s","--reverse",range],{encoding:"utf8",maxBuffer:10485760})
        .split(/\r?\n/u).filter(Boolean).map(row=>{const i=row.indexOf("\t");return {hash:row.slice(0,i),subject:row.slice(i+1)};});
    }catch(error){console.error("Git range unavailable:",error.message);process.exitCode=2;return;}
  }
  let invalid=0;
  for(const {hash,subject:msg} of commits){const result=validateSubject(msg,expected);if(!result.ok){invalid++;console.error("[FAIL]",hash.slice(0,12),result.reason,"::",msg);}}
  console.log("[coding-constitution] inspected="+commits.length+", invalid="+invalid+", mode="+(advisory?"advisory":"strict"));
  if(invalid&&!advisory)process.exitCode=1;
}
if(process.argv[1]&&/check-coding-constitution\.mjs$/u.test(process.argv[1]))main();
