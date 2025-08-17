// Отправка "зашифрованного" скора в локальный oracle (worker.cjs)
const ORACLE_URL = process.env.NEXT_PUBLIC_ORACLE_URL || "http://localhost:8787";

export function fakeEncryptScore(score: number): `0x${string}` {
  const buf = new Uint8Array(8);
  const dv = new DataView(buf.buffer);
  const n = BigInt(Math.max(0, Math.floor(score)));
  dv.setBigUint64(0, n, false); // BE
  let out = "0x";
  for (const b of buf) out += b.toString(16).padStart(2, "0");
  return out as `0x${string}`;
}

export async function submitEncryptedScore(user: string, scorePlain: number) {
  const scoreEnc = fakeEncryptScore(scorePlain);
  const payload = { user, scoreEnc, attestation: "0x" };

  const res = await fetch(`${ORACLE_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`oracle error: ${t || res.statusText}`);
  }
  return res.json() as Promise<{
    ok: boolean;
    tier: number;
    capWei: string;
    rateBps: number;
    txHash: string;
  }>;
}