
'use client';
import NavBar from "@/components/NavBar";
import useSWR from "swr";
import { Donut } from "@/components/Charts";
const fetcher = (u)=> fetch(u).then(r=>r.json());
export default function Page(){
  const { data } = useSWR('/api/portfolio/reco?age_group=30s', fetcher);
  const labels = data? Object.keys(data.alloc).map(k=>k.toUpperCase()) : [];
  const series = data? Object.values(data.alloc) : [];
  return (
    <>
      <NavBar/>
      <main className="container py-6 grid gap-4">
        <h2 className="text-xl font-semibold">かんたん診断（デモ）</h2>
        {!data && <div className="card">おすすめ配分を計算中…</div>}
        {data && (
          <div className="card">
            <div className="font-medium mb-2">{data.name}（{data.risk}）モデル</div>
            <Donut labels={labels} data={series} />
          </div>
        )}
      </main>
    </>
  );
}
