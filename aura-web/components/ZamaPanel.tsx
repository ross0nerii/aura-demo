"use client";
import React, { useState } from "react";
import { submitEncryptedScore } from "@/lib/relayerInstance";
import { getBrowserSigner } from "@/lib/contract";

export default function ZamaPanel({ onUpdated }: { onUpdated?: () => void }) {
  const [score, setScore] = useState<string>("720");
  const [status, setStatus] = useState<string>("Not submitted");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    try {
      setBusy(true);
      setStatus("Connecting wallet…");
      const signer = await getBrowserSigner();
      if (!signer) { setStatus("Install MetaMask"); return; }
      const user = await signer.getAddress();

      setStatus("Encrypting & sending to oracle…");
      const r = await submitEncryptedScore(user, Number(score));

      if (r.ok) {
        setStatus(`✅ Terms updated (tier ${r.tier}). Tx: ${r.txHash.slice(0,10)}…`);
        onUpdated?.();
      } else {
        setStatus("❌ Oracle error");
      }
    } catch (e: any) {
      setStatus("❌ " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-500">
        Your score stays private. Oracle writes only cap/rate to the chain.
      </div>
      <div className="flex items-center gap-2">
        <input
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="px-3 py-2 border rounded w-32"
          type="number"
          min={0}
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        >
          Decrypt my terms (Zama)
        </button>
      </div>
      <div className="text-sm text-gray-600 whitespace-pre-wrap">{status}</div>
    </div>
  );
}