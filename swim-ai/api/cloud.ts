const HOST_URL = process.env.EXPO_PUBLIC_HOST_URL ?? "";
const API_KEY = process.env.EXPO_PUBLIC_OW_API_KEY ?? "";

export type ProviderSetting = {
  provider: string;
  name: string;
  has_cloud_api: boolean;
  is_enabled: boolean;
  icon_url: string | null;
  live_sync_mode: string | null;
  live_sync_configurable: boolean;
  data_granularity: string | null;
};

export type UserConnection = {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string | null;
  provider_username: string | null;
  scope: string | null;
  status: "active" | "revoked" | "expired";
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ConnectionStatus = UserConnection["status"] | "not-connected";

export type AuthorizeResponse = {
  authorization_url: string;
  state: string;
};

const MAX_LOGGED_BODY = 10000;

function preview(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "(empty)";
  return trimmed.length > MAX_LOGGED_BODY
    ? `${trimmed.slice(0, MAX_LOGGED_BODY)}…`
    : trimmed;
}

async function request<T>(path: string, method: string = "GET"): Promise<T> {
  const startedAt = Date.now();
  console.log(`[API] → ${method} ${path}`);

  let response: Response;
  try {
    response = await fetch(`${HOST_URL}${path}`, {
      method,
      headers: {
        "X-Open-Wearables-API-Key": API_KEY,
        Accept: "application/json",
      },
    });
  } catch (e: any) {
    console.error(`[API] ✗ ${method} ${path} — ${e?.message ?? String(e)}`);
    throw e;
  }

  const elapsed = Date.now() - startedAt;
  const text = await response.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Not JSON — the raw text still goes to the log
  }

  const summary = `${response.status} ${method} ${path} (${elapsed}ms) ${preview(text)}`;

  if (!response.ok) {
    console.error(`[API] ← ${summary}`);
    throw new Error(body?.detail ?? `HTTP ${response.status}`);
  }

  console.log(`[API] ← ${summary}`);
  return body as T;
}

export function getProviders(): Promise<ProviderSetting[]> {
  return request<ProviderSetting[]>("/api/v1/oauth/providers");
}

export function getUserConnections(userId: string): Promise<UserConnection[]> {
  return request<UserConnection[]>(
    `/api/v1/users/${encodeURIComponent(userId)}/connections`
  );
}

export function authorizeProvider(
  provider: string,
  userId: string
): Promise<AuthorizeResponse> {
  return request<AuthorizeResponse>(
    `/api/v1/oauth/${provider}/authorize?user_id=${encodeURIComponent(userId)}`
  );
}

export function disconnectProvider(
  userId: string,
  provider: string
): Promise<null> {
  return request<null>(
    `/api/v1/users/${encodeURIComponent(userId)}/connections/${provider}`,
    "DELETE"
  );
}

/** Provider icons are served as relative paths from the same host. */
export function iconUrl(provider: ProviderSetting): string | null {
  return provider.icon_url ? `${HOST_URL}${provider.icon_url}` : null;
}
