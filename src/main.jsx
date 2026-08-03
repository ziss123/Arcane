import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./App.jsx";
import "./index.css";

const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
  rpcUrls: {
    default: { http: ["https://arc-testnet.drpc.org"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PrivyProvider
      appId="cmqp7al6000000bia5h25r03x"
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6",
          logo: null,
          walletChainType: "ethereum-only",
        },
        loginMethods: ["wallet", "email", "google"],
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
        embeddedWallets: {
          createOnLogin: "all-users",
          requireUserPasswordOnCreate: false,
        },
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>
);