"use client";
import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";

export async function getProvider(): Promise<BrowserProvider> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("Нет injected провайдера (Metamask?)");
  }
  // @ts-ignore
  return new BrowserProvider(window.ethereum);
}

export async function getSigner(): Promise<JsonRpcSigner> {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  return await provider.getSigner();
}

export async function getChainId(): Promise<number> {
  const provider = await getProvider();
  const net = await provider.getNetwork();
  return Number(net.chainId);
}

type DeployedMap = Record<string, { address: string }>;

export async function loadDeployed(): Promise<DeployedMap> {
  const chainId = await getChainId();
  // по умолчанию пробуем sepolia и localhost — добавишь другие по мере надобности
  const name =
    chainId === 11155111 ? "sepolia" : chainId === 31337 ? "localhost" : "localhost";

  const res = await fetch(`/deployed/deployed_${name}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Не нашёл deployed_${name}.json в /public/deployed`);
  return await res.json();
}

export async function getContract(
  contractKey: string,
  abi: any
): Promise<Contract> {
  const deployed = await loadDeployed();
  const meta = deployed[contractKey];
  if (!meta?.address) {
    throw new Error(`В deployed_* не найден ключ "${contractKey}"`);
  }
  const signer = await getSigner();
  return new Contract(meta.address, abi, signer);
}
