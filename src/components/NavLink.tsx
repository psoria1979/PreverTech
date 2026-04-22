"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function NavLink({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      )}
    >
      <span>{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="ml-2 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-semibold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
