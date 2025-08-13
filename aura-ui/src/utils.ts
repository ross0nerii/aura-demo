// aura-ui/src/utils.ts
type Transfer = {
  hash: string;
  blockNum: string; // hex
  metadata?: { blockTimestamp?: string };
  to?: string | null;
  from?: string | null;
  rawContract?: { address?: string | null };
};

const ALCHEMY_URL = (apiKey: string) =>
  `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`;

async function rpc<T>(url: string, method: string, params: any[]): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} failed: ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(j.error.message || "RPC error");
  return j.result as T;
}

// Запрашиваем переводы (в т.ч. internal/erc20/721/1155) — в две стороны.
async function getTransfers(address: string, apiKey: string) {
  const url = ALCHEMY_URL(apiKey);
  const base = {
    fromBlock: "0x0",
    toBlock: "latest",
    category: ["external", "internal", "erc20", "erc721", "erc1155"],
    withMetadata: true,
    maxCount: "0x3e8", // до ~1000 событий
    order: "asc" as const,
  };

  const [outbound, inbound] = await Promise.all([
    rpc<{ transfers: Transfer[] }>(url, "alchemy_getAssetTransfers", [
      { ...base, fromAddress: address },
    ]),
    rpc<{ transfers: Transfer[] }>(url, "alchemy_getAssetTransfers", [
      { ...base, toAddress: address },
    ]),
  ]);

  return [...(outbound.transfers || []), ...(inbound.transfers || [])].sort(
    (a, b) => parseInt(a.blockNum, 16) - parseInt(b.blockNum, 16)
  );
}

export async function summarizeAddress(
  address: string,
  apiKey: string
): Promise<{ months: number; dapps: number; firstSeen?: Date }> {
  const transfers = await getTransfers(address, apiKey);

  if (!transfers.length) {
    // Нулевая активность — считаем 0 месяцев и 0 dApps
    return { months: 0, dapps: 0 };
  }

  // Первая дата активности
  const ts =
    transfers[0].metadata?.blockTimestamp ??
    // fallback: блок в секундах → Date
    new Date().toISOString();
  const firstSeen = new Date(ts);

  // Месяцы «возраста»
  const now = new Date();
  const months =
    (now.getFullYear() - firstSeen.getFullYear()) * 12 +
    (now.getMonth() - firstSeen.getMonth());

  // Приблизительно считаем количество dApps:
  // уникальные адреса-контракты, с которыми были исходящие взаимодействия
  const uniqueTargets = new Set<string>();
  for (const t of transfers) {
    const to = (t.rawContract?.address ?? t.to ?? "").toLowerCase();
    // адреса кошельков «to» без кода отбрасываем; детект контракта простым эвристическим способом
    if (to && to !== address.toLowerCase() && to.length === 42) {
      uniqueTargets.add(to);
    }
  }

  return {
    months: months < 0 ? 0 : months,
    dapps: Math.min(uniqueTargets.size, 999),
    firstSeen,
  };
}

// Простая формула оценки (можешь менять)
// Пример: 60 баллов за каждый месяц + 10 за каждый dApp; потолок 1000
export function estimateScore(months: number, dapps: number) {
  return Math.min(months * 60 + dapps * 10, 1000);
}

// Мэп скор → tier (примерная лесенка, подправим позже)
export function scoreToTier(score: number) {
  if (score >= 600) return 3;
  if (score >= 300) return 2;
  if (score >= 120) return 1;
  return 0;
}
