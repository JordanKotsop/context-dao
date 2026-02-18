"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useX402Payment } from "@/hooks/use-x402-payment";
import { PaymentModal } from "@/components/payment-modal";

interface RentPanelProps {
  slug: string;
  skillName: string;
  price: number;
}

interface RentResponse {
  type: string;
  slug: string;
  skill_name: string;
  response: string;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  latency_ms?: number;
  meta_query_blocked?: boolean;
}

export function RentPanel({ slug, skillName, price }: RentPanelProps) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { pay, status, error, reset } = useX402Payment();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<RentResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleRent = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (!prompt.trim()) return;

    setShowModal(true);
    setResult(null);

    const response = await pay<RentResponse>(`/api/skills/${slug}/rent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });

    if (response.status === "success" && response.data) {
      setResult(response.data);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const handleNewQuery = () => {
    setResult(null);
    setPrompt("");
  };

  // Show result after successful inference
  if (result) {
    return (
      <div className="space-y-3">
        {/* Query recap */}
        <div className="rounded-xl bg-white/5 p-3">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-white/30">
            Your prompt
          </div>
          <p className="text-sm text-white/60">{prompt}</p>
        </div>

        {/* Response */}
        <div className="rounded-xl border border-lime/20 bg-black p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-lime/60">
              Response
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(result.response)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/70"
            >
              Copy
            </button>
          </div>
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/70">
            {result.response}
          </pre>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-xs text-white/30">
          {result.model && <span>Model: {result.model}</span>}
          {result.tokens_in != null && (
            <span>In: {result.tokens_in} tokens</span>
          )}
          {result.tokens_out != null && (
            <span>Out: {result.tokens_out} tokens</span>
          )}
          {result.latency_ms != null && (
            <span>{result.latency_ms}ms</span>
          )}
        </div>

        {/* Ask again */}
        <button
          onClick={handleNewQuery}
          className="w-full rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10"
        >
          Ask Another Question — ${price} USDC
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-lime/40 focus:ring-1 focus:ring-lime/20"
        />
        <button
          onClick={handleRent}
          disabled={
            !prompt.trim() ||
            status === "awaiting_signature" ||
            status === "processing"
          }
          className="w-full rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10 disabled:opacity-50"
        >
          {!isConnected
            ? "Connect Wallet to Rent"
            : status === "processing"
              ? "Processing..."
              : `Ask — $${price} USDC`}
        </button>
      </div>

      {showModal && (
        <PaymentModal
          status={status}
          error={error}
          amount={`$${price}`}
          skillName={skillName}
          mode="rent"
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
