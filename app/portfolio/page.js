
'use client';
import NavBar from "@/components/NavBar";
import AllocationEditor from "@/components/AllocationEditor";
import { useEffect, useState } from "react";
import { ASSETS } from "@/lib/alloc";
function getDeviceId(){ try{ let id = localStorage.getItem('device_id'); if(!id){ id = 'dev_'+crypto.randomUUID(); localStorage.setItem('device_id', id); } return id; }catch{return 'dev_demo';} }
export default function Page(){
  const [age,setAge] = useState('30s');
  const [risk,setRisk] = useState('mid');
  const [alloc,setAlloc] = useState(Object.fromEntries(ASSETS.map(a=>[a.key,0])));
  async function save(){
    try{
      await fetch('/api/portfolio/save', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ device_id:getDeviceId(), age_group:age, risk, alloc }) });
      alert('保存しました');
    }catch(e){ alert('保存失敗: '+e); }
  }
  return (
    <>
      <NavBar/>
      <main className="container py-6 grid gap-4">
        <div className="card grid gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label>年齢帯
              <select className="select w-full" value={age} onChange={e=>setAge(e.target.value)}>
                <option value="20s">20代</option><option value="30s">30代</option>
                <option value="40s">40代</option><option value="50s">50代</option>
                <option value="60s+">60代以上</option>
              </select>
            </label>
            <label>リスク
              <select className="select w-full" value={risk} onChange={e=>setRisk(e.target.value)}>
                <option value="low">低</option><option value="mid">中</option><option value="high">高</option>
              </select>
            </label>
            <div className="flex items-end"><button className="btn" onClick={save}>保存</button></div>
          </div>
        </div>
        <AllocationEditor initial={alloc} onChange={setAlloc}/>
      </main>
    </>
  );
}
