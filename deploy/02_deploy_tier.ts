// deploy/02_deploy_tier.ts
import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const auraScore = await get("AuraScore");

  await deploy("AuraTier", {
    from: deployer,
    log: true,
    args: [auraScore.address],
  });
};

export default func;
func.tags = ["AuraTier"];
func.dependencies = ["AuraScore"]; // чтобы порядок был правильный
