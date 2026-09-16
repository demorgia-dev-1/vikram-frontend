"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import ThemeToggle from "@/components/ThemeToggle";
import {
  BellIcon,
  BoxIcon,
  InboxIcon,
  BuildingIcon,
  FlowIcon,
  GridIcon,
  UsersIcon,
} from "@/components/icons";

type NavItem = { label: string; href: string; icon: React.ReactNode };

const MY_WORK: NavItem = {
  label: "My work",
  href: "/dashboard/my-work",
  icon: <InboxIcon />,
};

const NOTIFICATIONS: NavItem = {
  label: "Notifications",
  href: "/dashboard/notifications",
  icon: <BellIcon />,
};

const OPERATIONS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <GridIcon /> },
  MY_WORK,
  NOTIFICATIONS,
  { label: "Products", href: "/dashboard/products", icon: <BoxIcon /> },
  { label: "Customers", href: "/dashboard/customers", icon: <BuildingIcon /> },
];

const PLATFORM: NavItem[] = [
  {
    label: "Workflow templates",
    href: "/dashboard/workflow-templates",
    icon: <FlowIcon />,
  },
  { label: "Users", href: "/dashboard/users", icon: <UsersIcon /> },
];

export default function Sidebar({
  mobileOpen,
  onNavigate,
}: {
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isAdmin = useAppSelector((state) => state.auth.user?.role) === "ADMIN";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold tracking-tight text-primary-foreground">
          VA
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-white">
            Vikram Aviation
          </p>
          <p className="text-[11px] text-sidebar-muted">Parts &amp; Service</p>
        </div>
      </div>

      {/* Everything but My work is admin-only, so a non-admin sees one item. */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <NavGroup
          label="Operations"
          items={isAdmin ? OPERATIONS : [MY_WORK, NOTIFICATIONS]}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        {isAdmin ? (
          <div className="mt-7">
            <NavGroup
              label="Platform"
              items={PLATFORM}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          </div>
        ) : null}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-active font-medium text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-active/60 hover:text-white"
                }`}
              >
                <span className={active ? "text-accent" : ""}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
