"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="relative flex flex-col gap-0.5 flex-1">
      {items.map((item) => {
        const Icon = item.icon;
        const activo = pathname === item.href || (item.href !== "/causas" && pathname?.startsWith(item.href + "/"));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
              activo
                ? "bg-hueso/10 text-hueso font-medium"
                : "text-hueso/60 hover:bg-hueso/[0.06] hover:text-hueso"
            }`}
          >
            <Icon
              size={15}
              className={`shrink-0 transition-colors ${activo ? "text-dorado-400" : "text-hueso/35 group-hover:text-dorado-400"}`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
