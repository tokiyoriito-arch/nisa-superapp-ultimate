
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
export async function GET(req){
  const url = new URL(req.url);
  const isin = url.searchParams.get('isin');
  if(!isin) return NextResponse.json({ error:"isin required" }, { status:400 });
  const supabase = supabaseServer();
  const { data, error } = await supabase.from('fund_nav').select('date,nav,dist').eq('isin', isin).order('date', { ascending:true });
  if(error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data||[]);
}
