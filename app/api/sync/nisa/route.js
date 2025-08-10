// app/api/sync/nisa/route.js
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import * as XLSX from "xlsx";

// 1) 金融庁ページから「最新ExcelのURL」を動的に抽出
async function getLatestFsaExcel() {
  // 環境変数で固定URLを指定できる逃げ道
  if (process.env.FSA_TSUMITATE_EXCEL_URL) return process.env.FSA_TSUMITATE_EXCEL_URL;

  const res = await fetch("https://www.fsa.go.jp/policy/nisa2/products/", {
    headers: {
      // 一部サイトはUAが無いと拒否することがあるため
      "user-agent": "Mozilla/5.0 NISA SuperApp (Node fetch)"
    },
    cache: "no-store"
  });
  const html = await res.text();

  // ページ中の「…/products/日付/番号.xlsx」を全部拾って、一番最初のものを使う
  const re = /https:\/\/www\.fsa\.go\.jp\/policy\/nisa2\/products\/\d{8}\/\d+\.xlsx/g;
  const matches = html.match(re) || [];
  if (matches.length === 0) throw new Error("FSA Excel URL not found");
  return matches[0]; // 先頭を採用（＝最新の「運用会社別」Excelが先に出る想定）
}

// 2) 投信協会（成長投資枠）ExcelのURL（固定）
function getToushinExcel() {
  return process.env.TOUSHIN_GROWTH_EXCEL_URL
    || "https://www.toushin.or.jp/files/static/486/unlisted_fund_for_investor.xlsx";
}

// 共通：Excel→オブジェクト配列
async function fetchExcelToJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Excel fetch failed: ${url}`);
  const arr = new Uint8Array(await res.arrayBuffer());
  const wb = XLSX.read(arr, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

// 列名のゆらぎに耐えるマッパー（ISIN/名称/会社/分類）
function mapRow(row, flags = {}) {
  const pick = (cands) =>
    cands.map(k => Object.keys(row).find(h => h && String(h).includes(k))).find(Boolean);

  const isin = String(row[pick(["ISIN", "ISINコード", "銘柄コード"])] || "").trim();
  const name = String(row[pick(["ファンド名", "ファンド名称", "商品名"])] || "").trim();
  const company = String(row[pick(["運用会社", "運用会社名"])] || "").trim();
  const category = String(row[pick(["資産分類", "資産区分", "分類"])] || "").trim();

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

export async function GET() {
  try {
    const supabase = supabaseServer();

    // FSA（つみたて）
    let combined = [];
    try {
      const fsaUrl = await getLatestFsaExcel();
      const list = await fetchExcelToJson(fsaUrl);
      list.forEach(r => {
        const m = mapRow(r, { tsumitate: true });
        if (m) combined.push(m);
      });
    } catch (e) {
      console.warn("FSA fetch/parse error", e);
    }

    // 投信協会（成長）
    try {
      const tUrl = getToushinExcel();
      const list = await fetchExcelToJson(tUrl);
      list.forEach(r => {
        const m = mapRow(r, { growth: true });
        if (m) combined.push(m);
      });
    } catch (e) {
      console.warn("Toushin fetch/parse error", e);
    }

    if (combined.length === 0) {
      return NextResponse.json({ ok: false, msg: "0 records" }, { status: 500 });
    }

    // 300件ずつUPSERT
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

    return NextResponse.json({ ok: true, inserted, total: combined.length });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
