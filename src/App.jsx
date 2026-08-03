import { useState } from "react";
import { ToastProvider } from "./context/ToastContext";
import { WalletProvider, useWallet } from "./context/WalletContext";
import { BalanceProvider } from "./context/BalanceContext";
import LockScreen from "./components/LockScreen";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Shield from "./pages/Shield";
import Swap from "./pages/Swap";
import History from "./pages/History";
import Agent from "./pages/Agent";

function Navbar({ page, setPage }) {
  const { connected, shortAddress, connect, disconnect } = useWallet();

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "ti-layout-dashboard" },
    { key: "send", label: "Send", icon: "ti-send" },
    { key: "shield", label: "Shield", icon: "ti-shield" },
    { key: "swap", label: "Swap", icon: "ti-arrows-exchange" },
    { key: "agent", label: "Agent", icon: "ti-robot" },
    { key: "history", label: "History", icon: "ti-history" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-white/5 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <i className="ti ti-shield-lock text-sm text-white"></i>
        </div>
        <span className="font-bold text-white tracking-tight">Arcane</span>
      </div>

      <div className="flex items-center gap-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              page === item.key
                ? "bg-white/10 text-white font-medium"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <i className={`ti ${item.icon} text-sm`}></i>
            {item.label}
          </button>
        ))}
      </div>

      <div>
        {connected ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm text-gray-300">{shortAddress}</span>
            </div>
            <button onClick={disconnect} className="text-gray-500 hover:text-red-400 transition p-1.5">
              <i className="ti ti-logout text-sm"></i>
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            className="bg-blue-600 hover:bg-blue-500 transition rounded-lg px-4 py-1.5 text-sm font-medium flex items-center gap-2"
          >
            <i className="ti ti-plug text-sm"></i> Connect wallet
          </button>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  const [page, setPage] = useState("dashboard");
  const { locked } = useWallet();

  if (locked) return <LockScreen />;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100">
      <Navbar page={page} setPage={setPage} />
      <div key={page} className="page-enter max-w-6xl mx-auto px-6 py-8">
        {page === "dashboard" && <Dashboard setPage={setPage} />}
        {page === "send" && <Send />}
        {page === "shield" && <Shield />}
        {page === "swap" && <Swap />}
        {page === "history" && <History />}
        {page === "vault" && <Vault />}
        {page === "agent" && <Agent />}
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