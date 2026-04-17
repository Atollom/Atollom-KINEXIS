import type { Metadata } from "next";
import "./globals.css";

import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";

export const metadata: Metadata = {
  title: "KINEXIS — Neural Control Terminal",
  description:
    "Autonomous multi-agent orchestration shell. 43 active IA nodes operating in global realtime.",
  keywords: ["kinexis", "neural", "ai", "agents", "luxe", "dashboard"],
};

import { Providers } from "@/components/Providers";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = createClient();
  const userData = await getAuthenticatedTenant(supabase);

  return (
    <html lang="en" suppressHydrationWarning className="dark selection:bg-[#ccff00] selection:text-black" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,900,1,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#040f1b] text-white custom-scrollbar selection:bg-[#ccff00] selection:text-black min-h-screen overflow-hidden">
        <Providers>
          <div className="fixed top-4 right-4 z-[100]">
            <ThemeToggle />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}

