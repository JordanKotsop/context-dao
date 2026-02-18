export const x402Config = {
  walletAddress: (process.env.WALLET_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  network: (process.env.X402_NETWORK ?? "base-sepolia") as "base-sepolia",
  facilitatorUrl: process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator",
};

export function getSkillPaymentConfig(priceBuy: number, priceRent: number) {
  return {
    buy: {
      price: `$${priceBuy.toFixed(2)}`,
      network: x402Config.network,
      config: {
        description: "Buy: Full source access to this cognitive asset",
      },
    },
    rent: {
      price: `$${priceRent.toFixed(2)}`,
      network: x402Config.network,
      config: {
        description: "Rent: Single blind inference call",
      },
    },
  };
}
