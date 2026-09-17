"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchModelInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AuthDialog from "@/components/ui/AuthDialog";

const NAV = [
  { href: "/", label: "Главная" },
  { href: "/analyze", label: "Анализ" },
  { href: "/history", label: "История" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [online, setOnline] = useState<boolean | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchModelInfo().then((info) => {
      if (!cancelled) setOnline(info ? info.model_loaded : false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const statusColor =
    online === null ? "#52525b" : online ? "#22c55e" : "#dc2626";
  const statusText =
    online === null ? "CONNECTING" : online ? "MODEL ONLINE" : "MODEL OFFLINE";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5">
          <Link href="/" className="mono flex items-center gap-2 text-[15px] font-bold tracking-[0.22em]">
            <span className="text-accent">◈</span>
            <span>EMOTIX</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mono border px-4 py-2 text-[11px] uppercase tracking-[0.16em] ${
                    active
                      ? "border-accent bg-accentSubtle text-accent"
                      : "border-transparent text-muted hover:border-line hover:text-text"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <span className="mono hidden items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-dim sm:flex">
              <span
                className="h-[6px] w-[6px] rounded-full"
                style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
              />
              {statusText}
            </span>

            {user ? (
              <button
                onClick={signOut}
                className="mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-accent"
                title={user.email}
              >
                Выйти
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-accent"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
