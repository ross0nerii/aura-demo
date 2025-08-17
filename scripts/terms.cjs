require('dotenv').config();
const { ethers } = require('ethers');

const RPC  = process.env.SEPOLIA_RPC_URL;
const ADDR = process.env.CONTRACT_ADDRESS;

if (!RPC || !ADDR) {
  console.error('Missing SEPOLIA_RPC_URL / CONTRACT_ADDRESS in .env');
  process.exit(1);
}

(async () => {
  const provider = new ethers.JsonRpcProvider(RPC);
  const ABI = [ "function activeTerms(address user) view returns (uint256 capWei, uint16 rateBps)" ];
  const c = new ethers.Contract(ADDR, ABI, provider);

  // подставь нужный адрес (например, твой основной)
  const user = process.argv[2] || (await provider.getSigner?.()?.getAddress?.()) || "0x0000000000000000000000000000000000000000";
  const [capWei, rateBps] = await c.activeTerms(user);
  console.log("cap:", ethers.formatEther(capWei), "ETH");
  console.log("rate:", (Number(rateBps)/100).toFixed(2), "%");
})();