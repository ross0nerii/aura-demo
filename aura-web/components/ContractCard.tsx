"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getBrowserSigner, getContract, CONTRACT_ADDRESS } from "@/lib/contract";
import ZamaPanel from "./ZamaPanel";

export default function ContractCard() {
  const [addr, setAddr] = useState<string>("");
  const [terms, setTerms] = useState<{ cap: string; rate: string }>({ cap: "-", rate: "-" });
  const [amount, setAmount] = useState("0.01");
  const [debt, setDebt] = useState<string>("-");
  const [log, setLog] = useState<string>("");

  const read = useMemo(() => getContract(), []);

  async function refreshAll() {
    try { const s = await getBrowserSigner(); if (s) setAddr(await s.getAddress()); } catch {}
    try {
      const who = addr || ethers.ZeroAddress;
      const [capWei, rateBps] = await read.activeTerms(who);
      setTerms({ cap: `${ethers.formatEther(capWei)} ETH`, rate: `${(Number(rateBps)/100).toFixed(2)} %` });
    } catch { setTerms({ cap: "-", rate: "-" }); }
    try {
      const who = addr || ethers.ZeroAddress;
      const d = await read.debtWei(who);
      setDebt(d > 0n ? `${ethers.formatEther(d)} ETH` : "0");
    } catch { setDebt("-"); }
  }

  useEffect(() => { refreshAll(); /* eslint-disable-next-line */ }, [addr]);

  async function withSigner<T>(fn: (c: ethers.Contract, s: ethers.Signer) => Promise<T>) {
    setLog("Waiting for wallet…");
    const signer = await getBrowserSigner();
    if (!signer) { setLog("Install/enable wallet provider"); return; }
    const c = getContract(signer);
    return fn(c, signer);
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Terms */}
      <div className="rounded-2xl border p-5">
        <div className="text-xl font-semibold mb-4">Your loan terms</div>
        <div className="space-y-1 text-sm text-gray-700">
          <div>Cap: {terms.cap}</div>
          <div>Rate: {terms.rate}</div>
          <div>Current debt: {debt}</div>
        </div>
        <div className="mt-3">
          <button className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={refreshAll}>
            Refresh
          </button>
        </div>
        <div className="mt-6">
          <ZamaPanel onUpdated={refreshAll} />
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl border p-5">
        <div className="text-xl font-semibold mb-4">Actions</div>

        <label className="text-sm text-gray-600">Borrow amount (ETH)</label>
        <div className="flex gap-2">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="px-3 py-2 border rounded flex-1" />
          <button
            className="px-4 py-2 rounded bg-indigo-600 text-white"
            onClick={() => withSigner(async (c) => {
              try {
                const wei = ethers.parseEther(amount);
                const tx = await c.borrow(wei);
                setLog(`Borrow tx: ${tx.hash}`); await tx.wait();
                setLog(`✅ Borrowed ${amount} ETH`); refreshAll();
              } catch (e: any) { setLog("❌ " + (e?.shortMessage || e?.message || String(e))); }
            })}
          >
            Borrow
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            className="flex-1 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => withSigner(async (c) => {
              try {
                const s = await getBrowserSigner(); if (!s) throw new Error("wallet?");
                const d = await c.debtWei(await s.getAddress());
                if (d === 0n) { setLog("No debt"); return; }
                const tx = await c.repay({ value: d });
                setLog(`Repay tx: ${tx.hash}`); await tx.wait();
                setLog(`✅ Repaid fully`); refreshAll();
              } catch (e: any) { setLog("❌ " + (e?.shortMessage || e?.message || String(e))); }
            })}
          >
            Repay full
          </button>

          <button
            className="flex-1 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => withSigner(async (c) => {
              try {
                const value = ethers.parseEther("0.005");
                const tx = await c.repayPartial({ value });
                setLog(`Repay partial tx: ${tx.hash}`); await tx.wait();
                setLog(`✅ Repaid 0.005 ETH`); refreshAll();
              } catch (e: any) { setLog("❌ " + (e?.shortMessage || e?.message || String(e))); }
            })}
          >
            Repay 0.005 ETH
          </button>
        </div>

        <div className="mt-3">
          <button
            className="w-full px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => withSigner(async (c) => {
              try {
                const tx = await c.depositLiquidity({ value: ethers.parseEther("0.2") });
                setLog(`Deposit tx: ${tx.hash}`); await tx.wait();
                setLog("✅ Liquidity +0.2 ETH");
              } catch (e: any) { setLog("❌ " + (e?.shortMessage || e?.message || String(e))); }
            })}
          >
            Add liquidity 0.2 ETH
          </button>
        </div>

        <div className="mt-4 text-xs whitespace-pre-wrap text-gray-600">{log}</div>
      </div>

      {/* Pool */}
      <div className="rounded-2xl border p-5">
        <div className="text-xl font-semibold mb-4">Pool</div>
        <div className="text-sm break-all text-gray-700">{CONTRACT_ADDRESS}</div>
        <a className="text-sm text-indigo-600 underline mt-2 inline-block"
           href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank">
          View on Etherscan ↗
        </a>
      </div>
    </div>
  );
}