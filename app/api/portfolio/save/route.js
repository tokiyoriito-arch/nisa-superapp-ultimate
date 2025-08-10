
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
export async function POST(req){
  const supabase = supabaseServer();
  const body = await req.json().catch(()=>null);
  if(!body) return NextResponse.json({ error:"invalid json" }, { status:400 });
  const { device_id, age_group, risk, alloc } = body;
  if(!device_id || !alloc) return NextResponse.json({ error:"device_id and alloc required" }, { status:400 });
  const now = new Date().toISOString();
  const { error: e1 } = await supabase.from('user_profiles').upsert({ device_id, age_group:age_group||null, updated_at: now }, { onConflict:"device_id" });
  if(e1) return NextResponse.json({ error:e1.message }, { status:500 });
  const { error: e2 } = await supabase.from('portfolios').upsert({ device_id, risk: risk||null, alloc, updated_at: now }, { onConflict:"device_id" });
  if(e2) return NextResponse.json({ error:e2.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
