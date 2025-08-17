import { promises as fs } from "node:fs";
import path from "node:path";

const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const root = path.resolve(here, ".."); // корень твоего репо
const outContractsDir = path.join(here, "public", "contracts");
const outAbiDir = path.join(here, "public", "abi");

const deployedFiles = ["deployed_localhost.json", "deployed_sepolia.json"];
const abiContracts = [
  { file: "AuraTier.sol", name: "AuraTier" },
  { file: "AuraScore.sol", name: "AuraScore" },
  { file: "FHECounter.sol", name: "FHECounter" }
];

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }

async function copyDeployed() {
  await ensureDir(outContractsDir);
  for (const f of deployedFiles) {
    const src = path.join(root, f);
    try {
      await fs.access(src);
      const dst = path.join(outContractsDir, f);
      await fs.copyFile(src, dst);
      console.log("✔ copied", f);
    } catch {
      console.warn("• пропущен (нет в корне):", f);
    }
  }
}

async function writeAbi() {
  await ensureDir(outAbiDir);
  for (const { file, name } of abiContracts) {
    const artifactPath = path.join(root, "artifacts", "contracts", file, `${name}.json`);
    try {
      const raw = await fs.readFile(artifactPath, "utf8");
      const artifact = JSON.parse(raw);
      const abi = artifact.abi ?? artifact.interface?.json ?? [];
      const dst = path.join(outAbiDir, `${name}.json`);
      await fs.writeFile(dst, JSON.stringify(abi, null, 2));
      console.log("✔ ABI", name);
    } catch (e) {
      console.warn("• пропущен ABI (нет артефакта?):", name, e?.message || e);
    }
  }
}

async function main() {
  await copyDeployed();
  await writeAbi();
  console.log("Done. Теперь запусти `npm run dev`");
}
main().catch((e) => { console.error(e); process.exit(1); });
