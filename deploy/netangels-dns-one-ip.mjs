#!/usr/bin/env node
/**
 * NetAngels: выровнять все A-записи для корня домена и www на один IPv4 (сценарий «один VPS»).
 * Опционально удалить AAAA для тех же имён (часто ломает мобильный DNS).
 *
 * Секреты только в .netangels.env (см. deploy/netangels.env.example). Не коммитить.
 * Док API: https://api.netangels.ru/
 *
 * Запуск из корня проекта:
 *   node deploy/netangels-dns-one-ip.mjs # применить
 *   node deploy/netangels-dns-one-ip.mjs --dry-run # только показать изменения
 *   node deploy/netangels-dns-one-ip.mjs --list    # зоны и все записи (отладка)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

function loadEnv(relPath) {
  const p = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i === -1) continue;
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

async function getToken(apiKey) {
  const body = new URLSearchParams({ api_key: apiKey });
  const res = await fetch("https://panel.netangels.ru/api/gateway/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Ошибка токена (${res.status}): ${text.slice(0, 400)}`);
  const j = JSON.parse(text);
  if (!j.token) throw new Error(`Нет token в ответе: ${text.slice(0, 200)}`);
  return j.token;
}

async function api(token, reqPath, options = {}) {
  const url = `https://api-ms.netangels.ru${reqPath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...options.headers
  };
  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* оставить текст */
  }
  if (!res.ok) {
    throw new Error(`${options.method || "GET"} ${reqPath} → ${res.status}: ${String(text).slice(0, 600)}`);
  }
  return data;
}

async function fetchAllEntities(token, pathBase) {
  const all = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const sep = pathBase.includes("?") ? "&" : "?";
    const reqPath = `${pathBase}${sep}offset=${offset}&limit=${limit}`;
    const data = await api(token, reqPath);
    const entities = data?.entities ?? [];
    all.push(...entities);
    if (entities.length < limit) break;
    offset += limit;
  }
  return all;
}

function normalizeZoneName(z) {
  return String(z || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
}

function recordNameMatchesZone(recordName, zoneName) {
  const z = normalizeZoneName(zoneName);
  const n = normalizeZoneName(recordName);
  return n === z || n === `www.${z}`;
}

function getRecordMeta(entity) {
  const id = entity.id ?? entity.pk;
  const type = entity.type || entity.record_type;
  const name = entity.name ?? entity.hostname ?? entity.fqdn ?? "";
  const ip = entity.details?.ip ?? entity.ip ?? entity.details?.address;
  return { id, type, name, ip, raw: entity };
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const listOnly = argv.includes("--list");

  const fileEnv = loadEnv(".netangels.env");
  const apiKey = (fileEnv.NETANGELS_API_KEY || process.env.NETANGELS_API_KEY || "").trim();
  const zoneName = normalizeZoneName(
    fileEnv.NETANGELS_ZONE || process.env.NETANGELS_ZONE || "truewebwork.ru"
  );
  const targetIp = (fileEnv.TARGET_IPV4 || process.env.TARGET_IPV4 || "").trim();
  const deleteAaaa =
    String(fileEnv.DELETE_AAAA ?? process.env.DELETE_AAAA ?? "1").trim() === "1" && !argv.includes("--keep-aaaa");

  if (!apiKey) {
    console.error(
      "Нужен NETANGELS_API_KEY: скопируйте deploy/netangels.env.example → .netangels.env и вставьте ключ с https://panel.netangels.ru/account/api/"
    );
    process.exit(1);
  }

  console.error("Получение токена NetAngels…");
  const token = await getToken(apiKey);

  const zones = await fetchAllEntities(token, "/api/v1/dns/zones/");
  const zone = zones.find((z) => normalizeZoneName(z.name) === zoneName);
  if (!zone) {
    console.error(`Зона «${zoneName}» не найдена. Доступные зоны:`, zones.map((z) => z.name).join(", ") || "(пусто)");
    process.exit(1);
  }

  console.error(`Зона: ${zone.name} (id=${zone.id})`);

  const records = await fetchAllEntities(token, `/api/v1/dns/zones/${zone.id}/records/`);

  if (listOnly) {
    console.log(JSON.stringify(records, null, 2));
    return;
  }

  if (!targetIp) {
    console.error("Укажите TARGET_IPV4 в .netangels.env (IPv4 вашего VPS).");
    process.exit(1);
  }

  const toUpdateA = [];
  const toDeleteAaaa = [];
  let countMatchingA = 0;

  for (const entity of records) {
    const meta = getRecordMeta(entity);
    if (!meta.id || !meta.type) continue;
    if (!recordNameMatchesZone(meta.name, zoneName)) continue;

    if (meta.type === "A") {
      countMatchingA += 1;
      if (meta.ip !== targetIp) toUpdateA.push(meta);
      else console.error(`OK A уже ${targetIp}: ${meta.name} (id=${meta.id})`);
    }
    if (meta.type === "AAAA" && deleteAaaa) {
      toDeleteAaaa.push(meta);
    }
  }

  if (countMatchingA === 0) {
    console.error(
      "\nВнимание: не найдено ни одной A-записи для корня или www (проверьте имена в панели). Список записей: npm run dns:netangels:list\n"
    );
  }

  if (toUpdateA.length === 0 && toDeleteAaaa.length === 0) {
    console.error("Изменений не требуется: все подходящие A уже указывают на TARGET_IPV4, AAAA не найдены или DELETE_AAAA=0.");
    return;
  }

  console.error("\nБудут обновлены A-записи:");
  for (const m of toUpdateA) {
    console.error(`  id=${m.id} name=${m.name} ${m.ip} → ${targetIp}${dryRun ? " (dry-run)" : ""}`);
  }
  if (deleteAaaa && toDeleteAaaa.length) {
    console.error("\nБудут удалены AAAA:");
    for (const m of toDeleteAaaa) {
      console.error(`  id=${m.id} name=${m.name} ip=${m.ip}${dryRun ? " (dry-run)" : ""}`);
    }
  }

  if (dryRun) {
    console.error("\n--dry-run: запросы к API не отправлялись.");
    return;
  }

  for (const m of toUpdateA) {
    await api(token, `/api/v1/dns/records/${m.id}/`, {
      method: "POST",
      body: JSON.stringify({ ip: targetIp })
    });
    console.error(`Обновлено A id=${m.id} ${m.name}`);
  }

  for (const m of toDeleteAaaa) {
    await api(token, `/api/v1/dns/records/${m.id}/`, { method: "DELETE" });
    console.error(`Удалено AAAA id=${m.id} ${m.name}`);
  }

  console.error("\nГотово. Подождите TTL (или до ~30 мин) и проверьте: nslookup " + zoneName + " / www." + zoneName);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
