"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Toaster from "@/components/Toaster";
import { Spinner } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchMe, logout } from "@/store/authSlice";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, user, meLoading } = useAppSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <div className="flex flex-1 items-center justify-center text-subtle">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1">
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
