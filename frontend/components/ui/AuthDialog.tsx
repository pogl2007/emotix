"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { useAuth } from "@/lib/auth";
import CornerBrackets from "@/components/ui/CornerBrackets";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthDialog({ open, onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "in") await signIn(email, password);
      else await signUp(email, password);
      setEmail("");
      setPassword("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md border border-line bg-surface p-8"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CornerBrackets size={16} inset={-1} />

            <p className="label mb-2">{mode === "in" ? "вход" : "регистрация"}</p>
            <h2 className="mb-1 text-2xl font-bold">
              {mode === "in" ? "С возвращением" : "Создать аккаунт"}
            </h2>
            <p className="mb-6 text-muted">
              Аккаунт нужен только чтобы сохранять историю анализов в этом браузере.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label mb-2 block" htmlFor="emotix-email">
                  email
                </label>
                <input
                  id="emotix-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mono w-full border border-line bg-bg px-4 py-3 text-text outline-none focus:border-accent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="label mb-2 block" htmlFor="emotix-password">
                  пароль
                </label>
                <input
                  id="emotix-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mono w-full border border-line bg-bg px-4 py-3 text-text outline-none focus:border-accent"
                  placeholder="минимум 6 символов"
                />
              </div>

              {error && (
                <p className="mono border border-accent bg-accentSubtle px-4 py-2 text-[12px] text-accentHover">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? "[ ... ]" : mode === "in" ? "[ ВОЙТИ ]" : "[ ЗАРЕГИСТРИРОВАТЬСЯ ]"}
              </button>
            </form>

            <button
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setError(null);
              }}
              className="mono mt-5 w-full text-center text-[11px] uppercase tracking-[0.14em] text-dim hover:text-accent"
            >
              {mode === "in" ? "нет аккаунта? создать" : "уже есть аккаунт? войти"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
