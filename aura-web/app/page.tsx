import Wallet from "@/components/Wallet";
import ContractCard from "@/components/ContractCard";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Aura Web is up ✅</h1>
          <p className="text-sm text-gray-500">Next.js + Tailwind + Ethers + AuraScoreBank.</p>
        </div>
        <Wallet />
      </div>
      <ContractCard />
    </main>
  );
}