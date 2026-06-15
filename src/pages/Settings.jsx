import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";

export default function Settings() {
  const {
    panicPin, setPanicPin,
    unlockPin, setUnlockPin,
    panicked, setPanicked,
    setLocked,
  } = useWallet();
  const { showToast } = useToast();

  const [autoLock, setAutoLock] = useState(true);
  const [panicEnabled, setPanicEnabled] = useState(false);
  const [panicPinInput, setPanicPinInput] = useState("");
  const [unlockPinInput, setUnlockPinInput] = useState("");

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={onChange}
      className={`w-10 h-6 rounded-full relative transition ${value ? "bg-blue-600" : "bg-[#3a3a3a]"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${value ? "translate-x-4" : ""}`}
      />
    </button>
  );

  const savePanicPin = () => {
    if (panicPinInput.length < 4) {
      showToast("PIN must be at least 4 digits", "error");
      return;
    }
    setPanicPin(panicPinInput);
    showToast("Panic PIN saved");
    setPanicPinInput("");
  };

  const saveUnlockPin = () => {
    if (unlockPinInput.length < 4) {
      showToast("PIN must be at least 4 digits", "error");
      return;
    }
    setUnlockPin(unlockPinInput);
    showToast("Unlock PIN saved");
    setUnlockPinInput("");
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-md">
      <h1 className="font-semibold text-lg">Settings</h1>

      {panicked && (
        <div className="bg-[#262626] border border-yellow-500/30 rounded-md p-3 flex items-center justify-between text-sm">
          <span className="text-yellow-400 flex items-center gap-2">
            <i className="ti ti-alert-triangle"></i> Panic mode active — showing empty wallet
          </span>
          <button onClick={() => setPanicked(false)} className="text-xs text-blue-400">
            Exit
          </button>
        </div>
      )}

      <div className="bg-[#262626] rounded-md p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-100">Auto-lock</div>
          <div className="text-xs text-gray-500">Automatically lock the wallet after 5 minutes of inactivity</div>
        </div>
        <Toggle value={autoLock} onChange={() => setAutoLock(!autoLock)} />
      </div>

      <div className="bg-[#262626] rounded-md p-4 flex flex-col gap-3">
        <div className="text-sm font-medium text-gray-100">Unlock PIN</div>
        <div className="text-xs text-gray-500">Set a PIN to lock your wallet. Leave empty to allow any PIN to unlock.</div>
        <div className="flex gap-2">
          <input
            value={unlockPinInput}
            onChange={(e) => setUnlockPinInput(e.target.value)}
            type="password"
            placeholder="Set unlock PIN"
            className="border border-white/10 rounded-md px-3 py-2 text-sm bg-[#1f1f1f] outline-none focus:border-blue-500 flex-1"
          />
          <button
            onClick={saveUnlockPin}
            className="bg-blue-600 hover:bg-blue-500 transition rounded-md px-4 text-sm font-medium"
          >
            Save
          </button>
        </div>
        {unlockPin && (
          <button
            onClick={() => setLocked(true)}
            className="bg-[#1f1f1f] hover:bg-[#2a2a2a] transition rounded-md py-2 text-sm font-medium flex items-center justify-center gap-2 border border-white/10"
          >
            <i className="ti ti-lock"></i> Lock wallet now
          </button>
        )}
      </div>

      <div className="bg-[#262626] rounded-md p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-100">Panic mode</div>
            <div className="text-xs text-gray-500">Set an emergency PIN that opens an empty wallet</div>
          </div>
          <Toggle value={panicEnabled} onChange={() => setPanicEnabled(!panicEnabled)} />
        </div>

        {panicEnabled && (
          <div className="flex gap-2">
            <input
              value={panicPinInput}
              onChange={(e) => setPanicPinInput(e.target.value)}
              type="password"
              placeholder="Set panic PIN"
              className="border border-white/10 rounded-md px-3 py-2 text-sm bg-[#1f1f1f] outline-none focus:border-blue-500 flex-1"
            />
            <button
              onClick={savePanicPin}
              className="bg-blue-600 hover:bg-blue-500 transition rounded-md px-4 text-sm font-medium"
            >
              Save
            </button>
          </div>
        )}
        {panicPin && (
          <div className="text-xs text-gray-500">Panic PIN is set. Enter it on the lock screen to trigger panic mode.</div>
        )}
      </div>

      <div className="bg-[#262626] rounded-md p-4">
        <div className="text-sm font-medium text-gray-100 mb-1">About</div>
        <div className="text-xs text-gray-500">Arc Privacy Wallet v0.1 (mockup) — open-source contract, not yet audited</div>
      </div>
    </div>
  );
}