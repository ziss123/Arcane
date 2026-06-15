import { createContext, useContext, useState } from "react";

const BalanceContext = createContext(null);

export function BalanceProvider({ children }) {
  const [balances, setBalances] = useState({
    
    USDC:   { amount: "0.00", shielded: "00.00" },
    EURC:   { amount: "0.00", shielded: "0.00" },
    cirBTC: { amount: "0.00", shielded: "0.00" },
  });

  const [visible, setVisible] = useState(false);

  return (
    <BalanceContext.Provider value={{ balances, visible, setVisible }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  return useContext(BalanceContext);
}