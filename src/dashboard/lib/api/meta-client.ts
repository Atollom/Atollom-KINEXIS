// src/dashboard/lib/api/meta-client.ts
/**
 * KINEXIS Meta API Client
 * Used for unified communications across WhatsApp and Instagram.
 * 
 * @author Carlos Hernán Cortés Ayala (Architecture)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL && typeof window !== "undefined") {
  console.warn("⚠️ [KINEXIS] NEXT_PUBLIC_API_URL is not defined. Meta API calls will fail.");
}

export async function sendMetaMessage(params: {
  phone?: string;
  instagramId?: string;
  text: string;
}) {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  const endpoint = "/api/meta/send";
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to send message via Meta");
  }

  return response.json();
}

export const metaClient = {
  send: sendMetaMessage,
};
