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
    <div style={{ background: '#040f1b', minHeight: '100vh' }}>
      {children}
    </div>
  );
}
