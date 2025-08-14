/* eslint-disable no-console */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

function outFileForNetwork(networkName) {
  return path.join(process.cwd(), `deployed_${networkName}.json`);
}

async function deployNoArgs(name) {
  const f = await hre.ethers.getContractFactory(name);
  const c = await f.deploy();
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log(`${name}:`, addr);
  return addr;
}

async function deployWithArgs(name, args) {
  const f = await hre.ethers.getContractFactory(name);
  const c = await f.deploy(...args);
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log(`${name}:`, addr);
  return addr;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);
  console.log('Network:', hre.network.name);

  const { AURA_BASE_URI, ATTESTER_ADDRESS } = process.env;

  // 1) AuraScore (если контракта нет — пропустим и не упадём)
  let scoreAddr = null;
  try {
    scoreAddr = await deployNoArgs('AuraScore');
  } catch (e) {
    console.log('⚠️  AuraScore не задеплоен (нет контракта или другая причина):', e.message);
  }

  // 2) AuraTier(attester, baseURI) — ОБЯЗАТЕЛЬНО два аргумента
  const attester = ATTESTER_ADDRESS
    ? await hre.ethers.getAddress(ATTESTER_ADDRESS)
    : deployer.address;

  if (!AURA_BASE_URI || !AURA_BASE_URI.includes('{id}')) {
    throw new Error(
      'AURA_BASE_URI обязателен и должен содержать {id}, пример: ipfs://cid/{id}.json'
    );
  }

  const tierAddr = await deployWithArgs('AuraTier', [attester, AURA_BASE_URI]);

  // 3) FHECounter — без аргументов
  const counterAddr = await deployNoArgs('FHECounter');

  // Сохраняем адреса для фронтенда/скриптов
  const outfile = outFileForNetwork(hre.network.name);
  const out = {
    network: hre.network.name,
    deployer: deployer.address,
    AuraScore: scoreAddr,
    AuraTier: tierAddr,
    FHECounter: counterAddr,
  };
  fs.writeFileSync(outfile, JSON.stringify(out, null, 2));
  console.log(`\nSaved -> ${outfile}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
