import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
// import "@fhevm/hardhat-plugin";

const rpc = vars.get("SEPOLIA_RPC_URL");
const mnemonic = vars.get("MNEMONIC"); // если используешь PRIVATE_KEY — скажи, дам вариант ниже

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    sepolia: {
      url: rpc,
      accounts: { mnemonic }, // ← если вместо сид-фразы используешь приватный ключ — см. ниже
    },
  },
};

export default config;
