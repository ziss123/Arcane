import { useState } from "react";
import { useToast } from "../context/ToastContext";
import { useWallet } from "../context/WalletContext";
import TokenSelector, { tokens } from "../components/TokenSelector";

const CONTRACTS = {
  USDC:   "0x3600000000000000000000000000000000000000",
  EURC:   "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  cirBTC: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
};

const DECIMALS = { USDC: 6, EURC: 6, cirBTC: 8 };

export default function Send() {
  const { showToast } = useToast();
  const { connected, address, fetchAllBalances } = useWallet();
  const [mode, setMode] = useState("private");
  const [token, setToken] = useState(tokens[0]);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const handleSend = async () => {
    if (!connected) return showToast("Connect your wallet first", "error");
    if (!recipient.startsWith("0x")) return showToast("Invalid address", "error");
    if (!amount || parseFloat(amount) <= 0) return showToast("Enter a valid amount", "error");

    setLoading(true);
    setTxHash(null);

    try {
      const decimals = DECIMALS[token.symbol];
      const value = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
      const data = "0xa9059cbb"
        + recipient.slice(2).padStart(64, "0")
        + value.toString(16).padStart(64, "0");

      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: CONTRACTS[token.symbol], data, gas: "0x186A0" }],
      });

      setTxHash(hash);
      showToast(token.symbol + " sent successfully");
      setAmount("");
      setRecipient("");
      await fetchAllBalances(address);
    } catch (err) {
      showToast(err.message || "Transaction failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-md">
      <h1 className="font-semibold text-lg">Send</h1>

      {!connected && (
        <div className="bg-[#262626] border border-yellow-500/30 rounded-md p-3 text-xs text-yellow-400">
          Connect your wallet to send tokens
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setMode("private")}
          className={"flex-1 py-2 rounded-md text-sm border border-white/10 transition " + (mode === "private" ? "bg-[#262626] font-medium" : "text-gray-500 hover:bg-[#262626]")}
        >
          Private
        </button>
        <button
          onClick={() => setMode("public")}
          className={"flex-1 py-2 rounded-md text-sm border border-white/10 transition " + (mode === "public" ? "bg-[#262626] font-medium" : "text-gray-500 hover:bg-[#262626]")}
        >
          Public
        </button>
      </div>

      <TokenSelector selected={token} onChange={setToken} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">Recipient address</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className="border border-white/10 rounded-md px-3 py-2 text-sm bg-[#1f1f1f] outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">Amount</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          placeholder="0.0"
          className="border border-white/10 rounded-md px-3 py-2 text-sm bg-[#1f1f1f] outline-none focus:border-blue-500"
        />
      </div>

      {mode === "private" && (
        <div className="bg-[#262626] rounded-md p-3 text-xs text-gray-400 flex justify-between">
          <span>Proof fee (zk)</span>
          <span>~0.002 USDC</span>
        </div>
      )}

      {txHash && (
        <div className="bg-[#262626] rounded-md p-3 text-xs flex flex-col gap-1">
          <div className="text-green-400 font-medium">Transaction sent</div>
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
        onClick={handleSend}
        disabled={loading || !connected}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition rounded-md py-3 text-sm font-medium"
      >
        {loading ? "Sending..." : mode === "private" ? "Send privately" : "Send"}
      </button>
    </div>
  );
}