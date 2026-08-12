// EVM Actions — execute DeFi actions on Arc Testnet + other EVM chains

const SIMPLE_SWAP = "0x60C669b57A11e41Db84b1A804621BD086262A3D8";
const SHIELD_POOL = "0xF9C6B588E99254dC487D75767283F93f4a6e7Ae2";

export const TOKEN_CONTRACTS = {
  USDC:   "0x3600000000000000000000000000000000000000",
  EURC:   "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  cirBTC: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
};

export const DECIMALS = { USDC: 6, EURC: 6, cirBTC: 8 };

export const CHAIN_IDS = {
  "Arc Testnet": 5042002,
  "Ethereum Sepolia": 11155111,
  "Base Sepolia": 84532,
  "Polygon Amoy": 80002,
};

function toHex(amount, decimals) {
  return BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)))
    .toString(16)
    .padStart(64, "0");
}

// Helper: handle wallet errors
function handleWalletError(err) {
  if (err.code === 4001) {
    throw new Error("Transaction rejected in wallet. Please approve the transaction.");
  } else if (err.code === -32603) {
    throw new Error("RPC error. Make sure you're on Arc Testnet and have enough USDC for gas.");
  } else if (err.message?.includes("user rejected")) {
    throw new Error("Transaction rejected by user.");
  }
  throw err;
}

// Swap tokens via SimpleSwap on Arc Testnet
export async function executeSwap({ amount, from, to, sendTransaction, address }) {
  try {
    const fromAddr = TOKEN_CONTRACTS[from];
    const toAddr = TOKEN_CONTRACTS[to];
    if (!fromAddr || !toAddr) throw new Error(`Token not supported: ${from} or ${to}`);

    const dec = DECIMALS[from];
    const valueHex = toHex(amount, dec);

    // Step 1: Approve
    const approveData = "0x095ea7b3" + SIMPLE_SWAP.slice(2).padStart(64, "0") + valueHex;
    await sendTransaction(fromAddr, approveData, "0x186A0");

    // Step 2: Swap
    const swapData = "0xdf791e50"
      + fromAddr.slice(2).padStart(64, "0")
      + toAddr.slice(2).padStart(64, "0")
      + valueHex;
    return await sendTransaction(SIMPLE_SWAP, swapData, "0x30D40");
  } catch (err) {
    handleWalletError(err);
  }
}

// Send token to address
export async function executeSend({ amount, token, to, sendTransaction }) {
  try {
    const contract = TOKEN_CONTRACTS[token];
    if (!contract) throw new Error(`Token not supported: ${token}`);
    const dec = DECIMALS[token];
    const valueHex = toHex(amount, dec);
    const data = "0xa9059cbb" + to.slice(2).padStart(64, "0") + valueHex;
    return await sendTransaction(contract, data, "0x186A0");
  } catch (err) {
    handleWalletError(err);
  }
}

// Shield tokens into ShieldPool
export async function executeShield({ amount, token, sendTransaction }) {
  try {
    const tokenAddr = TOKEN_CONTRACTS[token];
    if (!tokenAddr) throw new Error(`Token not supported: ${token}`);
    const dec = DECIMALS[token];
    const valueHex = toHex(amount, dec);

    // Step 1: Approve
    const approveData = "0x095ea7b3" + SHIELD_POOL.slice(2).padStart(64, "0") + valueHex;
    await sendTransaction(tokenAddr, approveData, "0x186A0");

    // Step 2: Shield
    const shieldData = "0x8f214a33" + tokenAddr.slice(2).padStart(64, "0") + valueHex;
    return await sendTransaction(SHIELD_POOL, shieldData, "0x30D40");
  } catch (err) {
    handleWalletError(err);
  }
}

// Bridge via CCTP (simulated for testnet)
export async function executeBridge({ amount, token, chain }) {
  // Simulated — real CCTP needs Circle SDK
  await new Promise(r => setTimeout(r, 2000));
  return { simulated: true, amount, token, chain };
}

// Switch EVM chain
export async function executeSwitchChain({ chain, switchChain }) {
  const chainId = CHAIN_IDS[chain];
  if (!chainId) throw new Error(`Chain not supported: ${chain}`);
  await switchChain(chainId);
  return { chainId, chain };
}