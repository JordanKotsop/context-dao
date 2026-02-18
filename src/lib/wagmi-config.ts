import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, base } from "wagmi/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "ContextDAO",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "demo",
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});
