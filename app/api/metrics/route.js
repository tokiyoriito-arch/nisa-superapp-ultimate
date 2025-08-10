
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
export async function GET(req){
  const url = new URL(req.url);
  const isin = url.searchParams.get('isin');
  const supabase = supabaseServer();
  if(!isin){
    const { data, error } = await supabase.from('fund_metrics').select('*').order('ret_1y', { ascending:false }).limit(2000);
    if(error) return NextResponse.json({ error:error.message }, { status:500 });
    return NextResponse.json(data||[]);
  }else{
    const { data, error } = await supabase.from('fund_metrics').select('*').eq('isin', isin).maybeSingle();
    if(error) return NextResponse.json({ error:error.message }, { status:500 });
    return NextResponse.json(data||{});
  }
}
