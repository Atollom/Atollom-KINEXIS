// src/dashboard/app/login/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KINEXIS — Acceso Seguro",
  description: "Portal de autenticación del Neural Command Center",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#000f21] min-h-screen text-on-surface">
      {children}
    </div>
  );
}
