const { ethers } = require("hardhat");
(async () => {
  const net = await ethers.provider.getNetwork();
  console.log("Connected network chainId =", net.chainId.toString());
  const block = await ethers.provider.getBlockNumber();
  console.log("Latest block =", block);
})();
