
'use client';
import { useEffect, useState } from 'react';
import { Donut } from '@/components/Charts';
import { ASSETS, MODELS, normalizeAlloc } from '@/lib/alloc';
export default function AllocationEditor({ initial, onChange }){
  const [alloc, setAlloc] = useState(initial || Object.fromEntries(ASSETS.map(a=>[a.key,0])));
  const total = Object.values(alloc).reduce((a,b)=>a+Number(b||0),0);
  useEffect(()=>{ onChange?.(normalizeAlloc(alloc)); },[alloc]);
  function setK(k, v){ v = Math.max(0, Math.min(100, Number(v)||0)); setAlloc(s=> ({ ...s, [k]: v })); }
  function applyModel(key){ const m = MODELS[key]; if(!m) return; setAlloc(m.alloc); }
  function even(){ const p = Math.round(100/ASSETS.length*10)/10; const a = {}; ASSETS.forEach(x=>a[x.key]=p); setAlloc(a); }
  const labels = ASSETS.map(a=>a.label); const data = ASSETS.map(a=> Number(alloc[a.key]||0) );
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card">
        <h3 className="font-semibold mb-2">配分（合計 {total.toFixed(1)}%）</h3>
        <div className="grid gap-3">{ASSETS.map(a=> (
          <div key={a.key}>
            <div className="flex items-center justify-between">
              <label className="text-sm">{a.label}</label>
              <input className="input w-24 text-right" type="number" step="0.5" value={alloc[a.key]} onChange={e=>setK(a.key, e.target.value)} />
            </div>
            <input type="range" min="0" max="100" step="0.5" value={alloc[a.key]} onChange={e=>setK(a.key, e.target.value)} className="w-full" />
          </div>
        ))}</div>
        <div className="flex gap-2 mt-3">
          <button className="btn-ghost" onClick={()=>applyModel('conservative')}>安定を適用</button>
          <button className="btn-ghost" onClick={()=>applyModel('balanced')}>バランスを適用</button>
          <button className="btn-ghost" onClick={()=>applyModel('growth')}>成長を適用</button>
          <button className="btn-ghost" onClick={even}>均等にする</button>
        </div>
        {total!==100 && <div className="text-amber-700 text-sm mt-2">合計が100%になるよう調整してください</div>}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">円グラフ</h3>
        <Donut labels={labels} data={data} />
      </div>
    </div>
  );
}
