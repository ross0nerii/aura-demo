import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';

const {
  RPC_URL,
  ORACLE_PRIVATE_KEY,
  CONTRACT_ADDRESS,
  PORT = 8787
} = process.env;

if (!RPC_URL || !ORACLE_PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.error('Missing RPC_URL / ORACLE_PRIVATE_KEY / CONTRACT_ADDRESS in oracle/.env');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet   = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);

const ABI = [
  "function oracleCallbackDecryptedTerms(address user, uint256 capWei, uint16 rateBps) external",
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

const app = express();
app.use(bodyParser.json());

app.post('/decrypt', async (req, res) => {
  try {
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: "missing 'user' in body" });

    const capWei  = ethers.parseEther("0.1");
    const rateBps = 500;

    const tx = await contract.oracleCallbackDecryptedTerms(user, capWei, rateBps);
    console.log('oracle callback tx:', tx.hash);
    await tx.wait();

    res.json({ ok: true, tx: tx.hash, capWei: capWei.toString(), rateBps });
  } catch (err) {
    console.error('decrypt error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/', (_, res) => res.send('oracle alive'));
app.listen(PORT, () => {
  console.log(`oracle on http://localhost:${PORT}`);
});
