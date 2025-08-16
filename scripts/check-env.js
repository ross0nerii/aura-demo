const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

console.log("SEPOLIA_RPC_URL =", process.env.SEPOLIA_RPC_URL || "(empty)");
console.log("PRIVATE_KEY    =", process.env.PRIVATE_KEY ? "OK (loaded)" : "(empty)");
