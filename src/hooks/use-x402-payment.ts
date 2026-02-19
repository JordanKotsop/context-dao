"use client";

import { useState, useCallback } from "react";
import { useWalletClient, useSwitchChain } from "wagmi";
import { getWalletClient as getWalletClientAction } from "wagmi/actions";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { ExactEvmSchemeV1, EVM_NETWORK_CHAIN_ID_MAP } from "@x402/evm/v1";
import type { WalletClient } from "viem";
import { wagmiConfig } from "@/lib/wagmi-config";

/**
 * Adapts a wagmi WalletClient to the x402 ClientEvmSigner interface.
 *
 * After chain switching, fetches a FRESH walletClient via wagmi's imperative
 * getWalletClient action to avoid stale closures where the old client still
 * references the previous chain.
 */
function toX402Signer(
  walletClient: WalletClient,
  switchChainAsync: ((args: { chainId: number }) => Promise<unknown>) | undefined
) {
  return {
    address: walletClient.account!.address,
    signTypedData: async (message: {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    }) => {
      const domainChainId = message.domain?.chainId
        ? Number(message.domain.chainId)
        : undefined;

      // Use the current client by default; replace with fresh one after switching
      let signingClient = walletClient;

      if (domainChainId && walletClient.chain?.id !== domainChainId) {
        if (!switchChainAsync) {
          throw new Error(
            `Wallet is on chain ${walletClient.chain?.id} but payment requires chain ${domainChainId}. ` +
            `Please switch to the correct network in your wallet.`
          );
        }
        try {
          await switchChainAsync({ chainId: domainChainId });
          // Get a FRESH wallet client after chain switch.
          // The hook-based walletClient is stale at this point (React hasn't
          // re-rendered), so we use wagmi's imperative action instead.
          signingClient = await getWalletClientAction(wagmiConfig, {
            chainId: domainChainId,
          });
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          throw new Error(
            `Failed to switch to chain ${domainChainId}: ${reason}. ` +
            `Please switch networks manually in your wallet.`
          );
        }
      }

      return signingClient.signTypedData({
        account: signingClient.account!,
        domain: message.domain as Parameters<typeof signingClient.signTypedData>[0]["domain"],
        types: message.types as Parameters<typeof signingClient.signTypedData>[0]["types"],
        primaryType: message.primaryType,
        message: message.message,
      });
    },
  };
}

export type PaymentStatus =
  | "idle"
  | "awaiting_signature"
  | "processing"
  | "success"
  | "error";

interface PaymentResult<T = unknown> {
  data: T | null;
  status: PaymentStatus;
  error: string | null;
}

export function useX402Payment() {
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback(
    async <T = unknown>(
      url: string,
      options?: RequestInit
    ): Promise<PaymentResult<T>> => {
      if (!walletClient) {
        setError("Wallet not connected");
        setStatus("error");
        return { data: null, status: "error", error: "Wallet not connected" };
      }

      setStatus("awaiting_signature");
      setError(null);

      try {
        // Create signer and fetch wrapper fresh each call to avoid stale closures
        const signer = toX402Signer(walletClient, switchChainAsync);

        const v1Schemes = Object.keys(EVM_NETWORK_CHAIN_ID_MAP).map(
          (networkName) => ({
            network: networkName as `${string}:${string}`,
            client: new ExactEvmSchemeV1(signer),
            x402Version: 1 as const,
          })
        );

        const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
          schemes: [
            { network: "eip155:*", client: new ExactEvmScheme(signer) },
            ...v1Schemes,
          ],
        });

        const response = await fetchWithPayment(url, options);

        setStatus("processing");

        if (!response.ok) {
          const errBody = await response.json().catch(() => null);
          const msg =
            errBody?.error ?? `Payment failed (${response.status})`;
          setError(msg);
          setStatus("error");
          return { data: null, status: "error", error: msg };
        }

        const data = (await response.json()) as T;
        setStatus("success");
        return { data, status: "success", error: null };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Payment failed";

        const isRejection =
          msg.includes("rejected") ||
          msg.includes("denied") ||
          msg.includes("cancelled") ||
          msg.includes("User rejected");
        const isInsufficientFunds =
          msg.includes("insufficient_funds") ||
          msg.includes("Insufficient funds");
        const isChainMismatch =
          msg.includes("chainId should be same as current chainId") ||
          msg.includes("Failed to switch to chain");
        // The x402.org facilitator only supports testnet networks.
        // When payments are attempted on mainnet (e.g., "base"), the facilitator
        // returns "unexpected_verify_error" / "unexpected_error" because it cannot
        // verify transactions on chains it does not support.
        const isFacilitatorUnsupported =
          msg.includes("unexpected_error") ||
          msg.includes("unexpected_verify_error") ||
          msg.includes("unexpected_settle_error");

        let friendlyMsg: string;
        if (isRejection) {
          friendlyMsg = "Transaction was rejected in wallet";
        } else if (isInsufficientFunds) {
          friendlyMsg = "Insufficient USDC balance. Get testnet USDC at faucet.circle.com";
        } else if (isChainMismatch) {
          friendlyMsg = "Wrong network. Please switch to Base Sepolia in your wallet and try again.";
        } else if (isFacilitatorUnsupported) {
          friendlyMsg =
            "Payment verification failed: the facilitator does not support this network. " +
            "The default x402.org facilitator only supports testnet (Base Sepolia). " +
            "A mainnet-compatible facilitator is required for Base mainnet payments.";
        } else {
          friendlyMsg = msg;
        }

        setError(friendlyMsg);
        setStatus("error");
        return { data: null, status: "error", error: friendlyMsg };
      }
    },
    [walletClient, switchChainAsync]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { pay, status, error, reset, isConnected: !!walletClient };
}
