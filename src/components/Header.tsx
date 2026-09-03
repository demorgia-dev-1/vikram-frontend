"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftIcon, ChevronDownIcon, MenuIcon } from "@/components/icons";
import { Avatar, IconButton, cn } from "@/components/ui";
import type { User } from "@/types";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/customers": "Customers",
  "/dashboard/products": "Products",
  "/dashboard/workflow-templates": "Workflow templates",
  "/dashboard/users": "Users",
};

function describe(pathname: string) {
  if (TITLES[pathname]) {
    return { title: TITLES[pathname], parent: null as null | { href: string; label: string } };
  }

  if (pathname.startsWith("/dashboard/users/")) {
    return {
      title: "User details",
      parent: { href: "/dashboard/users", label: "Users" },
    };
  }

  if (pathname.startsWith("/dashboard/customers/")) {
    return {
      title: "Customer details",
      parent: { href: "/dashboard/customers", label: "Customers" },
    };
  }

  if (pathname.startsWith("/dashboard/products/")) {
    return {
      title: "Product details",
      parent: { href: "/dashboard/products", label: "Products" },
    };
  }

  if (pathname.startsWith("/dashboard/workflow-templates/")) {
    return {
      title: "Template details",
      parent: {
        href: "/dashboard/workflow-templates",
        label: "Workflow templates",
      },
    };
  }

  return { title: "Dashboard", parent: null };
}

export default function Header({
  user,
  onMenuClick,
  onLogout,
}: {
  user: User;
  onMenuClick: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { title, parent } = describe(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/85">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <MenuIcon />
      </button>

      {/* Any page with a parent is a detail view, so it always gets a back button. */}
      {parent ? (
        <IconButton
          label={`Back to ${parent.label.toLowerCase()}`}
          onClick={() => router.push(parent.href)}
          className="shrink-0 border border-slate-200 dark:border-slate-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </IconButton>
      ) : null}

      <div className="min-w-0">
        {parent ? (
          <nav aria-label="Breadcrumb" className="text-xs text-slate-500 dark:text-slate-400">
            <Link href={parent.href} className="transition hover:text-sky-600 dark:hover:text-sky-400">
              {parent.label}
            </Link>
            <span className="px-1.5" aria-hidden>
              /
            </span>
            <span>{title}</span>
          </nav>
        ) : null}
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="relative ml-auto">
        <button
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Avatar name={user.name} className="h-8 w-8 text-xs" />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight">{user.name}</span>
            <span className="block text-xs leading-tight text-slate-500 dark:text-slate-400">
              {user.role}
            </span>
          </span>
          <ChevronDownIcon
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform",
              menuOpen && "rotate-180",
            )}
          />
        </button>

        {menuOpen ? (
          <>
            {/* Click-away layer, kept behind the menu itself. */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                <p className="truncate text-sm font-medium">{user.email}</p>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Sign out
              </button>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
