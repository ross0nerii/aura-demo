require('dotenv').config();
const { ethers } = require('ethers');

const RPC  = process.env.SEPOLIA_RPC_URL;
const ADDR = process.env.CONTRACT_ADDRESS;

if (!RPC || !ADDR) { console.error('Missing SEPOLIA_RPC_URL / CONTRACT_ADDRESS in .env'); process.exit(1); }

(async () => {
  const provider = new ethers.JsonRpcProvider(RPC);
  const bal = await provider.getBalance(ADDR);
  console.log('contract balance =', ethers.formatEther(bal), 'ETH');
})();
