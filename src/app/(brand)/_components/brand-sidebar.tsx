"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  StoreIcon,
  UsersIcon,
  ImageIcon,
  PaletteIcon,
  SettingsIcon,
  ArrowLeftIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const menuItems = [
  {
    label: "Dashboard",
    href: "/brand",
    icon: LayoutDashboardIcon,
  },
  {
    label: "Unidades",
    href: "/brand/dealerships",
    icon: StoreIcon,
  },
  {
    label: "Usuários",
    href: "/brand/users",
    icon: UsersIcon,
  },
  {
    label: "Biblioteca",
    href: "/brand/assets",
    icon: ImageIcon,
  },
  {
    label: "Brand Kit",
    href: "/brand/kit",
    icon: PaletteIcon,
  },
  {
    label: "Configurações",
    href: "/brand/settings",
    icon: SettingsIcon,
  },
];

export const BrandSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[200px] bg-slate-50 border-r border-slate-200 flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200">
        <Image
          src="/logo.svg"
          alt="Artbase"
          width={28}
          height={28}
        />
        <div className="flex flex-col">
          <span className="font-bold text-sm">Artbase</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">
            Marca
          </span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/brand" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Voltar */}
      <div className="px-3 py-4 border-t border-slate-200">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          Voltar ao app
        </Link>
      </div>
    </aside>
  );
};