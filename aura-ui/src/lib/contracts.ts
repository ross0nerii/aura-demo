import { Address } from "viem";

export const AURA_SCORE = (import.meta.env.VITE_AURA_SCORE as Address);
export const AURA_TIER  = (import.meta.env.VITE_AURA_TIER as Address);

export const AURA_TIER_ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "stateMutability": "view",
    "inputs": [
      { "name": "account", "type": "address" },
      { "name": "id", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "uri",
    "stateMutability": "view",
    "inputs": [{ "name": "id", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "string" }]
  }
] as const;
