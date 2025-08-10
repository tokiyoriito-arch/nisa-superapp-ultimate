// app/api/sync/nisa/route.js
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import * as XLSX from "xlsx";

// --- 最新ExcelのURLを自動抽出（金融庁 つみたて） ---
async function getLatestFsaExcel() {
  // 手動で固定したい場合は Vercel 環境変数で上書き可
  if (process.env.FSA_TSUMITATE_EXCEL_URL) return process.env.FSA_TSUMITATE_EXCEL_URL;

  const res = await fetch("https://www.fsa.go.jp/policy/nisa2/products/", {
    headers: { "user-agent": "Mozilla/5.0 NISA SuperApp" },
    cache: "no-store"
  });
  if (!res.ok) throw new Error("FSA products page fetch failed");
  const html = await res.text();

  // 例: https://www.fsa.go.jp/policy/nisa2/products/20250728/23.xlsx
  const re = /https:\/\/www\.fsa\.go\.jp\/policy\/nisa2\/products\/\d{8}\/\d+\.xlsx/g;
  const matches = html.match(re) || [];

  // 旧URLの保険（たまに置いてあることがある）
  const legacy = html.match(/https:\/\/www\.fsa\.go\.jp\/policy\/nisa2\/products\/tsumitate_list\.xlsx/g) || [];

  const pick = matches[0] || legacy[0];
  if (!pick) throw new Error("FSA Excel URL not found on page");
  return pick;
}

// --- 投信協会（成長投資枠）は固定URL（必要なら環境変数で差し替え） ---
function getToushinExcel() {
  return process.env.TOUSHIN_GROWTH_EXCEL_URL
    || "https://www.toushin.or.jp/files/static/486/unlisted_fund_for_investor.xlsx";
}

// --- Excel → 行配列 ---
async function fetchExcelToJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Excel fetch failed: ${url}`);
  const arr = new Uint8Array(await res.arrayBuffer());
  const wb = XLSX.read(arr, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

// --- 列名ゆらぎに強いマッパー ---
function mapRow(row, flags = {}) {
  const find = (cands) =>
    cands.map(k => Object.keys(row).find(h => h && String(h).includes(k))).find(Boolean);

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
    nisa_growth: !!flags.growth
  };
}

export async function GET(req) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const dbg = { fsaUrl: null, toushinUrl: null, fsaCount: 0, toushinCount: 0, errors: [] };

  try {
    const supabase = supabaseServer();
    let combined = [];

    // FSA（つみたて）
    try {
      const fsaUrl = await getLatestFsaExcel();
      dbg.fsaUrl = fsaUrl;
      const list = await fetchExcelToJson(fsaUrl);
      const mapped = list.map(r => mapRow(r, { tsumitate: true })).filter(Boolean);
      dbg.fsaCount = mapped.length;
      combined.push(...mapped);
    } catch (e) {
      dbg.errors.push("FSA: " + String(e));
    }

    // 投信協会（成長）
    try {
      const tUrl = getToushinExcel();
      dbg.toushinUrl = tUrl;
      const list = await fetchExcelToJson(tUrl);
      const mapped = list.map(r => mapRow(r, { growth: true })).filter(Boolean);
      dbg.toushinCount = mapped.length;
      combined.push(...mapped);
    } catch (e) {
      dbg.errors.push("Toushin: " + String(e));
    }

    if (combined.length === 0) {
      return NextResponse.json({ ok: false, msg: "0 records", debug: dbg }, { status: 500 });
    }

    // DBへUPSERT（300件ずつ）
    let inserted = 0;
    for (let i = 0; i < combined.length; i += 300) {
      const chunk = combined.slice(i, i + 300);
      const { data, error } = await supabase
        .from("funds")
        .upsert(chunk, { onConflict: "isin,name" })
        .select();
      if (error) throw error;
      inserted += data?.length || 0;
    }

    const res = { ok: true, inserted, total: combined.length, debug: dbg };
    return NextResponse.json(res);
  } catch (err) {
    dbg.errors.push(String(err));
    return NextResponse.json({ ok: false, error: String(err), debug: dbg }, { status: 500 });
  }
}
