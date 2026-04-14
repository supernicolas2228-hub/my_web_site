#!/usr/bin/env node
/**
 * Собирает content/reviews/*.md|txt → data/reviews.json (один источник для бандла).
 * Запускается перед next build / next dev — на сервере во время работы сайта fs к папке не нужен.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REVIEWS_DIR = path.join(ROOT, "content", "reviews");
const OUT = path.join(ROOT, "data", "reviews.json");

const DEFAULT = [
  {
    id: "01-mariya-salon",
    author: "Мария, сеть салонов красоты",
    body:
      "Заказывали лендинг под акцию и запись онлайн. Сроки выдержали, правки вносили быстро. После запуска стало проще собирать заявки из соцсетей — рекомендую, если нужен понятный результат без лишней возни."
  },
  {
    id: "02-aleksey-opt",
    author: "Алексей, оптовые поставки",
    body:
      "Нужен был простой каталог с формой «запросить прайс». Сделали аккуратно, на телефоне всё читается, клиенты перестали теряться в переписке. Отдельное спасибо за то, что объяснили, что к чему, без «магии»."
  },
  {
    id: "03-studio-startup",
    author: "Команда небольшого стартапа",
    body:
      "Искали подрядчика на первую версию продукта: визитка + пару экранов с описанием и кнопкой. Получилось ровно то, что обещали на старте, без раздувания бюджета. Если понадобится развивать дальше — вернёмся."
  }
];

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

function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  if (!fs.existsSync(REVIEWS_DIR)) {
    fs.writeFileSync(OUT, JSON.stringify(DEFAULT, null, 2), "utf-8");
    console.log("sync-reviews: нет content/reviews → data/reviews.json (дефолт)");
    return;
  }

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

  const final = records.length > 0 ? records : DEFAULT;
  fs.writeFileSync(OUT, JSON.stringify(final, null, 2), "utf-8");
  console.log(`sync-reviews: ${final.length} отзыв(ов) → data/reviews.json`);
}

main();
