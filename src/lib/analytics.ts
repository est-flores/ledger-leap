"use client";

import { logEvent as firebaseLogEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "./firebase";

// ============================================
// Event Type Definitions
// ============================================

// ROI & Profitability Events
type ViewPricingModalEvent = {
  name: "view_pricing_modal";
  params?: Record<string, never>;
};

type SelectCreditPackEvent = {
  name: "select_credit_pack";
  params: {
    pack_name: "starter" | "pro";
    value: number;
  };
};

type ContactSupportClickEvent = {
  name: "contact_support_click";
  params?: {
    source?: string;
  };
};

// Usage & Core Value Events
type FileDroppedEvent = {
  name: "file_dropped";
  params: {
    file_type: "pdf" | "img";
    file_size_mb: number;
  };
};

type ConversionStartEvent = {
  name: "conversion_start";
  params?: {
    file_name?: string;
  };
};

type ConversionCompleteEvent = {
  name: "conversion_complete";
  params: {
    processing_time_ms: number;
    pages_count?: number;
    transaction_count?: number;
  };
};

type ConversionDownloadEvent = {
  name: "conversion_download";
  params?: {
    file_name?: string;
  };
};

// Friction & UX Events
type ConversionErrorEvent = {
  name: "conversion_error";
  params: {
    error_code: string;
    error_message: string;
  };
};

type InsufficientCreditsErrorEvent = {
  name: "insufficient_credits_error";
  params?: {
    credits_balance?: number;
  };
};

// Auth Events
type SignUpStartEvent = {
  name: "sign_up_start";
  params?: Record<string, never>;
};

type SignUpCompleteEvent = {
  name: "sign_up_complete";
  params?: Record<string, never>;
};

type SignInCompleteEvent = {
  name: "sign_in_complete";
  params?: Record<string, never>;
};

// Union of all events
type AnalyticsEvent =
  | ViewPricingModalEvent
  | SelectCreditPackEvent
  | ContactSupportClickEvent
  | FileDroppedEvent
  | ConversionStartEvent
  | ConversionCompleteEvent
  | ConversionDownloadEvent
  | ConversionErrorEvent
  | InsufficientCreditsErrorEvent
  | SignUpStartEvent
  | SignUpCompleteEvent
  | SignInCompleteEvent;

// ============================================
// Analytics Wrapper Function
// ============================================

/**
 * Log an analytics event with strict typing.
 * In development mode, logs to console instead of Firebase.
 */
export async function logAnalyticsEvent<T extends AnalyticsEvent>(
  eventName: T["name"],
  params?: T["params"]
): Promise<void> {
  // Development mode: log to console
  if (process.env.NODE_ENV === "development") {
    console.log(
      `%c[Analytics] ${eventName}`,
      "color: #10b981; font-weight: bold;",
      params ?? {}
    );
    return;
  }

  // Production mode: send to Firebase
  try {
    const analytics = await getFirebaseAnalytics();
    if (analytics) {
      firebaseLogEvent(analytics, eventName as string, params as Record<string, unknown>);
    }
  } catch (error) {
    console.warn("Failed to log analytics event:", eventName, error);
  }
}

// ============================================
// Convenience Functions for Common Events
// ============================================

// ROI Events
export function trackViewPricingModal() {
  return logAnalyticsEvent("view_pricing_modal");
}

export function trackSelectCreditPack(packName: "starter" | "pro", value: number) {
  return logAnalyticsEvent("select_credit_pack", { pack_name: packName, value });
}

export function trackContactSupportClick(source?: string) {
  return logAnalyticsEvent("contact_support_click", { source });
}

// Usage Events
export function trackFileDropped(fileType: "pdf" | "img", fileSizeMb: number) {
  return logAnalyticsEvent("file_dropped", { file_type: fileType, file_size_mb: fileSizeMb });
}

export function trackConversionStart(fileName?: string) {
  return logAnalyticsEvent("conversion_start", { file_name: fileName });
}

export function trackConversionComplete(
  processingTimeMs: number,
  transactionCount?: number,
  pagesCount?: number
) {
  return logAnalyticsEvent("conversion_complete", {
    processing_time_ms: processingTimeMs,
    transaction_count: transactionCount,
    pages_count: pagesCount,
  });
}

export function trackConversionDownload(fileName?: string) {
  return logAnalyticsEvent("conversion_download", { file_name: fileName });
}

// Friction Events
export function trackConversionError(errorCode: string, errorMessage: string) {
  return logAnalyticsEvent("conversion_error", {
    error_code: errorCode,
    error_message: errorMessage,
  });
}

export function trackInsufficientCreditsError(creditsBalance?: number) {
  return logAnalyticsEvent("insufficient_credits_error", {
    credits_balance: creditsBalance,
  });
}

// Auth Events
export function trackSignUpStart() {
  return logAnalyticsEvent("sign_up_start");
}

export function trackSignUpComplete() {
  return logAnalyticsEvent("sign_up_complete");
}

export function trackSignInComplete() {
  return logAnalyticsEvent("sign_in_complete");
}
