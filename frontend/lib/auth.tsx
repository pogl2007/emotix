"use client";

/**
 * Локальный аккаунт: email + пароль хранятся в localStorage этого браузера.
 * Нужен только чтобы разделять историю анализов между пользователями одного
 * компьютера. Это не серверная авторизация — пароль никуда не отправляется.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
}

export interface User {
  id: string;
  email: string;
}

interface AuthValue {
  user: User | null;
  ready: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const USERS_KEY = "emotix:users";
const SESSION_KEY = "emotix:session";

const AuthContext = createContext<AuthValue | null>(null);

async function hash(value: string): Promise<string> {
  const data = new TextEncoder().encode(`emotix:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readUsers(): StoredUser[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      /* пусто */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    if (next) window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
        throw new Error("Некорректный email");
      }
      if (password.length < 6) {
        throw new Error("Пароль минимум 6 символов");
      }
      const users = readUsers();
      if (users.some((u) => u.email === normalized)) {
        throw new Error("Такой email уже зарегистрирован");
      }
      const stored: StoredUser = {
        id: `u_${Date.now().toString(36)}`,
        email: normalized,
        passwordHash: await hash(password),
      };
      writeUsers([...users, stored]);
      persist({ id: stored.id, email: stored.email });
    },
    [persist],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      const found = readUsers().find((u) => u.email === normalized);
      if (!found || found.passwordHash !== (await hash(password))) {
        throw new Error("Неверный email или пароль");
      }
      persist({ id: found.id, email: found.email });
    },
    [persist],
  );

  const signOut = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ user, ready, signUp, signIn, signOut }),
    [user, ready, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен вызываться внутри AuthProvider");
  return ctx;
}
