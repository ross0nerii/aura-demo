const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { ethers } = require("ethers");

const addr = "0xB87Fd9C896c1d2613384f20a8e490C0C9705051A";
const abi  = ["function setTier(address user, uint8 tier) external"];

(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const c = new ethers.Contract(addr, abi, wallet);

  const user = wallet.address;   // себе
  const tier = 1;                // Tier1: лучшие условия
  const tx = await c.setTier(user, tier);
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ Tier set to", tier, "for", user);
})();
