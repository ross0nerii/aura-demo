// scripts/attest_and_mint.ts
import { ethers } from 'hardhat';

const AURA_SCORE = '0xD9C3DaF5c2Fa63392EA7863E0C7A7bE6D5e011Ab';
const AURA_TIER = '0xE87918Bb84339c575D71D9C9Dc7B1997FE358431';

// В SDK и при создании контрактов используем lower-case
const AURA_SCORE_LC = AURA_SCORE.toLowerCase();
const AURA_TIER_LC = AURA_TIER.toLowerCase();

const toRawHex = (x: string | Uint8Array): string => {
  if (typeof x === 'string') return x.replace(/^0x/i, '');
  if (x instanceof Uint8Array) return Buffer.from(x).toString('hex');
  throw new Error('Expected string or Uint8Array');
};

async function main() {
  const [signer] = await ethers.getSigners();
  const user = await signer.getAddress();
  console.log('Attester/User:', user);

  // --- SDK ---
  const { createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/node');
  const instance = await createInstance(SepoliaConfig);
  console.log('✓ SDK ready');

  // 1) handle из AuraScore
  const scoreC = await ethers.getContractAt('AuraScore', AURA_SCORE_LC, signer);
  const handle: string = await scoreC.getMyScore();
  console.log('Encrypted handle:', handle);

  // 2) Расшифровка (позиционные аргументы — как в рабочем call_aura.ts)
  const keypair = instance.generateKeypair();
  const pubRaw = toRawHex(keypair.publicKey);
  const privRaw = toRawHex(keypair.privateKey);
  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = '10';

  const eip712 = instance.createEIP712(pubRaw, [AURA_SCORE_LC], startTimeStamp, durationDays);
  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );
  const sigRaw = signature.replace(/^0x/i, '');
  console.log('RAW lens -> pub:', pubRaw.length, 'priv:', privRaw.length, 'sig:', sigRaw.length);

  const pairs = [{ handle, contractAddress: AURA_SCORE_LC }];
  const res = await instance.userDecrypt(
    pairs, // [{ handle, contractAddress }]
    privRaw, // privateKey (raw hex, без 0x)
    pubRaw, // publicKey  (raw hex, без 0x)
    sigRaw, // подпись    (raw hex, без 0x)
    [AURA_SCORE_LC], // адреса контрактов (lower-case)
    user,
    startTimeStamp,
    durationDays
  );

  const score = Number((res as any)[handle] as bigint);
  console.log('Decrypted score:', score);

  const tier = score >= 300 ? 3 : score >= 200 ? 2 : 1;
  console.log('Tier:', tier);

  // 3) Минт: пробуем популярные ABI — ВСЕ с адресом в lower-case
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const tryMintA = async () => {
    const abi = [
      'function mintTier(address user,uint256 tier,uint256 deadline,bytes signature) public returns (uint256)',
    ];
    const c = await ethers.getContractAt(abi, AURA_TIER_LC, signer);
    const domain = {
      name: 'AuraTier',
      version: '1',
      chainId,
      verifyingContract: AURA_TIER_LC,
    } as const;
    const types = {
      MintTier: [
        { name: 'user', type: 'address' },
        { name: 'tier', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    } as const;
    const sig = await signer.signTypedData(domain, types as any, { user, tier, deadline });
    console.log('[A] mintTier(user,tier,deadline,sig)...');
    return await (await c.mintTier(user, tier, deadline, sig)).wait();
  };

  const tryMintB = async () => {
    const abi = [
      'function mintTier(uint256 tier,uint256 deadline,bytes signature) public returns (uint256)',
    ];
    const c = await ethers.getContractAt(abi, AURA_TIER_LC, signer);
    const domain = {
      name: 'AuraTier',
      version: '1',
      chainId,
      verifyingContract: AURA_TIER_LC,
    } as const;
    const types = {
      MintTierNoUser: [
        { name: 'tier', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    } as const;
    const sig = await signer.signTypedData(domain, types as any, { tier, deadline });
    console.log('[B] mintTier(tier,deadline,sig)...');
    return await (await c.mintTier(tier, deadline, sig)).wait();
  };

  const tryMintC = async () => {
    const abi = ['function mint(address to,uint256 tier) public returns (uint256)'];
    const c = await ethers.getContractAt(abi, AURA_TIER_LC, signer);
    console.log('[C] mint(to,tier)...');
    return await (await c.mint(user, tier)).wait();
  };

  let mined;
  for (const attempt of [tryMintA, tryMintB, tryMintC]) {
    try {
      mined = await attempt();
      break;
    } catch (e: any) {
      console.log('Mint path failed:', e?.reason || e?.message || e);
    }
  }
  if (!mined) throw new Error('No mint path worked. Need exact AuraTier ABI.');

  console.log('✓ Minted! tx:', mined?.hash || mined);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
