import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import { OnboardingGate } from "@/components/onboarding-gate";

const kanit = Kanit({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "Repetitórium — štátnice z účtovníctva",
  description:
    "Neoficiálna, dobrovoľná študijná pomôcka na bakalárske a inžinierske štátnice z účtovníctva (FHI EU v Bratislave). Čítaj, počúvaj, otestuj sa.",
  applicationName: "Repetitórium",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Repetitórium", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0eee9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1626" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" suppressHydrationWarning className={kanit.variable}>
      <body className="min-h-screen">
        <Providers>
          <OnboardingGate>
            <AppShell>{children}</AppShell>
          </OnboardingGate>
        </Providers>
      </body>
    </html>
  );
}
