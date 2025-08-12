// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title AuraScore — приватный скоринг: age*10 + dapps*25 (оба параметра шифрованы)
contract AuraScore is SepoliaConfig {
    mapping(address => euint32) private userScores;

    /// @notice Считает скор: age*10 + dapps*25
    /// @param age   зашифрованный возраст (externalEuint32 handle)
    /// @param dapps зашифрованное число dApps (externalEuint32 handle)
    /// @param inputProof общий proof для обоих входов
    function calculateScore(
        externalEuint32 age,
        externalEuint32 dapps,
        bytes calldata inputProof
    ) external {
        // external -> euint32 (правильный способ для FHEVM)
        euint32 a = FHE.fromExternal(age, inputProof);
        euint32 d = FHE.fromExternal(dapps, inputProof);

        // age*10 + dapps*25 (константы «зашифровываем» через asEuint32)
        euint32 score = FHE.add(
            FHE.mul(a, FHE.asEuint32(10)),
            FHE.mul(d, FHE.asEuint32(25))
        );

        userScores[msg.sender] = score;

        // Разрешаем пользователю расшифровать свой скор
        // (и контракту — если понадобятся внутренние дешифровки)
        FHE.allow(userScores[msg.sender], msg.sender);
        FHE.allowThis(userScores[msg.sender]);
    }

    /// @notice Возвращает зашифрованный скор текущего msg.sender
    function getMyScore() external view returns (euint32) {
        return userScores[msg.sender];
    }
}
