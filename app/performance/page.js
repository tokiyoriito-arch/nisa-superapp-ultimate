
'use client';
import NavBar from "@/components/NavBar";
import useSWR from "swr";
import { LineChart } from "@/components/Charts";
const fetcher = (u)=> fetch(u).then(r=>r.json());
export default function Page(){
  const { data } = useSWR('/api/metrics', fetcher);
  return (
    <>
      <NavBar/>
      <main className="container py-6 grid gap-4">
        <h2 className="text-xl font-semibold">パフォーマンス（上位）</h2>
        {!data && <div className="card">読み込み中…（`fund_sources` に CSV を登録→/api/sync/perf）</div>}
        {data && (
          <div className="card overflow-x-auto">
            <table>
              <thead><tr><th>ISIN</th><th>最終日</th><th>1年</th><th>3年</th><th>5年</th><th>Vol(3y)</th><th>MDD(3y)</th></tr></thead>
              <tbody>{data.map((x,i)=>(
                <tr key={i}><td>{x.isin}</td><td>{x.asof}</td>
                <td>{fmt(x.ret_1y)}</td><td>{fmt(x.ret_3y)}</td><td>{fmt(x.ret_5y)}</td>
                <td>{fmt(x.vol_3y)}</td><td>{fmt(x.mdd_3y)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
function fmt(x){ if(x==null) return "-"; return (Math.round(x*1000)/10).toFixed(1)+'%'; }
