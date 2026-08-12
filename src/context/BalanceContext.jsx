import { createContext, useContext, useState } from "react";

const BalanceContext = createContext(null);

const TOKEN_CONTRACTS = {
  USDC:   "0x3600000000000000000000000000000000000000",
  EURC:   "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  cirBTC: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
};

const DECIMALS = { USDC: 6, EURC: 6, cirBTC: 8 };

export function BalanceProvider({ children }) {
  const [balances, setBalances] = useState({
    USDC:   { amount: "0.00", shielded: "0.00" },
    EURC:   { amount: "0.00", shielded: "0.00" },
    cirBTC: { amount: "0.00", shielded: "0.00" },
  });
  const [visible, setVisible] = useState(true);

  // ✅ TAMBAHKAN FUNGSI INI
  const fetchBalances = async (address) => {
    if (!address) return;
    try {
      const rpc = "https://rpc.testnet.arc.network";
      const fetchToken = async (symbol) => {
        const contract = TOKEN_CONTRACTS[symbol];
        const decimals = DECIMALS[symbol];
        const data = "0x70a08231" + address.slice(2).padStart(64, "0");
        const response = await fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_call",
            params: [{ to: contract, data }, "latest"],
            id: 1,
          }),
        });
        const json = await response.json();
        const raw = parseInt(json.result, 16);
        return (raw / Math.pow(10, decimals)).toFixed(decimals === 8 ? 6 : 2);
      };

      const [usdc, eurc, cirbtc] = await Promise.all([
        fetchToken("USDC"),
        fetchToken("EURC"),
        fetchToken("cirBTC"),
      ]);

      setBalances({
        USDC: { amount: usdc, shielded: "0.00" },
        EURC: { amount: eurc, shielded: "0.00" },
        cirBTC: { amount: cirbtc, shielded: "0.00" },
      });
    } catch (err) {
      console.error("Failed to fetch balances:", err);
    }
  };

  return (
    <BalanceContext.Provider value={{ balances, visible, setVisible, fetchBalances }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  return useContext(BalanceContext);
}