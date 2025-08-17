require('dotenv').config();
const { ethers } = require('ethers');

const RPC   = process.env.SEPOLIA_RPC_URL;
const PK    = process.env.PRIVATE_KEY;
const ADDR  = process.env.CONTRACT_ADDRESS;
const ORACLE_ADDR = process.argv[2] || process.env.ORACLE_ADDRESS;

if (!RPC || !PK || !ADDR || !ORACLE_ADDR) { console.error('Usage: node scripts/setOracle.cjs 0xOracleAddress'); process.exit(1); }
if (!/^0x[0-9a-fA-F]{40}$/.test(ORACLE_ADDR)) { console.error('ORACLE_ADDR должен быть адресом (0x + 40 hex), не приватным ключом!'); process.exit(1); }

(async () => {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet   = new ethers.Wallet(PK, provider);
  // Если в контракте setter назван иначе (например setDecryptionOracle), поменяй строку ниже:
  const ABI = [ "function setOracle(address) external" ];
  const c = new ethers.Contract(ADDR, ABI, wallet);
  const tx = await c.setOracle(ORACLE_ADDR);
  console.log('setOracle tx:', tx.hash);
  await tx.wait();
  console.log('Oracle set to', ORACLE_ADDR);
})();
