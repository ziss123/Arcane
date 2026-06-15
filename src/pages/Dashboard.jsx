import { useWallet } from "../context/WalletContext";
import { useBalance } from "../context/BalanceContext";

export default function Dashboard({ setPage }) {
  const { panicked, connected, tokenBalances, fetchAllBalances, address } = useWallet();
  const { balances, visible, setVisible } = useBalance();

  const tokenIcons = {
    USDC:   { color: "bg-blue-600", char: "$" },
    EURC:   { color: "bg-blue-700", char: "€" },
    cirBTC: { color: "bg-gradient-to-br from-purple-500 to-blue-400", char: "₿" },
  };

  const activities = panicked ? [] : [
    { icon: "ti-eye-off", label: "Private send", time: "2 hours ago", amount: "-0.00 USDC", color: "text-red-400" },
    { icon: "ti-shield", label: "Shield funds", time: "Yesterday", amount: "+0.00 USDC", color: "text-green-400" },
    { icon: "ti-eye", label: "Public receive", time: "2 days ago", amount: "+0.20 USDC", color: "text-green-400" },
  ];

  const getAmount = (symbol, bal) => {
    if (connected && tokenBalances[symbol] !== null) {
      return tokenBalances[symbol];
    }
    return bal.amount;
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-2xl">

      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg">Dashboard</h1>
        <div className="flex items-center gap-3">
          {connected && (
            <button
              onClick={() => fetchAllBalances(address)}
              className="text-gray-400 hover:text-gray-200 transition"
              title="Refresh balances"
            >
              <i className="ti ti-refresh text-base"></i>
            </button>
          )}
          <button
            onClick={() => setVisible(!visible)}
            className="text-gray-400 hover:text-gray-200 transition"
            title={visible ? "Hide balances" : "Show balances"}
          >
            <i className={"ti " + (visible ? "ti-eye" : "ti-eye-off") + " text-base"}></i>
          </button>
        </div>
      </div>

      <div className="bg-[#262626] rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">Total balance</div>
          {connected ? (
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              Arc Testnet
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
              Not connected
            </div>
          )}
        </div>

        {panicked ? (
          <div className="text-2xl font-semibold">0.00 USDC</div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(balances).map(([symbol, bal]) => (
              <div key={symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={"w-7 h-7 rounded-full " + tokenIcons[symbol].color + " flex items-center justify-center text-xs text-white font-semibold"}>
                    {tokenIcons[symbol].char}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-100">{symbol}</div>
                    <div className="text-xs text-gray-500">
                      Shielded: {visible ? bal.shielded : "••••"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {visible ? getAmount(symbol, bal) : "••••"}
                  </div>
                  {connected && tokenBalances[symbol] !== null && visible && (
                    <div className="text-xs text-gray-500">on-chain</div>
                  )}
                </div>
              </div>
            ))}

            {!connected && (
              <div className="text-xs text-gray-500 border border-white/5 rounded-md p-2 text-center">
                Connect wallet to see real balances from Arc Testnet
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setPage("send")}
          className="border border-white/10 rounded-md py-3 flex items-center justify-center gap-2 text-sm hover:bg-[#262626] active:scale-[0.98] transition"
        >
          <i className="ti ti-send"></i> Send privately
        </button>
        <button
          onClick={() => setPage("shield")}
          className="border border-white/10 rounded-md py-3 flex items-center justify-center gap-2 text-sm hover:bg-[#262626] active:scale-[0.98] transition"
        >
          <i className="ti ti-shield"></i> Shield funds
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setPage("swap")}
          className="border border-white/10 rounded-md py-3 flex items-center justify-center gap-2 text-sm hover:bg-[#262626] active:scale-[0.98] transition"
        >
          <i className="ti ti-arrows-exchange"></i> Private swap
        </button>
        <button
          onClick={() => setPage("addressbook")}
          className="border border-white/10 rounded-md py-3 flex items-center justify-center gap-2 text-sm hover:bg-[#262626] active:scale-[0.98] transition"
        >
          <i className="ti ti-address-book"></i> Address book
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-gray-400">Recent activity</div>
        <button
          onClick={() => setPage("history")}
          className="text-xs text-blue-400 hover:text-blue-300 transition"
        >
          View all
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {activities.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-6 bg-[#262626] rounded-md">
            No activity yet.
          </div>
        )}
        {activities.map((a) => (
          <div
            key={a.label + a.time}
            onClick={() => setPage("history")}
            className="bg-[#262626] rounded-md px-4 py-3 flex items-center justify-between hover:bg-[#2a2a2a] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <i className={"ti " + a.icon + " text-base text-gray-300"}></i>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-100">{a.label}</div>
                <div className="text-xs text-gray-500">{a.time}</div>
              </div>
            </div>
            <div className={"text-sm font-medium " + a.color}>{a.amount}</div>
          </div>
        ))}
      </div>

    </div>
  );
}