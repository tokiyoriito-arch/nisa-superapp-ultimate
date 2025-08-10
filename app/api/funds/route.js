
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
export async function GET(req){
  const url = new URL(req.url);
  const q = Object.fromEntries(url.searchParams.entries());
  const supabase = supabaseServer();
  let query = supabase.from('funds').select('*').limit(1000);
  if(q.nisa==='tsumitate') query = query.eq('nisa_tsumitate', true);
  if(q.nisa==='growth') query = query.eq('nisa_growth', true);
  if(q.search){ query = query.ilike('name', `%${q.search}%`); }
  const { data, error } = await query;
  if(error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data||[]);
}
