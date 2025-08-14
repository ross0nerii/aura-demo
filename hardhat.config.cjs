require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
require('@fhevm/hardhat-plugin'); // можно оставить подключённым

const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

// нормализуем приватник: допускаем с/без 0x, валидируем 32 байта
function normalizePrivateKey(pkRaw) {
  if (!pkRaw) return undefined;
  let pk = pkRaw.trim();
  if (pk.startsWith('0x')) pk = pk.slice(2);
  if (!/^[0-9a-fA-F]{64}$/.test(pk)) {
    throw new Error(
      `ENV PRIVATE_KEY должен быть 32-байтным hex (64 символа). Сейчас длина ${pk.length}.`
    );
  }
  return '0x' + pk;
}

const normalizedPK = normalizePrivateKey(PRIVATE_KEY);

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hardhat: {}, // in-process сеть
    localhost: { url: 'http://127.0.0.1:8545' },
    sepolia: {
      url: SEPOLIA_RPC_URL || '',
      chainId: 11155111,
      accounts: normalizedPK ? [normalizedPK] : [],
    },
  },
};
