#!/usr/bin/env node
/**
 * docs/AI_CONTEXT.md 내 placeholder를 갱신합니다.
 * - <!-- INJECT: path --> ... <!-- END INJECT --> → 해당 path 파일 내용으로 치환
 * - <!-- PACKAGE_VERSION --> → root package.json version
 * - <!-- LAST_UPDATED --> → 현재 ISO 날짜
 *
 * 사용: node scripts/update-ai-context.mjs (또는 pnpm update:ai-context)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");
const docPath = join(root, "docs", "AI_CONTEXT.md");

const INJECT_PATHS = [
  "docs/architecture/architecture.md",
  "docs/history/branding/brand-identity.md",
  "docs/ai-context-extra.md",
];

function injectOne(doc, relPath) {
  const fullPath = join(root, relPath);
  let content;
  try {
    content = readFileSync(fullPath, "utf8").trimEnd();
  } catch (err) {
    console.warn("Warning: could not read %s: %s", relPath, err.message);
    return doc;
  }
  // 경로 이스케이프 없이 블록만 매칭; INJECT~END 사이 빈 줄 유무 모두 허용
  const blockRegex =
    /(<!-- INJECT: )([^\s]+)( -->\r?\n)([\s\S]*?)(\r?\n?<!-- END INJECT -->)/g;
  const safeContent = content.replace(/\$/g, "$$");
  let replaced = false;
  const next = doc.replace(
    blockRegex,
    (match, open, path, afterOpen, _middle, close) => {
      if (path !== relPath) return match;
      replaced = true;
      return `${open}${path}${afterOpen}${safeContent}${close}`;
    },
  );
  if (!replaced) {
    const warnRe =
      /(?:<!-- INJECT: )([^\s]+)(?: -->\r?\n[\s\S]*?\r?\n?<!-- END INJECT -->)/g;
    const found = [...doc.matchAll(warnRe)].map((m) => m[1]);
    console.warn(
      "Warning: no match for INJECT block: %s (found paths: %s)",
      relPath,
      found.join(", ") || "none",
    );
  }
  return next;
}

function injectSections(doc) {
  for (const relPath of INJECT_PATHS) {
    doc = injectOne(doc, relPath);
  }
  return doc;
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const version = pkg.version ?? "(unknown)";
const now = new Date().toISOString().slice(0, 10);

let doc = readFileSync(docPath, "utf8");
doc = injectSections(doc);
doc = doc.replace("<!-- PACKAGE_VERSION -->", version);
doc = doc.replace("<!-- LAST_UPDATED -->", now);

writeFileSync(docPath, doc, "utf8");
console.log("Updated docs/AI_CONTEXT.md: version=%s, date=%s", version, now);
