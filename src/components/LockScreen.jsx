import { useState } from "react";
import { useWallet } from "../context/WalletContext";

export default function LockScreen() {
  const { tryUnlock } = useWallet();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleUnlock = () => {
    const ok = tryUnlock(pin);
    if (!ok) {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a] text-gray-100">
      <div className="flex flex-col items-center gap-4 w-72">
        <i className="ti ti-shield-lock text-4xl text-blue-400"></i>
        <div className="text-lg font-semibold">Arc wallet</div>
        <div className="text-sm text-gray-400">Enter your PIN to continue</div>

        <input
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          type="password"
          placeholder="••••"
          autoFocus
          className={`w-full text-center border rounded-md px-3 py-2 text-sm bg-[#1f1f1f] outline-none ${
            error ? "border-red-500" : "border-white/10 focus:border-blue-500"
          }`}
        />

        {error && <div className="text-xs text-red-400">Incorrect PIN</div>}

        <button
          onClick={handleUnlock}
          className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-md py-3 text-sm font-medium"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}