// aura-web/scripts/sync-contracts.js
import { globby } from 'globby';
import fs from 'node:fs';
import fse from 'fs-extra';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');        // /aura
const WEB  = path.resolve(__dirname, '..');              // /aura/aura-web

const OUT_ABI_DIR = path.join(WEB, 'src', 'generated', 'abi');
const OUT_DEPLOY_DIR = path.join(WEB, 'src', 'generated');

async function main() {
  // 1) abi из /artifacts в /aura-web/src/generated/abi
  const abiFiles = await globby([
    path.join(ROOT, 'artifacts', 'contracts', '**', '*.json'),
    `!**/*.dbg.json`,
  ]);
  await fse.emptyDir(OUT_ABI_DIR);
  for (const file of abiFiles) {
    const json = JSON.parse(await fs.promises.readFile(file, 'utf8'));
    if (!json.abi) continue;
    const rel = path.relative(path.join(ROOT, 'artifacts', 'contracts'), file);
    const out = path.join(OUT_ABI_DIR, rel);
    await fse.ensureDir(path.dirname(out));
    await fs.promises.writeFile(out, JSON.stringify(json.abi, null, 2));
  }

  // 2) deployed_*.json из корня репо в /aura-web/src/generated
  const deployedFiles = await globby([
    path.join(ROOT, 'deployed_*.json'),
  ]);
  for (const file of deployedFiles) {
    const base = path.basename(file);                    // deployed_sepolia.json и т.п.
    const out = path.join(OUT_DEPLOY_DIR, base);
    await fse.ensureDir(path.dirname(out));
    await fse.copy(file, out);
  }

  console.log('✓ synced ABI and deployed_* files into src/generated');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
