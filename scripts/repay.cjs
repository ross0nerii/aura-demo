const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { ethers } = require("ethers");

const addr = "0xB87Fd9C896c1d2613384f20a8e490C0C9705051A";
const abi  = [
  "function repay() external payable",
  "function debtWei(address user) view returns (uint256)"
];

(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const c = new ethers.Contract(addr, abi, wallet);

  const debt = await c.debtWei(wallet.address);
  if (debt === 0n) { console.log("No debt"); return; }

  const tx = await c.repay({ value: debt });
  console.log("repay tx:", tx.hash);
  await tx.wait();
  console.log("✅ Repaid. Debt is now 0.");
})();
