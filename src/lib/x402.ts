const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const walletAddress = (process.env.WALLET_ADDRESS ?? ZERO_ADDRESS) as `0x${string}`;

// Warn at startup if wallet address is the zero address
if (walletAddress === ZERO_ADDRESS) {
  console.warn(
    "\n" +
    "========================================================\n" +
    "  WARNING: WALLET_ADDRESS is the zero address!\n" +
    "  All x402 payments will FAIL.\n" +
    "  Set WALLET_ADDRESS in .env.local to your wallet address.\n" +
    "========================================================\n"
  );
}

// Supported x402 V1 network names for EVM chains.
// Set X402_NETWORK env var to "base" for mainnet, "base-sepolia" for testnet.
// This type must be a subset of the x402-next RouteConfig network type.
type X402Network = "base-sepolia" | "base" | "polygon" | "polygon-amoy";

export const x402Config = {
  walletAddress,
  network: (process.env.X402_NETWORK ?? "base-sepolia") as X402Network,
  facilitatorUrl: process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator",
};

/**
 * Build the x402 withX402 route config for a specific skill's buy price.
 * Uses the `$X.XX` string format expected by x402-next's processPriceToAtomicAmount.
 */
export function getSkillBuyConfig(priceBuy: number, skillName: string) {
  return {
    price: `$${priceBuy.toFixed(2)}`,
    network: x402Config.network,
    config: {
      description: `Buy '${skillName}' — full source access`,
    },
  };
}

/**
 * Build the x402 withX402 route config for a specific skill's rent price.
 */
export function getSkillRentConfig(priceRent: number, skillName: string) {
  return {
    price: `$${priceRent.toFixed(2)}`,
    network: x402Config.network,
    config: {
      description: `Rent '${skillName}' — single blind inference`,
    },
  };
}
