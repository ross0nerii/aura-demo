"use client";

import WalletButton from "@/src/components/WalletButton";
import { useState } from "react";
import { getContract } from "@/src/lib/contracts";
// пример: загрузим любой ABI из src/lib/abi, подставь нужное имя файла
import exampleAbi from "@/src/lib/abi/Greeter.json"; // заменишь на свой контракт
// и ключ в deployed_*.json должен совпадать, напр. "Greeter"
const CONTRACT_KEY = "Greeter";

export default function Home() {
  const [result, setResult] = useState<string>("");

  const callRead = async () => {
    try {
      const c = await getContract(CONTRACT_KEY, exampleAbi as any);
      // для примера читаем метод greet() — поменяй под свой контракт
      const value = await c.greet?.();
      setResult(String(value));
    } catch (e: any) {
      setResult(e?.message ?? String(e));
    }
  };

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Aura Web</h1>
        <WalletButton />
      </header>

      <section className="space-y-3">
        <p className="text-sm text-zinc-400">
          ABI берутся из <code>src/lib/abi</code>, адреса — из{" "}
          <code>public/deployed/deployed_*.json</code>. Команда <code>npm run sync</code> всё
          копирует автоматически.
        </p>

        <div className="flex gap-3">
          <button
            onClick={callRead}
            className="px-4 py-2 rounded-2xl bg-blue-600 text-white shadow"
          >
            Читать из контракта
          </button>
        </div>

        {result && (
          <pre className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl overflow-x-auto">
            {result}
          </pre>
        )}
      </section>
    </main>
  );
}
