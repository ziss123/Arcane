import { http, createConfig } from 'wagmi';
import { mainnet, polygon, sepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// 1. Definisikan Arc Testnet
export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
};

// 2. Project ID dari WalletConnect
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'; // GANTI DENGAN MILIK ANDA

// 3. Buat konfigurasi
export const config = getDefaultConfig({
  appName: 'Arcane',
  projectId,
  chains: [arcTestnet, mainnet, polygon, sepolia],
  transports: {
    [arcTestnet.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});