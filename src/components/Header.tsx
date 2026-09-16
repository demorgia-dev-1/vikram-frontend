"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationsMenu from "@/components/NotificationsMenu";
import { ArrowLeftIcon, ChevronDownIcon, MenuIcon } from "@/components/icons";
import { IconButton, cn } from "@/components/ui";
import type { User } from "@/types";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/my-work": "My work",
  "/dashboard/notifications": "Notifications",
  "/dashboard/customers": "Customers",
  "/dashboard/products": "Products",
  "/dashboard/users": "Users",
  "/dashboard/workflow-templates": "Workflow templates",
};

const PARENTS: [string, string, string][] = [
  ["/dashboard/users/", "User details", "Users"],
  ["/dashboard/customers/", "Customer details", "Customers"],
  ["/dashboard/products/", "Product details", "Products"],
  ["/dashboard/workflow-templates/", "Template details", "Workflow templates"],
];

function describe(pathname: string) {
  if (TITLES[pathname]) {
    return {
      title: TITLES[pathname],
      parent: null as null | { href: string; label: string },
    };
  }

  for (const [prefix, title, label] of PARENTS) {
    if (pathname.startsWith(prefix)) {
      return { title, parent: { href: prefix.slice(0, -1), label } };
    }
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
  const { title, parent } = describe(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border-subtle bg-surface/85 px-5 backdrop-blur sm:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="-ml-1 rounded-lg p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <MenuIcon />
      </button>

      {/* Any page with a parent is a detail view, so it always gets a back button. */}
      {parent ? (
        <IconButton
          label={`Back to ${parent.label.toLowerCase()}`}
          onClick={() => router.push(parent.href)}
          className="shrink-0 border border-border-subtle"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </IconButton>
      ) : null}

      <div className="min-w-0">
        {parent ? (
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            <Link
              href={parent.href}
              className="transition-colors hover:text-primary"
            >
              {parent.label}
            </Link>
            <span className="px-1.5" aria-hidden>
              /
            </span>
            <span>{title}</span>
          </nav>
        ) : null}
        <h1 className="truncate text-base font-semibold tracking-tight">
          {title}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationsMenu />
        <span aria-hidden className="mx-1 h-6 w-px bg-border-subtle" />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-muted"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {initials(user.name || user.email)}
        </span>
        <span className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="block truncate text-sm font-medium text-foreground">
            {user.name}
          </span>
          <span className="block truncate text-[11px] text-muted">
            {user.role}
          </span>
        </span>
        <span className="hidden text-subtle sm:block">
          <ChevronDownIcon
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-lg"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-surface-muted"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** "Jane Doe" -> "JD". */
function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}
