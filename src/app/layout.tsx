import type { Metadata, Viewport } from "next";
import { Quicksand, DM_Sans } from "next/font/google";
import "./globals.css";
import { EnvGate } from "@/components/EnvGate";
import { AppProviders } from "@/components/AppProviders";

const display = Quicksand({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "NightCapt | Every Good Night Deserves a Recap",
  description: "The social diary for nights out. Remember the night, relive the debrief, and turn nights out into lasting memories with friends.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1e1b24",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} style={{ backgroundColor: "#1e1b24" }}>
      <body className="font-body antialiased playful-bg min-h-screen safe-area-x">
        <EnvGate>
          <AppProviders>{children}</AppProviders>
        </EnvGate>
      </body>
    </html>
  );
}
