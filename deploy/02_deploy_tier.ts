import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());

  const ATTESTER = await deployer.getAddress(); // для демо — сам деплоер
  const URI = ""; // можно пусто или ipfs://.../{id}.json

  const Tier = await ethers.getContractFactory("AuraTier");
  const tier = await Tier.deploy(ATTESTER, URI);
  await tier.waitForDeployment();

  console.log("AuraTier deployed at:", await tier.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
