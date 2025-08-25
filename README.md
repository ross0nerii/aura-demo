# Aura Lending - FHE Lending Platform Demo

Proof-of-concept for confidential P2P lending using FHE architecture.

## Features
- Tier-based interest rates (Bronze 15%, Silver 10%, Gold 5%)
- Confidential balance management
- Private credit scoring
- Encrypted lending pool

## Contract
- **Address**: 0xf89D6601701D9f44E9F6f0cCd78E8acf761508c5
- **Network**: Sepolia Testnet
- **Etherscan**: https://sepolia.etherscan.io/address/0xf89D6601701D9f44E9F6f0cCd78E8acf761508c5

## Quick Start
1. `npm install`
2. `npm run deploy:sepolia`  
3. `cd frontend && python3 -m http.server 8000`
4. Open http://localhost:8000/working.html

## Architecture
Built with FHE concepts in mind - ready for migration to full Zama fhEVM.
