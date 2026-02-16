import { supabase } from "lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

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
