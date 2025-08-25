module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying AuraLendingFHE with account:", deployer);

  const deployResult = await deploy("AuraLendingFHE", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("AuraLendingFHE deployed to:", deployResult.address);
};

module.exports.tags = ["AuraLendingFHE"];
