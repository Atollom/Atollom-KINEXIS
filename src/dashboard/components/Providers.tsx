"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { ToastProvider } from "./ToastProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
