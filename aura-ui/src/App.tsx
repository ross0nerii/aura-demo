import WalletBar from "./components/WalletBar";
import TierPanel from "./components/TierPanel";
import LendingPanel from "./components/LendingPanel";

export default function App() {
  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px" }}>
      <WalletBar />
      <TierPanel />
      <LendingPanel />
    </div>
  );
}
