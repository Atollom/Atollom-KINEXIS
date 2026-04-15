// src/dashboard/lib/fetcher.ts
// Shared SWR fetcher that throws on non-OK HTTP responses.
// When fetch returns 403/500/etc, SWR will correctly mark it as an error
// instead of treating the JSON error body as valid data (which causes
// .filter() crashes when components expect arrays).

export class FetchError extends Error {
  status: number;
  info: unknown;

  constructor(message: string, status: number, info: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    let info: unknown;
    try {
      info = await res.json();
    } catch {
      info = { error: res.statusText };
    }
    throw new FetchError(
      `API error ${res.status}: ${url}`,
      res.status,
      info
    );
  }

  return res.json();
};
