import { useState } from "react";
import { ToastProvider } from "./context/ToastContext";
import { BalanceProvider } from "./context/BalanceContext";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import LockScreen from "./components/LockScreen";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Shield from "./pages/Shield";
import Swap from "./pages/Swap";
import History from "./pages/History";
import Agent from "./pages/Agent";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "ti-layout-dashboard" },
  { key: "send",      label: "Send",      icon: "ti-send" },
  { key: "shield",    label: "Shield",    icon: "ti-shield" },
  { key: "swap",      label: "Swap",      icon: "ti-arrows-exchange" },
  { key: "agent",     label: "Agent",     icon: "ti-robot" },
  { key: "history",   label: "History",   icon: "ti-history" },
];

function Sidebar({ page, setPage }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const shortAddress = address
    ? address.slice(0, 6) + "..." + address.slice(-4)
    : null;

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
          <i className="ti ti-shield-lock text-white text-base"></i>
        </div>
        <span className="font-bold text-gray-900 text-lg tracking-tight">Arcane</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
              page === item.key
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            <i className={`ti ${item.icon} text-base w-5 text-center`}></i>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Wallet section */}
      <div className="px-3 py-4 border-t border-gray-100">
        {isConnected ? (
          <div className="bg-gray-50 rounded-xl px-3 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-gray-700">{shortAddress}</span>
            </div>
            <button
              onClick={() => disconnect()}
              className="text-xs text-red-500 hover:text-red-600 transition flex items-center gap-1"
            >
              <i className="ti ti-logout text-xs"></i>
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <ConnectButton />
          </div>
        )}
      </div>

      {/* Arc Testnet badge */}
      <div className="px-3 pb-4">
        <div className="bg-blue-50 rounded-xl px-3 py-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs text-blue-600 font-medium">Arc Testnet</span>
        </div>
      </div>
    </aside>
  );
}

function AppContent() {
  const [page, setPage] = useState("dashboard");
  const [locked] = useState(false);

  if (locked) return <LockScreen />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <Sidebar page={page} setPage={setPage} />
      <main className="flex-1 ml-56">
        <div key={page} className="page-enter max-w-6xl mx-auto px-8 py-8">
          {page === "dashboard" && <Dashboard setPage={setPage} />}
          {page === "send"      && <Send />}
          {page === "shield"    && <Shield />}
          {page === "swap"      && <Swap />}
          {page === "history"   && <History />}
          {page === "agent"     && <Agent />}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BalanceProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BalanceProvider>
  );
}

export default App;