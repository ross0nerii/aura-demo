// aura-web/components/PoolCard.tsx
const ADDR = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export default function PoolCard() {
  const link = `https://sepolia.etherscan.io/address/${ADDR}`;
  return (
    <div className="rounded-2xl border p-5 shadow-sm">
      <div className="text-lg font-semibold mb-2">Pool</div>
      <div className="text-sm text-gray-600 break-all">{ADDR}</div>
      <a
        href={link}
        target="_blank"
        className="inline-block mt-2 text-indigo-600 hover:underline text-sm"
      >
        View on Etherscan ↗
      </a>
    </div>
  );
}