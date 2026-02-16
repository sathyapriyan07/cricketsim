import { supabase } from "lib/supabase";
import { useAuthStore } from "store/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL || "/api";

async function resolveToken() {
  const tokenFromStore = useAuthStore.getState().token;
  if (tokenFromStore) return tokenFromStore;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await resolveToken();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${API_URL}${normalizedPath}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
  }

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = await response.json();
      detail = errBody?.error || "";
    } catch {
      // ignore parse failures
    }
    throw new Error(detail ? `API ${response.status}: ${detail}` : `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

