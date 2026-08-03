// Arcane AI Agent — powered by Groq (Llama 3.3 70B)
// Free tier: 14,400 requests/day, 500,000 tokens/day

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const CIRCLE_SKILLS = `
## Circle Skills: use-usdc
- USDC is a stablecoin pegged to USD
- Arc Testnet contract: 0x3600000000000000000000000000000000000000
- Decimals: 6 (1 USDC = 1,000,000 units)
- Functions: transfer(to, amount), approve(spender, amount), balanceOf(address)

## Circle Skills: use-arc
- Arc Testnet Chain ID: 5042002
- RPC: https://arc-testnet.drpc.org
- Explorer: https://testnet.arcscan.app
- Native gas: USDC (not ETH)
- EURC: 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a
- cirBTC: 0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF

## Circle Skills: bridge-stablecoin
- Bridge USDC via Circle CCTP V2
- Supported chains: Ethereum, Base, Polygon, Arc Testnet
- 1:1 USDC, no slippage

## Circle Skills: use-developer-controlled-wallets
- Circle Programmable Wallets API
- Endpoint: https://api.circle.com/v1/w3s
- Supports Arc Testnet natively

## Arcane Smart Contracts
- ShieldPool: 0xF9C6B588E99254dC487D75767283F93f4a6e7Ae2
  - shield(token, amount): deposit tokens privately
  - unshield(token, amount, recipient): withdraw privately
- SimpleSwap: 0x60C669b57A11e41Db84b1A804621BD086262A3D8
  - swap(fromToken, toToken, amount): swap tokens
  - Supported pairs: USDC/EURC, USDC/cirBTC, EURC/cirBTC
`;

const SYSTEM_PROMPT = `You are Arcane Agent, an AI-powered DeFi assistant on Arc Testnet by Arcane Labs.
You have Circle Skills knowledge to help users manage USDC and DeFi operations.

${CIRCLE_SKILLS}

## Your Capabilities:
- Swap tokens: USDC ↔ EURC ↔ cirBTC on Arc Testnet
- Send tokens to any address
- Shield/Unshield funds privately via ShieldPool
- Bridge USDC cross-chain via CCTP V2
- Switch EVM chains
- Check wallet balances
- Explain Circle products and Arc Network

## Response Rules:
- Be concise and friendly
- Always confirm before transactions
- When user wants an action, add a JSON block at the end

## Action JSON Format:
\`\`\`json
{
  "action": "swap|send|bridge|shield|balance|switch_chain|none",
  "params": {
    "amount": "5",
    "from": "USDC",
    "to": "EURC",
    "token": "USDC",
    "address": "0x...",
    "chain": "Base Sepolia"
  }
}
\`\`\`

## Examples:
- "swap 5 USDC to EURC" → action: swap, from: USDC, to: EURC, amount: 5
- "send 1 USDC to 0x123" → action: send, token: USDC, amount: 1, address: 0x123
- "bridge 2 USDC to Base" → action: bridge, token: USDC, amount: 2, chain: Base Sepolia
- "shield 3 USDC" → action: shield, token: USDC, amount: 3
- "balance" → action: balance
- "switch to Ethereum" → action: switch_chain, chain: Ethereum Sepolia`;

export async function askGemini(messages, userMessage, walletInfo) {
  if (!GROQ_API_KEY) {
    return {
      text: "❌ Groq API key not set.\n\nAdd VITE_GROQ_API_KEY to your .env file.\nGet a free key at: console.groq.com",
      action: null,
    };
  }

  // Build conversation history (last 10 messages)
  const history = messages
    .filter((m) => m.text && m.role !== "system")
    .slice(-10)
    .map((m) => ({
      role: m.role === "agent" ? "assistant" : "user",
      content: m.text,
    }));

  // Add wallet context
  const walletCtx = walletInfo.connected
    ? `[Wallet: ${walletInfo.address?.slice(0, 10)}... | Chain: ${walletInfo.chain} | USDC: ${walletInfo.usdc} | EURC: ${walletInfo.eurc}]`
    : "[Wallet: Not connected]";

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: `${userMessage}\n\n${walletCtx}` },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message || "Groq API error";
      if (errMsg.includes("rate") || errMsg.includes("quota")) {
        return {
          text: "⏳ Rate limit reached. Please wait a moment and try again.",
          action: null,
        };
      }
      throw new Error(errMsg);
    }

    const text = data.choices?.[0]?.message?.content || "";

    if (!text) throw new Error("Empty response from Groq");

    // Parse action JSON
    const actionMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    let action = null;
    const cleanText = text.replace(/```json\n?[\s\S]*?\n?```/g, "").trim();

    if (actionMatch) {
      try {
        const parsed = JSON.parse(actionMatch[1]);
        if (parsed.action && parsed.action !== "none") {
          action = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse action JSON:", e);
      }
    }

    return { text: cleanText, action };
  } catch (err) {
    console.error("Groq error:", err);
    return {
      text: `❌ ${err.message}`,
      action: null,
    };
  }
}