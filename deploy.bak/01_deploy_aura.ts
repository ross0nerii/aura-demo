// deploy/01_deploy_aura.ts
import type { DeployFunction } from 'hardhat-deploy/types';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy('AuraScore', {
    from: deployer,
    log: true,
  });
};

export default func;
func.tags = ['AuraScore'];
