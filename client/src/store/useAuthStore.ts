import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppRole = "admin" | "moderator" | "user";

export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  display_name: string;
}

interface AuthState {
  user: AuthUser | null;
  role: AppRole | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setAuth: (payload: { user: AuthUser | null; token: string | null }) => void;
  setToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      token: null,
      isLoggedIn: false,
      loading: false,
      setLoading: (loading) => set({ loading }),
      setAuth: ({ user, token }) =>
        set({
          user,
          role: user?.role || null,
          token,
          isLoggedIn: Boolean(user && token)
        }),
      setToken: (token) => set((state) => ({ token, isLoggedIn: Boolean(state.user && token) })),
      clearAuth: () =>
        set({
          user: null,
          role: null,
          token: null,
          isLoggedIn: false,
          loading: false
        })
    }),
    {
      name: "cricketsim-auth-store"
    }
  )
);

