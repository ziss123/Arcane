import { useWallet } from "../../context/WalletContext";

export default function Sidebar({ page, setPage }) {
  const { connected, shortAddress, connect, disconnect } = useWallet();

  const menuItems = [
    { icon: "ti-layout-dashboard", label: "Dashboard", key: "dashboard" },
    { icon: "ti-send", label: "Send privately", key: "send" },
    { icon: "ti-shield", label: "Shield / Unshield", key: "shield" },
    { icon: "ti-arrows-exchange", label: "Private swap", key: "swap" },
    { icon: "ti-history", label: "History", key: "history" },
    { icon: "ti-address-book", label: "Address book", key: "addressbook" },
    { icon: "ti-shield-check", label: "Proof verifier", key: "verify" },
    { icon: "ti-settings", label: "Settings", key: "settings" },
  ];

  return (
    <div className="w-56 bg-[#212121] p-4 flex flex-col gap-1 min-h-screen border-r border-white/5">
      <div className="flex items-center gap-2 mb-4 px-1">
        <i className="ti ti-shield-lock text-xl text-blue-400"></i>
        <span className="font-semibold"> Arcane  </span>
      </div>

      {menuItems.map((item) => (
        <div
          key={item.key}
          onClick={() => setPage(item.key)}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
            page === item.key
              ? "bg-[#2a2a2a] border border-white/10 font-medium text-white"
              : "text-gray-400 hover:bg-[#262626]"
          }`}
        >
          <i className={`ti ${item.icon} text-base`}></i> {item.label}
        </div>
      ))}

      <div className="mt-auto pt-4 border-t border-white/5">
        {connected ? (
          <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>{shortAddress}</span>
            </div>
            <button
              onClick={disconnect}
              className="text-red-400 hover:text-red-300 transition"
            >
              <i className="ti ti-logout"></i>
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-md py-2 text-sm font-medium flex items-center justify-center gap-2"
          >
            <i className="ti ti-plug"></i> Connect wallet
          </button>
        )}
      </div>
    </div>
  );
}