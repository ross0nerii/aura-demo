import { useAccount, useReadContract } from "wagmi";
import { AURATIER_ABI } from "../abi";

// Адреса — из .env
const TIER_ADDR = import.meta.env.VITE_AURA_TIER as `0x${string}`;

// Пример правил по тиру (правь при желании)
const TIER_RULES: Record<number, { name: string; borrowCap: string; note?: string }> = {
  0: { name: "No tier", borrowCap: "0", note: "Mint tier to unlock borrowing" },
  1: { name: "Bronze", borrowCap: "1,000" },
  2: { name: "Silver", borrowCap: "5,000" },
  3: { name: "Gold", borrowCap: "20,000" },
  4: { name: "Platinum", borrowCap: "100,000" },
};

export default function TierPanel() {
  const { address } = useAccount();

  // Читаем наличие токенов-тиеров 1..4
  const { data: b1 } = useReadContract({
    address: TIER_ADDR,
    abi: AURATIER_ABI,
    functionName: "balanceOf",
    args: address ? [address, 1n] : undefined,
    query: { enabled: !!address },
  });
  const { data: b2 } = useReadContract({
    address: TIER_ADDR, abi: AURATIER_ABI, functionName: "balanceOf",
    args: address ? [address, 2n] : undefined, query: { enabled: !!address },
  });
  const { data: b3 } = useReadContract({
    address: TIER_ADDR, abi: AURATIER_ABI, functionName: "balanceOf",
    args: address ? [address, 3n] : undefined, query: { enabled: !!address },
  });
  const { data: b4 } = useReadContract({
    address: TIER_ADDR, abi: AURATIER_ABI, functionName: "balanceOf",
    args: address ? [address, 4n] : undefined, query: { enabled: !!address },
  });

  const balances = [0n, (b1 as bigint) || 0n, (b2 as bigint) || 0n, (b3 as bigint) || 0n, (b4 as bigint) || 0n];
  const currentTier =
    balances[4] > 0n ? 4 :
    balances[3] > 0n ? 3 :
    balances[2] > 0n ? 2 :
    balances[1] > 0n ? 1 : 0;

  const rule = TIER_RULES[currentTier];

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Your Tier</div>
      <div style={{ marginBottom: 6 }}>
        <b>Tier:</b> {rule.name} {currentTier > 0 ? `(ID ${currentTier})` : ""}
      </div>
      <div style={{ marginBottom: 6 }}>
        <b>Borrow cap by tier:</b> {rule.borrowCap} MockUSD
      </div>
      {rule.note && <div style={{ opacity: 0.8 }}>{rule.note}</div>}
      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        Tiers checked via ERC-1155 `balanceOf(user, tierId)`.
      </div>
    </div>
  );
}

// Экспортируем cap для использования в LendingPanel
export const tierBorrowCap = (tier: number) => TIER_RULES[tier]?.borrowCap ?? "0";
export const tierNumericCap = (tier: number): number => {
  const txt = TIER_RULES[tier]?.borrowCap ?? "0";
  return Number(txt.replaceAll(",", ""));
};
