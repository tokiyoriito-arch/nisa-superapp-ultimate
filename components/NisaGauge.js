
'use client';
export default function NisaGauge({ yUsed=0, yCap=3600000, lifeUsed=0, lifeCap=18000000 }){
  const yPct = Math.min(100, Math.round(yUsed/yCap*100));
  const lPct = Math.min(100, Math.round(lifeUsed/lifeCap*100));
  return (
    <div className="card">
      <div className="font-semibold mb-2">NISA残枠</div>
      <Gauge label={"今年の残り"} used={yUsed} cap={yCap} pct={yPct}/>
      <div className="h-2"/>
      <Gauge label={"生涯の残り"} used={lifeUsed} cap={lifeCap} pct={lPct}/>
      <div className="subtle mt-2">※ 年360万円／生涯1,800万円（簡易表示）</div>
    </div>
  );
}
function Gauge({ label, used, cap, pct }){
  return (
    <div>
      <div className="flex items-center justify-between"><span className="text-sm text-slate-600">{label}</span><span className="text-sm">残り ¥{(cap-used).toLocaleString('ja-JP')}</span></div>
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mt-1"><div className="h-3 bg-sky-500" style={{ width: (100-pct)+'%' }}></div></div>
      <div className="subtle mt-1">使用：¥{used.toLocaleString('ja-JP')} / ¥{cap.toLocaleString('ja-JP')}</div>
    </div>
  );
}
