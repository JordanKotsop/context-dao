"use client";

import { useState, useCallback } from "react";
import { useWalletClient } from "wagmi";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { ExactEvmSchemeV1 } from "@x402/evm/v1";
import type { WalletClient } from "viem";

/**
 * Adapts a wagmi WalletClient to the x402 ClientEvmSigner interface.
 * wagmi puts address on walletClient.account.address, but x402 expects it at top level.
 */
function toX402Signer(walletClient: WalletClient) {
  return {
    address: walletClient.account!.address,
    signTypedData: (message: {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    }) =>
      walletClient.signTypedData({
        account: walletClient.account!,
        domain: message.domain as Parameters<typeof walletClient.signTypedData>[0]["domain"],
        types: message.types as Parameters<typeof walletClient.signTypedData>[0]["types"],
        primaryType: message.primaryType,
        message: message.message,
      }),
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
        // Adapt wagmi WalletClient to x402 ClientEvmSigner interface
        const signer = toX402Signer(walletClient);

        const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
          schemes: [
            {
              network: "eip155:*",
              client: new ExactEvmScheme(signer),
            },
            {
              network: "base-sepolia" as `${string}:${string}`,
              client: new ExactEvmSchemeV1(signer),
              x402Version: 1,
            },
          ],
        });

        setStatus("processing");

        const response = await fetchWithPayment(url, options);

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
        // Detect user rejection
        const isRejection =
          msg.includes("rejected") ||
          msg.includes("denied") ||
          msg.includes("cancelled") ||
          msg.includes("User rejected");
        const friendlyMsg = isRejection
          ? "Transaction was rejected in wallet"
          : msg;

        setError(friendlyMsg);
        setStatus("error");
        return { data: null, status: "error", error: friendlyMsg };
      }
    },
    [walletClient]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { pay, status, error, reset, isConnected: !!walletClient };
}
