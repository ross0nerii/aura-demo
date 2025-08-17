import { useEffect, useState } from "react";
import Wallet from "@components/WalletButton";
import ContractCard from "@components/ContractCard";
import { loadDeployed } from "@lib/loadContracts";

export default function App() {
  const [deployed, setDeployed] = useState<any>(null);

  useEffect(() => {
    loadDeployed().then(setDeployed).catch(console.error);
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", margin: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Aura demo</h1>
      <Wallet />
      <hr />
      {!deployed ? (
        <p>Loading deployed addresses…</p>
      ) : (
        <>
          <ContractCard title="AuraScore" address={deployed.AuraScore} />
          <ContractCard title="AuraTier" address={deployed.AuraTier} />
          <ContractCard title="FHECounter" address={deployed.FHECounter} />
        </>
      )}
    </div>
  );
}
