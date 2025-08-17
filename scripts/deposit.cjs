require('dotenv').config();
const { ethers } = require('ethers');

const RPC  = process.env.SEPOLIA_RPC_URL;
const PK   = process.env.PRIVATE_KEY;
const ADDR = process.env.CONTRACT_ADDRESS;

if (!RPC || !PK || !ADDR) {
  console.error('Missing SEPOLIA_RPC_URL / PRIVATE_KEY / CONTRACT_ADDRESS in .env');
  process.exit(1);
}

// сумма из аргумента или из ENV, по умолчанию 0.05
const amountEth = process.argv[2] || process.env.DEPOSIT_ETH || "0.05";

(async () => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet   = new ethers.Wallet(PK, provider);

    const ABI = [ "function depositLiquidity() external payable" ];
    const c = new ethers.Contract(ADDR, ABI, wallet);

    const tx = await c.depositLiquidity({ value: ethers.parseEther(amountEth) });
    console.log(`deposit ${amountEth} ETH tx:`, tx.hash);
    await tx.wait();
    console.log('✅ deposit done');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();