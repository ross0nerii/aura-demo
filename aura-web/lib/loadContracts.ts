export type Deployed = {
  network: string;
  deployer: string;
  AuraScore?: string;
  AuraTier?: string;
  FHECounter?: string;
};

// грузим адреса и ABI, которые мы положим в public/ через sync
export async function loadDeployed(networkKey: "localhost" | "sepolia"): Promise<Deployed> {
  const res = await fetch(`/contracts/deployed_${networkKey}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error("Не нашёл файл адресов");
  return res.json();
}

export async function loadAbi(name: "AuraScore" | "AuraTier" | "FHECounter") {
  const res = await fetch(`/abi/${name}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Не нашёл ABI ${name}`);
  return res.json();
}
