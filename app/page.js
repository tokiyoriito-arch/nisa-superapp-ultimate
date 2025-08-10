
import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import NisaGauge from "@/components/NisaGauge";
export default function Page(){
  return (
    <>
      <NavBar/>
      <Hero/>
      <main className="container py-6 grid gap-4">
        <section className="grid md:grid-cols-2 gap-4">
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
      </main>
    </>
  );
}
