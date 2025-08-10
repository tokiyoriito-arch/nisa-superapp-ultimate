
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
export async function GET(req){
  const supabase = supabaseServer();
  const url = new URL(req.url);
  const age = url.searchParams.get('age_group');
  let query = supabase.from('portfolios').select('alloc, device_id');
  if(age){
    const { data: ids } = await supabase.from('user_profiles').select('device_id').eq('age_group', age);
    const set = new Set((ids||[]).map(x=>x.device_id));
    const { data } = await query;
    const filtered = (data||[]).filter(x=> set.has(x.device_id));
    return NextResponse.json(aggregate(filtered));
  }else{
    const { data } = await query;
    return NextResponse.json(aggregate(data||[]));
  }
}
function aggregate(rows){
  const sum = {}; let n=0;
  for(const r of rows){
    const a = r.alloc||{};
    Object.keys(a).forEach(k=>{ sum[k]=(sum[k]||0)+Number(a[k]||0); });
    n++;
  }
  const avg = {}; Object.keys(sum).forEach(k=> avg[k] = n? Math.round(sum[k]/n*10)/10 : 0 );
  return { n, avg };
}
