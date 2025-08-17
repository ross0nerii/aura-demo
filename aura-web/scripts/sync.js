/* eslint-disable no-console */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import globby from "globby";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Пути: фронт и корень монорепы
const FRONT_DIR = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(FRONT_DIR, "..");

// Куда кладём артефакты на фронте
const OUT_DIR = path.join(FRONT_DIR, "src", "lib", "abi");

// Источники: hardhat artifacts и deployed_*.json в корне
const ARTIFACTS_DIR = path.join(REPO_ROOT, "artifacts");
const DEPLOYED_GLOB = path.join(REPO_ROOT, "deployed_*.json");

// Какие ABI копировать (дополни по мере роста проекта)
const CONTRACT_ABIS = [
  // пример: ["contracts/MyToken.sol", "MyToken"]
];

async function run() {
  await fs.ensureDir(OUT_DIR);

  // 1) Копируем deployed_*.json из корня
  const deployedFiles = await globby([DEPLOYED_GLOB], { absolute: true });
  for (const src of deployedFiles) {
    const dst = path.join(OUT_DIR, path.basename(src));
    await fs.copy(src, dst);
    console.log("Copied:", path.relative(REPO_ROOT, src), "→", path.relative(FRONT_DIR, dst));
  }

  // 2) Копируем ABI из hardhat artifacts
  for (const [relSolPath, contractName] of CONTRACT_ABIS) {
    const abiPath = path.join(
      ARTIFACTS_DIR,
      relSolPath,
      `${contractName}.json`
    );
    if (await fs.pathExists(abiPath)) {
      const dst = path.join(OUT_DIR, `${contractName}.abi.json`);
      const json = await fs.readJson(abiPath);
      await fs.writeJson(dst, json.abi, { spaces: 2 });
      console.log("ABI:", path.relative(REPO_ROOT, abiPath), "→", path.relative(FRONT_DIR, dst));
    } else {
      console.warn("ABI not found:", path.relative(REPO_ROOT, abiPath));
    }
  }

  // 3) Типы/утилиты на будущее
  const indexTs = `
export * as Deployed from "./deployed";
`;
  await fs.outputFile(path.join(OUT_DIR, "index.ts"), indexTs.trim() + "\n");

  // агрегируем deployed_*.json как модуль
  let deployedTs = "";
  for (const src of deployedFiles) {
    const base = path.basename(src, ".json");
    deployedTs += `export { default as ${base} } from "./${base}.json";\n`;
  }
  await fs.outputFile(path.join(OUT_DIR, "deployed.ts"), deployedTs);

  console.log("Sync finished.");
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
