// aura-web/components/ActionsCard.tsx
"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { getWriteContract, getBrowserSigner } from "@/lib/contract";

export default function ActionsCard() {
  const [borrowAmt, setBorrowAmt] = useState("0.05");
  const [status, setStatus] = useState<string>("");

  async function withTx<T>(fn: () => Promise<T>) {
    try {
      setStatus("Waiting for wallet…");
      const tx: any = await fn();
      setStatus("Tx sent: " + tx.hash.slice(0, 10) + "…");
      await tx.wait();
      setStatus("✅ Done");
    } catch (e: any) {
      setStatus("❌ " + (e?.message ?? e));
    }
  }

  return (
    <div className="rounded-2xl border p-5 shadow-sm space-y-3">
      <div className="text-lg font-semibold">Actions</div>

      {/* Borrow */}
      <div className="flex items-center gap-2">
        <input
          value={borrowAmt}
          onChange={(e) => setBorrowAmt(e.target.value)}
          className="border rounded-lg px-3 py-2 w-32"
          placeholder="ETH"
        />
        <button
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={() =>
            withTx(async () => {
              const c = await getWriteContract();
              const wei = ethers.parseEther(borrowAmt || "0");
              return c.borrow(wei);
            })
          }
        >
          Borrow
        </button>
      </div>

      {/* Repay all */}
      <button
        className="px-4 py-2 rounded-xl border hover:bg-gray-50"
        onClick={() =>
          withTx(async () => {
            const signer = await getBrowserSigner();
            if (!signer) throw new Error("No wallet");
            const me = await signer.getAddress();
            const c = await getWriteContract();
            const d = await c.debtWei(me);
            return c.repay({ value: d });
          })
        }
      >
        Repay full
      </button>

      {/* LP deposit */}
      <button
        className="px-4 py-2 rounded-xl border hover:bg-gray-50"
        onClick={() =>
          withTx(async () => {
            const c = await getWriteContract();
            // для демо фикс: заливаем 0.2 ETH ликвидности
            return c.depositLiquidity({ value: ethers.parseEther("0.2") });
          })
        }
      >
        Add 0.2 ETH Liquidity
      </button>

      {status && <div className="text-sm text-gray-600">{status}</div>}
    </div>
  );
}