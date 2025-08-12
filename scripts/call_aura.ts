// scripts/call_aura.ts
import { ethers } from "hardhat";

// Адреса (checksummed — как вернула консоль)
const AURA_SCORE = "0xD9C3DaF5c2Fa63392EA7863E0C7A7bE6D5e011Ab";
const AURA_TIER = "0xE87918Bb84339c575D71D9C9Dc7B1997FE358431";

// Для SDK (шифрование/EIP-712/userDecrypt) адрес контракта в нижнем регистре
const AURA_SCORE_LC = AURA_SCORE.toLowerCase();

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  const t = setTimeout(() => console.error(`[${label}] still waiting… ${ms}ms`), ms);
  try {
    return await p;
  } finally {
    clearTimeout(t);
  }
}

// Преобразуем к HEX БЕЗ 0x (как любит SDK в userDecrypt)
const toRawHex = (x: string | Uint8Array): string => {
  if (typeof x === "string") return x.replace(/^0x/i, "");
  if (x instanceof Uint8Array) return Buffer.from(x).toString("hex");
  throw new Error("Expected string or Uint8Array");
};

async function main() {
  const [signer] = await ethers.getSigners();
  const user = await signer.getAddress();
  console.log("Signer:", user);
  console.log("Using contracts:", { AURA_SCORE, AURA_TIER });

  // 1) SDK
  console.log("1) Import Zama SDK…");
  const mod = await withTimeout(import("@zama-fhe/relayer-sdk/node"), 5000, "import SDK");
  const { createInstance, SepoliaConfig } = mod;
  const instance = await withTimeout(
    createInstance({ ...SepoliaConfig, requestTimeoutMs: 20000 }),
    8000,
    "createInstance",
  );
  console.log("   ✓ SDK ready");

  // 2) Шифруем входы
  console.log("2) Encrypt inputs…");
  const buf = instance.createEncryptedInput(AURA_SCORE_LC, user);
  buf.add32(3); // age
  buf.add32(12); // dapps
  const enc = await withTimeout(buf.encrypt(), 15000, "encrypt()");
  console.log("   ✓ Encrypted (handles len):", enc.handles.length);

  // 3) Вызываем контракт
  console.log("3) Send calculateScore…");
  const scoreC = await ethers.getContractAt("AuraScore", AURA_SCORE_LC, signer);
  console.log("score addr used:", AURA_SCORE_LC);
  const tx = await scoreC.calculateScore(enc.handles[0], enc.handles[1], enc.inputProof);
  console.log("   [tx] hash:", tx.hash);
  await tx.wait();
  console.log("   ✓ tx mined");

  // 4) Берём зашифрованный handle
  const ciphertextHandle: string = await scoreC.getMyScore();
  console.log("4) Encrypted handle:", ciphertextHandle);

  // 5) Готовим EIP-712 и ключи
  console.log("5) Prepare EIP-712…");
  const keypair = instance.generateKeypair();
  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = "10";

  // Для createEIP712 — публичный ключ можно в сыром hex (обычно уже без 0x)
  const pubRaw = toRawHex(keypair.publicKey);
  const privRaw = toRawHex(keypair.privateKey);

  const contractAddresses = [AURA_SCORE_LC];
  const eip712 = instance.createEIP712(pubRaw, contractAddresses, startTimeStamp, durationDays);

  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message,
  );
  const sigRaw = signature.replace(/^0x/i, "");

  console.log("   RAW lens -> pub:", pubRaw.length, "priv:", privRaw.length, "sig:", sigRaw.length);

  // 6) ПРАВИЛЬНЫЙ вызов userDecrypt (ПОЗИЦИОННЫЕ аргументы)
  console.log("6) userDecrypt…");
  const handleContractPairs = [{ handle: ciphertextHandle, contractAddress: AURA_SCORE_LC }];

  const result = await withTimeout(
    instance.userDecrypt(
      handleContractPairs, // 1) пары handle+адрес
      privRaw, // 2) privateKey (raw hex без 0x)
      pubRaw, // 3) publicKey  (raw hex без 0x)
      sigRaw, // 4) подпись    (raw hex без 0x)
      contractAddresses, // 5) адреса контрактов (lower-case)
      user, // 6) адрес пользователя (0x...)
      startTimeStamp, // 7) string
      durationDays, // 8) string
    ),
    20000,
    "userDecrypt",
  );

  // 7) Достаём значение из map по исходному handle
  const decrypted = (result as any)[ciphertextHandle];
  console.log("✓ Decrypted score:", typeof decrypted === "bigint" ? decrypted.toString() : decrypted);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
