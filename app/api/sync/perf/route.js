
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import Papa from "papaparse";
import * as iconv from "iconv-lite";
function toNum(x){ if(x==null) return null; const s=String(x).replace(/[,\s]/g,''); const n=Number(s); return Number.isFinite(n)? n : null; }
function ym(date){ const d=new Date(date); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0'); }
function groupMonthly(navRows){
  const out = new Map();
  for(const r of navRows){
    const key = ym(r.date);
    if(!out.has(key)) out.set(key, []);
    out.get(key).push(r);
  }
  const months = Array.from(out.keys()).sort();
  const monthlyRet = [];
  let prevNav = null;
  for(const m of months){
    const rows = out.get(m).sort((a,b)=> new Date(a.date)-new Date(b.date));
    if(rows.length===0){ monthlyRet.push(0); continue; }
    if(prevNav==null) prevNav = rows[0].nav;
    let acc = 1;
    for(const r of rows){
      const tr = (r.nav + (r.dist||0)) / prevNav;
      acc *= tr;
      prevNav = r.nav;
    }
    monthlyRet.push(acc-1);
  }
  return { months, monthlyRet };
}
function prod(arr){ return arr.reduce((a,b)=>a*(1+b),1); }
function ann(ret, months){ return Math.pow(1+ret, 12/months)-1; }
function vol(arr){ const n = arr.length; if(!n) return 0; const mean = arr.reduce((a,b)=>a+b,0)/n; const v = arr.reduce((a,b)=> a + (b-mean)**2, 0) / n; return Math.sqrt(v) * Math.sqrt(12); }
async function fetchTextSmart(url, encs=["utf8","sjis","ms932"]){
  const res = await fetch(url, { cache:"no-store" });
  if(!res.ok) throw new Error("CSV取得失敗: "+url);
  const buf = new Uint8Array(await res.arrayBuffer());
  for(const e of encs){
    try{ const txt = iconv.decode(Buffer.from(buf), e); if(txt && txt.split(/\r?\n/).length>1) return txt; }catch{}
  }
  return new TextDecoder().decode(buf);
}
function mapColumns(row){
  const keys = Object.keys(row);
  const find = (cands)=> keys.find(k=> cands.some(s=> k.includes(s)));
  const dateKey = find(["日付","基準価額日","DATE","date","年月日"]) || keys[0];
  const navKey  = find(["基準価額","基準価格","基準価額(円)","基準価額（円）","nav"]) || keys[1];
  const distKey = find(["分配金","分配金(円)","分配金（円）","分配"]) || null;
  return { dateKey, navKey, distKey };
}
export async function GET(req){
  const supabase = supabaseServer();
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit')||50);
  const { data: sources, error: e1 } = await supabase.from('fund_sources').select('isin,csv_url,encoding,date_col,nav_col,dist_col').limit(2000);
  if(e1) return NextResponse.json({ error:e1.message }, { status:500 });
  if(!sources || sources.length===0) return NextResponse.json({ ok:false, msg:"fund_sources is empty" }, { status:400 });
  const { data: nisaFunds } = await supabase.from('funds').select('isin').or('nisa_tsumitate.eq.true,nisa_growth.eq.true').limit(5000);
  const nisaSet = new Set((nisaFunds||[]).map(f=>f.isin).filter(Boolean));
  let processed=0, upserts=0, metrics=0, errors=[];
  for(const src of sources){
    if(nisaSet.size && !nisaSet.has(src.isin)) continue;
    if(processed>=limit) break;
    processed++;
    try{
      const txt = await fetchTextSmart(src.csv_url);
      const parsed = Papa.parse(txt, { header:true, skipEmptyLines:true });
      const rows = parsed.data;
      if(!rows?.length) continue;
      let { dateKey, navKey, distKey } = mapColumns(rows[0]);
      if(src.date_col) dateKey = src.date_col;
      if(src.nav_col)  navKey = src.nav_col;
      if(src.dist_col) distKey = src.dist_col;
      const navRows = [];
      for(const r of rows){
        const d = r[dateKey]; const n = toNum(r[navKey]); const dist = distKey? toNum(r[distKey]) : 0;
        const date = d? new Date(d) : null;
        if(!date || !Number.isFinite(n)) continue;
        navRows.push({ date: date.toISOString().slice(0,10), nav:n, dist: Number.isFinite(dist)? dist : 0 });
      }
      navRows.sort((a,b)=> a.date<b.date? -1: 1);
      if(navRows.length===0) continue;
      for(let i=0;i<navRows.length;i+=500){
        const part = navRows.slice(i,i+500).map(x=>({ isin:src.isin, date:x.date, nav:x.nav, dist:x.dist }));
        const { error: e2 } = await supabase.from('fund_nav').upsert(part, { onConflict:"isin,date" });
        if(e2) throw e2;
        upserts += part.length;
      }
      const { data: navAll } = await supabase.from('fund_nav').select('date,nav,dist').eq('isin', src.isin).order('date', { ascending:true });
      const { months, monthlyRet } = groupMonthly(navAll||[]);
      if(monthlyRet.length>=12){
        const r1y = ann(prod(monthlyRet.slice(-12))-1, 12);
        const r3y = monthlyRet.length>=36? ann(prod(monthlyRet.slice(-36))-1, 36) : null;
        const r5y = monthlyRet.length>=60? ann(prod(monthlyRet.slice(-60))-1, 60) : null;
        const vol3 = monthlyRet.length>=36? vol(monthlyRet.slice(-36)) : null;
        let acc=100; const last = monthlyRet.length>=36? monthlyRet.slice(-36) : monthlyRet;
        const ser = [100]; for(const r of last){ acc*= (1+r); ser.push(acc); }
        let peak=ser[0], mdd=0; for(const v of ser){ if(v>peak) peak=v; const d=(peak-v)/peak; if(d>mdd) mdd=d; }
        const asof = (navAll||[]).slice(-1)[0]?.date || null;
        const payload = { isin: src.isin, asof, ret_1y:r1y, ret_3y:r3y, ret_5y:r5y, vol_3y:vol3, mdd_3y:mdd };
        const { error: e3 } = await supabase.from('fund_metrics').upsert(payload, { onConflict:"isin" });
        if(e3) throw e3;
        metrics++;
      }
    }catch(err){ errors.push({ isin: src.isin, msg: String(err) }); }
  }
  return NextResponse.json({ ok:true, processed, upserts, metrics, errors });
}
