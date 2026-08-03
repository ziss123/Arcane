import { createContext, useContext, useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

const WalletContext = createContext(null);

const ARC_CHAIN_ID = 5042002;

// Supported EVM chains
export const SUPPORTED_CHAINS = {
  5042002: {
    id: 5042002,
    name: "Arc Testnet",
    rpc: "https://arc-testnet.drpc.org",
    explorer: "https://testnet.arcscan.app",
    symbol: "USDC",
    color: "purple",
  },
  11155111: {
    id: 11155111,
    name: "Ethereum Sepolia",
    rpc: "https://rpc.sepolia.org",
    explorer: "https://sepolia.etherscan.io",
    symbol: "ETH",
    color: "blue",
  },
  84532: {
    id: 84532,
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    symbol: "ETH",
    color: "blue",
  },
  80002: {
    id: 80002,
    name: "Polygon Amoy",
    rpc: "https://rpc-amoy.polygon.technology",
    explorer: "https://amoy.polygonscan.com",
    symbol: "MATIC",
    color: "purple",
  },
};

const TOKEN_CONTRACTS = {
  USDC:   "0x3600000000000000000000000000000000000000",
  EURC:   "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  cirBTC: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
};

const TOKEN_DECIMALS = { USDC: 6, EURC: 6, cirBTC: 8 };

export function WalletProvider({ children }) {
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [tokenBalances, setTokenBalances] = useState({ USDC: null, EURC: null, cirBTC: null });
  const [currentChainId, setCurrentChainId] = useState(ARC_CHAIN_ID);
  const [panicked, setPanicked] = useState(false);
  const [panicPin, setPanicPin] = useState("");
  const [unlockPin, setUnlockPin] = useState("");
  const [locked, setLocked] = useState(false);

  const activeWallet = wallets?.[0];
  const address = activeWallet?.address;
  const connected = authenticated && !!address;
  const currentChain = SUPPORTED_CHAINS[currentChainId] || SUPPORTED_CHAINS[ARC_CHAIN_ID];

  const shorten = (addr) => addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : null;

  // Fetch token balance via RPC
  const fetchTokenBalance = async (addr, symbol, rpc) => {
    try {
      const contract = TOKEN_CONTRACTS[symbol];
      const decimals = TOKEN_DECIMALS[symbol];
      const data = "0x70a08231" + addr.slice(2).padStart(64, "0");
      const response = await fetch(rpc || "https://arc-testnet.drpc.org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", method: "eth_call",
          params: [{ to: contract, data }, "latest"], id: 1,
        }),
      });
      const json = await response.json();
      const raw = parseInt(json.result, 16);
      return (raw / Math.pow(10, decimals)).toFixed(decimals === 8 ? 6 : 2);
    } catch {
      return "0.00";
    }
  };

  const fetchAllBalances = async (addr) => {
    if (!addr) return;
    const rpc = currentChain.rpc;
    const [usdc, eurc, cirbtc] = await Promise.all([
      fetchTokenBalance(addr, "USDC", rpc),
      fetchTokenBalance(addr, "EURC", rpc),
      fetchTokenBalance(addr, "cirBTC", rpc),
    ]);
    setTokenBalances({ USDC: usdc, EURC: eurc, cirBTC: cirbtc });
  };

  // Switch to any EVM chain
  const switchChain = async (chainId) => {
    if (!activeWallet) return;
    try {
      await activeWallet.switchChain(chainId);
      setCurrentChainId(chainId);
      if (address) fetchAllBalances(address);
    } catch (err) {
      console.error("Failed to switch chain:", err);
    }
  };

  const switchToArc = () => switchChain(ARC_CHAIN_ID);

  useEffect(() => {
    if (connected && address && activeWallet) {
      switchToArc();
      fetchAllBalances(address);
    } else {
      setTokenBalances({ USDC: null, EURC: null, cirBTC: null });
    }
  }, [connected, address, activeWallet]);

  const sendTransaction = async (to, data, gas) => {
    if (!activeWallet) throw new Error("No wallet connected");
    const provider = await activeWallet.getEthereumProvider();
    return await provider.request({
      method: "eth_sendTransaction",
      params: [{ from: address, to, data, gas: gas || "0x186A0" }],
    });
  };

  const callContract = async (to, data) => {
    const response = await fetch(currentChain.rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", method: "eth_call",
        params: [{ to, data }, "latest"], id: 1,
      }),
    });
    const json = await response.json();
    return json.result;
  };

  const tryUnlock = (input) => {
    if (panicPin && input === panicPin) { setPanicked(true); setLocked(false); return true; }
    if (unlockPin && input === unlockPin) { setPanicked(false); setLocked(false); return true; }
    if (!unlockPin) { setLocked(false); return true; }
    return false;
  };

  return (
    <WalletContext.Provider value={{
      connected, address,
      shortAddress: shorten(address),
      tokenBalances, fetchAllBalances,
      connect: login,
      disconnect: logout,
      sendTransaction, callContract,
      currentChainId, currentChain,
      switchChain, switchToArc,
      supportedChains: SUPPORTED_CHAINS,
      panicked, setPanicked,
      panicPin, setPanicPin,
      unlockPin, setUnlockPin,
      locked, setLocked, tryUnlock,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}