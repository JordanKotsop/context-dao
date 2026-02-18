"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useX402Payment } from "@/hooks/use-x402-payment";
import { PaymentModal } from "@/components/payment-modal";

interface BuyButtonProps {
  slug: string;
  skillName: string;
  price: number;
}

interface BuyResponse {
  type: string;
  slug: string;
  skill_name: string;
  content: string;
}

export function BuyButton({ slug, skillName, price }: BuyButtonProps) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { pay, status, error, reset } = useX402Payment();
  const [purchasedContent, setPurchasedContent] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleBuy = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    setShowModal(true);
    const result = await pay<BuyResponse>(`/api/skills/${slug}/buy`);

    if (result.status === "success" && result.data?.content) {
      setPurchasedContent(result.data.content);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  if (purchasedContent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-lime/10 px-4 py-3">
          <svg
            className="h-5 w-5 text-lime"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium text-lime">
            Purchased — Full source unlocked
          </span>
        </div>
        <div className="relative rounded-2xl border border-lime/20 bg-black p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-lime/60">
              Full Prompt Source
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(purchasedContent)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/70"
            >
              Copy
            </button>
          </div>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/70">
            {purchasedContent}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleBuy}
        disabled={status === "awaiting_signature" || status === "processing"}
        className="w-full rounded-xl bg-lime py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-hover disabled:opacity-50"
      >
        {!isConnected
          ? "Connect Wallet to Buy"
          : status === "processing"
            ? "Processing..."
            : `Buy Source — $${price} USDC`}
      </button>

      {showModal && (
        <PaymentModal
          status={status}
          error={error}
          amount={`$${price}`}
          skillName={skillName}
          mode="buy"
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
