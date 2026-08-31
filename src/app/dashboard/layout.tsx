"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Spinner } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchMe, logout } from "@/store/authSlice";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, user, meLoading } = useAppSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  // hydrateAuth runs in the store provider, so a null token here means signed out.
  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!user && !meLoading) {
      dispatch(fetchMe());
    }
  }, [token, user, meLoading, dispatch, router]);

  function handleLogout() {
    dispatch(logout());
    router.replace("/login");
  }

  if (!token || !user) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar
            onNavigate={() => setMenuOpen(false)}
            onClose={() => setMenuOpen(false)}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-2xl">
            <Sidebar
              onNavigate={() => setMenuOpen(false)}
              onClose={() => setMenuOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          onMenuClick={() => setMenuOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
