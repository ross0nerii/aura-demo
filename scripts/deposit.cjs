const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { ethers } = require("ethers");

const addr = "0xB87Fd9C896c1d2613384f20a8e490C0C9705051A";
const abi  = ["function depositLiquidity() external payable"];

(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const c = new ethers.Contract(addr, abi, wallet);

  console.log("Sending deposit 0.5 ETH...");
  const tx = await c.depositLiquidity({ value: ethers.parseEther("0.5") });
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ Deposited. Check Etherscan tx.");
})();
