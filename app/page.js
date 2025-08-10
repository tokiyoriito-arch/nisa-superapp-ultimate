
'use client';
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import AnchorNav from "@/components/AnchorNav";
import NisaGauge from "@/components/NisaGauge";
import AllocationEditor from "@/components/AllocationEditor";
import { Donut, LineChart } from "@/components/Charts";
import PlannerSim from "@/components/PlannerSim";
import { ASSETS } from "@/lib/alloc";

const fetcher = (u)=> fetch(u).then(r=>r.json());
const labelMap = { jp_eq:'国内株式', dev_eq:'先進国株式', em_eq:'新興国株式', jp_bd:'国内債券', dev_bd_hedged:'先進国債券（H）', reit:'REIT', cash:'現金' };

export default function OnePage(){
  // data fetch
  const reco = useSWR('/api/portfolio/reco?age_group=30s', fetcher);
  const funds = useSWR('/api/funds?nisa=tsumitate', fetcher);
  const metrics = useSWR('/api/metrics', fetcher);
  const crowd = useSWR('/api/portfolio/crowd', fetcher);

  // portfolio local edit
  const [age,setAge] = useState('30s');
  const [risk,setRisk] = useState('mid');
  const [alloc,setAlloc] = useState(Object.fromEntries(ASSETS.map(a=>[a.key,0])));
  function device(){ try{ let id = localStorage.getItem('device_id'); if(!id){ id='dev_'+crypto.randomUUID(); localStorage.setItem('device_id', id);} return id; }catch{return 'dev_demo';} }
  async function save(){
    try{
      await fetch('/api/portfolio/save', { method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ device_id: device(), age_group: age, risk, alloc }) });
      alert('保存しました');
    }catch(e){ alert('保存失敗: '+e); }
  }

  // helpers
  const recoLabels = useMemo(()=> reco.data ? Object.keys(reco.data.alloc).map(k=>labelMap[k]||k) : [], [reco.data]);
  const recoSeries = useMemo(()=> reco.data ? Object.values(reco.data.alloc) : [], [reco.data]);
  const crowdLabels = useMemo(()=> crowd.data ? Object.keys(crowd.data.avg).map(k=>labelMap[k]||k) : [], [crowd.data]);
  const crowdSeries = useMemo(()=> crowd.data ? Object.values(crowd.data.avg) : [], [crowd.data]);
  const [search, setSearch] = useState("");

  return (
    <>
      <NavBar/>
      <Hero/>
      <AnchorNav/>

      <main className="container py-8 grid gap-10">

        {/* 概要 */}
        <section id="overview" className="grid md:grid-cols-2 gap-4">
          <NisaGauge yUsed={1200000} yCap={3600000} lifeUsed={4500000} lifeCap={18000000} />
          <div className="card">
            <h3 className="font-semibold mb-2">主な機能</h3>
            <ul className="list-disc pl-5 text-slate-700">
              <li>NISA対象の自動更新（Excel取り込み）</li>
              <li>公式CSVからパフォーマンス再計算（TR）</li>
              <li>診断→配分→銘柄マッピング</li>
              <li>匿名集計の「みんなのPF」</li>
              <li>積立→取り崩しのライフプラン</li>
            </ul>
          </div>
        </section>

        {/* 診断 */}
        <section id="diagnosis" className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold mb-2">かんたん診断（デモ）</h3>
            {!reco.data ? <div>おすすめ配分を計算中…</div> : <Donut labels={recoLabels} data={recoSeries}/>}            
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">みんなの平均（参考）</h3>
            {!crowd.data ? <div>読み込み中…</div> : <Donut labels={crowdLabels} data={crowdSeries}/>}
            {crowd.data && <div className="subtle mt-2">集計数：{crowd.data.n}</div>}
          </div>
        </section>

        {/* 私のPF */}
        <section id="portfolio" className="grid gap-3">
          <div className="card grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <AllocationEditor initial={alloc} onChange={setAlloc}/>
        </section>

        {/* NISA銘柄 */}
        <section id="nisa" className="grid gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">NISA対象（つみたて）</h3>
            <input className="input w-56" placeholder="ファンド名で検索…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="card overflow-x-auto">
            {!funds.data ? <div>読み込み中…（Supabase接続→/api/sync/nisa を実行）</div> :
            <table>
              <thead><tr><th>ISIN</th><th>ファンド名</th><th>会社</th><th>分類</th></tr></thead>
              <tbody>{funds.data.filter(x=> !search || String(x.name).includes(search)).slice(0,200).map((x,i)=>(
                <tr key={i}><td>{x.isin}</td><td>{x.name}</td><td>{x.company}</td><td>{x.category}</td></tr>
              ))}</tbody>
            </table>}
          </div>
        </section>

        {/* パフォーマンス */}
        <section id="performance" className="grid gap-3">
          <h3 className="text-xl font-semibold">パフォーマンス（上位）</h3>
          <div className="card overflow-x-auto">
            {!metrics.data ? <div>読み込み中…（`fund_sources` 登録→/api/sync/perf）</div> :
            <table>
              <thead><tr><th>ISIN</th><th>最終日</th><th>1年</th><th>3年</th><th>5年</th><th>Vol(3y)</th><th>MDD(3y)</th></tr></thead>
              <tbody>{metrics.data.slice(0,50).map((x,i)=>(
                <tr key={i}><td>{x.isin}</td><td>{x.asof}</td>
                <td>{fmt(x.ret_1y)}</td><td>{fmt(x.ret_3y)}</td><td>{fmt(x.ret_5y)}</td>
                <td>{fmt(x.vol_3y)}</td><td>{fmt(x.mdd_3y)}</td></tr>
              ))}</tbody>
            </table>}
          </div>
        </section>

        {/* ライフプラン */}
        <section id="planner" className="grid gap-3">
          <h3 className="text-xl font-semibold">ライフプラン（積立→取り崩し）</h3>
          <PlannerSim/>
        </section>

        {/* ページトップへ */}
        <div className="text-center">
          <a href="#" className="btn-ghost">↑ ページ上部へ</a>
        </div>

        <p className="subtle text-center">
          ※ 本アプリは情報提供のみを目的としています。投資判断はご自身の責任で行ってください。
        </p>
      </main>
    </>
  );
}

function fmt(x){ if(x==null) return "-"; return (Math.round(x*1000)/10).toFixed(1)+'%'; }
