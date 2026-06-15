import { useState } from "react";

export default function Verify() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    if (!hash) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setLoading(false);
      // dummy: even-length hash = valid, odd-length = invalid
      setResult(hash.trim().length % 2 === 0 ? "valid" : "invalid");
    }, 1200);
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-md">
      <h1 className="font-semibold text-lg">Proof verifier</h1>
      <p className="text-xs text-gray-500">
        Check the validity of a zk-proof or transaction hash independently.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">Proof hash / transaction ID</label>
        <input
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="0x..."
          className="border border-white/10 rounded-md px-3 py-2 text-sm bg-[#1f1f1f] outline-none focus:border-blue-500"
        />
      </div>

      <button
        onClick={handleVerify}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 transition rounded-md py-3 text-sm font-medium flex items-center justify-center gap-2"
      >
        <i className="ti ti-shield-check"></i> {loading ? "Verifying..." : "Verify proof"}
      </button>

      {result === "valid" && (
        <div className="bg-[#262626] border border-green-500/30 rounded-md p-4 flex items-center gap-3">
          <i className="ti ti-circle-check text-green-400 text-2xl"></i>
          <div>
            <div className="text-sm font-medium text-green-400">Proof is valid</div>
            <div className="text-xs text-gray-500">This transaction was verified successfully.</div>
          </div>
        </div>
      )}

      {result === "invalid" && (
        <div className="bg-[#262626] border border-red-500/30 rounded-md p-4 flex items-center gap-3">
          <i className="ti ti-alert-circle text-red-400 text-2xl"></i>
          <div>
            <div className="text-sm font-medium text-red-400">Proof is invalid</div>
            <div className="text-xs text-gray-500">Could not verify this transaction.</div>
          </div>
        </div>
      )}
    </div>
  );
}