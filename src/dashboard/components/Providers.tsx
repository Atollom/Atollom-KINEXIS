"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { ToastProvider } from "./ToastProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
