const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const AuraScoreBank = await hre.ethers.getContractFactory("AuraScoreBank");
  const bank = await AuraScoreBank.deploy();
  await bank.waitForDeployment();

  const addr = await bank.getAddress();
  console.log("AuraScoreBank deployed to:", addr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
