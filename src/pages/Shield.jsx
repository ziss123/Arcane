import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { useWallet } from "../context/WalletContext";
import TokenSelector, { tokens } from "../components/TokenSelector";

const SHIELD_POOL = "0xF9C6B588E99254dC487D75767283F93f4a6e7Ae2";

const TOKEN_CONTRACTS = {
  USDC:   "0x3600000000000000000000000000000000000000",
  EURC:   "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  cirBTC: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
};

const DECIMALS = { USDC: 6, EURC: 6, cirBTC: 8 };

export default function Shield() {
  const { showToast } = useToast();
  const { connected, address, fetchAllBalances } = useWallet();
  const [mode, setMode] = useState("shield");
  const [token, setToken] = useState(tokens[0]);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [shieldedBalance, setShieldedBalance] = useState(null);

  const fetchShieldedBalance = async () => {
    if (!connected || !address) return;
    try {
      const tokenAddr = TOKEN_CONTRACTS[token.symbol];
      // selector: getShieldedBalance(address,address) = 0x7c6801aa
      const data = "0x7c6801aa"
        + tokenAddr.slice(2).padStart(64, "0")
        + address.slice(2).padStart(64, "0");
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [{ to: SHIELD_POOL, data }, "latest"],
      });
      const decimals = DECIMALS[token.symbol];
      const raw = parseInt(result, 16) / Math.pow(10, decimals);
      setShieldedBalance(raw.toFixed(decimals === 8 ? 6 : 2));
    } catch (err) {
      setShieldedBalance("0.00");
    }
  };

  useEffect(() => {
    fetchShieldedBalance();
  }, [connected, address, token]);

  const handleShield = async () => {
    if (!connected) return showToast("Connect your wallet first", "error");
    if (!amount || parseFloat(amount) <= 0) return showToast("Enter a valid amount", "error");

    setLoading(true);
    setTxHash(null);

    try {
      const decimals = DECIMALS[token.symbol];
      const value = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
      const tokenContract = TOKEN_CONTRACTS[token.symbol];

      // Step 1: Approve — selector approve(address,uint256) = 0x095ea7b3
      showToast("Step 1/2: Approving token...");
      const approveData = "0x095ea7b3"
        + SHIELD_POOL.slice(2).padStart(64, "0")
        + value.toString(16).padStart(64, "0");

      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: tokenContract, data: approveData, gas: "0x186A0" }],
      });

      // Step 2: Shield — selector shield(address,uint256) = 0x8f214a33
      showToast("Step 2/2: Shielding funds...");
      const shieldData = "0x8f214a33"
        + tokenContract.slice(2).padStart(64, "0")
        + value.toString(16).padStart(64, "0");

      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: SHIELD_POOL, data: shieldData, gas: "0x30D40" }],
      });

      setTxHash(hash);
      showToast("Funds shielded successfully");
      setAmount("");
      await fetchAllBalances(address);
      await fetchShieldedBalance();
    } catch (err) {
      showToast(err.message || "Transaction failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnshield = async () => {
    if (!connected) return showToast("Connect your wallet first", "error");
    if (!amount || parseFloat(amount) <= 0) return showToast("Enter a valid amount", "error");
    if (!recipient || !recipient.startsWith("0x")) return showToast("Invalid recipient address", "error");

    setLoading(true);
    setTxHash(null);

    try {
      const decimals = DECIMALS[token.symbol];
      const value = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
      const tokenContract = TOKEN_CONTRACTS[token.symbol];

      // selector: unshield(address,uint256,address) = 0x46698e0b
      const data = "0x46698e0b"
        + tokenContract.slice(2).padStart(64, "0")
        + value.toString(16).padStart(64, "0")
        + recipient.slice(2).padStart(64, "0");

      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: SHIELD_POOL, data, gas: "0x30D40" }],
      });

      setTxHash(hash);
      showToast("Funds unshielded successfully");
      setAmount("");
      setRecipient("");
      await fetchAllBalances(address);
      await fetchShieldedBalance();
    } catch (err) {
      showToast(err.message || "Transaction failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-md">
      <h1 className="font-semibold text-lg">Shield / Unshield</h1>

      {!connected && (
        <div className="bg-[#262626] border border-yellow-500/30 rounded-md p-3 text-xs text-yellow-400">
          Connect your wallet to use Shield
        </div>
      )}

      {shieldedBalance !== null && connected && (
        <div className="bg-[#262626] rounded-md p-3 flex justify-between text-sm">
          <span className="text-gray-400">Shielded balance</span>
          <span className="font-medium text-blue-400">{shieldedBalance} {token.symbol}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setMode("shield")}
          className={"flex-1 py-2 rounded-md text-sm border border-white/10 transition " + (mode === "shield" ? "bg-[#262626] font-medium" : "text-gray-500 hover:bg-[#262626]")}
        >
          Shield
        </button>
        <button
          onClick={() => setMode("unshield")}
          className={"flex-1 py-2 rounded-md text-sm border border-white/10 transition " + (mode === "unshield" ? "bg-[#262626] font-medium" : "text-gray-500 hover:bg-[#262626]")}
        >
          Unshield
        </button>
      </div>

      <div className="bg-[#262626] rounded-md p-3 text-sm text-center text-gray-400">
        {mode === "shield"
          ? "Public funds enter the private pool"
          : "Funds in the private pool exit to a new address"}
      </div>

      <TokenSelector selected={token} onChange={(t) => { setToken(t); setShieldedBalance(null); }} />

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

      {mode === "unshield" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Recipient address</label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="border border-white/10 rounded-md px-3 py-2 text-sm bg-[#1f1f1f] outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="bg-[#262626] rounded-md p-3 text-xs flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Anonymity set</span>
          <span className="text-green-400 font-medium">Active pool</span>
        </div>
        <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
          <div className="h-full bg-green-500" style={{ width: "82%" }} />
        </div>
        <div className="text-gray-500">ShieldPool contract on Arc Testnet</div>
      </div>

      {txHash && (
        <div className="bg-[#262626] rounded-md p-3 text-xs flex flex-col gap-1">
          <div className="text-green-400 font-medium">
            {mode === "shield" ? "Shielded" : "Unshielded"} successfully
          </div>
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
        onClick={mode === "shield" ? handleShield : handleUnshield}
        disabled={loading || !connected}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition rounded-md py-3 text-sm font-medium"
      >
        {loading ? "Processing..." : mode === "shield" ? "Shield funds" : "Unshield funds"}
      </button>
    </div>
  );
}