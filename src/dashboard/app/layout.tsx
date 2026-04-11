import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "KINEXIS — Neural Command Center",
  description: "Kap Tools AI Operations Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-surface text-on-surface overflow-x-hidden">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Fixed header */}
        <Header />

        {/* Main content — offset by sidebar on desktop */}
        <main
          className="
            md:ml-64
            pt-16
            pb-24 md:pb-8
            min-h-screen
            bg-surface
          "
        >
          {children}
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </body>
    </html>
  );
}
