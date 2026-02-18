"use client";

import { type PaymentStatus } from "@/hooks/use-x402-payment";

interface PaymentModalProps {
  status: PaymentStatus;
  error: string | null;
  amount: string;
  skillName: string;
  mode: "buy" | "rent";
  onClose: () => void;
}

export function PaymentModal({
  status,
  error,
  amount,
  skillName,
  mode,
  onClose,
}: PaymentModalProps) {
  if (status === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold text-white">
            {mode === "buy" ? "Purchase Skill" : "Rent Inference"}
          </h3>
          <p className="mt-1 text-sm text-white/50">{skillName}</p>
        </div>

        {/* Status */}
        <div className="mb-6 flex flex-col items-center gap-4">
          {status === "awaiting_signature" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/10">
                <div className="h-8 w-8 animate-pulse rounded-full bg-lime/50" />
              </div>
              <div className="text-center">
                <p className="font-medium text-white">Confirm in Wallet</p>
                <p className="mt-1 text-sm text-white/50">
                  Sign the payment authorization for {amount} USDC
                </p>
              </div>
            </>
          )}

          {status === "processing" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime/30 border-t-lime" />
              </div>
              <div className="text-center">
                <p className="font-medium text-white">Processing Payment</p>
                <p className="mt-1 text-sm text-white/50">
                  Facilitator is settling the transaction...
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/20">
                <svg
                  className="h-8 w-8 text-lime"
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
              </div>
              <div className="text-center">
                <p className="font-medium text-white">Payment Confirmed!</p>
                <p className="mt-1 text-sm text-white/50">
                  {amount} USDC · Base Sepolia
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <svg
                  className="h-8 w-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium text-white">Payment Failed</p>
                <p className="mt-1 text-sm text-red-400">{error}</p>
              </div>
            </>
          )}
        </div>

        {/* Amount display */}
        {(status === "awaiting_signature" || status === "processing") && (
          <div className="mb-6 rounded-xl bg-white/5 p-4 text-center">
            <div className="text-xs uppercase tracking-wider text-white/40">
              Amount
            </div>
            <div className="mt-1 text-2xl font-bold text-lime">{amount} USDC</div>
            <div className="mt-1 text-xs text-white/30">
              Base Sepolia · No gas required
            </div>
          </div>
        )}

        {/* Close button */}
        {(status === "success" || status === "error") && (
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            {status === "success" ? "Done" : "Close"}
          </button>
        )}
      </div>
    </div>
  );
}
