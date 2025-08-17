// scripts/demo.cjs
require('dotenv').config();
const { ethers } = require('ethers');

const RPC   = process.env.SEPOLIA_RPC_URL;
const PK    = process.env.PRIVATE_KEY;
const ADDR  = process.env.CONTRACT_ADDRESS;
const AMT   = process.argv[2] || "0.05";      // ликвидность в ETH
const BORR  = process.argv[3] || "0.01";      // займ в ETH

async function main() {
  if (!RPC || !PK || !ADDR) {
    console.error("Missing SEPOLIA_RPC_URL / PRIVATE_KEY / CONTRACT_ADDRESS in .env");
    process.exit(1);
  }
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet   = new ethers.Wallet(PK, provider);

  const ABI = [
    "function depositLiquidity() external payable",
    "function activeTerms(address user) view returns (uint256 capWei, uint16 rateBps)",
    "function borrow(uint256 amountWei) external",
    "function repay() external payable",
    "function debtWei(address user) view returns (uint256)"
  ];
  const c = new ethers.Contract(ADDR, ABI, wallet);

  console.log("➕ Deposit liquidity:", AMT, "ETH");
  const tx1 = await c.depositLiquidity({ value: ethers.parseEther(AMT) });
  console.log("  tx:", tx1.hash); await tx1.wait();

  const [cap, rateBps] = await c.activeTerms(wallet.address);
  console.log("📜 Terms => cap:", ethers.formatEther(cap), "ETH  rate:", (Number(rateBps)/100).toFixed(2), "%");

  console.log("💳 Borrow:", BORR, "ETH");
  const tx2 = await c.borrow(ethers.parseEther(BORR));
  console.log("  tx:", tx2.hash); await tx2.wait();

  const debt = await c.debtWei(wallet.address);
  console.log("🧮 Debt after borrow:", ethers.formatEther(debt), "ETH");

  console.log("✅ Repay exact debt");
  const tx3 = await c.repay({ value: debt });
  console.log("  tx:", tx3.hash); await tx3.wait();

  console.log("🎉 Done");
}

main().catch((e) => {
  console.error("demo error:", e);
  process.exit(1);
});