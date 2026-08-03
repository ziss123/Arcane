import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { useBalance } from "../context/BalanceContext";

const SHIELD_POOL = "0xF9C6B588E99254dC487D75767283F93f4a6e7Ae2";
const SIMPLE_SWAP = "0x60C669b57A11e41Db84b1A804621BD086262A3D8";

const TOKEN_CONTRACTS = {
  USDC:   "0x3600000000000000000000000000000000000000",
  EURC:   "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  cirBTC: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
};

const DECIMALS = { USDC: 6, EURC: 6, cirBTC: 8 };

const tokenIcons = {
  USDC:   { color: "bg-blue-600", char: "$" },
  EURC:   { color: "bg-blue-700", char: "€" },
  cirBTC: { color: "bg-gradient-to-br from-purple-500 to-blue-400", char: "₿" },
};

async function ethCall(to, data) {
  if (!window.ethereum) return null;
  try {
    const result = await window.ethereum.request({
      method: "eth_call",
      params: [{ to, data }, "latest"],
    });
    return result;
  } catch {
    return null;
  }
}

export default function Dashboard({ setPage }) {
  const { panicked, connected, tokenBalances, fetchAllBalances, address } = useWallet();
  const { balances, visible, setVisible } = useBalance();

  const [poolData, setPoolData] = useState({
    USDC: { shielded: null, swapLiquidity: null },
    EURC: { shielded: null, swapLiquidity: null },
    cirBTC: { shielded: null, swapLiquidity: null },
  });
  const [poolLoading, setPoolLoading] = useState(false);

  const fetchPoolData = async () => {
    if (!window.ethereum) return;
    setPoolLoading(true);
    try {
      const updated = {};
      for (const [symbol, contractAddr] of Object.entries(TOKEN_CONTRACTS)) {
        const dec = DECIMALS[symbol];

        // ShieldPool totalShielded — selector 0x6d7f2685
        const shieldedRaw = await ethCall(
          SHIELD_POOL,
          "0x6d7f2685" + contractAddr.slice(2).padStart(64, "0")
        );
        const shielded = shieldedRaw
          ? (parseInt(shieldedRaw, 16) / Math.pow(10, dec)).toFixed(dec === 8 ? 6 : 2)
          : "0.00";

        // SimpleSwap liquidity via getAmountOut 1 unit → proxy for pool depth
        const oneUnit = BigInt(Math.pow(10, dec));
        const swapRaw = await ethCall(
          SIMPLE_SWAP,
          "0x4aa06652"
            + contractAddr.slice(2).padStart(64, "0")
            + TOKEN_CONTRACTS["USDC"].slice(2).padStart(64, "0")
            + oneUnit.toString(16).padStart(64, "0")
        );
        const swapLiquidity = swapRaw && parseInt(swapRaw, 16) > 0 ? "Active" : "Low";

        updated[symbol] = { shielded, swapLiquidity };
      }
      setPoolData(updated);
    } catch (err) {
      console.error("Pool fetch error:", err);
    } finally {
      setPoolLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, [connected]);

  const activities = panicked ? [] : [
    { icon: "ti-eye-off", label: "Private send", time: "2 hours ago", amount: "-0.00 USDC", color: "text-red-400" },
    { icon: "ti-shield", label: "Shield funds", time: "Yesterday", amount: "+0.00 USDC", color: "text-green-400" },
    { icon: "ti-eye", label: "Public receive", time: "2 days ago", amount: "+0.20 USDC", color: "text-green-400" },
  ];

  const getAmount = (symbol, bal) => {
    if (connected && tokenBalances[symbol] !== null) return tokenBalances[symbol];
    return bal.amount;
  };

  const totalUSDC = Object.entries(balances).reduce((sum, [symbol, bal]) => {
    return sum + (parseFloat(getAmount(symbol, bal)) || 0);
  }, 0);

  const actions = [
    { icon: "ti-send", label: "Send", page: "send", color: "bg-blue-600 hover:bg-blue-500" },
    { icon: "ti-shield", label: "Shield", page: "shield", color: "bg-purple-600 hover:bg-purple-500" },
    { icon: "ti-arrows-exchange", label: "Swap", page: "swap", color: "bg-green-600 hover:bg-green-500" },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Row 1 — Net Worth + Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        {/* Net Worth */}
        <div className="col-span-1 bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Net worth</span>
            <div className="flex items-center gap-2">
              {connected && (
                <button onClick={() => fetchAllBalances(address)} className="text-gray-500 hover:text-gray-300 transition">
                  <i className="ti ti-refresh text-sm"></i>
                </button>
              )}
              <button onClick={() => setVisible(!visible)} className="text-gray-500 hover:text-gray-300 transition">
                <i className={`ti ${visible ? "ti-eye" : "ti-eye-off"} text-sm`}></i>
              </button>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {visible ? totalUSDC.toFixed(2) : "••••"}
          </div>
          <div className="text-sm text-gray-500 mb-4">USDC equivalent</div>
          {connected ? (
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              Arc Testnet
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
              Not connected
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="col-span-2 bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
          <div className="text-sm text-gray-400 mb-4">Quick actions</div>
          <div className="grid grid-cols-4 gap-3">
            {actions.map((a) => (
              <button
                key={a.page}
                onClick={() => setPage(a.page)}
                className={`${a.color} transition rounded-xl py-4 flex flex-col items-center gap-2 active:scale-95`}
              >
                <i className={`ti ${a.icon} text-xl text-white`}></i>
                <span className="text-xs text-white font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 — Assets + Activity */}
      <div className="grid grid-cols-3 gap-4">
        {/* Your Assets */}
        <div className="col-span-2 bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
          <div className="text-sm text-gray-400 mb-4">Your assets</div>
          {!connected && (
            <div className="text-xs text-gray-500 bg-white/5 rounded-lg p-3 mb-4 text-center">
              Connect wallet to see real balances from Arc Testnet
            </div>
          )}
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-4 px-3 py-2 text-xs text-gray-500">
              <span>Asset</span>
              <span className="text-right">Balance</span>
              <span className="text-right">Shielded</span>
              <span className="text-right">Network</span>
            </div>
            {Object.entries(balances).map(([symbol, bal]) => (
              <div
                key={symbol}
                onClick={() => setPage("shield")}
                className="grid grid-cols-4 items-center bg-[#262626] hover:bg-[#2a2a2a] transition rounded-xl px-3 py-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${tokenIcons[symbol].color} flex items-center justify-center text-xs text-white font-bold`}>
                    {tokenIcons[symbol].char}
                  </div>
                  <span className="text-sm font-medium text-white">{symbol}</span>
                </div>
                <div className="text-right text-sm text-white">
                  {visible ? getAmount(symbol, bal) : "••••"}
                </div>
                <div className="text-right text-sm text-gray-400">
                  {visible ? bal.shielded : "••••"}
                </div>
                <div className="text-right">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                    Arc Testnet
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Recent activity</span>
            <button onClick={() => setPage("history")} className="text-xs text-blue-400 hover:text-blue-300 transition">
              View all
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {activities.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">No activity yet.</div>
            ) : activities.map((a) => (
              <div
                key={a.label + a.time}
                onClick={() => setPage("history")}
                className="flex items-center justify-between bg-[#262626] hover:bg-[#2a2a2a] transition rounded-xl px-3 py-3 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
                    <i className={`ti ${a.icon} text-xs text-gray-300`}></i>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-100">{a.label}</div>
                    <div className="text-xs text-gray-500">{a.time}</div>
                  </div>
                </div>
                <div className={`text-xs font-medium ${a.color}`}>{a.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 — Pool Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Shield Pool */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-white">Shield Pool</div>
              <div className="text-xs text-gray-500 mt-0.5 font-mono">
                {SHIELD_POOL.slice(0, 10)}...{SHIELD_POOL.slice(-6)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
              <span className="text-xs text-purple-400">Live</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 px-2 py-1 text-xs text-gray-500">
              <span>Token</span>
              <span className="text-right">Total Shielded</span>
              <span className="text-right">Status</span>
            </div>
            {Object.keys(TOKEN_CONTRACTS).map((symbol) => (
              <div
                key={symbol}
                onClick={() => setPage("shield")}
                className="grid grid-cols-3 items-center bg-[#262626] hover:bg-[#2a2a2a] transition rounded-xl px-3 py-2.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${tokenIcons[symbol].color} flex items-center justify-center text-xs text-white font-bold`}>
                    {tokenIcons[symbol].char}
                  </div>
                  <span className="text-xs font-medium text-white">{symbol}</span>
                </div>
                <div className="text-right text-xs text-purple-300 font-medium">
                  {poolLoading ? "..." : poolData[symbol]?.shielded ?? "0.00"}
                </div>
                <div className="text-right">
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPage("shield")}
            className="w-full mt-4 py-2 rounded-xl border border-purple-500/30 text-purple-400 text-xs hover:bg-purple-500/10 transition"
          >
            Shield / Unshield →
          </button>
        </div>

        {/* Swap Pool */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-white">Swap Pool</div>
              <div className="text-xs text-gray-500 mt-0.5 font-mono">
                {SIMPLE_SWAP.slice(0, 10)}...{SIMPLE_SWAP.slice(-6)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 px-2 py-1 text-xs text-gray-500">
              <span>Pair</span>
              <span className="text-right">Rate</span>
              <span className="text-right">Liquidity</span>
            </div>
            {[
              { from: "USDC", to: "EURC", rate: "1:1" },
              { from: "USDC", to: "cirBTC", rate: "1:0.000013" },
              { from: "EURC", to: "cirBTC", rate: "1:0.000013" },
            ].map((pair) => (
              <div
                key={pair.from + pair.to}
                onClick={() => setPage("swap")}
                className="grid grid-cols-3 items-center bg-[#262626] hover:bg-[#2a2a2a] transition rounded-xl px-3 py-2.5 cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <div className={`w-5 h-5 rounded-full ${tokenIcons[pair.from].color} flex items-center justify-center text-xs text-white font-bold`}>
                    {tokenIcons[pair.from].char}
                  </div>
                  <span className="text-gray-500 text-xs">→</span>
                  <div className={`w-5 h-5 rounded-full ${tokenIcons[pair.to].color} flex items-center justify-center text-xs text-white font-bold`}>
                    {tokenIcons[pair.to].char}
                  </div>
                  <span className="text-xs text-gray-400 ml-1">{pair.from}/{pair.to}</span>
                </div>
                <div className="text-right text-xs text-green-300 font-medium">
                  {pair.rate}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    poolData[pair.from]?.swapLiquidity === "Active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {poolLoading ? "..." : poolData[pair.from]?.swapLiquidity ?? "Low"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPage("swap")}
            className="w-full mt-4 py-2 rounded-xl border border-green-500/30 text-green-400 text-xs hover:bg-green-500/10 transition"
          >
            Swap tokens →
          </button>
        </div>
      </div>

    </div>
  );
}