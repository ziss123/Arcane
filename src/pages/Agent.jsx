import { useState, useRef, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { useWallet } from "../context/WalletContext";
import { askGemini } from "../services/geminiAgent";
import {
  executeSwap, executeSend, executeShield,
  executeBridge, executeSwitchChain,
} from "../services/evmActions";

const QUICK_CMDS = [
  { label: "💰 Balance", text: "What's my balance?" },
  { label: "🔄 Swap", text: "Swap 1 USDC to EURC" },
  { label: "📤 Send", text: "Send 1 USDC to 0x..." },
  { label: "🛡️ Shield", text: "Shield 1 USDC" },
  { label: "🌉 Bridge", text: "Bridge 1 USDC to Base Sepolia" },
  { label: "🔗 Switch", text: "Switch to Ethereum Sepolia" },
  { label: "❓ Help", text: "What can you do?" },
];

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">
          🤖
        </div>
      )}
      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? "bg-blue-600 text-white rounded-br-sm"
          : msg.status === "error"
          ? "bg-red-500/10 border border-red-500/30 text-red-300 rounded-bl-sm"
          : msg.status === "success"
          ? "bg-green-500/10 border border-green-500/30 text-green-200 rounded-bl-sm"
          : "bg-[#262626] text-gray-200 rounded-bl-sm"
      }`}>
        <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
        {msg.txHash && (
          <a
            href={`https://testnet.arcscan.app/tx/${msg.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 mt-1 block hover:underline"
          >
            View TX ↗
          </a>
        )}
        <div className="text-xs opacity-40 mt-1">{msg.time}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs mr-2 flex-shrink-0">🤖</div>
      <div className="bg-[#262626] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          {[0, 150, 300].map((delay) => (
            <div key={delay} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Agent() {
  const { showToast } = useToast();
  const { connected, address, sendTransaction, tokenBalances, fetchAllBalances, currentChain, switchChain } = useWallet();

  const [messages, setMessages] = useState([{
    role: "agent",
    text: "👋 Hi! I'm Arcane Agent, powered by Gemini AI.\n\nI can help you:\n• 🔄 Swap tokens (USDC, EURC, cirBTC)\n• 📤 Send USDC to any address\n• 🛡️ Shield funds privately\n• 🌉 Bridge to other chains\n• 🔗 Switch EVM networks\n\nJust chat naturally — I'll understand!",
    time: new Date().toLocaleTimeString(),
    status: "info",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addMsg = (role, text, extra = {}) => {
    setMessages(prev => [...prev, {
      role, text,
      time: new Date().toLocaleTimeString(),
      ...extra,
    }]);
  };

  const executeAction = async (action) => {
    const { action: type, params } = action;
    try {
      if (type === "swap") {
        addMsg("agent", `🔄 Swapping ${params.amount} ${params.from} → ${params.to}...\nStep 1/2: Approving token...`);
        const hash = await executeSwap({ ...params, sendTransaction, address });
        addMsg("agent", `✅ Swap complete!\n${params.amount} ${params.from} → ${params.to}`, { status: "success", txHash: hash });
        fetchAllBalances(address);

      } else if (type === "send") {
        addMsg("agent", `📤 Sending ${params.amount} ${params.token} to ${params.address?.slice(0, 10)}...`);
        const hash = await executeSend({ ...params, sendTransaction });
        addMsg("agent", `✅ Sent ${params.amount} ${params.token}!`, { status: "success", txHash: hash });
        fetchAllBalances(address);

      } else if (type === "shield") {
        addMsg("agent", `🛡️ Shielding ${params.amount} ${params.token}...\nStep 1/2: Approving...`);
        const hash = await executeShield({ ...params, sendTransaction });
        addMsg("agent", `✅ ${params.amount} ${params.token} shielded!`, { status: "success", txHash: hash });
        fetchAllBalances(address);

      } else if (type === "bridge") {
        addMsg("agent", `🌉 Bridging ${params.amount} ${params.token} to ${params.chain} via CCTP...`);
        await executeBridge(params);
        addMsg("agent", `✅ Bridge initiated! Check Circle CCTP for status.`, { status: "success" });

      } else if (type === "switch_chain") {
        addMsg("agent", `🔗 Switching to ${params.chain}...`);
        await executeSwitchChain({ chain: params.chain, switchChain });
        addMsg("agent", `✅ Switched to ${params.chain}!`, { status: "success" });

      } else if (type === "balance") {
        const lines = connected
          ? Object.entries(tokenBalances).map(([s, b]) => `• ${s}: ${b || "0.00"}`).join("\n")
          : "Not connected";
        addMsg("agent", `💰 Your balances on ${currentChain?.name || "Arc Testnet"}:\n\n${lines}`, { status: "success" });
      }
    } catch (err) {
      addMsg("agent", `❌ Failed: ${err.message}`, { status: "error" });
    }
  };

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput("");

    addMsg("user", msg.trim());
    setLoading(true);

    try {
      const walletInfo = {
        connected,
        address: address || "not connected",
        chain: currentChain?.name || "Arc Testnet",
        usdc: tokenBalances?.USDC || "0",
        eurc: tokenBalances?.EURC || "0",
      };

      const { text: reply, action } = await askGemini(
        messages.filter(m => m.role !== "system"),
        msg.trim(),
        walletInfo
      );

      addMsg("agent", reply);

      if (action) {
        // Ask for confirmation before executing
        setConfirming(action);
      }
    } catch (err) {
      addMsg("agent", `❌ Error: ${err.message}`, { status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (confirmed) => {
    const action = confirming;
    setConfirming(null);
    if (!confirmed) {
      addMsg("agent", "❌ Action cancelled.");
      return;
    }
    if (!connected) {
      addMsg("agent", "❌ Please connect your wallet first!", { status: "error" });
      return;
    }
    await executeAction(action);
  };

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🤖 Arcane Agent
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-normal">
              Gemini 2.0 Flash
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">AI-powered DeFi · Swap · Send · Bridge · Shield</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs border ${
            connected
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-gray-500/10 border-gray-500/30 text-gray-400"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-gray-500"}`}></div>
            {connected ? `${currentChain?.name || "Arc Testnet"}` : "Not connected"}
          </div>
        </div>
      </div>

      {/* Quick commands */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_CMDS.map((qc) => (
          <button
            key={qc.label}
            onClick={() => handleSend(qc.text)}
            disabled={loading}
            className="text-xs bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            {qc.label}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 overflow-y-auto">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && <TypingIndicator />}

        {/* Confirmation dialog */}
        {confirming && !loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 max-w-sm">
              <div className="text-sm text-yellow-300 mb-3">
                ⚠️ Confirm action:<br/>
                <span className="font-medium text-white">
                  {confirming.action} {confirming.params?.amount} {confirming.params?.from || confirming.params?.token}
                  {confirming.params?.to ? ` → ${confirming.params.to}` : ""}
                  {confirming.params?.address ? ` to ${confirming.params.address?.slice(0,10)}...` : ""}
                  {confirming.params?.chain ? ` on ${confirming.params.chain}` : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirm(true)}
                  className="flex-1 bg-green-600 hover:bg-green-500 transition rounded-lg py-1.5 text-xs font-medium text-white"
                >
                  ✓ Confirm
                </button>
                <button
                  onClick={() => handleConfirm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 transition rounded-lg py-1.5 text-xs font-medium text-gray-300"
                >
                  ✗ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={connected ? 'Ask anything — "swap 5 USDC to EURC"...' : "Connect wallet to start..."}
          disabled={loading}
          className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50 placeholder-gray-600"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition rounded-xl px-5 py-3"
        >
          <i className="ti ti-send text-sm"></i>
        </button>
      </div>
    </div>
  );
}