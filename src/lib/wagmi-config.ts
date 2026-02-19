import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  coinbaseWallet,
  metaMaskWallet,
  phantomWallet,
  rabbyWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { baseSepolia, base } from "wagmi/chains";
import { http, fallback } from "wagmi";

// WalletConnect Cloud projectId. When set to a real ID (from https://cloud.walletconnect.com),
// WalletConnect-based wallets (mobile QR, Rainbow, etc.) will work. When not set, we only
// offer browser-extension wallets (MetaMask, Coinbase, Rabby, Phantom, etc.) which do NOT
// require a projectId and won't make any WalletConnect API calls.
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "";

const hasWalletConnectId =
  walletConnectProjectId.length > 0 && walletConnectProjectId !== "demo";

// Custom RPC URL for Base mainnet. The default public RPC (mainnet.base.org) is
// heavily rate-limited (429 errors). Set NEXT_PUBLIC_BASE_RPC_URL to a dedicated
// provider (e.g., Alchemy, QuickNode, Infura) for reliable mainnet operation.
const baseMainnetRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;

export const wagmiConfig = getDefaultConfig({
  appName: "ContextDAO",
  // RainbowKit requires projectId as a string even if unused. Pass the env var
  // or a placeholder; only wallets that use WalletConnect will actually call the API.
  projectId: hasWalletConnectId ? walletConnectProjectId : "no-wc-configured",
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    // Use a dedicated RPC if configured, with public RPC as fallback.
    // The default mainnet.base.org is heavily rate-limited and returns 429.
    [base.id]: baseMainnetRpcUrl
      ? fallback([http(baseMainnetRpcUrl), http()])
      : http(),
  },
  ssr: true,
  // When no real WalletConnect projectId is configured, restrict to browser-extension
  // wallets only. This avoids 403 errors from WalletConnect/Reown APIs.
  // When a real projectId IS configured, use the default wallet list (includes WC).
  ...(hasWalletConnectId
    ? {}
    : {
        wallets: [
          {
            groupName: "Installed",
            wallets: [
              injectedWallet,
              metaMaskWallet,
              coinbaseWallet,
              phantomWallet,
              rabbyWallet,
            ],
          },
        ],
      }),
});
