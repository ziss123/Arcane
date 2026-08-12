import { useState, useRef, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { useWallet } from "../context/WalletContext";
import { askGemini } from "../services/geminiAgent";
import {
  executeSwap, executeSend, executeShield,
  executeBridge, executeSwitchChain,
} from "../services/evmActions";

const QUICK_CMDS = [
  { label: "Balance", icon: "ti-wallet", text: "What's my balance?" },
  { label: "Swap", icon: "ti-arrows-exchange", text: "Swap 1 USDC to EURC" },
  { label: "Send", icon: "ti-send", text: "Send 1 USDC to 0x..." },
  { label: "Shield", icon: "ti-shield", text: "Shield 1 USDC" },
  { label: "Bridge", icon: "ti-arrows-transfer-up", text: "Bridge 1 USDC to Base Sepolia" },
  { label: "Help", icon: "ti-help", text: "What can you do?" },
];

function Avatar({ isUser }) {
  return isUser ? null : (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
      <i className="ti ti-robot text-white text-sm"></i>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && <Avatar />}
      <div className="flex flex-col gap-1 max-w-[75%]">
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : msg.status === "error"
            ? "bg-[#1f1111] border border-red-500/20 text-red-300 rounded-tl-sm"
            : msg.status === "success"
            ? "bg-[#111f13] border border-green-500/20 text-green-200 rounded-tl-sm"
            : "bg-[#1e1e1e] border border-white/5 text-gray-200 rounded-tl-sm"
        }`}>
          <div className="whitespace-pre-wrap">{msg.text}</div>
          {msg.txHash && (
            <a
              href={`https://testnet.arcscan.app/tx/${msg.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 mt-2 hover:text-blue-300 transition"
            >
              <i className="ti ti-external-link text-xs"></i>
              View on ArcScan
            </a>
          )}
        </div>
        <span className={`text-xs text-gray-600 px-1 ${isUser ? "text-right" : "text-left"}`}>
          {msg.time}
        </span>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <i className="ti ti-user text-gray-400 text-sm"></i>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start mb-4">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
        <i className="ti ti-robot text-white text-sm"></i>
      </div>
      <div className="bg-[#1e1e1e] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmCard({ confirming, onConfirm }) {
  const { action, params } = confirming;
  const actionLabels = {
    swap: { icon: "ti-arrows-exchange", color: "text-blue-400", label: "Swap" },
    send: { icon: "ti-send", color: "text-green-400", label: "Send" },
    shield: { icon: "ti-shield", color: "text-purple-400", label: "Shield" },
    bridge: { icon: "ti-arrows-transfer-up", color: "text-orange-400", label: "Bridge" },
    switch_chain: { icon: "ti-world", color: "text-cyan-400", label: "Switch Chain" },
    balance: { icon: "ti-wallet", color: "text-yellow-400", label: "Check Balance" },
  };
  const meta = actionLabels[action] || { icon: "ti-bolt", color: "text-white", label: action };

  return (
    <div className="flex gap-3 justify-start mb-4">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <i className="ti ti-robot text-white text-sm"></i>
      </div>
      <div className="bg-[#1a1600] border border-yellow-500/20 rounded-2xl rounded-tl-sm px-4 py-4 max-w-xs">
        <div className="flex items-center gap-2 mb-3">
          <i className={`ti ${meta.icon} ${meta.color} text-base`}></i>
          <span className="text-sm font-medium text-white">{meta.label}</span>
        </div>
        <div className="bg-black/20 rounded-xl px-3 py-2 mb-3 text-xs text-gray-300 space-y-1">
          {params?.amount && <div><span className="text-gray-500">Amount:</span> <span className="text-white font-medium">{params.amount} {params.from || params.token}</span></div>}
          {params?.to && params.to !== params?.from && <div><span className="text-gray-500">To token:</span> <span className="text-white font-medium">{params.to}</span></div>}
          {params?.address && <div><span className="text-gray-500">Address:</span> <span className="text-white font-medium">{params.address?.slice(0,12)}...</span></div>}
          {params?.chain && <div><span className="text-gray-500">Chain:</span> <span className="text-white font-medium">{params.chain}</span></div>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 transition rounded-lg py-2 text-xs font-medium text-white flex items-center justify-center gap-1"
          >
            <i className="ti ti-check text-xs"></i> Confirm
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 transition rounded-lg py-2 text-xs font-medium text-gray-400 flex items-center justify-center gap-1"
          >
            <i className="ti ti-x text-xs"></i> Cancel
          </button>
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
    text: "Hello! I'm Arcane Agent, your AI-powered DeFi assistant.\n\nI can help you swap tokens, send USDC, shield funds privately, and bridge across chains — all through natural conversation.\n\nConnect your wallet and tell me what you'd like to do.",
    time: new Date().toLocaleTimeString(),
    status: "info",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, confirming]);

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
        addMsg("agent", `Swapping ${params.amount} ${params.from} → ${params.to}...`);
        const hash = await executeSwap({ ...params, sendTransaction, address });
        addMsg("agent", `Swap complete. ${params.amount} ${params.from} → ${params.to}`, { status: "success", txHash: hash });
        fetchAllBalances(address);
      } else if (type === "send") {
        addMsg("agent", `Sending ${params.amount} ${params.token}...`);
        const hash = await executeSend({ ...params, sendTransaction });
        addMsg("agent", `Sent ${params.amount} ${params.token} successfully.`, { status: "success", txHash: hash });
        fetchAllBalances(address);
      } else if (type === "shield") {
        addMsg("agent", `Shielding ${params.amount} ${params.token}...`);
        const hash = await executeShield({ ...params, sendTransaction });
        addMsg("agent", `${params.amount} ${params.token} is now shielded.`, { status: "success", txHash: hash });
        fetchAllBalances(address);
      } else if (type === "bridge") {
        addMsg("agent", `Initiating bridge to ${params.chain} via CCTP...`);
        await executeBridge(params);
        addMsg("agent", `Bridge initiated. Monitor at circle.com/cctp.`, { status: "success" });
      } else if (type === "switch_chain") {
        addMsg("agent", `Switching to ${params.chain}...`);
        await executeSwitchChain({ chain: params.chain, switchChain });
        addMsg("agent", `Switched to ${params.chain}.`, { status: "success" });
      } else if (type === "balance") {
        const lines = connected
          ? Object.entries(tokenBalances).map(([s, b]) => `${s}  ${b || "0.00"}`).join("\n")
          : "Wallet not connected.";
        addMsg("agent", `Balances on ${currentChain?.name || "Arc Testnet"}:\n\n${lines}`, { status: "success" });
      }
    } catch (err) {
      addMsg("agent", `Transaction failed: ${err.message}`, { status: "error" });
    }
  };

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    addMsg("user", msg);
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
        msg,
        walletInfo
      );
      addMsg("agent", reply);
      if (action) setConfirming(action);
    } catch (err) {
      addMsg("agent", `Error: ${err.message}`, { status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (confirmed) => {
    const action = confirming;
    setConfirming(null);
    if (!confirmed) { addMsg("agent", "Action cancelled."); return; }
    if (!connected) { addMsg("agent", "Please connect your wallet first.", { status: "error" }); return; }
    await executeAction(action);
  };

  return (
    <div className="flex gap-6" style={{ height: "calc(100vh - 120px)" }}>

      {/* Sidebar info */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        {/* Agent info */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <i className="ti ti-robot text-white text-lg"></i>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Arcane Agent</div>
              
            </div>
          </div>
          <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
            connected ? "bg-green-500/10 text-green-400" : "bg-white/5 text-gray-500"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`}></div>
            {connected ? currentChain?.name || "Arc Testnet" : "Wallet not connected"}
          </div>
        </div>

        {/* Balances */}
        {connected && (
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Balances</div>
            <div className="flex flex-col gap-2">
              {Object.entries(tokenBalances || {}).map(([symbol, bal]) => (
                <div key={symbol} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{symbol}</span>
                  <span className="text-xs font-medium text-white">{bal || "0.00"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Quick Actions</div>
          <div className="flex flex-col gap-1.5">
            {QUICK_CMDS.map((qc) => (
              <button
                key={qc.label}
                onClick={() => handleSend(qc.text)}
                disabled={loading}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition disabled:opacity-40 text-left"
              >
                <i className={`ti ${qc.icon} text-sm w-4`}></i>
                {qc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider"></div>
          <div className="flex flex-col gap-2">
            {[
              
            ].map((item) => (
              <div key={item.label} className="text-xs">
                <div className="text-gray-300">{item.label}</div>
                <div className="text-gray-600">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Chat messages */}
        <div className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-2xl px-6 py-5 overflow-y-auto">
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {loading && <TypingIndicator />}
          {confirming && !loading && (
            <ConfirmCard confirming={confirming} onConfirm={handleConfirm} />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={connected ? 'Message Arcane Agent...' : "Connect your wallet to start..."}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <i className="ti ti-send text-sm text-white"></i>
          </button>
        </div>
      </div>
    </div>
  );
}