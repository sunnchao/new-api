import { create } from "zustand";

export interface AuthUser {
  id: number;
  username: string;
  display_name?: string;
  email?: string;
  role: number;
  status: number;
  group?: string;
  quota: number;
  used_quota: number;
  request_count: number;
  aff_code?: string;
  aff_count?: number;
  aff_quota?: number;
  aff_history_quota?: number;
  inviter_id?: number;
  github_id?: string;
  oidc_id?: string;
  wechat_id?: string;
  telegram_id?: string;
  linux_do_id?: string;
  setting?: Record<string, unknown> | string;
  stripe_customer?: string;
  sidebar_modules?: string;
  permissions?: {
    sidebar_settings?: boolean;
    sidebar_modules?: string[];
  };
  avatar_url?: string;
}

type AuthActions = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  reset: () => void;
};

interface AuthState {
  auth: AuthActions;
  setUser: (user: AuthUser | null) => void;
  reset: () => void;
}

export const ROLE = {
  GUEST: 0,
  USER: 1,
  ADMIN: 10,
  ROOT: 100,
} as const;

function getInitialUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const setUser = (user: AuthUser | null) => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("uid", String(user.id));
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("uid");
      }
    }
    set((state) => ({ auth: { ...state.auth, user } }));
  };

  const reset = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("uid");
    }
    set((state) => ({ auth: { ...state.auth, user: null } }));
  };

  return {
    auth: {
      user: getInitialUser(),
      setUser,
      reset,
    },
    setUser,
    reset,
  };
});
