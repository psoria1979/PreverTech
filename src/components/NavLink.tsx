"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={clsx(
        "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      )}
    >
      {label}
    </Link>
  );
}
