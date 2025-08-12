import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());

  const Aura = await ethers.getContractFactory("AuraScore");
  const aura = await Aura.deploy();
  await aura.waitForDeployment();

  console.log("AuraScore deployed at:", await aura.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
