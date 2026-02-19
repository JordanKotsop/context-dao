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
// Set X402_NETWORK env var to "base-sepolia" for testnet (default).
//
// IMPORTANT: The default x402.org facilitator only supports TESTNET networks
// (base-sepolia, solana-devnet). Mainnet networks like "base", "polygon", etc.
// require a self-hosted facilitator or a facilitator that supports mainnet.
// See: https://x402.org/facilitator/supported
type X402Network = "base-sepolia" | "base" | "polygon" | "polygon-amoy";

// Networks supported by the default x402.org facilitator (V1 protocol).
// Queried from https://x402.org/facilitator/supported on 2026-02-19.
const DEFAULT_FACILITATOR_SUPPORTED_NETWORKS = [
  "base-sepolia",
  "solana-devnet",
];

const network = (process.env.X402_NETWORK ?? "base-sepolia") as X402Network;
const facilitatorUrl =
  process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator";

// Warn at startup if using the default facilitator with an unsupported mainnet network
if (
  facilitatorUrl === "https://x402.org/facilitator" &&
  !DEFAULT_FACILITATOR_SUPPORTED_NETWORKS.includes(network)
) {
  console.error(
    "\n" +
      "========================================================\n" +
      `  ERROR: X402_NETWORK="${network}" is NOT supported by the\n` +
      "  default x402.org facilitator!\n" +
      "  \n" +
      "  The x402.org facilitator only supports testnet networks:\n" +
      `  ${DEFAULT_FACILITATOR_SUPPORTED_NETWORKS.join(", ")}\n` +
      "  \n" +
      "  All payment verifications will FAIL with 'unexpected_error'.\n" +
      "  \n" +
      "  To fix, either:\n" +
      '  1. Set X402_NETWORK=base-sepolia for testnet payments\n' +
      "  2. Set X402_FACILITATOR_URL to a facilitator that supports\n" +
      `     the "${network}" network (e.g., self-hosted facilitator)\n` +
      "========================================================\n"
  );
}

export const x402Config = {
  walletAddress,
  network,
  facilitatorUrl,
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
