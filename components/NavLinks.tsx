"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

// Cambiamos LucideIcon por React.ReactNode para que sea 100% serializable
export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
};

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="relative flex flex-col gap-1 flex-1">
      {items.map((item) => {
        const activo =
          pathname === item.href ||
          (item.href !== "/causas" && pathname?.startsWith(item.href + "/"));

        const subActiva = (item.children ?? []).some((child) =>
          pathname === child.href ||
          (child.href !== "/causas" && pathname?.startsWith(child.href + "/"))
        );

        return (
          <div key={item.href} className="flex flex-col">
            <Link
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                activo || subActiva
                  ? "judicial-nav-active text-white font-medium"
                  : "text-hueso/60 hover:bg-hueso/[0.06] hover:text-hueso"
              }`}
            >
              <span
                className={`shrink-0 transition-colors ${
                  activo || subActiva ? "text-white" : "text-hueso/35 group-hover:text-dorado-400"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>

            {(item.children ?? []).length > 0 && (
              <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-white/10 pl-3 pb-1">
                {item.children?.map((child) => {
                  const childActivo =
                    pathname === child.href ||
                    (child.href !== "/causas" && pathname?.startsWith(child.href + "/"));

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`rounded-md px-2.5 py-1.5 text-[12px] transition-colors ${
                        childActivo
                          ? "bg-amber-400/20 text-amber-200 font-medium"
                          : "text-hueso/65 hover:bg-hueso/[0.04] hover:text-hueso"
                      }`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}