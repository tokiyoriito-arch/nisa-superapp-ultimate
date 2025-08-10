
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { MODELS, AGE_TEMPLATES } from "@/lib/alloc";
export async function GET(req){
  const url = new URL(req.url);
  const risk = url.searchParams.get('risk');
  const age = url.searchParams.get('age_group');
  let picked = null;
  if(risk==='low') picked = MODELS.conservative;
  if(risk==='mid') picked = MODELS.balanced;
  if(risk==='high') picked = MODELS.growth;
  if(!picked && age && AGE_TEMPLATES[age]) picked = MODELS[AGE_TEMPLATES[age]];
  if(!picked) picked = MODELS.balanced;
  return NextResponse.json(picked);
}
