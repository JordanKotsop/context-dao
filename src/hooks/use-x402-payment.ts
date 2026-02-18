"use client";

import { useState, useCallback, useMemo } from "react";
import { useWalletClient, useSwitchChain } from "wagmi";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { ExactEvmSchemeV1, EVM_NETWORK_CHAIN_ID_MAP } from "@x402/evm/v1";
import type { WalletClient } from "viem";

// Map of V1 network names to chain IDs, used for auto-switching
type EvmNetworkV1 = keyof typeof EVM_NETWORK_CHAIN_ID_MAP;

/**
 * Adapts a wagmi WalletClient to the x402 ClientEvmSigner interface.
 * wagmi puts address on walletClient.account.address, but x402 expects it at top level.
 *
 * Critically, this adapter intercepts signTypedData to auto-switch chains when the
 * EIP-712 domain.chainId doesn't match the wallet's current chain. Without this,
 * viem throws: "chainId should be same as current chainId".
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
      // Extract the target chainId from the EIP-712 domain
      const domainChainId = message.domain?.chainId
        ? Number(message.domain.chainId)
        : undefined;

      // If the domain specifies a chainId different from the wallet's current chain,
      // switch chains before signing. This is the core fix for the
      // "chainId should be same as current chainId" error.
      if (domainChainId && walletClient.chain?.id !== domainChainId) {
        if (!switchChainAsync) {
          throw new Error(
            `Wallet is on chain ${walletClient.chain?.id} but payment requires chain ${domainChainId}. ` +
            `Please switch to the correct network in your wallet.`
          );
        }
        try {
          await switchChainAsync({ chainId: domainChainId });
        } catch (err) {
          // If the user rejects the chain switch, or the chain isn't configured,
          // give a clear error message
          const reason = err instanceof Error ? err.message : String(err);
          throw new Error(
            `Failed to switch to chain ${domainChainId}: ${reason}. ` +
            `Please switch networks manually in your wallet.`
          );
        }
      }

      return walletClient.signTypedData({
        account: walletClient.account!,
        domain: message.domain as Parameters<typeof walletClient.signTypedData>[0]["domain"],
        types: message.types as Parameters<typeof walletClient.signTypedData>[0]["types"],
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

  // Memoize the payment-wrapped fetch so it's not recreated on every call.
  // Note: switchChainAsync is included in deps so the signer always has the
  // latest chain-switching capability.
  const fetchWithPayment = useMemo(() => {
    if (!walletClient) return null;

    const signer = toX402Signer(walletClient, switchChainAsync);

    // Register all V1 network names from @x402/evm so the client can match
    // any V1 network the server might return (not just "base-sepolia").
    const v1Schemes = Object.keys(EVM_NETWORK_CHAIN_ID_MAP).map(
      (networkName) => ({
        network: networkName as `${string}:${string}`,
        client: new ExactEvmSchemeV1(signer),
        x402Version: 1 as const,
      })
    );

    return wrapFetchWithPaymentFromConfig(fetch, {
      schemes: [
        {
          // V2: CAIP-2 wildcard for all EVM chains (future-proof)
          network: "eip155:*",
          client: new ExactEvmScheme(signer),
        },
        // V1: Register all supported V1 network names.
        // x402-next v1.1.0 uses plain names like "base-sepolia", "base", etc.
        // The type cast is needed because TS types expect CAIP-2 format,
        // but V1 protocol uses plain network names.
        ...v1Schemes,
      ],
    });
  }, [walletClient, switchChainAsync]);

  const pay = useCallback(
    async <T = unknown>(
      url: string,
      options?: RequestInit
    ): Promise<PaymentResult<T>> => {
      if (!walletClient || !fetchWithPayment) {
        setError("Wallet not connected");
        setStatus("error");
        return { data: null, status: "error", error: "Wallet not connected" };
      }

      setStatus("awaiting_signature");
      setError(null);

      try {
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
        // Detect user rejection from wallet
        const isRejection =
          msg.includes("rejected") ||
          msg.includes("denied") ||
          msg.includes("cancelled") ||
          msg.includes("User rejected");
        // Detect insufficient funds
        const isInsufficientFunds =
          msg.includes("insufficient_funds") ||
          msg.includes("Insufficient funds");
        // Detect chain mismatch (should be auto-handled now, but keep as fallback)
        const isChainMismatch =
          msg.includes("chainId should be same as current chainId") ||
          msg.includes("Failed to switch to chain");

        let friendlyMsg: string;
        if (isRejection) {
          friendlyMsg = "Transaction was rejected in wallet";
        } else if (isInsufficientFunds) {
          friendlyMsg = "Insufficient USDC balance. Get testnet USDC at faucet.circle.com";
        } else if (isChainMismatch) {
          friendlyMsg = "Wrong network. Please switch to Base Sepolia in your wallet and try again.";
        } else {
          friendlyMsg = msg;
        }

        setError(friendlyMsg);
        setStatus("error");
        return { data: null, status: "error", error: friendlyMsg };
      }
    },
    [walletClient, fetchWithPayment]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { pay, status, error, reset, isConnected: !!walletClient };
}
