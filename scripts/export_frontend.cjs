/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const CONTRACTS = ["AuraScore", "AuraTier", "FHECounter"];

function readJSON(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

function main() {
  const network = process.argv[2] || "sepolia"; // можно 'localhost'
  const root = process.cwd();
  const deployedPath = path.join(root, `deployed_${network}.json`);
  if (!fs.existsSync(deployedPath)) throw new Error(`Не найден ${deployedPath}. Сначала задеплой!`);
  const deployed = readJSON(deployedPath);

  const outDir = path.join(root, "frontend_bundle", network);
  fs.mkdirSync(outDir, { recursive: true });

  // addresses.json
  const addrs = {};
  for (const name of CONTRACTS) addrs[name] = deployed[name] || null;
  fs.writeFileSync(path.join(outDir, "addresses.json"), JSON.stringify(addrs, null, 2));

  // abis/
  const abiDir = path.join(outDir, "abis");
  fs.mkdirSync(abiDir, { recursive: true });
  for (const name of CONTRACTS) {
    const art = path.join(root, "artifacts", "contracts", `${name}.sol`, `${name}.json`);
    if (fs.existsSync(art)) {
      const { abi } = readJSON(art);
      fs.writeFileSync(path.join(abiDir, `${name}.json`), JSON.stringify(abi, null, 2));
    } else {
      console.log(`⚠️  нет артефакта для ${name} — пропущено`);
    }
  }

  console.log(`✅ bundle готов: ${outDir}`);
}
main();
