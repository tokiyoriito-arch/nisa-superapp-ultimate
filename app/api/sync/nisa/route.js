
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import * as XLSX from "xlsx";
async function fetchExcel(url){
  const res = await fetch(url, { cache:"no-store" });
  if(!res.ok) throw new Error("Excel取得に失敗: "+url);
  const arr = new Uint8Array(await res.arrayBuffer());
  const wb = XLSX.read(arr, { type:"array" });
  return wb;
}
function sheetToObjects(wb, sheetIndex){
  const sheetName = wb.SheetNames[sheetIndex] || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { defval:"" });
}
function normalize(list){
  const out=[];
  for(const row of list){
    const rec = {
      isin: String(row["ISIN"] || row["ISINコード"] || row["銘柄コード"] || "").trim(),
      name: String(row["ファンド名称"] || row["ファンド名"] || row["商品名"] || "").trim(),
      company: String(row["運用会社"] || row["運用会社名"] || "").trim(),
      category: String(row["資産分類"] || row["資産区分"] || row["分類"] || "").trim()
    };
    if(rec.name) out.push(rec);
  }
  return out;
}
export async function GET(){
  try{
    const supabase = supabaseServer();
    let combined = [];
    try{
      const wbT = await fetchExcel("https://www.fsa.go.jp/policy/nisa2/products/tsumitate_list.xlsx");
      combined.push(...normalize(sheetToObjects(wbT, 0)).map(x=>({ ...x, nisa_tsumitate:true, nisa_growth:false })));
    }catch(e){ console.warn("つみたてExcelエラー", e); }
    try{
      const wbG = await fetchExcel("https://www.toushin.or.jp/files/static/486/unlisted_fund_for_investor.xlsx");
      combined.push(...normalize(sheetToObjects(wbG, 0)).map(x=>({ ...x, nisa_tsumitate:false, nisa_growth:true })));
    }catch(e){ console.warn("成長Excelエラー", e); }
    if(combined.length===0) return NextResponse.json({ ok:false, msg:"0 records" }, { status:500 });
    let inserted=0;
    for(let i=0;i<combined.length;i+=300){
      const chunk = combined.slice(i,i+300).map(x=>({
        isin: x.isin || null, name: x.name, company: x.company || null, category: x.category || null,
        nisa_tsumitate: !!x.nisa_tsumitate, nisa_growth: !!x.nisa_growth
      }));
      const { data, error } = await supabase.from('funds').upsert(chunk, { onConflict:"isin,name" }).select();
      if(error) throw error;
      inserted += data?.length||0;
    }
    return NextResponse.json({ ok:true, inserted, total:combined.length });
  }catch(err){
    return NextResponse.json({ ok:false, error:String(err) }, { status:500 });
  }
}
