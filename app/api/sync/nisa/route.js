// app/api/sync/nisa/route.js
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import * as XLSX from "xlsx";

//重複排除ユーティリティ
function dedupeBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const r of arr) {
    const k = keyFn(r);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}


// ---- 金融庁つみたて：ページから .xlsx を抽出（相対/絶対どちらもOK） ----
async function getLatestFsaExcel() {
  if (process.env.FSA_TSUMITATE_EXCEL_URL) return process.env.FSA_TSUMITATE_EXCEL_URL;

  const base = "https://www.fsa.go.jp/policy/nisa2/products/";
  const res = await fetch(base, {
    headers: { "user-agent": "Mozilla/5.0 NISA SuperApp" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("FSA products page fetch failed");
  const html = await res.text();

  // href="...xlsx" を全部拾う（相対パス含む）
  const hrefs = Array.from(html.matchAll(/href=["']([^"']+\.xlsx)["']/gi)).map(m => m[1]);

  // /policy/nisa2/products/ 配下だけに限定
  const excelUrls = hrefs
    .map(href => {
      try {
        // 相対→絶対へ
        return new URL(href, base).toString();
      } catch { return null; }
    })
    .filter(u => u && u.includes("/policy/nisa2/products/"));

  if (!excelUrls.length) throw new Error("FSA Excel URL not found on page");
  // 先頭（ページ上部の最新）を採用
  return excelUrls[0];
}

// ---- 投信協会（成長）：固定URL（必要なら上書き可） ----
function getToushinExcel() {
  return process.env.TOUSHIN_GROWTH_EXCEL_URL
    || "https://www.toushin.or.jp/files/static/486/unlisted_fund_for_investor.xlsx";
}

// ---- Excel → 行配列：全シート走査＆ヘッダー行の自動検出 ----
async function fetchExcelAllRows(url) {
  const res = await fetch(url, { cache: "no-store", headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Excel fetch failed: ${url}`);
  const arr = new Uint8Array(await res.arrayBuffer());
  const wb = XLSX.read(arr, { type: "array" });

  const rows = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];

    // まずは素直に1行目見出しとして読む
    let list = XLSX.utils.sheet_to_json(ws, { defval: "" });
    if (list.length === 0) continue;

    // ISIN/名称っぽいキーがない場合、ヘッダー行を探す
    const hasKey = (obj) =>
      Object.keys(obj).some(k => String(k).includes("ISIN") || String(k).includes("ファンド"));
    if (!hasKey(list[0])) {
      // 2D配列で生読み
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      // ヘッダー候補行=「ISIN or ファンド」を含む行
      const hIdx = raw.findIndex(r =>
        Array.isArray(r) && r.some(c => String(c).includes("ISIN") || String(c).includes("ファンド"))
      );
      if (hIdx >= 0) {
        // その行をヘッダーにして再変換
        const range = XLSX.utils.decode_range(ws["!ref"]);
        const newRef = { s: { r: hIdx, c: range.s.c }, e: range.e };
        const hRef = XLSX.utils.encode_range(newRef);
        list = XLSX.utils.sheet_to_json(ws, { range: hRef, defval: "" });
      }
    }

    rows.push(...list);
  }
  return rows;
}

//挿入
function slugify(name, company) {
  return (String(name || '') + '|' + String(company || ''))
    .toLowerCase()
    .replace(/\s+/g, '')           // 全スペース除去
    .replace(/[()（）・･]/g, '')   // 記号ゆれ
    .replace(/[‐-–—ー―−\-]/g, '')  // ハイフン類
    .replace(/㈱|（株）|株式会社/g, '株'); // 会社表記のゆれの簡易吸収
}

// ---- 列名ゆらぎに強いマッパー ----
function mapRow(row, flags = {}) {
  const keys = Object.keys(row);
  const find = (cands) =>
    cands.map(k => keys.find(h => h && String(h).includes(k))).find(Boolean);

  const isin = String(row[find(["ISIN", "ISINコード", "銘柄コード"])] || "").trim();
  const name = String(row[find(["ファンド名", "ファンド名称", "商品名"])] || "").trim();
  const company = String(row[find(["運用会社", "運用会社名"])] || "").trim();
  const category = String(row[find(["資産分類", "資産区分", "分類"])] || "").trim();

  if (!name) return null;
  return {
    isin: isin || null,
    name,
    company: company || null,
    category: category || null,
    nisa_tsumitate: !!flags.tsumitate,
    nisa_growth: !!flags.growth,
  };
}

export async function GET(req) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const dbg = { fsaUrl: null, toushinUrl: null, fsaCount: 0, toushinCount: 0, errors: [] };

  try {
    const supabase = supabaseServer();
    let combined = [];

    // つみたて（金融庁）
    try {
      const fsaUrl = await getLatestFsaExcel();
      dbg.fsaUrl = fsaUrl;
      const list = await fetchExcelAllRows(fsaUrl);
      const mapped = list.map(r => mapRow(r, { tsumitate: true })).filter(Boolean);
      dbg.fsaCount = mapped.length;
      combined.push(...mapped);
    } catch (e) {
      dbg.errors.push("FSA: " + String(e));
    }

    // 成長（投信協会）
    try {
      const tUrl = getToushinExcel();
      dbg.toushinUrl = tUrl;
      const list = await fetchExcelAllRows(tUrl);
      const mapped = list.map(r => mapRow(r, { growth: true })).filter(Boolean);
      dbg.toushinCount = mapped.length;
      combined.push(...mapped);
    } catch (e) {
      dbg.errors.push("Toushin: " + String(e));
    }

    if (combined.length === 0) {
      return NextResponse.json({ ok: false, msg: "0 records", debug: dbg }, { status: 500 });
    }

// ▼ DBへUPSERT（重複除去してからREST UPSERT）
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE;

async function restUpsert(rows, onConflictCols) {
  const url = `${SB_URL}/rest/v1/funds?on_conflict=${encodeURIComponent(onConflictCols)}&select=*`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Prefer': 'return=representation,resolution=merge-duplicates'
    },
    body: JSON.stringify(rows),
    cache: 'no-store'
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`REST upsert failed: ${res.status} ${body}`);
  }
  return res.json();
}

// ISINが無い行には slug を付与（未付与なら念のため）
combined = combined.map(r => {
  const name = String(r.name || '').trim();
  const company = String(r.company || '').trim();
  const isin = r.isin ? String(r.isin).trim() : '';
  const base = { ...r, name, company, isin: isin || null };
  if (!base.isin && !base.slug) base.slug = slugify(name, company);
  return base;
});

let inserted = 0;
let skippedNoName = 0;
let droppedDupIsinName = 0;
let droppedDupSlug = 0;

// バッチサイズは小さめ（重複衝突リスク低減）
const BATCH = 100;

for (let i = 0; i < combined.length; i += BATCH) {
  const chunk = combined.slice(i, i + BATCH);

  // nameが空の行は除外
  const byName = chunk.filter(r => r.name && r.name.length > 0);
  skippedNoName += (chunk.length - byName.length);
  if (byName.length === 0) continue;

  // ISINあり/なしで分割
  const withIsin = byName.filter(r => r.isin && r.isin.length > 0);
  const withoutIsin = byName.filter(r => !r.isin || r.isin.length === 0);

  // ① (isin,name) で重複除去
  const uniqIsin = dedupeBy(withIsin, r => `${r.isin}::${r.name}`);
  droppedDupIsinName += (withIsin.length - uniqIsin.length);

  if (uniqIsin.length) {
    const d1 = await restUpsert(uniqIsin, 'isin,name');
    inserted += Array.isArray(d1) ? d1.length : 0;
  }

  // ② slug で重複除去（slug未設定なら安全のため作り直す）
  const preparedSlug = withoutIsin.map(r => ({ ...r, slug: r.slug || slugify(r.name, r.company) }));
  const uniqSlug = dedupeBy(preparedSlug, r => r.slug);
  droppedDupSlug += (preparedSlug.length - uniqSlug.length);

  if (uniqSlug.length) {
    const d2 = await restUpsert(uniqSlug, 'slug');
    inserted += Array.isArray(d2) ? d2.length : 0;
  }
}

// レスポンス
return NextResponse.json({
  ok: true,
  inserted,
  total: combined.length,
  skippedNoName,
  droppedDupIsinName,
  droppedDupSlug,
  debug: dbg
});
// ▲ 置き換えここまで


    return NextResponse.json({ ok: true, inserted, total: combined.length, debug: dbg });
  } catch (err) {
    dbg.errors.push(String(err));
    return NextResponse.json({ ok: false, error: String(err), debug: dbg }, { status: 500 });
  }
}
