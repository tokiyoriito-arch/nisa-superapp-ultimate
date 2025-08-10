
'use client';
import { useState, useMemo } from "react";
import { LineChart } from "@/components/Charts";
export default function PlannerSim(){
  const [age, setAge] = useState(35);
  const [retire, setRetire] = useState(65);
  const [drawStart, setDrawStart] = useState(65);
  const [monthly, setMonthly] = useState(50000);
  const [draw, setDraw] = useState(180000);
  const [expect, setExpect] = useState(0.04);
  const [vol, setVol] = useState(0.12);
  const years = useMemo(()=>{
    const out=[{ year: new Date().getFullYear(), age, value: 0 }];
    let v=0;
    for(let y=age+1;y<=90;y++){
      const r = expect;
      if(y<=retire){
        v = (v + monthly*12) * (1+r);
      }else{
        v = (v - draw*12) * (1+r);
      }
      out.push({ year: out[out.length-1].year+1, age: y, value: Math.max(0,v) });
    }
    return out;
  },[age,retire,monthly,draw,expect]);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label>現在年齢<input className="input" type="number" value={age} onChange={e=>setAge(Number(e.target.value))}/></label>
          <label>退職年齢<input className="input" type="number" value={retire} onChange={e=>setRetire(Number(e.target.value))}/></label>
          <label>積立/月（円）<input className="input" type="number" value={monthly} onChange={e=>setMonthly(Number(e.target.value))}/></label>
          <label>取り崩し/月（円）<input className="input" type="number" value={draw} onChange={e=>setDraw(Number(e.target.value))}/></label>
          <label>期待リターン<input className="input" type="number" step="0.01" value={expect} onChange={e=>setExpect(Number(e.target.value))}/></label>
          <label>年率ボラ<input className="input" type="number" step="0.01" value={vol} onChange={e=>setVol(Number(e.target.value))}/></label>
        </div>
        <div className="subtle">簡易モデルです。税・手数料等は考慮していません。</div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">資産推移（簡易）</h3>
        <LineChart labels={years.map(x=>x.year)} series={years.map(x=>Math.round(x.value/1000)/1000)} />
      </div>
    </div>
  );
}
