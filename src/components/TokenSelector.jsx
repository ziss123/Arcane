export const tokens = [
  
  { symbol: "USDC", color: "bg-blue-600", char: "$" },
  { symbol: "EURC", color: "bg-blue-700", char: "€" },
  { symbol: "cirBTC", color: "bg-gradient-to-br from-purple-500 to-blue-400", char: "₿" },
];

export default function TokenSelector({ selected, onChange }) {
  return (
    <div>
      <span className="text-xs text-gray-400 mb-2 block">Token</span>
      <div className="grid grid-cols-4 gap-2">
        {tokens.map((t) => (
          <button
            key={t.symbol}
            onClick={() => onChange(t)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition ${
              selected.symbol === t.symbol
                ? "border-blue-500 bg-[#262626]"
                : "border-white/10 bg-[#1f1f1f] hover:bg-[#262626]"
            }`}
          >
            <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-sm text-white font-semibold`}>
              {t.char}
            </div>
            <span className="text-xs font-medium">{t.symbol}</span>
          </button>
        ))}
      </div>
    </div>
  );
}