/**
 * Pagalo Payment Service
 * A reusable, type-safe module for handling Pagalo one-time payments.
 * Designed for portability across different applications.
 */

// ============================================
// Configuration Interface
// ============================================

export interface PagaloConfig {
  apiKey: string;
  baseUrl: string;
}

// ============================================
// Request Interfaces
// ============================================

export interface PagaloClient {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country?: "GT";
  city: string;
  address: string;
}

export interface PagaloProductDetail {
  uuid_product: string;
  name: string;
  amount: number;
  quantity?: "1";
  Subtotal: number;
}

export interface PagaloCardPayment {
  name_card: string;
  number_card: string;
  expiration_month: number;
  expiration_year: number;
  cvv_card: string;
}

export interface PaymentRequest {
  total_amount: number;
  client: PagaloClient;
  detail: PagaloProductDetail[];
  card_payment: PagaloCardPayment;
  currency?: "GTQ";
  method_payment?: "EPAY";
  type_detail?: "product";
}

// ============================================
// Response Interfaces
// ============================================

export interface PagaloTransactionResponse {
  uuid: string;
  status: string;
  message: string;
  authorization_code?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  created_at?: string;
}

export interface PaymentResponse {
  success: boolean;
  data?: PagaloTransactionResponse;
  error?: string;
}

// ============================================
// API Request Body (Internal)
// ============================================

interface PagaloApiRequestBody {
  method_payment: "EPAY";
  type_detail: "product";
  total_amount: number;
  currency: "GTQ";
  client: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: "GT";
    city: string;
    address: string;
  };
  detail: Array<{
    uuid_product: string;
    name: string;
    amount: number;
    quantity: "1";
    Subtotal: number;
  }>;
  card_payment: {
    name_card: string;
    number_card: string;
    expiration_month: number;
    expiration_year: number;
    cvv_card: string;
  };
}

// ============================================
// Custom Error Class
// ============================================

export class PagaloPaymentError extends Error {
  public readonly statusCode: number;
  public readonly upstreamMessage: string;
  public readonly rawResponse?: unknown;

  constructor(
    message: string,
    statusCode: number,
    upstreamMessage: string,
    rawResponse?: unknown
  ) {
    super(message);
    this.name = "PagaloPaymentError";
    this.statusCode = statusCode;
    this.upstreamMessage = upstreamMessage;
    this.rawResponse = rawResponse;
    Object.setPrototypeOf(this, PagaloPaymentError.prototype);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Sanitizes card number by removing all spaces and non-digit characters
 */
function sanitizeCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\D/g, "");
}

/**
 * Ensures expiration year is in 2-digit format
 * Handles both 2-digit (24) and 4-digit (2024) inputs
 */
function normalizeExpirationYear(year: number): number {
  if (year >= 100) {
    // 4-digit year, convert to 2-digit
    return year % 100;
  }
  return year;
}

// ============================================
// Pagalo Service Class
// ============================================

export class PagaloService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Creates a new PagaloService instance
   * @param config - Optional configuration. Defaults to environment variables.
   */
  constructor(config?: Partial<PagaloConfig>) {
    this.apiKey = config?.apiKey ?? process.env.PAGALO_API_KEY ?? "";
    this.baseUrl =
      config?.baseUrl ??
      process.env.PAGALO_API_URL ??
      "https://apitest.pagalo.co/v1";

    if (!this.apiKey) {
      console.warn(
        "PagaloService: No API key provided. Ensure PAGALO_API_KEY is set."
      );
    }
  }

  /**
   * Creates a new payment transaction with Pagalo
   * @param paymentDetails - The payment request details
   * @returns PaymentResponse with transaction data or error
   * @throws PagaloPaymentError if the API returns a non-200 status
   */
  async createTransaction(
    paymentDetails: PaymentRequest
  ): Promise<PaymentResponse> {
    const endpoint = `${this.baseUrl}/payments/transactions`;

    // Build the API request body with strict mapping
    const requestBody: PagaloApiRequestBody = {
      method_payment: paymentDetails.method_payment ?? "EPAY",
      type_detail: paymentDetails.type_detail ?? "product",
      total_amount: paymentDetails.total_amount,
      currency: paymentDetails.currency ?? "GTQ",
      client: {
        first_name: paymentDetails.client.first_name,
        last_name: paymentDetails.client.last_name,
        email: paymentDetails.client.email,
        phone: paymentDetails.client.phone,
        country: paymentDetails.client.country ?? "GT",
        city: paymentDetails.client.city,
        address: paymentDetails.client.address,
      },
      detail: paymentDetails.detail.map((item) => ({
        uuid_product: item.uuid_product,
        name: item.name,
        amount: item.amount,
        quantity: item.quantity ?? "1",
        Subtotal: item.Subtotal,
      })),
      card_payment: {
        name_card: paymentDetails.card_payment.name_card,
        number_card: sanitizeCardNumber(paymentDetails.card_payment.number_card),
        expiration_month: paymentDetails.card_payment.expiration_month,
        expiration_year: normalizeExpirationYear(
          paymentDetails.card_payment.expiration_year
        ),
        cvv_card: paymentDetails.card_payment.cvv_card,
      },
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage =
          responseData?.message ||
          responseData?.error ||
          `Payment failed with status ${response.status}`;

        throw new PagaloPaymentError(
          `Pagalo API Error: ${errorMessage}`,
          response.status,
          errorMessage,
          responseData
        );
      }

      return {
        success: true,
        data: responseData as PagaloTransactionResponse,
      };
    } catch (error) {
      // Re-throw PagaloPaymentError as-is
      if (error instanceof PagaloPaymentError) {
        throw error;
      }

      // Handle network or unexpected errors
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";

      throw new PagaloPaymentError(
        `Pagalo Request Failed: ${message}`,
        0,
        message
      );
    }
  }

  /**
   * Validates if the service is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.baseUrl);
  }
}

// ============================================
// Default Export & Singleton Instance
// ============================================

// Export a default instance for convenience
export const pagaloService = new PagaloService();

export default PagaloService;
