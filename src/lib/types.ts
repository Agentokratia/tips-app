/**
 * Shared types for the tip-app
 */

/** Payment requirements from x402 facilitator */
export interface PaymentRequirements {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}

/** Result from payment verification */
export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

/** Result from payment settlement */
export interface SettleResponse {
  success: boolean;
  transaction?: string;
  network?: string;
  errorReason?: string;
}

/** Payment result returned to client */
export interface PaymentResult {
  success: boolean;
  transaction?: string;
  network?: string;
  recipient?: string;
  amount?: string;
  message?: string;
  errorReason?: string;
}
