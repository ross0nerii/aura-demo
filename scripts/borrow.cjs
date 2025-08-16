const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { ethers } = require("ethers");

const addr = "0xB87Fd9C896c1d2613384f20a8e490C0C9705051A";
const abi  = [
  "function borrow(uint256 amountWei) external",
  "function debtWei(address user) view returns (uint256)"
];

(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const c = new ethers.Contract(addr, abi, wallet);

  const amount = ethers.parseEther("0.1");
  const tx = await c.borrow(amount);
  console.log("borrow tx:", tx.hash);
  await tx.wait();

  const debt = await c.debtWei(wallet.address);
  console.log("✅ Borrowed 0.1 ETH, current debt:", ethers.formatEther(debt), "ETH");
})();
