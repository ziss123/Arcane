import { useState, useRef, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { useWallet } from "../context/WalletContext";
import { tokens } from "../components/TokenSelector";

const SIMPLE_SWAP = "0x60C669b57A11e41Db84b1A804621BD086262A3D8";

const TOKEN_CONTRACTS = {
  USDC:   "0x3600000000000000000000000000000000000000",
  EURC:   "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  cirBTC: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
};

const DECIMALS = { USDC: 6, EURC: 6, cirBTC: 8 };

function TokenDropdown({ selected, onChange, exclude }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const available = tokens.filter((t) => t.symbol !== exclude);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-white/10 bg-[#1f1f1f] hover:bg-[#2a2a2a] transition rounded-md px-3 py-2 text-sm font-medium"
      >
        <div className={"w-5 h-5 rounded-full " + selected.color + " flex items-center justify-center text-xs text-white font-semibold"}>
          {selected.char}
        </div>
        {selected.symbol}
        <i className="ti ti-chevron-down text-gray-400 text-xs"></i>
      </button>

      {open && (
        <div className="absolute right-0 top-11 bg-[#1f1f1f] border border-white/10 rounded-xl p-2 z-50 flex flex-col gap-1 min-w-[140px]">
          {available.map((t) => (
            <button
              key={t.symbol}
              onClick={() => { onChange(t); setOpen(false); }}
              className={"flex items-center gap-2 px-3 py-2 rounded-md text-sm transition hover:bg-[#2a2a2a] " + (selected.symbol === t.symbol ? "text-blue-400 font-medium" : "text-gray-300")}
            >
              <div className={"w-6 h-6 rounded-full " + t.color + " flex items-center justify-center text-xs text-white font-semibold"}>
                {t.char}
              </div>
              {t.symbol}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Swap() {
  const { showToast } = useToast();
  const { connected, address, fetchAllBalances } = useWallet();
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [amount, setAmount] = useState("");
  const [estimated, setEstimated] = useState("0.0");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const getAmountOut = async (amountIn) => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setEstimated("0.0");
      return;
    }
    try {
      const decimalsIn = DECIMALS[fromToken.symbol];
      const decimalsOut = DECIMALS[toToken.symbol];
      const value = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn)));
      const fromAddr = TOKEN_CONTRACTS[fromToken.symbol];
      const toAddr = TOKEN_CONTRACTS[toToken.symbol];

      // getAmountOut(address,address,uint256) = 0x4aa06652
      const data = "0x4aa06652"
        + fromAddr.slice(2).padStart(64, "0")
        + toAddr.slice(2).padStart(64, "0")
        + value.toString(16).padStart(64, "0");

      const result = await window.ethereum.request({
        method: "eth_call",
        params: [{ to: SIMPLE_SWAP, data }, "latest"],
      });

      const raw = parseInt(result, 16) / Math.pow(10, decimalsOut);
      setEstimated(raw.toFixed(decimalsOut === 8 ? 6 : 2));
    } catch (err) {
      setEstimated("0.0");
    }
  };

  useEffect(() => {
    getAmountOut(amount);
  }, [amount, fromToken, toToken]);

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount("");
    setEstimated("0.0");
  };

  const handleFromChange = (t) => {
    if (t.symbol === toToken.symbol) setToToken(fromToken);
    setFromToken(t);
  };

  const handleToChange = (t) => {
    if (t.symbol === fromToken.symbol) setFromToken(toToken);
    setToToken(t);
  };

  const handleSwap = async () => {
    if (!connected) return showToast("Connect your wallet first", "error");
    if (!amount || parseFloat(amount) <= 0) return showToast("Enter a valid amount", "error");

    setLoading(true);
    setTxHash(null);

    try {
      const decimalsIn = DECIMALS[fromToken.symbol];
      const value = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimalsIn)));
      const fromAddr = TOKEN_CONTRACTS[fromToken.symbol];
      const toAddr = TOKEN_CONTRACTS[toToken.symbol];

      // Step 1: Approve token ke SimpleSwap
      showToast("Step 1/2: Approving token...");
      const approveData = "0x095ea7b3"
        + SIMPLE_SWAP.slice(2).padStart(64, "0")
        + value.toString(16).padStart(64, "0");

      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: fromAddr, data: approveData, gas: "0x186A0" }],
      });

      // Step 2: Swap — swap(address,address,uint256) = 0xdf791e50
      showToast("Step 2/2: Swapping...");
      const swapData = "0xdf791e50"
        + fromAddr.slice(2).padStart(64, "0")
        + toAddr.slice(2).padStart(64, "0")
        + value.toString(16).padStart(64, "0");

      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: SIMPLE_SWAP, data: swapData, gas: "0x30D40" }],
      });

      setTxHash(hash);
      showToast(fromToken.symbol + " swapped to " + toToken.symbol + " successfully");
      setAmount("");
      setEstimated("0.0");
      await fetchAllBalances(address);
    } catch (err) {
      showToast(err.message || "Swap failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-xl">
      <h1 className="font-semibold text-lg">Private swap</h1>

      {!connected && (
        <div className="bg-[#262626] border border-yellow-500/30 rounded-md p-3 text-xs text-yellow-400">
          Connect your wallet to swap tokens
        </div>
      )}

      <div className="bg-[#262626] rounded-xl p-4 flex flex-col gap-3">
        <span className="text-sm text-gray-400">You send</span>
        <div className="flex items-center justify-between gap-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            placeholder="0.0"
            className="bg-transparent text-2xl font-semibold outline-none flex-1 min-w-0"
          />
          <TokenDropdown selected={fromToken} onChange={handleFromChange} exclude={toToken.symbol} />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleFlip}
          className="w-9 h-9 rounded-full bg-[#262626] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition"
        >
          <i className="ti ti-arrows-up-down text-base"></i>
        </button>
      </div>

      <div className="bg-[#262626] rounded-xl p-4 flex flex-col gap-3">
        <span className="text-sm text-gray-400">You receive (estimated)</span>
        <div className="flex items-center justify-between gap-3">
          <span className="text-2xl font-semibold">{estimated}</span>
          <TokenDropdown selected={toToken} onChange={handleToChange} exclude={fromToken.symbol} />
        </div>
      </div>

      <div className="bg-[#262626] rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-2">
            <i className="ti ti-users-group"></i> Anonymity set
          </span>
          <span className="text-green-400 font-medium">Active pool</span>
        </div>
        <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
          <div className="h-full bg-green-500" style={{ width: "82%" }} />
        </div>
        <div className="text-xs text-gray-500">SimpleSwap contract on Arc Testnet</div>
      </div>

      <div className="flex justify-between text-sm text-gray-400">
        <span>Rate</span>
        <span>1 {fromToken.symbol} = {estimated && amount === "1" ? estimated : "..."} {toToken.symbol}</span>
      </div>

      {txHash && (
        <div className="bg-[#262626] rounded-md p-3 text-xs flex flex-col gap-1">
          <div className="text-green-400 font-medium">Swap completed</div>
          <a
            href={"https://testnet.arcscan.app/tx/" + txHash}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 break-all"
          >
            {txHash.slice(0, 20)}...{txHash.slice(-10)}
          </a>
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={loading || !connected}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition rounded-md py-3 text-sm font-medium"
      >
        {loading ? "Swapping..." : "Swap privately"}
      </button>
    </div>
  );
}