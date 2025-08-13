// src/components/LendingPanel.tsx
import { useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { LENDING_ABI, ERC20_ABI, AURATIER_ABI } from "../abi";

// === ENV ===
const LEND_ADDR  = import.meta.env.VITE_AURA_LEND as `0x${string}`;
const TOKEN_ADDR = import.meta.env.VITE_LEND_TOKEN as `0x${string}`;
const TIER_ADDR  = import.meta.env.VITE_AURA_TIER as `0x${string}`;

// === Tier rules (правь при желании) ===
const TIER_RULES: Record<number, { name: string; cap: number }> = {
  0: { name: "No tier", cap: 0 },
  1: { name: "Bronze", cap: 1_000 },
  2: { name: "Silver", cap: 5_000 },
  3: { name: "Gold", cap: 20_000 },
  4: { name: "Platinum", cap: 100_000 },
};

export default function LendingPanel() {
  const { address } = useAccount();
  const [amount, setAmount] = useState<string>("2");

  // --- Token decimals ---
  const { data: decData } = useReadContract({
    address: TOKEN_ADDR,
    abi: ERC20_ABI,
    functionName: "decimals",
  });
  const decimals = Number(decData ?? 18);

  // --- Pool balance (token balance of lending contract) ---
  const { data: poolBalData, refetch: refetchPool } = useReadContract({
    address: TOKEN_ADDR,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [LEND_ADDR],
  });

  // --- User token balance ---
  const { data: myBalData, refetch: refetchMyBal } = useReadContract({
    address: TOKEN_ADDR,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // --- Allowance ---
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDR,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, LEND_ADDR] : undefined,
    query: { enabled: !!address },
  });

  // --- Lending reads ---
  const { data: availData, refetch: refetchAvail } = useReadContract({
    address: LEND_ADDR,
    abi: LENDING_ABI,
    functionName: "availableToBorrow",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: debtData, refetch: refetchDebt } = useReadContract({
    address: LEND_ADDR,
    abi: LENDING_ABI,
    functionName: "debt",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // --- Tier detection (ERC-1155 balanceOf) ---
  const { data: b1 } = useReadContract({
    address: TIER_ADDR,
    abi: AURATIER_ABI,
    functionName: "balanceOf",
    args: address ? [address, 1n] : undefined,
    query: { enabled: !!address },
  });
  const { data: b2 } = useReadContract({
    address: TIER_ADDR,
    abi: AURATIER_ABI,
    functionName: "balanceOf",
    args: address ? [address, 2n] : undefined,
    query: { enabled: !!address },
  });
  const { data: b3 } = useReadContract({
    address: TIER_ADDR,
    abi: AURATIER_ABI,
    functionName: "balanceOf",
    args: address ? [address, 3n] : undefined,
    query: { enabled: !!address },
  });
  const { data: b4 } = useReadContract({
    address: TIER_ADDR,
    abi: AURATIER_ABI,
    functionName: "balanceOf",
    args: address ? [address, 4n] : undefined,
    query: { enabled: !!address },
  });

  const tier = useMemo(() => {
    const n1 = (b1 as bigint) || 0n;
    const n2 = (b2 as bigint) || 0n;
    const n3 = (b3 as bigint) || 0n;
    const n4 = (b4 as bigint) || 0n;
    if (n4 > 0n) return 4;
    if (n3 > 0n) return 3;
    if (n2 > 0n) return 2;
    if (n1 > 0n) return 1;
    return 0;
  }, [b1, b2, b3, b4]);

  const tierCap = TIER_RULES[tier]?.cap ?? 0;

  // --- Parsed numbers for UI ---
  const poolBalance   = Number(formatUnits((poolBalData as bigint) ?? 0n, decimals));
  const myBalance     = Number(formatUnits((myBalData as bigint) ?? 0n, decimals));
  const allowance     = Number(formatUnits((allowanceData as bigint) ?? 0n, decimals));
  const availableOnChain = Number(formatUnits((availData as bigint) ?? 0n, decimals));
  const myDebt        = Number(formatUnits((debtData as bigint) ?? 0n, decimals));

  // Итоговый лимит в UI: минимум из ончейн-доступного и капа по тиру
  const uiBorrowCap   = Math.min(availableOnChain, tierCap);

  // --- Writes ---
  const { writeContract: write, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const refreshAll = async () => {
    await Promise.all([refetchPool(), refetchMyBal(), refetchAllowance(), refetchAvail(), refetchDebt()]);
  };

  const needApprove = useMemo(() => {
    const amt = Number(amount || "0");
    return amt > 0 && allowance < amt;
  }, [amount, allowance]);

  const doApprove = async () => {
    const amt = parseUnits(amount || "0", decimals);
    write({
      address: TOKEN_ADDR,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [LEND_ADDR, amt],
    });
  };

  const doBorrow = async () => {
    const amtNum = Number(amount || "0");
    if (amtNum <= 0) return;
    // Режем по капу
    const safeAmt = Math.min(amtNum, uiBorrowCap);
    const amt = parseUnits(String(safeAmt), decimals);
    write({
      address: LEND_ADDR,
      abi: LENDING_ABI,
      functionName: "borrow",
      args: [amt],
    });
  };

  const doRepay = async () => {
    const amtNum = Number(amount || "0");
    if (amtNum <= 0) return;
    const safeAmt = Math.min(amtNum, myBalance); // нельзя вернуть больше баланса токена
    const amt = parseUnits(String(safeAmt), decimals);
    write({
      address: LEND_ADDR,
      abi: LENDING_ABI,
      functionName: "repay",
      args: [amt],
    });
  };

  // Автообновление после успешной транзакции
  if (isSuccess) {
    // мелкая защита от лишних вызовов: один рефреш на успех
    refreshAll();
  }

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        Lending (MockUSD on Sepolia)
      </div>

      <button
        onClick={refreshAll}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          marginBottom: 14,
          fontWeight: 700,
        }}
      >
        Refresh
      </button>

      <div style={{ lineHeight: 1.6, marginBottom: 12 }}>
        <div>Pool balance: {poolBalance}</div>
        <div>My balance: {myBalance}</div>
        <div>Available to borrow (on-chain): {availableOnChain}</div>
        <div>My debt: {myDebt}</div>
        <div>Allowance: {allowance}</div>
        <div style={{ marginTop: 6 }}>
          <b>Your tier:</b> {TIER_RULES[tier]?.name ?? "Unknown"} (cap: {tierCap})
        </div>
        <div><b>UI borrow cap (min(chain, tier)):</b> {uiBorrowCap}</div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            outline: "none",
          }}
        />
        {needApprove ? (
          <button
            onClick={doApprove}
            disabled={isPending || isWaiting}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#10b981",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              minWidth: 110,
            }}
          >
            {isPending || isWaiting ? "Waiting…" : "Approve"}
          </button>
        ) : (
          <button
            onClick={doBorrow}
            disabled={isPending || isWaiting}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#4f46e5",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              minWidth: 110,
            }}
          >
            {isPending || isWaiting ? "Waiting…" : "Borrow"}
          </button>
        )}

        <button
          onClick={doRepay}
          disabled={isPending || isWaiting}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#4338ca",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            minWidth: 110,
          }}
        >
          {isPending || isWaiting ? "Waiting…" : "Repay"}
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Status: {isPending ? "Sending…" : isWaiting ? "Confirming…" : isSuccess ? "Success" : "Idle"}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
        Lending: {LEND_ADDR}
        <br />
        Token: {TOKEN_ADDR}
      </div>
    </div>
  );
}
