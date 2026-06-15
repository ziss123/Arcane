import { useState } from "react";
import { ToastProvider } from "./context/ToastContext";
import { WalletProvider, useWallet } from "./context/WalletContext";
import { BalanceProvider } from "./context/BalanceContext";
import LockScreen from "./components/LockScreen";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Shield from "./pages/Shield";
import Swap from "./pages/Swap";
import History from "./pages/History";
import Settings from "./pages/Settings";
import AddressBook from "./pages/AddressBook";
import Verify from "./pages/Verify";

function AppContent() {
  const [page, setPage] = useState("dashboard");
  const { locked } = useWallet();

  if (locked) return <LockScreen />;

  return (
    <div className="flex min-h-screen bg-[#1a1a1a] text-gray-100">
      <Sidebar page={page} setPage={setPage} />
      <div key={page} className="page-enter flex-1">
        
        {page === "dashboard" && <Dashboard setPage={setPage} />}
        {page === "send" && <Send />}
        {page === "shield" && <Shield />}
        {page === "swap" && <Swap />}
        {page === "history" && <History />}
        {page === "addressbook" && <AddressBook />}
        {page === "verify" && <Verify />}
        {page === "settings" && <Settings />}
      </div>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <BalanceProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </BalanceProvider>
    </WalletProvider>
  );
}

export default App;