import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";

const BACKEND_URL = "https://arcane-backend-production-d50f.up.railway.app";

export default function Vault() {
  const { showToast } = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/vault/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      showToast("Gagal mengambil status vault", "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerVault = async () => {
    try {
      setTriggering(true);
      const res = await fetch(`${BACKEND_URL}/vault/trigger`);
      const data = await res.json();
      if (data.result?.triggered) {
        showToast(`✅ Auto-vault berhasil! ${data.result.transferred} USDC dipindah ke vault`, "success");
      } else {
        showToast(`Balance is still below the limit (${data.result?.limit} USDC)`, "error");
      }
      fetchStatus();
    } catch (err) {
      showToast("Gagal trigger vault", "error");
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Auto Vault</h1>
        <p className="text-gray-400 text-sm">
          USDC exceeding the limit will be automatically moved to the vault
        </p>
      </div>

      {/* Status Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat status...</div>
      ) : status ? (
        <>
          {/* Limit Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Auto Vault Aktif</span>
            <span className="text-gray-500 text-sm ml-auto">
              Limit: <span className="text-white font-medium">{status.limit} USDC</span>
            </span>
          </div>

          {/* Wallet Cards */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {/* Main Wallet */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-sm">M</span>
                  </div>
                  <span className="text-gray-400 text-sm">Main Wallet</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  status.mainWallet.balance > status.limit
                    ? "bg-red-500/20 text-red-400"
                    : "bg-green-500/20 text-green-400"
                }`}>
                  {status.mainWallet.balance > status.limit ? "Melebihi Limit" : "Normal"}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {status.mainWallet.balance.toFixed(4)}
                <span className="text-gray-500 text-base font-normal ml-2">USDC</span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min((status.mainWallet.balance / status.limit) * 100, 100)}%`,
                    background: status.mainWallet.balance > status.limit ? '#ef4444' : '#3b82f6'
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-600">0</span>
                <span className="text-xs text-gray-600">Limit: {status.limit} USDC</span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-px h-4 bg-gray-700" />
                <span className="text-gray-500 text-xs">kelebihan otomatis</span>
                <div className="text-gray-400">↓</div>
                <div className="w-px h-4 bg-gray-700" />
              </div>
            </div>

            {/* Vault Wallet */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 text-sm">V</span>
                </div>
                <span className="text-gray-400 text-sm">Vault Wallet</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {status.vaultWallet.balance.toFixed(4)}
                <span className="text-gray-500 text-base font-normal ml-2">USDC</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">Tabungan otomatis dari kelebihan USDC</p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6 flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total USDC</span>
            <span className="text-white font-bold">
              {(status.mainWallet.balance + status.vaultWallet.balance).toFixed(4)} USDC
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={fetchStatus}
              className="flex-1 py-3 rounded-xl border border-[#2a2a2a] text-gray-400 text-sm hover:border-gray-600 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={triggerVault}
              disabled={triggering}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {triggering ? "Memproses..." : "Trigger Manual"}
            </button>
          </div>

          {/* Info */}
          <p className="text-center text-xs text-gray-600 mt-4">
            Vault otomatis aktif via Circle Webhook · Arc Testnet
          </p>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">Gagal memuat data</div>
      )}
    </div>
  );
}