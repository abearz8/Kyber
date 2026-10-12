import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/hooks/useStore";
import AnalyticsProvider from "./AnalyticsProvider";

export const metadata: Metadata = {
  title: "Kyber — Your semester. One clear plan.",
  description:
    "Kyber turns your syllabi into a complete semester plan with grade tracking, deadlines, and daily priorities.",
  icons: { icon: "/favicon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kyber",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <AnalyticsProvider
            posthogKey={
              process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
              process.env.NEXT_PUBLIC_POSTHOG_KEY ??
              ""
            }
            posthogHost={
              process.env.NEXT_PUBLIC_POSTHOG_HOST ??
              "https://us.i.posthog.com"
            }
          >
            {children}
          </AnalyticsProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
