
import NavBar from "@/components/NavBar";
import PlannerSim from "@/components/PlannerSim";
export default function Page(){
  return (
    <>
      <NavBar/>
      <main className="container py-6 grid gap-4">
        <h2 className="text-xl font-semibold">ライフプラン（積立→取り崩し）</h2>
        <PlannerSim/>
      </main>
    </>
  );
}
