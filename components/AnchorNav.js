
export default function AnchorNav(){
  const items = [
    ["overview","概要"],
    ["diagnosis","診断"],
    ["portfolio","私のPF"],
    ["nisa","NISA銘柄"],
    ["performance","パフォーマンス"],
    ["community","みんなのPF"],
    ["planner","ライフプラン"],
  ];
  return (
    <div className="sticky top-12 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="container py-2 overflow-x-auto">
        <nav className="flex gap-3 whitespace-nowrap text-sm">
          {items.map(([id,label])=> (
            <a key={id} href={`#${id}`} className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50">{label}</a>
          ))}
        </nav>
      </div>
    </div>
  );
}
