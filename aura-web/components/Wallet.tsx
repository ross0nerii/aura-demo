"use client";
import React, { useEffect, useState } from "react";
import { getBrowserSigner } from "@/lib/contract";

export default function Wallet() {
  const [addr, setAddr] = useState<string>("");

  async function connect() {
    const s = await getBrowserSigner();
    if (s) setAddr(await s.getAddress());
  }
  function disconnect() { setAddr(""); }

  useEffect(() => {
    const eth = (globalThis as any).ethereum;
    if (!eth) return;
    eth.on?.("accountsChanged", (accs: string[]) => setAddr(accs?.[0] || ""));
    // пробуем восстановиться молча
    (async () => { try { await connect(); } catch {} })();
  }, []);

  return (
    <div className="flex items-center gap-3">
      {addr ? (
        <>
          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-sm">
            {addr.slice(0,6)}…{addr.slice(-4)}
          </span>
          <button onClick={disconnect} className="px-3 py-2 rounded bg-black text-white">
            Disconnect
          </button>
        </>
      ) : (
        <button onClick={connect} className="px-3 py-2 rounded bg-black text-white">
          Connect Wallet
        </button>
      )}
    </div>
  );
}