
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
export async function GET(req){
  const supabase = supabaseServer();
  const url = new URL(req.url);
  const device_id = url.searchParams.get('device_id');
  if(!device_id) return NextResponse.json({ error:"device_id required" }, { status:400 });
  const { data: prf } = await supabase.from('user_profiles').select('device_id, age_group').eq('device_id', device_id).maybeSingle();
  const { data: pf } = await supabase.from('portfolios').select('alloc, risk, updated_at').eq('device_id', device_id).maybeSingle();
  return NextResponse.json({ profile: prf, portfolio: pf });
}
