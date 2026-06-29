"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Bot,
  Home,
  ListChecks,
  Settings,
  ShoppingBasket,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    mobileLabel: "Home",
    icon: Home
  },
  {
    href: "/weekly-planner",
    label: "My week",
    mobileLabel: "Week",
    icon: CalendarDays
  },
  {
    href: "/plan-with-ai",
    label: "Meal strategy",
    mobileLabel: "Strategy",
    icon: Bot
  },
  {
    href: "/recipes",
    label: "Recipe Library",
    mobileLabel: "Recipes",
    icon: ListChecks
  },
  {
    href: "/favorite-sources",
    label: "Favorite Sources",
    mobileLabel: "Sources",
    icon: Star
  },
  {
    href: "/grocery-lists",
    label: "Grocery Lists",
    mobileLabel: "Groceries",
    icon: ShoppingBasket
  },
  {
    href: "/household",
    label: "Household",
    mobileLabel: "Household",
    icon: Settings
  }
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground",
              active
                ? "bg-primary !text-white shadow-sm hover:bg-primary/90 hover:!text-white [&_*]:!text-white"
                : "text-muted-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary !text-white [&_*]:!text-white"
                : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            <span>{item.mobileLabel}</span>
          </Link>
        );
      })}
    </>
  );
}
