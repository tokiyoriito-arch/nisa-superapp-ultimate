
export const ASSETS = [
  { key:'jp_eq', label:'国内株式' },
  { key:'dev_eq', label:'先進国株式' },
  { key:'em_eq', label:'新興国株式' },
  { key:'jp_bd', label:'国内債券' },
  { key:'dev_bd_hedged', label:'先進国債券（ヘッジ）' },
  { key:'reit', label:'REIT' },
  { key:'cash', label:'現金' }
];
export const MODELS = {
  conservative: { name:'安定', risk:'low', alloc:{ jp_eq:10, dev_eq:20, em_eq:0, jp_bd:45, dev_bd_hedged:20, reit:5, cash:0 } },
  balanced:     { name:'バランス', risk:'mid', alloc:{ jp_eq:15, dev_eq:45, em_eq:5, jp_bd:20, dev_bd_hedged:10, reit:5, cash:0 } },
  growth:       { name:'成長', risk:'high', alloc:{ jp_eq:20, dev_eq:60, em_eq:10, jp_bd:5, dev_bd_hedged:0, reit:5, cash:0 } }
};
export const AGE_TEMPLATES = { '20s':'growth','30s':'balanced','40s':'balanced','50s':'conservative','60s+':'conservative' };
export function normalizeAlloc(alloc){
  const total = Object.values(alloc).reduce((a,b)=>a+Number(b||0),0);
  if(total===0) return alloc;
  const out={}; for(const k of Object.keys(alloc)){ out[k] = Math.round( (alloc[k]/total)*1000 )/10; }
  return out;
}
