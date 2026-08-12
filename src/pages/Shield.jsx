import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { useAccount } from "wagmi";
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
  const { address, isConnected } = useAccount();
  
  const [mode, setMode] = useState("shield");
  const [token, setToken] = useState(tokens[0]);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [shieldedBalance, setShieldedBalance] = useState(null);
  const [step, setStep] = useState(null);

  // Fungsi fetch balances via RPC
  const fetchAllBalances = async (addr) => {
    if (!addr) return;
    try {
      const rpc = "https://rpc.testnet.arc.network";
      const fetchToken = async (symbol) => {
        const contract = TOKEN_CONTRACTS[symbol];
        const decimals = DECIMALS[symbol];
        const data = "0x70a08231" + addr.slice(2).padStart(64, "0");
        const response = await fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0", method: "eth_call",
            params: [{ to: contract, data }, "latest"], id: 1,
          }),
        });
        const json = await response.json();
        const raw = parseInt(json.result, 16);
        return (raw / Math.pow(10, decimals)).toFixed(decimals === 8 ? 6 : 2);
      };
      
      const [usdc, eurc, cirbtc] = await Promise.all([
        fetchToken("USDC"), fetchToken("EURC"), fetchToken("cirBTC")
      ]);
      console.log("Balances updated:", { USDC: usdc, EURC: eurc, cirBTC: cirbtc });
    } catch (e) {
      console.error("Failed to fetch balances:", e);
    }
  };

  const fetchShieldedBalance = async () => {
    if (!isConnected || !address) return;
    try {
      const tokenAddr = TOKEN_CONTRACTS[token.symbol];
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
  }, [isConnected, address, token]);

  // CEK KONEKSI WALLET
  const checkWalletConnection = () => {
    if (!isConnected) {
      showToast("Connect your wallet first", "error");
      return false;
    }
    if (!window.ethereum) {
      showToast("No wallet detected. Please install MetaMask.", "error");
      return false;
    }
    return true;
  };

  // CEK INPUT
  const validateInputs = () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast("Enter a valid amount", "error");
      return false;
    }
    if (mode === "unshield" && (!recipient || !recipient.startsWith("0x"))) {
      showToast("Invalid recipient address", "error");
      return false;
    }
    return true;
  };

  const handleShield = async () => {
    if (!checkWalletConnection()) return;
    if (!validateInputs()) return;

    setLoading(true);
    setTxHash(null);
    setStep("approving");

    try {
      const decimals = DECIMALS[token.symbol];
      const value = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
      const tokenContract = TOKEN_CONTRACTS[token.symbol];

      // STEP 1: Approve
      const approveData = "0x095ea7b3"
        + SHIELD_POOL.slice(2).padStart(64, "0")
        + value.toString(16).padStart(64, "0");

      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: tokenContract, data: approveData, gas: "0x186A0" }],
      });

      setStep("shielding");
      // STEP 2: Shield
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
      setStep(null);
      if (address) fetchAllBalances(address);
      await fetchShieldedBalance();
    } catch (err) {
      console.error("Shield error:", err);
      if (err.code === 4001) {
        showToast("Transaction rejected in wallet. Please approve the transaction.", "error");
      } else if (err.code === -32603) {
        showToast("RPC error. Make sure you're on Arc Testnet and have enough USDC for gas.", "error");
      } else {
        showToast(err.message || "Shield failed", "error");
      }
      setStep(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUnshield = async () => {
    if (!checkWalletConnection()) return;
    if (!validateInputs()) return;

    setLoading(true);
    setTxHash(null);
    setStep("unshielding");

    try {
      const decimals = DECIMALS[token.symbol];
      const value = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
      const tokenContract = TOKEN_CONTRACTS[token.symbol];

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
      setStep(null);
      if (address) fetchAllBalances(address);
      await fetchShieldedBalance();
    } catch (err) {
      console.error("Unshield error:", err);
      if (err.code === 4001) {
        showToast("Transaction rejected in wallet. Please approve the transaction.", "error");
      } else if (err.code === -32603) {
        showToast("RPC error. Make sure you're on Arc Testnet and have enough USDC for gas.", "error");
      } else {
        showToast(err.message || "Unshield failed", "error");
      }
      setStep(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-md">
      <h1 className="font-semibold text-lg text-white">Shield / Unshield</h1>

      {!isConnected && (
        <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-400">
          Connect your wallet to use Shield
        </div>
      )}

      {/* Shielded Balance */}
      {shieldedBalance !== null && isConnected && (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-3 flex justify-between text-sm">
          <span className="text-gray-400">Shielded balance</span>
          <span className="font-medium text-blue-400">{shieldedBalance} {token.symbol}</span>
        </div>
      )}

      {/* Toggle Mode */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("shield")}
          className={`flex-1 py-2 rounded-xl text-sm border border-white/10 transition ${
            mode === "shield" ? "bg-[#1a1a1a] text-white font-medium" : "text-gray-500 hover:bg-[#1a1a1a]"
          }`}
        >
          Shield
        </button>
        <button
          onClick={() => setMode("unshield")}
          className={`flex-1 py-2 rounded-xl text-sm border border-white/10 transition ${
            mode === "unshield" ? "bg-[#1a1a1a] text-white font-medium" : "text-gray-500 hover:bg-[#1a1a1a]"
          }`}
        >
          Unshield
        </button>
      </div>

      {/* Info Mode */}
      <div className="bg-[#1a1a1a] rounded-xl p-3 text-sm text-center text-gray-400">
        {mode === "shield"
          ? "🛡️ Public funds enter the private pool"
          : "🔓 Funds in the private pool exit to a new address"}
      </div>

      {/* Token Selector */}
      <TokenSelector selected={token} onChange={(t) => { setToken(t); setShieldedBalance(null); }} />

      {/* Amount Input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">Amount</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          placeholder="0.0"
          className="border border-white/10 rounded-xl px-3 py-2 text-sm bg-[#1a1a1a] outline-none focus:border-blue-500 text-white"
        />
      </div>

      {/* Recipient (Unshield) */}
      {mode === "unshield" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Recipient address</label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="border border-white/10 rounded-xl px-3 py-2 text-sm bg-[#1a1a1a] outline-none focus:border-blue-500 text-white"
          />
        </div>
      )}

      {/* Status Steps */}
      {loading && step === "approving" && (
        <div className="text-xs text-blue-400 text-center animate-pulse">
          ⏳ Step 1/2: Approving token...
        </div>
      )}
      {loading && step === "shielding" && (
        <div className="text-xs text-green-400 text-center animate-pulse">
          🔒 Step 2/2: Shielding funds...
        </div>
      )}
      {loading && step === "unshielding" && (
        <div className="text-xs text-purple-400 text-center animate-pulse">
          🔓 Unshielding funds...
        </div>
      )}

      {/* Transaction Hash */}
      {txHash && (
        <div className="bg-[#1a1a1a] border border-green-500/20 rounded-xl p-3 text-xs flex flex-col gap-1">
          <div className="text-green-400 font-medium">
            {mode === "shield" ? "✅ Shielded" : "✅ Unshielded"} successfully
          </div>
          <a
            href={`https://testnet.arcscan.app/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 break-all hover:underline"
          >
            {txHash.slice(0, 20)}...{txHash.slice(-10)}
          </a>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={mode === "shield" ? handleShield : handleUnshield}
        disabled={loading || !isConnected}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition rounded-xl py-3 text-sm font-medium text-white"
      >
        {loading ? "Processing..." : mode === "shield" ? "🛡️ Shield funds" : "🔓 Unshield funds"}
      </button>

      {/* Tips */}
      {isConnected && (
        <div className="text-xs text-gray-500 text-center">
          ⚡ Gas fee paid in USDC. Make sure you have enough balance.
        </div>
      )}
    </div>
  );
}