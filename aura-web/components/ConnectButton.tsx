// aura-web/components/ConnectButton.tsx
"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getBrowserSigner } from "@/lib/contract";

export default function ConnectButton() {
  const [addr, setAddr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const signer = await getBrowserSigner();
        if (signer) setAddr(await signer.getAddress());
      } catch {}
    })();
  }, []);

  async function connect() {
    const signer = await getBrowserSigner();
    if (signer) setAddr(await signer.getAddress());
  }

  if (addr) {
    return (
      <div className="px-3 py-2 rounded-xl bg-green-100 text-green-800 text-sm">
        {addr.slice(0, 6)}…{addr.slice(-4)}
      </div>
    );
  }
  return (
    <button
      onClick={connect}
      className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
    >
      Connect Wallet
    </button>
  );
}