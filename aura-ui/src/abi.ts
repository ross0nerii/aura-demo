export const AURASCORE_ABI = [
  {
    type: "function",
    name: "calculateScore",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ageHandle", type: "uint256" },
      { name: "dappsHandle", type: "uint256" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
  },
  { type: "function", name: "getMyScore", stateMutability: "view", inputs: [], outputs: [{ type: "bytes" }] },
] as const;

export const AURATIER_ABI = [
  {
    type: "function",
    name: "mintTier",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "tier", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  { type: "function", name: "uri", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "string" }] },
] as const;
// ============== Lending & ERC20 ABIs ==============
export const LENDING_ABI = [
  { type: "function", name: "availableToBorrow", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "debt", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "borrow", stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "repay", stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
] as const;

export const ERC20_ABI = [
  { type: "function", name: "decimals", stateMutability: "view",
    inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable",
    inputs: [{ name: "sp", type: "address" }, { name: "amt", type: "uint256" }],
    outputs: [{ type: "bool" }] },
  { type: "function", name: "allowance", stateMutability: "view",
    inputs: [{ name: "o", type: "address" }, { name: "sp", type: "address" }],
    outputs: [{ type: "uint256" }] },
] as const;
