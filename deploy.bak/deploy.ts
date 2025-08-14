// deploy/deploy.ts
import 'hardhat-deploy'; // важно: подключает задачи/типы плагина

import type { DeployFunction } from 'hardhat-deploy/types';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const deployed = await deploy('FHECounter', {
    from: deployer,
    log: true,
  });

  console.log(`FHECounter contract: ${deployed.address}`);
};

export default func;
func.id = 'deploy_fheCounter';
func.tags = ['FHECounter'];
