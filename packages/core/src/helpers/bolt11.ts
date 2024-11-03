import { decode } from "light-bolt11-decoder";

export type ParsedInvoice = {
  paymentRequest: string;
  description: string;
  amount?: number;
  timestamp: number;
  expiry: number;
};

export function parseBolt11(paymentRequest: string): ParsedInvoice {
  const decoded = decode(paymentRequest);
  const timestamp = decoded.sections.find((s) => s.name === "timestamp")?.value ?? 0;

  return {
    paymentRequest: decoded.paymentRequest,
    description: decoded.sections.find((s) => s.name === "description")?.value ?? "",
    amount: parseInt(decoded.sections.find((s) => s.name === "amount")?.value ?? "0"),
    timestamp: timestamp,
    expiry: timestamp + decoded.expiry,
  };
}
