// Client-side cookie utilities.
// These functions manage cookies in the browser only.
// Server actions handle cookie updates on the server side.

interface CookieStore {
  get(name: string): Promise<string | undefined>;
  set(params: { name: string; value: string; expires?: string; path?: string }): Promise<void>;
  delete(name: string): Promise<void>;
}

const cookieStore: CookieStore = {
  async get(name) {
    if (typeof window !== "undefined" && window.cookieStore) {
      const cookie = await window.cookieStore.get(name);
      return cookie?.value;
    }
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
    return match ? match.split("=")[1] : undefined;
  },
  async set(params) {
    if (typeof window !== "undefined" && window.cookieStore) {
      await window.cookieStore.set(
        params as unknown as globalThis.CookieStore["set"] extends (params: infer P) => unknown ? P : never,
      );
    } else {
      // biome-ignore lint/suspicious/noDocumentCookie: fallback for browsers without cookieStore API
      document.cookie = `${params.name}=${params.value}; expires=${params.expires || ""}; path=${params.path || "/"}`;
    }
  },
  async delete(name) {
    if (typeof window !== "undefined" && window.cookieStore) {
      await window.cookieStore.delete(name);
    } else {
      // biome-ignore lint/suspicious/noDocumentCookie: fallback for browsers without cookieStore API
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    }
  },
};

export async function setClientCookie(key: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  await cookieStore.set({ name: key, value, expires, path: "/" });
}

export async function getClientCookie(key: string) {
  return cookieStore.get(key);
}

export async function deleteClientCookie(key: string) {
  await cookieStore.delete(key);
}
