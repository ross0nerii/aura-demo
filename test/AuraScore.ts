import { expect } from "chai";
import hre from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("AuraScore (FHEVM)", function () {
  it("computes encrypted score: age*10 + dapps*25", async () => {
    const [user] = await hre.ethers.getSigners();

    // Деплой контракта
    const Aura = await hre.ethers.getContractFactory("AuraScore");
    const aura = await Aura.connect(user).deploy();
    await aura.waitForDeployment();
    const addr = await aura.getAddress();

    // Инициализация FHE сопроцессора в тестовой среде
    await hre.fhevm.assertCoprocessorInitialized(aura, "AuraScore");

    // Готовим зашифрованные входы (оба параметра в одном proof)
    const buf = hre.fhevm.createEncryptedInput(addr, user.address);
    buf.add32(3);    // age
    buf.add32(12);   // dapps
    const enc = await buf.encrypt();

    // Вызываем контракт с handles + общим proof
    const tx = await aura
      .connect(user)
      .calculateScore(enc.handles[0], enc.handles[1], enc.inputProof);
    await tx.wait();

    // Читаем зашифрованный результат
    const encryptedScore = await aura.connect(user).getMyScore();

    // Дешифруем от имени пользователя
    const clear = await hre.fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      addr,
      user
    );

    // 3*10 + 12*25 = 330
    expect(Number(clear)).to.equal(330);
  });
});
