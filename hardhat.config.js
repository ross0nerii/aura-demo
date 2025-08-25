require("dotenv/config");
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  namedAccounts: {
    deployer: { default: 0 },
  },
  solidity: {
    version: "0.8.24",
    settings: { 
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun"
    },
  },
  networks: {
    hardhat: { 
      chainId: 31337,
      // Enable debug for local testing
      allowUnlimitedContractSize: true
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 120000,
    },
  },
  mocha: { 
    timeout: 180000 
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};