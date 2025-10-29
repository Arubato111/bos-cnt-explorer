export type KoiosConfig = { baseUrl: string; apiKey?: string };

export function createKoios(cfg: KoiosConfig) {
  const base = cfg.baseUrl.replace(/\/$/, "");
  const headers = cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};
  return {
    async get<T>(path: string, init?: RequestInit): Promise<T> {
      const res = await fetch(`${base}${path}`, {
        ...init,
        headers: { ...headers, ...(init?.headers || {}) }
      });
      if (!res.ok) throw new Error(`Koios HTTP ${res.status}`);
      return res.json() as Promise<T>;
    }
  };
}
