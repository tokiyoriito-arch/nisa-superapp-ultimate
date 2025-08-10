
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
export async function POST(req){
  const token = req.headers.get('x-admin-token');
  if(!token || token !== process.env.ADMIN_TOKEN) return NextResponse.json({ error:"unauthorized" }, { status:401 });
  const body = await req.json();
  if(!Array.isArray(body)) return NextResponse.json({ error:"array expected" }, { status:400 });
  const supabase = supabaseServer();
  const { data, error } = await supabase.from('fund_sources').upsert(body, { onConflict:"isin" }).select();
  if(error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true, upserted: data.length });
}
