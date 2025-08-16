const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { ethers } = require("ethers");

const addr = "0xB87Fd9C896c1d2613384f20a8e490C0C9705051A";
const abi  = ["function activeTerms(address user) view returns (uint256 capWei, uint16 rateBps)"];

(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const c = new ethers.Contract(addr, abi, provider);

  const [capWei, rateBps] = await c.activeTerms(wallet.address);
  console.log("cap:", ethers.formatEther(capWei), "ETH");
  console.log("rate:", (Number(rateBps)/100).toFixed(2), "%");
})();
