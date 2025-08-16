const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const rpc = process.env.SEPOLIA_RPC_URL;
  const pk  = process.env.PRIVATE_KEY;
  if (!rpc || !pk) throw new Error("Missing SEPOLIA_RPC_URL or PRIVATE_KEY");

  console.log("RPC =", rpc.slice(0, 40) + "...");
  console.log("PK  =", pk.slice(0, 8) + "...");

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);

  const artifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/AuraScoreBank.sol/AuraScoreBank.json", "utf8")
  );

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  console.log("AuraScoreBank deployed at", await contract.getAddress());
}
main().catch((e) => { console.error(e); process.exit(1); });
