
'use client';
import NavBar from "@/components/NavBar";
import useSWR from "swr";
const fetcher = (u)=> fetch(u).then(r=>r.json());
export default function Page(){
  const { data, error } = useSWR('/api/funds?nisa=tsumitate', fetcher);
  return (
    <>
      <NavBar/>
      <main className="container py-6 grid gap-4">
        <h2 className="text-xl font-semibold">NISA対象（つみたて）</h2>
        {!data && !error && <div className="card">読み込み中…（Supabaseを設定して /api/sync/nisa を実行してください）</div>}
        {error && <div className="card text-rose-700">エラー：{String(error)}</div>}
        {data && (
          <div className="card overflow-x-auto">
            <table>
              <thead><tr><th>ISIN</th><th>ファンド名</th><th>会社</th><th>分類</th></tr></thead>
              <tbody>{data.map((x,i)=>(<tr key={i}><td>{x.isin}</td><td>{x.name}</td><td>{x.company}</td><td>{x.category}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
