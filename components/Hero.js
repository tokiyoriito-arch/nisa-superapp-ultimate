
import Link from "next/link";
export default function Hero(){
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-sky-100 to-transparent">
      <div className="container py-10 grid md:grid-cols-2 gap-4 items-center">
        <div>
          <h1 className="text-3xl font-bold">NISAの「探す→積立→取り崩し」を、これ1つで。</h1>
          <p className="mt-2 text-slate-700">対象銘柄の自動更新、パフォーマンス可視化、配分診断、匿名ポートフォリオ集計、ライフプランの取り崩しシミュレーションまで。</p>
          <div className="flex gap-2 mt-4">
            <Link href="/wizard" className="btn">診断を始める</Link>
            <Link href="/planner" className="btn-ghost">取り崩しを試す</Link>
          </div>
          <p className="subtle mt-2">※ 情報提供のみ。将来成果は保証されません。</p>
        </div>
        <div className="card"><div className="aspect-[16/10] grid place-items-center text-slate-400">プレビュー</div></div>
      </div>
    </section>
  );
}
