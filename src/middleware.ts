import { paymentMiddleware } from "x402-next";
import { getAllSkills } from "@/lib/skills";

const walletAddress = (process.env.WALLET_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
const network = (process.env.X402_NETWORK ?? "base-sepolia") as "base-sepolia";

// Build dynamic route configs from registered skills
function buildRouteConfigs() {
  const skills = getAllSkills();
  const routes: Record<
    string,
    { price: string; network: typeof network; config: { description: string } }
  > = {};

  for (const skill of skills) {
    routes[`GET /api/skills/${skill.slug}/buy`] = {
      price: `$${skill.metadata.price_buy.toFixed(2)}`,
      network,
      config: {
        description: `Buy '${skill.metadata.name}' — full source access`,
      },
    };
    routes[`POST /api/skills/${skill.slug}/rent`] = {
      price: `$${skill.metadata.price_rent.toFixed(2)}`,
      network,
      config: {
        description: `Rent '${skill.metadata.name}' — single blind inference`,
      },
    };
  }

  return routes;
}

export const middleware = paymentMiddleware(
  walletAddress,
  buildRouteConfigs()
);

export const config = {
  matcher: ["/api/skills/:slug/buy", "/api/skills/:slug/rent"],
  runtime: "nodejs",
};
