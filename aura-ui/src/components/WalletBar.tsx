import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { injected } from "wagmi/connectors";

function short(addr?: string) {
  return addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "";
}
const chainName = (id: number) =>
  id === 1 ? "Ethereum" : id === 11155111 ? "Sepolia" : `Chain ${id}`;

export default function WalletBar() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderRadius: 12,
        border: "1px solid #eee",
        marginBottom: 16,
      }}
    >
      <div style={{ fontWeight: 600 }}>Aura dApp</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ opacity: 0.8 }}>
          {isConnected ? chainName(chainId) : "Not connected"}
        </div>
        {isConnected ? (
          <>
            <code>{short(address)}</code>
            <button
              onClick={() => disconnect()}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: "#ef4444",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={() => connect({ connector: injected() })}
            disabled={isPending}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "#4f46e5",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {isPending ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </div>
  );
}
