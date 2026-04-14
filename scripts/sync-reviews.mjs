#!/usr/bin/env node
/**
 * 1) Тянет отзывы из публичной папки «Все отзывы» на Яндекс.Диске (внутри портфолио) — .docx.
 * 2) Иначе — content/reviews/*.md|txt
 * Пишет data/reviews.json для бандла Next.js.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REVIEWS_DIR = path.join(ROOT, "content", "reviews");
const OUT = path.join(ROOT, "data", "reviews.json");

/** Публичная ссылка на корень «Портфолио» (как на сайте). */
const YANDEX_PORTFOLIO_PUBLIC =
  process.env.YANDEX_PORTFOLIO_PUBLIC?.trim() || "https://disk.yandex.ru/d/ZDM9-AR8LwjYWw";
/** Папка с отзывами внутри шаринга. */
const YANDEX_REVIEWS_FOLDER = "/Все отзывы";

function isReviewFile(name) {
  const lower = name.toLowerCase();
  if (lower.startsWith("readme")) return false;
  if (lower.startsWith("_")) return false;
  return lower.endsWith(".md") || lower.endsWith(".txt");
}

function parseReviewRaw(raw, id) {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) return { id, author: "Клиент", body: "" };
  const lines = text.split(/\r?\n/);
  const first = (lines[0] ?? "").trim();
  const second = (lines[1] ?? "").trim();

  if (second === "" && lines.length > 2) {
    const body = lines.slice(2).join("\n").trim();
    return { id, author: first || "Клиент", body: body || first };
  }

  return { id, author: "Клиент", body: text };
}

function slugId(name) {
  return (
    name
      .replace(/\.(docx|DOCX|md|txt)$/i, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\-\u0400-\u04FFa-zA-Z0-9]/g, "")
      .slice(0, 80) || "review"
  );
}

async function fetchYandexFolder(publicKey, folderPath) {
  const params = new URLSearchParams({
    public_key: publicKey,
    path: folderPath,
    limit: "100"
  });
  const url = `https://cloud-api.yandex.net/v1/disk/public/resources?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Yandex API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

async function docxToText(buffer) {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value.replace(/\r\n/g, "\n").trim();
}

async function syncFromYandex() {
  const data = await fetchYandexFolder(YANDEX_PORTFOLIO_PUBLIC, YANDEX_REVIEWS_FOLDER);
  const items = data?._embedded?.items ?? [];
  const docxFiles = items.filter(
    (it) => it.type === "file" && /\.docx$/i.test(it.name || "") && it.file
  );
  docxFiles.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ru"));

  const records = [];
  for (const it of docxFiles) {
    const downloadUrl = it.file;
    const res = await fetch(downloadUrl);
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    let body = "";
    try {
      body = await docxToText(buf);
    } catch {
      continue;
    }
    if (!body.length) continue;
    const baseName = (it.name || "").replace(/\.docx$/i, "");
    records.push({
      id: slugId(it.name || "review"),
      author: baseName || "Отзыв",
      body
    });
  }
  return records;
}

function syncFromLocalMarkdown() {
  if (!fs.existsSync(REVIEWS_DIR)) return [];
  const names = fs.readdirSync(REVIEWS_DIR).filter(isReviewFile);
  names.sort((a, b) => a.localeCompare(b, "ru"));
  const records = [];
  for (const name of names) {
    const id = name.replace(/\.(md|txt)$/i, "");
    const full = path.join(REVIEWS_DIR, name);
    const raw = fs.readFileSync(full, "utf-8");
    const r = parseReviewRaw(raw, id);
    if (r.body.length) records.push(r);
  }
  return records;
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  let final = [];
  let source = "";

  if (process.env.SKIP_YANDEX_REVIEWS === "1") {
    console.log("sync-reviews: SKIP_YANDEX_REVIEWS=1");
  } else {
    try {
      final = await syncFromYandex();
      if (final.length) source = "Яндекс.Диск «Все отзывы»";
    } catch (e) {
      console.warn("sync-reviews: Яндекс —", e.message || e);
    }
  }

  if (!final.length) {
    final = syncFromLocalMarkdown();
    if (final.length) source = "content/reviews";
  }

  fs.writeFileSync(OUT, JSON.stringify(final, null, 2), "utf-8");
  console.log(
    `sync-reviews: ${final.length} отзыв(ов) → data/reviews.json` + (source ? ` (${source})` : "")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
