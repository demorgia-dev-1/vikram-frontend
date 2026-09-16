"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Toaster from "@/components/Toaster";
import { Spinner } from "@/components/ui";
import { useNotificationStream } from "@/lib/useNotificationStream";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchMe, logout } from "@/store/authSlice";

/** The sections a non-admin may open — both are their own personal work. */
const MY_WORK = "/dashboard/my-work";
const OPEN_TO_EVERYONE = [MY_WORK, "/dashboard/notifications"];

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { token, user, meLoading } = useAppSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  // Live notifications for as long as a session is signed in.
  useNotificationStream(Boolean(token && user));

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

  // Every section but My work is admin-only, so a non-admin who reaches one by
  // URL is sent back. The server still enforces this; hiding the nav does not.
  useEffect(() => {
    if (user && !isAdmin && !OPEN_TO_EVERYONE.includes(pathname)) {
      router.replace(MY_WORK);
    }
  }, [user, isAdmin, pathname, router]);

  function handleLogout() {
    dispatch(logout());
    router.replace("/login");
  }

  // The second condition covers the tick before the redirect above lands, so an
  // admin-only page never flashes up for a non-admin.
  if (!token || !user || (!isAdmin && !OPEN_TO_EVERYONE.includes(pathname))) {
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
