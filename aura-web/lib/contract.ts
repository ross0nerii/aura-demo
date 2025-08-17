import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

const ABI = [
  "function activeTerms(address user) view returns (uint256 capWei, uint16 rateBps)",
  "function debtWei(address user) view returns (uint256)",
  "function borrow(uint256 amountWei) external",
  "function repay() external payable",
  "function repayPartial() external payable",
  "function depositLiquidity() external payable",
  "function oracleCallbackDecryptedTerms(address user, uint256 capWei, uint16 rateBps) external"
];

export function getReadProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export async function getBrowserSigner(): Promise<ethers.Signer | null> {
  const eth = (globalThis as any).ethereum;
  if (!eth) return null;
  const provider = new ethers.BrowserProvider(eth);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export function getContract(runner?: ethers.Signer | ethers.AbstractProvider) {
  const r = runner ?? getReadProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, r);
}