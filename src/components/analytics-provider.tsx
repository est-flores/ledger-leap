"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getFirebaseAnalytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * AnalyticsProvider initializes Firebase Analytics on mount
 * and tracks page views on route changes.
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  // Initialize analytics on mount (lazy loaded)
  useEffect(() => {
    // Skip in development
    if (process.env.NODE_ENV === "development") {
      return;
    }

    // Initialize Firebase Analytics
    getFirebaseAnalytics().catch((error) => {
      console.warn("Failed to initialize analytics:", error);
    });
  }, []);

  // Track page views on route changes
  useEffect(() => {
    // Skip in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `%c[Analytics] page_view`,
        "color: #10b981; font-weight: bold;",
        { page_path: pathname }
      );
      return;
    }

    // Track page view in production
    const trackPageView = async () => {
      try {
        const analytics = await getFirebaseAnalytics();
        if (analytics) {
          logEvent(analytics, "page_view", {
            page_path: pathname,
          });
        }
      } catch (error) {
        console.warn("Failed to track page view:", error);
      }
    };

    trackPageView();
  }, [pathname]);

  return <>{children}</>;
}
