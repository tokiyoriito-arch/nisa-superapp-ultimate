
'use client';
import NavBar from "@/components/NavBar";
import useSWR from "swr";
const fetcher = (u)=> fetch(u).then(r=>r.json());
export default function Page(){
  const { data } = useSWR('/api/portfolio/crowd', fetcher);
  return (
    <>
      <NavBar/>
      <main className="container py-6 grid gap-4">
        <h2 className="text-xl font-semibold">みんなの平均配分</h2>
        {!data && <div className="card">読み込み中…</div>}
        {data && (
          <div className="card">
            <div className="text-slate-600 text-sm mb-2">集計数：{data.n}</div>
            <pre className="text-sm">{JSON.stringify(data.avg, null, 2)}</pre>
          </div>
        )}
      </main>
    </>
  );
}
