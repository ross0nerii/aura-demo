// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";

// Значения по умолчанию — чтобы CI не падал, если секреты не заданы
const MNEMONIC_DEFAULT =
  "test test test test test test test test test test test junk";
const RPC_DEFAULT = "https://rpc.sepolia.org";

// Берём из ENV, а если нет — подставляем дефолт
const MNEMONIC = process.env.MNEMONIC ?? MNEMONIC_DEFAULT;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? RPC_DEFAULT;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },

  // Генерация типов для ethers v6 (не мешает CI)
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },

  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0",
        count: 10,
      },
    },
  },
};

export default config;
