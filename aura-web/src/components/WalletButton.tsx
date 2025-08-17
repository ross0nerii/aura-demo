import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

export default function Wallet() {
  const [account, setAccount] = useState<string>("");

  async function connect() {
    if (!(window as any).ethereum) {
      alert("Install MetaMask");
      return;
    }
    const provider = new BrowserProvider((window as any).ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0] ?? "");
  }

  useEffect(() => {
    // автоподхват если уже подключён
    if ((window as any).ethereum?.selectedAddress) {
      setAccount((window as any).ethereum.selectedAddress);
    }
  }, []);

  return (
    <div style={{ margin: "12px 0" }}>
      {account ? (
        <div>Connected: <b>{account}</b></div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
