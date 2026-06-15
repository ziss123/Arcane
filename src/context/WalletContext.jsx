import { createContext, useContext, useState, useEffect } from "react";

const WalletContext = createContext(null);

const ARC_CHAIN_ID = "0x4CE532"; // 5042002
const ARC_RPC = "https://rpc.testnet.arc.network";

const TOKEN_CONTRACTS = {
  USDC:   "0x3600000000000000000000000000000000000000",
  EURC:   "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  cirBTC: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
};

const TOKEN_DECIMALS = {
  USDC:   6,
  EURC:   6,
  cirBTC: 8,
};

export function WalletProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [tokenBalances, setTokenBalances] = useState({
    USDC: null,
    EURC: null,
    cirBTC: null,
  });
  const [panicked, setPanicked] = useState(false);
  const [panicPin, setPanicPin] = useState("");
  const [unlockPin, setUnlockPin] = useState("");
  const [locked, setLocked] = useState(false);

  const shorten = (addr) =>
    addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : null;

  const fetchTokenBalance = async (addr, symbol) => {
    try {
      const contract = TOKEN_CONTRACTS[symbol];
      const decimals = TOKEN_DECIMALS[symbol];
      const data = "0x70a08231" + addr.slice(2).padStart(64, "0");
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [{ to: contract, data }, "latest"],
      });
      const raw = parseInt(result, 16);
      const balance = (raw / Math.pow(10, decimals)).toFixed(decimals === 8 ? 6 : 2);
      return balance;
    } catch (err) {
      console.error(`Failed to fetch ${symbol} balance:`, err);
      return "0.00";
    }
  };

  const fetchAllBalances = async (addr) => {
    const [usdc, eurc, cirbtc] = await Promise.all([
      fetchTokenBalance(addr, "USDC"),
      fetchTokenBalance(addr, "EURC"),
      fetchTokenBalance(addr, "cirBTC"),
    ]);
    setTokenBalances({ USDC: usdc, EURC: eurc, cirBTC: cirbtc });
  };

  const switchToArc = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_CHAIN_ID }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: ARC_CHAIN_ID,
            chainName: "Arc Testnet",
            nativeCurrency: {
              name: "USDC",
              symbol: "USDC",
              decimals: 18,
            },
            rpcUrls: [ARC_RPC],
            blockExplorerUrls: ["https://testnet.arcscan.app"],
          }],
        });
      }
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      alert("MetaMask not found. Please install the MetaMask extension.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      await switchToArc();

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      setAddress(accounts[0]);
      setChainId(chainId);
      setConnected(true);
      await fetchAllBalances(accounts[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAddress(null);
    setChainId(null);
    setTokenBalances({ USDC: null, EURC: null, cirBTC: null });
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        fetchAllBalances(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const tryUnlock = (input) => {
    if (panicPin && input === panicPin) {
      setPanicked(true);
      setLocked(false);
      return true;
    }
    if (unlockPin && input === unlockPin) {
      setPanicked(false);
      setLocked(false);
      return true;
    }
    if (!unlockPin) {
      setLocked(false);
      return true;
    }
    return false;
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        shortAddress: shorten(address),
        chainId,
        tokenBalances,
        fetchAllBalances,
        connect,
        disconnect,
        panicked, setPanicked,
        panicPin, setPanicPin,
        unlockPin, setUnlockPin,
        locked, setLocked, tryUnlock,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}