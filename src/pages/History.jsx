import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";

const EXPLORER_API = "https://testnet.arcscan.app/api";

const TOKEN_MAP = {
  "0x3600000000000000000000000000000000000000": { symbol: "USDC", char: "$", color: "bg-blue-600" },
  "0x89b50855aa3be2f677cd6303cec089b5f319d72a": { symbol: "EURC", char: "E", color: "bg-blue-700" },
  "0xf0c4a4ce82a5746abaad9425360ab04fbba432bf": { symbol: "cirBTC", char: "B", color: "bg-purple-500" },
};

function shortenHash(hash) {
  if (!hash) return "";
  return hash.slice(0, 10) + "..." + hash.slice(-8);
}

function timeAgo(timestamp) {
  const diff = Date.now() / 1000 - parseInt(timestamp);
  if (diff < 60) return Math.floor(diff) + "s ago";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

export default function History() {
  const { connected, address } = useWallet();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        EXPLORER_API + "?module=account&action=tokentx&address=" + address + "&sort=desc&limit=20"
      );
      const data = await res.json();
      if (data.status === "1" && data.result) {
        setTxs(data.result);
      } else {
        setTxs([]);
      }
    } catch (err) {
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && address) fetchHistory();
  }, [connected, address]);

  const getToken = (contractAddress) => {
    if (!contractAddress) return { symbol: "?", char: "?", color: "bg-gray-600" };
    return TOKEN_MAP[contractAddress.toLowerCase()] || { symbol: "Unknown", char: "?", color: "bg-gray-600" };
  };

  const isIncoming = (tx) => {
    if (!address) return false;
    return tx.to.toLowerCase() === address.toLowerCase();
  };

  const formatAmount = (value, symbol) => {
    const decimals = symbol === "cirBTC" ? 8 : 6;
    const raw = parseInt(value || "0x0", 16) / Math.pow(10, decimals);
    return raw.toFixed(4);
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg">History</h1>
        {connected && (
          <button
            onClick={fetchHistory}
            className="text-gray-400 hover:text-gray-200 transition"
            title="Refresh"
          >
            <i className="ti ti-refresh text-base"></i>
          </button>
        )}
      </div>

      {!connected && (
        <div className="bg-[#262626] border border-yellow-500/30 rounded-md p-3 text-xs text-yellow-400">
          Connect your wallet to see transaction history
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500 text-center py-6">
          Loading transactions...
        </div>
      )}

      {error && (
        <div className="bg-[#262626] border border-red-500/30 rounded-md p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {!loading && connected && txs.length === 0 && !error && (
        <div className="text-sm text-gray-500 text-center py-6 bg-[#262626] rounded-md">
          No transactions found on Arc Testnet
        </div>
      )}

      <div className="flex flex-col gap-2">
        {txs.map((tx, i) => {
          const token = getToken(tx.contractAddress || tx.to);
          const incoming = isIncoming(tx);
          const amount = formatAmount(tx.value, token.symbol);

          return (
            <a
              key={tx.hash || i}
              href={"https://testnet.arcscan.app/tx/" + tx.hash}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#262626] hover:bg-[#2a2a2a] transition rounded-md px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={"w-8 h-8 rounded-full " + token.color + " flex items-center justify-center text-sm text-white font-semibold"}>
                  {token.char}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-100">
                    {incoming ? "Received " : "Sent "}{token.symbol}
                  </div>
                  <div className="text-xs text-gray-500">
                    {tx.timeStamp ? timeAgo(tx.timeStamp) : "Pending"} · {shortenHash(tx.hash)}
                  </div>
                </div>
              </div>
              <div className={"text-sm font-medium " + (incoming ? "text-green-400" : "text-red-400")}>
                {incoming ? "+" : "-"}{amount} {token.symbol}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}