/* Лёгкий oracle-воркер: принимает "зашифрованный скор", выбирает tier, пишет cap/rate в контракт */

const http = require("http");
const { URL } = require("url");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL;
const ORACLE_PK = process.env.ORACLE_PRIVATE_KEY;
const CONTRACT = process.env.CONTRACT_ADDRESS;
const PORT = process.env.PORT || 8787;

if (!RPC_URL || !ORACLE_PK || !CONTRACT) {
  console.error("Missing RPC_URL / ORACLE_PRIVATE_KEY / CONTRACT_ADDRESS in oracle/.env");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet   = new ethers.Wallet(ORACLE_PK, provider);

const ABI = [
  "function oracleCallbackDecryptedTerms(address user, uint256 capWei, uint16 rateBps) external",
  "function TIER1_CAP_WEI() view returns (uint256)",
  "function TIER2_CAP_WEI() view returns (uint256)",
  "function TIER3_CAP_WEI() view returns (uint256)",
  "function TIER1_RATE_BPS() view returns (uint16)",
  "function TIER2_RATE_BPS() view returns (uint16)",
  "function TIER3_RATE_BPS() view returns (uint16)"
];
const c = new ethers.Contract(CONTRACT, ABI, wallet);

async function chooseTerms(scoreEncHex) {
  const h = ethers.keccak256(scoreEncHex);
  const n = parseInt(h.slice(-4), 16) % 100;

  const [t1c, t2c, t3c] = await Promise.all([c.TIER1_CAP_WEI(), c.TIER2_CAP_WEI(), c.TIER3_CAP_WEI()]);
  const [t1r, t2r, t3r] = await Promise.all([c.TIER1_RATE_BPS(), c.TIER2_RATE_BPS(), c.TIER3_RATE_BPS()]);

  if (n < 40) return { cap: t1c, rate: t1r, tier: 1 };
  if (n < 80) return { cap: t2c, rate: t2r, tier: 2 };
  return { cap: t3c, rate: t3r, tier: 3 };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { reject(e); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.end();

  if (req.method === "POST" && url.pathname === "/submit") {
    try {
      const { user, scoreEnc, attestation } = await readBody(req);
      if (!user || !scoreEnc) throw new Error("bad payload");

      const terms = await chooseTerms(scoreEnc);
      const tx = await c.oracleCallbackDecryptedTerms(user, terms.cap, terms.rate);
      const rc = await tx.wait();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        ok: true,
        tier: terms.tier,
        capWei: terms.cap.toString(),
        rateBps: Number(terms.rate),
        txHash: rc?.hash || tx.hash
      }));
      return;
    } catch (e) {
      console.error(e);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
      return;
    }
  }

  res.writeHead(404); res.end();
});

server.listen(PORT, () => {
  console.log(`Oracle worker listening on http://localhost:${PORT}`);
  console.log("Contract:", CONTRACT);
  console.log("Oracle:", wallet.address);
});