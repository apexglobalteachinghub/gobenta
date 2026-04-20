import type { PaymentOption } from "@/types/database";

const LABELS: Record<PaymentOption, string> = {
  gcash: "GCash",
  maya: "Maya",
  cod: "COD",
  pasabuy: "Pasabuy",
};

export function formatPaymentOption(raw: string): string {
  const k = raw.toLowerCase() as PaymentOption;
  return LABELS[k] ?? raw;
}
