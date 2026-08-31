"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import {
  BuildingIcon,
  CloseIcon,
  GridIcon,
  LogoutIcon,
  PlaneIcon,
  UsersIcon,
} from "@/components/icons";
import { cn } from "@/components/ui";

export const NAV = [
  { href: "/dashboard", label: "Overview", Icon: GridIcon },
  { href: "/dashboard/customers", label: "Customers", Icon: BuildingIcon },
  { href: "/dashboard/users", label: "Users", Icon: UsersIcon },
];

export function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export default function Sidebar({
  onNavigate,
  onClose,
  onLogout,
}: {
  onNavigate: () => void;
  onClose: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm shadow-sky-600/25">
          <PlaneIcon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">
          Vikram Aviation
        </span>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="ml-auto rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Menu
        </p>
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                  )}
                >
                  {active ? (
                    <span
                      className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-sky-600 dark:bg-sky-400"
                      aria-hidden
                    />
                  ) : null}
                  <Icon />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-0.5 border-t border-slate-200 p-3 dark:border-slate-800">
        <ThemeToggle />
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <LogoutIcon />
          Sign out
        </button>
      </div>
    </div>
  );
}
