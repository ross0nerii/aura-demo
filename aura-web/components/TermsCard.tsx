// aura-web/components/TermsCard.tsx
"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getReadContract, getBrowserSigner } from "@/lib/contract";

export default function TermsCard() {
  const [cap, setCap] = useState<string>("-");
  const [rate, setRate] = useState<string>("-");

  async function load() {
    const signer = await getBrowserSigner();
    if (!signer) return;
    const me = await signer.getAddress();
    const c = getReadContract();
    const [capWei, rateBps] = await c.activeTerms(me);
    setCap(ethers.formatEther(capWei) + " ETH");
    setRate((Number(rateBps) / 100).toFixed(2) + " %");
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  return (
    <div className="rounded-2xl border p-5 shadow-sm">
      <div className="text-lg font-semibold mb-2">Your Loan Terms</div>
      <div className="text-sm text-gray-600">Cap: {cap}</div>
      <div className="text-sm text-gray-600">Rate: {rate}</div>
      <button
        onClick={load}
        className="mt-3 text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50"
      >
        Refresh
      </button>
    </div>
  );
}