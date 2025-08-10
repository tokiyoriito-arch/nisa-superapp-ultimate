
import Link from "next/link";
export default function NavBar(){
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="container py-3 flex items-center justify-between">
        <Link href="/" className="font-bold">NISA Super App</Link>
        <nav className="hidden md:flex gap-4">
          <Link href="/wizard" className="navlink">診断</Link>
          <Link href="/nisa" className="navlink">NISA銘柄</Link>
          <Link href="/performance" className="navlink">パフォーマンス</Link>
          <Link href="/portfolio" className="navlink">私のPF</Link>
          <Link href="/community" className="navlink">みんなのPF</Link>
          <Link href="/planner" className="navlink">ライフプラン</Link>
        </nav>
      </div>
    </header>
  );
}
